/**
 * La escultura de «La gravedad invisible», sin dibujo: una tela de 33 × 23 partículas, una carga
 * de bronce (una cápsula de dos partículas) y seis cuerdas que bajan de anclajes fijos.
 *
 * Es una simulación determinista de paso fijo (XPBD en subpasos): la tela es casi inextensible,
 * la carga empuja la tela y roza con ella, y cada cuerda solo tira cuando está tensa. La tensión de
 * cada cuerda sale de la corrección que aplica, así que el reparto suma el peso real del conjunto.
 * Con amortiguación suficiente todo se asienta y se detiene: entonces no hay que dibujar nada.
 */

export type V3 = [number, number, number];

export const NX = 33;
export const NZ = 23;
export const PASO = 0.11;
export const ANCHO = (NX - 1) * PASO;
export const FONDO = (NZ - 1) * PASO;
export const SUELO = -2.9;
/** Altura de los anclajes: quedan siempre fuera del encuadre, en la oscuridad. */
export const ALTO = 3.6;
export const RADIO = 0.28;
export const SEMIEJE = 0.5;
/** Cuánto puede subir (+) o bajar (−) cada apoyo, en metros. */
export const RANGO: [number, number] = [-0.8, 1];
export const MAX_SUELTAS = 2;

/** Los seis apoyos, en celdas de la rejilla: esquinas y centro de los lados largos. */
export const APOYOS: [number, number][] = [[0, 0], [16, 0], [32, 0], [32, 22], [16, 22], [0, 22]];

const N = NX * NZ;
const SUB = 10;
const DT = 1 / 60 / SUB;
const DT2 = DT * DT;
const G = 9.8;
const W_TELA = 1 / 0.02;
const W_CARGA = 1 / 7;
const HOLGURA = 0.035;
const ROCE = 0.35;
const V_CUERDA = 0.7;
/** La carga no se aleja más de esto del centro de la tela: no puede caer al suelo. */
const ATADURA = 0.95;
const CENTRO = Math.floor(NZ / 2) * NX + Math.floor(NX / 2);
/** Distancia mínima entre dos partes de la tela que no son vecinas, y celdas de su rejilla. */
const GROSOR = 0.12;
const CELDAS = 4096;
/** Segundos que dura la vuelta al equilibrio inicial. */
const RECUERDO = 2.4;

export type Cuerda = {
  idx: number;
  ancla: V3;
  l0: number;
  l: number;
  meta: number;
  suelta: boolean;
  volviendo: boolean;
  /** Extremo libre cuando la cuerda está suelta. */
  e: V3;
  ev: V3;
  /** Tensión vertical suavizada, en newtons. */
  fuerza: number;
  acc: number;
};

const id = (i: number, j: number) => j * NX + i;
const reposo = (i: number, j: number): V3 => [(i - (NX - 1) / 2) * PASO, 0, (j - (NZ - 1) / 2) * PASO];

export class Escultura {
  /** Posiciones: la tela (N) y, al final, los dos extremos de la carga. */
  readonly p = new Float32Array((N + 2) * 3);
  readonly normal = new Float32Array(N * 3);
  readonly cavidad = new Float32Array(N);
  readonly cuerdas: Cuerda[];
  private q = new Float32Array((N + 2) * 3);
  private v = new Float32Array((N + 2) * 3);
  private w = new Float32Array(N + 2);
  private par: Int32Array;
  private largo: Float32Array;
  private blando: Float32Array;
  private eje = 2 * SEMIEJE;
  private freno = 1.5;
  private inicial: Float32Array | null = null;
  private recuerdo = 0;
  private cabeza = new Int32Array(CELDAS);
  private siguiente = new Int32Array(N);
  private foto: Float32Array | null = null;
  private cuenta = 0;
  /** Fotogramas seguidos en reposo (se cuenta por ventanas de 30). */
  quietud = 0;

  constructor() {
    const pares: number[] = [], largos: number[] = [], blandos: number[] = [];
    const unir = (a: number, b: number, alfa: number) => {
      pares.push(a, b);
      blandos.push(alfa / DT2);
      const [ax, , az] = reposo(a % NX, Math.floor(a / NX)), [bx, , bz] = reposo(b % NX, Math.floor(b / NX));
      largos.push(Math.hypot(ax - bx, az - bz));
    };
    for (let j = 0; j < NZ; j++)
      for (let i = 0; i < NX; i++) {
        if (i < NX - 1) unir(id(i, j), id(i + 1, j), 0);
        if (j < NZ - 1) unir(id(i, j), id(i, j + 1), 0);
        if (i < NX - 1 && j < NZ - 1) {
          unir(id(i, j), id(i + 1, j + 1), 4e-5);
          unir(id(i + 1, j), id(i, j + 1), 4e-5);
        }
        if (i < NX - 2) unir(id(i, j), id(i + 2, j), 6e-4);
        if (j < NZ - 2) unir(id(i, j), id(i, j + 2), 6e-4);
      }
    this.par = Int32Array.from(pares);
    this.largo = Float32Array.from(largos);
    this.blando = Float32Array.from(blandos);
    this.cuerdas = APOYOS.map(([i, j]) => {
      const r = reposo(i, j);
      // Los anclajes se abren hacia fuera: las cuerdas tensan la tela también en horizontal.
      // Las del centro de los lados son 30 cm más largas para que las esquinas también carguen.
      const medio = i === 16;
      const ancla: V3 = [r[0] * (medio ? 1 : 1.12), ALTO, r[2] * (medio ? 1.08 : 1.2)];
      const l0 = Math.hypot(ancla[0] - r[0], ancla[1] - r[1], ancla[2] - r[2]) + (medio ? 0.3 : 0);
      return { idx: id(i, j), ancla, l0, l: l0, meta: l0, suelta: false, volviendo: false, e: [...r], ev: [0, 0, 0], fuerza: 0, acc: 0 };
    });
    this.reiniciar();
  }

  /** La tela plana, la carga encima y todas las cuerdas atadas a su largo inicial. */
  reiniciar() {
    const { p, q, v, w } = this;
    for (let j = 0; j < NZ; j++)
      for (let i = 0; i < NX; i++) {
        const k = id(i, j) * 3, r = reposo(i, j);
        p[k] = q[k] = r[0];
        p[k + 1] = q[k + 1] = r[1];
        p[k + 2] = q[k + 2] = r[2];
        w[id(i, j)] = W_TELA;
      }
    // La carga, ligeramente en diagonal sobre el centro
    const ang = 0.38, cx = Math.cos(ang) * SEMIEJE, cz = Math.sin(ang) * SEMIEJE;
    const a = N * 3, b = a + 3;
    p[a] = q[a] = -cx; p[a + 1] = q[a + 1] = 0.45; p[a + 2] = q[a + 2] = -cz;
    p[b] = q[b] = cx; p[b + 1] = q[b + 1] = 0.45; p[b + 2] = q[b + 2] = cz;
    w[N] = w[N + 1] = W_CARGA;
    v.fill(0);
    for (const c of this.cuerdas) {
      c.l = c.meta = c.l0;
      c.suelta = c.volviendo = false;
      c.fuerza = c.acc = 0;
    }
    this.quietud = 0;
  }

  /** Lleva la escultura a su equilibrio sin dibujar: se usa al montar y con movimiento reducido. */
  asentar(fotogramas: number, freno = 7) {
    const f = this.freno;
    this.freno = freno;
    for (let k = 0; k < fotogramas; k++) this.avanzar();
    this.freno = f;
  }

  /** Guarda el estado actual como el equilibrio al que vuelve «Restaurar». */
  fijarInicial() {
    this.inicial = this.p.slice();
  }

  /**
   * Restaurar: las cuerdas sueltas vuelven a su anillo, todas recuperan su largo y, durante
   * unos segundos, cada punto se ve atraído hacia su posición inicial, cada vez con más fuerza.
   */
  restaurar() {
    this.cuerdas.forEach((c, k) => {
      c.meta = c.l0;
      this.atar(k);
    });
    this.recuerdo = this.inicial ? RECUERDO : 0;
    this.quietud = 0;
  }

  get restaurando() {
    return this.recuerdo > 0;
  }

  /**
   * Las cuerdas que se pueden soltar: como mucho dos a la vez y nunca dos vecinas. Con dos vecinas
   * sueltas, un lado entero de la tela cuelga casi vertical y la carga ya no encuentra reposo.
   */
  puedeSoltar(k: number) {
    const n = this.cuerdas.length, suelta = (j: number) => this.cuerdas[j].suelta && !this.cuerdas[j].volviendo;
    if (this.cuerdas[k].suelta) return false;
    if (suelta((k + 1) % n) || suelta((k + n - 1) % n)) return false;
    return this.cuerdas.filter((_, j) => suelta(j)).length < MAX_SUELTAS;
  }

  /** Fija la altura de un apoyo: positivo sube (acorta la cuerda). */
  altura(k: number, d: number) {
    const c = this.cuerdas[k];
    c.meta = c.l0 - Math.min(RANGO[1], Math.max(RANGO[0], d));
    this.quietud = 0;
  }

  soltar(k: number) {
    const c = this.cuerdas[k];
    if (c.suelta) return;
    const s = c.idx * 3;
    c.e = [this.p[s], this.p[s + 1], this.p[s + 2]];
    c.ev = [0, 0, 0];
    c.suelta = true;
    c.volviendo = false;
    this.quietud = 0;
  }

  /** La cuerda suelta vuelve a su anillo; al llegar se ata con el largo que tenga y luego se ajusta. */
  atar(k: number) {
    const c = this.cuerdas[k];
    if (c.suelta) c.volviendo = true;
    this.quietud = 0;
  }

  /** Avanza 1/60 s. Devuelve la mayor velocidad de la escena (m/s). */
  avanzar(): number {
    const { p, q, v, par, largo, blando } = this;
    const freno = Math.max(0, 1 - this.freno * DT);
    for (const c of this.cuerdas) c.acc = 0;

    for (let s = 0; s < SUB; s++) {
      // Integración
      for (let i = 0; i < N + 2; i++) {
        const k = i * 3;
        q[k] = p[k]; q[k + 1] = p[k + 1]; q[k + 2] = p[k + 2];
        v[k + 1] -= G * DT;
        p[k] += v[k] * DT; p[k + 1] += v[k + 1] * DT; p[k + 2] += v[k + 2] * DT;
      }

      // Tela: distancias (estiramiento, cizalla y flexión)
      for (let c = 0, n = largo.length; c < n; c++) {
        const a = par[2 * c] * 3, b = par[2 * c + 1] * 3;
        const dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 1e-9) continue;
        const C = d - largo[c];
        const dl = -C / (2 * W_TELA + blando[c]);
        const f = (W_TELA * dl) / d;
        p[a] -= dx * f; p[a + 1] -= dy * f; p[a + 2] -= dz * f;
        p[b] += dx * f; p[b + 1] += dy * f; p[b + 2] += dz * f;
      }

      this.carga();
      if (s % 5 === 4) this.autocolision();

      // Vuelta al equilibrio inicial
      if (this.recuerdo > 0 && this.inicial) {
        const x = 1 - this.recuerdo / RECUERDO, k = Math.min(1, x * x * (3 - 2 * x) * 5 * DT);
        const ini = this.inicial;
        for (let i = 0; i < (N + 2) * 3; i++) p[i] += (ini[i] - p[i]) * k;
      }

      // Cuerdas: unilaterales, solo tiran
      for (const c of this.cuerdas) {
        if (c.suelta) continue;
        const k = c.idx * 3;
        const dx = p[k] - c.ancla[0], dy = p[k + 1] - c.ancla[1], dz = p[k + 2] - c.ancla[2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const C = d - c.l;
        if (C <= 0) continue;
        const dl = -C / (W_TELA + 0.4);
        const f = (W_TELA * dl) / d;
        p[k] += dx * f; p[k + 1] += dy * f; p[k + 2] += dz * f;
        c.acc += -dl * (-dy / d);
      }

      // Suelo
      for (let i = 0; i < N + 2; i++) {
        const k = i * 3 + 1, m = i < N ? SUELO + 0.01 : SUELO + RADIO;
        if (p[k] < m) p[k] = m;
      }

      // Velocidades
      for (let i = 0; i < N + 2; i++) {
        const k = i * 3;
        let vx = (p[k] - q[k]) / DT, vy = (p[k + 1] - q[k + 1]) / DT, vz = (p[k + 2] - q[k + 2]) / DT;
        const r = Math.hypot(vx, vy, vz);
        const tope = r > 8 ? 8 / r : 1;
        vx *= freno * tope; vy *= freno * tope; vz *= freno * tope;
        v[k] = vx; v[k + 1] = vy; v[k + 2] = vz;
      }
    }

    // La vuelta al equilibrio empieza a contar cuando todas las cuerdas han vuelto a su anillo
    if (this.recuerdo > 0 && !this.cuerdas.some((c) => c.volviendo)) this.recuerdo = Math.max(0, this.recuerdo - 1 / 60);

    // Cuerdas: largo, extremos libres y tensión
    let activo = this.recuerdo > 0;
    for (const c of this.cuerdas) {
      const dl = c.meta - c.l;
      if (Math.abs(dl) > 1e-5) {
        c.l += Math.sign(dl) * Math.min(Math.abs(dl), V_CUERDA / 60);
        activo = true;
      }
      if (c.suelta) {
        this.extremo(c);
        if (c.volviendo || Math.hypot(...c.ev) > 0.02) activo = true;
      }
      const f = c.suelta ? 0 : c.acc / (SUB * DT2);
      c.fuerza += (f - c.fuerza) * 0.18;
    }

    let mov = 0;
    for (let i = 0; i < N + 2; i++) {
      const k = i * 3;
      mov = Math.max(mov, Math.abs(v[k]) + Math.abs(v[k + 1]) + Math.abs(v[k + 2]));
    }
    // Quietud: la velocidad instantánea oscila por el propio cálculo, así que se mide el
    // desplazamiento real cada medio segundo. Por debajo de 4 mm, la escultura está en reposo.
    if (activo || mov > 1) {
      this.quietud = 0;
      this.foto = null;
      this.cuenta = 0;
    } else if (++this.cuenta >= 30) {
      if (this.foto) {
        let d = 0;
        for (let i = 0; i < p.length; i++) d = Math.max(d, Math.abs(p[i] - this.foto[i]));
        this.quietud = d < 0.004 ? this.quietud + 30 : 0;
      }
      this.foto = p.slice();
      this.cuenta = 0;
    }
    return mov;
  }

  /**
   * La tela no se atraviesa a sí misma: dos puntos que no son vecinos en la rejilla no pueden
   * acercarse a menos de GROSOR. Se buscan con una rejilla espacial (hash), así el coste es lineal.
   */
  private autocolision() {
    const { p, cabeza, siguiente } = this;
    cabeza.fill(-1);
    const celda = (x: number, y: number, z: number) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) & (CELDAS - 1);
    for (let i = 0; i < N; i++) {
      const c = celda(Math.floor(p[i * 3] / GROSOR), Math.floor(p[i * 3 + 1] / GROSOR), Math.floor(p[i * 3 + 2] / GROSOR));
      siguiente[i] = cabeza[c];
      cabeza[c] = i;
    }
    for (let i = 0; i < N; i++) {
      const a = i * 3, ia = i % NX, ja = (i / NX) | 0;
      const cx = Math.floor(p[a] / GROSOR), cy = Math.floor(p[a + 1] / GROSOR), cz = Math.floor(p[a + 2] / GROSOR);
      for (let ox = -1; ox <= 1; ox++)
        for (let oy = -1; oy <= 1; oy++)
          for (let oz = -1; oz <= 1; oz++)
            for (let j = cabeza[celda(cx + ox, cy + oy, cz + oz)]; j >= 0; j = siguiente[j]) {
              if (j <= i) continue;
              // Los vecinos cercanos ya se mantienen a distancia por la propia tela
              if (Math.abs((j % NX) - ia) <= 2 && Math.abs(((j / NX) | 0) - ja) <= 2) continue;
              const b = j * 3;
              const dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2];
              const d2 = dx * dx + dy * dy + dz * dz;
              if (d2 >= GROSOR * GROSOR || d2 < 1e-12) continue;
              const d = Math.sqrt(d2), f = (0.5 * (GROSOR - d)) / d;
              p[a] -= dx * f; p[a + 1] -= dy * f; p[a + 2] -= dz * f;
              p[b] += dx * f; p[b + 1] += dy * f; p[b + 2] += dz * f;
            }
    }
  }

  /** Contacto de la tela con la cápsula de la carga, con roce, y la rigidez de la propia carga. */
  private carga() {
    const { p, q } = this;
    const a = N * 3, b = a + 3;
    // Rigidez: los dos extremos a distancia fija
    {
      const dx = p[b] - p[a], dy = p[b + 1] - p[a + 1], dz = p[b + 2] - p[a + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const f = (0.5 * (d - this.eje)) / d;
      p[a] += dx * f; p[a + 1] += dy * f; p[a + 2] += dz * f;
      p[b] -= dx * f; p[b + 1] -= dy * f; p[b + 2] -= dz * f;
    }
    // Atadura: si la carga se aleja demasiado del centro de la tela, vuelve hacia él
    {
      const m = CENTRO * 3;
      const dx = (p[a] + p[b]) / 2 - p[m], dy = (p[a + 1] + p[b + 1]) / 2 - p[m + 1], dz = (p[a + 2] + p[b + 2]) / 2 - p[m + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d > ATADURA) {
        const f = (ATADURA - d) / d;
        for (const k of [a, b]) {
          p[k] += dx * f; p[k + 1] += dy * f; p[k + 2] += dz * f;
        }
      }
    }
    const r = RADIO + HOLGURA, alcance = SEMIEJE + r + PASO;
    let ex = p[b] - p[a], ey = p[b + 1] - p[a + 1], ez = p[b + 2] - p[a + 2];
    const e2 = ex * ex + ey * ey + ez * ez;
    const mx = (p[a] + p[b]) / 2, my = (p[a + 1] + p[b + 1]) / 2, mz = (p[a + 2] + p[b + 2]) / 2;
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      if (Math.abs(p[k] - mx) > alcance || Math.abs(p[k + 2] - mz) > alcance || Math.abs(p[k + 1] - my) > alcance) continue;
      ex = p[b] - p[a]; ey = p[b + 1] - p[a + 1]; ez = p[b + 2] - p[a + 2];
      let t = ((p[k] - p[a]) * ex + (p[k + 1] - p[a + 1]) * ey + (p[k + 2] - p[a + 2]) * ez) / e2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = p[a] + ex * t, cy = p[a + 1] + ey * t, cz = p[a + 2] + ez * t;
      let nx = p[k] - cx, ny = p[k + 1] - cy, nz = p[k + 2] - cz;
      const d = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (d >= r || d < 1e-7) continue;
      let C: number;
      if (ny > 0) {
        // Por encima del eje: la tela se empuja hacia abajo, bajo la carga. Así la carga
        // siempre queda encima de la tela y nunca la atraviesa.
        const h2 = nx * nx + nz * nz;
        if (h2 >= r * r) continue;
        C = -(ny + Math.sqrt(r * r - h2));
        nx = 0; ny = -1; nz = 0;
      } else {
        nx /= d; ny /= d; nz /= d;
        C = d - r;
      }
      const wa = (1 - t) * (1 - t) * W_CARGA, wb = t * t * W_CARGA, W = W_TELA + wa + wb;
      const dl = -C / W;
      p[k] += W_TELA * dl * nx; p[k + 1] += W_TELA * dl * ny; p[k + 2] += W_TELA * dl * nz;
      const fa = (1 - t) * W_CARGA * dl, fb = t * W_CARGA * dl;
      p[a] -= fa * nx; p[a + 1] -= fa * ny; p[a + 2] -= fa * nz;
      p[b] -= fb * nx; p[b + 1] -= fb * ny; p[b + 2] -= fb * nz;
      // Roce: se frena el deslizamiento tangencial relativo
      let tx = p[k] - q[k] - ((p[a] - q[a]) * (1 - t) + (p[b] - q[b]) * t);
      let ty = p[k + 1] - q[k + 1] - ((p[a + 1] - q[a + 1]) * (1 - t) + (p[b + 1] - q[b + 1]) * t);
      let tz = p[k + 2] - q[k + 2] - ((p[a + 2] - q[a + 2]) * (1 - t) + (p[b + 2] - q[b + 2]) * t);
      const dn = tx * nx + ty * ny + tz * nz;
      tx -= dn * nx; ty -= dn * ny; tz -= dn * nz;
      const tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (tl < 1e-9) continue;
      const g = Math.min(1, (ROCE * -C) / tl) / W;
      p[k] -= W_TELA * g * tx; p[k + 1] -= W_TELA * g * ty; p[k + 2] -= W_TELA * g * tz;
      const ga = (1 - t) * W_CARGA * g, gb = t * W_CARGA * g;
      p[a] += ga * tx; p[a + 1] += ga * ty; p[a + 2] += ga * tz;
      p[b] += gb * tx; p[b + 1] += gb * ty; p[b + 2] += gb * tz;
    }
  }

  /** El extremo de una cuerda suelta cuelga del anclaje; si vuelve, se lleva a su anillo. */
  private extremo(c: Cuerda) {
    const s = c.idx * 3;
    const obj: V3 = [this.p[s], this.p[s + 1], this.p[s + 2]];
    if (c.volviendo) {
      const k = 1 - Math.exp(-6 / 60);
      for (let i = 0; i < 3; i++) c.e[i] += (obj[i] - c.e[i]) * k;
      c.ev = [0, 0, 0];
      const d = Math.hypot(obj[0] - c.e[0], obj[1] - c.e[1], obj[2] - c.e[2]);
      if (d < 0.03) {
        c.suelta = c.volviendo = false;
        c.l = Math.hypot(obj[0] - c.ancla[0], obj[1] - c.ancla[1], obj[2] - c.ancla[2]);
      }
      return;
    }
    const dt = 1 / 60;
    c.ev[1] -= G * dt;
    const fr = Math.max(0, 1 - 1.6 * dt);
    for (let i = 0; i < 3; i++) {
      c.ev[i] *= fr;
      c.e[i] += c.ev[i] * dt;
    }
    const dx = c.e[0] - c.ancla[0], dy = c.e[1] - c.ancla[1], dz = c.e[2] - c.ancla[2];
    const d = Math.hypot(dx, dy, dz);
    if (d > c.l) {
      const f = c.l / d;
      const nx = c.ancla[0] + dx * f, ny = c.ancla[1] + dy * f, nz = c.ancla[2] + dz * f;
      c.ev = [c.ev[0] + (nx - c.e[0]) * 60, c.ev[1] + (ny - c.e[1]) * 60, c.ev[2] + (nz - c.e[2]) * 60];
      c.e = [nx, ny, nz];
    }
  }

  /** Normales y cavidad (para la oclusión de los pliegues) de cada partícula de la tela. */
  derivar() {
    const { p, normal, cavidad } = this;
    for (let j = 0; j < NZ; j++)
      for (let i = 0; i < NX; i++) {
        const k = id(i, j) * 3;
        const r = id(Math.min(NX - 1, i + 1), j) * 3, l = id(Math.max(0, i - 1), j) * 3;
        const u = id(i, Math.min(NZ - 1, j + 1)) * 3, d = id(i, Math.max(0, j - 1)) * 3;
        const ax = p[r] - p[l], ay = p[r + 1] - p[l + 1], az = p[r + 2] - p[l + 2];
        const bx = p[u] - p[d], by = p[u + 1] - p[d + 1], bz = p[u + 2] - p[d + 2];
        let nx = by * az - bz * ay, ny = bz * ax - bx * az, nz = bx * ay - by * ax;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        normal[k] = nx; normal[k + 1] = ny; normal[k + 2] = nz;
        const mx = (p[r] + p[l] + p[u] + p[d]) / 4 - p[k];
        const my = (p[r + 1] + p[l + 1] + p[u + 1] + p[d + 1]) / 4 - p[k + 1];
        const mz = (p[r + 2] + p[l + 2] + p[u + 2] + p[d + 2]) / 4 - p[k + 2];
        cavidad[id(i, j)] = Math.abs(mx * nx + my * ny + mz * nz) / PASO;
      }
  }

  /** Centro y eje de la carga. */
  carga3(): { centro: V3; eje: V3 } {
    const { p } = this, a = N * 3, b = a + 3;
    return {
      centro: [(p[a] + p[b]) / 2, (p[a + 1] + p[b + 1]) / 2, (p[a + 2] + p[b + 2]) / 2],
      eje: [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]],
    };
  }

  /**
   * Dónde está la carga sobre la tela (no en la sala): la posición de reposo, en metros, de los
   * puntos de tela más cercanos a su centro, ponderados por la distancia.
   */
  lugarCarga(): [number, number] {
    const { centro } = this.carga3(), p = this.p;
    let sx = 0, sz = 0, sw = 0;
    for (let k = 0; k < N; k++) {
      const d2 = (p[k * 3] - centro[0]) ** 2 + (p[k * 3 + 1] - centro[1]) ** 2 + (p[k * 3 + 2] - centro[2]) ** 2;
      if (d2 > (RADIO + 0.2) ** 2) continue;
      const w = 1 / (d2 + 1e-4);
      const r = reposo(k % NX, Math.floor(k / NX));
      sx += r[0] * w;
      sz += r[2] * w;
      sw += w;
    }
    return sw ? [sx / sw, sz / sw] : [0, 0];
  }

  /** Centro de la caja que envuelve la tela: la cámara lo sigue para no perder la escultura. */
  centro(): V3 {
    const p = this.p, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let k = 0; k < N; k++)
      for (let i = 0; i < 3; i++) {
        const v = p[k * 3 + i];
        if (v < lo[i]) lo[i] = v;
        if (v > hi[i]) hi[i] = v;
      }
    return [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  }

  punto(idx: number): V3 {
    const k = idx * 3;
    return [this.p[k], this.p[k + 1], this.p[k + 2]];
  }

  /** Reparto del peso entre las cuerdas, en fracciones que suman 1. */
  reparto(): number[] {
    const f = this.cuerdas.map((c) => Math.max(0, c.fuerza));
    const t = f.reduce((a, b) => a + b, 0) || 1;
    return f.map((x) => x / t);
  }

  /** Peso total que sostienen las cuerdas, en newtons (para comprobar el equilibrio). */
  sostenido() {
    return this.cuerdas.reduce((a, c) => a + Math.max(0, c.fuerza), 0);
  }

  pesoTotal() {
    return (N / W_TELA + 2 / W_CARGA) * G;
  }
}
