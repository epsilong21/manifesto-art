"use client";

/**
 * Umbral · «Lo que desaparece». Entre las dos instalaciones, en la misma sala que no se apaga del todo: la última imagen de la
 * forma (copiada de la Instalación I) se hunde y se desenfoca; en su lugar queda su huella, una mancha pálida con su mismo
 * contorno; el cable del que colgaba se abre en tres, la luz pasa de arriba al suelo y al fondo asoman tres membranas de canto.
 * Todo depende del desplazamiento (sin animación propia).
 */
import { useEffect, useRef, useState } from "react";
import { UMBRAL } from "@/content/bacon";
import { alCambiarHuella, huella } from "./huella";
import { useProgreso } from "./progreso";

/**
 * Cuándo aparece cada línea (progreso 0–1 del umbral): [c, h]. Entra en [c − R, c], se queda h y sale en [c + h, c + h + R].
 * Las tres primeras son el ritmo original; la pregunta se queda un poco más y la última queda hasta el final de la sección,
 * para que el puente hacia la Instalación II se pueda leer sin añadir desplazamiento.
 */
const TIEMPOS: [number, number][] = [[0.11, 0.02], [0.25, 0.02], [0.39, 0.02], [0.56, 0.09], [0.8, 9]];

export function Umbral() {
  const ref = useRef<HTMLElement>(null);
  const forma = useRef<HTMLCanvasElement>(null);
  const marca = useRef<HTMLCanvasElement>(null);
  const [conImagen, setConImagen] = useState(false);
  useProgreso(ref, 0.5);

  useEffect(() => {
    const pintar = () => {
      const src = huella();
      if (!src) return;
      for (const c of [forma.current, marca.current]) {
        if (!c) continue;
        c.width = src.width;
        c.height = src.height;
        c.getContext("2d")?.drawImage(src, 0, 0);
      }
      setConImagen(true);
    };
    pintar();
    return alCambiarHuella(pintar);
  }, []);

  return (
    <section ref={ref} className="bc-paso-umbral" aria-label="Transición: el cuerpo se retira">
      <div className="bc-paso-umbral__fijo">
        <div className="bc-paso-umbral__sala" aria-hidden="true">
          <span className="bc-paso-umbral__arriba" />
          <span className="bc-paso-umbral__luz" />
          <span className="bc-paso-umbral__suelo" />
          <span className="bc-paso-umbral__huella" data-sin-imagen={conImagen ? undefined : ""} />
          <canvas ref={marca} className="bc-paso-umbral__marca" data-vacia={conImagen ? undefined : ""} />
          <canvas ref={forma} className="bc-paso-umbral__forma" data-vacia={conImagen ? undefined : ""} />
          <span className="bc-paso-umbral__cable" />
          <span className="bc-paso-umbral__hilos"><i /><i /><i /></span>
        </div>
        <div className="bc-paso-umbral__lineas">
          {UMBRAL.lineas.map((l, i) => <p key={l} data-largo={l.length > 40 ? "" : undefined} style={{ "--c": TIEMPOS[i][0], "--h": TIEMPOS[i][1] } as React.CSSProperties}>{l}</p>)}
        </div>
      </div>
    </section>
  );
}
