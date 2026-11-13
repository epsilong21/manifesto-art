"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ACTOS, APARICION, ESTADOS_APERTURA } from "@/content/bacon";
import { guardarHuella } from "./huella";
import { Arranque, marca, type Estado, type Motor } from "./materiaGL";

type Preset = Estado;

/**
 * Fases de la escena WebGL:
 * inicio (aún lejos) · preparando (compilando sin bloquear) · manual (sin compilación en paralelo: espera al visitante) ·
 * lista · error · sin-gl.
 */
type Fase = "inicio" | "preparando" | "manual" | "lista" | "error" | "sin-gl";
/** La aparición: una secuencia breve la primera vez que la escena está lista y a la vista. */
type Cine = "no" | "corriendo" | "hecha";

/** La compilación empieza cuando la instalación está a menos de esta distancia de entrar en pantalla (en alturas de pantalla). */
const ANTICIPO = "250% 0px 250% 0px";

/** Cada acto es un estado de luz y de materia; el visitante añade la lámpara y la apertura. */
const PRESETS: Record<string, Preset> = {
  i: { luzX: 0.1, luzY: 0.85, radio: 0.95, intensidad: 1.05, ambiente: 0.2, apertura: 0, tension: 0.3, altar: 0, sombra: 0.75 },
  ii: { luzX: -0.6, luzY: 0.3, radio: 1.25, intensidad: 1.5, ambiente: 0.12, apertura: 0.35, tension: 0.6, altar: 0, sombra: 0.9 },
  iii: { luzX: 0.12, luzY: -0.55, radio: 1.35, intensidad: 1.7, ambiente: 0.08, apertura: 0.6, tension: 0.95, altar: 1, sombra: 1 },
};
/** Antes de la aparición: la sala a oscuras (la forma ya está ahí, pero nada la ilumina). */
const OSCURO: Preset = { luzX: 0.85, luzY: -0.9, radio: 0.5, intensidad: 0, ambiente: 0.012, apertura: 0, tension: 0.3, altar: 0, sombra: 0.75 };

/**
 * La aparición, momento a momento: oscuridad → tensión → aparición → revelación → materia abierta → sombra.
 * Todo con los parámetros del motor (luz, alcance, apertura, tensión, luz cenital) y el encuadre del lienzo (escala y altura);
 * el shader no cambia. Dura unos nueve segundos y se puede saltar en cualquier momento.
 */
type Momento = { ms: number; estado: Preset; enc: [number, number] };
const SECUENCIA: Momento[] = [
  { ms: 1000, estado: OSCURO, enc: [1.42, 5] },
  { ms: 1600, estado: { ...OSCURO, luzX: 0.78, luzY: -0.72, radio: 0.72, intensidad: 0.55, ambiente: 0.03 }, enc: [1.32, 3.5] },
  { ms: 1800, estado: { ...PRESETS.i, luzX: 0.04, luzY: 0.92, intensidad: 1.15 }, enc: [1.12, 0.5] },
  { ms: 1400, estado: { ...PRESETS.ii, apertura: 0.12, luzX: -0.55, luzY: 0.38 }, enc: [1.0, 0] },
  { ms: 1800, estado: { ...PRESETS.ii, apertura: 0.88, luzX: -0.42, luzY: 0.18, intensidad: 1.6 }, enc: [1.17, -1.5] },
  { ms: 2000, estado: PRESETS.iii, enc: [1.0, 0] },
];

const LUZ_MAX = 0.95;
const DURACION = 1900;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const reducido = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function estadoApertura(a: number) {
  return a < 0.25 ? ESTADOS_APERTURA[0] : a < 0.65 ? ESTADOS_APERTURA[1] : ESTADOS_APERTURA[2];
}

export function Instalacion() {
  const [acto, setActo] = useState(0);
  const [montado, setMontado] = useState(false);
  const [fase, setFase] = useState<Fase>("inicio");
  const sinGL = fase === "sin-gl";
  const arranque = useRef<Arranque | null>(null);
  const faseRef = useRef<Fase>("inicio");
  const [apertura, setApertura] = useState(PRESETS.ii.apertura);
  const [luzUi, setLuzUi] = useState({ x: PRESETS.i.luzX, y: PRESETS.i.luzY });
  const [cine, setCine] = useState<Cine>("no");
  const cineRef = useRef<Cine>("no");
  const [momento, setMomento] = useState(-1);
  const [encuadre, setEncuadre] = useState<{ s: number; y: number; ms: number }>({ s: 1, y: 0, ms: 0 });
  const relojes = useRef<number[]>([]);
  const aLaVista = useRef(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lienzoRef = useRef<HTMLDivElement>(null);
  const motor = useRef<Motor | null>(null);
  const actual = useRef<Estado>({ ...OSCURO });
  const objetivo = useRef<Estado>({ ...OSCURO });
  const tween = useRef<{ desde: Estado; t0: number; dur: number } | null>(null);
  const luzLibre = useRef(false);
  const raf = useRef(0);
  const rafT = useRef(0);
  const visible = useRef(true);
  const arrastre = useRef(false);
  const asentar = useRef(0);

  const dibujar = useCallback(() => {
    motor.current?.dibujar(actual.current);
  }, []);

  /** Cuando nada se mueve durante un instante: un único fotograma a resolución completa (y su copia para el umbral). */
  const programarFinal = useCallback(() => {
    clearTimeout(asentar.current);
    asentar.current = window.setTimeout(() => {
      if (tween.current || !motor.current || !visible.current) return;
      motor.current.calidad("final");
      dibujar();
      if (canvasRef.current && actual.current.intensidad > 0.5) guardarHuella(canvasRef.current);
    }, 180);
  }, [dibujar]);

  /**
   * Bajo demanda: un solo fotograma, o los necesarios para terminar la transición entre estados.
   * Mientras algo se mueve, a media resolución; al detenerse, programarFinal() repinta a resolución completa.
   */
  const pedir = useCallback(() => {
    if (!motor.current || !visible.current) return;
    motor.current.calidad("interactiva");
    clearTimeout(asentar.current);
    // Un fotograma pedido hace más de medio segundo y no atendido (pestaña congelada): se descarta y se vuelve a pedir
    if (raf.current && performance.now() - rafT.current < 500) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    rafT.current = performance.now();
    const paso = (ahora: number) => {
      raf.current = 0;
      const tw = tween.current;
      if (tw) {
        const k = reducido() ? 1 : limitar((ahora - tw.t0) / tw.dur, 0, 1);
        const e = ease(k);
        const a = actual.current, o = objetivo.current, d = tw.desde;
        (Object.keys(o) as (keyof Estado)[]).forEach((c) => {
          if (luzLibre.current && (c === "luzX" || c === "luzY")) return;
          a[c] = d[c] + (o[c] - d[c]) * e;
        });
        if (!luzLibre.current) setLuzUi({ x: a.luzX, y: a.luzY });
        if (k >= 1) tween.current = null;
        else raf.current = requestAnimationFrame(paso);
      }
      dibujar();
      if (!tween.current) programarFinal();
    };
    raf.current = requestAnimationFrame(paso);
  }, [dibujar, programarFinal]);

  /** Lleva la escena a un estado en `dur` ms (la luz movida a mano se respeta salvo que se pida lo contrario). */
  const llevar = useCallback((e: Estado, dur: number) => {
    tween.current = { desde: { ...actual.current }, t0: performance.now(), dur };
    objetivo.current = { ...e };
    pedir();
  }, [pedir]);

  const poner = useCallback((f: Fase) => { faseRef.current = f; setFase(f); }, []);
  const prepararRef = useRef<(manual: boolean) => void>(() => {});

  const ponerCine = useCallback((c: Cine) => { cineRef.current = c; setCine(c); }, []);
  const pararRelojes = () => { relojes.current.forEach(clearTimeout); relojes.current = []; };

  /** La aparición. Cada momento lleva el motor a un estado y mueve el encuadre; al final, el Acto III queda en manos del visitante. */
  const aparecer = useCallback(() => {
    if (!motor.current) return;
    pararRelojes();
    ponerCine("corriendo");
    luzLibre.current = false;
    let t = 0;
    // al volver a verla, primero se apaga la sala
    if (actual.current.intensidad > 0.05) { llevar(OSCURO, 700); setEncuadre({ s: 1.42, y: 5, ms: 700 }); t = 750; }
    SECUENCIA.forEach((m, i) => {
      relojes.current.push(window.setTimeout(() => {
        setMomento(i);
        setEncuadre({ s: m.enc[0], y: m.enc[1], ms: m.ms + 400 });
        llevar(m.estado, m.ms);
      }, t));
      t += m.ms;
    });
    relojes.current.push(window.setTimeout(() => {
      setMomento(-1);
      setEncuadre({ s: 1, y: 0, ms: 1400 });
      setActo(2);
      setApertura(PRESETS.iii.apertura);
      ponerCine("hecha");
    }, t + 300));
  }, [llevar, ponerCine]);

  /** El visitante toma el control: la secuencia se corta donde esté (y si la sala seguía a oscuras, se enciende el Acto I). */
  const cortarCine = useCallback(() => {
    if (cineRef.current === "hecha") return;
    pararRelojes();
    setMomento(-1);
    setEncuadre({ s: 1, y: 0, ms: 900 });
    ponerCine("hecha");
    if (objetivo.current.intensidad < 0.5) {
      setActo(0);
      setApertura(0);
      llevar({ ...PRESETS.i, apertura: 0 }, 900);
    }
  }, [llevar, ponerCine]);

  // Motor, tamaño y visibilidad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let activo = true;
    let contextoPerdido = false;
    const limpiezas: Array<() => void> = [];
    poner("inicio"); // un re-montaje (React en desarrollo) empieza de cero
    setMontado(true);
    if (reducido()) {
      // Sin aparición: la sala empieza directamente en el Acto I
      actual.current = { ...PRESETS.i };
      objetivo.current = { ...PRESETS.i };
      cineRef.current = "hecha";
    }

    /** Compila sin bloquear la página (si el navegador lo permite) y activa la escena cuando está lista. */
    const preparar = async (manual: boolean) => {
      const f = faseRef.current;
      if (!activo || f === "preparando" || f === "lista" || f === "sin-gl") return;
      const arr = arranque.current ?? Arranque.abrir(canvas);
      if (!arr) { poner("sin-gl"); return; }
      arranque.current = arr;
      // Sin compilación en paralelo la página se detendría: se espera a que el visitante lo pida
      if (!arr.paralelo && !manual) { poner("manual"); return; }
      poner("preparando");
      try {
        const m = await arr.compilar();
        if (!activo) return;
        motor.current = m;
        m.ajustar();
        dibujar();
        marca("primer-fotograma");
        requestAnimationFrame(() => requestAnimationFrame(() => marca("escena-presentada")));
        poner("lista");
        if (tween.current) pedir(); // el visitante ya cambió de acto mientras tanto
        if (cineRef.current === "no" && aLaVista.current) aparecer();
      } catch {
        if (activo && !contextoPerdido) poner("error"); // si el contexto se perdió, al restaurarse se reintenta
      }
    };
    prepararRef.current = preparar;

    // Cuándo empezar: con la instalación aún lejos no se hace nada; cuando está a unas pantallas, se prepara
    // (la compilación en frío puede durar segundos, así que no se espera a que esté a la vista), y solo con la pestaña visible.
    const disparar = () => {
      if (document.visibilityState !== "hidden") { preparar(false); return; }
      const v = () => {
        if (document.visibilityState === "hidden") return;
        document.removeEventListener("visibilitychange", v);
        preparar(false);
      };
      document.addEventListener("visibilitychange", v);
      limpiezas.push(() => document.removeEventListener("visibilitychange", v));
    };
    const cerca = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      cerca.disconnect();
      disparar();
    }, { rootMargin: ANTICIPO });
    cerca.observe(canvas);

    const ro = new ResizeObserver(() => { motor.current?.ajustar(); dibujar(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => {
      visible.current = en.isIntersecting;
      if (en.isIntersecting) pedir();
    });
    io.observe(canvas);
    // La aparición empieza cuando la escena está casi entera a la vista
    const vista = new IntersectionObserver(([en]) => {
      aLaVista.current = en.intersectionRatio >= 0.55;
      if (aLaVista.current && cineRef.current === "no" && faseRef.current === "lista") aparecer();
    }, { threshold: [0, 0.55, 0.8] });
    vista.observe(canvas);
    const perdido = (e: Event) => {
      e.preventDefault();
      contextoPerdido = true;
      motor.current = null;
      arranque.current?.reiniciar();
      poner("preparando");
    };
    const restaurado = () => { contextoPerdido = false; poner("inicio"); preparar(true); };
    canvas.addEventListener("webglcontextlost", perdido);
    canvas.addEventListener("webglcontextrestored", restaurado);
    return () => {
      activo = false;
      limpiezas.forEach((f) => f());
      clearTimeout(asentar.current);
      relojes.current.forEach(clearTimeout);
      relojes.current = [];
      cerca.disconnect();
      ro.disconnect();
      io.disconnect();
      vista.disconnect();
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      canvas.removeEventListener("webglcontextlost", perdido);
      canvas.removeEventListener("webglcontextrestored", restaurado);
      arranque.current?.soltar();
      motor.current = null;
    };
  }, [dibujar, pedir, poner, aparecer, ponerCine]);

  const irAActo = useCallback((i: number) => {
    const id = ACTOS[i].id;
    const p = PRESETS[id];
    const ap = id === "i" ? 0 : p.apertura;
    if (cineRef.current !== "hecha") { pararRelojes(); setMomento(-1); setEncuadre({ s: 1, y: 0, ms: 900 }); ponerCine("hecha"); }
    setActo(i);
    setApertura(ap);
    luzLibre.current = false;
    llevar({ ...p, apertura: ap }, DURACION);
  }, [llevar, ponerCine]);

  const moverLuz = useCallback((x: number, y: number) => {
    cortarCine();
    const lx = limitar(x, -LUZ_MAX, LUZ_MAX);
    const ly = limitar(y, -LUZ_MAX, LUZ_MAX);
    luzLibre.current = true;
    actual.current.luzX = lx;
    actual.current.luzY = ly;
    objetivo.current.luzX = lx;
    objetivo.current.luzY = ly;
    setLuzUi({ x: lx, y: ly });
    pedir();
  }, [pedir, cortarCine]);

  const cambiarApertura = (v: number) => {
    cortarCine();
    setApertura(v);
    actual.current.apertura = v;
    objetivo.current.apertura = v;
    if (tween.current) tween.current.desde.apertura = v;
    pedir();
  };

  // Arrastrar la luz sobre la escena
  const desdeEscena = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const unit = Math.min(0.5 * r.height, 0.8 * r.width);
    moverLuz((e.clientX - r.left - r.width / 2) / unit, -(e.clientY - r.top - r.height / 2) / unit);
  };
  const alBajar = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    arrastre.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    desdeEscena(e);
  };
  const alMover = (e: React.PointerEvent) => { if (arrastre.current) desdeEscena(e); };
  const alSoltar = () => { arrastre.current = false; };
  const alTeclado = (e: React.KeyboardEvent) => {
    const paso = e.shiftKey ? 0.2 : 0.08;
    const d: Record<string, [number, number]> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] };
    const v = d[e.key];
    if (!v) return;
    e.preventDefault();
    moverLuz(actual.current.luzX + v[0], actual.current.luzY + v[1]);
  };

  // Mando de luz (pad): pensado para el pulgar
  const padRef = useRef<HTMLDivElement>(null);
  const desdePad = (e: React.PointerEvent) => {
    const r = padRef.current!.getBoundingClientRect();
    moverLuz(((e.clientX - r.left) / r.width - 0.5) * 2 * LUZ_MAX, -((e.clientY - r.top) / r.height - 0.5) * 2 * LUZ_MAX);
  };

  const a = ACTOS[acto];
  const conApertura = acto > 0;
  /** La escena aún no está disponible (se prepara, espera al visitante o falló): los mandos solo guardan el ajuste. */
  const esperando = fase !== "lista" && fase !== "sin-gl";
  const estiloEncuadre = { "--enc-s": encuadre.s, "--enc-y": `${encuadre.y}%`, "--enc-t": `${encuadre.ms}ms` } as CSSProperties;

  return (
    <section className={`bc-inst${montado ? " is-js" : ""}${esperando ? " is-espera" : ""}`} aria-labelledby="bc-inst-t" data-acto={a.id} data-cine={cine}>
      <header className="bc-inst__cab">
        <p className="bc-kicker">{APARICION.kicker}</p>
        <h2 id="bc-inst-t" className="bc-inst__h">{APARICION.titulo}</h2>
      </header>

      <div className="bc-inst__escena">
        <div
          ref={lienzoRef}
          className={`bc-lienzo${fase === "lista" ? " is-lista" : ""}`}
          style={estiloEncuadre}
          role="group"
          aria-busy={fase === "preparando" ? true : undefined}
          tabIndex={0}
          aria-label="Escena: una lámpara ilumina la forma suspendida. Usa las flechas del teclado para mover la luz."
          onKeyDown={alTeclado}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
        >
          <canvas ref={canvasRef} className="bc-canvas" aria-hidden="true" />
          {fase === "error" || sinGL ? <div className="bc-sin-gl" role="img" aria-label="Alternativa estática: una forma oscura suspendida en un muro apenas iluminado." /> : null}
          {fase === "lista" ? (
            <>
              <p className="bc-cine__momento" aria-hidden="true" key={momento}>{momento >= 0 ? APARICION.momentos[momento] : ""}</p>
              {cine === "corriendo" ? <button type="button" className="bc-cine__saltar" onClick={cortarCine}>{APARICION.saltar}</button> : null}
            </>
          ) : null}
          {sinGL ? null : (
            <div className="bc-espera" data-fase={fase} aria-hidden={fase === "lista" ? true : undefined}>
              <div className="bc-espera__cuerpo">
                <p className="bc-espera__k">La materia del sacrificio</p>
                {fase === "error" ? (
                  <>
                    <p className="bc-espera__t">No se pudo preparar la escena.</p>
                    <p className="bc-espera__n">Los tres actos y sus textos siguen disponibles. La escena depende de WebGL2 y no ha podido arrancar aquí.</p>
                    <button type="button" className="bc-espera__btn" onClick={() => { arranque.current?.reiniciar(); poner("inicio"); prepararRef.current(true); }}>Reintentar</button>
                  </>
                ) : fase === "manual" ? (
                  <>
                    <p className="bc-espera__t">La materia permanece oculta.</p>
                    <p className="bc-espera__n">Este navegador no puede preparar la escena sin detener la página durante la compilación. Puedes seguir leyendo sin ella, o prepararla ahora.</p>
                    <button type="button" className="bc-espera__btn" onClick={() => prepararRef.current(true)}>Preparar la instalación</button>
                  </>
                ) : (
                  <>
                    <p className="bc-espera__t">La materia permanece oculta.</p>
                    <p className="bc-espera__p">{fase === "inicio" ? "La escena se prepara al acercarte." : "Preparando la instalación…"}</p>
                    <span className="bc-espera__hilo" aria-hidden="true" />
                    <p className="bc-espera__n">Puedes seguir leyendo y recorriendo la página: la escena aparecerá aquí cuando esté lista. Si mueves la luz o cambias de acto, se aplicará al aparecer.</p>
                  </>
                )}
              </div>
            </div>
          )}
          <span className="bc-sr" role="status">{fase === "lista" ? "La escena está lista." : fase === "error" ? "No se pudo preparar la escena." : ""}</span>
        </div>
      </div>

      <div className="bc-inst__panel">
        <ol className="bc-actos" aria-label="Actos">
          {ACTOS.map((x, i) => (
            <li key={x.id}>
              <button type="button" className="bc-acto-btn" aria-current={i === acto ? "step" : undefined} aria-label={`Acto ${x.numero}: ${x.titulo}`} onClick={() => irAActo(i)}>
                <span className="bc-acto-btn__n">{x.numero}</span>
                <span className="bc-acto-btn__c">{x.corto}</span>
                <span className="bc-acto-btn__t">{x.titulo}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="bc-pista"><span>Acto {a.numero}</span> {a.pista}</p>

        <div className="bc-mandos">
          <div className="bc-mando bc-mando--luz">
            <span className="bc-mando__k" id="bc-luz-k">Luz</span>
            <div
              ref={padRef}
              className="bc-pad"
              role="group"
              aria-labelledby="bc-luz-k"
              aria-describedby="bc-luz-ay"
              tabIndex={0}
              onKeyDown={alTeclado}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); arrastre.current = false; desdePad(e); }}
              onPointerMove={(e) => { if (e.buttons) desdePad(e); }}
            >
              <span
                className="bc-pad__punto"
                style={{ left: `${(luzUi.x / LUZ_MAX / 2 + 0.5) * 100}%`, top: `${(-luzUi.y / LUZ_MAX / 2 + 0.5) * 100}%` }}
              />
            </div>
            <span id="bc-luz-ay" className="bc-mando__ay">Arrastra, o usa las flechas</span>
          </div>

          <label className={`bc-mando bc-mando--ap${conApertura ? "" : " is-off"}`}>
            <span className="bc-mando__k">Apertura</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={apertura}
              disabled={!conApertura}
              onChange={(e) => cambiarApertura(Number(e.target.value))}
              aria-valuetext={estadoApertura(apertura)}
            />
            <span className="bc-mando__ay" aria-live="polite">{conApertura ? estadoApertura(apertura) : "Disponible desde el Acto II"}</span>
          </label>

          <div className="bc-pasos">
            <button type="button" className="bc-paso" onClick={() => irAActo(Math.max(0, acto - 1))} disabled={acto === 0}>
              ← Acto anterior
            </button>
            <button type="button" className="bc-paso bc-paso--sig" onClick={() => irAActo(Math.min(ACTOS.length - 1, acto + 1))} disabled={acto === ACTOS.length - 1}>
              Siguiente acto →
            </button>
          </div>
          {fase === "lista" && cine === "hecha" && !reducido() ? (
            <button type="button" className="bc-volver" onClick={aparecer}>↺ {APARICION.volver}</button>
          ) : null}
        </div>

        <div className="bc-inst__acto">
          {ACTOS.map((x, i) => (
            <article key={x.id} className="bc-acto" data-activo={i === acto ? "" : undefined} aria-hidden={montado && i !== acto ? true : undefined}>
              <p className="bc-acto__linea" aria-live={i === acto ? "polite" : undefined}><span>{x.titulo}</span> {x.linea}</p>
              <details className="bc-acto__mas">
                <summary>Qué ves · qué puedes hacer</summary>
                <dl className="bc-acto__ayuda">
                  <div><dt>Qué ves</dt><dd>{x.ves}</dd></div>
                  <div><dt>Qué puedes hacer</dt><dd>{x.haz}</dd></div>
                  <div><dt>Por qué importa</dt><dd>{x.porque}</dd></div>
                </dl>
              </details>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
