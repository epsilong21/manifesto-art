"use client";

/**
 * Epílogo · «La forma que permanece». La sala de la Instalación II, ya sin membranas: tres cables vacíos y la lámpara en el
 * suelo. La figura vuelve al muro como sombra nítida, se deshace, y en su lugar queda su negativo: una marca pálida, como
 * quemada en el yeso. Sin interacción: solo el desplazamiento.
 */
import { useMemo, useRef } from "react";
import { EPILOGO } from "@/content/bacon";
import { figuraSvg } from "./negativo/formas";
import { useProgreso } from "./progreso";

export function Epilogo() {
  const ref = useRef<HTMLElement>(null);
  const trazos = useMemo(() => figuraSvg(), []);
  useProgreso(ref, 0.8);
  const capa = (clase: string, filtro: string) => (
    <g className={clase} filter={filtro}>
      {trazos.map((d, i) => <path key={i} d={d} fillRule="evenodd" />)}
    </g>
  );
  return (
    <section ref={ref} className="bc-epi" aria-labelledby="bc-epi-t">
      <div className="bc-epi__fijo">
        <span className="bc-epi__suelo" aria-hidden="true" />
        <span className="bc-epi__cables" aria-hidden="true"><i /><i /><i /></span>
        <svg className="bc-epi__muro" viewBox="-0.66 -0.14 1.32 1.3" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <filter id="bc-epi-nit" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.004" /></filter>
            <filter id="bc-epi-pen" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.022" /></filter>
            <filter id="bc-epi-res" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="0.045" /></filter>
          </defs>
          {capa("bc-epi__sombra", "url(#bc-epi-nit)")}
          {capa("bc-epi__sombra-difusa", "url(#bc-epi-pen)")}
          {capa("bc-epi__halo", "url(#bc-epi-res)")}
          {capa("bc-epi__negativo", "url(#bc-epi-nit)")}
        </svg>
        <div className="bc-epi__texto">
          <h2 id="bc-epi-t" className="bc-epi__h">{EPILOGO.titulo}</h2>
          <p>{EPILOGO.linea}</p>
          <a className="bc-bajar" href="#bc-titulo">↑ {EPILOGO.volver}</a>
        </div>
      </div>
    </section>
  );
}
