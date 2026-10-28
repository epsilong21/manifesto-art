"use client";

import { useState } from "react";
import { DESC_IMG as I, DIAGONAL, LUZ, MANOS, MEDIDAS } from "@/content/descendimiento";
import { focusOn, OVERVIEW } from "@/lib/focus";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
type Modo = "diagonal" | "manos" | "luz";
const MODOS: { id: Modo; nombre: string }[] = [
  { id: "diagonal", nombre: "La diagonal" },
  { id: "manos", nombre: "Las manos" },
  { id: "luz", nombre: "La luz" },
];
const LISTAS = { diagonal: DIAGONAL, manos: MANOS, luz: LUZ };
/** Cada punto del recorrido en el espacio del SVG (100 × 136). */
const VB_H = I.ratio * 100;
/** Curva suave (Catmull-Rom) por los puntos de la diagonal, en el espacio del SVG. */
const RUTA = (() => {
  const q = DIAGONAL.map((p) => [p.x * 100, p.y * VB_H]);
  let d = `M${q[0][0].toFixed(2)},${q[0][1].toFixed(2)}`;
  for (let k = 0; k < q.length - 1; k++) {
    const a = q[Math.max(0, k - 1)], b = q[k], c = q[k + 1], e = q[Math.min(q.length - 1, k + 2)];
    d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(2)},${(b[1] + (c[1] - a[1]) / 6).toFixed(2)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(2)},${(c[1] - (e[1] - b[1]) / 6).toFixed(2)} ${c[0].toFixed(2)},${c[1].toFixed(2)}`;
  }
  return d;
})();


/**
 * «El peso de la luz»: tres lecturas sobre el panel (diagonal, manos, luz).
 * Todo son superposiciones CSS/SVG sobre una copia de la reproducción; el panel de la
 * primera pantalla no se toca. Los desplazamientos son transiciones CSS que se anulan
 * con prefers-reduced-motion.
 */
export function PesoDeLaLuz() {
  const [modo, setModo] = useState<Modo>("diagonal");
  const [idx, setIdx] = useState({ diagonal: 0, manos: 0, luz: 0 });
  const lista = LISTAS[modo];
  const i = idx[modo];
  const p = lista[i];
  const vista =
    modo === "manos" ? focusOn({ x: p.x * 100, y: p.y * 100, zoom: (p as (typeof MANOS)[number]).zoom }) : OVERVIEW;
  const filtro = modo === "luz" ? (p as (typeof LUZ)[number]).filtro : "none";
  const ir = (n: number) => setIdx({ ...idx, [modo]: Math.min(lista.length - 1, Math.max(0, n)) });
  // Tramo de la diagonal ya recorrido (0–1), para revelarla poco a poco
  const hecho = modo === "diagonal" ? i / (DIAGONAL.length - 1) : modo === "luz" ? 1 : 0;

  return (
    <section className="dsc-explora" aria-labelledby="dsc-explora-h">
      <div className="dsc-explora__cab">
        <h2 id="dsc-explora-h" className="sp-h2">El peso de la luz</h2>
        <p>Tres maneras de leer cómo baja el cuerpo: por su línea, por las manos que lo reciben y por la luz.</p>
      </div>
      <div className="dsc-explora__cuerpo">
        <div className="dsc-escena">
          <div className="dsc-marco" data-modo={modo} role="img" aria-label={`Panel con la lectura «${MODOS.find((m) => m.id === modo)!.nombre}»: ${p.titulo}`}>
            <div
              className="dsc-lienzo"
              style={{ transform: `translate(${vista.tx}%, ${vista.ty}%) scale(${vista.scale})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="dsc-img"
                src={`${BASE}${I.base}-${I.anchos[1]}.webp`}
                width={I.width}
                height={I.height}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{ filter: filtro }}
              />
              <svg className="dsc-svg" viewBox={`0 0 100 ${VB_H}`} aria-hidden="true" preserveAspectRatio="none">
                {modo !== "manos" ? (
                  <>
                    <path className="dsc-ruta dsc-ruta--base" d={RUTA} pathLength={1} />
                    <path className="dsc-ruta dsc-ruta--vivo" d={RUTA} pathLength={1} style={{ strokeDashoffset: 1 - hecho }} />
                  </>
                ) : null}
              </svg>
              {lista.map((q, k) => (
                <span
                  key={q.id}
                  className="dsc-marca"
                  data-on={k === i}
                  data-vis={modo === "diagonal" || k === i}
                  style={{ left: `${q.x * 100}%`, top: `${q.y * 100}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="dsc-mandos">
          <div className="dsc-modos" role="group" aria-label="Lectura">
            {MODOS.map((m) => (
              <button key={m.id} type="button" className="dsc-modo" aria-pressed={modo === m.id} onClick={() => setModo(m.id)}>
                {m.nombre}
              </button>
            ))}
          </div>
          <div className="dsc-punto" aria-live="polite">
            <p className="dsc-punto__n">
              {i + 1} de {lista.length}
            </p>
            <h3>{p.titulo}</h3>
            <p>{p.texto}</p>
            {modo === "luz" ? (
              <p className="dsc-dato">
                Sobre la reproducción, {MEDIDAS.oscuro} % de la superficie es casi negra y solo {MEDIDAS.claro} % es clara.
              </p>
            ) : null}
          </div>
          <div className="dsc-botones">
            <button type="button" className="mf-btn" onClick={() => ir(i - 1)} disabled={i === 0}>← Anterior</button>
            <button type="button" className="mf-btn mf-btn--solid" onClick={() => ir(i + 1)} disabled={i === lista.length - 1}>Siguiente →</button>
          </div>
          <ol className="dsc-lista" aria-label="Puntos de la lectura">
            {lista.map((q, k) => (
              <li key={q.id}>
                <button type="button" onClick={() => ir(k)} aria-current={k === i ? "step" : undefined}>
                  <span>{k + 1}</span> {q.titulo}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
