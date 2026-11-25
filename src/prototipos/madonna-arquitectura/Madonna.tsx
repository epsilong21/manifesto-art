"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { crearEscena, type Escena, type Perfil } from "./madonnaGL";
import { CENTRO, FRAGMENTOS, camPos, evaluar, focoPara } from "./composicion";
import { crearControl, type ControlEscala } from "./escalaAdaptativa";

/* ═══════════════════════════════════════════
   Constantes
   ═══════════════════════════════════════════ */
/* V1.3B: con la composición nueva, 0.9/0.25 recortaba el pedestal; 0.5/0.2 deja las nueve piezas en encuadre en escritorio. */
const INICIO = { az: 0.5, el: 0.2 };
const ALINEADO = { az: 0, el: 0 };
const EL_MIN = -Math.PI / 6;
const EL_MAX = Math.PI / 3.5;
const PRESUPUESTO = { desktop: 450_000, movil: 300_000 };
const DPR_MAX = { desktop: 2, movil: 1.5 };
/** Límite inferior de calidad: nunca se renderiza por debajo de esta escala (salvo que el presupuesto inicial ya sea menor). */
const ESCALA_MIN = 0.35;

/**
 * Cadencia del render en reposo (cámara quieta, nadie interactúa).
 * Lo único que se mueve entonces es la flotación ambiental, cuya velocidad
 * máxima (VELOCIDAD_FLOTACION_MAX, composicion.ts) es ≈ 0.007 unidades/s: a 1080p (≈ 265 px por
 * unidad en el fragmento más cercano) son ≈ 1.9 px/s. A 12 fps cada fotograma
 * desplaza como mucho ≈ 0.16 px: por debajo de un píxel, indistinguible de 60 fps
 * (`qa-geometria.mjs` lo comprueba). Con reduced motion no hay flotación: el
 * render es estático y solo se repinta al interactuar.
 */
const CADENCIA_REPOSO = 12;
const PERIODO_REPOSO_MS = 1000 / CADENCIA_REPOSO;
/** Tras una entrada del usuario se sigue pintando a pleno ritmo este tiempo (ms). */
const ACTIVO_TRAS_ENTRADA_MS = 400;
/**
 * Ráfagas de sondeo: con la imagen quieta no hay fotogramas que medir y la escala no
 * podría afinarse sola. Mientras el control quiera subir (escala < techo, sin enfriamiento),
 * el bucle pinta a pleno ritmo SONDA_MS; cada subida alarga la ráfaga, y si no hay progreso
 * descansa SONDA_PAUSA_MS. Una GPU holgada llega a escala plena en ~7 s y vuelve a reposo.
 */
const SONDA_MS = 3500;
const SONDA_PAUSA_MS = 10_000;
/** Distancia angular (rad) por debajo de la cual la cámara suavizada se da por llegada. */
const LLEGADA = 5e-4;

function perfil(): Perfil {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 || "ontouchstart" in window ? "movil" : "desktop";
}

/** Relación de aspecto del lienzo (ancho / alto), nunca 0. */
function aspectoDe(canvas: HTMLCanvasElement) {
  return Math.max(canvas.clientWidth, 1) / Math.max(canvas.clientHeight, 1);
}

/** Estado de alineación que muestra el HUD (solo lo que cambia lo que se ve). */
type Alineacion = { pct: number; alineado: boolean; visibles: number };
const SIN_ALINEAR: Alineacion = { pct: 0, alineado: false, visibles: 0 };

type Modo = "activo" | "reposo";

/* ═══════════════════════════════════════════
   Componente
   ═══════════════════════════════════════════ */
export function Madonna() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const [alin, setAlin] = useState<Alineacion>(SIN_ALINEAR);
  const [glOk, setGlOk] = useState(true);
  const [instruccion, setInstruccion] = useState(true);

  const s = useRef({
    escena: null as Escena | null,
    control: null as ControlEscala | null,
    pf: "desktop" as Perfil,
    // Cámara
    az: INICIO.az,
    el: INICIO.el,
    azSmooth: INICIO.az,
    elSmooth: INICIO.el,
    // Animación guiada
    animAz: null as number | null,
    animEl: null as number | null,
    // Tiempo
    tiempo: 0,
    ultimo: 0,
    // Interacción
    drag: false,
    px0: 0,
    py0: 0,
    az0: 0,
    el0: 0,
    activoHasta: 0,
    // Última alineación publicada al HUD
    alin: SIN_ALINEAR,
    // Pausa
    visible: true,
    enPantalla: true,
    reducido: false,
    // Planificación del bucle
    raf: 0,
    timer: 0,
    dormido: false,
    sucio: true,
    tamano: true,
    modo: "activo" as Modo,
    ultimoRender: 0,
    ultimoActivo: 0,
    ultimoReposo: 0,
    sondaHasta: 0,
    sondaLibre: 0,
    // Diagnóstico
    renders: 0,
    hudN: 0,
    hudT0: 0,
    // Función que despierta el bucle (la define el efecto)
    despertar: () => {},
  });

  /* ── Montaje + bucle de render bajo demanda ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lienzo: HTMLCanvasElement = canvas; // estrechado, para usarlo dentro de los cierres

    const r = s.current;
    r.pf = perfil();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    r.reducido = mq.matches;

    const esc0 = crearEscena(lienzo, r.pf);
    if (!esc0) {
      setGlOk(false);
      return;
    }
    r.escena = esc0;

    /* Escala inicial según el presupuesto de píxeles; el control la ajusta después */
    const dprMax = () => Math.min(devicePixelRatio, DPR_MAX[r.pf]);
    const area = Math.max(lienzo.clientWidth * lienzo.clientHeight, 1);
    const inicial = Math.min(dprMax(), Math.sqrt(PRESUPUESTO[r.pf] / area));
    const control = crearControl({ inicial, min: Math.min(ESCALA_MIN, inicial), max: dprMax() });
    r.control = control;

    let aspecto = aspectoDe(lienzo);

    /** Aplica escala, encuadre y cámara a una escena (recién creada o tras un cambio de tamaño). */
    const configurar = (e: Escena) => {
      e.medir(control.escala);
      e.encuadre(focoPara(aspecto));
      e.camara(camPos(r.azSmooth, r.elSmooth), CENTRO);
      e.proximidad(evaluar(r.azSmooth, r.elSmooth, aspecto, r.tiempo).prox);
    };
    configurar(esc0);

    /** Pasa la escala del control al lienzo. Si el tamaño cambia, el lienzo queda en blanco: hay que repintar. */
    const aplicarEscala = () => {
      if (r.escena?.medir(control.escala)) r.sucio = true;
    };

    /* ── Gancho de QA (solo con ?qa=1) ── */
    if (new URLSearchParams(window.location.search).has("qa")) {
      const gancho = {
        estado: () => {
          const ev = evaluar(r.azSmooth, r.elSmooth, aspecto, r.tiempo);
          return {
            ...ev, aspecto, foco: focoPara(aspecto), az: r.azSmooth, el: r.elSmooth,
            w: lienzo.width, h: lienzo.height, t: r.tiempo,
            escala: control.escala, modo: r.modo, renders: r.renders,
            dormido: r.dormido, perdido: !!r.escena?.perdido, sondeando: performance.now() < r.sondaHasta,
          };
        },
        /** Fija la cámara sin suavizado (para pruebas, incluida la negativa). */
        fijar: (az: number, el: number) => {
          r.az = r.azSmooth = az; r.el = r.elSmooth = el;
          r.animAz = null; r.animEl = null;
          r.despertar();
        },
        /** Id del fragmento bajo la sonda de cada fragmento (comprueba CPU = GPU). */
        sondas: () => {
          const ev = evaluar(r.azSmooth, r.elSmooth, aspecto, r.tiempo);
          const ids = r.escena!.muestrear(r.tiempo, ev.sondas.map((p) => p ?? [9, 9]));
          return FRAGMENTOS.map((f, i) => ({ nombre: f.nombre, esperado: f.id, leido: ids[i] }));
        },
        /** Caja en uv y píxeles de cada fragmento visible, leída del mapa de ids de la GPU. */
        silueta: () => r.escena!.silueta(r.tiempo),
        /** Fija la escala de render (anula al control hasta que decida otra cosa). */
        escala: (v: number) => { control.forzar(v, performance.now()); aplicarEscala(); r.despertar(); },
        registro: () => control.registro.slice(),
        diagnostico: () => control.diagnostico(),
      };
      (window as unknown as { __madonna?: typeof gancho }).__madonna = gancho;
    }

    /* ── HUD de diagnóstico: fps de render reales y escala (sin re-render de React) ── */
    const pintarHud = (ts: number, estado?: "estatico" | "modo") => {
      const el = fpsRef.current;
      if (!el) return;
      if (estado === "estatico") { el.textContent = `— fps · ×${control.escala.toFixed(2)} · estático`; return; }
      /* Al cambiar de modo, el texto cambia al instante (el fps medido llega 0.5 s después) */
      if (estado === "modo") { el.textContent = `— fps · ×${control.escala.toFixed(2)}${r.modo === "reposo" ? " · reposo" : ""}`; return; }
      if (!r.hudT0) { r.hudT0 = ts; r.hudN = 0; return; } // primera muestra de un tramo: aún no hay medida
      const dt = ts - r.hudT0;
      if (dt < 500) return;
      const fps = Math.round((r.hudN * 1000) / dt);
      r.hudN = 0;
      r.hudT0 = ts;
      el.textContent = `${fps} fps · ×${control.escala.toFixed(2)}${r.modo === "reposo" ? " · reposo" : ""}`;
    };

    /* ── Planificación: rAF en activo; temporizador + rAF en reposo; nada si no hay nada que mostrar ── */
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
    /** Despierta sin marcar entrada del usuario (visibilidad, redimensionado). */
    const reanudar = () => {
      const hasta = r.activoHasta;
      r.despertar();
      r.activoHasta = hasta;
    };

    function loop(ts: number) {
      r.raf = 0;
      const escena = r.escena;
      if (!escena || escena.perdido || !r.visible || !r.enPantalla) { r.dormido = true; return; }

      const dt = r.ultimo ? Math.min((ts - r.ultimo) / 1000, 0.1) : 0.016;
      r.ultimo = ts;
      if (!r.reducido) r.tiempo += dt;

      /* Animación guiada */
      if (r.animAz !== null && r.animEl !== null && !r.drag) {
        const k = 1 - Math.exp(-dt * 2.8);
        let dAz = r.animAz - r.az;
        if (dAz > Math.PI) dAz -= Math.PI * 2;
        if (dAz < -Math.PI) dAz += Math.PI * 2;
        r.az += dAz * k;
        r.el += (r.animEl - r.el) * k;
        if (Math.abs(dAz) < 0.002 && Math.abs(r.animEl - r.el) < 0.002) {
          r.az = r.animAz;
          r.el = r.animEl;
          r.animAz = null;
          r.animEl = null;
        }
      }

      /* Suavizado de cámara; al llegar se fija exactamente y el render puede pasar a reposo */
      const ks = 1 - Math.exp(-dt * (r.reducido ? 20 : 6));
      r.azSmooth += (r.az - r.azSmooth) * ks;
      r.elSmooth += (r.el - r.elSmooth) * ks;
      const enMovimiento = Math.abs(r.az - r.azSmooth) > LLEGADA || Math.abs(r.el - r.elSmooth) > LLEGADA;
      if (!enMovimiento) { r.azSmooth = r.az; r.elSmooth = r.el; }

      /* Modo: activo (se pinta cada fotograma) o reposo (solo la flotación ambiental) */
      const usuario = r.drag || r.animAz !== null || enMovimiento || ts < r.activoHasta;
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

      /* Tamaño del lienzo o DPR: aspecto, foco y techo de la escala */
      if (r.tamano) {
        r.tamano = false;
        aspecto = aspectoDe(lienzo);
        escena.encuadre(focoPara(aspecto));
        control.fijarMax(dprMax(), ts);
        aplicarEscala();
        r.sucio = true;
      }

      /* ¿Toca pintar? Activo: siempre. Reposo: al ritmo de la cadencia (nunca con reduced motion). */
      const tocaReposo = !r.reducido && ts - r.ultimoRender >= PERIODO_REPOSO_MS - 3;
      if (!(activo || r.sucio || tocaReposo)) {
        /* Nada que pintar: con reduced motion el bucle se duerme hasta el próximo evento */
        if (r.reducido) { r.dormido = true; pintarHud(ts, "estatico"); return; }
        programar(PERIODO_REPOSO_MS - (performance.now() - r.ultimoRender));
        return;
      }

      /* Control adaptativo: mide los fotogramas en activo; en reposo solo vigila que no vayan tarde */
      if (activo) {
        const cambio = r.ultimoActivo ? control.muestra(ts - r.ultimoActivo, ts) : null;
        if (cambio) {
          aplicarEscala();
          /* Mientras haya progreso, la ráfaga de sondeo continúa */
          if (cambio.motivo === "subir" && ts < r.sondaHasta) {
            r.sondaHasta = ts + SONDA_MS;
            r.sondaLibre = r.sondaHasta + SONDA_PAUSA_MS;
          }
        }
        r.ultimoActivo = ts;
      } else if (!r.reducido) {
        if (r.ultimoReposo && control.muestraReposo(ts - r.ultimoReposo, PERIODO_REPOSO_MS, ts)) aplicarEscala();
        r.ultimoReposo = ts;
      }

      /* Cámara y alineación por reproyección (no por ángulos de cámara) */
      escena.camara(camPos(r.azSmooth, r.elSmooth), CENTRO);
      const ev = evaluar(r.azSmooth, r.elSmooth, aspecto, r.tiempo);
      escena.proximidad(ev.prox);
      const visibles = ev.visibles.filter(Boolean).length;
      if (ev.pct !== r.alin.pct || ev.alineado !== r.alin.alineado || visibles !== r.alin.visibles) {
        r.alin = { pct: ev.pct, alineado: ev.alineado, visibles };
        setAlin(r.alin);
      }

      escena.pintar(r.tiempo);
      r.renders++;
      r.hudN++;
      r.sucio = false;
      r.ultimoRender = ts;
      pintarHud(ts);

      if (activo) programar(0);
      else if (r.reducido) { r.dormido = true; pintarHud(ts, "estatico"); }
      else programar(PERIODO_REPOSO_MS - (performance.now() - ts));
    }

    /* ── Visibilidad, tamaño, movimiento reducido ── */
    const io = new IntersectionObserver(
      ([e]) => { r.enPantalla = e.isIntersecting; if (r.enPantalla) reanudar(); },
      { threshold: 0.05 },
    );
    io.observe(lienzo);

    const onVis = () => {
      r.visible = document.visibilityState === "visible";
      if (r.visible) reanudar();
    };
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(() => { r.tamano = true; reanudar(); });
    ro.observe(lienzo);

    const onMovimiento = (e: MediaQueryListEvent) => { r.reducido = e.matches; reanudar(); };
    mq.addEventListener("change", onMovimiento);

    /* ── Pérdida y restauración del contexto WebGL ── */
    const onPerdido = (e: Event) => {
      e.preventDefault(); // sin esto el navegador no restaura el contexto
      if (r.escena) r.escena.perdido = true;
    };
    const onRestaurado = () => {
      const nueva = crearEscena(lienzo, r.pf);
      if (!nueva) { setGlOk(false); return; }
      r.escena?.liberar();
      r.escena = nueva;
      configurar(nueva);
      reanudar();
    };
    lienzo.addEventListener("webglcontextlost", onPerdido);
    lienzo.addEventListener("webglcontextrestored", onRestaurado);

    /* Instrucción: ocultar tras 4s */
    const instrTimer = setTimeout(() => setInstruccion(false), 4000);

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
      lienzo.removeEventListener("webglcontextlost", onPerdido);
      lienzo.removeEventListener("webglcontextrestored", onRestaurado);
      clearTimeout(instrTimer);
      delete (window as unknown as { __madonna?: unknown }).__madonna;
      r.escena?.liberar();
      r.escena = null;
      /* Si el lienzo ya salió del documento (desmontaje real, no el doble montaje de desarrollo),
         se suelta el contexto de inmediato en lugar de esperar al recolector de basura. */
      if (!lienzo.isConnected) {
        lienzo.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
      }
    };
  }, []);

  /* ── Puntero ── */
  const onDown = useCallback((e: React.PointerEvent) => {
    const r = s.current;
    r.drag = true;
    r.px0 = e.clientX;
    r.py0 = e.clientY;
    r.az0 = r.az;
    r.el0 = r.el;
    r.animAz = null;
    r.animEl = null;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setInstruccion(false);
    r.despertar();
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    const r = s.current;
    if (!r.drag) return;
    const dx = e.clientX - r.px0;
    const dy = e.clientY - r.py0;
    const sens = r.pf === "movil" ? 0.006 : 0.004;
    r.az = r.az0 - dx * sens;
    r.el = Math.max(EL_MIN, Math.min(EL_MAX, r.el0 + dy * sens));
    r.despertar();
  }, []);

  const onUp = useCallback(() => {
    s.current.drag = false;
    s.current.despertar();
  }, []);

  /* ── Teclado ── */
  const onKey = useCallback((e: React.KeyboardEvent) => {
    const r = s.current;
    /* Pasos sobre una rejilla que contiene (0,0): la vista alineada es alcanzable
       con flechas desde cualquier posición (con pasos relativos, tras un arrastre
       la rejilla se desplazaba y la zona de ±1.8° quedaba fuera de alcance). */
    const paso = 0.06;
    const sig = (v: number, dir: 1 | -1) =>
      dir > 0 ? (Math.floor(v / paso + 1e-9) + 1) * paso : (Math.ceil(v / paso - 1e-9) - 1) * paso;
    if (e.key === "ArrowLeft") r.az = sig(r.az, -1);
    else if (e.key === "ArrowRight") r.az = sig(r.az, 1);
    else if (e.key === "ArrowUp") r.el = Math.min(EL_MAX, sig(r.el, 1));
    else if (e.key === "ArrowDown") r.el = Math.max(EL_MIN, sig(r.el, -1));
    else return;
    e.preventDefault();
    r.animAz = null;
    r.animEl = null;
    setInstruccion(false);
    r.despertar();
  }, []);

  /* ── Botones ── */
  const guiar = useCallback(() => {
    const r = s.current;
    r.animAz = ALINEADO.az;
    r.animEl = ALINEADO.el;
    r.despertar();
  }, []);

  const restablecer = useCallback(() => {
    const r = s.current;
    r.animAz = INICIO.az;
    r.animEl = INICIO.el;
    r.despertar();
  }, []);

  /* ── Render ── */
  const alineado = alin.alineado;
  const total = FRAGMENTOS.length;
  return (
    <div className="ma" data-gl={glOk ? "si" : "no"}>
      {/* Escena WebGL */}
      <canvas
        ref={canvasRef}
        className="ma-lienzo"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        tabIndex={0}
        role="img"
        aria-label="Instalación tridimensional: fragmentos arquitectónicos suspendidos que se alinean desde un punto de vista específico. Arrastra para orbitar."
      />

      {/* Fallback sin WebGL */}
      <div className="ma-alternativa" aria-hidden={glOk}>
        <svg viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M42.6 6 H57.4 Q56 14 50 15 Q44 14 42.6 6 Z" fill="#cfd3dc" />
          <line x1="50" y1="15" x2="50" y2="24" stroke="#cfd3dc" strokeWidth=".4" />
          <ellipse cx="50" cy="26.1" rx="1.5" ry="2.1" fill="#d4d2d8" />
          <path d="M16.4 17.6 H44.4 V37.2 A8.4 8.4 0 0 0 36 45.6 H16.4 Z" fill="#8c9bab" />
          <path d="M83.6 17.6 H55.6 V37.2 A8.4 8.4 0 0 1 64 45.6 H83.6 Z" fill="#8c9bab" />
          <g fill="#7f8c9b">
            <path fillRule="evenodd" d="M16.4 56.4 h19.3 v27.7 h-19.3 Z M18.6 58.6 v23.3 h14.9 v-23.3 Z" />
            <path fillRule="evenodd" d="M64.3 56.4 h19.3 v27.7 h-19.3 Z M66.5 58.6 v23.3 h14.9 v-23.3 Z" />
            <path fillRule="evenodd" d="M16.7 82.6 h14.4 v33.3 h-14.4 Z M18.9 84.8 v28.9 h10 v-28.9 Z" />
            <path fillRule="evenodd" d="M68.9 82.6 h14.4 v33.3 h-14.4 Z M71.1 84.8 v28.9 h10 v-28.9 Z" />
          </g>
          <rect x="5" y="122.6" width="90" height="6" fill="#9a99ab" />
          <rect x="7" y="128.6" width="86" height="9" fill="#6c9aae" />
          <rect x="2.4" y="137.6" width="95.2" height="7.4" fill="#7f9693" />
        </svg>
        <p className="ma-alternativa__txt">Esta instalación requiere WebGL2.</p>
      </div>

      {/* HUD */}
      <div className="ma-hud">
        {/* Título */}
        <header className="ma-cabeza">
          <p className="ma-ante">MANIFESTO · Interpretación</p>
          <h1 className="ma-titulo">La arquitectura de lo imposible</h1>
          {/* Región viva siempre presente (se anuncia al cambiar su texto); vive en la
              cabecera para no tapar fragmentos de la composición. */}
          <p className="ma-alineado" role="status" aria-live="polite">
            {alineado ? "La perspectiva se alinea" : ""}
          </p>
        </header>

        {/* Instrucción */}
        {instruccion && (
          <p className="ma-instruccion">Arrastra para orbitar · Busca la perspectiva</p>
        )}

        {/* Indicador de proximidad */}
        <div
          className="ma-prox"
          aria-live="polite"
          aria-label={
            alineado
              ? "Perspectiva alineada"
              : `Alineación: ${alin.pct} %, ${alin.visibles} de ${total} fragmentos en encuadre`
          }
        >
          <svg viewBox="0 0 36 36" className="ma-prox__anillo">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".15" />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${(alin.pct / 100) * 94.25} 94.25`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
              style={{ transition: "stroke-dasharray 0.3s" }}
            />
          </svg>
          <span className="ma-prox__pct">{alin.pct}</span>
        </div>

        {/* Acciones */}
        <div className="ma-acciones">
          <button className="ma-btn" onClick={guiar} type="button">
            Encontrar la perspectiva
          </button>
          <button className="ma-btn ma-btn--sec" onClick={restablecer} type="button">
            Restablecer
          </button>
        </div>

        {/* Diagnóstico de render: fps reales de repintado y escala (se actualiza sin re-render de React) */}
        <span className="ma-fps" ref={fpsRef}>— fps</span>
      </div>
    </div>
  );
}
