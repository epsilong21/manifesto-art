/**
 * Geometría y dibujo de «El límite» y «Más allá de la medida» (canvas 2D, sin dependencias).
 *
 * Todo es función pura del progreso: pintar(b, q) dibuja siempre el mismo fotograma, sin estado ni bucle
 * propio. Las unidades del «mundo» son anchos de la lámina, con el origen en el centro de la imagen.
 * La imagen original no se toca: esta capa se dibuja encima, en un canvas independiente.
 */
import { ANCIANO_IMG, PUNTOS } from "@/content/anciano";

const RATIO = ANCIANO_IMG.ratio;
export type V = { x: number; y: number };

export const aMundo = (p: V): V => ({ x: p.x - 0.5, y: (p.y - 0.5) * RATIO });
export const FOCO_URIZEN = aMundo(PUNTOS.urizen);
export const FOCO_COMPAS = aMundo(PUNTOS.compas);
/** Centro del primer círculo: la punta izquierda del compás. */
export const CENTRO = aMundo(PUNTOS.puntaIzq);
const PUNTA_DER = aMundo(PUNTOS.puntaDer);
export const RADIO = Math.hypot(PUNTA_DER.x - CENTRO.x, PUNTA_DER.y - CENTRO.y);
const THETA0 = Math.atan2(PUNTA_DER.y - CENTRO.y, PUNTA_DER.x - CENTRO.x);
const TAU = Math.PI * 2;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const suave = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
export const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── Ruido de valor determinista ── */
function hash(ix: number, iy: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function ruido(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return mezcla(mezcla(a, b, u), mezcla(c, d, u), v);
}
const campo = (x: number, y: number) => ruido(x * 1.9 + 3.1, y * 1.9 - 1.3) * Math.PI * 3.2;

/* ── Primitivas ── */
type Prim = {
  pts: Float32Array;
  /** Intervalo del progreso de la escena 02 en el que se traza. */
  t0: number;
  t1: number;
  w: number;
  a: number;
  /** 0 oro · 1 carmesí · 2 luz */
  c: 0 | 1 | 2;
  glow?: boolean;
};
export type Geo = { prims: Prim[]; semillas: V[]; fuerte: boolean };

function linea(a: V, b: V, n: number): number[] {
  const o: number[] = [];
  for (let i = 0; i <= n; i++) o.push(mezcla(a.x, b.x, i / n), mezcla(a.y, b.y, i / n));
  return o;
}
function circulo(c: V, r: number, n: number, th0 = THETA0): number[] {
  const o: number[] = [];
  for (let i = 0; i <= n; i++) o.push(c.x + Math.cos(th0 + (i / n) * TAU) * r, c.y + Math.sin(th0 + (i / n) * TAU) * r);
  return o;
}
function poligono(c: V, r: number, lados: number, seg: number): number[] {
  const o: number[] = [];
  for (let s = 0; s < lados; s++) {
    const a = { x: c.x + Math.cos(THETA0 + (s / lados) * TAU) * r, y: c.y + Math.sin(THETA0 + (s / lados) * TAU) * r };
    const b = { x: c.x + Math.cos(THETA0 + ((s + 1) / lados) * TAU) * r, y: c.y + Math.sin(THETA0 + ((s + 1) / lados) * TAU) * r };
    const l = linea(a, b, seg);
    o.push(...(s ? l.slice(2) : l));
  }
  return o;
}

/** `denso`: 1 en escritorio, 0.55 en móvil o equipos modestos. */
export function crearGeo(denso: number): Geo {
  const prims: Prim[] = [];
  const add = (pts: number[], t0: number, t1: number, w: number, a: number, c: Prim["c"] = 0, glow = false) =>
    prims.push({ pts: new Float32Array(pts), t0, t1, w, a, c, glow });
  const nc = Math.round(150 * denso);

  add(linea(CENTRO, PUNTA_DER, 30), 0, 0.08, 1.6, 1, 2, true);
  add(circulo(CENTRO, RADIO, nc), 0.08, 0.38, 1.5, 1, 2, true);
  [0.82, 0.62, 0.42, 0.22].forEach((f, i) => add(circulo(CENTRO, RADIO * f, nc), 0.36 + i * 0.05, 0.52 + i * 0.05, 1, 0.7));
  add(circulo(CENTRO, RADIO * 1.16, nc), 0.5, 0.68, 0.8, 0.5);
  for (let i = 0; i < 12; i++) {
    const a = THETA0 + (i / 12) * TAU;
    add(linea(CENTRO, { x: CENTRO.x + Math.cos(a) * RADIO * 1.16, y: CENTRO.y + Math.sin(a) * RADIO * 1.16 }, 22), 0.44 + (i % 4) * 0.015, 0.68, 0.7, 0.4);
  }
  add(poligono(CENTRO, RADIO, 3, 22), 0.56, 0.76, 1.1, 0.8, 2);
  add(poligono(CENTRO, RADIO * 0.82, 6, 14), 0.6, 0.8, 1, 0.7);
  for (let i = 0; i < 6; i++) {
    const a = THETA0 + (i / 6) * TAU;
    add(circulo({ x: CENTRO.x + Math.cos(a) * RADIO * 0.5, y: CENTRO.y + Math.sin(a) * RADIO * 0.5 }, RADIO * 0.5, Math.round(80 * denso), a + Math.PI), 0.66 + i * 0.02, 0.88, 0.9, 0.55, 1);
  }
  const ticks = Math.round(72 * denso);
  for (let i = 0; i < ticks; i++) {
    const a = THETA0 + (i / ticks) * TAU;
    const r0 = RADIO * 1.2, r1 = RADIO * (i % 6 === 0 ? 1.32 : 1.26);
    const t0 = 0.8 + (i / ticks) * 0.12;
    add(linea({ x: CENTRO.x + Math.cos(a) * r0, y: CENTRO.y + Math.sin(a) * r0 }, { x: CENTRO.x + Math.cos(a) * r1, y: CENTRO.y + Math.sin(a) * r1 }, 3), t0, t0 + 0.08, 0.9, 0.6, 0);
  }

  const semillas: V[] = [];
  const n = Math.round(130 * denso);
  for (let i = 0; i < n; i++) {
    const a = hash(i, 7) * TAU, r = RADIO * [0.22, 0.42, 0.62, 0.82, 1, 1.2][i % 6];
    semillas.push({ x: CENTRO.x + Math.cos(a) * r, y: CENTRO.y + Math.sin(a) * r });
  }
  return { prims, semillas, fuerte: denso >= 0.9 };
}

/* ── Dibujo ── */
export type Cuadro = {
  ctx: CanvasRenderingContext2D;
  /** Tamaño del lienzo en píxeles CSS. */
  w: number;
  h: number;
  camX: number;
  camY: number;
  /** Escala de cámara en anchos de lámina. */
  k: number;
  /** Ancho de la lámina en píxeles a escala 1. */
  ancho: number;
  /** Progreso local de la escena 02 (0–1) y de la 03 (0–1). */
  b: number;
  q: number;
};
const COL: [string, string, string] = ["199,141,67", "168,76,52", "232,204,152"];

export function pintar(g: Geo, f: Cuadro) {
  const { ctx, w, h, camX, camY, k, ancho, b, q } = f;
  ctx.clearRect(0, 0, w, h);
  if (b <= 0 && q <= 0) return;
  const esc = k * ancho;
  const sx = (x: number) => w / 2 + (x - camX) * esc;
  const sy = (y: number) => h / 2 + (y - camY) * esc;

  // Resplandor de fondo: un núcleo cálido que contiene el orden y se abre al disolverlo.
  const cxp = sx(CENTRO.x), cyp = sy(CENTRO.y);
  const rg = RADIO * esc * mezcla(1.1, 1.7, suave(q));
  const alfaG = suave((b - 0.4) / 0.5) * mezcla(0.2, 0.15, suave(q));
  if (alfaG > 0.005) {
    const gr = ctx.createRadialGradient(cxp, cyp, 0, cxp, cyp, rg);
    gr.addColorStop(0, `rgba(${COL[2]},${alfaG})`);
    gr.addColorStop(0.35, `rgba(${COL[0]},${alfaG * 0.45})`);
    gr.addColorStop(1, `rgba(${COL[0]},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const amp = Math.pow(q, 1.5) * RADIO * 0.55;
  const diss = suave((q - 0.1) / 0.55) * 0.96;
  const apaga = 1 - 0.55 * suave((q - 0.35) / 0.5);

  const pt = (x: number, y: number): [number, number] => {
    if (q <= 0) return [sx(x), sy(y)];
    const dx = x - CENTRO.x, dy = y - CENTRO.y;
    const d = Math.hypot(dx, dy);
    const rot = 0.6 * q * Math.min(1, d / RADIO);
    const c = Math.cos(rot), s = Math.sin(rot);
    const rx = CENTRO.x + dx * c - dy * s, ry = CENTRO.y + dx * s + dy * c;
    return [sx(rx + (ruido(x * 2.3 + 7, y * 2.3) - 0.5) * 2 * amp), sy(ry + (ruido(x * 2.3, y * 2.3 + 11) - 0.5) * 2 * amp)];
  };

  let idx = 0;
  for (const p of g.prims) {
    idx++;
    const fr = suave((b - p.t0) / (p.t1 - p.t0));
    if (fr <= 0) continue;
    const n = p.pts.length / 2;
    const tope = fr * (n - 1);
    const lleno = Math.floor(tope);
    const pasadas = p.glow && g.fuerte ? 2 : 1;
    for (let pasada = 0; pasada < pasadas; pasada++) {
      const glow = p.glow && pasada === 0 && pasadas === 2;
      ctx.strokeStyle = `rgba(${COL[p.c]},${(glow ? 0.14 : p.a) * apaga})`;
      ctx.lineWidth = glow ? p.w * 5 : p.w;
      ctx.beginPath();
      let abierto = false;
      for (let i = 0; i <= lleno + 1 && i < n; i++) {
        let x = p.pts[i * 2], y = p.pts[i * 2 + 1];
        if (i === lleno + 1) {
          const t = tope - lleno;
          x = mezcla(p.pts[lleno * 2], x, t);
          y = mezcla(p.pts[lleno * 2 + 1], y, t);
        }
        const roto = diss > 0 && i > 0 && hash(idx * 131 + i, 3) < diss;
        const [px, py] = pt(x, y);
        if (!abierto || roto) { ctx.moveTo(px, py); abierto = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  // Cabeza del compás mientras el círculo principal se traza.
  const c0 = suave((b - 0.08) / 0.3);
  if (b > 0.08 && c0 < 1 && q <= 0) {
    const a = THETA0 + c0 * TAU;
    const hx = sx(CENTRO.x + Math.cos(a) * RADIO), hy = sy(CENTRO.y + Math.sin(a) * RADIO);
    const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, 14);
    gr.addColorStop(0, `rgba(${COL[2]},0.95)`);
    gr.addColorStop(1, `rgba(${COL[2]},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(hx - 14, hy - 14, 28, 28);
  }

  if (q > 0.15) organico(g, f, sx, sy);
}

/** Hebras y partículas que siguen un campo suave: lo libre que sustituye a lo medido. */
function organico(g: Geo, f: Cuadro, sx: (x: number) => number, sy: (y: number) => number) {
  const { ctx, q } = f;
  const paso = RADIO * 0.022;
  const subida = suave((q - 0.18) / 0.7);
  const pasos = Math.floor(subida * (g.fuerte ? 44 : 36));
  const hebras = g.fuerte ? 28 : 20;
  // En equipos modestos hay menos elementos: cada uno pesa más para que la escena no quede vacía.
  const peso = g.fuerte ? 1 : 1.35;
  ctx.lineWidth = 1.1 * peso;
  // Campo con remolino: las hebras giran y se abren alrededor del centro de la composición, sin deriva hacia un lado.
  const rumbo = (x: number, y: number, s: number) => {
    const dx = x - CENTRO.x, dy = y - CENTRO.y;
    const t = Math.atan2(dy, dx) + Math.PI / 2 + (s % 2 ? 0.35 : -0.35);
    const l = campo(x, y);
    return Math.atan2(Math.sin(l) * 0.55 + Math.sin(t) * 0.45, Math.cos(l) * 0.55 + Math.cos(t) * 0.45);
  };
  for (let s = 0; s < hebras; s++) {
    const sem = g.semillas[(s * 5) % g.semillas.length];
    let x = sem.x, y = sem.y;
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y));
    for (let i = 0; i < pasos; i++) {
      const a = rumbo(x, y, s);
      x += Math.cos(a) * paso;
      y += Math.sin(a) * paso;
      ctx.lineTo(sx(x), sy(y));
    }
    ctx.strokeStyle = `rgba(${COL[s % 3 === 2 ? 1 : 0]},${0.55 * subida * (g.fuerte ? 1 : 1.2)})`;
    ctx.stroke();
  }
  const mov = Math.floor(q * q * 34);
  const brillo = Math.min(1, q * 1.6);
  for (let i = 0; i < g.semillas.length; i++) {
    let x = g.semillas[i].x, y = g.semillas[i].y;
    for (let m = 0; m < mov; m++) {
      const a = rumbo(x, y, i) + (hash(i, 9) - 0.5) * 0.8;
      x += Math.cos(a) * paso * 1.4;
      y += Math.sin(a) * paso * 1.4;
    }
    ctx.fillStyle = `rgba(${COL[i % 4 === 0 ? 2 : 0]},${0.75 * brillo * (0.5 + hash(i, 5) * 0.5)})`;
    const r = (0.8 + hash(i, 4) * 1.4) * peso;
    ctx.fillRect(sx(x) - r / 2, sy(y) - r / 2, r, r);
  }
}
