import { CLASES, DOCUMENTOS, PIEZAS, type LecturaId } from "@/content/glenn-archivo";

/**
 * Composiciones del «Archivo vivo». Cada pieza tiene una pose por lectura:
 * x, y en % del escenario (centro de la pieza), z en cqmin (profundidad), giros en
 * grados y escala. El CSS interpola entre poses (transiciones espaciales).
 */
export type Pose = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number };
/** escudo: forma parte de la máscara (se aparta con la lente); fondo: atenuada */
export type Papel = { pose: Pose; escudo?: boolean; fondo?: boolean };

const p = (x: number, y: number, z = 0, rz = 0, ry = 0, rx = 0, s = 1): Pose => ({ x, y, z, rx, ry, rz, s });

/** Generador determinista: las mismas poses en el servidor y en el cliente */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };
}

const IDS_DOCS = DOCUMENTOS.map((d) => d.id);
const LETRAS = PIEZAS.filter((q) => q.tipo === "letra").map((q) => q.id);
const PESTANAS = PIEZAS.filter((q) => q.tipo === "pestana").map((q) => q.id);
const SUELTAS = PIEZAS.filter((q) => q.tipo !== "letra" && q.tipo !== "pestana").map((q) => q.id);
const de = (l: LecturaId) => DOCUMENTOS.filter((d) => d.lectura === l).map((d) => d.id);

/** Una elipse de piezas al fondo: la silueta en la que se arma el retrato */
function anillo(ids: string[], semilla: number, cx = 50, cy = 50, rx = 41, ry = 40, z = -60): Record<string, Papel> {
  const r = azar(semilla);
  return Object.fromEntries(
    ids.map((id, i) => {
      const t = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
      const c = Math.cos(t);
      return [id, { pose: p(cx + c * rx + r() * 4, cy + Math.sin(t) * ry + r() * 4, z + r() * 40, r() * 18, -c * 28, 0, 0.9), fondo: true }];
    }),
  );
}

function retrato(): Record<string, Papel> {
  const out: Record<string, Papel> = {};
  // El nombre en construcción: letras desalineadas en profundidad
  const ys = [47, 54, 45, 52, 49];
  const zs = [10, -8, 22, -2, 14];
  LETRAS.forEach((id, i) => (out[id] = { pose: p(31 + i * 9.5, ys[i], zs[i], [-5, 4, -2, 6, -3][i], 12 - i * 6) }));
  // Los cuatro documentos de la lectura, delante, en las esquinas del nombre
  const esquinas = [p(25, 22, 26, -6, 8), p(74, 24, 30, 5, -10), p(26, 79, 18, 4, 6), p(75, 78, 22, -5, -8)];
  de("retrato").forEach((id, i) => (out[id] = { pose: esquinas[i] }));
  // El resto, en una elipse al fondo
  const resto = [...de("mascara"), ...de("archivo"), ...PESTANAS, ...SUELTAS];
  return { ...out, ...anillo(resto, 7) };
}

function mascara(): Record<string, Papel> {
  const out: Record<string, Papel> = {};
  const r = azar(19);
  // El escudo: una superficie curva de hojas solapadas delante de todo
  const escudo = [...LETRAS, ...de("retrato"), ...PESTANAS, ...SUELTAS];
  const cols = 5;
  escudo.forEach((id, i) => {
    const c = i % cols;
    const f = Math.floor(i / cols);
    const x = 25 + c * 12.5 + r() * 3 + (f % 2) * 3;
    const y = 22 + f * 17 + r() * 3;
    const z = 34 - ((x - 50) ** 2) / 55 - ((y - 50) ** 2) / 90;
    out[id] = { pose: p(x, y, z, r() * 14, (50 - x) * 0.9, (y - 50) * 0.5, 1.12), escudo: true };
  });
  // Detrás del escudo, los tres documentos de la máscara
  const ocultos = [p(40, 38, -34, -4, 4), p(61, 50, -40, 5, -4), p(45, 68, -30, 3, 2)];
  de("mascara").forEach((id, i) => (out[id] = { pose: ocultos[i] }));
  // Los del archivo, lejos, a los lados
  de("archivo").forEach((id, i) => {
    out[id] = { pose: p(i % 2 ? 93 : 7, 22 + i * 14, -130, r() * 10, i % 2 ? -35 : 35), fondo: true };
  });
  return out;
}

function archivo(): Record<string, Papel> {
  const out: Record<string, Papel> = {};
  const r = azar(31);
  const xs = [17, 39, 61, 83];
  // Cuatro cajones: una pestaña por clase y sus documentos en fila hacia el fondo
  CLASES.forEach((c, i) => {
    out[`pestana-${c.id}`] = { pose: p(xs[i], 13, 18, 0, 0, -8) };
    DOCUMENTOS.filter((d) => d.clase === c.id).forEach((d, k) => {
      out[d.id] = { pose: p(xs[i] + r() * 2, 30 + k * 8.5, -12 + k * 6, r() * 5, 0, -10, 0.82) };
    });
  });
  // Lo que no se clasifica queda al fondo, como material sin ordenar
  [...LETRAS, ...SUELTAS].forEach((id, i) => {
    out[id] = { pose: p(10 + (i % 6) * 16 + r() * 4, i < 6 ? 92 : 6, -150 + r() * 30, r() * 30, 0, 20), fondo: true };
  });
  return out;
}

export const COMPOSICIONES: Record<LecturaId, Record<string, Papel>> = {
  retrato: retrato(),
  mascara: mascara(),
  archivo: archivo(),
};

/** Qué documentos se pueden tocar en cada lectura (en el archivo, los doce) */
export const ACTIVOS: Record<LecturaId, string[]> = { retrato: de("retrato"), mascara: de("mascara"), archivo: IDS_DOCS };

/** Radio de la lente (en % de la dimensión menor del escenario) */
export const RADIO_LENTE = 24;

/**
 * Aparta las hojas del escudo alrededor de la lente: cuanto más cerca, más lejos
 * se van. Devuelve el desplazamiento de cada hoja (cqmin) y su giro extra.
 */
export function apartar(lente: { x: number; y: number } | null, aspecto: number) {
  const out: Record<string, { ax: number; ay: number; ag: number }> = {};
  for (const [id, papel] of Object.entries(COMPOSICIONES.mascara)) {
    if (!papel.escudo) continue;
    if (!lente) {
      out[id] = { ax: 0, ay: 0, ag: 0 };
      continue;
    }
    const { dx, dy, d } = distancia(papel.pose, lente, aspecto);
    const f = Math.max(0, 1 - d / RADIO_LENTE);
    const fuerza = f * f * (3 - 2 * f) * 26;
    out[id] = d < 0.01 ? { ax: 0, ay: -fuerza, ag: 0 } : { ax: (dx / d) * fuerza, ay: (dy / d) * fuerza, ag: (dx >= 0 ? 1 : -1) * fuerza * 0.8 };
  }
  return out;
}

/** Distancia en % de la dimensión menor (corrige la proporción del escenario) */
export function distancia(a: { x: number; y: number }, b: { x: number; y: number }, aspecto: number) {
  const ancho = aspecto >= 1 ? aspecto : 1;
  const alto = aspecto >= 1 ? 1 : 1 / aspecto;
  const dx = (a.x - b.x) * ancho;
  const dy = (a.y - b.y) * alto;
  return { dx, dy, d: Math.hypot(dx, dy) };
}

/** Los documentos ocultos de la máscara que la lente deja ver */
export function descubiertos(lente: { x: number; y: number } | null, aspecto: number) {
  if (!lente) return [];
  return de("mascara").filter((id) => distancia(COMPOSICIONES.mascara[id].pose, lente, aspecto).d < RADIO_LENTE * 0.62);
}
