/**
 * V5 · mundo geométrico en perspectiva (Canvas 2D, sin dependencias).
 *
 * Una cámara virtual con perspectiva proyecta anillos, ejes, planos suspendidos, haces de luz y polvo situados a distintas
 * profundidades. Todo es función pura del progreso (pintarActo(a, b, …)): sin bucle ni estado propio.
 *
 * Continuidad con la pintura: al terminar el prólogo las puntas del compás están en pantalla en (c0x, c0y) y (c0x + R·cosθ, …).
 * El mundo se construye en unidades de R (la distancia entre las puntas) con el origen en la punta izquierda y el eje x a lo
 * largo del compás, de modo que con cámara en reposo (yaw = pitch = 0, dist = f) la proyección coincide píxel a píxel con la pintura.
 *
 * Acto I (a: 0–1): nace el observatorio. Acto II (b: 0–1, con a = 1): el observatorio gira, la cámara lo recorre por dentro,
 * aparecen los anillos colosales y un núcleo, y el visitante puede abrir la arquitectura (abre: 0–1).
 */
import { PUNTOS } from "@/content/anciano";
import { CENTRO, FOCO_URIZEN, aMundo, clamp, mezcla, suave } from "../limiteGeom";

export const PUNTA_DER = aMundo(PUNTOS.puntaDer);
export { CENTRO, FOCO_URIZEN };

const TAU = Math.PI * 2;
/** 0 oro · 1 carmesí · 2 luz */
const COL = ["199,141,67", "141,56,39", "232,204,152"];
const FONDO = "9,10,13";

function rng(semilla: number) {
  let s = semilla | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Texturas de luz precalculadas (una sola vez): halo, rayos radiales y bruma ── */
type Sprites = { halo: HTMLCanvasElement; rayos: HTMLCanvasElement; rayos2: HTMLCanvasElement | null; nube: HTMLCanvasElement | null };

function lienzoAux(n: number): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d");
  return g ? [c, g] : null;
}

function crearHalo(): HTMLCanvasElement | null {
  const a = lienzoAux(128);
  if (!a) return null;
  const [c, g] = a;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,244,214,1)");
  gr.addColorStop(0.16, "rgba(232,204,152,0.72)");
  gr.addColorStop(0.5, "rgba(199,141,67,0.22)");
  gr.addColorStop(1, "rgba(199,141,67,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
}

/** Rayos dorados que salen de un centro, como la energía radial de la pintura: cuñas anchas con caída y espinas finas. */
function crearRayos(carmesi = false): HTMLCanvasElement | null {
  const n = 256;
  const a = lienzoAux(n);
  if (!a) return null;
  const [c, g] = a;
  const r = rng(77);
  g.translate(n / 2, n / 2);
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * TAU + (r() - 0.5) * 0.12;
    const ancho = 0.025 + r() * 0.06;
    const largo = (0.5 + r() * 0.5) * (n / 2);
    const gr = g.createRadialGradient(0, 0, n * 0.02, 0, 0, largo);
    gr.addColorStop(0, carmesi ? "rgba(214,112,82,0.8)" : "rgba(246,206,138,0.85)");
    gr.addColorStop(0.4, carmesi ? "rgba(168,76,52,0.3)" : "rgba(222,160,84,0.3)");
    gr.addColorStop(1, carmesi ? "rgba(141,56,39,0)" : "rgba(199,141,67,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(ang - ancho) * largo, Math.sin(ang - ancho) * largo);
    g.lineTo(Math.cos(ang + ancho) * largo, Math.sin(ang + ancho) * largo);
    g.closePath();
    g.fill();
  }
  g.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const ang = r() * TAU, largo = (0.35 + r() * 0.65) * (n / 2);
    const gr = g.createLinearGradient(0, 0, Math.cos(ang) * largo, Math.sin(ang) * largo);
    gr.addColorStop(0, carmesi ? "rgba(224,132,98,0.45)" : "rgba(255,226,170,0.5)");
    gr.addColorStop(1, carmesi ? "rgba(141,56,39,0)" : "rgba(199,141,67,0)");
    g.strokeStyle = gr;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(ang) * largo, Math.sin(ang) * largo);
    g.stroke();
  }
  return c;
}

function ruidoV(x: number, y: number, s: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h = (a: number, b: number) => {
    let q = Math.imul(a + s * 131, 374761393) + Math.imul(b, 668265263);
    q = Math.imul(q ^ (q >>> 13), 1274126177);
    return ((q ^ (q >>> 16)) >>> 0) / 4294967295;
  };
  return mezcla(mezcla(h(ix, iy), h(ix + 1, iy), u), mezcla(h(ix, iy + 1), h(ix + 1, iy + 1), u), v);
}

/**
 * Velo de nubes turbulentas cálidas (ámbar → carmesí), con los bordes desvanecidos para que no se vea el recorte.
 * Se calcula por tandas de filas para no bloquear el hilo principal (una tarea larga arruinaría el scroll).
 */
function crearNubeAsync(n: number, fin: (c: HTMLCanvasElement) => void) {
  const a = lienzoAux(n);
  if (!a) return;
  const [c, g] = a;
  const img = g.createImageData(n, n);
  let y = 0;
  const tanda = () => {
    const hasta = Math.min(n, y + 12);
    for (; y < hasta; y++) {
      for (let x = 0; x < n; x++) {
        const nx = (x / n) * 5, ny = (y / n) * 5;
        const wx = ruidoV(nx + 4, ny, 5) * 1.2, wy = ruidoV(nx, ny + 9, 6) * 1.2;
        const f = 0.55 * ruidoV(nx + wx, ny + wy, 1) + 0.3 * ruidoV(nx * 2 + wx, ny * 2 + wy, 2) + 0.15 * ruidoV(nx * 4, ny * 4, 3);
        const d = Math.hypot(x / n - 0.5, y / n - 0.5) * 2;
        const caida = Math.pow(clamp(1 - d), 1.4);
        const al = Math.pow(clamp((f - 0.4) * 2.4), 1.6) * caida;
        const w = ruidoV(nx * 1.3, ny * 1.3, 9);
        const i = (y * n + x) * 4;
        img.data[i] = mezcla(199, 141, w);
        img.data[i + 1] = mezcla(141, 56, w);
        img.data[i + 2] = mezcla(67, 39, w);
        img.data[i + 3] = al * 230;
      }
    }
    if (y < n) setTimeout(tanda, 0);
    else { g.putImageData(img, 0, 0); fin(c); }
  };
  tanda();
}

export type Mundo = {
  /** Acto I: x, y, z (en R), nacimiento (0–1 del acto), tamaño */
  polvo: Float32Array;
  /** Acto II: polvo más profundo, nacimiento en 0–1 del acto II */
  polvo2: Float32Array;
  /** Direcciones de los rayos del núcleo (x, y, z unitarios) */
  rayos: Float32Array;
  /** Partículas de energía del núcleo: dirección unitaria (x, y, z), fracción de radio y tamaño */
  motas: Float32Array;
  /** Texturas de luz precalculadas (null si no hay DOM) */
  sprites: Sprites | null;
  denso: boolean;
};

export function crearMundo(denso: boolean): Mundo {
  const r = rng(1794);
  const n = denso ? 150 : 70;
  const polvo = new Float32Array(n * 5);
  for (let i = 0; i < n; i++) {
    polvo[i * 5] = (r() - 0.5) * 6.4;
    polvo[i * 5 + 1] = (r() - 0.5) * 5;
    polvo[i * 5 + 2] = -1 + r() * 4.4;
    polvo[i * 5 + 3] = 0.25 + r() * 0.6;
    polvo[i * 5 + 4] = 0.8 + r() * 1.6;
  }
  const r2 = rng(2026);
  const n2 = denso ? 110 : 44;
  const polvo2 = new Float32Array(n2 * 5);
  for (let i = 0; i < n2; i++) {
    polvo2[i * 5] = (r2() - 0.5) * 12;
    polvo2[i * 5 + 1] = (r2() - 0.5) * 9;
    polvo2[i * 5 + 2] = -1.5 + r2() * 9;
    polvo2[i * 5 + 3] = 0.05 + r2() * 0.6;
    polvo2[i * 5 + 4] = 0.8 + r2() * 1.8;
  }
  const nr = denso ? 14 : 8;
  const rayos = new Float32Array(nr * 3);
  for (let i = 0; i < nr; i++) {
    const t = r2() * TAU, u = r2() * 2 - 1, s = Math.sqrt(1 - u * u);
    rayos[i * 3] = s * Math.cos(t); rayos[i * 3 + 1] = s * Math.sin(t); rayos[i * 3 + 2] = u;
  }
  const nm = denso ? 36 : 16;
  const motas = new Float32Array(nm * 5);
  for (let i = 0; i < nm; i++) {
    const t = r2() * TAU, u = r2() * 2 - 1, q = Math.sqrt(1 - u * u);
    motas[i * 5] = q * Math.cos(t); motas[i * 5 + 1] = q * Math.sin(t); motas[i * 5 + 2] = u;
    motas[i * 5 + 3] = r2(); motas[i * 5 + 4] = r2();
  }
  const halo = crearHalo(), rayosT = crearRayos();
  const sprites: Sprites | null = halo && rayosT ? { halo, rayos: rayosT, rayos2: crearRayos(true), nube: null } : null;
  // La bruma (la textura más cara) se genera cuando el navegador está libre, no en la carga
  if (sprites && typeof window !== "undefined") {
    const hacer = () => { if (denso) crearNubeAsync(256, (c) => { sprites.nube = c; }); };
    if ("requestIdleCallback" in window) window.requestIdleCallback(hacer, { timeout: 2500 }); else setTimeout(hacer, 800);
  }
  return { polvo, polvo2, rayos, motas, sprites, denso };
}

/* ── Prólogo: velo y luz en las puntas del compás ── */
export type Prologo = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Centro de la ventana de la pintura, en píxeles del lienzo */
  cx: number;
  cy: number;
  camX: number;
  camY: number;
  k: number;
  ancho: number;
  v: number;
  tg: number;
  rr: number;
};

export function luzPunta(ctx: CanvasRenderingContext2D, x: number, y: number, rr: number, alfa: number) {
  if (alfa < 0.003) return;
  const gr = ctx.createRadialGradient(x, y, 0, x, y, rr);
  gr.addColorStop(0, `rgba(${COL[2]},${0.9 * alfa})`);
  gr.addColorStop(0.4, `rgba(${COL[0]},${0.35 * alfa})`);
  gr.addColorStop(1, `rgba(${COL[0]},0)`);
  ctx.fillStyle = gr;
  ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
}

export function pintarPrologo(f: Prologo) {
  const { ctx, w, h, cx, cy, camX, camY, k, ancho, v, tg, rr } = f;
  ctx.clearRect(0, 0, w, h);
  const esc = k * ancho;
  const sx = (x: number) => cx + (x - camX) * esc;
  const sy = (y: number) => cy + (y - camY) * esc;
  if (v > 0.003) {
    const ux = sx(FOCO_URIZEN.x), uy = sy(FOCO_URIZEN.y);
    const gr = ctx.createRadialGradient(ux, uy, esc * 0.03, ux, uy, esc * 0.7);
    gr.addColorStop(0, `rgba(${FONDO},0)`);
    gr.addColorStop(0.35, `rgba(${FONDO},${v * 0.6})`);
    gr.addColorStop(1, `rgba(${FONDO},${v})`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }
  if (tg > 0.003) {
    luzPunta(ctx, sx(CENTRO.x), sy(CENTRO.y), rr, tg);
    luzPunta(ctx, sx(PUNTA_DER.x), sy(PUNTA_DER.y), rr, tg);
  }
}

/* ── Actos I y II: perspectiva ── */
export type Acto = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Centro de proyección en píxeles del lienzo */
  cx: number;
  cy: number;
  /** Punta izquierda del compás respecto al centro de proyección, y distancia entre puntas */
  c0x: number;
  c0y: number;
  R: number;
  th0: number;
  /** Distancia focal = distancia inicial de la cámara */
  f: number;
  /** Radio del destello de las puntas */
  rr: number;
  /** Progreso del Acto I, 0–1 (1 durante todo el Acto II) */
  a: number;
  /** Progreso del Acto II, 0–1 (0 durante el Acto I) */
  b: number;
  /** Inclinación de los anillos (0–1), giro de la vista (−1–1), cabeceo (−1–1) y apertura de la arquitectura (0–1) */
  tilt: number;
  giro: number;
  cabeceo: number;
  abre: number;
  /** Reacción luminosa a la apertura (0–1): sube mientras el visitante mueve el control y decae al soltarlo */
  rx: number;
  /** Progreso del Acto III, 0–1 (0 antes de él) y posición del plano del portal (0–1) */
  c: number;
  plano: number;
  /** Progreso del epílogo, 0–1 (0 antes de él; durante él, `c` vale 1) y reloj ambiental en segundos (solo avanza en el reposo final) */
  d: number;
  t: number;
};

type Cam = { tx: number; ty: number; tz: number; cy: number; sy: number; cp: number; sp: number; dist: number; ct: number; st: number; ex: number; fz: number };
const P = new Float64Array(4);
/** Foco de luz del Acto II: posición del núcleo en pantalla, su escala y su intensidad (lo leen anillos y planos) */
const FOCO = { x: 0, y: 0, s: 0, ci: 0, ok: false };
/**
 * Composición final del epílogo. Todo se aplica solo con e.d > 0 y a partir del estado exacto del Acto III (d = 0):
 * la arquitectura se abre (profundidad y planos se separan, como con «Abrir la arquitectura»), la cámara termina más girada
 * para repartir las capas en diagonal, y lo secundario cede brillo para que mande la jerarquía (disco → arquitectura → portal).
 */
const EPI = {
  abre: 0.62,
  yaw: 0.5, pitch: 0.2,
  mira: [0.45, -1.3, 1.6],
  atenua: 0.05,
};

function proyectar(e: Acto, c: Cam, lx: number, ly: number, lz: number) {
  const X = e.c0x + e.R * (lx * c.ct - ly * c.st), Y = e.c0y + e.R * (lx * c.st + ly * c.ct), Z = e.R * lz * c.ex;
  const px = X - c.tx, py = Y - c.ty, pz = Z - c.tz;
  const x1 = px * c.cy + pz * c.sy;
  const z1 = -px * c.sy + pz * c.cy;
  const y2 = py * c.cp - z1 * c.sp;
  const z2 = py * c.sp + z1 * c.cp;
  const zc = z2 + c.dist;
  const s = zc > e.f * 0.14 ? e.f / zc : 0;
  P[0] = e.cx + x1 * s;
  P[1] = e.cy + y2 * s;
  P[2] = s;
  P[3] = zc;
}

/** Atenuación por profundidad. En el Acto II añade una «profundidad de campo luminosa»: lo que está en el plano de atención brilla más. */
const niebla = (zc: number, c: Cam, R: number) => {
  const base = clamp(1.2 - (zc - c.dist) / (R * 5.2));
  if (!c.fz) return base * GAN;
  const d = (zc - c.dist) / (R * 2.4);
  return base * (1 - c.fz * (1 - Math.exp(-d * d))) * GAN;
};
/** Ganancia de brillo del epílogo: al alejarse la cámara las líneas se adelgazan y necesitan algo más de luz (1 fuera del epílogo). */
let GAN = 1;

/** Punto de un anillo de radio r, girado rx (sobre x) y ry (sobre y), precesión rz, con centro (ox, oy, cz). */
function anillo(t: number, r: number, rx: number, ry: number, ox: number, oy: number, cz: number, out: number[], rz = 0) {
  const x = r * Math.cos(t), y = r * Math.sin(t);
  const y1 = y * Math.cos(rx), z1 = y * Math.sin(rx);
  let xx = x * Math.cos(ry) + z1 * Math.sin(ry);
  let yy = y1;
  const zz = -x * Math.sin(ry) + z1 * Math.cos(ry);
  if (rz) { const c = Math.cos(rz), s = Math.sin(rz); const nx = xx * c - yy * s; yy = xx * s + yy * c; xx = nx; }
  out[0] = xx + ox;
  out[1] = yy + oy;
  out[2] = zz + cz;
}

const L = [0, 0, 0];

/** Polígono regular de radio r con n lados, girado rot, a profundidad cz (coordenadas locales, plano z = cz). */
function poligono(r: number, lados: number, rot: number, cz: number): number[] {
  const o: number[] = [];
  for (let i = 0; i <= lados; i++) {
    const t = rot + (i / lados) * TAU;
    o.push(r * Math.cos(t), r * Math.sin(t), cz);
  }
  return o;
}
const TRIANGULO = poligono(1, 3, 0, 0);
const HEXAGONO = poligono(0.7, 6, 0.3, 1.1);
const CUADRADO = poligono(0.78, 4, Math.PI / 4, 1.65);
const OCTOGONO = poligono(1.32, 8, 0.2, -0.45);

function dibujarPoli(ctx: CanvasRenderingContext2D, e: Acto, cam: Cam, pts: number[], t0: number, t1: number, w: number, a: number, c: 0 | 1 | 2) {
  const fr = suave((e.a - t0) / (t1 - t0));
  if (fr <= 0) return;
  const n = pts.length / 3 - 1;
  const lim = fr * n;
  let zs = 0, c0 = 0;
  ctx.beginPath();
  for (let i = 0; i <= Math.ceil(lim); i++) {
    const j = Math.floor(Math.min(i, lim)), t = Math.min(i, lim) - j;
    const j2 = Math.min(n, j + 1);
    proyectar(e, cam, mezcla(pts[j * 3], pts[j2 * 3], t), mezcla(pts[j * 3 + 1], pts[j2 * 3 + 1], t), mezcla(pts[j * 3 + 2], pts[j2 * 3 + 2], t));
    if (!P[2]) continue;
    if (i === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
    zs += P[3]; c0++;
  }
  if (!c0) return;
  ctx.strokeStyle = `rgba(${COL[c]},${a * niebla(zs / c0, cam, e.R) * Math.min(1, fr * 2)})`;
  ctx.lineWidth = w;
  ctx.stroke();
}

type Anillo = {
  r: number; rx: number; ry: number; ox?: number; oy?: number; cz: number;
  t0: number; t1: number; w: number; a: number; c: 0 | 1 | 2; marcas?: number;
  /** Precesión alrededor del eje z (Acto II) */
  rz?: number;
  /** Arco: ángulo inicial y fracción de vuelta */
  ini?: number; span?: number;
  /** El nacimiento se mide con el progreso del Acto II en lugar del Acto I */
  bn?: boolean;
  /** … o con el del Acto III */
  cn?: boolean;
};

function dibujarAnillo(ctx: CanvasRenderingContext2D, e: Acto, cam: Cam, an: Anillo, n: number) {
  const prog = an.cn ? e.c : an.bn ? e.b : e.a;
  const fr = suave((prog - an.t0) / (an.t1 - an.t0));
  if (fr <= 0) return;
  const tot = an.span ? Math.max(10, Math.round(n * an.span)) : n;
  const m = Math.ceil(fr * tot);
  const lim = fr * tot;
  const vuelta = an.span ?? 1;
  const ini = an.ini ?? 0;
  const ox = an.ox ?? 0, oy = an.oy ?? 0, rz = an.rz ?? 0;
  let zsum = 0, ssum = 0, cuenta = 0, xsum = 0, ysum = 0;
  ctx.beginPath();
  let abierto = false;
  for (let i = 0; i <= m; i++) {
    anillo(ini + (Math.min(i, lim) / tot) * vuelta * TAU, an.r, an.rx, an.ry, ox, oy, an.cz, L, rz);
    proyectar(e, cam, L[0], L[1], L[2]);
    if (P[2] === 0) { abierto = false; continue; }
    if (!abierto) { ctx.moveTo(P[0], P[1]); abierto = true; } else ctx.lineTo(P[0], P[1]);
    zsum += P[3]; ssum += P[2]; xsum += P[0]; ysum += P[1]; cuenta++;
  }
  if (!cuenta) return;
  let al = an.a * niebla(zsum / cuenta, cam, e.R) * Math.min(1, fr * 2.2);
  if (FOCO.ok) {
    // Jerarquía de luces: lo cercano al núcleo se enciende y el resto cede un poco
    const dx = xsum / cuenta - FOCO.x, dy = ysum / cuenta - FOCO.y, rr = e.R * FOCO.s * 2.6;
    const prox = Math.exp(-(dx * dx + dy * dy) / (rr * rr));
    al *= 1 + 0.9 * FOCO.ci * prox - 0.2 * FOCO.ci * (1 - prox);
  }
  if (al < 0.01) return;
  ctx.strokeStyle = `rgba(${COL[an.c]},${al})`;
  ctx.lineWidth = an.w * clamp(ssum / cuenta, 0.6, 1.8);
  ctx.stroke();
  // Marcas de medición radiales: dan escala y sensación de instrumento
  if (an.marcas && fr > 0.98) {
    const am = suave((prog - an.t1) / 0.1);
    ctx.beginPath();
    for (let i = 0; i < an.marcas; i++) {
      const t = (i / an.marcas) * TAU;
      anillo(t, an.r, an.rx, an.ry, ox, oy, an.cz, L, rz);
      proyectar(e, cam, L[0], L[1], L[2]);
      const x0 = P[0], y0 = P[1];
      anillo(t, an.r * (i % 6 === 0 ? 1.07 : 1.035), an.rx, an.ry, ox, oy, an.cz, L, rz);
      proyectar(e, cam, L[0], L[1], L[2]);
      if (P[2] === 0) continue;
      ctx.moveTo(x0, y0);
      ctx.lineTo(P[0], P[1]);
    }
    ctx.strokeStyle = `rgba(${COL[0]},${an.a * 0.8 * am})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** Cables que unen dos anillos paralelos (mismo ángulo en cada uno): conexiones de la maquinaria. */
function conexiones(ctx: CanvasRenderingContext2D, e: Acto, cam: Cam, rA: number, zA: number, rB: number, zB: number, n: number, t0: number, t1: number, giro: number, alfa: number) {
  const fr = suave((e.b - t0) / (t1 - t0));
  if (fr <= 0) return;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU + giro;
    proyectar(e, cam, rA * Math.cos(t), rA * Math.sin(t), zA);
    const x0 = P[0], y0 = P[1], ok0 = P[2];
    proyectar(e, cam, mezcla(rA, rB, fr) * Math.cos(t), mezcla(rA, rB, fr) * Math.sin(t), mezcla(zA, zB, fr));
    if (!ok0 || !P[2]) continue;
    ctx.moveTo(x0, y0);
    ctx.lineTo(P[0], P[1]);
  }
  ctx.strokeStyle = `rgba(${COL[0]},${alfa * Math.min(1, fr * 2)})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Octaedro del núcleo, girado sobre y. */
const OCT: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const ARISTAS: [number, number][] = [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5]];
const NUCLEO_Z = 1.2;

export function pintarActo(m: Mundo, e: Acto) {
  if (e.d > 0) e.abre = mezcla(e.abre, EPI.abre, suave(e.d / 0.4));
  const { ctx, w, h, a, b } = e;
  ctx.clearRect(0, 0, w, h);
  const ee = suave((a - 0.1) / 0.7);
  const sF = clamp((0.56 * Math.min(w, h)) / (e.R * 2.0), 0.1, 0.8);
  const dist1 = e.f / sF;
  const cam: Cam = {
    tx: mezcla(0, e.c0x, ee),
    ty: mezcla(0, e.c0y, ee),
    tz: mezcla(0, e.R * 1.0, ee),
    dist: e.f * mezcla(1, 1 / sF, ee),
    cy: 1, sy: 0, cp: 1, sp: 0,
    ct: Math.cos(e.th0), st: Math.sin(e.th0),
    ex: 1 + e.abre * 1.1,
    fz: 0,
  };
  let yaw = mezcla(0, 0.5, suave((a - 0.12) / 0.6));
  let pitch = mezcla(0, 0.2, suave((a - 0.15) / 0.6));
  if (b > 0) {
    // Acto II: del estado final del Acto I → deriva → travelling por dentro → hacia el núcleo → retirada y ascenso
    const k1 = suave(b / 0.2), k2 = suave((b - 0.2) / 0.3), k3 = suave((b - 0.5) / 0.25), k4 = suave((b - 0.75) / 0.25);
    const ca = (v0: number, v1: number, v2: number, v3: number, v4: number) => mezcla(mezcla(mezcla(mezcla(v0, v1, k1), v2, k2), v3, k3), v4, k4);
    yaw = ca(0.5, 0.56, -0.25, 0.1, 0.55);
    pitch = ca(0.2, 0.2, 0.1, 0.08, 0.3);
    cam.dist = dist1 * ca(1, 1, 0.62, 0.85, 1.3);
    cam.tz = e.R * ca(1, 1, 2.6, NUCLEO_Z, 1.5);
    cam.fz = 0.45 * suave(b / 0.15);
    if (e.c > 0) {
      // Acto III: desde el estado final del Acto II → la cámara gira y entra → atraviesa → punto de vista de referencia
      const j1 = suave(e.c / 0.25), j2 = suave((e.c - 0.25) / 0.3), j3 = suave((e.c - 0.55) / 0.25), j4 = suave((e.c - 0.8) / 0.2);
      const cc = (v0: number, v1: number, v2: number, v3: number, v4: number) => mezcla(mezcla(mezcla(mezcla(v0, v1, j1), v2, j2), v3, j3), v4, j4);
      yaw = cc(0.55, 0.35, -0.3, 0.1, 0.42);
      pitch = cc(0.3, 0.22, 0.12, 0.05, 0.18);
      cam.dist = dist1 * cc(1.3, 1.1, 0.95, 0.9, 1.0);
      cam.tz = e.R * cc(1.5, 1.7, 2.2, 2.6, 2.0);
    }
  }
  GAN = 1 + 0.32 * suave(e.d / 0.4);
  if (e.d > 0) {
    // Epílogo: desde el punto de vista de referencia → la cámara se retira y sube → encuadra el compás → reposo
    const s1 = suave(e.d / 0.42), s2 = suave((e.d - 0.3) / 0.36), s3 = suave((e.d - 0.62) / 0.38);
    const ee = (v0: number, v1: number, v2: number, v3: number) => mezcla(mezcla(mezcla(v0, v1, s1), v2, s2), v3, s3);
    // Distancia final: que el compás entero (unas seis medidas de alto) quepa en la parte libre de la escena
    // (el texto va debajo de la escena en anchos < 896 px salvo en apaisado bajo)
    const apilado = e.w < 896 && !(e.w > e.h && e.h <= 512);
    const libre = apilado ? (e.h <= 704 ? 0.36 : 0.42) * e.h : (e.h <= 512 ? 0.62 : 0.8) * e.h;
    const fin = clamp((0.28 * Math.min(e.w, e.h)) / (libre / 5.6), 1.4, 3.4);
    yaw = ee(0.42, 0.4, 0.5, EPI.yaw);
    pitch = ee(0.18, 0.16, 0.18, EPI.pitch);
    cam.dist = dist1 * ee(1, 0.76 * fin, fin, fin * 0.98);
    cam.tz = e.R * ee(2.0, 1.8, EPI.mira[2], EPI.mira[2]);
    const kt = suave(e.d / 0.55), cth = Math.cos(e.th0), sth = Math.sin(e.th0);
    cam.tx = e.c0x + kt * e.R * (EPI.mira[0] * cth - EPI.mira[1] * sth);
    cam.ty = e.c0y + kt * e.R * (EPI.mira[0] * sth + EPI.mira[1] * cth);
  }
  yaw += e.giro * 0.6;
  pitch += e.cabeceo * 0.35;
  cam.cy = Math.cos(yaw); cam.sy = Math.sin(yaw); cam.cp = Math.cos(pitch); cam.sp = Math.sin(pitch);
  // Luz del núcleo: intensidad por momento (calma → concentración → inquietud) y foco en pantalla
  const luzB = suave(b / 0.15);
  const nu0 = suave((b - 0.46) / 0.16);
  const ci = nu0 * (0.7 + 0.3 * suave((b - 0.55) / 0.2)) * (1 + 0.08 * Math.sin(b * 50)) * (1 + 0.5 * e.rx) * (1 - 0.12 * suave(e.d / 0.4));
  FOCO.ok = false;
  FOCO.ci = ci;
  if (b > 0) { proyectar(e, cam, 0, 0, NUCLEO_Z); FOCO.x = P[0]; FOCO.y = P[1]; FOCO.s = P[2]; FOCO.ok = P[2] > 0; }
  const n = m.denso ? 110 : 72;
  const spin = b * 1.5 + e.c * 1.0;
  const tens = suave((b - 0.78) / 0.2);

  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (b > 0) bruma(ctx, m, e, cam, luzB);

  // Luz de las puntas (viene del prólogo) y resplandor del primer círculo
  const tip = 1 - suave(a / 0.08);
  if (tip > 0.003) {
    for (const lx of [0, 1]) {
      proyectar(e, cam, lx, 0, 0);
      luzPunta(ctx, P[0], P[1], e.rr * P[2], tip);
    }
  }
  proyectar(e, cam, 0, 0, 0.5);
  const gx = P[0], gy = P[1], gs = P[2];
  const aG = suave((a - 0.1) / 0.5) * (0.16 + 0.1 * suave((a - 0.6) / 0.3));
  if (aG > 0.004) {
    const rg = e.R * gs * 1.9;
    const gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, rg);
    gr.addColorStop(0, `rgba(${COL[2]},${aG})`);
    gr.addColorStop(0.4, `rgba(${COL[0]},${aG * 0.4})`);
    gr.addColorStop(1, `rgba(${COL[0]},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }

  // En el Acto II lo ya construido cede protagonismo (la composición se mantiene legible): se atenúa de forma global
  ctx.globalAlpha = 1 - 0.55 * suave((b - 0.2) / 0.3) + 0.2 * suave((b - 0.72) / 0.2) - EPI.atenua * suave(e.d / 0.5);

  // Haces de luz: de la punta del compás hacia el fondo
  const haz = suave((a - 0.52) / 0.3);
  if (haz > 0.01) {
    const HAZ: [number, number, number, number][] = [[0.9, 1.1, 3.4, 0.5], [-0.5, 1.4, 3.8, 0.4], [0.2, -1.2, 3.2, 0.35]];
    for (const [dx, dy, dz, ancho] of HAZ) {
      proyectar(e, cam, 0.5, 0, 0.3);
      const x0 = P[0], y0 = P[1];
      proyectar(e, cam, dx * 2.2, dy * 1.6, dz);
      const x1 = P[0], y1 = P[1], s1 = P[2];
      if (!s1) continue;
      const dxp = x1 - x0, dyp = y1 - y0, len = Math.hypot(dxp, dyp) || 1;
      const nx = -dyp / len, ny = dxp / len;
      const w1 = e.R * s1 * ancho;
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, `rgba(${COL[2]},${0.26 * haz})`);
      g.addColorStop(1, `rgba(${COL[0]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x0 + nx * 2, y0 + ny * 2);
      ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
      ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
      ctx.lineTo(x0 - nx * 2, y0 - ny * 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Línea entre las puntas
  const lf = suave(a / 0.05);
  if (lf > 0) {
    proyectar(e, cam, 0, 0, 0);
    const xa = P[0], ya = P[1];
    proyectar(e, cam, lf, 0, 0);
    ctx.strokeStyle = `rgba(${COL[2]},1)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(xa, ya);
    ctx.lineTo(P[0], P[1]);
    ctx.stroke();
  }
  // Los anillos: del círculo principal al observatorio. En el Acto II las órbitas precesionan de forma coordinada.
  const tilt = e.tilt + e.abre * 0.35;
  const ANILLOS = anillosBase(e, spin, tens, tilt);
  for (let i = 0; i < ANILLOS.length; i++) {
    const an = ANILLOS[i];
    dibujarAnillo(ctx, e, cam, an, an.marcas && !m.denso ? Math.min(n, 64) : n);
  }

  // Relaciones geométricas: círculos concéntricos, radios y polígonos en distintos planos
  if (a > 0.28) {
    ctx.beginPath();
    for (const rr of [0.82, 0.62, 0.42, 0.22]) {
      const fr = suave((a - (0.3 + (0.82 - rr) * 0.3)) / 0.12);
      if (fr <= 0) continue;
      for (let i = 0; i <= Math.ceil(fr * 64); i++) {
        anillo((Math.min(i, fr * 64) / 64) * TAU, rr, 0, 0, 0, 0, 0, L);
        proyectar(e, cam, L[0], L[1], L[2]);
        if (!P[2]) continue;
        if (i === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
      }
    }
    ctx.strokeStyle = `rgba(${COL[0]},0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    const fs = suave((a - 0.4) / 0.14);
    if (fs > 0) {
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const t = (i / 12) * TAU + spin * 0.25;
        proyectar(e, cam, 0, 0, 0);
        ctx.moveTo(P[0], P[1]);
        proyectar(e, cam, Math.cos(t) * 1.16 * fs, Math.sin(t) * 1.16 * fs, 0);
        ctx.lineTo(P[0], P[1]);
      }
      ctx.strokeStyle = `rgba(${COL[0]},0.38)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    dibujarPoli(ctx, e, cam, TRIANGULO, 0.4, 0.54, 1.2, 0.8, 2);
    dibujarPoli(ctx, e, cam, HEXAGONO, 0.44, 0.58, 1.1, 0.7, 0);
    dibujarPoli(ctx, e, cam, CUADRADO, 0.48, 0.62, 1, 0.65, 1);
    dibujarPoli(ctx, e, cam, OCTOGONO, 0.5, 0.66, 1, 0.55, 2);
  }

  // Eje de profundidad con marcas (en el Acto III deja de estar alineado: se curva)
  const des = suave(e.c / 0.3);
  const fe = suave((a - 0.5) / 0.2);
  if (fe > 0) {
    ctx.beginPath();
    const z0 = -1.6, z1 = z0 + (3.2 - z0) * fe;
    const segs = 14;
    let zs = 0, ss = 0, c = 0;
    for (let i = 0; i <= segs; i++) {
      const z = mezcla(z0, z1, i / segs);
      proyectar(e, cam, des * 0.09 * (z - 0.6) * (z - 0.6), 0, z);
      if (!P[2]) continue;
      if (i === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
      zs += P[3]; ss += P[2]; c++;
    }
    if (c) {
      ctx.strokeStyle = `rgba(${COL[2]},${0.5 * niebla(zs / c, cam, e.R) * fe})`;
      ctx.lineWidth = 1.2 * clamp(ss / c, 0.6, 1.6);
      ctx.stroke();
      ctx.beginPath();
      for (let z = z0 + 0.2; z < z1; z += 0.2) {
        proyectar(e, cam, des * 0.09 * (z - 0.6) * (z - 0.6), 0.03, z);
        const xa = P[0], ya = P[1];
        proyectar(e, cam, des * 0.09 * (z - 0.6) * (z - 0.6), -0.03, z);
        ctx.moveTo(xa, ya);
        ctx.lineTo(P[0], P[1]);
      }
      ctx.strokeStyle = `rgba(${COL[0]},${0.45 * fe})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Planos suspendidos: con la apertura se separan del eje
  const PLANOS: [number, number, number, number, number, number, number, number][] = [
    // ancho, alto, ox, oy, cz, giroY, nacimiento, nace con b (1) o con a (0)
    [2.0, 1.2, 0.1, -0.2, 0.9, 0.35, 0.5, 0],
    [1.2, 2.0, 1.5, 0.15, -0.1, -0.5, 0.56, 0],
    [2.6, 0.8, -0.5, -1.05, 2.0, 0.15, 0.62, 0],
    [4.4, 2.4, -0.2, 0.2, 3.9, 0.25, 0.3, 1],
    [2.2, 3.4, -2.6, -0.3, 2.6, -0.45, 0.4, 1],
  ];
  const ap = 1 + e.abre * 0.9;
  for (const [pw, ph, ox, oy, cz, gy, t0, conB] of PLANOS) {
    if (conB && b <= 0) continue;
    const fr = suave(((conB ? b : a) - t0) / 0.22);
    if (fr <= 0) continue;
    const esq: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    ctx.beginPath();
    let zs = 0, ok = true, pxm = 0, pym = 0;
    const dr = conB ? Math.sin(b * 3 + t0 * 9) * 0.06 : 0;
    for (let i = 0; i < 4; i++) {
      const x = (esq[i][0] * pw) / 2, y = (esq[i][1] * ph) / 2;
      const gg = gy + dr;
      const lx = x * Math.cos(gg) + ox * ap, lz = -x * Math.sin(gg) + cz;
      proyectar(e, cam, lx, y + oy * ap, lz);
      if (!P[2]) { ok = false; break; }
      if (i === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
      zs += P[3]; pxm += P[0]; pym += P[1];
    }
    if (!ok) continue;
    ctx.closePath();
    const nb = niebla(zs / 4, cam, e.R);
    // Reflejo suave: los planos próximos al núcleo reciben su luz
    let prox = 0;
    if (FOCO.ok) { const dx = pxm / 4 - FOCO.x, dy = pym / 4 - FOCO.y, rr = e.R * FOCO.s * 3; prox = Math.exp(-(dx * dx + dy * dy) / (rr * rr)) * FOCO.ci; }
    ctx.fillStyle = `rgba(${COL[2]},${(0.035 + 0.09 * prox) * fr * nb})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${COL[2]},${(0.34 + 0.35 * prox) * fr * nb})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  if (b > 0) pintarActoII(m, e, cam, n, spin, tens, ci);
  if (e.c > 0) pintarActoIII(m, e, cam, spin, tens, tilt, dist1);
  if (e.d > 0) pintarEpilogo(m, e, cam);

  // Polvo en suspensión: da escala y profundidad con el paralaje de la cámara
  const pv = m.polvo;
  for (let i = 0; i < pv.length; i += 5) {
    const al = suave((a - pv[i + 3]) / 0.1);
    if (al <= 0) continue;
    proyectar(e, cam, pv[i], pv[i + 1], pv[i + 2]);
    if (!P[2]) continue;
    const x = P[0], y = P[1];
    if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
    const s = pv[i + 4] * 1.3 * clamp(P[2] * 1.6, 0.6, 2);
    ctx.fillStyle = `rgba(${i % 3 === 0 ? COL[2] : COL[0]},${0.85 * al * niebla(P[3], cam, e.R)})`;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
  }
  if (b > 0) {
    const p2 = m.polvo2;
    for (let i = 0; i < p2.length; i += 5) {
      const al = suave((b - p2[i + 3]) / 0.12);
      if (al <= 0) continue;
      proyectar(e, cam, p2[i], p2[i + 1], p2[i + 2]);
      if (!P[2]) continue;
      const x = P[0], y = P[1];
      if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
      const s = p2[i + 4] * 1.2 * clamp(P[2] * 1.5, 0.6, 2);
      ctx.fillStyle = `rgba(${i % 3 === 0 ? COL[2] : COL[0]},${0.8 * al * niebla(P[3], cam, e.R)})`;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  }
  ctx.globalCompositeOperation = "source-over";
  if (e.c > 0) sombras(ctx, e, cam);
  if (b > 0) vineta(ctx, e, luzB, tens * (1 - 0.6 * suave(e.d / 0.5)));
}

/** Dibuja un sprite de luz precalculado (barato: una sola llamada de imagen, sin crear gradientes por fotograma). */
function halo(ctx: CanvasRenderingContext2D, spr: HTMLCanvasElement, x: number, y: number, r: number, alfa: number) {
  if (alfa < 0.01 || r < 1) return;
  const g = ctx.globalAlpha;
  ctx.globalAlpha = g * Math.min(1, alfa);
  ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = g;
}

type OrbitaP = { r: number; rx: number; ry: number; cz: number; rz: number };
const ven = (b: number, b0: number, b1: number) => { const u = (b - b0) / (b1 - b0); return u <= 0 || u >= 1 ? -1 : u; };
const campana = (u: number) => (u < 0 ? 0 : Math.sin(Math.PI * u));

/** Pulso de luz que recorre una órbita: cola degradada (tres trazos de longitud decreciente) y cabeza con halo. */
function pulso(ctx: CanvasRenderingContext2D, spr: HTMLCanvasElement, e: Acto, cam: Cam, o: OrbitaP, cabeza: number, largo: number, fuerza: number, c: 0 | 1 | 2) {
  if (fuerza < 0.03) return;
  for (let k = 0; k < 3; k++) {
    const span = largo * (1 - k * 0.3);
    ctx.beginPath();
    let ss = 0, cn = 0, zs = 0;
    for (let i = 0; i <= 10; i++) {
      anillo(cabeza - span + (i / 10) * span, o.r, o.rx, o.ry, 0, 0, o.cz, L, o.rz);
      proyectar(e, cam, L[0], L[1], L[2]);
      if (!P[2]) continue;
      if (cn === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
      ss += P[2]; zs += P[3]; cn++;
    }
    if (!cn) continue;
    ctx.strokeStyle = `rgba(${COL[c]},${fuerza * (0.3 + 0.28 * k) * niebla(zs / cn, cam, e.R)})`;
    ctx.lineWidth = (3.4 - k * 1.0) * clamp(ss / cn, 0.7, 1.6);
    ctx.stroke();
  }
  anillo(cabeza, o.r, o.rx, o.ry, 0, 0, o.cz, L, o.rz);
  proyectar(e, cam, L[0], L[1], L[2]);
  if (P[2]) halo(ctx, spr, P[0], P[1], 15 * clamp(P[2] * 1.4, 0.7, 2.4), fuerza * niebla(P[3], cam, e.R));
}

/** Destello en forma de cruz sobre un punto de la geometría (intersecciones y encuentros). */
function destello(ctx: CanvasRenderingContext2D, spr: HTMLCanvasElement, e: Acto, cam: Cam, lx: number, ly: number, lz: number, fuerza: number) {
  if (fuerza < 0.05) return;
  proyectar(e, cam, lx, ly, lz);
  if (!P[2]) return;
  const x = P[0], y = P[1], r = 7 * clamp(P[2] * 1.5, 0.7, 2.2), nb = niebla(P[3], cam, e.R);
  halo(ctx, spr, x, y, r * 2.2, fuerza * nb);
  ctx.beginPath();
  ctx.moveTo(x - r * 2.4 * fuerza, y); ctx.lineTo(x + r * 2.4 * fuerza, y);
  ctx.moveTo(x, y - r * 1.6 * fuerza); ctx.lineTo(x, y + r * 1.6 * fuerza);
  ctx.strokeStyle = `rgba(${COL[2]},${0.7 * fuerza * nb})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Chispas que viajan por los cables entre dos anillos paralelos. dir = +1 hacia B, −1 hacia A. */
function chispas(ctx: CanvasRenderingContext2D, spr: HTMLCanvasElement, e: Acto, cam: Cam, rA: number, zA: number, rB: number, zB: number, n: number, giro: number, vel: number, dir: number, fuerza: number) {
  if (fuerza < 0.03) return;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU + giro;
    let u = (e.b * vel + i * 0.37) % 1;
    if (dir < 0) u = 1 - u;
    proyectar(e, cam, mezcla(rA, rB, u) * Math.cos(t), mezcla(rA, rB, u) * Math.sin(t), mezcla(zA, zB, u));
    if (P[2]) halo(ctx, spr, P[0], P[1], 8 * clamp(P[2] * 1.4, 0.7, 2.2), fuerza * niebla(P[3], cam, e.R));
  }
}

/** Acto II: anillos colosales, arcos, cables, satélites, luz viva y el núcleo. Solo se llama con b > 0. */
function pintarActoII(m: Mundo, e: Acto, cam: Cam, n: number, spin: number, tens: number, ci: number) {
  const { ctx, b } = e;
  const dens = m.denso;
  const marc = dens ? 1 : 0.65;
  const spr = m.sprites;
  const tilt = e.tilt + e.abre * 0.35;
  // Arquitectura de gran escala: tres anillos colosales a distintas profundidades y dos arcos suspendidos
  const GRANDES: Anillo[] = [
    { r: 4.2, rx: 1.35, ry: 0.2, cz: 3.2, t0: 0.22, t1: 0.46, w: 1.4, a: 0.55, c: 0, marcas: Math.round(120 * marc), rz: spin * 0.06, bn: true },
    { r: 6, rx: 1.45, ry: -0.25, cz: 5, t0: 0.3, t1: 0.54, w: 1.3, a: 0.45, c: 2, marcas: Math.round(160 * marc), rz: -spin * 0.04, bn: true },
    { r: 2.8, rx: 1.2, ry: 0.4 + 0.1 * tens, cz: -1.2, t0: 0.26, t1: 0.5, w: 1.3, a: 0.5, c: 1, rz: spin * 0.1, bn: true },
    { r: 3.4, rx: 0.6 - e.c * 0.5, ry: 0.9 + e.c * 1.3, cz: 2.0, ini: 0.3, span: 0.38, t0: 0.34, t1: 0.5, w: 1.8, a: 0.75, c: 2, rz: spin * 0.12, bn: true },
    { r: 2.6, rx: -0.8, ry: -0.5 - e.c * 1.2, cz: 1.0, ini: 2.0, span: 0.45, t0: 0.4, t1: 0.56, w: 1.6, a: 0.65, c: 0, rz: -spin * 0.1, bn: true },
  ];
  for (const an of GRANDES) dibujarAnillo(ctx, e, cam, an, an.span ? n : Math.round(n * 1.1));

  // Cables: unen los anillos del túnel entre sí y con el núcleo
  const gc = spin * 0.12;
  const nc = dens ? 12 : 8;
  conexiones(ctx, e, cam, 1.28, -0.45, 0.86, 0.55, nc, 0.22, 0.4, gc, 0.28);
  conexiones(ctx, e, cam, 0.86, 0.55, 0.4, 2.2, nc, 0.28, 0.46, gc, 0.3);
  conexiones(ctx, e, cam, 0.7, 1.1, 0.3, NUCLEO_Z, nc, 0.5, 0.64, -gc, 0.34);

  const GA: OrbitaP = { r: 0.92, rx: 1.0 + 0.9 * tilt, ry: 0, cz: 0.5, rz: spin * 0.8 };
  const GB: OrbitaP = { r: 0.92, rx: 0, ry: 1.0 + 0.9 * tilt, cz: 0.5, rz: -spin * 0.6 };
  const GC: OrbitaP = { r: 1.45, rx: -0.6 - 0.5 * tilt, ry: 0.5, cz: 0.6, rz: spin * 0.35 };
  const BASE: OrbitaP = { r: 1, rx: 0, ry: 0, cz: 0, rz: 0 };
  const TUN: OrbitaP = { r: 0.86, rx: 0, ry: 0, cz: 0.55, rz: 0 };
  const CA: OrbitaP = { r: 4.2, rx: 1.35, ry: 0.2, cz: 3.2, rz: spin * 0.06 };
  const CB: OrbitaP = { r: 6, rx: 1.45, ry: -0.25, cz: 5, rz: -spin * 0.04 };
  const CONCHA: OrbitaP = { r: 2.0, rx: 1.2 + 0.12 * tens, ry: 0, cz: 1.2, rz: -spin * 0.3 };

  if (spr) {
    const h = spr.halo;
    // ── Coreografía de luz: cada momento enciende unas pocas piezas y deja el resto en calma ──
    // El observatorio despierta: la luz empieza a circular por las órbitas del Acto I
    let u = ven(b, 0.03, 0.26); pulso(ctx, h, e, cam, GA, u * TAU * 1.3, 0.9, campana(u), 2);
    u = ven(b, 0.08, 0.3); pulso(ctx, h, e, cam, GB, TAU - u * TAU * 1.1, 0.9, campana(u), 0);
    u = ven(b, 0.12, 0.32); pulso(ctx, h, e, cam, BASE, u * TAU * 1.5, 1.1, campana(u), 2);
    // La maquinaria del orden: los pulsos revelan la inmensidad de los anillos mientras la cámara pasa entre ellos
    u = ven(b, 0.28, 0.52); pulso(ctx, h, e, cam, CA, u * TAU * 0.8, 0.55, campana(u), 2);
    u = ven(b, 0.34, 0.58); pulso(ctx, h, e, cam, CB, TAU - u * TAU * 0.6, 0.5, campana(u), 0);
    u = ven(b, 0.3, 0.5); pulso(ctx, h, e, cam, TUN, u * TAU, 1.0, campana(u), 2);
    chispas(ctx, h, e, cam, 0.86, 0.55, 0.4, 2.2, dens ? 6 : 4, gc, 2.2, 1, campana(ven(b, 0.3, 0.55)) * 0.9);
    // El centro de la medida: la energía converge en el núcleo
    chispas(ctx, h, e, cam, 0.7, 1.1, 0.3, NUCLEO_Z, dens ? 8 : 5, -gc, 3, -1, campana(ven(b, 0.5, 0.8)));
    u = ven(b, 0.56, 0.76); pulso(ctx, h, e, cam, CONCHA, u * TAU * 1.2, 0.8, campana(u) * 0.8, 2);
    // Reacción a la apertura: las órbitas se encienden mientras el visitante mueve el control
    if (e.rx > 0.03 && b > 0.3) {
      const hd = b * TAU * 3;
      pulso(ctx, h, e, cam, GA, hd, 1.0, e.rx, 2);
      pulso(ctx, h, e, cam, GB, -hd, 1.0, e.rx, 0);
      pulso(ctx, h, e, cam, GC, hd * 0.7, 0.9, e.rx * 0.8, 2);
    }
    // El límite del orden: un pulso se entrecorta y la luz deja de ser simétrica
    u = ven(b, 0.8, 1.0);
    if (u > 0) pulso(ctx, h, e, cam, CONCHA, u * TAU * 0.6 + 0.4 * Math.sin(u * 28), 0.7, campana(u) * (0.45 + 0.55 * (Math.sin(u * 61) > 0 ? 1 : 0.15)), 1);
    // Destellos en cruces de órbitas, uno cada vez y a ritmos distintos
    const dg = dens ? 6 : 4;
    for (let i = 0; i < dg; i++) {
      const w = Math.max(0, Math.sin(b * TAU * (1.4 + i * 0.37) + i * 1.9));
      const f = Math.pow(w, 9) * suave((b - 0.05) / 0.1) * (b > 0.5 ? 1 : 0.7);
      const sg = i % 2 ? -1 : 1;
      if (i < 2) destello(ctx, h, e, cam, sg * 0.92, 0, 0.5, f);
      else if (i < 4) destello(ctx, h, e, cam, 0, sg * 0.92, 0.5, f);
      else destello(ctx, h, e, cam, sg * 1.45, 0, 0.6, f);
    }
  }

  // Satélites: viajan por las órbitas con velocidades distintas
  const sat = suave((b - 0.18) / 0.15);
  if (sat > 0.02) {
    const SAT: [number, number, number, number, number, number, number, number][] = [
      // r, rx, ry, cz, rz, fase, velocidad, radio de luz
      [0.92, 1.0 + 0.9 * tilt, 0, 0.5, spin * 0.8, 0.2, 1.7, 9],
      [0.92, 0, 1.0 + 0.9 * tilt, 0.5, -spin * 0.6, 2.0, -1.3, 8],
      [1.45, -0.6 - 0.5 * tilt, 0.5, 0.6, spin * 0.35, 4.1, 0.9, 7],
      [4.2, 1.35, 0.2, 3.2, spin * 0.06, 1.0, 0.45, 12],
      [6, 1.45, -0.25, 5, -spin * 0.04, 3.4, -0.3, 14],
    ];
    for (const [r, rx, ry, cz, rz, fase, vel, rl] of SAT) {
      anillo(fase + b * TAU * vel, r, rx, ry, 0, 0, cz, L, rz);
      proyectar(e, cam, L[0], L[1], L[2]);
      if (!P[2]) continue;
      const rr = rl * clamp(P[2] * 1.4, 0.7, 2.4), al = sat * niebla(P[3], cam, e.R);
      if (spr) halo(ctx, spr.halo, P[0], P[1], rr * 1.6, al); else luzPunta(ctx, P[0], P[1], rr, al);
    }
  }

  // Núcleo: octaedro que gira, dos anillos que precesionan, rayos radiales y resplandor en capas
  const nu = suave((b - 0.46) / 0.16);
  if (nu > 0.01) {
    const rn = 0.3 * nu;
    const gy = spin * 1.3, cg = Math.cos(gy), sg = Math.sin(gy);
    const vx: number[] = [], vy: number[] = [], vz: number[] = [];
    for (const [x, y, z] of OCT) { vx.push(x * rn * cg + z * rn * sg); vy.push(y * rn); vz.push(-x * rn * sg + z * rn * cg + NUCLEO_Z); }
    ctx.beginPath();
    let zs = 0, c = 0;
    for (const [i, j] of ARISTAS) {
      proyectar(e, cam, vx[i], vy[i], vz[i]);
      const x0 = P[0], y0 = P[1], ok = P[2];
      proyectar(e, cam, vx[j], vy[j], vz[j]);
      if (!ok || !P[2]) continue;
      ctx.moveTo(x0, y0);
      ctx.lineTo(P[0], P[1]);
      zs += P[3]; c++;
    }
    if (c) {
      ctx.strokeStyle = `rgba(${COL[2]},${Math.min(1, 0.9 * nu * (0.8 + 0.5 * ci)) * niebla(zs / c, cam, e.R)})`;
      ctx.lineWidth = 1.4 + 0.8 * ci;
      ctx.stroke();
    }
    for (const an of [
      { r: 0.24, rx: 1.1, ry: 0, cz: NUCLEO_Z, t0: 0.5, t1: 0.62, w: 1.3, a: 1, c: 2 as const, rz: spin, bn: true },
      { r: 0.24, rx: 0, ry: 1.1, cz: NUCLEO_Z, t0: 0.52, t1: 0.64, w: 1.3, a: 1, c: 0 as const, rz: -spin, bn: true },
    ] as Anillo[]) dibujarAnillo(ctx, e, cam, an, 48);

    proyectar(e, cam, 0, 0, NUCLEO_Z);
    const gx0 = P[0], gy0 = P[1], gs = P[2];
    if (gs) {
      // En el último momento la luz se desplaza del núcleo: deja de ser perfectamente simétrica
      const gx = gx0 - tens * 0.07 * e.R * gs, gy2 = gy0 + tens * 0.03 * e.R * gs;
      const f = 1 - 0.22 * tens * (0.5 + 0.5 * Math.sin(b * 47) * Math.sin(b * 13));
      if (spr) {
        // En el Acto III la cámara se acerca al núcleo: su luz se limita para que no devore la escena
        // (en el epílogo el núcleo se ve de lejos: su luz gana radio para seguir siendo el segundo punto de atención)
        const R0 = mezcla(e.R * gs, Math.min(e.R * gs, 0.3 * Math.min(e.w, e.h)), suave(e.c / 0.15)) * (1 + 0.75 * suave(e.d / 0.5));
        // Energía radial: textura de rayos precalculada, que gira despacio (como los rayos de la pintura)
        const rot = b * 0.9 + tens * 0.45 * Math.sin(b * 30);
        const al = Math.min(1, 0.27 * ci * f);
        ctx.save();
        ctx.translate(gx, gy2);
        ctx.rotate(rot);
        ctx.globalAlpha = al * (1 - 0.3 * tens);
        ctx.drawImage(spr.rayos, -R0 * 2.7, -R0 * 2.7, R0 * 5.4, R0 * 5.4);
        ctx.restore();
        if (tens > 0.05) {
          // media escena más encendida que la otra
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, gx, e.h);
          ctx.clip();
          ctx.translate(gx, gy2);
          ctx.rotate(rot * 0.8 + 0.5);
          ctx.globalAlpha = Math.min(1, 0.34 * tens * ci);
          ctx.drawImage(spr.rayos, -R0 * 2.8, -R0 * 2.8, R0 * 5.6, R0 * 5.6);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        halo(ctx, spr.halo, gx, gy2, R0 * 2.6, 0.2 * ci * f);
        halo(ctx, spr.halo, gx, gy2, R0 * 1.2, 0.42 * ci * f);
        halo(ctx, spr.halo, gx, gy2, R0 * 0.38, Math.min(1, 0.72 * ci * f));
        // Partículas de energía: se dispersan hacia fuera con la apertura
        const mt = m.motas;
        const vivo = nu * (0.25 + 0.75 * e.abre + e.rx);
        if (vivo > 0.05) {
          for (let i = 0; i < mt.length; i += 5) {
            const rad = 0.3 + mt[i + 3] * (0.5 + 2.8 * e.abre) + 0.12 * Math.sin(b * 9 + i);
            proyectar(e, cam, mt[i] * rad, mt[i + 1] * rad, NUCLEO_Z + mt[i + 2] * rad);
            if (!P[2]) continue;
            halo(ctx, spr.halo, P[0], P[1], (3 + mt[i + 4] * 3) * clamp(P[2] * 1.5, 0.7, 2), vivo * 0.7 * niebla(P[3], cam, e.R));
          }
        }
      } else {
        const rg = e.R * gs * 0.9;
        const gr = ctx.createRadialGradient(gx, gy2, 0, gx, gy2, rg);
        gr.addColorStop(0, `rgba(${COL[2]},${0.4 * nu})`);
        gr.addColorStop(0.35, `rgba(${COL[0]},${0.16 * nu})`);
        gr.addColorStop(1, `rgba(${COL[0]},0)`);
        ctx.fillStyle = gr;
        ctx.fillRect(gx - rg, gy2 - rg, rg * 2, rg * 2);
      }
    }
  }
}

/** Bruma luminosa: dos velos de nube precalculados que rodean la estructura; no son un fondo, se centran en el núcleo. */
function bruma(ctx: CanvasRenderingContext2D, m: Mundo, e: Acto, cam: Cam, luzB: number) {
  // Degradación progresiva: en equipos modestos (móvil) se prescinde de la bruma, que es el efecto de mayor superficie
  const nube = m.denso ? m.sprites?.nube : null;
  if (!nube || !FOCO.ok) return;
  const R0 = e.R * FOCO.s;
  const a = 0.12 * luzB * (0.65 + 0.35 * suave((e.b - 0.4) / 0.2));
  const px = -cam.sy * R0 * 0.6, py = cam.sp * R0 * 0.6;
  const s1 = R0 * 8;
  ctx.save();
  ctx.translate(FOCO.x + px, FOCO.y + py);
  ctx.rotate(e.b * 0.25);
  ctx.globalAlpha = a;
  ctx.drawImage(nube, -s1 / 2, -s1 / 2, s1, s1);
  {
    ctx.rotate(-e.b * 0.7 + 1.3);
    ctx.globalAlpha = a * 0.7;
    const s2 = R0 * 13;
    ctx.drawImage(nube, -s2 / 2 - px * 0.5, -s2 / 2 - py * 0.5, s2, s2);
  }
  ctx.restore();
}

/** Oscurecimiento cálido de los bordes, con el foco de atención despejado. Se desplaza hacia un lado en el último momento. */
function vineta(ctx: CanvasRenderingContext2D, e: Acto, luzB: number, tens: number) {
  const { w, h, b } = e;
  const mn = Math.min(w, h);
  const humor = 0.3 + 0.2 * suave((b - 0.15) / 0.25) + 0.22 * tens;
  const fx = FOCO.ok && b > 0.4 ? mezcla(w / 2, clamp(FOCO.x, w * 0.3, w * 0.7), suave((b - 0.4) / 0.2) * 0.6) : w / 2;
  const cx = fx - tens * 0.16 * mn, cy = h / 2;
  const g = ctx.createRadialGradient(cx, cy, mn * 0.26, cx, cy, mn * 0.98);
  g.addColorStop(0, "rgba(16,8,5,0)");
  g.addColorStop(1, `rgba(16,8,5,${humor * luzB})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ───────────────────────── Acto III · El universo imposible ───────────────────────── */

/** Anillos del observatorio (Actos I y II); en el Acto III una órbita invierte su giro de forma imposible. */
function anillosBase(e: Acto, spin: number, tens: number, tilt: number): Anillo[] {
  // Primera contradicción: una órbita cambia de sentido de golpe y sigue girando al revés
  const rzB = -spin * 0.6 + 1.5 * suave((e.c - 0.04) / 0.1) + e.c * 0.9;
  return [
    { r: 1, rx: 0, ry: 0, cz: 0, t0: 0.06, t1: 0.2, w: 1.7, a: 1, c: 2 },
    { r: 0.86, rx: 0, ry: 0, cz: 0.55, t0: 0.2, t1: 0.3, w: 1.2, a: 0.85, c: 0 },
    { r: 0.7, rx: 0, ry: 0, cz: 1.1, t0: 0.24, t1: 0.34, w: 1.1, a: 0.75, c: 0 },
    { r: 0.55, rx: 0, ry: 0, cz: 1.65, t0: 0.28, t1: 0.38, w: 1, a: 0.65, c: 1 },
    { r: 0.4, rx: 0, ry: 0, cz: 2.2, t0: 0.32, t1: 0.42, w: 1, a: 0.55, c: 1 },
    { r: 1.28, rx: 0, ry: 0, cz: -0.45, t0: 0.34, t1: 0.46, w: 1.1, a: 0.6, c: 0 },
    { r: 0.92, rx: 1.0 + 0.9 * tilt, ry: 0, cz: 0.5, t0: 0.44, t1: 0.6, w: 1.4, a: 0.95, c: 2, rz: spin * 0.8 },
    { r: 0.92, rx: 0, ry: 1.0 + 0.9 * tilt, cz: 0.5, t0: 0.48, t1: 0.64, w: 1.4, a: 0.95, c: 0, rz: rzB },
    { r: 1.45, rx: -0.6 - 0.5 * tilt, ry: 0.5, cz: 0.6, t0: 0.56, t1: 0.74, w: 1.1, a: 0.7, c: 1, rz: spin * 0.35 },
    { r: 2.0, rx: 1.2 + 0.12 * tens, ry: 0, ox: 0.06 * tens, cz: 1.2, t0: 0.66, t1: 0.84, w: 1.2, a: 0.7, c: 0, marcas: 60, rz: -spin * 0.3 },
    { r: 3.0, rx: 1.4, ry: 0.3, cz: 2.4, t0: 0.72, t1: 0.92, w: 1.1, a: 0.55, c: 2, marcas: 90, rz: spin * 0.18 },
  ];
}

/** Cámara de referencia del Acto III (la del último momento, sin las desviaciones del visitante): desde ella todo «encaja». */
function camaraReferencia(e: Acto, dist1: number): Cam {
  const yaw = 0.42, pitch = 0.18;
  return {
    tx: e.c0x, ty: e.c0y, tz: e.R * 2.0, dist: dist1 * 1.0,
    cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch),
    ct: Math.cos(e.th0), st: Math.sin(e.th0), ex: 1 + e.abre * 1.1, fz: 0,
  };
}

/** Punto dado en coordenadas de vista de una cámara → coordenadas locales del mundo (inversa de `proyectar`). */
function deVista(e: Acto, c: Cam, vx: number, vy: number, vz: number, out: number[]) {
  const z2 = vz - c.dist, y2 = vy, x1 = vx;
  const py = y2 * c.cp + z2 * c.sp;
  const z1 = -y2 * c.sp + z2 * c.cp;
  const px = x1 * c.cy - z1 * c.sy;
  const pz = x1 * c.sy + z1 * c.cy;
  const X = px + c.tx, Y = py + c.ty, Z = pz + c.tz;
  const dx = (X - e.c0x) / e.R, dy = (Y - e.c0y) / e.R;
  out[0] = dx * c.ct + dy * c.st;
  out[1] = -dx * c.st + dy * c.ct;
  out[2] = Z / (e.R * c.ex);
}

const Q = [0, 0, 0];
const Q2 = [0, 0, 0];

/**
 * Triángulo imposible (tipo Penrose): tres barras de sección cuadrada cuyos extremos están a profundidades que no cierran
 * en el espacio, pero sí en la proyección desde la cámara de referencia. Al moverse la cámara se abre; en el último momento se cierra.
 */
function triangulo(ctx: CanvasRenderingContext2D, spr: Sprites | null, e: Acto, cam: Cam, dist1: number, fr: number) {
  if (fr <= 0) return;
  const S = camaraReferencia(e, dist1);
  proyectar(e, S, 0, 0, NUCLEO_Z);
  if (!P[2]) return;
  const zc0 = P[3];
  const mn = Math.min(e.w, e.h);
  const rho = 0.27 * mn, hw = 0.017 * mn, dz = zc0 * 0.34;
  const ang = [-Math.PI / 2, -Math.PI / 2 + TAU / 3, -Math.PI / 2 + (2 * TAU) / 3];
  const zA = [zc0 - 1.5 * dz, zc0 - 0.5 * dz, zc0 + 0.5 * dz, zc0 + 1.5 * dz];
  // Cuánto se parece la cámara actual a la de referencia: el triángulo se ilumina al cerrarse
  const yaw = Math.atan2(cam.sy, cam.cy), pitch = Math.atan2(cam.sp, cam.cp);
  const cierra = clamp(1 - (Math.abs(yaw - 0.42) + Math.abs(pitch - 0.18)) / 0.22);
  let zs = 0, cn = 0;
  for (let i = 0; i < 3; i++) {
    const vis = suave(fr * 3 - i);
    if (vis <= 0) continue;
    const j = (i + 1) % 3;
    const zS = zA[i], zE = zA[i + 1];
    const uS = [Math.cos(ang[i]) * rho, Math.sin(ang[i]) * rho], uE = [Math.cos(ang[j]) * rho, Math.sin(ang[j]) * rho];
    ctx.beginPath();
    for (const [ox, oy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      deVista(e, S, (uS[0] + ox * hw) * (zS / e.f), (uS[1] + oy * hw) * (zS / e.f), zS, Q);
      deVista(e, S, (uE[0] + ox * hw) * (zE / e.f), (uE[1] + oy * hw) * (zE / e.f), zE, Q2);
      proyectar(e, cam, Q[0], Q[1], Q[2]);
      const x0 = P[0], y0 = P[1], ok0 = P[2];
      zs += P[3]; cn++;
      proyectar(e, cam, mezcla(Q[0], Q2[0], vis), mezcla(Q[1], Q2[1], vis), mezcla(Q[2], Q2[2], vis));
      if (!ok0 || !P[2]) continue;
      ctx.moveTo(x0, y0);
      ctx.lineTo(P[0], P[1]);
    }
    // tapa cuadrada al comienzo de la barra
    for (let k = 0; k < 4; k++) {
      const [ax, ay] = [[-1, -1], [1, -1], [1, 1], [-1, 1]][k], [bx, by] = [[1, -1], [1, 1], [-1, 1], [-1, -1]][k];
      deVista(e, S, (uS[0] + ax * hw) * (zS / e.f), (uS[1] + ay * hw) * (zS / e.f), zS, Q);
      deVista(e, S, (uS[0] + bx * hw) * (zS / e.f), (uS[1] + by * hw) * (zS / e.f), zS, Q2);
      proyectar(e, cam, Q[0], Q[1], Q[2]);
      const x0 = P[0], y0 = P[1], ok0 = P[2];
      proyectar(e, cam, Q2[0], Q2[1], Q2[2]);
      if (!ok0 || !P[2]) continue;
      ctx.moveTo(x0, y0);
      ctx.lineTo(P[0], P[1]);
    }
    ctx.strokeStyle = `rgba(${COL[2]},${(0.5 + 0.35 * cierra) * vis * niebla(zs / Math.max(1, cn), cam, e.R)})`;
    ctx.lineWidth = 1.3 + cierra * 0.8;
    ctx.stroke();
  }
  // Destellos en los tres vértices cuando el punto de vista los hace coincidir
  if (spr && cierra > 0.05) {
    for (let i = 0; i < 3; i++) {
      deVista(e, S, Math.cos(ang[i]) * rho * (zA[i] / e.f), Math.sin(ang[i]) * rho * (zA[i] / e.f), zA[i], Q);
      proyectar(e, cam, Q[0], Q[1], Q[2]);
      if (P[2]) halo(ctx, spr.halo, P[0], P[1], 26 * clamp(P[2] * 1.4, 0.7, 2), cierra * 0.9 * fr);
    }
  }
}

/** Nudo toroidal (2,3): un anillo que se atraviesa a sí mismo sin romperse. Nace como círculo y se enlaza. */
function nudo(ctx: CanvasRenderingContext2D, m: Mundo, e: Acto, cam: Cam, spin: number) {
  const k = suave((e.c - 0.1) / 0.35);
  const al = suave((e.c - 0.08) / 0.12);
  if (al <= 0) return;
  const N = m.denso ? 150 : 96, R0 = 1.55, r = 0.75 * k;
  const ct = Math.cos(0.9), st = Math.sin(0.9), cs = Math.cos(spin * 0.3), ss = Math.sin(spin * 0.3);
  ctx.beginPath();
  let sz = 0, ssum = 0, cn = 0;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * TAU;
    const rad = R0 + r * Math.cos(3 * t);
    const x = rad * Math.cos(2 * t), y = rad * Math.sin(2 * t), z = r * Math.sin(3 * t);
    const y1 = y * ct - z * st, z1 = y * st + z * ct;
    proyectar(e, cam, x * cs - y1 * ss, x * ss + y1 * cs, z1 + NUCLEO_Z);
    if (!P[2]) continue;
    if (cn === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
    sz += P[3]; ssum += P[2]; cn++;
  }
  if (!cn) return;
  ctx.strokeStyle = `rgba(${COL[2]},${0.85 * al * niebla(sz / cn, cam, e.R)})`;
  ctx.lineWidth = 1.6 * clamp(ssum / cn, 0.7, 1.6);
  ctx.stroke();
  const spr = m.sprites;
  if (spr) {
    // pulso de energía que recorre el nudo
    for (let h = 0; h < 2; h++) {
      const t = e.c * TAU * 3 + h * Math.PI;
      const rad = R0 + r * Math.cos(3 * t);
      const x = rad * Math.cos(2 * t), y = rad * Math.sin(2 * t), z = r * Math.sin(3 * t);
      const y1 = y * ct - z * st, z1 = y * st + z * ct;
      proyectar(e, cam, x * cs - y1 * ss, x * ss + y1 * cs, z1 + NUCLEO_Z);
      if (P[2]) halo(ctx, spr.halo, P[0], P[1], 13 * clamp(P[2] * 1.4, 0.7, 2.2), al * 0.9 * niebla(P[3], cam, e.R));
    }
  }
}

/** Planos plegados: una mitad gira sobre la bisagra hacia profundidades donde no hay espacio. */
function plegados(ctx: CanvasRenderingContext2D, e: Acto, cam: Cam) {
  const PL: [number, number, number, number, number, number, number, number][] = [
    // ancho, alto, ox, oy, cz, giro, pliegue final, nacimiento
    [3.6, 2.0, 0.4, 0.3, 2.0, 0.2, 1.9, 0.2],
    [2.4, 3.0, -1.8, -0.2, 3.4, -0.5, -1.6, 0.3],
    [4.2, 1.4, 0.5, -1.5, 1.0, 0.1, 2.2, 0.38],
  ];
  const ap = 1 + e.abre * 0.9;
  for (const [pw, ph, ox, oy, cz, gy, plie, t0] of PL) {
    const fr = suave((e.c - t0) / 0.2);
    if (fr <= 0) continue;
    const f = plie * suave((e.c - t0) / 0.35);
    const cf = Math.cos(f), sf = Math.sin(f), cg = Math.cos(gy), sg = Math.sin(gy);
    const hw = pw / 2, hh = ph / 2;
    const punto = (x: number, y: number) => {
      const X = x > 0 ? x * cf : x, Z = x > 0 ? -x * sf : 0;
      proyectar(e, cam, (X * cg + Z * sg) + ox * ap, y + oy * ap, (-X * sg + Z * cg) + cz);
    };
    let zs = 0, ok = true;
    const mitad = (xa: number, xb: number) => {
      ctx.beginPath();
      for (const [x, y] of [[xa, -hh], [xb, -hh], [xb, hh], [xa, hh]]) {
        punto(x, y);
        if (!P[2]) { ok = false; return; }
        if (x === xa && y === -hh) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
        zs += P[3];
      }
      ctx.closePath();
    };
    const nb0 = 1;
    mitad(-hw, 0);
    if (!ok) continue;
    ctx.fillStyle = `rgba(${COL[2]},${0.04 * fr * nb0})`; ctx.fill();
    ctx.strokeStyle = `rgba(${COL[2]},${0.38 * fr})`; ctx.lineWidth = 1; ctx.stroke();
    mitad(0, hw);
    if (!ok) continue;
    const nb = niebla(zs / 8, cam, e.R);
    ctx.fillStyle = `rgba(${COL[0]},${0.07 * fr * nb})`; ctx.fill();
    ctx.strokeStyle = `rgba(${COL[0]},${0.5 * fr * nb})`; ctx.lineWidth = 1; ctx.stroke();
    // bisagra
    punto(0, -hh); const x0 = P[0], y0 = P[1];
    punto(0, hh);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(P[0], P[1]);
    ctx.strokeStyle = `rgba(${COL[2]},${0.8 * fr * nb})`; ctx.lineWidth = 1.6; ctx.stroke();
  }
}

/** Diminuto núcleo para el interior del portal: octaedro y halos. */
function nucleoMini(ctx: CanvasRenderingContext2D, m: Mundo, e: Acto, cam: Cam, giro: number, intensidad: number) {
  const rn = 0.3, cg = Math.cos(giro), sg = Math.sin(giro);
  ctx.beginPath();
  for (const [i, j] of ARISTAS) {
    const [x1, y1, z1] = OCT[i], [x2, y2, z2] = OCT[j];
    proyectar(e, cam, (x1 * cg + z1 * sg) * rn, y1 * rn, (-x1 * sg + z1 * cg) * rn + NUCLEO_Z);
    const xa = P[0], ya = P[1], oka = P[2];
    proyectar(e, cam, (x2 * cg + z2 * sg) * rn, y2 * rn, (-x2 * sg + z2 * cg) * rn + NUCLEO_Z);
    if (!oka || !P[2]) continue;
    ctx.moveTo(xa, ya);
    ctx.lineTo(P[0], P[1]);
  }
  ctx.strokeStyle = `rgba(${COL[2]},${0.9 * intensidad})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  proyectar(e, cam, 0, 0, NUCLEO_Z);
  const spr = m.sprites;
  if (spr && P[2]) {
    const R0 = e.R * P[2];
    ctx.save();
    ctx.translate(P[0], P[1]);
    ctx.rotate(-giro * 0.6);
    ctx.globalAlpha = Math.min(1, 0.4 * intensidad);
    ctx.drawImage(spr.rayos, -R0 * 2.4, -R0 * 2.4, R0 * 4.8, R0 * 4.8);
    ctx.restore();
    halo(ctx, spr.halo, P[0], P[1], R0 * 1.6, 0.4 * intensidad);
    halo(ctx, spr.halo, P[0], P[1], R0 * 0.4, 0.8 * intensidad);
  }
}

/**
 * Portal: un umbral de luz que contiene la misma arquitectura vista desde otro lado. El plano del portal se desplaza con un
 * control; el interior reacciona de forma desproporcionada (otra escala, otro ángulo): más espacio dentro que fuera.
 *
 * Para que se lea como abertura y no como un disco oscuro: se abre como un iris; el exterior se atenúa a su alrededor;
 * emana rayos desde el umbral; el borde tiene espesor (tres aros a distinta profundidad unidos por montantes); el interior
 * es de un ámbar profundo con bruma, luz que se filtra por el borde y la arquitectura del otro lado muy luminosa.
 */
function portal(ctx: CanvasRenderingContext2D, m: Mundo, e: Acto, cam: Cam, spin: number, tens: number, tilt: number) {
  const fr = suave((e.c - 0.5) / 0.14);
  if (fr <= 0) return;
  const ir = 1 - Math.pow(1 - fr, 3);
  const pl = e.plano;
  // En pantallas estrechas el portal sube para que los mandos no lo cubran
  // Epílogo: el portal se desplaza hacia su rincón y se hace algo menor, para no competir con la arquitectura
  const xe = suave(e.d / 0.6);
  const cx = 0.6 + 1.1 * xe, cy = (e.w < 640 ? 0.05 + 0.15 * xe : 0.7 + 0.6 * xe), cz = 2.5 + 1.2 * (pl - 0.5) - 0.7 * xe;
  const rad = (1.0 - 0.15 * xe) * ir * (1 + 0.012 * Math.sin(e.c * 60));
  if (rad < 0.03) return;
  const N = 40;
  const pts: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * TAU;
    proyectar(e, cam, cx + rad * Math.cos(t), cy + rad * Math.sin(t), cz);
    if (!P[2]) return;
    pts.push(P[0], P[1]);
  }
  proyectar(e, cam, cx, cy, cz);
  const sc = P[2], zc = P[3], pcx = P[0], pcy = P[1];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < N; i++) { x0 = Math.min(x0, pts[i * 2]); x1 = Math.max(x1, pts[i * 2]); y0 = Math.min(y0, pts[i * 2 + 1]); y1 = Math.max(y1, pts[i * 2 + 1]); }
  const Rpx = Math.max(x1 - x0, y1 - y0) / 2;
  const spr = m.sprites;

  // 1 · Foco: el exterior se oscurece alrededor del umbral para que se lea antes que el fondo
  ctx.globalCompositeOperation = "source-over";
  const gf = ctx.createRadialGradient(pcx, pcy, Rpx * 1.4, pcx, pcy, Rpx * 3.6);
  gf.addColorStop(0, "rgba(10,5,3,0)");
  gf.addColorStop(1, `rgba(10,5,3,${0.46 * fr})`);
  ctx.fillStyle = gf;
  ctx.fillRect(0, 0, e.w, e.h);
  ctx.globalCompositeOperation = "lighter";

  // 2 · Emanación: rayos y resplandor cálido que salen del umbral hacia el exterior
  if (spr) {
    ctx.save();
    ctx.translate(pcx, pcy);
    ctx.rotate(e.c * 0.6);
    ctx.globalAlpha = 0.26 * fr;
    ctx.drawImage(spr.rayos, -Rpx * 3.4, -Rpx * 3.4, Rpx * 6.8, Rpx * 6.8);
    ctx.restore();
    halo(ctx, spr.halo, pcx, pcy, Rpx * 2.2, 0.2 * fr);
  }

  // 3 · Interior: otra estructura, otra escala, con profundidad
  const yaw = Math.atan2(cam.sy, cam.cy), pitch = Math.atan2(cam.sp, cam.cp);
  const cam2: Cam = {
    tx: e.c0x, ty: e.c0y, tz: e.R * 1.2,
    // La estructura entera cabe en el portal; un pequeño desplazamiento del plano la acerca o la aleja mucho
    dist: (e.f / Math.max(0.02, sc / 2.2)) * (0.55 + 1.1 * Math.abs(Math.sin(pl * 2.4 + 0.5))),
    cy: Math.cos(yaw + 2.2 + 5.5 * pl), sy: Math.sin(yaw + 2.2 + 5.5 * pl),
    cp: Math.cos(-pitch * 0.6), sp: Math.sin(-pitch * 0.6),
    ct: cam.ct, st: cam.st, ex: cam.ex, fz: 0.3,
  };
  const guardado = { ...FOCO };
  FOCO.ok = false;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < N; i++) { if (i === 0) ctx.moveTo(pts[0], pts[1]); else ctx.lineTo(pts[i * 2], pts[i * 2 + 1]); }
  ctx.closePath();
  ctx.clip();
  // fondo: ámbar profundo (no negro) que se aclara hacia el borde, donde entra la luz
  ctx.globalCompositeOperation = "source-over";
  const gi = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, Rpx);
  gi.addColorStop(0, `rgba(44,22,8,${0.82 * fr})`);
  gi.addColorStop(0.6, `rgba(36,18,7,${0.74 * fr})`);
  gi.addColorStop(1, `rgba(112,62,24,${0.55 * fr})`);
  ctx.fillStyle = gi;
  ctx.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  ctx.globalCompositeOperation = "lighter";
  // bruma interior que se desplaza con el plano: da sensación de espacio contenido
  const nube = m.denso ? spr?.nube : null;
  if (nube) {
    ctx.save();
    ctx.translate(pcx, pcy);
    ctx.rotate(pl * 2.4 + e.c * 0.5);
    ctx.globalAlpha = 0.34 * fr;
    ctx.drawImage(nube, -Rpx * 1.5, -Rpx * 1.5, Rpx * 3, Rpx * 3);
    ctx.restore();
  }
  // luz que se filtra por el borde interior
  if (spr) {
    const gb = ctx.createRadialGradient(pcx, pcy, Rpx * 0.5, pcx, pcy, Rpx);
    gb.addColorStop(0, "rgba(232,190,120,0)");
    gb.addColorStop(1, `rgba(240,200,130,${0.3 * fr})`);
    ctx.fillStyle = gb;
    ctx.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  }
  ctx.translate(pcx - e.cx, pcy - e.cy);
  ctx.globalAlpha = fr;
  const n2 = m.denso ? 56 : 32;
  const base = anillosBase(e, spin, tens, tilt);
  // Degradación progresiva: en equipos modestos el interior del portal usa menos anillos
  for (const i of m.denso ? [0, 1, 3, 5, 6, 7, 8, 9] : [0, 3, 6, 7, 9]) {
    const an = base[i];
    dibujarAnillo(ctx, e, cam2, { ...an, marcas: undefined, a: Math.min(1, an.a * 1.7), w: an.w * 1.3 }, n2);
  }
  nucleoMini(ctx, m, e, cam2, spin * 1.3, 1.3);
  ctx.restore();
  Object.assign(FOCO, guardado);

  // 4 · Borde con espesor: tres aros a distinta profundidad (frente pálido, medio ámbar, fondo carmesí) y montantes
  const aro = (dz: number, col: string, al: number, ancho: number) => {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = ((i % N) / N) * TAU;
      proyectar(e, cam, cx + rad * Math.cos(t), cy + rad * Math.sin(t), cz + dz);
      if (!P[2]) return;
      if (i === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
    }
    ctx.strokeStyle = `rgba(${col},${al * fr * niebla(zc, cam, e.R)})`;
    ctx.lineWidth = ancho * clamp(sc, 0.7, 1.6);
    ctx.stroke();
  };
  aro(0.5, COL[1], 0.5, 1.6);
  aro(0.25, COL[0], 0.65, 1.8);
  // montantes: unen el aro del frente con el del fondo
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * TAU;
    proyectar(e, cam, cx + rad * Math.cos(t), cy + rad * Math.sin(t), cz);
    const xa = P[0], ya = P[1], oka = P[2];
    proyectar(e, cam, cx + rad * Math.cos(t), cy + rad * Math.sin(t), cz + 0.5);
    if (!oka || !P[2]) continue;
    ctx.moveTo(xa, ya);
    ctx.lineTo(P[0], P[1]);
  }
  ctx.strokeStyle = `rgba(${COL[0]},${0.3 * fr})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  aro(0, COL[2], 0.95, 2.4);
  if (spr) {
    // destellos que recorren el borde, uno en cada sentido
    for (const sgn of [1, -1]) {
      const t = e.c * TAU * 4 * sgn + (sgn > 0 ? 0 : 1.7);
      proyectar(e, cam, cx + rad * Math.cos(t), cy + rad * Math.sin(t), cz);
      if (P[2]) halo(ctx, spr.halo, P[0], P[1], 15 * clamp(P[2] * 1.4, 0.7, 2.2), 0.85 * fr);
    }
  }
}

/** Acto III: se llama con c > 0, después de la arquitectura del Acto II. */
function pintarActoIII(m: Mundo, e: Acto, cam: Cam, spin: number, tens: number, tilt: number, dist1: number) {
  const { ctx, c } = e;
  const spr = m.sprites;
  // Segunda luz, contradictoria: viene del lado opuesto al núcleo y gira en sentido contrario
  if (spr) {
    const k = suave((c - 0.1) / 0.2);
    proyectar(e, cam, 0, 0, -2.4);
    if (P[2] && k > 0.01) {
      const R0 = e.R * P[2];
      ctx.save();
      ctx.translate(P[0], P[1]);
      ctx.rotate(-c * 1.6 - 0.4);
      ctx.globalAlpha = 0.32 * k * (1 + 0.5 * e.rx);
      ctx.drawImage(spr.rayos2 ?? spr.rayos, -R0 * 3, -R0 * 3, R0 * 6, R0 * 6);
      ctx.restore();
      halo(ctx, spr.halo, P[0], P[1], R0 * 1.4, 0.35 * k);
    }
  }
  // Escalas contradictorias: un anillo gigantesco cerca de la cámara y un enjambre de anillos diminutos junto al núcleo
  const ESC: Anillo[] = [
    { r: 11, rx: 1.45, ry: 0.1, cz: -4, t0: 0.3, t1: 0.5, w: 1.2, a: 0.35, c: 1, cn: true },
    { r: 0.14, rx: 0.8, ry: 0.3, ox: 0.5, oy: 0.2, cz: NUCLEO_Z + 0.4, t0: 0.34, t1: 0.46, w: 1.1, a: 0.9, c: 2, cn: true },
    { r: 0.1, rx: -0.6, ry: 0.9, ox: -0.45, oy: -0.25, cz: NUCLEO_Z - 0.3, t0: 0.38, t1: 0.5, w: 1.1, a: 0.9, c: 0, cn: true },
  ];
  for (const an of ESC) dibujarAnillo(ctx, e, cam, an, an.r > 5 ? 140 : 36);
  // En el epílogo lo secundario cede brillo; el portal no
  ctx.globalAlpha = 1 - 0.2 * suave(e.d / 0.5);
  plegados(ctx, e, cam);
  nudo(ctx, m, e, cam, spin);
  triangulo(ctx, spr, e, cam, dist1, suave((c - 0.42) / 0.3));
  ctx.globalAlpha = 1;
  portal(ctx, m, e, cam, spin, tens, tilt);
}

/** Sombras grandes y cálidas que se desplazan con la cámara: la luz contradictoria necesita zonas de oscuridad. */
function sombras(ctx: CanvasRenderingContext2D, e: Acto, cam: Cam) {
  const k = suave((e.c - 0.25) / 0.3);
  if (k <= 0) return;
  const mn = Math.min(e.w, e.h);
  const yaw = Math.atan2(cam.sy, cam.cy);
  for (const [fx, fy, r, a] of [[0.72, 0.28, 0.5, 0.5], [0.3, 0.78, 0.42, 0.42]]) {
    const x = e.w * fx + Math.sin(yaw * 2 + fx * 5) * mn * 0.1, y = e.h * fy;
    const g = ctx.createRadialGradient(x, y, 0, x, y, mn * r);
    g.addColorStop(0, `rgba(14,6,4,${a * k})`);
    g.addColorStop(1, "rgba(14,6,4,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - mn * r, y - mn * r, mn * r * 2, mn * r * 2);
  }
}

/* ───────────────────────── Epílogo · Lo que no puede medirse ───────────────────────── */

/** Punto de luz de donde parten los dos brazos (algo desplazado del eje) y puntas del compás gigante (la derecha queda por dentro del círculo). */
const APICE = [0.36, -3.5, 0.3];
const TIP_I = [0, 0, 0];
const TIP_D = [0.87, 0.02, 0];
const ORB_BASE: OrbitaP = { r: 1, rx: 0, ry: 0, cz: 0, rz: 0 };

/**
 * El observatorio resulta ser la huella de un compás gigantesco: arriba un disco de luz (como el de la pintura), de él bajan dos
 * brazos graduados hasta el círculo del principio. La punta derecha no llega a tocarlo. Reutiliza sprites y funciones del motor:
 * no crea geometría nueva por fotograma salvo dos brazos y sus marcas.
 */
function pintarEpilogo(m: Mundo, e: Acto, cam: Cam) {
  const { ctx, d, t } = e;
  const spr = m.sprites;
  const kL = suave((d - 0.08) / 0.2);
  if (kL <= 0.003) return;
  proyectar(e, cam, APICE[0], APICE[1], APICE[2]);
  if (!P[2]) return;
  const ax = P[0], ay = P[1], Rd = e.R * P[2] * 0.5;
  const kEst = suave((d - 0.72) / 0.2);
  const resp = 1 + 0.05 * Math.sin(t * 0.9);

  // Cono de luz: del disco hacia la arquitectura
  const cono = suave((d - 0.3) / 0.3);
  proyectar(e, cam, 0.5, 0.2, 1.2);
  if (cono > 0.01 && P[2]) {
    const bx = P[0], by = P[1], bs = P[2];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const w0 = Rd * 0.45, w1 = e.R * bs * 1.8;
    const g = ctx.createLinearGradient(ax, ay, bx, by);
    g.addColorStop(0, `rgba(${COL[2]},${0.2 * cono})`);
    g.addColorStop(1, `rgba(${COL[0]},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ax + nx * w0, ay + ny * w0);
    ctx.lineTo(bx + nx * w1, by + ny * w1);
    ctx.lineTo(bx - nx * w1, by - ny * w1);
    ctx.lineTo(ax - nx * w0, ay - ny * w0);
    ctx.closePath();
    ctx.fill();
  }

  // Brazos graduados. Cada uno desciende desde el disco; el derecho llega un poco después.
  const brazo = (tip: number[], grow: number, i: number) => {
    if (grow <= 0.002) return;
    proyectar(e, cam, tip[0], tip[1], tip[2]);
    if (!P[2]) return;
    const px = P[0], py = P[1], ps = P[2];
    const ex = mezcla(ax, px, grow), ey = mezcla(ay, py, grow);
    let g = ctx.createLinearGradient(ax, ay, ex, ey);
    g.addColorStop(0, `rgba(${COL[0]},0.05)`);
    g.addColorStop(1, `rgba(${COL[2]},0.26)`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 7 * clamp(ps * 2, 0.8, 1.6);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
    g = ctx.createLinearGradient(ax, ay, ex, ey);
    g.addColorStop(0, `rgba(${COL[2]},0.3)`);
    g.addColorStop(1, `rgba(${COL[2]},0.92)`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5 * clamp(ps * 2, 0.8, 1.6);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
    // Graduación del brazo: la medida convertida en instrumento
    const dx = px - ax, dy = py - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const NT = 26;
    ctx.beginPath();
    for (let k = 2; k < NT; k++) {
      const u = k / NT;
      if (u > grow) break;
      const l = (k % 5 === 0 ? 0.075 : 0.036) * Rd * 2;
      const x = mezcla(ax, px, u), y = mezcla(ay, py, u);
      ctx.moveTo(x - nx * l, y - ny * l);
      ctx.lineTo(x + nx * l, y + ny * l);
    }
    ctx.strokeStyle = `rgba(${COL[0]},${0.55 * kL})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    // La luz desciende por el brazo: una vez al aparecer el compás y, ya en reposo, de forma lenta y espaciada
    const u1 = ven(d, 0.38 + i * 0.05, 0.56 + i * 0.05);
    let u = u1, fu = campana(u1);
    if (u1 < 0 && kEst > 0.01) { u = (t * 0.1 + i * 0.5) % 1; fu = campana(u) * 0.5 * kEst; }
    if (fu > 0.03 && u > 0) {
      const hx = mezcla(ax, px, u), hy = mezcla(ay, py, u), ux = mezcla(ax, px, Math.max(0, u - 0.2)), uy = mezcla(ay, py, Math.max(0, u - 0.2));
      ctx.strokeStyle = `rgba(${COL[2]},${0.8 * fu})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(hx, hy); ctx.stroke();
      if (spr) halo(ctx, spr.halo, hx, hy, 15 * clamp(ps * 2, 0.8, 1.8), fu);
    }
  };
  brazo(TIP_I, suave((d - 0.16) / 0.3), 0);
  brazo(TIP_D, suave((d - 0.22) / 0.3), 1);

  if (spr) {
    // Disco de luz y rayos: la fuerza creadora de la pintura, ahora lejana
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(d * 0.9 + t * 0.03);
    ctx.globalAlpha = 0.36 * kL;
    ctx.drawImage(spr.rayos, -Rd * 3.6, -Rd * 3.6, Rd * 7.2, Rd * 7.2);
    ctx.rotate(-d * 1.6 - t * 0.05 + 1);
    ctx.globalAlpha = 0.16 * kL;
    ctx.drawImage(spr.rayos2 ?? spr.rayos, -Rd * 2.8, -Rd * 2.8, Rd * 5.6, Rd * 5.6);
    ctx.restore();
    halo(ctx, spr.halo, ax, ay, Rd * 3.2, 0.28 * kL * resp);
    halo(ctx, spr.halo, ax, ay, Rd * 1.6, 0.5 * kL * resp);
    halo(ctx, spr.halo, ax, ay, Rd * 0.75, 0.85 * kL);
  }
  ctx.beginPath();
  ctx.arc(ax, ay, Rd * 0.62, 0, TAU);
  ctx.moveTo(ax + Rd * 0.5, ay);
  ctx.arc(ax, ay, Rd * 0.5, 0, TAU);
  for (let i = 0; i < 36; i++) {
    const an = (i / 36) * TAU, r1 = Rd * 0.62, r2 = Rd * (i % 3 === 0 ? 0.76 : 0.69);
    ctx.moveTo(ax + Math.cos(an) * r1, ay + Math.sin(an) * r1);
    ctx.lineTo(ax + Math.cos(an) * r2, ay + Math.sin(an) * r2);
  }
  ctx.strokeStyle = `rgba(${COL[2]},${0.55 * kL})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Las puntas: la izquierda fija en el centro del círculo y la derecha, que debería trazarlo
  const kP = suave((d - 0.42) / 0.2);
  if (kP > 0.01) {
    // El círculo del principio, ahora a la vista como lo que el compás habría trazado
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      anillo((i / 72) * TAU, 1, 0, 0, 0, 0, 0, L);
      proyectar(e, cam, L[0], L[1], L[2]);
      if (!P[2]) continue;
      if (i === 0) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]);
    }
    ctx.strokeStyle = `rgba(${COL[2]},${0.34 * kP})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    for (const tp of [TIP_I, TIP_D]) {
      proyectar(e, cam, tp[0], tp[1], tp[2]);
      if (P[2]) luzPunta(ctx, P[0], P[1], e.rr * clamp(P[2] * 2.2, 0.5, 1.1), kP * 0.9);
    }
  }
  if (spr) {
    const h = spr.halo;
    // La luz recorre el círculo del principio y se queda corta; después, un latido muy lento
    const uc = ven(d, 0.5, 0.78);
    if (uc > 0) pulso(ctx, h, e, cam, ORB_BASE, uc * TAU * 1.4, 1.3, campana(uc) * 0.95, 2);
    else if (kEst > 0.01) pulso(ctx, h, e, cam, ORB_BASE, t * 0.3, 0.8, 0.42 * kEst * (0.6 + 0.4 * Math.sin(t * 0.5)), 2);
    // La brecha entre la punta y el círculo
    const fb = suave((d - 0.5) / 0.14);
    if (fb > 0.02) destello(ctx, h, e, cam, 0.935, 0.01, 0, fb * (0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(t * 1.7 + d * 36)), 3)));
    // Pequeñas luces en los anillos colosales: se descubren al mirar
    const kT = suave((d - 0.55) / 0.25);
    if (kT > 0.02) {
      const sp = 2.5;
      const CA: OrbitaP = { r: 4.2, rx: 1.35, ry: 0.2, cz: 3.2, rz: sp * 0.06 };
      const CB: OrbitaP = { r: 6, rx: 1.45, ry: -0.25, cz: 5, rz: -sp * 0.04 };
      const NT = m.denso ? 10 : 6;
      for (let i = 0; i < NT; i++) {
        const o = i % 2 ? CB : CA;
        anillo(0.5 + i * 1.37, o.r, o.rx, o.ry, 0, 0, o.cz, L, o.rz);
        proyectar(e, cam, L[0], L[1], L[2]);
        if (!P[2]) continue;
        const nb = niebla(P[3], cam, e.R);
        const f = Math.pow(Math.max(0, Math.sin(t * 0.7 + i * 2.1 + d * 5)), 12);
        halo(ctx, h, P[0], P[1], (6 + 5 * f) * clamp(P[2] * 2, 0.8, 1.8), kT * (0.3 + 0.7 * f) * nb);
      }
    }
  }
}
