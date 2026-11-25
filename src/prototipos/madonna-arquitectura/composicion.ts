/**
 * «La arquitectura de lo imposible» — geometría, cámara y alineación (V1.3B)
 *
 * Única fuente de verdad de la composición: la usan el shader (posiciones y
 * medidas de los fragmentos) y la métrica de alineación (reproyección). Sin DOM
 * ni WebGL: se puede comprobar con Node.
 *
 * SISTEMAS DE COORDENADAS
 *  · Mundo: unidades arbitrarias de MANIFESTO, y hacia arriba, cámara alineada
 *    sobre +z mirando hacia -z. Sin escala histórica: es interpretación.
 *  · Pantalla (uv): el origen es el centro del lienzo y la altura va de -0.5 a
 *    +0.5. La anchura va de -aspecto/2 a +aspecto/2. Es exactamente lo que usa
 *    el shader: uv = (gl_FragCoord.xy - 0.5·res) / res.y.
 *  · Proyección: uv = (p·cu, p·cv) / (p·cw) · FOCO, con p = mundo - ojo. El
 *    shader emite rd = cu·uv.x + cv·uv.y + cw·FOCO, que es la misma ecuación.
 *
 * V1.3B — COMPOSICIÓN DERIVADA DE LA PANTALLA
 *  Cada fragmento se declara por dónde debe verse en la vista alineada
 *  (porcentajes de H, la altura de la composición, sobre la distribución de la
 *  pintura de 1949) y a qué profundidad está. Las posiciones de mundo se
 *  obtienen retropropagando esa pantalla con la cámara alineada; no hay
 *  coordenadas de mundo escritas a mano. Medidas de la pintura: informe V1.3A
 *  (estimadas sobre una reproducción de 768×986, ±0,5 % de H); son una
 *  interpretación de MANIFESTO, no una reconstrucción documental.
 *
 *  % de H: x desde el eje central (positivo a la derecha), y desde la parte
 *  superior de la concha (0) hasta la base del pedestal (100).
 */

export type V3 = readonly [number, number, number];

export const DIST = 6;
/** Altura del ojo y del punto de mira de la cámara alineada: el horizonte queda a nivel de ojo (uv.y = 0). */
export const CENTRO_Y = 0.9086;
export const CENTRO: V3 = [0, CENTRO_Y, 0];

/** Altura de la composición alineada en uv con foco 1 (concha arriba → base del pedestal). */
export const H_UV = 0.92;

/** Margen de seguridad de la composición dentro del lienzo (fracción de la mitad del lienzo). */
export const SEGURO = { v: 0.9, h: 0.92 };

/** Tolerancias de alineación, normalizadas por la diagonal de la composición proyectada. */
export const TOL_ALINEADO = 0.012;
export const TOL_LEJOS = 0.15;

/* ── Pantalla → mundo ── */
/** Un % de H, expresado en unidades de mundo sobre un plano a distancia `d` de la cámara alineada. */
const mundoDe = (pct: number, d: number) => (pct / 100) * H_UV * d;
/** y de mundo de un punto que se ve a `yp` % de H (desde arriba), sobre el plano a distancia `d`. */
const yMundo = (yp: number, d: number) => CENTRO_Y + (0.5 - yp / 100) * H_UV * d;
/** z de mundo del centro de una pieza cuyo frente está a distancia `dFrente` y tiene espesor `prof`. */
const zCentro = (dFrente: number, prof: number) => DIST - dFrente - prof / 2;

/* ═════════════ Medidas de la pintura (objetivo de la vista alineada) ═════════════ */
export type Rect = { x0: number; x1: number; y0: number; y1: number };

/** Silueta objetivo de cada fragmento, en % de H (se comprueba con el mapa de identificadores de la GPU). */
export const PINTURA: Record<string, Rect> = {
  concha: { x0: -5.25, x1: 5.25, y0: 0, y1: 5.1 },
  huevo: { x0: -1.05, x1: 1.05, y0: 13.6, y1: 16.6 },
  "cornisa izquierda": { x0: -24, x1: -4, y0: 9, y1: 29 },
  "cornisa derecha": { x0: 4, x1: 24, y0: 9, y1: 29 },
  "bloque superior izquierdo": { x0: -24, x1: -10.2, y0: 36.7, y1: 56.5 },
  "bloque superior derecho": { x0: 10.2, x1: 24, y0: 36.7, y1: 56.5 },
  "bloque inferior izquierdo": { x0: -23.8, x1: -13.5, y0: 55.4, y1: 79.2 },
  "bloque inferior derecho": { x0: 13.5, x1: 23.8, y0: 55.4, y1: 79.2 },
  pedestal: { x0: -34, x1: 34, y0: 84, y1: 100 },
};

/* Distancias de los planos frontales a la cámara alineada (profundidad espacial entre piezas) */
const D = { concha: 4, huevo: 4.6, cornisa: 6, sup: 7, inf: 7.6, pedestal: 8.4 };

/** Espesor (profundidad) de cornisas y volúmenes. */
const ESP = 1.0;

/**
 * Las siluetas de la pintura incluyen el espesor visto en perspectiva (la cara inferior de las
 * cornisas, la pared interior de los volúmenes). Para que la silueta de mundo coincida con `r`,
 * el frente se obtiene invirtiendo esa perspectiva: los bordes que se alejan hacia el punto de
 * fuga (arista interior, y arista inferior sobre el horizonte o superior bajo él) se desplazan
 * por (d + espesor) / d; el resto no cambia. y = 50 % es el horizonte (nivel de ojo).
 */
function frente(r: Rect, dF: number, prof: number): Rect {
  const k = (dF + prof) / dF;
  let { x0, x1, y0, y1 } = r;
  if (x1 <= 0) x1 *= k; else if (x0 >= 0) x0 *= k;
  const e0 = 50 - y0, e1 = 50 - y1;
  if (e0 < 0) y0 = 50 - e0 * k;
  if (e1 > 0) y1 = 50 - e1 * k;
  return { x0, x1, y0, y1 };
}
const FR_CORN = frente(PINTURA["cornisa izquierda"], D.cornisa, ESP);
const FR_SUP = frente(PINTURA["bloque superior izquierdo"], D.sup, ESP);
const FR_INF = frente(PINTURA["bloque inferior izquierdo"], D.inf, ESP);
const centroPct = (r: Rect): [number, number] => [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2];

/* ═════════════ Medidas de mundo de cada pieza (inyectadas en el shader) ═════════════ */

/** Cornisa: losa maciza con panel hundido y cuarto de círculo recortado en la esquina inferior interior. */
const CORN_HX = mundoDe(FR_CORN.x1 - FR_CORN.x0, D.cornisa) / 2;
export const CORNISA = {
  hx: CORN_HX,
  hy: mundoDe(FR_CORN.y1 - FR_CORN.y0, D.cornisa) / 2,
  hz: ESP / 2,
  /** Radio del bisel de las aristas. */
  rb: 0.012,
  /** Cuarto de círculo recortado (esquina inferior interior) y el que delimita el panel (franja de «cuña»). */
  rn: 0.3 * 2 * CORN_HX,
  rp: 0.48 * 2 * CORN_HX,
  /** Marco: grosor de los lados exterior, superior e inferior y del lado interior. */
  marco: 0.1 * 2 * CORN_HX,
  marcoInt: 0.063 * 2 * CORN_HX,
  /** Profundidad del panel hundido. */
  prof: 0.14,
};

/** Volumen hueco, abierto por delante: pared lateral, fondo y profundidad. */
function bloque(rect: Rect, d: number) {
  const hx = mundoDe(rect.x1 - rect.x0, d) / 2;
  return { hx, hy: mundoDe(rect.y1 - rect.y0, d) / 2, hz: ESP / 2, pared: 0.115 * 2 * hx, fondo: 0.12, rb: 0.012 };
}
export const BLOQUE_SUP = bloque(FR_SUP, D.sup);
export const BLOQUE_INF = bloque(FR_INF, D.inf);

/** Pedestal escalonado: zócalo, rollo, friso hundido, molduras y tapa. Fracciones de altura de abajo arriba. */
const PED_DP = 0.8;
const PED_YSUP = (0.5 - 0.84) * H_UV * (D.pedestal + PED_DP); // arista trasera de la tapa, vista a 84 % de H
const PED_YINF = (0.5 - 1.0) * H_UV * D.pedestal; // base delantera, vista a 100 % de H
export const PEDESTAL = {
  hw: mundoDe(68, D.pedestal) / 2,
  h: PED_YSUP - PED_YINF,
  hz: PED_DP / 2,
  /** [alto, semiancho, semiprofundidad] relativos a (h, hw, hz). */
  zocalo: [0.2, 1.0, 1.0],
  rollo: [0.13, 0.93, 0.93],
  friso: [0.29, 0.915, 0.85],
  moldura: [0.13, 0.965, 0.95],
  tapa: [0.25, 0.985, 1.0],
};

/** Concha: cuenco abierto, inclinado hacia la cámara para verse el interior, con estrías radiales. */
const CONCHA_R = mundoDe(PINTURA.concha.x1 - PINTURA.concha.x0, D.concha) / 2;
export const CONCHA = {
  r: CONCHA_R,
  /** Profundidad del cuenco bajo el borde. */
  hb: 0.55 * CONCHA_R,
  /** Inclinación de la boca hacia +z (rad). */
  incl: (50 * Math.PI) / 180,
  nervios: 13,
  grosor: 0.012,
  /** Amplitud de las estrías y del festón del borde. */
  onda: 0.006,
  feston: 0.01,
};

/** Huevo y hilo: el hilo une el punto más bajo del cuenco con la parte superior del huevo. */
const HUEVO_RY = mundoDe(3, D.huevo) / 2;
export const HUEVO = { rx: 0.72 * HUEVO_RY, ry: HUEVO_RY };

/** Centros de mundo (reposo) */
const CONCHA_C: V3 = [0, yMundo(2.6, D.concha), DIST - D.concha];
const HUEVO_C: V3 = [0, yMundo(15.1, D.huevo), DIST - D.huevo];
const APICE: V3 = [
  CONCHA_C[0],
  CONCHA_C[1] - CONCHA.hb * Math.cos(CONCHA.incl),
  CONCHA_C[2] - CONCHA.hb * Math.sin(CONCHA.incl),
];
/** Extremos del hilo en coordenadas locales del huevo. */
export const HILO = {
  a: [0, HUEVO.ry, 0] as V3,
  b: [APICE[0] - HUEVO_C[0], APICE[1] - HUEVO_C[1], APICE[2] - HUEVO_C[2]] as V3,
  r: 0.0035,
};

/** Del sistema local de la concha (y = eje del cuenco) a desplazamientos de mundo (inversa de `q'` del shader). */
const concha2mundo = (p: V3): V3 => {
  const c = Math.cos(CONCHA.incl), s = Math.sin(CONCHA.incl);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};

/** Puntos que contienen al cuenco (anillos de la elipsoide + ápice), con holgura para estrías y borde. */
function puntosConcha(): V3[] {
  const m = CONCHA.onda + CONCHA.feston + 0.006;
  const out: V3[] = [[0, -CONCHA.hb - m, 0]];
  for (const v of [0, -0.45, -0.8]) {
    const k = Math.sqrt(Math.max(0, 1 - (v * v)));
    const rr = CONCHA.r * k + m, yy = CONCHA.hb * v - (v === 0 ? -m : m);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 2 * Math.PI;
      out.push([rr * Math.cos(a), yy, rr * Math.sin(a)]);
    }
  }
  return out.map(concha2mundo);
}

const aabb = (pts: readonly V3[]) => {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of pts) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
  return { min, max } as { min: V3; max: V3 };
};
const cajaSim = (hx: number, hy: number, hz: number, m = 0.02) =>
  ({ min: [-hx - m, -hy - m, -hz - m], max: [hx + m, hy + m, hz + m] }) as { min: V3; max: V3 };

export type Fragmento = {
  /** Identificador del shader (`Hit.id`). */
  id: number;
  nombre: string;
  /** Centro del fragmento en reposo (mundo). */
  centro: V3;
  /** Fase y peso de la flotación (el peso amortigua: 1 casi quieto). */
  fase: number;
  peso: number;
  /** Punto interior, local: lo atraviesa un rayo que pase por su proyección. */
  sonda: V3;
  /** Caja local que contiene al fragmento entero (conservadora). */
  caja: { min: V3; max: V3 };
  /** Nube de puntos local que contiene al fragmento (más ajustada que la caja); si falta, las esquinas de la caja. */
  puntos?: V3[];
};

const PUNTOS_CONCHA = puntosConcha();
const PUNTOS_HUEVO: V3[] = (() => {
  const hx = HUEVO.rx + 0.01, hy = HUEVO.ry + 0.01;
  const out: V3[] = [];
  for (const x of [-hx, hx]) for (const y of [-hy, hy]) for (const z of [-hx, hx]) out.push([x, y, z]);
  out.push([HILO.b[0] - 0.01, HILO.b[1], HILO.b[2]], [HILO.b[0] + 0.01, HILO.b[1] + 0.01, HILO.b[2] + 0.01]);
  return out;
})();

/** Centro de mundo de una pieza simétrica a partir del frente de su lado izquierdo (`lado` = -1) o su espejo (+1). */
const centroDe = (r: Rect, d: number, lado: -1 | 1): V3 => {
  const [cx, cy] = centroPct(r);
  return [lado * mundoDe(Math.abs(cx), d), yMundo(cy, d), zCentro(d, ESP)];
};
const cornCentro = (lado: -1 | 1) => centroDe(FR_CORN, D.cornisa, lado);
const supCentro = (lado: -1 | 1) => centroDe(FR_SUP, D.sup, lado);
const infCentro = (lado: -1 | 1) => centroDe(FR_INF, D.inf, lado);
/** y de mundo del centro del pedestal: mitad de la altura entre arista trasera de la tapa y base delantera. */
const PED_C: V3 = [0, CENTRO_Y + (PED_YSUP + PED_YINF) / 2, zCentro(D.pedestal, 2 * PEDESTAL.hz)];

const CORN_CAJA = cajaSim(CORNISA.hx, CORNISA.hy, CORNISA.hz);
const SUP_CAJA = cajaSim(BLOQUE_SUP.hx, BLOQUE_SUP.hy, BLOQUE_SUP.hz);
const INF_CAJA = cajaSim(BLOQUE_INF.hx, BLOQUE_INF.hy, BLOQUE_INF.hz);

export const FRAGMENTOS: readonly Fragmento[] = [
  {
    id: 0, nombre: "concha", centro: CONCHA_C, fase: 0, peso: 0.1,
    sonda: [0, 0, 0], caja: aabb(PUNTOS_CONCHA), puntos: PUNTOS_CONCHA,
  },
  {
    /* Misma fase y peso que la concha: cuelgan juntos y el hilo se mantiene rígido. */
    id: 1, nombre: "huevo", centro: HUEVO_C, fase: 0, peso: 0.1,
    sonda: [0, 0, 0], caja: aabb(PUNTOS_HUEVO), puntos: PUNTOS_HUEVO,
  },
  {
    id: 2, nombre: "cornisa izquierda", centro: cornCentro(-1), fase: 3, peso: 0.4,
    sonda: [-CORNISA.hx + 0.05, CORNISA.hy - 0.05, 0], caja: CORN_CAJA,
  },
  {
    id: 3, nombre: "cornisa derecha", centro: cornCentro(1), fase: 4.5, peso: 0.4,
    sonda: [CORNISA.hx - 0.05, CORNISA.hy - 0.05, 0], caja: CORN_CAJA,
  },
  { id: 4, nombre: "bloque superior izquierdo", centro: supCentro(-1), fase: 6, peso: 0.7, sonda: [0, 0, 0], caja: SUP_CAJA },
  { id: 5, nombre: "bloque superior derecho", centro: supCentro(1), fase: 7.5, peso: 0.7, sonda: [0, 0, 0], caja: SUP_CAJA },
  { id: 6, nombre: "bloque inferior izquierdo", centro: infCentro(-1), fase: 8.2, peso: 0.8, sonda: [0, 0, 0], caja: INF_CAJA },
  { id: 7, nombre: "bloque inferior derecho", centro: infCentro(1), fase: 9.4, peso: 0.8, sonda: [0, 0, 0], caja: INF_CAJA },
  {
    id: 8, nombre: "pedestal", centro: PED_C, fase: 9, peso: 0.95,
    sonda: [0, 0, 0], caja: cajaSim(PEDESTAL.hw, PEDESTAL.h / 2, PEDESTAL.hz, 0.04),
  },
];

/* ── Álgebra mínima ── */
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Misma flotación que el shader (`flotar`). */
export function flotar(t: number, fase: number, peso: number): V3 {
  const k = 1 - peso * 0.85;
  return [
    Math.sin(t * 0.3 + fase) * 0.015 * k,
    Math.sin(t * 0.22 + fase * 1.7) * 0.025 * k,
    Math.sin(t * 0.26 + fase * 2.3) * 0.012 * k,
  ];
}

/** Posición orbital de la cámara. */
export function camPos(az: number, el: number): V3 {
  return [
    DIST * Math.sin(az) * Math.cos(el),
    DIST * Math.sin(el) + CENTRO_Y,
    DIST * Math.cos(az) * Math.cos(el),
  ];
}

/** Base de cámara idéntica a `camMat` del shader. */
export function base(ro: V3, ta: V3) {
  const cw = norm(sub(ta, ro));
  const cu = norm(cross(cw, [0, 1, 0]));
  const cv = cross(cu, cw);
  return { cw, cu, cv };
}

type Base = ReturnType<typeof base>;

/** Proyección con la base de cámara ya calculada (evita rehacerla por cada punto). */
function proyectarB(p: V3, ro: V3, b: Base, foco: number): [number, number] | null {
  const v = sub(p, ro);
  const z = dot(v, b.cw);
  if (z < 0.05) return null;
  return [(dot(v, b.cu) / z) * foco, (dot(v, b.cv) / z) * foco];
}

/** Proyecta un punto de mundo a uv. `null` si queda detrás de la cámara. */
export function proyectar(p: V3, ro: V3, ta: V3, foco: number): [number, number] | null {
  return proyectarB(p, ro, base(ro, ta), foco);
}

function esquinas(f: Fragmento): V3[] {
  if (f.puntos) return f.puntos;
  const { min, max } = f.caja;
  const out: V3[] = [];
  for (const x of [min[0], max[0]])
    for (const y of [min[1], max[1]])
      for (const z of [min[2], max[2]]) out.push([x, y, z]);
  return out;
}

/** Puntos locales que delimitan al fragmento (la nube ajustada o las ocho esquinas de su caja). */
export const puntosDe = esquinas;

const ESQUINAS: V3[][] = FRAGMENTOS.map(esquinas);

/** Amplitud máxima de la flotación de un fragmento. */
const amplitud = (f: Fragmento): V3 => {
  const k = 1 - f.peso * 0.85;
  return [0.015 * k, 0.025 * k, 0.012 * k];
};

/**
 * Centro de cada fragmento más su flotación en el instante t, plano (9 × xyz)
 * para `gl.uniform3fv`. El shader no evalúa `sin()` por fragmento y por paso
 * de marcha: lo hace una vez por fotograma aquí (V1.2).
 */
export function centrosEn(t: number, out: Float32Array = new Float32Array(FRAGMENTOS.length * 3)) {
  FRAGMENTOS.forEach((f, i) => {
    const o = flotar(t, f.fase, f.peso);
    out[i * 3] = f.centro[0] + o[0];
    out[i * 3 + 1] = f.centro[1] + o[1];
    out[i * 3 + 2] = f.centro[2] + o[2];
  });
  return out;
}

/** Holgura de la caja del conjunto (unidades de mundo) sobre la flotación máxima. */
const HOLGURA_CAJA = 0.1;

/**
 * Caja de mundo alineada con los ejes que contiene todos los fragmentos con su
 * flotación máxima y una holgura. El shader recorta cada rayo primario a ella:
 * fuera de la caja no hay geometría, así que no hace falta marchar.
 */
export const CAJA_ESCENA: { min: V3; max: V3 } = (() => {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const f of FRAGMENTOS) {
    const a = amplitud(f);
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], f.centro[k] + f.caja.min[k] - a[k] - HOLGURA_CAJA);
      max[k] = Math.max(max[k], f.centro[k] + f.caja.max[k] + a[k] + HOLGURA_CAJA);
    }
  }
  return { min, max };
})();

/**
 * Cota superior de la velocidad de flotación de cualquier fragmento (unidades
 * de mundo por segundo): la derivada de cada seno es amplitud × frecuencia.
 * Sirve para justificar la cadencia del render en reposo (ver Madonna.tsx).
 */
export const VELOCIDAD_FLOTACION_MAX = Math.max(
  ...FRAGMENTOS.map((f) => {
    const k = 1 - f.peso * 0.85;
    return Math.hypot(0.015 * 0.3 * k, 0.025 * 0.22 * k, 0.012 * 0.26 * k);
  }),
);

/** Posición de mundo de un punto local del fragmento en el instante t. */
export function mundo(f: Fragmento, local: V3, t: number): V3 {
  return add(add(f.centro, flotar(t, f.fase, f.peso)), local);
}

/* ── Vista alineada canónica (az=0, el=0), proyectada con FOCO = 1 ── */
const OJO_ALINEADO = camPos(0, 0);

/** Posición objetivo de cada sonda en la composición (uv con FOCO=1, pose de reposo). */
const OBJETIVO: [number, number][] = FRAGMENTOS.map((f) => {
  const p = proyectar(mundo(f, f.sonda, 0), OJO_ALINEADO, CENTRO, 1);
  if (!p) throw new Error(`Sonda ${f.nombre} detrás de la cámara alineada`);
  return p;
});

/** Extensión de la composición con FOCO=1 (todos los puntos límite, con la flotación máxima). */
const EXT = (() => {
  let ex = 0, ytop = -Infinity, ybot = Infinity;
  for (const f of FRAGMENTOS) {
    const a = amplitud(f);
    for (const c of esquinas(f)) {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        const p = proyectar(
          add(add(f.centro, c), [a[0] * sx, a[1] * sy, a[2] * sz]), OJO_ALINEADO, CENTRO, 1,
        );
        if (!p) throw new Error(`Caja ${f.nombre} detrás de la cámara alineada`);
        ex = Math.max(ex, Math.abs(p[0]));
        ytop = Math.max(ytop, p[1]);
        ybot = Math.min(ybot, p[1]);
      }
    }
  }
  return { ex, ytop, ybot };
})();

/** Diagonal de la composición con FOCO=1: unidad de normalización del error. */
const DIAG = Math.hypot(2 * EXT.ex, EXT.ytop - EXT.ybot);

/** Extensión de la composición sobre el eje (para comprobar el encuadre en las pruebas). */
export const EXTENSION_F1 = { ...EXT, diag: DIAG };

/**
 * Foco que hace caber la composición alineada dentro del lienzo, sea cual sea
 * su relación de aspecto (aspecto = ancho / alto).
 */
export function focoPara(aspecto: number): number {
  const eyMax = Math.max(Math.abs(EXT.ytop), Math.abs(EXT.ybot));
  return Math.min((0.5 * SEGURO.v) / eyMax, (0.5 * aspecto * SEGURO.h) / EXT.ex);
}

export type Evaluacion = {
  /** Error máximo de reproyección, como fracción de la diagonal de la composición. */
  error: number;
  errorPorFragmento: number[];
  /** Cada fragmento completo (puntos límite) dentro del lienzo y delante de la cámara. */
  visibles: boolean[];
  todosVisibles: boolean;
  alineado: boolean;
  /** 0..1; vale 1 solo si `alineado`. */
  prox: number;
  /** 0..100 entero; vale 100 solo si `alineado`. */
  pct: number;
  /** Proyección actual de cada sonda (uv) para depuración y pruebas. */
  sondas: ([number, number] | null)[];
};

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Compara la proyección real de las sondas con la composición objetivo.
 * El error es independiente del aspecto: se mide con FOCO=1 y se divide por
 * la diagonal de la composición (que escala igual que el foco).
 * La visibilidad sí depende del aspecto: usa el foco real del lienzo.
 */
export function evaluar(az: number, el: number, aspecto: number, t: number): Evaluacion {
  const ro = camPos(az, el);
  const b = base(ro, CENTRO);
  const foco = focoPara(aspecto);

  const errorPorFragmento: number[] = [];
  const sondas: ([number, number] | null)[] = [];
  const visibles: boolean[] = [];

  FRAGMENTOS.forEach((f, i) => {
    const p = proyectarB(mundo(f, f.sonda, t), ro, b, 1);
    sondas.push(p ? [p[0] * foco, p[1] * foco] : null);
    errorPorFragmento.push(
      p ? Math.hypot(p[0] - OBJETIVO[i][0], p[1] - OBJETIVO[i][1]) / DIAG : Infinity,
    );

    let dentro = true;
    for (const c of ESQUINAS[i]) {
      const q = proyectarB(mundo(f, c, t), ro, b, foco);
      if (!q || Math.abs(q[0]) > aspecto / 2 || Math.abs(q[1]) > 0.5) { dentro = false; break; }
    }
    visibles.push(dentro);
  });

  const error = Math.max(...errorPorFragmento);
  const todosVisibles = visibles.every(Boolean);
  const alineado = todosVisibles && error <= TOL_ALINEADO;
  const prox = alineado ? 1 : Math.min(0.99, 1 - suave(TOL_ALINEADO, TOL_LEJOS, error));
  const pct = alineado ? 100 : Math.min(99, Math.floor(prox * 100));
  return { error, errorPorFragmento, visibles, todosVisibles, alineado, prox, pct, sondas };
}
