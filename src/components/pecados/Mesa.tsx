"use client";

import { useState, type KeyboardEvent } from "react";
import { CIERRE_OJO, CIRCULO as C, ESCENAS, GRUPOS, PEC_IMG as I, TOTAL_ESCENAS, type Escena } from "@/content/pecados";
import { focusOn, OVERVIEW } from "@/lib/focus";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const VB_H = I.ratio * 100;
const rad = (a: number) => (a * Math.PI) / 180;
/** Punto del círculo central, en unidades del SVG (el ancho vale 100). */
const pt = (r: number, a: number): [number, number] => [(C.x + r * Math.cos(rad(a))) * 100, (C.y * I.ratio + r * Math.sin(rad(a))) * 100];

function trazo(e: Escena): string {
  const f = e.forma;
  if (f.tipo === "circulo") {
    const r = f.r * 100;
    return `M${(f.x * 100 - r).toFixed(2)},${(f.y * VB_H).toFixed(2)} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0Z`;
  }
  const [x1, y1] = pt(C.rExt, f.desde), [x2, y2] = pt(C.rExt, f.hasta);
  const [x3, y3] = pt(C.rInt, f.hasta), [x4, y4] = pt(C.rInt, f.desde);
  const g = f.hasta - f.desde > 180 ? 1 : 0;
  const R = C.rExt * 100, r = C.rInt * 100;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${g} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)} A${r},${r} 0 ${g} 0 ${x4.toFixed(2)},${y4.toFixed(2)}Z`;
}

/**
 * «El ojo que todo lo ve»: la mesa completa a la izquierda, con sus once zonas y el ojo como
 * regiones seleccionables, y una ampliación de la zona elegida. Solo hay botones y SVG; sin gestos
 * de arrastre. prefers-reduced-motion anula las transiciones.
 */
export function Mesa() {
  const [sel, setSel] = useState<string | null>(null);
  const [vistas, setVistas] = useState<string[]>([]);
  const idx = sel ? ESCENAS.findIndex((e) => e.id === sel) : -1;
  const e = idx >= 0 ? ESCENAS[idx] : null;
  const vista = e ? focusOn({ x: e.x * 100, y: e.y * 100, zoom: e.zoom }) : OVERVIEW;
  const nVistas = vistas.filter((v) => v !== "ojo").length;

  const elegir = (id: string | null) => {
    setSel(id);
    if (id) setVistas((v) => (v.includes(id) ? v : [...v, id]));
  };
  const ir = (n: number) => elegir(ESCENAS[(n + ESCENAS.length) % ESCENAS.length].id);
  const tecla = (id: string) => (ev: KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      elegir(id);
    }
  };
  const posicion = e
    ? e.grupo === "pecado"
      ? `Pecado ${idx + 1} de 7`
      : e.grupo === "postrimeria"
        ? `Postrimería ${idx - 6} de 4`
        : "El centro"
    : "";

  return (
    <section className="pec-explora" aria-labelledby="pec-explora-h">
      <div className="pec-explora__cab">
        <h2 id="pec-explora-h" className="sp-h2">El ojo que todo lo ve</h2>
        <p>Toca un sector, un medallón o el ojo. La mesa se queda entera; la ampliación te acerca.</p>
      </div>
      <div className="pec-explora__cuerpo">
        <div className="pec-escena">
          <div className="pec-marco">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="pec-img"
              src={`${BASE}${I.base}-${I.anchos[1]}.webp`}
              width={I.width}
              height={I.height}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <svg className="pec-svg" viewBox={`0 0 100 ${VB_H}`} role="group" aria-label="Zonas de la mesa">
              {ESCENAS.map((z) => (
                <g
                  key={z.id}
                  className="pec-zona"
                  data-on={sel === z.id}
                  data-visto={vistas.includes(z.id)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={sel === z.id}
                  aria-label={`${z.grupo === "pecado" ? "Pecado: " : z.grupo === "postrimeria" ? "Postrimería: " : ""}${z.nombre}`}
                  onClick={() => elegir(z.id)}
                  onKeyDown={tecla(z.id)}
                >
                  <path d={trazo(z)} />
                  <circle className="pec-visto" cx={z.x * 100} cy={z.y * VB_H} r="1.15" />
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="pec-mandos">
          <div className="pec-lupa" aria-hidden="true">
            <div className="pec-lienzo" style={{ transform: `translate(${vista.tx}%, ${vista.ty}%) scale(${vista.scale})` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${BASE}${I.base}-${I.anchos[1]}.webp`} width={I.width} height={I.height} alt="" loading="lazy" decoding="async" draggable={false} />
            </div>
          </div>

          <div className="pec-texto" aria-live="polite">
            {e ? (
              <>
                <p className="pec-pos">{posicion}</p>
                <h3>
                  {e.nombre}
                  {e.rotulo && e.rotulo !== e.nombre ? <span className="pec-rotulo"> · «{e.rotulo}»</span> : null}
                </h3>
                <p className="pec-vis"><b>Se ve.</b> {e.observacion}</p>
                <p className="pec-int"><b>Interpretación.</b> {e.interpretacion}</p>
                {e.id === "ojo" ? (
                  <p className="pec-cierre">{nVistas >= TOTAL_ESCENAS ? CIERRE_OJO : `Has visto ${nVistas} de las ${TOTAL_ESCENAS} escenas que rodean al ojo; recórrelas todas para leerlo completo.`}</p>
                ) : null}
              </>
            ) : (
              <p className="pec-vacio">Aquí verás la zona que elijas, ampliada. La mesa tiene siete pecados, cuatro postrimerías y un ojo.</p>
            )}
            <p className="pec-cuenta">{nVistas} de {TOTAL_ESCENAS} escenas vistas</p>
          </div>

          <div className="pec-botones">
            <button type="button" className="mf-btn" onClick={() => (idx >= 0 ? ir(idx - 1) : ir(ESCENAS.length - 1))}>← Anterior</button>
            <button type="button" className="mf-btn mf-btn--solid" onClick={() => ir(idx + 1)}>Siguiente →</button>
            <button type="button" className="mf-btn" onClick={() => elegir(null)} disabled={!e}>Ver la mesa entera</button>
          </div>

          <details className="pec-lista">
            <summary>Elegir desde la lista</summary>
            {GRUPOS.map((g) => (
              <div key={g.id} className="pec-grupo" role="group" aria-label={g.nombre}>
                <h4>{g.nombre}</h4>
                <div className="pec-chips">
                  {ESCENAS.filter((z) => z.grupo === g.id).map((z) => (
                    <button key={z.id} type="button" className="pec-chip" aria-pressed={sel === z.id} data-visto={vistas.includes(z.id)} onClick={() => elegir(z.id)}>
                      {z.nombre}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </details>
        </div>
      </div>
    </section>
  );
}
