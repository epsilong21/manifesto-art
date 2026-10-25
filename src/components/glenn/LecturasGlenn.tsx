"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { LECTURAS_GLENN, type Lectura } from "@/content/glenn";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Tres lecturas de Glenn: retrato, máscara y archivo. Cada una con su tesis, sus
 * apoyos (cada uno con su etiqueta y fuente) y lo que no prueba. El visitante puede
 * quedarse con una; el veredicto se anuncia (aria-live) y recuerda que ninguna está
 * demostrada. Sin JavaScript se leen las tres seguidas: solo con la clase `js` del
 * documento se ocultan las inactivas (glenn.css), y sin JS no hay pestañas ni botón.
 */
export function LecturasGlenn() {
  const base = useId();
  const raiz = useRef<HTMLElement>(null);
  const [actual, setActual] = useState<Lectura["id"]>("retrato");
  const [voto, setVoto] = useState<Lectura["id"] | null>(null);

  // Transición breve al cambiar de lectura (sin movimiento reducido)
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(`[data-lectura="${actual}"] .gl-lectura__anim`, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" });
      });
      return () => mm.revert();
    },
    { scope: raiz, dependencies: [actual], revertOnUpdate: true },
  );

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = LECTURAS_GLENN.findIndex((l) => l.id === actual);
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + LECTURAS_GLENN.length) % LECTURAS_GLENN.length;
    setActual(LECTURAS_GLENN[j].id);
    document.getElementById(`${base}-tab-${LECTURAS_GLENN[j].id}`)?.focus();
  };

  const elegida = LECTURAS_GLENN.find((l) => l.id === voto);

  return (
    <section ref={raiz} className="gl-seccion gl-lecturas" aria-labelledby="gl-lec-t">
      <header className="gl-seccion__cab">
        <p className="gl-seccion__n">03</p>
        <h2 id="gl-lec-t" className="gl-h2">
          Tres lecturas
        </h2>
        <p className="gl-seccion__intro">
          ¿A quién mira esta cabeza? Tres maneras de leer Glenn. Las tres son interpretaciones: cada una se apoya en
          datos, y ninguna los agota.
        </p>
      </header>

      <div role="tablist" aria-label="Lecturas" className="gl-tabs gl-tabs--lecturas" onKeyDown={teclas}>
        {LECTURAS_GLENN.map((l, i) => (
          <button
            key={l.id}
            id={`${base}-tab-${l.id}`}
            type="button"
            role="tab"
            aria-selected={actual === l.id}
            aria-controls={`${base}-panel-${l.id}`}
            tabIndex={actual === l.id ? 0 : -1}
            onClick={() => setActual(l.id)}
          >
            <span className="gl-tabs__n" aria-hidden="true">
              {String.fromCharCode(65 + i)}
            </span>
            {l.nombre}
            {voto === l.id ? <span className="gl-tabs__voto"> · tu lectura</span> : null}
          </button>
        ))}
      </div>

      {LECTURAS_GLENN.map((l) => (
        <div
          key={l.id}
          id={`${base}-panel-${l.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${l.id}`}
          className="gl-lectura"
          data-lectura={l.id}
          data-activa={actual === l.id ? "" : undefined}
        >
          <p className="gl-lectura__tesis gl-lectura__anim">{l.tesis}</p>
          <div className="gl-lectura__cols">
            <div className="gl-lectura__anim">
              <h3 className="gl-h3">En qué se apoya</h3>
              <ul className="gl-apoyos">
                {l.apoyos.map((a) => (
                  <li key={a.texto}>
                    <p>{a.texto}</p>
                    <p className="gl-meta">
                      <KindTag tipo={a.tipo} /> <span>Fuente: {a.fuente}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="gl-lectura__anim gl-limite">
              <h3 className="gl-h3">Lo que no prueba</h3>
              <p>{l.limite}</p>
              <button type="button" className="gl-btn gl-btn--solido" aria-pressed={voto === l.id} onClick={() => setVoto(voto === l.id ? null : l.id)}>
                {voto === l.id ? "Es tu lectura · quitar" : "Esta me convence"}
              </button>
            </div>
          </div>
        </div>
      ))}

      <p className="gl-veredicto" aria-live="polite">
        {elegida
          ? `Te convence «${elegida.nombre}». Las otras dos siguen abiertas: ninguna está demostrada.`
          : "Todavía no has elegido ninguna lectura."}
      </p>
    </section>
  );
}
