/**
 * Geometría de «El desierto imposible». Todo es determinista (semilla fija):
 * el servidor y el cliente generan exactamente los mismos trazados.
 */

/** Generador pseudoaleatorio pequeño y estable (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

/** Piedra orgánica: elipse con el contorno alterado y suavizado (Catmull-Rom → Bézier). */
export function piedra(cx: number, cy: number, rx: number, ry: number, seed: number, jitter = 0.1, n = 10) {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() * 2 - 1) * jitter;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const p = (i: number) => pts[(i + n) % n];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/**
 * Pieza que se separa al deconstruir: desplazamiento y giro en unidades del SVG,
 * y escala (s) para dar profundidad: > 1 se acerca al espectador, < 1 se aleja.
 */
export type Pieza = { d: string; dx: number; dy: number; r: number; s?: number };

/* ── El mojón invertido: piedras de menor a mayor, de abajo arriba ── */
export const MOJON = {
  viewBox: "0 176 220 376",
  apoyo: { x: 110, y: 549 },
  piedras: [
    { d: piedra(110, 540, 11, 9, 11), dx: 6, dy: 10, r: 0, s: 1.1 },
    { d: piedra(112, 516, 20, 14, 23), dx: -34, dy: 0, r: -12, s: 0.92 },
    { d: piedra(106, 480, 33, 21, 37), dx: 40, dy: -12, r: 9, s: 1.06 },
    { d: piedra(113, 428, 50, 30, 41), dx: -46, dy: -28, r: -7, s: 0.94 },
    { d: piedra(104, 352, 70, 42, 53), dx: 48, dy: -46, r: 6, s: 1.05 },
    { d: piedra(110, 246, 96, 60, 67, 0.08), dx: -20, dy: -70, r: -4, s: 0.97 },
  ] satisfies Pieza[],
};

/* ── La roca sobre la aguja: un bloque partido en tres por sus grietas ── */
export const ROCA = {
  viewBox: "0 0 400 420",
  cuerpo: piedra(200, 172, 186, 150, 91, 0.09, 12),
  /** Estratos: líneas casi horizontales que dan volumen y peso. */
  estratos: [
    "M0 92 Q120 70 230 88 T400 84",
    "M0 140 Q140 118 250 140 T400 132",
    "M0 196 Q110 178 220 196 T400 188",
    "M0 250 Q150 232 260 252 T400 244",
  ],
  /** Grietas: se recortan a la silueta y coinciden con los bordes de las piezas. */
  grietas: ["M226 0 L200 120 L242 190 L216 340", "M200 120 L120 132 L0 162"],
  piezas: [
    { clip: "0,0 226,0 200,120 120,132 0,162", dx: -64, dy: -40, r: -10, s: 0.95 },
    { clip: "226,0 400,0 400,340 216,340 242,190 200,120", dx: 70, dy: -26, r: 8, s: 1.05 },
    { clip: "0,162 120,132 200,120 242,190 216,340 0,340", dx: -24, dy: 34, r: 5, s: 1.02 },
  ],
  aguja: "M195 414 L205 414 L200.6 300 L199.4 300 Z",
};

/* ── El monolito suspendido: aguja de piedra en tambores ── */
const ancho = (y: number) => 17 + ((y - 90) / 380) * 6; // semiancho: se ensancha hacia abajo
const tambor = (y1: number, y2: number) =>
  `M${f(60 - ancho(y1))} ${y1} L${f(60 + ancho(y1))} ${y1} L${f(60 + ancho(y2))} ${y2} L${f(60 - ancho(y2))} ${y2} Z`;
export const MONOLITO = {
  viewBox: "0 0 120 600",
  apice: { x: 60, y: 40 },
  piezas: [
    { d: `M${f(60 - ancho(90))} 90 L60 40 L${f(60 + ancho(90))} 90 Z`, dx: 0, dy: -52, r: 5, s: 1.04 },
    { d: tambor(90, 185), dx: -18, dy: -26, r: -3, s: 0.94 },
    { d: tambor(185, 280), dx: 20, dy: 0, r: 3, s: 1.06 },
    { d: tambor(280, 375), dx: -16, dy: 26, r: -2, s: 0.96 },
    { d: tambor(375, 470), dx: 14, dy: 52, r: 2, s: 1.03 },
  ] satisfies Pieza[],
};

/* ── La puerta en el horizonte ── */
export const PUERTA = {
  viewBox: "0 0 140 160",
  piezas: [
    { d: "M8 22 L132 22 L130 42 L10 42 Z", dx: 0, dy: -34, r: -5, s: 1.04 },
    { d: "M22 42 L40 42 L41 160 L21 160 Z", dx: -24, dy: 0, r: -4 },
    { d: "M100 42 L118 42 L119 160 L99 160 Z", dx: 24, dy: 0, r: 4 },
  ] satisfies Pieza[],
  /** Figura humana genérica, para dar la escala. */
  figura: "M68.6 160 L69.4 147 L68.2 146 L68.8 139 Q70 136.6 71.2 139 L71.8 146 L70.6 147 L71.4 160 Z",
  cabeza: { cx: 70, cy: 135.2, r: 1.9 },
};

/* ── Horizonte (viewBox 0 0 1600 200, se estiran a lo ancho) ── */
/** Mesetas lejanas, veladas por la bruma: dan escala y profundidad al horizonte. */
export const MESAS =
  "M0 200 L0 150 L90 150 L118 120 L258 115 L286 141 L520 147 L556 106 L640 99 L702 101 L734 139 L1000 151 L1178 148 L1212 113 L1330 108 L1362 141 L1600 147 L1600 200 Z";
export const DUNAS = {
  lejos: "M0 120 C200 80 380 70 560 100 S900 58 1100 92 S1420 66 1600 96 L1600 200 L0 200 Z",
  medio: "M0 150 C250 108 430 142 700 120 S1150 152 1350 116 S1550 132 1600 126 L1600 200 L0 200 Z",
};
