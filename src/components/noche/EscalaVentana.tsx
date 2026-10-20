"use client";

import { useState, type CSSProperties } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { ESCALA_NOCHE } from "@/content/noche";

/** Eje de 10 m a 10^17 m. */
const MIN = 1;
const MAX = 17;
const DECADAS = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);
const MAYOR = ESCALA_NOCHE[ESCALA_NOCHE.length - 1].m;

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const potencia = (n: number) => `10${String(n).replace(/\d/g, (d) => SUP[+d])}`;

/** «14 veces», «47 millones de veces», «610.000 veces»: cuánto más lejos está cada parada que la anterior. */
function salto(a: number, b: number) {
  const r = b / a;
  if (r >= 1e6) return `${Math.round(r / 1e6)} millones de veces`;
  if (r >= 1e4) return `${(Math.round(r / 1e4) * 1e4).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} veces`;
  return `${Math.round(r)} veces`;
}

/**
 * «De la ventana a Venus»: distancias desde la ventana del asilo en una regla
 * logarítmica. El modo lineal muestra por qué hace falta: todo menos la
 * estrella cae en el primer píxel. Vive dentro del punto «Distancia» de La ventana.
 */
export function EscalaVentana() {
  const [lineal, setLineal] = useState(false);
  const pos = (m: number) => (lineal ? (m / MAYOR) * 100 : ((Math.log10(m) - MIN) / (MAX - MIN)) * 100);

  return (
    <div className="nc-scale" data-modo={lineal ? "lineal" : "log"}>
      <div className="nc-scale__switch" role="group" aria-label="Tipo de escala">
        <button type="button" className="nc-tool" aria-pressed={!lineal} onClick={() => setLineal(false)}>
          Logarítmica
        </button>
        <button type="button" className="nc-tool" aria-pressed={lineal} onClick={() => setLineal(true)}>
          Lineal
        </button>
      </div>

      <div className="nc-scale__rule" aria-hidden="true">
        {lineal ? (
          <>
            <span className="nc-scale__tick" data-label data-edge="start" style={{ left: "0%" }}>
              <i>0 m</i>
            </span>
            <span className="nc-scale__tick" data-label data-edge="end" style={{ left: "100%" }}>
              <i>4,25 años luz</i>
            </span>
          </>
        ) : (
          DECADAS.map((d) => (
            <span
              key={d}
              className="nc-scale__tick"
              data-label={(d - 2) % 3 === 0 || undefined}
              data-secundaria={(d - 2) % 6 === 3 || undefined}
              data-edge={d === MAX ? "end" : undefined}
              style={{ left: `${pos(10 ** d)}%` }}
            >
              {(d - 2) % 3 === 0 ? <i>{potencia(d)} m</i> : null}
            </span>
          ))
        )}
        {ESCALA_NOCHE.map((p, i) => (
          <span key={p.id} className="nc-scale__mark" data-id={p.id} data-alt={i % 2 === 1 || undefined} style={{ left: `${pos(p.m)}%`, "--i": i } as CSSProperties}>
            <b>{String(i + 1).padStart(2, "0")}</b>
          </span>
        ))}
      </div>
      <p className="nc-scale__note" aria-live="polite">
        {lineal
          ? "En escala lineal, los cipreses, el pueblo y Venus caen en el mismo punto, a la izquierda: a esta distancia, hasta Venus está pegada a la ventana."
          : "Cada marca de la regla multiplica la distancia por diez."}
      </p>

      <ol className="nc-scale__list">
        {ESCALA_NOCHE.map((p, i) => (
          <li key={p.id} data-id={p.id}>
            <h4>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")} · </span>
              {p.nombre} <span className="nc-scale__val">{p.valor}</span>
            </h4>
            <p className="nc-scale__jump">
              {i === 0 ? "Desde la ventana" : `${salto(ESCALA_NOCHE[i - 1].m, p.m)} más lejos`} · <KindTag tipo={p.tipo} />
            </p>
            <p className="nc-scale__txt">{p.texto}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
