"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type PresionState,
  destruir,
  iniciar,
  pintar,
  redimensionar,
} from "./presionGL";

const DPR_MOVIL = 1.25;
const DPR_DESK = 1.5;
const FPS_CAP = 30;
const FRAME_INTERVAL = 1000 / FPS_CAP;
const IDLE_RETURN_DELAY = 4000;
const IDLE_RETURN_SPEED = 0.12;
const DRAG_SENSITIVITY = 2.0;

/** Atmósfera: curva suave con techo bajo; la deformación sigue la presión real. */
function atmosfera(p: number) {
  const a = p * p * (3 - 2 * p);
  return {
    vignette: 0.15 + a * 0.3,
    glow: 0.3 + a * 0.5,
  };
}

export function CoronaPresion() {
  const seccionRef = useRef<HTMLElement>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PresionState | null>(null);
  const visibleRef = useRef(false);
  const lastPaintRef = useRef(0);
  const lastInterRef = useRef(0);
  const restartRef = useRef<(() => void) | null>(null);
  const interactedRef = useRef(false);

  const draggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartPressureRef = useRef(0);

  const [presion, setPresion] = useState(0);
  const [fallback, setFallback] = useState(false);
  const [interacted, setInteracted] = useState(false);

  const dpr = useCallback(
    () =>
      typeof window !== "undefined" &&
      (window.innerWidth < 640 || (navigator.hardwareConcurrency ?? 4) <= 2)
        ? DPR_MOVIL
        : DPR_DESK,
    [],
  );

  const updateCSSVar = useCallback((p: number) => {
    const el = seccionRef.current;
    if (!el) return;
    el.style.setProperty("--co-presion", String(p));
    const a = atmosfera(p);
    el.style.setProperty("--co-vignette-o", String(a.vignette));
    el.style.setProperty("--co-glow-o", String(a.glow));
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const s = iniciar(cv);
    if (!s) {
      setFallback(true);
      return;
    }
    stateRef.current = s;

    const resize = () => {
      const el = cajaRef.current;
      if (!el || !stateRef.current) return;
      redimensionar(stateRef.current, el.clientWidth, el.clientHeight, dpr());
      restartRef.current?.();
    };
    resize();

    let prevT = performance.now();
    const loop = (now: number) => {
      const st = stateRef.current;
      if (!st || st.destruido) return;
      if (!visibleRef.current) {
        st.raf = 0;
        return;
      }

      const dt = Math.min((now - prevT) / 1000, 0.05);
      prevT = now;

      const sinceInter = now - lastInterRef.current;
      if (sinceInter > IDLE_RETURN_DELAY && st.presion > 0.001) {
        st.presion = Math.max(0, st.presion - IDLE_RETURN_SPEED * dt);
        setPresion(st.presion);
        updateCSSVar(st.presion);
      }

      if (st.reducido) st.presionVis = st.presion;
      else if (Math.abs(st.presion - st.presionVis) < 0.002) st.presionVis = st.presion;
      else st.presionVis += (st.presion - st.presionVis) * (1 - Math.exp(-dt * 6));

      if (now - lastPaintRef.current >= FRAME_INTERVAL) {
        pintar(st);
        lastPaintRef.current = now;
      }

      if (st.reducido && st.presion < 0.001) {
        pintar(st);
        st.raf = 0;
        return;
      }

      st.raf = requestAnimationFrame(loop);
    };

    const reiniciar = () => {
      const st = stateRef.current;
      if (!st || st.destruido || !visibleRef.current) return;
      if (!st.raf) {
        prevT = performance.now();
        st.raf = requestAnimationFrame(loop);
      }
    };
    restartRef.current = reiniciar;

    const io = new IntersectionObserver(
      ([e]) => {
        visibleRef.current = e.isIntersecting;
        if (e.isIntersecting) reiniciar();
        else {
          const st = stateRef.current;
          if (st?.raf) {
            cancelAnimationFrame(st.raf);
            st.raf = 0;
          }
        }
      },
      { threshold: 0.05 },
    );
    io.observe(cv);

    const onVis = () => {
      if (document.hidden) {
        const st = stateRef.current;
        if (st?.raf) {
          cancelAnimationFrame(st.raf);
          st.raf = 0;
        }
      } else if (visibleRef.current) {
        reiniciar();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(resize);
    if (cajaRef.current) ro.observe(cajaRef.current);

    pintar(s);
    visibleRef.current = true;
    prevT = performance.now();
    s.raf = requestAnimationFrame(loop);

    return () => {
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      restartRef.current = null;
      if (stateRef.current) destruir(stateRef.current);
      stateRef.current = null;
    };
  }, [dpr, updateCSSVar]);

  const applyPressure = useCallback(
    (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      const st = stateRef.current;
      if (!st) return;
      st.presion = clamped;
      setPresion(clamped);
      updateCSSVar(clamped);
      lastInterRef.current = performance.now();
      if (!interactedRef.current) {
        interactedRef.current = true;
        setInteracted(true);
      }
      restartRef.current?.();
    },
    [updateCSSVar],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartPressureRef.current = stateRef.current?.presion ?? 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const el = cajaRef.current;
      if (!el) return;
      const deltaY = e.clientY - dragStartYRef.current;
      const normalizedDelta = deltaY / el.clientHeight;
      applyPressure(
        dragStartPressureRef.current + normalizedDelta * DRAG_SENSITIVITY,
      );
    },
    [applyPressure],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  const onSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      applyPressure(parseFloat(e.target.value));
    },
    [applyPressure],
  );

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      const st = stateRef.current;
      if (!st) return;
      const step = 0.05;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        applyPressure(st.presion - step);
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        applyPressure(st.presion + step);
      } else return;
      e.preventDefault();
    },
    [applyPressure],
  );

  if (fallback) {
    return (
      <section className="co-corona" aria-label="El peso">
        <header className="co-corona__cab">
          <p className="co-kicker co-kicker--dark" aria-hidden="true">
            Acto III
          </p>
          <h2 className="co-corona__h">El peso</h2>
          <span className="co-corona__tipo">
            Interpretación de MANIFESTO
          </span>
        </header>
        <div className="co-fallback">
          <p>Esta instalación requiere un navegador con WebGL2.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={seccionRef}
      className="co-corona"
      style={{
        "--co-presion": presion,
        "--co-vignette-o": atmosfera(presion).vignette,
        "--co-glow-o": atmosfera(presion).glow,
      } as React.CSSProperties}
      aria-label="El peso"
    >
      <header className="co-corona__cab">
        <p className="co-kicker co-kicker--dark" aria-hidden="true">
          Acto III
        </p>
        <h2 className="co-corona__h">El peso</h2>
        <span className="co-corona__tipo">Interpretación de MANIFESTO</span>
      </header>

      <div className="co-corona__escenario">
        <div
          ref={cajaRef}
          className="co-corona__lienzo"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKey}
          tabIndex={0}
          role="img"
          aria-label="Corona de espinas tridimensional. Arrastra hacia abajo para comprimir la corona. Usa las flechas como alternativa."
        >
          <canvas ref={canvasRef} aria-hidden="true" />
          {!interacted && (
            <p className="co-corona__pista" aria-hidden="true">
              Arrastra hacia abajo
            </p>
          )}
        </div>
      </div>

      <div className="co-corona__respuesta">
        <p className="co-corona__pie" aria-live="polite">
          {presion < 0.3
            ? "La corona descansa. Ramas secas y espinas sostenidas en equilibrio."
            : presion < 0.7
              ? "La presión aumenta. Las ramas se acercan, las espinas buscan el centro."
              : "La corona se aprieta. El peso no necesita ser visible para ser real."}
        </p>

        <div className="co-corona__control">
          <label htmlFor="corona-presion" className="co-corona__label">
            Presión
          </label>
          <input
            id="corona-presion"
            className="co-corona__slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={presion}
            onChange={onSlider}
            aria-label="Nivel de presión sobre la corona"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(presion * 100)}
            aria-valuetext={`${Math.round(presion * 100)} por ciento`}
          />
        </div>
      </div>
    </section>
  );
}
