"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CORONA_IMG, DESCUBRIMIENTOS } from "@/content/corona";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/*
 * La lupa tiene la proporción exacta de la pintura: en reposo se ve el conjunto.
 * Cada encuadre (s, px, py: escala y centro en % de la imagen) deja la ventana
 * [px ± 50/s, py ± 50/s] dentro del lienzo pintado (x 3–97 %, y 3,5–97 %),
 * es decir, sin marco dorado. (mx, my) es el marcador en el conjunto.
 */
type Foco = { s: number; px: number; py: number; mx: number; my: number };
const FOCOS: Foco[] = [
  { s: 2.0, px: 42, py: 47, mx: 29, my: 39 }, // rostro: luz sobre frente, pómulo y barba
  { s: 1.75, px: 42, py: 33, mx: 45, my: 18 }, // corona y frente, sin marco
  { s: 1.9, px: 49, py: 70.5, mx: 86, my: 82 }, // manos, caña y manto
];

const PAUSA_CONJUNTO_MS = 320;

function camaraCSS(i: number): string {
  if (i < 0) return "translate(0%,0%) scale(1)";
  const f = FOCOS[i];
  return `translate(${(50 - f.px * f.s).toFixed(2)}%,${(50 - f.py * f.s).toFixed(2)}%) scale(${f.s})`;
}

function ventana(i: number) {
  const f = FOCOS[i];
  const lado = 100 / f.s;
  return {
    left: `${f.px - lado / 2}%`,
    top: `${f.py - lado / 2}%`,
    width: `${lado}%`,
    height: `${lado}%`,
  };
}

export function Explorador() {
  const [activo, setActivo] = useState(-1);
  const [camara, setCamara] = useState(-1);
  const secRef = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;
    const items = sec.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!items.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.visible = "";
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const ir = useCallback((i: number) => {
    window.clearTimeout(timer.current);
    const reducido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setActivo(i);
    if (i < 0) {
      setCamara(-1);
      return;
    }
    setCamara((prev) => {
      if (prev >= 0 && prev !== i && !reducido) {
        // conjunto → detalle: la cámara se aleja antes de entrar en el nuevo
        timer.current = window.setTimeout(() => setCamara(i), PAUSA_CONJUNTO_MS);
        return -1;
      }
      return i;
    });
  }, []);

  const alternar = useCallback(
    (i: number) => ir(activo === i ? -1 : i),
    [activo, ir],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && activo >= 0) ir(-1);
  };

  const srcSet = CORONA_IMG.anchos
    .map((w) => `${BASE}${CORONA_IMG.base}-${w}.webp ${w}w`)
    .join(", ");
  const desc = activo >= 0 ? DESCUBRIMIENTOS[activo] : null;

  return (
    <section
      ref={secRef}
      className="co-explorador"
      aria-labelledby="co-explorador-t"
      onKeyDown={onKey}
    >
      <header className="co-explorador__intro" data-reveal>
        <p className="co-kicker" aria-hidden="true">
          Acto II
        </p>
        <h2 id="co-explorador-t" className="co-explorador__h">
          La mirada revela
        </h2>
        <p className="co-explorador__sub">
          Tres detalles en la pintura de Reni.
        </p>
      </header>

      <div className="co-explorador__escena" data-reveal>
        <div className="co-explorador__lupa">
          <img
            className="co-explorador__pintura"
            style={{ transform: camaraCSS(camara), transformOrigin: "0 0" }}
            src={`${BASE}${CORONA_IMG.base}-2100.webp`}
            srcSet={srcSet}
            sizes="(min-width: 64rem) 42vw, 90vw"
            width={CORONA_IMG.width}
            height={CORONA_IMG.height}
            alt=""
            loading="lazy"
            decoding="async"
          />

          {camara < 0 &&
            activo < 0 &&
            FOCOS.map((f, i) => (
              <button
                key={i}
                type="button"
                className="co-explorador__marca"
                style={{ left: `${f.mx}%`, top: `${f.my}%`, "--i": i } as React.CSSProperties}
                onClick={() => ir(i)}
                tabIndex={-1}
                aria-hidden="true"
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
              </button>
            ))}

          {activo >= 0 && (
            <button
              type="button"
              className="co-explorador__mini"
              onClick={() => ir(-1)}
              aria-label="Volver a la vista de conjunto"
            >
              <img
                src={`${BASE}${CORONA_IMG.base}-600.webp`}
                alt=""
                width={CORONA_IMG.width}
                height={CORONA_IMG.height}
                decoding="async"
              />
              <span
                className="co-explorador__mini-v"
                style={ventana(camara < 0 ? activo : camara)}
                data-aleja={camara < 0 ? "" : undefined}
              />
            </button>
          )}
        </div>

        <div className="co-explorador__panel">
          <nav
            className="co-explorador__nav"
            aria-label="Regiones de la pintura"
          >
            {DESCUBRIMIENTOS.map((d, i) => (
              <button
                key={d.id}
                className="co-explorador__btn"
                data-active={activo === i ? "" : undefined}
                onClick={() => alternar(i)}
                aria-pressed={activo === i}
                aria-controls="co-lectura"
              >
                <span className="co-explorador__num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="co-explorador__btn-t">{d.titulo}</span>
              </button>
            ))}
          </nav>

          <div
            id="co-lectura"
            className="co-explorador__lectura"
            role="region"
            aria-live="polite"
          >
            {desc ? (
              <div className="co-explorador__texto" key={activo}>
                <h3 className="co-explorador__dt">{desc.titulo}</h3>
                <p className="co-explorador__dd">{desc.texto}</p>
                <span className="co-explorador__tipo">{desc.tipo}</span>
                <button
                  type="button"
                  className="co-explorador__volver"
                  onClick={() => ir(-1)}
                >
                  Ver el conjunto
                </button>
              </div>
            ) : (
              <p className="co-explorador__invita">
                Elige un punto de la pintura o una región de la lista. Cada
                detalle revela una decisión de Reni.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="sr-only">{CORONA_IMG.alt}</p>
    </section>
  );
}
