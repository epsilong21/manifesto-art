"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NOCHE } from "@/content/noche";
import { SkyField } from "./SkyField";

export function NocheHero() {
  const ref = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  // Contemplación: solo la reproducción completa, sin capas ni texto editorial
  const [contemplar, setContemplar] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!contemplar) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Solo con el foco en el hero o sin foco: el Escape que cierra un detalle
      // del explorador no debe sacar también de la contemplación
      const foco = document.activeElement;
      if (foco && foco !== document.body && !ref.current?.contains(foco)) return;
      setContemplar(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [contemplar]);

  return (
    <section ref={ref} className={`nc-hero ${contemplar ? "is-contemplating" : ""}`} aria-labelledby="nc-title">
      <div className="nc-hero__art">
        <Image
          src={NOCHE.imagen.src}
          alt={NOCHE.imagen.alt}
          fill
          sizes="100vw"
          quality={75}
          // Sin prioridad alta: la obra aparece con un fundido de ~3 s y no debe
          // competir con el CSS que pinta el texto (el LCP real de la página).
          loading="eager"
        />
      </div>
      <SkyField targetRef={ref} paused={paused || reduced} hidden={contemplar} />
      <div className="nc-hero__veil" aria-hidden="true" />

      <div className="nc-hero__copy">
        <h1 id="nc-title" className="nc-title">
          El cielo <em>que respira</em>
        </h1>
        <p className="nc-lede">
          «El cielo nunca estuvo quieto». Desliza el dedo o mueve el cursor: las corrientes te siguen.
          La pintura, debajo, no cambia.
        </p>
        <div className="nc-controls" role="group" aria-label="Efectos del cielo">
          {reduced ? (
            <p className="nc-note">Animación desactivada por tu preferencia de movimiento reducido.</p>
          ) : (
            <button type="button" className="mf-btn" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
              {paused ? "Reanudar el cielo" : "Pausar el cielo"}
            </button>
          )}
          <button type="button" className="mf-btn nc-contemplar" onClick={() => setContemplar((c) => !c)}>
            {contemplar ? "Volver a la experiencia" : "Ver solo la obra"}
          </button>
          <a href="#observar" className="mf-btn mf-btn--solid">
            Descifrar el cuadro
          </a>
        </div>
      </div>
    </section>
  );
}
