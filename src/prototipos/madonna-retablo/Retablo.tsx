"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { crearEscena, LOOKS_VALIDOS, type Cavidad, type Escena, type Look, type Perfil } from "./retabloGL";
import {
  ESTACIONES, evaluar, focoDe, movimientoAmbiental, poseEn, poseLibre, puntosDe, FRAGMENTOS, type Pose, type V3,
} from "./composicion";
/* Control de escala adaptativa de V1.3B, sin cambios (módulo puro) */
import { crearControl, type ControlEscala } from "../madonna-arquitectura/escalaAdaptativa";

/* ═══════════════════════════════════════════
   Constantes
   ═══════════════════════════════════════════ */
const EL_MIN = -0.4;
const EL_MAX = 0.55;
const AZ_MAX = 1.1;
const PRESUPUESTO = { desktop: 450_000, movil: 300_000 };
const DPR_MAX = { desktop: 2, movil: 1.5 };
const ESCALA_MIN = 0.35;
/** Cadencia del render en reposo mientras queda movimiento ambiental (el oleaje y la flotación son lentos). */
const CADENCIA_REPOSO = 12;
const PERIODO_REPOSO_MS = 1000 / CADENCIA_REPOSO;
const ACTIVO_TRAS_ENTRADA_MS = 400;
const SONDA_MS = 3500;
const SONDA_PAUSA_MS = 10_000;
const LLEGADA = 2e-4;
/** Una estación se considera «actual» a menos de esta distancia en p. */
const TOL_ESTACION = 0.035;
/** Velocidad máxima del planeo hacia una estación, en unidades de p por segundo (de I a III ≈ 3,5 s). */
const VMAX_PLANEO = 0.5;

function perfil(): Perfil {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 || "ontouchstart" in window ? "movil" : "desktop";
}
const aspectoDe = (c: HTMLCanvasElement) => Math.max(c.clientWidth, 1) / Math.max(c.clientHeight, 1);
const acotar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Modo = "activo" | "reposo";
/** estacion: la última estación cercana; cerca: si la cámara está ahora en una estación; alineado: vista alineada. */
type Vista = { estacion: number; cerca: boolean; alineado: boolean };
const VISTA0: Vista = { estacion: 0, cerca: true, alineado: false };

const ANUNCIO = [
  "La aparición lejana: una arquitectura fragmentada suspendida sobre el mar.",
  "Entre los fragmentos: la cámara atraviesa la arquitectura y el paisaje se ve entre las piezas.",
  "La revelación: la cámara retrocede, las piezas se recomponen y el movimiento se detiene.",
];

/* ═══════════════════════════════════════════
   Componente
   ═══════════════════════════════════════════ */
export function Retablo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [vista, setVista] = useState<Vista>(VISTA0);
  const [glOk, setGlOk] = useState(true);
  const [libre, setLibre] = useState(false);
  /** El mando se desvanece en la vista alineada tras unos segundos sin actividad (no tapa la composición). */
  const [oculto, setOculto] = useState(false);

  const s = useRef({
    escena: null as Escena | null,
    control: null as ControlEscala | null,
    pf: "desktop" as Perfil,
    /* Recorrido: p objetivo, pS suavizado, pMeta (planeo hacia una estación) */
    p: 0, pS: 0, pMeta: null as number | null,
    /* Exploración libre */
    libre: false, az: 0, el: 0, azS: 0, elS: 0,
    /* Reloj ambiental: solo avanza mientras hay movimiento (m > 0) */
    tAmb: 0, tFijo: null as number | null, mFijo: null as number | null,
    prox: 0, m: 1,
    ultimo: 0,
    /* Interacción */
    drag: false, px0: 0, py0: 0, p0: 0, az0: 0, el0: 0,
    activoHasta: 0,
    vista: VISTA0,
    /* Pose forzada (solo QA / exploración de planos) */
    forzada: null as Pose | null,
    visible: true, enPantalla: true, reducido: false,
    raf: 0, timer: 0, dormido: false, sucio: true, tamano: true,
    modo: "activo" as Modo,
    ultimoRender: 0, ultimoActivo: 0, ultimoReposo: 0, sondaHasta: 0, sondaLibre: 0,
    renders: 0, hudN: 0, hudT0: 0,
    despertar: () => {},
  });

  /* ── Montaje + bucle de render bajo demanda ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lienzo: HTMLCanvasElement = canvas;
    const r = s.current;
    r.pf = perfil();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    r.reducido = mq.matches;

    const params = new URLSearchParams(window.location.search);
    const esQa = params.has("qa");
    if (esQa && fpsRef.current) fpsRef.current.hidden = false; // diagnóstico visible solo con ?qa=1
    const p0 = parseFloat(params.get("p") ?? "");
    if (Number.isFinite(p0)) { r.p = r.pS = acotar(p0, 0, 1); }

    /* V2.2A: `?look=a|b` elige una de las dos pruebas de material; sin parámetro, exactamente V2.1 */
    const lk = params.get("look");
    const cav = params.get("cavidad");
    const cavidad: Cavidad = cav === "b1" ? "b1" : cav === "b2" ? "b2" : cav === "completa" ? "completa" : false;
    const look: Look = LOOKS_VALIDOS.find((v) => v === lk) ?? (cavidad ? "hybrid" : "v21");

    const esc0 = crearEscena(lienzo, r.pf, look, cavidad);
    if (!esc0) { setGlOk(false); return; }
    r.escena = esc0;

    const dprMax = () => Math.min(devicePixelRatio, DPR_MAX[r.pf]);
    const area = Math.max(lienzo.clientWidth * lienzo.clientHeight, 1);
    const inicial = Math.min(dprMax(), Math.sqrt(PRESUPUESTO[r.pf] / area));
    const control = crearControl({ inicial, min: Math.min(ESCALA_MIN, inicial), max: dprMax() });
    r.control = control;

    let aspecto = aspectoDe(lienzo);

    const poseActual = (): Pose => {
      if (r.forzada) return r.forzada;
      return r.libre || Math.abs(r.azS) > 1e-4 || Math.abs(r.elS) > 1e-4 ? poseLibre(r.pS, r.azS, r.elS) : poseEn(r.pS);
    };

    /** Sube escala, encuadre, cámara y estado ambiental a una escena (nueva o tras un cambio de tamaño). */
    const aplicarPose = (e: Escena) => {
      const pose = poseActual();
      const ev = evaluar(pose, aspecto);
      r.prox = ev.revelacion;
      r.m = r.mFijo ?? (r.reducido ? 0 : movimientoAmbiental(ev.revelacion));
      e.camara(pose.pos, pose.mira);
      e.encuadre(focoDe(pose, aspecto));
      e.proximidad(ev.revelacion);
      e.ambiente(r.tFijo ?? r.tAmb, r.m);
      return ev;
    };
    const configurar = (e: Escena) => {
      e.medir(control.escala);
      aplicarPose(e);
    };
    configurar(esc0);

    const aplicarEscala = () => {
      if (r.escena?.medir(control.escala)) r.sucio = true;
    };

    /* ── Gancho de QA (solo con ?qa=1) ── */
    if (esQa) {
      const gancho = {
        estado: () => {
          const pose = poseActual();
          const ev = evaluar(pose, aspecto);
          return {
            p: r.pS, az: r.azS, el: r.elS, aspecto, pose, error: ev.error, prox: ev.prox, revelacion: ev.revelacion, alineado: ev.alineado,
            visibles: ev.visibles, m: r.m, tAmb: r.tAmb,
            w: lienzo.width, h: lienzo.height, escala: control.escala, modo: r.modo, renders: r.renders,
            dormido: r.dormido, perdido: !!r.escena?.perdido, sondeando: performance.now() < r.sondaHasta,
          };
        },
        /** Fija el punto del recorrido (y opcionalmente la órbita) sin suavizado. */
        fijar: (p: number, az = 0, el = 0) => {
          r.p = r.pS = acotar(p, 0, 1); r.pMeta = null;
          r.az = r.azS = az; r.el = r.elS = el;
          r.forzada = null;
          r.despertar();
        },
        /** Pose arbitraria (exploración de planos): posición, punto de mira y foco relativo. */
        pose: (pos: V3, mira: V3, foco: number) => { r.forzada = { pos, mira, foco }; r.despertar(); },
        /** Congela el reloj ambiental (t) y/o el factor de movimiento (m) para capturas reproducibles. */
        ambiente: (t: number | null, m: number | null) => { r.tFijo = t; r.mFijo = m; r.despertar(); },
        sondas: () => {
          const pose = poseActual();
          const ev = evaluar(pose, aspecto);
          const ids = r.escena!.muestrear(ev.sondas.map((p) => p ?? [9, 9]));
          return FRAGMENTOS.map((f, i) => ({ nombre: f.nombre, esperado: f.id, leido: ids[i] }));
        },
        silueta: () => r.escena!.silueta(),
        /** Fracción del lienzo ocupada por geometría (ids ≥ 0). */
        cobertura: () => {
          const sil = r.escena!.silueta();
          return sil.reduce((a, c) => a + c.n, 0) / (lienzo.width * lienzo.height);
        },
        puntos: () => FRAGMENTOS.map((f) => puntosDe(f).length),
        escala: (v: number) => { control.forzar(v, performance.now()); aplicarEscala(); r.despertar(); },
        registro: () => control.registro.slice(),
        diagnostico: () => control.diagnostico(),
      };
      (window as unknown as { __madonna?: typeof gancho }).__madonna = gancho;
    }

    /* ── HUD de diagnóstico (solo QA): fps de render reales y escala ── */
    const pintarHud = (ts: number, estado?: "estatico" | "modo") => {
      const el = fpsRef.current;
      if (!el) return;
      if (estado === "estatico") { el.textContent = `— fps · ×${control.escala.toFixed(2)} · estático`; return; }
      if (estado === "modo") { el.textContent = `— fps · ×${control.escala.toFixed(2)}${r.modo === "reposo" ? " · reposo" : ""}`; return; }
      if (!r.hudT0) { r.hudT0 = ts; r.hudN = 0; return; }
      const dt = ts - r.hudT0;
      if (dt < 500) return;
      const fps = Math.round((r.hudN * 1000) / dt);
      r.hudN = 0;
      r.hudT0 = ts;
      el.textContent = `${fps} fps · ×${control.escala.toFixed(2)}${r.modo === "reposo" ? " · reposo" : ""}`;
    };

    /* ── Planificación ── */
    const programar = (ms: number) => {
      if (r.raf || r.timer) return;
      if (ms > 12) {
        r.timer = window.setTimeout(() => { r.timer = 0; r.raf = requestAnimationFrame(loop); }, ms - 8);
      } else {
        r.raf = requestAnimationFrame(loop);
      }
    };
    r.despertar = () => {
      r.sucio = true;
      r.activoHasta = performance.now() + ACTIVO_TRAS_ENTRADA_MS;
      if (r.timer) { window.clearTimeout(r.timer); r.timer = 0; }
      if (r.dormido) { r.dormido = false; r.ultimo = 0; r.ultimoActivo = 0; r.ultimoReposo = 0; control.corte(); }
      if (!r.raf) r.raf = requestAnimationFrame(loop);
    };
    const reanudar = () => {
      const hasta = r.activoHasta;
      r.despertar();
      r.activoHasta = hasta;
    };

    /**
     * Con la imagen quieta (alineada o reduced motion) no hay nada que repintar, pero la resolución puede estar por
     * debajo del techo: se despierta en el momento en que el control permita otra ráfaga de sondeo y, cuando llega al
     * techo (o queda congelada), el bucle se duerme del todo.
     */
    const aQuietud = (ts: number) => {
      const d = control.diagnostico();
      if (d.escala < d.max - 1e-6) {
        programar(Math.max(250, Math.max(d.hastaSubir, d.congeladoHasta, r.sondaLibre) - ts));
      } else {
        r.dormido = true;
        pintarHud(ts, "estatico");
      }
    };

    function loop(ts: number) {
      r.raf = 0;
      const escena = r.escena;
      if (!escena || escena.perdido || !r.visible || !r.enPantalla) { r.dormido = true; return; }

      const dt = r.ultimo ? Math.min((ts - r.ultimo) / 1000, 0.1) : 0.016;
      r.ultimo = ts;

      /* Planeo hacia una estación (solicitado por el visitante; se interrumpe al arrastrar) */
      if (r.pMeta !== null && !r.drag) {
        const k = 1 - Math.exp(-dt * 2.4);
        const d = r.pMeta - r.p;
        /* V2.1: velocidad máxima del planeo (el recorrido es más largo y con más movimiento de cámara): sin barridos bruscos */
        const paso = Math.min(Math.abs(d) * k, dt * VMAX_PLANEO);
        r.p += Math.sign(d) * Math.max(paso, Math.min(Math.abs(d), dt * 0.05));
        if (Math.abs(r.pMeta - r.p) < 0.0015) { r.p = r.pMeta; r.pMeta = null; }
      }

      /* Suavizado de la cámara; al llegar se fija exactamente */
      const ks = 1 - Math.exp(-dt * (r.reducido ? 40 : 7));
      r.pS += (r.p - r.pS) * ks;
      r.azS += (r.az - r.azS) * ks;
      r.elS += (r.el - r.elS) * ks;
      const enMovimiento = Math.abs(r.p - r.pS) > LLEGADA || Math.abs(r.az - r.azS) > LLEGADA * 5 || Math.abs(r.el - r.elS) > LLEGADA * 5;
      if (!enMovimiento) { r.pS = r.p; r.azS = r.az; r.elS = r.el; }

      /* Pose, alineación y factor de movimiento ambiental */
      const pose = poseActual();
      const ev = evaluar(pose, aspecto);
      r.prox = ev.revelacion;
      const m = r.mFijo ?? (r.reducido ? 0 : movimientoAmbiental(ev.revelacion));
      r.m = m;
      if (r.tFijo === null) r.tAmb += dt * m;

      /* Modo: activo (cada fotograma) o reposo (solo el movimiento ambiental que quede) */
      const usuario = r.drag || r.pMeta !== null || enMovimiento || ts < r.activoHasta;
      if (!usuario && ts >= r.sondaHasta && ts >= r.sondaLibre && control.quiereSonda(ts)) {
        r.sondaHasta = ts + SONDA_MS;
        r.sondaLibre = r.sondaHasta + SONDA_PAUSA_MS;
      }
      const activo = usuario || ts < r.sondaHasta;
      const modo: Modo = activo ? "activo" : "reposo";
      if (modo !== r.modo) {
        control.corte();
        r.ultimoActivo = 0;
        r.ultimoReposo = 0;
        r.modo = modo;
        r.hudT0 = 0;
        pintarHud(ts, "modo");
      }

      if (r.tamano) {
        r.tamano = false;
        aspecto = aspectoDe(lienzo);
        control.fijarMax(dprMax(), ts);
        aplicarEscala();
        r.sucio = true;
      }

      /* Sin movimiento ambiental (alineado o reduced motion): la imagen es estática y solo se repinta si cambia algo */
      const quieto = r.reducido || m <= 0;
      const tocaReposo = !quieto && ts - r.ultimoRender >= PERIODO_REPOSO_MS - 3;
      if (!(activo || r.sucio || tocaReposo)) {
        if (quieto) { aQuietud(ts); return; }
        programar(PERIODO_REPOSO_MS - (performance.now() - r.ultimoRender));
        return;
      }

      if (activo) {
        const cambio = r.ultimoActivo ? control.muestra(ts - r.ultimoActivo, ts) : null;
        if (cambio) {
          aplicarEscala();
          if (cambio.motivo === "subir" && ts < r.sondaHasta) {
            r.sondaHasta = ts + SONDA_MS;
            r.sondaLibre = r.sondaHasta + SONDA_PAUSA_MS;
          }
        }
        r.ultimoActivo = ts;
      } else if (!quieto) {
        if (r.ultimoReposo && control.muestraReposo(ts - r.ultimoReposo, PERIODO_REPOSO_MS, ts)) aplicarEscala();
        r.ultimoReposo = ts;
      }

      escena.camara(pose.pos, pose.mira);
      escena.encuadre(focoDe(pose, aspecto));
      escena.proximidad(ev.revelacion);
      escena.ambiente(r.tFijo ?? r.tAmb, m);

      /* Estado de la interfaz: estación más cercana y alineación */
      let cercana = -1;
      ESTACIONES.forEach((e, i) => { if (Math.abs(e.p - r.pS) <= TOL_ESTACION) cercana = i; });
      const cerca = cercana >= 0;
      const estacion = cerca ? cercana : r.vista.estacion;
      const alineado = ev.alineado && !r.libre;
      if (estacion !== r.vista.estacion || cerca !== r.vista.cerca || alineado !== r.vista.alineado) {
        r.vista = { estacion, cerca, alineado };
        setVista(r.vista);
      }
      const sl = sliderRef.current;
      if (sl && document.activeElement !== sl) sl.value = String(Math.round(r.pS * 1000));

      escena.pintar();
      r.renders++;
      r.hudN++;
      r.sucio = false;
      r.ultimoRender = ts;
      pintarHud(ts);

      if (activo) programar(0);
      else if (quieto) aQuietud(ts);
      else programar(PERIODO_REPOSO_MS - (performance.now() - ts));
    }

    /* ── Visibilidad, tamaño, movimiento reducido ── */
    const io = new IntersectionObserver(
      ([e]) => { r.enPantalla = e.isIntersecting; if (r.enPantalla) reanudar(); },
      { threshold: 0.05 },
    );
    io.observe(lienzo);
    const onVis = () => { r.visible = document.visibilityState === "visible"; if (r.visible) reanudar(); };
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(() => { r.tamano = true; reanudar(); });
    ro.observe(lienzo);
    const onMovimiento = (e: MediaQueryListEvent) => { r.reducido = e.matches; reanudar(); };
    mq.addEventListener("change", onMovimiento);

    /* ── Rueda: solo sobre el lienzo y solo mientras el visitante la usa; la página no se desplaza ── */
    const onRueda = (e: WheelEvent) => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * 600 : e.deltaY;
      if (r.libre) return;
      r.pMeta = null;
      r.p = acotar(r.p + px / 1800, 0, 1);
      r.despertar();
    };
    lienzo.addEventListener("wheel", onRueda, { passive: false });

    /* ── Pérdida y restauración del contexto WebGL ── */
    const onPerdido = (e: Event) => { e.preventDefault(); if (r.escena) r.escena.perdido = true; };
    const onRestaurado = () => {
      const nueva = crearEscena(lienzo, r.pf, look, cavidad);
      if (!nueva) { setGlOk(false); return; }
      r.escena?.liberar();
      r.escena = nueva;
      configurar(nueva);
      reanudar();
    };
    lienzo.addEventListener("webglcontextlost", onPerdido);
    lienzo.addEventListener("webglcontextrestored", onRestaurado);

    r.despertar();

    return () => {
      cancelAnimationFrame(r.raf);
      window.clearTimeout(r.timer);
      r.raf = 0;
      r.timer = 0;
      r.despertar = () => {};
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      mq.removeEventListener("change", onMovimiento);
      lienzo.removeEventListener("wheel", onRueda);
      lienzo.removeEventListener("webglcontextlost", onPerdido);
      lienzo.removeEventListener("webglcontextrestored", onRestaurado);
      delete (window as unknown as { __madonna?: unknown }).__madonna;
      r.escena?.liberar();
      r.escena = null;
      if (!lienzo.isConnected) {
        lienzo.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
  }, []);

  /* ── El mando se aparta en la vista alineada: vuelve con cualquier gesto, tecla o foco ── */
  useEffect(() => {
    if (!vista.alineado) return;
    let t = window.setTimeout(() => setOculto(true), 3000);
    const despierta = () => {
      setOculto(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setOculto(true), 3000);
    };
    const eventos = ["pointermove", "pointerdown", "keydown", "touchstart", "wheel"] as const;
    eventos.forEach((e) => window.addEventListener(e, despierta, { passive: true }));
    return () => {
      window.clearTimeout(t);
      eventos.forEach((e) => window.removeEventListener(e, despierta));
      setOculto(false);
    };
  }, [vista.alineado]);

  /* ── Acciones ── */
  const irA = useCallback((p: number) => {
    const r = s.current;
    r.libre = false; setLibre(false);
    r.az = r.el = 0;
    if (r.reducido) { r.p = r.pS = p; r.pMeta = null; r.azS = r.elS = 0; }
    else r.pMeta = p;
    r.despertar();
  }, []);

  const alternarLibre = useCallback(() => {
    const r = s.current;
    r.libre = !r.libre;
    r.pMeta = null;
    if (!r.libre) { r.az = 0; r.el = 0; if (r.reducido) { r.azS = r.elS = 0; } }
    setLibre(r.libre);
    r.despertar();
  }, []);

  const onSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const r = s.current;
    r.libre = false; setLibre(false);
    r.az = r.el = 0;
    r.pMeta = null;
    r.p = acotar(Number(e.target.value) / 1000, 0, 1);
    if (r.reducido) r.pS = r.p;
    r.despertar();
  }, []);

  /* ── Puntero: arrastrar avanza o retrocede por el recorrido (o gira, en exploración libre) ── */
  const onDown = useCallback((e: React.PointerEvent) => {
    const r = s.current;
    r.drag = true;
    r.px0 = e.clientX; r.py0 = e.clientY;
    r.p0 = r.p; r.az0 = r.az; r.el0 = r.el;
    r.pMeta = null;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    r.despertar();
  }, []);
  const onMove = useCallback((e: React.PointerEvent) => {
    const r = s.current;
    if (!r.drag) return;
    const dx = e.clientX - r.px0;
    const dy = e.clientY - r.py0;
    if (r.libre) {
      const sens = r.pf === "movil" ? 0.006 : 0.004;
      r.az = acotar(r.az0 - dx * sens, -AZ_MAX, AZ_MAX);
      r.el = acotar(r.el0 + dy * sens, EL_MIN, EL_MAX);
    } else {
      const lienzo = canvasRef.current;
      const L = lienzo ? Math.max(lienzo.clientWidth, lienzo.clientHeight) : 800;
      /* A la derecha o hacia arriba avanza; a la izquierda o hacia abajo retrocede */
      r.p = acotar(r.p0 + (dx - dy) / (L * 0.85), 0, 1);
    }
    r.despertar();
  }, []);
  const onUp = useCallback(() => { s.current.drag = false; s.current.despertar(); }, []);

  /* ── Teclado ── */
  const onKey = useCallback((e: React.KeyboardEvent) => {
    const r = s.current;
    const mover = (dp: number) => { r.libre = false; setLibre(false); r.az = r.el = 0; r.pMeta = null; r.p = acotar(r.p + dp, 0, 1); if (r.reducido) r.pS = r.p; };
    if (r.libre && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      const paso = 0.06;
      if (e.key === "ArrowLeft") r.az = acotar(r.az - paso, -AZ_MAX, AZ_MAX);
      else if (e.key === "ArrowRight") r.az = acotar(r.az + paso, -AZ_MAX, AZ_MAX);
      else if (e.key === "ArrowUp") r.el = acotar(r.el + paso, EL_MIN, EL_MAX);
      else r.el = acotar(r.el - paso, EL_MIN, EL_MAX);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") mover(0.03);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") mover(-0.03);
    else if (e.key === "PageDown" || e.key === " ") mover(0.12);
    else if (e.key === "PageUp") mover(-0.12);
    else if (e.key === "Home") irA(0);
    else if (e.key === "End") irA(1);
    else if (e.key === "1" || e.key === "2" || e.key === "3") irA(ESTACIONES[Number(e.key) - 1].p);
    else return;
    e.preventDefault();
    r.despertar();
  }, [irA]);

  const est = ESTACIONES[vista.estacion];
  return (
    <div className="rt" data-gl={glOk ? "si" : "no"} data-alineado={vista.alineado ? "si" : "no"} data-oculto={oculto ? "si" : "no"}>
      <canvas
        ref={canvasRef}
        className="rt-lienzo"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        tabIndex={0}
        role="img"
        aria-label="Instalación tridimensional: nueve fragmentos arquitectónicos colosales suspendidos sobre el mar. Arrastra, usa la rueda o las flechas para avanzar por el recorrido; hay tres posiciones: la aparición lejana, entre los fragmentos y la revelación."
      />

      {/* Alternativa sin WebGL: la composición alineada, estática */}
      <div className="rt-alternativa" aria-hidden={glOk}>
        <svg viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="La composición alineada: concha, huevo, dos cornisas, cuatro volúmenes y un pedestal, con luz cálida en el centro vacío">
          <defs>
            <linearGradient id="rt-cielo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0a2a78" />
              <stop offset=".55" stopColor="#5d86e0" />
              <stop offset="1" stopColor="#e8edf9" />
            </linearGradient>
            <radialGradient id="rt-calido" cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#f0a35c" stopOpacity=".85" />
              <stop offset="1" stopColor="#f0a35c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="68" fill="url(#rt-cielo)" />
          <rect y="68" width="100" height="82" fill="#6f78c0" />
          <ellipse cx="50" cy="68" rx="26" ry="34" fill="url(#rt-calido)" />
          <path d="M42.6 6 H57.4 Q56 14 50 15 Q44 14 42.6 6 Z" fill="#dcd9e2" />
          <line x1="50" y1="15" x2="50" y2="24" stroke="#dcd9e2" strokeWidth=".4" />
          <ellipse cx="50" cy="26.1" rx="1.5" ry="2.1" fill="#ebe6e6" />
          <path d="M16.4 17.6 H44.4 V37.2 A8.4 8.4 0 0 0 36 45.6 H16.4 Z" fill="#8e9cac" />
          <path d="M83.6 17.6 H55.6 V37.2 A8.4 8.4 0 0 1 64 45.6 H83.6 Z" fill="#8e9cac" />
          <g fill="#7f8c9b">
            <path fillRule="evenodd" d="M16.4 56.4 h19.3 v27.7 h-19.3 Z M18.6 58.6 v23.3 h14.9 v-23.3 Z" />
            <path fillRule="evenodd" d="M64.3 56.4 h19.3 v27.7 h-19.3 Z M66.5 58.6 v23.3 h14.9 v-23.3 Z" />
            <path fillRule="evenodd" d="M16.7 82.6 h14.4 v33.3 h-14.4 Z M18.9 84.8 v28.9 h10 v-28.9 Z" />
            <path fillRule="evenodd" d="M68.9 82.6 h14.4 v33.3 h-14.4 Z M71.1 84.8 v28.9 h10 v-28.9 Z" />
          </g>
          <rect x="5" y="122.6" width="90" height="6" fill="#98a0b4" />
          <rect x="7" y="128.6" width="86" height="9" fill="#5f93a8" />
          <rect x="2.4" y="137.6" width="95.2" height="7.4" fill="#6f8f8c" />
        </svg>
        <p className="rt-alternativa__txt">Esta instalación requiere WebGL2.</p>
      </div>

      <div className="rt-hud">
        <header className="rt-cabeza">
          <p className="rt-ante">MANIFESTO · Interpretación</p>
          <h1 className="rt-titulo">El retablo que espera</h1>
          <p className="rt-sub">Escena original sobre <cite>La Madona de Portlligat</cite> (primera versión), Dalí, 1949. Prototipo V2.1.</p>
          <p className="rt-estado" role="status" aria-live="polite">{ANUNCIO[vista.estacion]}{vista.alineado ? " La perspectiva se alinea." : ""}</p>
        </header>

        <nav className="rt-mando" aria-label="Recorrido de la cámara">
          <div className="rt-estaciones" role="group" aria-label="Posiciones de la cámara">
            {ESTACIONES.map((e, i) => (
              <button
                key={e.id}
                type="button"
                className="rt-btn"
                aria-pressed={!libre && vista.cerca && vista.estacion === i}
                onClick={() => irA(e.p)}
              >
                <span className="rt-btn__num" aria-hidden="true">{["I", "II", "III"][i]}</span> {e.nombre}
              </button>
            ))}
          </div>
          <div className="rt-fila">
            <label className="rt-deslizador">
              <span className="rt-etiqueta">Recorrido</span>
              <input
                ref={sliderRef}
                type="range"
                min={0}
                max={1000}
                step={1}
                defaultValue={0}
                onChange={onSlider}
                aria-label="Recorrido"
                aria-valuetext={est.nombre}
              />
            </label>
            <button type="button" className="rt-btn rt-btn--sec" aria-pressed={libre} onClick={alternarLibre}>
              Explorar libremente
            </button>
          </div>
        </nav>

        <span className="rt-fps" ref={fpsRef} hidden>— fps</span>
      </div>
    </div>
  );
}
