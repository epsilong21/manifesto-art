import { esPrincipal, visibles } from "./relevo";

/*
 * Modelo de juguete de una cascada turbulenta (no resuelve Navier–Stokes).
 * El flujo es una deriva de izquierda a derecha más siete capas de remolinos
 * celulares, cada una de la mitad de tamaño que la anterior. Sus velocidades
 * siguen la proporción de Kolmogorov (u ∝ ℓ^1/3) y la viscosidad apaga las
 * capas más pequeñas que la escala mínima η ∝ Re^(-3/4).
 * Todas las escalas se expresan como fracción del remolino grande (1).
 */

/** Por debajo, el flujo es laminar. */
export const RE_CRITICO = 100;
/** Ancho de una pincelada respecto al remolino grande (convención del modelo). */
export const PINCELADA = 1 / 16;
const OCTAVAS = 7;

/** «Reynolds de juguete»: crece con la energía y baja con la viscosidad (ambas de 1 a 100). */
export const reynolds = (energia: number, viscosidad: number) => (200 * energia) / viscosidad;
/** Escala mínima de los remolinos, η ∝ Re^(-3/4) (calibrada para que η = 1/2 en RE_CRITICO). */
export const escalaMinima = (re: number) => Math.min(1, 15.8 * re ** -0.75);

/** El ejemplo «Como el cielo» del laboratorio: la cascada llega justo a la pincelada. */
export const CASCADA = { energia: 80, viscosidad: 10 };

export type Regimen = "laminar" | "cascada" | "ruido";
export const regimen = (re: number): Regimen =>
  re < RE_CRITICO ? "laminar" : escalaMinima(re) >= PINCELADA / 2 ? "cascada" : "ruido";

export type ParamsFlujo = { re: number; energia: number; activo: boolean };

type Octava = { amp: number; k: number; c: number; s: number; fx: number; fy: number; w: number; sem: number; fija: boolean };
type P = { x: number; y: number; px: number; py: number; life: number; max: number; c: string; w: number; z: number };

/*
 * Estelas sin poso. El rastro se funde cubriendo el lienzo con un velo casi
 * transparente; con 8 bits por canal, cada velo redondea y, cuando el paso queda
 * por debajo de medio nivel, el píxel se atasca en un gris que nunca llega al
 * fondo (con velos del 1-3 %, hasta 42 niveles por encima). Dos remedios:
 * 1) el velo se aplica en pasos de al menos PASO_FUNDIDO (acumulando el tiempo),
 *    así el residuo queda por debajo de 0,5 / PASO_FUNDIDO niveles a cualquier Hz;
 * 2) un filtro SVG (feComponentTransfer, al componer) lleva al fondo exacto todo
 *    lo que quede cerca de él. En el lienzo opaco el propio color del velo también
 *    se redondea (con alfa 0,06, el azul 38 pasa a valer 33), así que el residuo
 *    puede quedar por encima o por debajo del fondo: la banda es simétrica y
 *    suma los dos redondeos. En el transparente el velo solo resta alfa.
 * Si el navegador no aplica filter: url() sobre un canvas, queda el paso 1: el
 * residuo se queda en unos 12 niveles como mucho, sin errores ni lienzo vacío.
 */
const PASO_FUNDIDO = 0.06;
const RESIDUO = Math.ceil(0.5 / PASO_FUNDIDO);
/** Bandas que vuelven al fondo: opaco ±(redondeo del velo + del fundido); transparente, solo alfa. */
const BANDA_OPACO = 2 * RESIDUO + 2;
const BANDA_ALFA = RESIDUO + 2;
let filtros = 0;

/** Tabla de 256 valores (0-1) que lleva [fondo - banda, fondo + banda] al fondo y deja el resto igual. */
const tablaUmbral = (fondo: number, banda: number) =>
  Array.from({ length: 256 }, (_, v) => ((Math.abs(v - fondo) <= banda ? fondo : v) / 255).toFixed(5)).join(" ");

/** Crea el filtro de umbral del lienzo y devuelve cómo quitarlo. */
function filtroUmbral(canvas: HTMLCanvasElement, fondo?: string) {
  const ns = "http://www.w3.org/2000/svg";
  const id = `flujo-umbral-${++filtros}`;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  const filtro = document.createElementNS(ns, "filter");
  filtro.id = id;
  filtro.setAttribute("color-interpolation-filters", "sRGB");
  const ct = document.createElementNS(ns, "feComponentTransfer");
  const canal = (nombre: string, tabla: string) => {
    const f = document.createElementNS(ns, nombre);
    f.setAttribute("type", "table");
    f.setAttribute("tableValues", tabla);
    ct.appendChild(f);
  };
  if (fondo) {
    // Lienzo opaco: cada canal vuelve al color del fondo
    const [r, g, b] = fondo.split(",").map(Number);
    canal("feFuncR", tablaUmbral(r, BANDA_OPACO));
    canal("feFuncG", tablaUmbral(g, BANDA_OPACO));
    canal("feFuncB", tablaUmbral(b, BANDA_OPACO));
  } else {
    // Lienzo transparente: el alfa residual vuelve a 0
    canal("feFuncA", tablaUmbral(0, BANDA_ALFA));
  }
  filtro.appendChild(ct);
  svg.appendChild(filtro);
  document.body.appendChild(svg);
  canvas.style.filter = `url(#${id})`;
  return () => {
    canvas.style.filter = "";
    svg.remove();
  };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Opciones = {
  canvas: HTMLCanvasElement;
  /** Elemento que se observa (visibilidad y tamaño). */
  host: HTMLElement;
  /** Colores de las estelas, «r,g,b». */
  paleta: string[];
  /** Fondo opaco «r,g,b»; sin él, el lienzo es transparente y las estelas se borran. */
  fondo?: string;
  /** Partículas por superficie (1 = referencia). */
  densidad?: number;
  /** Cuánto se borra el rastro en cada fotograma a 60 Hz (menos = estelas más largas). */
  rastro?: number;
  /** Pausa global de la página (cielo.ts). */
  pausado: () => boolean;
  /** Tamaño del remolino grande respecto al ancho (por defecto, 0,9 del lado mayor). */
  remolino?: number;
  /** Fuerza de la deriva de izquierda a derecha (1 = laboratorio). */
  deriva?: number;
  /** Ritmo al que se rehacen los remolinos (1 = laboratorio; menos = trazos más largos y legibles). */
  giro?: number;
  /**
   * Sustituye la capa grande por remolinos con núcleo en posiciones fijas (fracciones
   * del lienzo; g = sentido de giro), con la misma amplitud que tendría esa capa.
   * Las capas menores siguen moviéndose dentro de ellos.
   */
  ancla?: { x: number; y: number; g: 1 | -1 }[];
};

/**
 * Monta un lienzo de corrientes. Solo anima si está a la vista, es el lienzo
 * principal de la página (relevo.ts), el cielo no está en pausa y no se pide
 * movimiento reducido. Si no puede animar, dibuja un fotograma fijo de líneas
 * de corriente cada vez que cambian los parámetros.
 */
export function montarFlujo(o: Opciones, inicial: ParamsFlujo) {
  const ctx = o.canvas.getContext("2d");
  if (!ctx) return null;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const id = Symbol("flujo");
  let params = inicial;
  let W = 0;
  let H = 0;
  let L = 1;
  let dpr = 1;
  let parts: P[] = [];
  let oct: Octava[] = [];
  let deriva = 0;
  let raf = 0;
  let ratio = 0;
  let t = 0;
  let last = performance.now();
  let slowFrames = 0;
  // Fracción del rastro que queda por fundir (se aplica en pasos de al menos PASO_FUNDIDO)
  let pendiente = 1;
  const quitaFiltro = filtroUmbral(o.canvas, o.fondo);
  // Hay que repintar el fotograma fijo (parámetros o tamaño nuevos)
  let sucio = true;

  const construyeOctavas = () => {
    const { re, energia } = params;
    const U = 1 + (1.6 * energia) / 100;
    // Por debajo de la mitad del umbral, nada de remolinos: solo la deriva
    const turb = smooth(RE_CRITICO * 0.5, RE_CRITICO * 1.4, re);
    const eta = escalaMinima(re);
    deriva = U * 0.85 * (o.deriva ?? 1);
    const previas = oct;
    oct = Array.from({ length: OCTAVAS }, (_, n) => {
      const l = 2 ** -n;
      const amp = U * 1.9 * l ** (1 / 3) * Math.exp(-((eta / l) ** 2)) * turb;
      // Ángulo y fase propios de cada capa (se conservan al mover los mandos)
      const p = previas[n];
      const k = (2 * Math.PI) / (L * l);
      const fija = n === 0 && o.ancla !== undefined;
      const ang = p ? Math.atan2(p.s, p.c) : Math.random() * Math.PI;
      return {
        amp,
        k,
        c: Math.cos(ang),
        s: Math.sin(ang),
        fx: p?.fx ?? Math.random() * 6.28,
        fy: p?.fy ?? Math.random() * 6.28,
        // Los remolinos pequeños giran y se rehacen más deprisa (tiempo de vuelta ∝ ℓ/u)
        w: (2.5 * (o.giro ?? 1) * amp) / (L * l),
        sem: p?.sem ?? Math.random() * 6.28,
        fija,
      };
    });
  };

  const campo = (x: number, y: number) => {
    let u = deriva;
    let v = deriva * 0.12 * Math.sin((6.28 * x) / L + t * 0.004);
    const xa = x - deriva * 0.6 * t;
    for (const q of oct) {
      if (q.amp < 0.02) continue;
      if (q.fija && o.ancla) {
        // Remolinos de Rankine: giro rígido dentro del núcleo y 1/r fuera
        const R = L * 0.22;
        const m = q.amp * 1.5 * (0.85 + 0.15 * Math.cos(q.w * t));
        for (const c of o.ancla) {
          const dx = x - c.x * W;
          const dy = y - c.y * H;
          const r = Math.hypot(dx, dy) || 1;
          const vt = (m * (r < R ? r / R : R / r)) / r;
          u += -dy * vt * c.g;
          v += dx * vt * c.g;
        }
        continue;
      }
      const xr = q.c * xa + q.s * y;
      const yr = -q.s * xa + q.c * y;
      const a = q.k * xr + q.fx + q.w * t * 0.5;
      const b = q.k * yr + q.fy;
      const m = q.amp * (0.65 + 0.35 * Math.cos(q.w * t + q.sem));
      const ur = m * Math.sin(a) * Math.cos(b);
      const vr = -m * Math.cos(a) * Math.sin(b);
      u += q.c * ur - q.s * vr;
      v += q.s * ur + q.c * vr;
    }
    return [u, v] as const;
  };

  const spawn = (p?: P): P => {
    const q = p ?? ({} as P);
    // Las nuevas nacen sobre todo a la izquierda: la deriva las lleva hacia la derecha
    q.x = Math.random() < 0.12 ? Math.random() * W * 0.1 : Math.random() * W;
    q.y = Math.random() * H;
    q.px = q.x;
    q.py = q.y;
    q.life = q.max = 70 + Math.random() * 180;
    q.z = Math.random() ** 1.3;
    q.c = o.paleta[Math.floor(Math.random() * o.paleta.length)];
    q.w = (0.6 + Math.random() * 1.1) * (0.6 + 0.6 * q.z);
    return q;
  };

  const resize = () => {
    const r = o.host.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    L = o.remolino ? W * o.remolino : Math.max(W, H) * 0.9;
    dpr = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.25 : 1.5);
    o.canvas.width = Math.round(W * dpr);
    o.canvas.height = Math.round(H * dpr);
    const small = W < 768;
    const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 4;
    let n = Math.round(((W * H) / (small ? 1300 : 1600)) * (o.densidad ?? 1));
    n = Math.min(n, small ? 260 : 700);
    if (lowEnd) n = Math.round(n / 2);
    parts = Array.from({ length: n }, () => spawn());
    construyeOctavas();
    limpia();
    sucio = true;
  };

  const limpia = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (o.fondo) {
      ctx.fillStyle = `rgb(${o.fondo})`;
      ctx.fillRect(0, 0, o.canvas.width, o.canvas.height);
    } else ctx.clearRect(0, 0, o.canvas.width, o.canvas.height);
  };

  /** Fotograma fijo: líneas de corriente trazadas con el campo congelado. */
  const estatico = () => {
    sucio = false;
    limpia();
    if (!params.activo) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const n = Math.round(parts.length * 0.55);
    for (let i = 0; i < n; i++) {
      // Secuencia R2 (baja discrepancia): cubre todo el lienzo sin grumos ni diagonales
      let x = ((0.5 + i * 0.7548776662) % 1) * W;
      let y = ((0.5 + i * 0.569840291) % 1) * H;
      const p = parts[i];
      ctx.strokeStyle = `rgba(${p.c},${(0.25 + 0.45 * p.z).toFixed(3)})`;
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 34; s++) {
        const [u, v] = campo(x, y);
        x += u * 1.6;
        y += v * 1.6;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  const puedeAnimar = () =>
    params.activo && ratio > 0 && !o.pausado() && !reduce.matches && !document.hidden && esPrincipal(id);

  const frame = (now: number) => {
    raf = 0;
    if (!puedeAnimar()) return;
    const dt = Math.min(48, now - last);
    last = now;
    slowFrames = dt > 30 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && parts.length > 100) {
      parts.length = Math.round(parts.length * 0.6);
      slowFrames = 0;
    }
    const step = dt / 16.7;
    t += step;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Rastro: el fondo cubre poco a poco las estelas anteriores, en pasos de al menos PASO_FUNDIDO
    pendiente *= (1 - (o.rastro ?? 0.04)) ** step;
    if (1 - pendiente >= PASO_FUNDIDO) {
      const fade = (1 - pendiente).toFixed(4);
      pendiente = 1;
      if (o.fondo) {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(${o.fondo},${fade})`;
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${fade})`;
      }
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const p of parts) {
      const [u, v] = campo(p.x, p.y);
      p.px = p.x;
      p.py = p.y;
      const lejos = 0.6 + 0.6 * p.z;
      p.x += u * step * lejos;
      p.y += v * step * lejos;
      p.life -= step;
      if (p.life <= 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) {
        spawn(p);
        continue;
      }
      const a = Math.min(1, (p.max - p.life) / 18) * Math.min(1, p.life / 50) * (0.4 + 0.6 * p.z) * 0.8;
      if (a < 0.01) continue;
      ctx.strokeStyle = `rgba(${p.c},${a.toFixed(3)})`;
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    sucio = false;
    raf = requestAnimationFrame(frame);
  };

  /** Arranca si puede; si no, deja un fotograma fijo al día. */
  const refresca = () => {
    if (puedeAnimar()) {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    } else {
      if (raf) stop();
      if (sucio && ratio > 0) estatico();
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const publica = () => visibles.set(id, params.activo ? ratio : 0);

  resize();
  const ro = new ResizeObserver(() => {
    resize();
    refresca();
  });
  ro.observe(o.host);
  const io = new IntersectionObserver(
    ([entry]) => {
      ratio = entry.isIntersecting ? entry.intersectionRatio || 0.001 : 0;
      publica();
      refresca();
    },
    { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] },
  );
  io.observe(o.host);
  const onCambio = () => refresca();
  document.addEventListener("visibilitychange", onCambio);
  reduce.addEventListener("change", onCambio);
  // Reanudar cuando otro lienzo deja de ser el principal o cambia la pausa
  const poll = window.setInterval(refresca, 400);

  return {
    actualizar(p: ParamsFlujo) {
      const cambiaActivo = p.activo !== params.activo;
      params = p;
      construyeOctavas();
      if (cambiaActivo) {
        publica();
        if (!p.activo) limpia();
      }
      sucio = true;
      refresca();
    },
    destruir() {
      stop();
      quitaFiltro();
      visibles.delete(id);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onCambio);
      reduce.removeEventListener("change", onCambio);
      window.clearInterval(poll);
    },
  };
}
