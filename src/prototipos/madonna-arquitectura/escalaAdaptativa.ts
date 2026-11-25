/**
 * Control de la escala de render (resolución interna / resolución CSS) — V1.2
 *
 * Módulo puro, sin DOM ni WebGL: se prueba con Node (`qa-control.mjs`).
 *
 * Qué corrige respecto a V1.1: el control antiguo solo bajaba con < 28 fps y solo
 * subía con > 50 fps, de modo que entre 28 y 50 fps la escala se quedaba fija
 * para siempre (el caso reportado de ~29 fps a 1920×1080 caía justo ahí). Ahora:
 *
 *  · Decide con la MEDIANA del intervalo entre fotogramas de una ventana de
 *    VENTANA fotogramas (robusta a un tirón aislado), no con una media.
 *  · Baja si la mediana queda por debajo de FPS_BAJAR (50) en una ventana, en
 *    proporción a lo que falta: el coste de un fotograma es ∝ píxeles = escala²,
 *    así que la escala nueva es escala·√(objetivo/mediana), acotada por pasos.
 *  · Sube solo tras VENTANAS_PARA_SUBIR ventanas seguidas con ≥ FPS_SUBIR (57) y p95
 *    razonable, con un paso multiplicativo pequeño, y no antes de `hastaSubir`.
 *  · Histéresis: entre 50 y 57 fps no se mueve (es margen de ruido de vsync, no un
 *    hueco como el de 28-50). Si una subida fuerza una bajada al poco, el
 *    enfriamiento antes de volver a subir se duplica (6 s → 12 → 24 → 48 → 60 s):
 *    la oscilación se amortigua en vez de repetirse cada pocos segundos.
 *  · Si bajar la escala NO mejora el intervalo (pantalla a 30 Hz, ahorro de energía,
 *    cuello de botella en CPU), se deshace la bajada y se congela el control, con
 *    espera creciente: no se degrada la imagen por algo que la escala no arregla.
 *  · Con la imagen quieta no hay fotogramas que medir, así que el bucle hace
 *    ráfagas cortas de sondeo cuando `quiereSonda()` lo permite (escala por debajo
 *    del techo, sin enfriamiento ni congelación): la imagen se afina sola.
 *  · Límite inferior de calidad: nunca por debajo de `min`.
 *  · Todo cambio queda en `registro` con su motivo, para diagnosticar.
 */

export const FPS_BAJAR = 50;
export const FPS_SUBIR = 57;
/** Objetivo al calcular la escala nueva (un poco por encima del umbral de subida). */
export const FPS_OBJETIVO = 58;
/** p95 máximo del intervalo (ms) para permitir una subida. */
export const P95_MAX_SUBIDA_MS = 24;
export const VENTANA = 30;
export const VENTANAS_PARA_SUBIR = 3;
export const PASO_SUBIR = 1.06;
export const PASO_SUBIR_MIN = 0.02;
/**
 * Sondeo inicial: mientras no haya habido ninguna bajada, sube más deprisa
 * (menos ventanas, paso mayor) para que una GPU holgada llegue a su techo en
 * unos 7 s, no en 20. La primera bajada lo desactiva y pasa al modo prudente.
 */
export const VENTANAS_SUBIR_INICIAL = 2;
export const PASO_SUBIR_INICIAL = 1.12;
export const FACTOR_BAJAR_MIN = 0.7;
export const FACTOR_BAJAR_MAX = 0.92;
export const ENFRIAMIENTO_BASE_MS = 6000;
export const ENFRIAMIENTO_MAX_MS = 60000;
/** Una subida seguida de una bajada en menos de esto cuenta como oscilación. */
export const VENTANA_OSCILACION_MS = 8000;
export const CONGELAR_BASE_MS = 30000;
export const CONGELAR_MAX_MS = 240000;
/** Mejora mínima del intervalo (fracción) para considerar que la bajada sirvió. */
export const MEJORA_MINIMA = 0.08;
/** En reposo (cadencia baja) se baja si la mediana del intervalo supera esto × el periodo pedido. */
export const RETRASO_REPOSO = 1.5;
export const MUESTRAS_REPOSO = 8;
export const MAX_REGISTRO = 200;
/** Fotogramas que se descartan tras un corte: arrastran compilación, hidratación o el despertar. */
export const DESCARTE_TRAS_CORTE = 10;

export type Motivo =
  | "inicio"
  | "bajar"
  | "subir"
  | "sin-mejora"
  | "reposo-lento"
  | "techo"
  | "forzado";

export type Cambio = {
  /** Instante (ms) en que se decidió. */
  t: number;
  de: number;
  a: number;
  motivo: Motivo;
  /** fps medidos en la ventana que motivó el cambio (0 si no aplica). */
  fps: number;
};

export type ControlEscala = {
  readonly escala: number;
  readonly max: number;
  readonly registro: readonly Cambio[];
  /** Estado interno resumido, para el gancho de QA. */
  diagnostico: () => {
    escala: number; max: number; min: number; enfriamientoMs: number; congeladoHasta: number;
    hastaSubir: number; limiteSuperior: number; cambios: number;
  };
  /** Intervalo (ms) entre dos fotogramas renderizados seguidos en modo activo. */
  muestra: (intervaloMs: number, ahoraMs: number) => Cambio | null;
  /** Intervalo entre fotogramas en reposo, con el periodo pedido (ms). Solo baja. */
  muestraReposo: (intervaloMs: number, periodoMs: number, ahoraMs: number) => Cambio | null;
  /** Corta el flujo (cambio de modo, pestaña oculta): descarta la ventana en curso y los primeros fotogramas. */
  corte: () => void;
  /** ¿Merece la pena una ráfaga de sondeo ahora? (escala < techo, sin enfriamiento ni congelación) */
  quiereSonda: (ahoraMs: number) => boolean;
  /** Cambia el techo (zoom, DPR). Devuelve un cambio si la escala lo superaba. */
  fijarMax: (max: number, ahoraMs: number) => Cambio | null;
  /** Fuerza una escala (QA, redimensionado). No cuenta como decisión del control. */
  forzar: (escala: number, ahoraMs: number, motivo?: Motivo) => Cambio | null;
};

const mediana = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const percentil = (a: number[], q: number) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};

export function crearControl(o: { inicial: number; min: number; max: number }): ControlEscala {
  const min = o.min;
  let max = Math.max(o.max, min);
  let escala = Math.min(Math.max(o.inicial, min), max);

  const registro: Cambio[] = [];
  let buf: number[] = [];
  let bufReposo: number[] = [];
  let buenas = 0;
  let hastaSubir = 0;
  let limiteSuperior = Infinity;
  let enfriamiento = ENFRIAMIENTO_BASE_MS;
  let ultimaSubida = -Infinity;
  let ultimaBajada = -Infinity;
  let congeladoHasta = 0;
  let congelar = CONGELAR_BASE_MS;
  let pendiente: { de: number; a: number; medAntes: number } | null = null;
  /** Sondeo inicial: sin bajadas todavía. */
  let sondeo = true;
  let descartar = DESCARTE_TRAS_CORTE;

  const anotar = (t: number, de: number, a: number, motivo: Motivo, fps: number): Cambio => {
    const c = { t, de, a, motivo, fps: Math.round(fps) };
    registro.push(c);
    if (registro.length > MAX_REGISTRO) registro.shift();
    escala = a;
    descartar = Math.max(descartar, 3); // el cambio de tamaño del lienzo reasigna memoria
    return c;
  };
  anotar(0, escala, escala, "inicio", 0);

  const bajarA = (ahora: number, fps: number, factor: number, motivo: Motivo, medAntes: number): Cambio | null => {
    const a = Math.max(min, escala * factor);
    if (escala - a < 0.01) return null;
    /* Oscilación: una bajada poco después de una subida alarga el enfriamiento */
    if (ahora - ultimaSubida < VENTANA_OSCILACION_MS) enfriamiento = Math.min(enfriamiento * 2, ENFRIAMIENTO_MAX_MS);
    limiteSuperior = escala * 0.97;
    hastaSubir = ahora + enfriamiento;
    ultimaBajada = ahora;
    sondeo = false;
    pendiente = { de: escala, a, medAntes };
    buenas = 0;
    return anotar(ahora, escala, a, motivo, fps);
  };

  return {
    get escala() { return escala; },
    get max() { return max; },
    registro,
    diagnostico: () => ({ escala, max, min, enfriamientoMs: enfriamiento, congeladoHasta, hastaSubir, limiteSuperior, cambios: registro.length - 1 }),

    muestra(intervaloMs, ahora) {
      if (descartar > 0) { descartar--; return null; }
      buf.push(intervaloMs);
      if (buf.length < VENTANA) return null;
      const med = mediana(buf);
      const p95 = percentil(buf, 0.95);
      buf = [];
      const fps = 1000 / med;

      /* ¿Sirvió la bajada anterior? Si el intervalo no mejoró, la escala no es el cuello de botella */
      if (pendiente) {
        const p = pendiente;
        pendiente = null;
        if (fps < FPS_BAJAR && med > p.medAntes * (1 - MEJORA_MINIMA)) {
          congeladoHasta = ahora + congelar;
          congelar = Math.min(congelar * 2, CONGELAR_MAX_MS);
          limiteSuperior = Infinity;
          buenas = 0;
          return anotar(ahora, escala, p.de, "sin-mejora", fps);
        }
      }
      if (ahora < congeladoHasta) return null;

      if (fps < FPS_BAJAR) {
        buenas = 0;
        if (escala <= min + 1e-6) return null;
        const factor = Math.min(FACTOR_BAJAR_MAX, Math.max(FACTOR_BAJAR_MIN, Math.sqrt(1000 / FPS_OBJETIVO / med)));
        return bajarA(ahora, fps, factor, "bajar", med);
      }

      if (fps >= FPS_SUBIR && p95 <= P95_MAX_SUBIDA_MS) {
        buenas++;
        if (ahora >= hastaSubir) limiteSuperior = Infinity;
        const techo = Math.min(max, limiteSuperior);
        const nVent = sondeo ? VENTANAS_SUBIR_INICIAL : VENTANAS_PARA_SUBIR;
        if (buenas >= nVent && ahora >= hastaSubir && escala < techo - 1e-6) {
          const paso = sondeo ? PASO_SUBIR_INICIAL : PASO_SUBIR;
          const a = Math.min(techo, Math.max(escala * paso, escala + PASO_SUBIR_MIN));
          buenas = 0;
          ultimaSubida = ahora;
          /* Mucho tiempo sin bajar: el enfriamiento vuelve a su base */
          if (ahora - ultimaBajada > 4 * enfriamiento) enfriamiento = ENFRIAMIENTO_BASE_MS;
          return anotar(ahora, escala, a, "subir", fps);
        }
      } else {
        buenas = 0;
      }
      return null;
    },

    muestraReposo(intervaloMs, periodoMs, ahora) {
      bufReposo.push(intervaloMs / periodoMs);
      if (bufReposo.length < MUESTRAS_REPOSO) return null;
      const razon = mediana(bufReposo);
      bufReposo = [];
      if (razon <= RETRASO_REPOSO || ahora < congeladoHasta || escala <= min + 1e-6) return null;
      const factor = Math.min(FACTOR_BAJAR_MAX, Math.max(FACTOR_BAJAR_MIN, Math.sqrt(1 / razon)));
      return bajarA(ahora, 1000 / (razon * periodoMs), factor, "reposo-lento", razon * periodoMs);
    },

    corte() {
      buf = [];
      bufReposo = [];
      buenas = 0;
      descartar = DESCARTE_TRAS_CORTE;
    },

    quiereSonda(ahora) {
      return escala < max - 1e-6 && ahora >= hastaSubir && ahora >= congeladoHasta;
    },

    fijarMax(nuevo, ahora) {
      max = Math.max(nuevo, min);
      if (escala > max) return anotar(ahora, escala, max, "techo", 0);
      return null;
    },

    forzar(valor, ahora, motivo = "forzado") {
      const a = Math.min(Math.max(valor, min), max);
      if (Math.abs(a - escala) < 1e-9) return null;
      buf = [];
      buenas = 0;
      pendiente = null;
      descartar = DESCARTE_TRAS_CORTE;
      return anotar(ahora, escala, a, motivo, 0);
    },
  };
}
