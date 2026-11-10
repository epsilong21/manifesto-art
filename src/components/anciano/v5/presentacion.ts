import { FRAGMENTOS_V5, PRESENTACION_V5 } from "@/content/anciano-v5";
import { clamp, suave } from "../limiteGeom";

/**
 * Modo presentación: guion temporal del recorrido. El progreso narrativo (0–1) sigue siendo la única fuente de verdad: este
 * módulo solo traduce «tiempo de presentación» ↔ «progreso» y «posición narrativa» → «valor de cada mando». La escena, el scroll y el
 * indicador de acto siguen leyendo ese progreso como siempre.
 */

export type Limites = { e1: number; e2: number; e3: number; e4: number };
export type Tramo = 1 | 2 | 3 | 4 | 5;

/** Tramo y progreso local (0–1) de un progreso global */
export function trLocal(p: number, l: Limites): { tr: Tramo; local: number } {
  const tr: Tramo = p < l.e1 ? 1 : p < l.e2 ? 2 : p < l.e3 ? 3 : p < l.e4 ? 4 : 5;
  const local = tr === 1 ? p / l.e1 : tr === 2 ? (p - l.e1) / (l.e2 - l.e1) : tr === 3 ? (p - l.e2) / (l.e3 - l.e2) : tr === 4 ? (p - l.e3) / (l.e4 - l.e3) : (p - l.e4) / (1 - l.e4);
  return { tr, local };
}

/** Progreso global de un tramo y un progreso local */
export function pDe(tr: Tramo, local: number, l: Limites): number {
  const a = [0, l.e1, l.e2, l.e3, l.e4, 1];
  return a[tr - 1] + clamp(local) * (a[tr] - a[tr - 1]);
}

/** Un fragmento del guion: del instante t0 al t1 el progreso va de p0 a p1 (deriva lenta y, en la segunda parte, el viaje hasta el fragmento siguiente) */
type Seg = { t0: number; t1: number; p0: number; p1: number; viaje: number; fr: number };
export type Guion = { total: number; seg: Seg[] };

export function crearGuion(l: Limites): Guion {
  const seg: Seg[] = [];
  let t = 0;
  FRAGMENTOS_V5.forEach((fg, i) => {
    const sig = FRAGMENTOS_V5[i + 1];
    const hasta = sig && sig.tramo === fg.tramo ? sig.desde : 1;
    const d = PRESENTACION_V5.segundos[i] ?? 10;
    seg.push({ t0: t, t1: t + d, p0: pDe(fg.tramo, fg.desde, l), p1: pDe(fg.tramo, hasta, l), viaje: PRESENTACION_V5.viaje, fr: i });
    t += d;
  });
  return { total: t, seg };
}

/** Avance dentro de un fragmento: deriva muy lenta al principio (la escena respira mientras se lee) y viaje suave hasta el siguiente */
function curva(u: number, viaje: number): number {
  return 0.15 * u + 0.85 * suave((u - (1 - viaje)) / viaje);
}

/** Progreso en el instante t (segundos a 1×) */
export function pEn(g: Guion, t: number): number {
  if (t <= 0) return g.seg[0].p0;
  const s = g.seg.find((x) => t < x.t1);
  if (!s) return g.seg[g.seg.length - 1].p1;
  return s.p0 + (s.p1 - s.p0) * curva((t - s.t0) / (s.t1 - s.t0), s.viaje);
}

/** Instante en el que se alcanza el progreso p (inversa de `pEn`, por bisección) */
export function tEn(g: Guion, p: number): number {
  const s = g.seg.find((x) => p <= x.p1 + 1e-9) ?? g.seg[g.seg.length - 1];
  let a = 0, b = 1;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2;
    if (s.p0 + (s.p1 - s.p0) * curva(m, s.viaje) < p) a = m; else b = m;
  }
  return s.t0 + ((a + b) / 2) * (s.t1 - s.t0);
}

/** Inicio (en progreso global) de cada fragmento: las «etapas» del recorrido por pasos con movimiento reducido */
export function etapas(l: Limites): number[] {
  return FRAGMENTOS_V5.map((fg) => pDe(fg.tramo, Math.min(0.999, fg.desde + 0.004), l));
}

export type Controles = { giro: number; tilt: number; abre: number; plano: number };
const REPOSO: Controles = { giro: 0, tilt: 0, abre: 0, plano: 0.5 };

function pista(k: readonly (readonly [number, number])[], q: number, defecto: number): number {
  if (!k.length || q <= k[0][0]) return k.length ? (q < k[0][0] ? defecto : k[0][1]) : defecto;
  for (let i = 1; i < k.length; i++) {
    if (q <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * suave((q - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
  }
  return k[k.length - 1][1];
}

/** Valor de cada mando en la posición narrativa q = (tramo − 1) + progreso local: la coreografía de las interacciones */
export function controlesEn(q: number): Controles {
  const c = PRESENTACION_V5.controles;
  return { giro: pista(c.giro, q, REPOSO.giro), tilt: pista(c.tilt, q, REPOSO.tilt), abre: pista(c.abre, q, REPOSO.abre), plano: pista(c.plano, q, REPOSO.plano) };
}
