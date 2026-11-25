/**
 * «El retablo que espera» — composición, escala, recorrido de cámara y alineación (V2.0, recorrido V2.1)
 *
 * Parte de la composición derivada de pantalla de V1.3B (`madonna-arquitectura/composicion.ts`):
 * cada pieza se declara por dónde debe verse en la vista alineada (% de H) y a qué distancia está,
 * y su posición de mundo sale de retropropagar esa pantalla con la cámara alineada.
 *
 * Qué cambia en V2.0
 *  · ESCALA Y PROFUNDIDAD. Las distancias pasan de 4–8,4 (factor 2) a 36–190 (factor 5,3). Cada pieza
 *    conserva sus proporciones exactas: todas las medidas absolutas (espesor, biseles, hilo…) se
 *    multiplican por el factor de su pieza (`ESC.*`). Desde la vista alineada la imagen es la misma
 *    composición; desde cualquier otro punto las piezas quedan a cientos de unidades unas de otras.
 *  · EL MAR ES UN SUELO. La base del pedestal está a y = 0 (nivel del mar) y el ojo alineado está a
 *    HC = 0,46 · D.pedestal por encima. Las demás piezas cuelgan sobre el agua.
 *  · RECORRIDO. La cámara sigue una trayectoria con tres posiciones narrativas (I La aparición lejana,
 *    II Entre los fragmentos, III La revelación); la órbita libre (alrededor de CENTRO) queda como alternativa.
 *  · V2.1: ver el bloque «Posiciones clave del recorrido» (PLANOS) y la métrica `revelacion` más abajo.
 *  · MOVIMIENTO AMBIENTAL. Amplitud proporcional al tamaño de cada pieza y atenuada por `m`
 *    (0 = quieto): al alinearse todo se detiene, y el huevo, que oscila como un péndulo, queda inmóvil.
 *
 * Interpretación original de MANIFESTO: sin escala histórica ni reconstrucción documental.
 */

export type V3 = readonly [number, number, number];

/* ═════════════ Escala y profundidad ═════════════ */

/** Distancias de V1.3B (referencia para escalar las medidas absolutas de cada pieza). */
const D0 = { concha: 4, huevo: 4.6, cornisa: 6, sup: 7, inf: 7.6, pedestal: 8.4 };

/** Distancias de los planos frontales a la cámara alineada (V2.0). El huevo conserva su razón 1,15 con la concha. */
export const D = { concha: 36, huevo: 41.4, cornisa: 64, sup: 100, inf: 134, pedestal: 190 };

/** Factor de escala de cada pieza respecto a V1.3B: multiplica toda medida absoluta. */
export const ESC = {
  concha: D.concha / D0.concha,
  huevo: D.huevo / D0.huevo,
  cornisa: D.cornisa / D0.cornisa,
  sup: D.sup / D0.sup,
  inf: D.inf / D0.inf,
  pedestal: D.pedestal / D0.pedestal,
};

/** La cámara alineada está en (0, HC, ZC) y mira hacia -z. */
export const ZC = 0;
/** Altura del ojo alineado sobre el mar: la base delantera del pedestal queda exactamente a y = 0. */
export const H_UV = 0.92;
export const HC = 0.5 * H_UV * D.pedestal;
export const NIVEL_MAR = 0;

/** Margen de seguridad de la composición dentro del lienzo (fracción de la mitad del lienzo). */
export const SEGURO = { v: 0.9, h: 0.92 };

/** Tolerancias de alineación, normalizadas por la diagonal de la composición proyectada. */
export const TOL_ALINEADO = 0.012;
export const TOL_LEJOS = 0.15;

/* ── Pantalla → mundo ── */
const mundoDe = (pct: number, d: number) => (pct / 100) * H_UV * d;
const yMundo = (yp: number, d: number) => HC + (0.5 - yp / 100) * H_UV * d;
const zCentro = (dFrente: number, prof: number) => ZC - dFrente - prof / 2;

/* ═════════════ Medidas de la pintura (objetivo de la vista alineada) ═════════════ */
export type Rect = { x0: number; x1: number; y0: number; y1: number };

/** Silueta objetivo de cada fragmento, en % de H (medidas V1.3A sobre la reproducción de la Fundació: interpretación). */
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

/** Espesor (profundidad) de cornisas y volúmenes: 1,0 en V1.3B, escalado con cada pieza. */
const ESP_CORN = 1.0 * ESC.cornisa;
const ESP_SUP = 1.0 * ESC.sup;
const ESP_INF = 1.0 * ESC.inf;

/**
 * Las siluetas de la pintura incluyen el espesor visto en perspectiva. El frente de cada pieza se obtiene
 * invirtiendo esa perspectiva (igual que en V1.3B). Como el espesor es proporcional a la distancia, el factor
 * (d + espesor) / d es el mismo que en V1.3B.
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
const FR_CORN = frente(PINTURA["cornisa izquierda"], D.cornisa, ESP_CORN);
const FR_SUP = frente(PINTURA["bloque superior izquierdo"], D.sup, ESP_SUP);
const FR_INF = frente(PINTURA["bloque inferior izquierdo"], D.inf, ESP_INF);
const centroPct = (r: Rect): [number, number] => [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2];

/* ═════════════ Medidas de mundo de cada pieza (inyectadas en el shader) ═════════════ */

const CORN_HX = mundoDe(FR_CORN.x1 - FR_CORN.x0, D.cornisa) / 2;
export const CORNISA = {
  hx: CORN_HX,
  hy: mundoDe(FR_CORN.y1 - FR_CORN.y0, D.cornisa) / 2,
  hz: ESP_CORN / 2,
  rb: 0.012 * ESC.cornisa,
  rn: 0.3 * 2 * CORN_HX,
  rp: 0.48 * 2 * CORN_HX,
  marco: 0.1 * 2 * CORN_HX,
  marcoInt: 0.063 * 2 * CORN_HX,
  prof: 0.14 * ESC.cornisa,
};

function bloque(rect: Rect, d: number, esp: number, esc: number) {
  const hx = mundoDe(rect.x1 - rect.x0, d) / 2;
  return { hx, hy: mundoDe(rect.y1 - rect.y0, d) / 2, hz: esp / 2, pared: 0.115 * 2 * hx, fondo: 0.12 * esc, rb: 0.012 * esc };
}
export const BLOQUE_SUP = bloque(FR_SUP, D.sup, ESP_SUP, ESC.sup);
export const BLOQUE_INF = bloque(FR_INF, D.inf, ESP_INF, ESC.inf);

const PED_DP = 0.8 * ESC.pedestal;
const PED_YSUP = (0.5 - 0.84) * H_UV * (D.pedestal + PED_DP);
const PED_YINF = (0.5 - 1.0) * H_UV * D.pedestal;
export const PEDESTAL = {
  hw: mundoDe(68, D.pedestal) / 2,
  h: PED_YSUP - PED_YINF,
  hz: PED_DP / 2,
  /** Factor de escala de los detalles absolutos del pedestal (biseles, panel del friso). */
  s: ESC.pedestal,
  zocalo: [0.2, 1.0, 1.0],
  rollo: [0.13, 0.93, 0.93],
  friso: [0.29, 0.915, 0.85],
  moldura: [0.13, 0.965, 0.95],
  tapa: [0.25, 0.985, 1.0],
};

const CONCHA_R = mundoDe(PINTURA.concha.x1 - PINTURA.concha.x0, D.concha) / 2;
export const CONCHA = {
  r: CONCHA_R,
  hb: 0.55 * CONCHA_R,
  incl: (50 * Math.PI) / 180,
  nervios: 13,
  grosor: 0.012 * ESC.concha,
  onda: 0.006 * ESC.concha,
  feston: 0.01 * ESC.concha,
  /** Margen de las cotas de poda. */
  margen: 0.01 * ESC.concha,
};

const HUEVO_RY = mundoDe(3, D.huevo) / 2;
export const HUEVO = { rx: 0.72 * HUEVO_RY, ry: HUEVO_RY };

const CONCHA_C: V3 = [0, yMundo(2.6, D.concha), ZC - D.concha];
const HUEVO_C: V3 = [0, yMundo(15.1, D.huevo), ZC - D.huevo];
const APICE: V3 = [
  CONCHA_C[0],
  CONCHA_C[1] - CONCHA.hb * Math.cos(CONCHA.incl),
  CONCHA_C[2] - CONCHA.hb * Math.sin(CONCHA.incl),
];
/** Extremos del hilo en coordenadas locales del huevo (en reposo). */
export const HILO = {
  a: [0, HUEVO.ry, 0] as V3,
  b: [APICE[0] - HUEVO_C[0], APICE[1] - HUEVO_C[1], APICE[2] - HUEVO_C[2]] as V3,
  r: 0.0035 * ESC.concha,
};

const concha2mundo = (p: V3): V3 => {
  const c = Math.cos(CONCHA.incl), s = Math.sin(CONCHA.incl);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};

function puntosConcha(): V3[] {
  const m = CONCHA.onda + CONCHA.feston + 0.006 * ESC.concha;
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
const cajaSim = (hx: number, hy: number, hz: number, m: number) =>
  ({ min: [-hx - m, -hy - m, -hz - m], max: [hx + m, hy + m, hz + m] }) as { min: V3; max: V3 };

export type Fragmento = {
  id: number;
  nombre: string;
  centro: V3;
  /** Fase y peso de la flotación (el peso amortigua: 1 casi quieto). */
  fase: number;
  peso: number;
  /** Tamaño característico (unidades de mundo): fija la amplitud de la flotación. */
  esc: number;
  sonda: V3;
  caja: { min: V3; max: V3 };
  puntos?: V3[];
};

const PUNTOS_CONCHA = puntosConcha();
const PUNTOS_HUEVO: V3[] = (() => {
  const hx = HUEVO.rx + 0.01 * ESC.huevo, hy = HUEVO.ry + 0.01 * ESC.huevo;
  const out: V3[] = [];
  for (const x of [-hx, hx]) for (const y of [-hy, hy]) for (const z of [-hx, hx]) out.push([x, y, z]);
  const e = 0.01 * ESC.huevo;
  out.push([HILO.b[0] - e, HILO.b[1], HILO.b[2]], [HILO.b[0] + e, HILO.b[1] + e, HILO.b[2] + e]);
  return out;
})();

const centroDe = (r: Rect, d: number, esp: number, lado: -1 | 1): V3 => {
  const [cx, cy] = centroPct(r);
  return [lado * mundoDe(Math.abs(cx), d), yMundo(cy, d), zCentro(d, esp)];
};
const cornCentro = (lado: -1 | 1) => centroDe(FR_CORN, D.cornisa, ESP_CORN, lado);
const supCentro = (lado: -1 | 1) => centroDe(FR_SUP, D.sup, ESP_SUP, lado);
const infCentro = (lado: -1 | 1) => centroDe(FR_INF, D.inf, ESP_INF, lado);
const PED_C: V3 = [0, HC + (PED_YSUP + PED_YINF) / 2, zCentro(D.pedestal, 2 * PEDESTAL.hz)];

const CORN_CAJA = cajaSim(CORNISA.hx, CORNISA.hy, CORNISA.hz, 0.02 * ESC.cornisa);
const SUP_CAJA = cajaSim(BLOQUE_SUP.hx, BLOQUE_SUP.hy, BLOQUE_SUP.hz, 0.02 * ESC.sup);
const INF_CAJA = cajaSim(BLOQUE_INF.hx, BLOQUE_INF.hy, BLOQUE_INF.hz, 0.02 * ESC.inf);

export const FRAGMENTOS: readonly Fragmento[] = [
  { id: 0, nombre: "concha", centro: CONCHA_C, fase: 0, peso: 0.1, esc: 2 * CONCHA_R, sonda: [0, 0, 0], caja: aabb(PUNTOS_CONCHA), puntos: PUNTOS_CONCHA },
  /* Misma fase, peso y tamaño que la concha: cuelgan juntos y el hilo se mantiene rígido (el balanceo del huevo se suma aparte). */
  { id: 1, nombre: "huevo", centro: HUEVO_C, fase: 0, peso: 0.1, esc: 2 * CONCHA_R, sonda: [0, 0, 0], caja: aabb(PUNTOS_HUEVO), puntos: PUNTOS_HUEVO },
  { id: 2, nombre: "cornisa izquierda", centro: cornCentro(-1), fase: 3, peso: 0.4, esc: 2 * CORNISA.hx, sonda: [-CORNISA.hx + 0.05 * ESC.cornisa, CORNISA.hy - 0.05 * ESC.cornisa, 0], caja: CORN_CAJA },
  { id: 3, nombre: "cornisa derecha", centro: cornCentro(1), fase: 4.5, peso: 0.4, esc: 2 * CORNISA.hx, sonda: [CORNISA.hx - 0.05 * ESC.cornisa, CORNISA.hy - 0.05 * ESC.cornisa, 0], caja: CORN_CAJA },
  { id: 4, nombre: "bloque superior izquierdo", centro: supCentro(-1), fase: 6, peso: 0.7, esc: 2 * BLOQUE_SUP.hx, sonda: [0, 0, 0], caja: SUP_CAJA },
  { id: 5, nombre: "bloque superior derecho", centro: supCentro(1), fase: 7.5, peso: 0.7, esc: 2 * BLOQUE_SUP.hx, sonda: [0, 0, 0], caja: SUP_CAJA },
  { id: 6, nombre: "bloque inferior izquierdo", centro: infCentro(-1), fase: 8.2, peso: 0.8, esc: 2 * BLOQUE_INF.hx, sonda: [0, 0, 0], caja: INF_CAJA },
  { id: 7, nombre: "bloque inferior derecho", centro: infCentro(1), fase: 9.4, peso: 0.8, esc: 2 * BLOQUE_INF.hx, sonda: [0, 0, 0], caja: INF_CAJA },
  { id: 8, nombre: "pedestal", centro: PED_C, fase: 9, peso: 0.98, esc: 2 * PEDESTAL.hw, sonda: [0, 0, 0], caja: cajaSim(PEDESTAL.hw, PEDESTAL.h / 2, PEDESTAL.hz, 0.04 * ESC.pedestal) },
];

/* ── Álgebra mínima ── */
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };

/* ═════════════ Movimiento ambiental ═════════════ */

/** Amplitud de la flotación como fracción del tamaño de la pieza (antes de amortiguar por peso). */
const AMP = 0.05;
/** Balanceo del huevo (péndulo): amplitud en unidades de mundo y velocidad angular (rad/s). */
export const BALANCEO = { amp: 0.8 * 2 * HUEVO_RY, w: 0.85 };

const kFlota = (f: Fragmento) => (1 - f.peso * 0.85) * f.esc * AMP;

/**
 * Desplazamiento de un fragmento en el instante ambiental `t`, multiplicado por `m` (0 = quieto, 1 = pleno).
 * `t` es un reloj propio que solo avanza mientras hay movimiento (ver Retablo.tsx): con m = 0 el desplazamiento
 * es exactamente cero sea cual sea la fase.
 */
export function flotar(t: number, f: Fragmento, m: number): V3 {
  const k = kFlota(f) * m;
  return [Math.sin(t * 0.3 + f.fase) * k, Math.sin(t * 0.22 + f.fase * 1.7) * k * 1.4, Math.sin(t * 0.26 + f.fase * 2.3) * k * 0.8];
}

/** Desplazamiento adicional del huevo respecto a la concha (péndulo). */
export function balanceoHuevo(t: number, m: number): V3 {
  return [Math.sin(t * BALANCEO.w + 0.7) * BALANCEO.amp * m, 0, Math.sin(t * BALANCEO.w * 0.5 + 2.1) * BALANCEO.amp * 0.35 * m];
}

/** Centros de mundo de cada fragmento en el instante ambiental t, planos (9 × xyz) para `gl.uniform3fv`. */
export function centrosEn(t: number, m: number, out: Float32Array = new Float32Array(FRAGMENTOS.length * 3)) {
  FRAGMENTOS.forEach((f, i) => {
    let o = flotar(t, f, m);
    if (f.id === 1) o = add(o, balanceoHuevo(t, m));
    out[i * 3] = f.centro[0] + o[0];
    out[i * 3 + 1] = f.centro[1] + o[1];
    out[i * 3 + 2] = f.centro[2] + o[2];
  });
  return out;
}

/** Extremo inferior del hilo (el ápice de la concha) en coordenadas locales del huevo, con el balanceo actual. */
export function hiloB(t: number, m: number): V3 {
  const sw = balanceoHuevo(t, m);
  return [HILO.b[0] - sw[0], HILO.b[1] - sw[1], HILO.b[2] - sw[2]];
}

const amplitud = (f: Fragmento): V3 => {
  const k = kFlota(f);
  const extra = f.id === 1 ? BALANCEO.amp : 0;
  return [k + extra, k * 1.4, k * 0.8 + extra * 0.35];
};

/* ═════════════ Caja de la escena, luz del vacío ═════════════ */

const HOLGURA_CAJA = 3;
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
 * Luz del vacío: un punto sobre el eje, a media altura del hueco central y a media profundidad de la
 * composición. Es una luz diseñada (no física): ilumina lo que mira hacia el eje (caras interiores de
 * los volúmenes, bajos de las cornisas, frente y tapa del pedestal) y decae con la distancia.
 */
export const LUZ_VACIO = { pos: [0, yMundo(56, D.inf), ZC - 122] as V3, radio: 92 };

/** Elevación del sol respecto al horizonte: justo bajo él, detrás de la composición (eje -z). Sin disco visible. */
export const SOL = { elevacion: -0.026 };

/* ═════════════ Cámara: base, proyección, recorrido ═════════════ */

/** Base de cámara idéntica a `camMat` del shader. */
export function base(ro: V3, ta: V3) {
  const cw = norm(sub(ta, ro));
  const cu = norm(cross(cw, [0, 1, 0]));
  const cv = cross(cu, cw);
  return { cw, cu, cv };
}
type Base = ReturnType<typeof base>;

function proyectarB(p: V3, ro: V3, b: Base, foco: number): [number, number] | null {
  const v = sub(p, ro);
  const z = dot(v, b.cw);
  if (z < 0.05) return null;
  return [(dot(v, b.cu) / z) * foco, (dot(v, b.cv) / z) * foco];
}
export function proyectar(p: V3, ro: V3, ta: V3, foco: number): [number, number] | null {
  return proyectarB(p, ro, base(ro, ta), foco);
}

/** Pose de la vista alineada y centro de la órbita libre. */
export const OJO_ALINEADO: V3 = [0, HC, ZC];
export const RADIO_ORBITA = 110;
export const CENTRO: V3 = [0, HC, ZC - RADIO_ORBITA];

/** Posición orbital (exploración libre): az = el = 0 es la vista alineada. */
export function camPos(az: number, el: number): V3 {
  return [
    CENTRO[0] + RADIO_ORBITA * Math.sin(az) * Math.cos(el),
    CENTRO[1] + RADIO_ORBITA * Math.sin(el),
    CENTRO[2] + RADIO_ORBITA * Math.cos(az) * Math.cos(el),
  ];
}

export type Plano = { id: string; p: number; pos: V3; mira: V3; foco: number };

/**
 * Posiciones clave del recorrido (V2.1). Cada una lleva su `p`; la velocidad de la cámara sale del reparto de esos `p`
 * (la interpolación es Hermite con tangentes de diferencias finitas no uniformes y velocidad nula en los extremos).
 * `foco` es relativo al que hace caber la composición alineada (`focoPara`): 1 = ese foco; mayor = teleobjetivo.
 *
 * Idea de conjunto: la composición ocupa una columna de 175 unidades de profundidad (concha en z = -36, pedestal en
 * z = -199) y el eje x = 0, y ≈ 87 está libre de geometría de punta a punta. El recorrido entra por el flanco
 * izquierdo (I), cruza entre las dos pilas (II) hasta el fondo del eje, y vuelve hacia atrás por ese pasillo libre:
 * las piezas se recomponen a medida que la cámara retrocede hasta la pose alineada (III).
 */
export const PLANOS: readonly Plano[] = [
  /* I · La aparición lejana: desde la izquierda y a poca altura; las cornisas y los volúmenes se escalonan en diagonal */
  { id: "I", p: 0, pos: [-84, 26, -44], mira: [4, 69, -150], foco: 1.0 },
  { id: "flanco", p: 0.14, pos: [-70, 48, -40], mira: [2, 78, -150], foco: 1.0 },
  { id: "umbral", p: 0.28, pos: [-52, 80, -32], mira: [5, 80, -150], foco: 1.0 },
  /* II · Entre los fragmentos: dentro de la pila izquierda, mirando en diagonal; primer plano, plano medio y fondo */
  { id: "II", p: 0.5, pos: [-36, 88, -58], mira: [6, 74, -155], foco: 1.05 },
  { id: "cruce", p: 0.66, pos: [-8, 86, -46], mira: [0, 84, -160], foco: 1.0 },
  /* El retroceso por el eje libre: las piezas se recomponen */
  { id: "retroceso-1", p: 0.78, pos: [0, 86.5, -28], mira: [0, 94, -150], foco: 1.0 },
  { id: "retroceso-2", p: 0.89, pos: [0, 87, -12], mira: [0, 91, -125], foco: 1.0 },
  /* III · La revelación: la vista alineada */
  { id: "III", p: 1, pos: OJO_ALINEADO, mira: CENTRO, foco: 1 },
];

export type Estacion = { id: "inmenso" | "aproximacion" | "ausencia"; nombre: string; p: number };
export const ESTACIONES: readonly Estacion[] = [
  { id: "inmenso", nombre: "La aparición lejana", p: 0 },
  { id: "aproximacion", nombre: "Entre los fragmentos", p: 0.5 },
  { id: "ausencia", nombre: "La revelación", p: 1 },
];

export type Pose = { pos: V3; mira: V3; foco: number };

/** Tangente de diferencias finitas no uniformes en el knot j (nula en los extremos: la cámara parte y llega en reposo). */
function tangente(j: number, valor: (k: Plano) => number): number {
  const n = PLANOS.length - 1;
  if (j <= 0 || j >= n) return 0;
  return (valor(PLANOS[j + 1]) - valor(PLANOS[j - 1])) / (PLANOS[j + 1].p - PLANOS[j - 1].p);
}
/** Hermite cúbica entre los knots i e i+1 para una magnitud escalar. */
function hermite(i: number, p: number, valor: (k: Plano) => number): number {
  const a = PLANOS[i], b = PLANOS[i + 1];
  const h = b.p - a.p;
  const u = (p - a.p) / h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * valor(a) + (u3 - 2 * u2 + u) * h * tangente(i, valor)
    + (-2 * u3 + 3 * u2) * valor(b) + (u3 - u2) * h * tangente(i + 1, valor);
}

/** Pose de cámara en el punto p ∈ [0, 1] del recorrido. En p = 1 coincide exactamente con la vista alineada. */
export function poseEn(p: number): Pose {
  const n = PLANOS.length - 1;
  const q = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < n - 1 && q > PLANOS[i + 1].p) i++;
  const h = (f: (k: Plano) => number) => hermite(i, q, f);
  return {
    pos: [h((k) => k.pos[0]), h((k) => k.pos[1]), h((k) => k.pos[2])],
    mira: [h((k) => k.mira[0]), h((k) => k.mira[1]), h((k) => k.mira[2])],
    foco: h((k) => k.foco),
  };
}

/**
 * Exploración libre: gira la pose del recorrido alrededor de CENTRO (az alrededor de y, el hacia arriba).
 * Con az = el = 0 devuelve la pose del recorrido.
 */
export function poseLibre(p: number, az: number, el: number): Pose {
  const b = poseEn(p);
  const girada = (a: number, e: number): Pose => {
    const rot = (v: V3): V3 => {
      const w = sub(v, CENTRO);
      const ce = Math.cos(-e), se = Math.sin(-e);
      const y1 = w[1] * ce - w[2] * se, z1 = w[1] * se + w[2] * ce;
      const ca = Math.cos(a), sa = Math.sin(a);
      return add([w[0] * ca + z1 * sa, y1, -w[0] * sa + z1 * ca], CENTRO);
    };
    return { pos: rot(b.pos), mira: rot(b.mira), foco: b.foco };
  };
  const g = girada(az, el);
  /* V2.1: la órbita libre no atraviesa las piezas ni baja al mar: la posición se proyecta fuera de la caja inflada de
     cada pieza (empuje radial desde su centro: continuo, la cámara se desliza alrededor) y se mantiene sobre ALTURA_MIN.
     En el recorrido (az = el = 0) no actúa: la cámara ya tiene ≥ 14 unidades de despeje (comprobado por QA). */
  return { pos: despejar(g.pos), mira: g.mira, foco: g.foco };
}

/** Despeje mínimo (unidades de mundo) de la cámara a las cajas de las piezas y altura mínima sobre el mar en la órbita libre. */
export const DESPEJE_MIN = 6;
export const ALTURA_MIN = 12;
let CAJAS_DESPEJE: { c: V3; h: V3 }[] | null = null;
function despejar(pos: V3): V3 {
  CAJAS_DESPEJE ??= FRAGMENTOS.map((fr) => ({
    c: [0, 1, 2].map((k) => fr.centro[k] + (fr.caja.min[k] + fr.caja.max[k]) / 2) as unknown as V3,
    h: [0, 1, 2].map((k) => (fr.caja.max[k] - fr.caja.min[k]) / 2 + DESPEJE_MIN) as unknown as V3,
  }));
  const q: [number, number, number] = [pos[0], pos[1], pos[2]];
  for (let it = 0; it < 3; it++) {
    for (const cj of CAJAS_DESPEJE) {
      const d = [q[0] - cj.c[0], q[1] - cj.c[1], q[2] - cj.c[2]];
      const r = Math.max(Math.abs(d[0]) / cj.h[0], Math.abs(d[1]) / cj.h[1], Math.abs(d[2]) / cj.h[2]);
      if (r >= 1) continue;
      if (r < 1e-9) { q[2] = cj.c[2] + cj.h[2]; continue; }
      q[0] = cj.c[0] + d[0] / r; q[1] = cj.c[1] + d[1] / r; q[2] = cj.c[2] + d[2] / r;
    }
    if (q[1] < ALTURA_MIN) q[1] = ALTURA_MIN;
  }
  return q;
}

/* ═════════════ Alineación (reproyección) ═════════════ */

const esquinas = (f: Fragmento): V3[] => {
  if (f.puntos) return f.puntos;
  const { min, max } = f.caja;
  const out: V3[] = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) out.push([x, y, z]);
  return out;
};
export const puntosDe = esquinas;
const ESQUINAS: V3[][] = FRAGMENTOS.map(esquinas);

/** Posición objetivo de cada sonda en la vista alineada (uv con FOCO = 1, sin movimiento ambiental). */
const OBJETIVO: [number, number][] = FRAGMENTOS.map((f) => {
  const p = proyectar(add(f.centro, f.sonda), OJO_ALINEADO, CENTRO, 1);
  if (!p) throw new Error(`Sonda ${f.nombre} detrás de la cámara alineada`);
  return p;
});

const EXT = (() => {
  let ex = 0, ytop = -Infinity, ybot = Infinity;
  for (const f of FRAGMENTOS) {
    const a = amplitud(f);
    for (const c of esquinas(f)) {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        const p = proyectar(add(add(f.centro, c), [a[0] * sx, a[1] * sy, a[2] * sz]), OJO_ALINEADO, CENTRO, 1);
        if (!p) throw new Error(`Caja ${f.nombre} detrás de la cámara alineada`);
        ex = Math.max(ex, Math.abs(p[0]));
        ytop = Math.max(ytop, p[1]);
        ybot = Math.min(ybot, p[1]);
      }
    }
  }
  return { ex, ytop, ybot };
})();
const DIAG = Math.hypot(2 * EXT.ex, EXT.ytop - EXT.ybot);
export const EXTENSION_F1 = { ...EXT, diag: DIAG };

/** Foco que hace caber la composición alineada en el lienzo (aspecto = ancho / alto). */
export function focoPara(aspecto: number): number {
  const eyMax = Math.max(Math.abs(EXT.ytop), Math.abs(EXT.ybot));
  return Math.min((0.5 * SEGURO.v) / eyMax, (0.5 * aspecto * SEGURO.h) / EXT.ex);
}

/**
 * Foco real de una pose en un lienzo de ese aspecto. En horizontal, el foco relativo de la pose se aplica tal cual; en
 * vertical el teleobjetivo de las estaciones intermedias se abre (el campo es ancho y el lienzo, estrecho). En la vista
 * alineada (foco relativo 1) no cambia nunca: la composición siempre cabe.
 */
export function focoDe(pose: Pose, aspecto: number): number {
  const t = suave(0.5, 1.3, aspecto);
  const k = -0.45 + 1.45 * t;
  return focoPara(aspecto) * (1 + (pose.foco - 1) * k);
}

export type Evaluacion = {
  /** Error máximo de reproyección, como fracción de la diagonal de la composición. */
  error: number;
  errorPorFragmento: number[];
  visibles: boolean[];
  todosVisibles: boolean;
  alineado: boolean;
  /** 0..1; vale 1 solo si `alineado`. */
  prox: number;
  /**
   * 0..1: cuánto de la revelación ha ocurrido. Crece de forma suave con la cercanía (en posición y mirada) a la pose
   * alineada, a lo largo de todo el retroceso, y vale exactamente 1 solo si `alineado`. Gobierna la luz cálida y la
   * quietud ambiental (la alineación geométrica, `prox`, solo despega en el último tramo).
   */
  revelacion: number;
  sondas: ([number, number] | null)[];
};

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export { suave };

/** Compara la proyección de las sondas desde una pose cualquiera con la composición objetivo. */
export function evaluar(pose: Pose, aspecto: number): Evaluacion {
  const b = base(pose.pos, pose.mira);
  const foco = focoDe(pose, aspecto);
  const errorPorFragmento: number[] = [];
  const sondas: ([number, number] | null)[] = [];
  const visibles: boolean[] = [];
  FRAGMENTOS.forEach((f, i) => {
    const p = proyectarB(add(f.centro, f.sonda), pose.pos, b, 1);
    sondas.push(p ? [p[0] * foco, p[1] * foco] : null);
    errorPorFragmento.push(p ? Math.hypot(p[0] - OBJETIVO[i][0], p[1] - OBJETIVO[i][1]) / DIAG : Infinity);
    let dentro = true;
    for (const c of ESQUINAS[i]) {
      const q = proyectarB(add(f.centro, c), pose.pos, b, foco);
      if (!q || Math.abs(q[0]) > aspecto / 2 || Math.abs(q[1]) > 0.5) { dentro = false; break; }
    }
    visibles.push(dentro);
  });
  const error = Math.max(...errorPorFragmento);
  const todosVisibles = visibles.every(Boolean);
  /* La alineación exige la pose alineada; el encuadre completo solo se pide al foco real del lienzo */
  const alineado = error <= TOL_ALINEADO;
  const prox = alineado ? 1 : Math.min(0.99, 1 - suave(TOL_ALINEADO, TOL_LEJOS, error));
  const revelacion = alineado ? 1 : Math.min(0.999, revelacionDe(pose));
  return { error, errorPorFragmento, visibles, todosVisibles, alineado, prox, revelacion, sondas };
}

/** Distancia (unidades de mundo) de la cámara a la pose alineada a la que la revelación empieza. */
export const RADIO_REVELACION = 62;
/** Desviación de la mirada (radianes) respecto al eje alineado a la que la revelación se anula. */
const ANGULO_REVELACION = 0.55;
function revelacionDe(pose: Pose): number {
  const d = Math.hypot(pose.pos[0] - OJO_ALINEADO[0], pose.pos[1] - OJO_ALINEADO[1], pose.pos[2] - OJO_ALINEADO[2]);
  const w = norm(sub(pose.mira, pose.pos));
  const ref = norm(sub(CENTRO, OJO_ALINEADO));
  const ang = Math.acos(Math.min(1, Math.max(-1, dot(w, ref))));
  return 1 - suave(0, 1, Math.min(1, d / RADIO_REVELACION + ang / ANGULO_REVELACION));
}

/** Factor de movimiento ambiental: 1 lejos de la alineación, 0 (quieto) al alinearse; baja de forma gradual con la revelación. */
export const movimientoAmbiental = (revelacion: number) => (revelacion >= 1 ? 0 : 1 - suave(0.08, 0.94, revelacion));

/* ═════════════ Utilidades de QA ═════════════ */

/** Cajas de mundo de cada fragmento (reposo), para comprobar el despeje del recorrido. */
export function cajasMundo(): { nombre: string; min: V3; max: V3 }[] {
  return FRAGMENTOS.map((f) => ({ nombre: f.nombre, min: add(f.centro, f.caja.min), max: add(f.centro, f.caja.max) }));
}

/** Distancia de un punto a una caja alineada con los ejes (0 si está dentro). */
export function distanciaACaja(p: V3, c: { min: V3; max: V3 }): number {
  const d = [0, 1, 2].map((k) => Math.max(c.min[k] - p[k], 0, p[k] - c.max[k]));
  return Math.hypot(d[0], d[1], d[2]);
}
