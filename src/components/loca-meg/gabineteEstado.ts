/**
 * «El gabinete de lo imposible»: relaciones matemáticas deterministas entre tres objetos.
 * Sin simulación física: cada pose es una función pura de tres números.
 *   h  altura del hierro, 0..1 (0,5 = reposo)
 *   t  inclinación del recipiente, -1..1 (0 = recto)
 *   g  giro del ensamblaje, -1..1
 */
export type Estado = { h: number; t: number; g: number };
export const REPOSO: Estado = { h: 0.5, t: 0, g: 0 };

export type V3 = [number, number, number];
/** Matriz 3×3 en orden de columnas, como la espera WebGL. */
export type M3 = number[];

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// ── Escena (unidades arbitrarias; la mesa está en y = -1,5) ──
export const X_HIERRO = -2.1;
export const X_RECIPIENTE = 0;
export const X_ENSAMBLE = 2.1;
export const Y_ENSAMBLE = 0.95;
export const RUEDA_Y = 2.95;
export const MESA_Y = -1.5;
/** El hierro y el recipiente cuelgan de la misma cuerda sobre la viga: lo que sube uno lo baja el otro. */
export const yHierro = (h: number) => 0.35 + 1.3 * h;
export const yRecipiente = (h: number) => 1.7 - yHierro(h);
export const ALTO_RECIPIENTE = 1.0;
export const ALTO_HIERRO = 0.42;
/** Inclinación máxima del recipiente, en radianes. */
export const INCLINACION = 0.7;
export const GIRO = 1.25;

const ident = (): M3 => [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mul = (a: M3, b: M3): M3 => {
  const r = new Array(9).fill(0);
  for (let c = 0; c < 3; c++) for (let f = 0; f < 3; f++) for (let k = 0; k < 3; k++) r[c * 3 + f] += a[k * 3 + f] * b[c * 3 + k];
  return r;
};
export const trasp = (m: M3): M3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
const rotY = (a: number): M3 => [Math.cos(a), 0, -Math.sin(a), 0, 1, 0, Math.sin(a), 0, Math.cos(a)];
const rotZ = (a: number): M3 => [Math.cos(a), Math.sin(a), 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 1];
/** Rodrigues: giro `a` alrededor de un eje unitario. */
function rotEje(ax: V3, a: number): M3 {
  const [x, y, z] = ax, c = Math.cos(a), s = Math.sin(a), k = 1 - c;
  return [c + x * x * k, y * x * k + z * s, z * x * k - y * s, x * y * k - z * s, c + y * y * k, z * y * k + x * s, x * z * k + y * s, y * z * k - x * s, c + z * z * k];
}
const mulV = (m: M3, v: V3): V3 => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];

// ── Objeto III: siete piezas abstractas (armilar en reposo, abierto al cambiar I y II) ──
const norm = (v: V3): V3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};
export const N_PIEZAS = 7;
/** anillo, esfera (el núcleo, de donde cuelga), cubo, cono, disco, barra, octaedro */
const BASE: V3[] = [[0, 0, 0], [0, 0, 0], [0, 0.56, 0], [0, -0.56, 0], [0.56, 0, 0], [-0.56, 0, 0], [0, 0, 0.56]];
const REPOSO_ROT: M3[] = [ident(), ident(), ident(), ident(), rotZ(Math.PI / 2), ident(), ident()];
/** Desplazamiento al inclinar el recipiente (con signo: al invertir el giro, se invierte el desorden) */
const DT: V3[] = [[0, 0, 0], [0, 0, 0], [0.38, 0.2, 0.15], [-0.32, -0.26, 0.2], [0.32, -0.32, -0.26], [-0.38, 0.3, 0.1], [0.12, 0.22, -0.42]];
/** Desplazamiento al subir o bajar el hierro */
const DH: V3[] = [[0, 0, 0], [0, 0, 0], [-0.26, -0.2, 0.32], [0.3, 0.16, -0.32], [-0.22, 0.36, 0.22], [0.32, -0.22, -0.3], [-0.3, 0.3, 0.26]];
const EJE: V3[] = [norm([1, 0.2, 0.3]), [0, 1, 0], norm([0.4, 1, 0.5]), norm([1, 0, 0.6]), norm([0.2, 1, -0.4]), norm([0.3, 0.5, 1]), norm([1, 1, 0.2])];
const ET = [0.9, 0, 1.5, -1.4, 1.2, -1.6, 1.3];
const EH = [-0.7, 0, -1.2, 1.5, -1.4, 1.1, -1.5];

export type Pieza = { pos: V3; inv: M3 };
export type Geometria = {
  yH: number; yR: number;
  hierro: { pos: V3; inv: M3 };
  recipiente: { pos: V3; inv: M3; arriba: V3; phi: number };
  orbes: [number, number, number, number][];
  mezcla: number;
  ensamble: { centro: V3; piezas: Pieza[] };
  /** Cuánto se ha desordenado el ensamblaje, 0..1 */
  desorden: number;
};

const N_ORBES = 5;
export function geometria(e: Estado): Geometria {
  const yH = yHierro(e.h), yR = yRecipiente(e.h);
  const u = (e.h - 0.5) * 2;
  const phi = e.t * INCLINACION;
  // El hierro se ladea un poco al inclinarse el recipiente
  const rotH = mul(rotZ(phi * 0.3), rotY(0.35 + phi * 0.2));
  const hierro = { pos: [X_HIERRO, yH, 0] as V3, inv: trasp(rotH) };

  const rotR = rotZ(-phi);
  const arriba: V3 = [Math.sin(phi), Math.cos(phi), 0];
  const centroR: V3 = [X_RECIPIENTE, yR, 0];
  const recipiente = { pos: centroR, inv: trasp(rotR), arriba, phi };

  // Las formas suspendidas fluyen hacia el lado de la inclinación, contra la gravedad
  const orbes: Geometria["orbes"] = [];
  for (let i = 0; i < N_ORBES; i++) {
    const s = (i + 0.5) / N_ORBES;
    const a = i * 2.4 + e.t * 2.2;
    const r = 0.17 * (1 - 0.5 * s);
    orbes.push([
      centroR[0] + arriba[0] * 0.34 + e.t * s * 1.7 + r * Math.cos(a),
      centroR[1] + arriba[1] * 0.34 + 0.1 + s * 0.85 + 0.55 * Math.abs(e.t) * s * (1 - s),
      centroR[2] + r * Math.sin(a),
      0.078 * (1.15 - 0.55 * s),
    ]);
  }

  const centro: V3 = [X_ENSAMBLE, Y_ENSAMBLE, 0];
  const giro = rotY(e.g * GIRO);
  const piezas: Pieza[] = [];
  for (let i = 0; i < N_PIEZAS; i++) {
    const local: V3 = [
      BASE[i][0] + DT[i][0] * e.t + DH[i][0] * u,
      BASE[i][1] + DT[i][1] * e.t + DH[i][1] * u,
      BASE[i][2] + DT[i][2] * e.t + DH[i][2] * u,
    ];
    const p = mulV(giro, local);
    const R = mul(giro, mul(rotEje(EJE[i], ET[i] * e.t + EH[i] * u), REPOSO_ROT[i]));
    piezas.push({ pos: [centro[0] + p[0], centro[1] + p[1], centro[2] + p[2]], inv: trasp(R) });
  }
  return { yH, yR, hierro, recipiente, orbes, mezcla: clamp(Math.abs(e.t) * 1.3, 0, 1), ensamble: { centro, piezas }, desorden: clamp(Math.abs(e.t) * 0.8 + Math.abs(u) * 0.65, 0, 1) };
}

// ── Cámara fija: se usa igual en el sombreador y para colocar los mandos sobre los objetos ──
export type Camara = { ro: V3; f: V3; r: V3; u: V3; tanY: number; asp: number };
const OBJETIVO: V3 = [0, 0.7, 0];
const DIST = 10;
export function camara(asp: number): Camara {
  const ro: V3 = [0.7, 1.7, DIST];
  const f = norm([OBJETIVO[0] - ro[0], OBJETIVO[1] - ro[1], OBJETIVO[2] - ro[2]]);
  const r = norm([-f[2], 0, f[0]]);
  const u: V3 = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  // Cabe a lo ancho (± 3,9) y a lo alto (de la mesa a la viga)
  const mitad = clamp(2.3 + 0.8 * asp, 2.9, 3.9);
  const tanY = Math.max(0.28, mitad / (DIST * asp));
  return { ro, f, r, u, tanY, asp };
}
/** Punto del mundo → coordenadas de pantalla en 0..1 (y hacia abajo). */
export function proyectar(c: Camara, p: V3): [number, number] {
  const v: V3 = [p[0] - c.ro[0], p[1] - c.ro[1], p[2] - c.ro[2]];
  const z = v[0] * c.f[0] + v[1] * c.f[1] + v[2] * c.f[2];
  const x = (v[0] * c.r[0] + v[1] * c.r[1] + v[2] * c.r[2]) / (z * c.tanY * c.asp);
  const y = (v[0] * c.u[0] + v[1] * c.u[1] + v[2] * c.u[2]) / (z * c.tanY);
  return [0.5 + x / 2, 0.5 - y / 2];
}
/** Unidades del mundo por píxel de pantalla, a la profundidad de los objetos. */
export const mundoPorPixel = (c: Camara, altoPx: number) => (2 * c.tanY * DIST) / altoPx;
