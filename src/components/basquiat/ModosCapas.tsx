"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Modo = "modelo" | "pintura";

const MODOS: { id: Modo; nombre: string; detalle: string }[] = [
  { id: "modelo", nombre: "Modelo de MANIFESTO", detalle: "Acetatos y rayos X" },
  { id: "pintura", nombre: "Sobre la pintura", detalle: "Capas e inspector de trazos" },
];

/**
 * Sección 01 con reproducción: dos modos en pestañas, uno visible cada vez.
 * - «Modelo de MANIFESTO» (por defecto): el laboratorio de acetatos, didáctica
 *   original que no depende de la pintura y existe también sin ella.
 * - «Sobre la pintura»: las capas e inspector sobre la reproducción, como
 *   herramienta documental complementaria.
 *
 * Los dos paneles quedan montados (`hidden`): al alternar, cada uno conserva su
 * estado. Flechas, Inicio y Fin mueven entre pestañas (patrón ARIA tabs). Sin
 * JavaScript las pestañas se ocultan y queda el modelo (ver DescifrarCapas).
 */
export function ModosCapas({ modelo, pintura }: { modelo: ReactNode; pintura: ReactNode }) {
  const [modo, setModo] = useState<Modo>("modelo");
  const id = useId();
  const pestanas = useRef<(HTMLButtonElement | null)[]>([]);

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = MODOS.findIndex((m) => m.id === modo);
    const destino =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % MODOS.length
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + MODOS.length) % MODOS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? MODOS.length - 1
      : null;
    if (destino === null) return;
    e.preventDefault();
    setModo(MODOS[destino].id);
    pestanas.current[destino]?.focus();
  };

  return (
    <div className="bq-modos">
      <div className="bq-modos__tabs" role="tablist" aria-label="Cómo explorar las capas" onKeyDown={teclas}>
        {MODOS.map((m, i) => (
          <button
            key={m.id}
            ref={(el) => {
              pestanas.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-t-${m.id}`}
            aria-controls={`${id}-p-${m.id}`}
            aria-selected={modo === m.id}
            tabIndex={modo === m.id ? 0 : -1}
            className="bq-modos__tab"
            onClick={() => setModo(m.id)}
          >
            <span className="bq-modos__n">{m.nombre}</span>
            <span className="bq-modos__d">{m.detalle}</span>
          </button>
        ))}
      </div>
      {MODOS.map((m) => (
        <div
          key={m.id}
          role="tabpanel"
          id={`${id}-p-${m.id}`}
          aria-labelledby={`${id}-t-${m.id}`}
          hidden={modo !== m.id}
          className="bq-modos__panel"
        >
          {m.id === "modelo" ? modelo : pintura}
        </div>
      ))}
    </div>
  );
}
