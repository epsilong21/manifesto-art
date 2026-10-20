"use client";

import { useEffect, useId, useRef, useState } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { TURBULENCIA } from "@/content/noche";
import { alternarCielo, useCieloPausado, useMovimientoReducido } from "./cielo";
import { CASCADA, escalaMinima, montarFlujo, PINCELADA, regimen, reynolds } from "./flujo";

const PRESETS = [
  { nombre: "Quietud", energia: 12, viscosidad: 60 },
  { nombre: "Como el cielo", ...CASCADA },
  { nombre: "Tormenta", energia: 100, viscosidad: 1 },
];

/** Regla de escalas: del remolino grande (1) a 1/128, en escala logarítmica. */
const MIN_LOG = Math.log2(1 / 128);
const posLog = (l: number) => (Math.log2(Math.max(l, 1 / 128)) / MIN_LOG) * 100;

/** Formato numérico español sin depender de la configuración regional del entorno. */
const entero = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/**
 * Laboratorio «Turbulencia»: un campo de corrientes con energía y viscosidad.
 * El veredicto dice cuándo el flujo se parece al cielo pintado y cuándo no.
 */
export function Turbulencia() {
  const [energia, setEnergia] = useState(CASCADA.energia);
  const [viscosidad, setViscosidad] = useState(CASCADA.viscosidad);
  const paused = useCieloPausado();
  const reduced = useMovimientoReducido();
  const figRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flujo = useRef<ReturnType<typeof montarFlujo>>(null);
  const pausaRef = useRef(paused);
  const id = useId();

  const re = reynolds(energia, viscosidad);
  const eta = escalaMinima(re);
  const estado = regimen(re);
  const v = TURBULENCIA.veredictos[estado];

  useEffect(() => {
    pausaRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!canvasRef.current || !figRef.current) return;
    flujo.current = montarFlujo(
      {
        canvas: canvasRef.current,
        host: figRef.current,
        paleta: ["224,170,69", "244,233,207", "160,196,232", "160,196,232"],
        fondo: "9,16,38",
        densidad: 1.5,
        rastro: 0.03,
        pausado: () => pausaRef.current,
      },
      { re: reynolds(CASCADA.energia, CASCADA.viscosidad), energia: CASCADA.energia, activo: true },
    );
    return () => flujo.current?.destruir();
  }, []);

  useEffect(() => {
    flujo.current?.actualizar({ re, energia, activo: true });
  }, [re, energia]);

  return (
    <div className="nc-lab" data-estado={estado}>
      <figure className="nc-lab__fig">
        <div ref={figRef} className="nc-lab__view">
          <canvas ref={canvasRef} aria-hidden="true" />
          <p className="nc-lab__tag" aria-hidden="true">
            {v.nombre}
          </p>
        </div>
        {/* De qué tamaño son los remolinos que sobreviven, frente al ancho de una pincelada */}
        <div className="nc-lab__rule" aria-hidden="true">
          <span className="nc-lab__band" style={{ width: `${posLog(eta)}%` }} />
          <span className="nc-lab__brush" style={{ left: `${posLog(PINCELADA)}%` }}>
            <i>Pincelada</i>
          </span>
          <span className="nc-lab__end nc-lab__end--a">Remolino grande</span>
          <span className="nc-lab__end nc-lab__end--b">Más pequeño</span>
        </div>
        <figcaption>{TURBULENCIA.modelo}</figcaption>
      </figure>

      <div className="nc-lab__controls">
        <label className="nc-range">
          <span>
            Energía <output htmlFor={`${id}-e`}>{energia}</output>
          </span>
          <input id={`${id}-e`} type="range" min={1} max={100} step={1} value={energia} onChange={(e) => setEnergia(+e.target.value)} />
        </label>
        <label className="nc-range">
          <span>
            Viscosidad <output htmlFor={`${id}-v`}>{viscosidad}</output>
          </span>
          <input
            id={`${id}-v`}
            type="range"
            min={1}
            max={100}
            step={1}
            value={viscosidad}
            onChange={(e) => setViscosidad(+e.target.value)}
          />
        </label>
        <div className="nc-lab__presets" role="group" aria-label="Flujos de ejemplo">
          {PRESETS.map((p) => (
            <button
              key={p.nombre}
              type="button"
              className="mf-btn"
              aria-pressed={energia === p.energia && viscosidad === p.viscosidad}
              onClick={() => {
                setEnergia(p.energia);
                setViscosidad(p.viscosidad);
              }}
            >
              {p.nombre}
            </button>
          ))}
        </div>
        <div className="nc-lab__result" aria-live="polite">
          <p className="nc-lab__verdict">{v.nombre}</p>
          <p>{v.texto}</p>
          <p className="nc-lab__data">
            Reynolds de juguete ≈ {entero(re)} · el remolino más pequeño mide{" "}
            {eta >= 0.5 ? "casi lo mismo que el grande" : `1/${Math.round(1 / eta)} del grande`}.
          </p>
        </div>
        {!reduced && (
          <button type="button" className="nc-tool nc-lab__pause" aria-pressed={paused} onClick={alternarCielo}>
            {paused ? "Reanudar el cielo" : "Pausar el cielo"}
          </button>
        )}
      </div>

      <div className="nc-lab__studies">
        <div className="nc-lab__read">
          <KindTag tipo="lectura" />
          <p>{TURBULENCIA.lectura}</p>
        </div>
        {/* Plegados: la página no se alarga, pero los datos y su debate siguen a un clic */}
        <details className="nc-more nc-lab__more">
          <summary>Ver los estudios ({TURBULENCIA.estudios.length})</summary>
          <ol>
            {TURBULENCIA.estudios.map((s) => (
              <li key={s.id}>
                <KindTag tipo="hecho" />
                <h3>{s.titulo}</h3>
                <p>{s.texto}</p>
                <a href={s.fuente.href} target="_blank" rel="noopener noreferrer">
                  {s.fuente.label}
                </a>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}
