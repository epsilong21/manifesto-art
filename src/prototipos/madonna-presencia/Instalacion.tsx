"use client";
/**
 * La instalación 3D de V2.1 con el material Hybrid, como pieza de la prueba narrativa V2.3.
 * Mismo motor (`retabloGL`, `composicion`, control de escala adaptativa, render bajo demanda, fallback, reduced motion);
 * lo único nuevo es que el mando lo pone la narrativa (`Presencia`): este componente expone una API imperativa y avisa
 * de la vista, y solo repinta mientras está `activa` (una sola animación activa por página).
 */
import { useRef, useEffect, useState, useImperativeHandle, type Ref, type RefObject } from "react";
import { crearEscena, LOOKS_VALIDOS, type Cavidad, type Escena, type Look, type Perfil } from "../madonna-retablo/retabloGL";
import {
  ESTACIONES, evaluar, focoDe, movimientoAmbiental, poseEn, poseLibre, puntosDe, FRAGMENTOS, base, type Pose, type V3,
} from "../madonna-retablo/composicion";
import { crearControl, type ControlEscala } from "../madonna-arquitectura/escalaAdaptativa";

const EL_MIN = -0.4;
const EL_MAX = 0.55;
const AZ_MAX = 1.1;
const PRESUPUESTO = { desktop: 450_000, movil: 300_000 };
const DPR_MAX = { desktop: 2, movil: 1.5 };
const ESCALA_MIN = 0.35;
const CADENCIA_REPOSO = 12;
const PERIODO_REPOSO_MS = 1000 / CADENCIA_REPOSO;
const ACTIVO_TRAS_ENTRADA_MS = 400;
const SONDA_MS = 3500;
const SONDA_PAUSA_MS = 10_000;
const LLEGADA = 2e-4;
const TOL_ESTACION = 0.035;
const VMAX_PLANEO = 0.5;

function perfil(): Perfil {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 || "ontouchstart" in window ? "movil" : "desktop";
}
const aspectoDe = (c: HTMLCanvasElement) => Math.max(c.clientWidth, 1) / Math.max(c.clientHeight, 1);
const acotar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Modo = "activo" | "reposo";

/** Lo que la narrativa necesita saber de la instalación. */
export type VistaInst = { estacion: number; cerca: boolean; alineado: boolean; libre: boolean; pausa: boolean };
export const VISTA_INST0: VistaInst = { estacion: 0, cerca: true, alineado: false, libre: false, pausa: false };

/**
 * Encuadre de dirección (V2.4), aparte de la pose del recorrido: `zoom` multiplica el foco; `sx`/`sy` desplazan la
 * escena en pantalla (en alturas de pantalla; sx > 0 a la derecha, sy > 0 hacia arriba) girando la mirada de la cámara.
 * No altera la alineación (que se evalúa sobre la pose): el movimiento ambiental no se reactiva.
 */
export type Encuadre = { zoom: number; sx: number; sy: number };
export const ENCUADRE0: Encuadre = { zoom: 1, sx: 0, sy: 0 };
/** Clave de una coreografía de cámara: instante (ms desde el inicio) y encuadre. Entre claves, suavizado con reposo en cada una. */
export type Clave = Encuadre & { t: number };

export type InstalacionApi = {
  /** Anima el encuadre entre claves (ms); `fin` se llama al llegar a la última. Con reduced motion salta a la última. */
  coreografia: (claves: Clave[], fin?: () => void) => void;
  /** Fija el encuadre sin animación. */
  encuadre: (e: Encuadre) => void;
  encuadreActual: () => Encuadre;
  /** Planea hasta el punto p del recorrido (salto directo con reduced motion). */
  irA: (p: number) => void;
  /** Coloca la cámara en p sin planeo (el deslizador: el visitante tiene el control). */
  fijar: (p: number) => void;
  /** Siguiente / anterior estación según la posición actual. Devuelve el p de destino o null si no hay. */
  siguiente: () => number | null;
  anterior: () => number | null;
  /** Vuelve al inicio sin planeo (reinicia el recorrido). */
  reiniciar: () => void;
  alternarLibre: () => void;
  /** Pausa el planeo y el movimiento ambiental (la cámara se queda donde está). */
  pausar: (v: boolean) => void;
  posicion: () => number;
};

export function Instalacion({
  activa, look: lookProp, cavidad: cavidadProp, onVista, onGl, apiRef, sliderRef,
}: {
  activa: boolean;
  look?: Look;
  cavidad?: Cavidad;
  onVista: (v: VistaInst) => void;
  onGl?: (ok: boolean) => void;
  apiRef: Ref<InstalacionApi>;
  sliderRef: RefObject<HTMLInputElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glOk, setGlOk] = useState(true);
  const avisos = useRef({ onVista, onGl });
  useEffect(() => { avisos.current = { onVista, onGl }; });

  const s = useRef({
    escena: null as Escena | null,
    control: null as ControlEscala | null,
    pf: "desktop" as Perfil,
    p: 0, pS: 0, pMeta: null as number | null,
    libre: false, az: 0, el: 0, azS: 0, elS: 0,
    tAmb: 0, tFijo: null as number | null, mFijo: null as number | null,
    pausa: false,
    zoom: 1, sx: 0, sy: 0,
    coreo: null as null | { t0: number | null; claves: Clave[]; fin?: () => void },
    prox: 0, m: 1,
    ultimo: 0,
    drag: false, px0: 0, py0: 0, p0: 0, az0: 0, el0: 0,
    activoHasta: 0,
    vista: VISTA_INST0,
    forzada: null as Pose | null,
    visible: true, enPantalla: true, reducido: false, activa: false,
    raf: 0, timer: 0, dormido: false, sucio: true, tamano: true,
    modo: "activo" as Modo,
    ultimoRender: 0, ultimoActivo: 0, ultimoReposo: 0, sondaHasta: 0, sondaLibre: 0,
    renders: 0,
    despertar: () => {},
  });

  const publicar = () => avisos.current.onVista(s.current.vista);
  const fijarVista = (parcial: Partial<VistaInst>) => {
    const r = s.current;
    const v = { ...r.vista, ...parcial };
    if (v.estacion !== r.vista.estacion || v.cerca !== r.vista.cerca || v.alineado !== r.vista.alineado || v.libre !== r.vista.libre || v.pausa !== r.vista.pausa) {
      r.vista = v;
      publicar();
    }
  };

  /* ── API imperativa ── */
  useImperativeHandle(apiRef, () => ({
    coreografia: (claves, fin) => {
      const r = s.current;
      const ult = claves[claves.length - 1];
      if (r.reducido) {
        r.coreo = null; r.zoom = ult.zoom; r.sx = ult.sx; r.sy = ult.sy;
        r.despertar();
        fin?.();
        return;
      }
      r.coreo = { t0: null, claves, fin };
      r.despertar();
    },
    encuadre: (e) => {
      const r = s.current;
      r.coreo = null; r.zoom = e.zoom; r.sx = e.sx; r.sy = e.sy;
      r.despertar();
    },
    encuadreActual: () => ({ zoom: s.current.zoom, sx: s.current.sx, sy: s.current.sy }),
    irA: (p) => {
      const r = s.current;
      r.libre = false; r.az = r.el = 0;
      fijarVista({ libre: false });
      if (r.reducido) { r.p = r.pS = p; r.pMeta = null; r.azS = r.elS = 0; }
      else r.pMeta = p;
      r.despertar();
    },
    fijar: (p) => {
      const r = s.current;
      r.libre = false; r.az = r.el = 0; r.pMeta = null;
      r.p = acotar(p, 0, 1);
      if (r.reducido) r.pS = r.p;
      fijarVista({ libre: false });
      r.despertar();
    },
    siguiente: () => {
      const r = s.current;
      /* Si hay un planeo en curso, «siguiente» cuenta desde su destino: pulsar dos veces avanza dos posiciones */
      const base = r.pMeta ?? r.p;
      const e = ESTACIONES.find((x) => x.p > base + 0.02);
      return e ? e.p : null;
    },
    anterior: () => {
      const r = s.current;
      const base = r.pMeta ?? r.p;
      let p: number | null = null;
      ESTACIONES.forEach((x) => { if (x.p < base - 0.02) p = x.p; });
      return p;
    },
    reiniciar: () => {
      const r = s.current;
      r.libre = false; r.az = r.azS = r.el = r.elS = 0;
      r.p = r.pS = 0; r.pMeta = null; r.tAmb = 0;
      r.coreo = null; r.zoom = 1; r.sx = 0; r.sy = 0;
      fijarVista({ libre: false });
      r.despertar();
    },
    alternarLibre: () => {
      const r = s.current;
      r.libre = !r.libre;
      r.pMeta = null;
      if (!r.libre) { r.az = 0; r.el = 0; if (r.reducido) { r.azS = r.elS = 0; } }
      fijarVista({ libre: r.libre });
      r.despertar();
    },
    pausar: (v) => {
      const r = s.current;
      r.pausa = v;
      fijarVista({ pausa: v });
      r.despertar();
    },
    posicion: () => s.current.pS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  /* ── Activación: solo se repinta mientras la instalación está a la vista ── */
  useEffect(() => {
    const r = s.current;
    r.activa = activa;
    if (activa) { r.tamano = true; r.despertar(); }
  }, [activa]);

  /* ── Montaje + bucle de render bajo demanda (V2.1) ── */
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
    const lk = params.get("look");
    const look: Look = lookProp ?? LOOKS_VALIDOS.find((v) => v === lk) ?? "hybrid";
    const cavidad: Cavidad = cavidadProp ?? false;

    const esc0 = crearEscena(lienzo, r.pf, look, cavidad);
    if (!esc0) { setGlOk(false); avisos.current.onGl?.(false); return; }
    r.escena = esc0;
    avisos.current.onGl?.(true);

    const dprMax = () => Math.min(devicePixelRatio, DPR_MAX[r.pf]);
    const area = Math.max(lienzo.clientWidth * lienzo.clientHeight, 1);
    const inicial = Math.min(dprMax(), Math.sqrt(PRESUPUESTO[r.pf] / Math.max(area, 1)));
    const control = crearControl({ inicial, min: Math.min(ESCALA_MIN, inicial), max: dprMax() });
    r.control = control;

    let aspecto = aspectoDe(lienzo);

    const poseActual = (): Pose => {
      if (r.forzada) return r.forzada;
      return r.libre || Math.abs(r.azS) > 1e-4 || Math.abs(r.elS) > 1e-4 ? poseLibre(r.pS, r.azS, r.elS) : poseEn(r.pS);
    };
    /** Cámara y foco finales: pose del recorrido + encuadre de dirección (zoom y desplazamiento de la escena en pantalla). */
    const vistaDe = (pose: Pose): { pos: V3; mira: V3; foco: number } => {
      const foco = focoDe(pose, aspecto) * r.zoom;
      if (r.sx === 0 && r.sy === 0) return { pos: pose.pos, mira: pose.mira, foco };
      const b = base(pose.pos, pose.mira);
      const d = Math.hypot(pose.mira[0] - pose.pos[0], pose.mira[1] - pose.pos[1], pose.mira[2] - pose.pos[2]);
      const kx = (d * r.sx) / foco, ky = (d * r.sy) / foco;
      const mira: V3 = [
        pose.mira[0] - b.cu[0] * kx - b.cv[0] * ky,
        pose.mira[1] - b.cu[1] * kx - b.cv[1] * ky,
        pose.mira[2] - b.cu[2] * kx - b.cv[2] * ky,
      ];
      return { pos: pose.pos, mira, foco };
    };
    const factorM = (rev: number) => (r.pausa ? 0 : r.mFijo ?? (r.reducido ? 0 : movimientoAmbiental(rev)));

    const aplicarPose = (e: Escena) => {
      const pose = poseActual();
      const ev = evaluar(pose, aspecto);
      r.prox = ev.revelacion;
      r.m = factorM(ev.revelacion);
      const v = vistaDe(pose);
      e.camara(v.pos, v.mira);
      e.encuadre(v.foco);
      e.proximidad(ev.revelacion);
      e.ambiente(r.tFijo ?? r.tAmb, r.m);
      return ev;
    };
    const configurar = (e: Escena) => { e.medir(control.escala); aplicarPose(e); };
    configurar(esc0);
    const aplicarEscala = () => { if (r.escena?.medir(control.escala)) r.sucio = true; };

    /* ── Gancho de QA (solo con ?qa=1) ── */
    if (esQa) {
      const gancho = {
        estado: () => {
          const pose = poseActual();
          const ev = evaluar(pose, aspecto);
          return {
            p: r.pS, pMeta: r.pMeta, aspecto, pose, error: ev.error, revelacion: ev.revelacion, alineado: ev.alineado,
            m: r.m, tAmb: r.tAmb, w: lienzo.width, h: lienzo.height, escala: control.escala, modo: r.modo, renders: r.renders,
            dormido: r.dormido, perdido: !!r.escena?.perdido, activa: r.activa, pausa: r.pausa, zoom: r.zoom, sx: r.sx, sy: r.sy,
          };
        },
        fijar: (p: number, az = 0, el = 0) => {
          r.p = r.pS = acotar(p, 0, 1); r.pMeta = null;
          r.az = r.azS = az; r.el = r.elS = el;
          r.forzada = null;
          r.despertar();
        },
        ambiente: (t: number | null, m: number | null) => { r.tFijo = t; r.mFijo = m; r.despertar(); },
        sondas: () => {
          const pose = poseActual();
          const ev = evaluar(pose, aspecto);
          const ids = r.escena!.muestrear(ev.sondas.map((p) => p ?? [9, 9]));
          return FRAGMENTOS.map((f, i) => ({ nombre: f.nombre, esperado: f.id, leido: ids[i] }));
        },
        puntos: () => FRAGMENTOS.map((f) => puntosDe(f).length),
        escala: (v: number) => { control.forzar(v, performance.now()); aplicarEscala(); r.despertar(); },
      };
      (window as unknown as { __madonna?: typeof gancho }).__madonna = gancho;
    }

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

    const aQuietud = (ts: number) => {
      const d = control.diagnostico();
      if (d.escala < d.max - 1e-6) {
        programar(Math.max(250, Math.max(d.hastaSubir, d.congeladoHasta, r.sondaLibre) - ts));
      } else {
        r.dormido = true;
      }
    };

    function loop(ts: number) {
      r.raf = 0;
      const escena = r.escena;
      if (!escena || escena.perdido || !r.visible || !r.enPantalla || !r.activa) { r.dormido = true; return; }

      const dt = r.ultimo ? Math.min((ts - r.ultimo) / 1000, 0.1) : 0.016;
      r.ultimo = ts;

      /* Planeo hacia una estación (se interrumpe al arrastrar y se detiene en pausa) */
      if (r.pMeta !== null && !r.drag && !r.pausa) {
        const k = 1 - Math.exp(-dt * 2.4);
        const d = r.pMeta - r.p;
        const paso = Math.min(Math.abs(d) * k, dt * VMAX_PLANEO);
        r.p += Math.sign(d) * Math.max(paso, Math.min(Math.abs(d), dt * 0.05));
        if (Math.abs(r.pMeta - r.p) < 0.0015) { r.p = r.pMeta; r.pMeta = null; }
      }

      /* Coreografía de cámara (V2.4): interpolación entre claves con reposo en cada una */
      let coreografiando = false;
      let alFinal: (() => void) | undefined;
      if (r.coreo) {
        const c = r.coreo;
        if (c.t0 === null) c.t0 = ts;
        const tt = ts - c.t0;
        const ks_ = c.claves;
        const ult = ks_[ks_.length - 1];
        if (tt >= ult.t) {
          r.zoom = ult.zoom; r.sx = ult.sx; r.sy = ult.sy;
          alFinal = c.fin;
          r.coreo = null;
        } else {
          let i = 0;
          while (i < ks_.length - 2 && tt >= ks_[i + 1].t) i++;
          const a = ks_[i], b2 = ks_[i + 1];
          const u = Math.min(1, Math.max(0, (tt - a.t) / Math.max(1, b2.t - a.t)));
          const e = u * u * (3 - 2 * u);
          r.zoom = a.zoom + (b2.zoom - a.zoom) * e;
          r.sx = a.sx + (b2.sx - a.sx) * e;
          r.sy = a.sy + (b2.sy - a.sy) * e;
          coreografiando = true;
        }
        r.sucio = true;
      }

      const ks = 1 - Math.exp(-dt * (r.reducido ? 40 : 7));
      r.pS += (r.p - r.pS) * ks;
      r.azS += (r.az - r.azS) * ks;
      r.elS += (r.el - r.elS) * ks;
      const enMovimiento = Math.abs(r.p - r.pS) > LLEGADA || Math.abs(r.az - r.azS) > LLEGADA * 5 || Math.abs(r.el - r.elS) > LLEGADA * 5;
      if (!enMovimiento) { r.pS = r.p; r.azS = r.az; r.elS = r.el; }

      const pose = poseActual();
      const ev = evaluar(pose, aspecto);
      r.prox = ev.revelacion;
      const m = factorM(ev.revelacion);
      r.m = m;
      if (r.tFijo === null) r.tAmb += dt * m;

      const usuario = r.drag || (r.pMeta !== null && !r.pausa) || enMovimiento || ts < r.activoHasta || coreografiando;
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
      }

      if (r.tamano) {
        r.tamano = false;
        aspecto = aspectoDe(lienzo);
        control.fijarMax(dprMax(), ts);
        aplicarEscala();
        r.sucio = true;
      }

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

      const vista = vistaDe(pose);
      escena.camara(vista.pos, vista.mira);
      escena.encuadre(vista.foco);
      escena.proximidad(ev.revelacion);
      escena.ambiente(r.tFijo ?? r.tAmb, m);

      /* Estado hacia la narrativa: estación más cercana y alineación */
      let cercana = -1;
      ESTACIONES.forEach((e, i) => { if (Math.abs(e.p - r.pS) <= TOL_ESTACION) cercana = i; });
      const cerca = cercana >= 0;
      const estacion = cerca ? cercana : r.vista.estacion;
      fijarVista({ estacion, cerca, alineado: ev.alineado && !r.libre });
      const sl = sliderRef.current;
      if (sl && document.activeElement !== sl) sl.value = String(Math.round(r.pS * 1000));

      escena.pintar();
      r.renders++;
      r.sucio = false;
      r.ultimoRender = ts;

      if (alFinal) alFinal();
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

    /* Rueda: solo sobre el lienzo; la página no se desplaza */
    const onRueda = (e: WheelEvent) => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * 600 : e.deltaY;
      if (r.libre) return;
      r.pMeta = null;
      r.p = acotar(r.p + px / 1800, 0, 1);
      r.despertar();
    };
    lienzo.addEventListener("wheel", onRueda, { passive: false });

    const onPerdido = (e: Event) => { e.preventDefault(); if (r.escena) r.escena.perdido = true; };
    const onRestaurado = () => {
      const nueva = crearEscena(lienzo, r.pf, look, cavidad);
      if (!nueva) { setGlOk(false); avisos.current.onGl?.(false); return; }
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
    // El look se fija al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Puntero: arrastrar avanza o retrocede por el recorrido (o gira, en exploración libre) ── */
  const onDown = (e: React.PointerEvent) => {
    const r = s.current;
    r.drag = true;
    r.px0 = e.clientX; r.py0 = e.clientY;
    r.p0 = r.p; r.az0 = r.az; r.el0 = r.el;
    r.pMeta = null;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    r.despertar();
  };
  const onMove = (e: React.PointerEvent) => {
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
      r.p = acotar(r.p0 + (dx - dy) / (L * 0.85), 0, 1);
    }
    r.despertar();
  };
  const onUp = () => { s.current.drag = false; s.current.despertar(); };

  /* ── Teclado (sobre el lienzo) ── */
  const onKey = (e: React.KeyboardEvent) => {
    const r = s.current;
    const mover = (dp: number) => { r.libre = false; fijarVista({ libre: false }); r.az = r.el = 0; r.pMeta = null; r.p = acotar(r.p + dp, 0, 1); if (r.reducido) r.pS = r.p; };
    const ir = (p: number) => {
      r.libre = false; fijarVista({ libre: false }); r.az = r.el = 0;
      if (r.reducido) { r.p = r.pS = p; r.pMeta = null; r.azS = r.elS = 0; } else r.pMeta = p;
    };
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
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(1);
    else if (e.key === "1" || e.key === "2" || e.key === "3") ir(ESTACIONES[Number(e.key) - 1].p);
    else return;
    e.preventDefault();
    r.despertar();
  };

  return (
    <div className="pr-inst__escena" data-gl={glOk ? "si" : "no"}>
      <canvas
        ref={canvasRef}
        className="pr-inst__lienzo"
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
      <div className="pr-inst__alternativa" aria-hidden={glOk}>
        <svg viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="La composición alineada: concha, huevo, dos cornisas, cuatro volúmenes y un pedestal, con un centro vacío">
          <defs>
            <linearGradient id="pr-cielo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0a2a78" />
              <stop offset=".55" stopColor="#5d86e0" />
              <stop offset="1" stopColor="#e8edf9" />
            </linearGradient>
            <radialGradient id="pr-calido" cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#f0a35c" stopOpacity=".85" />
              <stop offset="1" stopColor="#f0a35c" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="68" fill="url(#pr-cielo)" />
          <rect y="68" width="100" height="82" fill="#6f78c0" />
          <ellipse cx="50" cy="68" rx="26" ry="34" fill="url(#pr-calido)" />
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
        <p className="pr-inst__alt-txt">Esta instalación requiere WebGL2. Aquí se muestra la composición alineada, estática.</p>
      </div>
    </div>
  );
}
