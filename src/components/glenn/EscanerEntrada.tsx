"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Entrada del hero: una hoja de papel tapa la lámina y la luz de una fotocopiadora
 * la recorre de izquierda a derecha, descubriendo la obra a su paso (≈1,8 s, una vez).
 *
 * - La lámina está debajo desde el primer pintado: el LCP no espera a la animación.
 * - La hoja solo existe con JS y sin movimiento reducido (glenn.css, clase `js` del
 *   documento). Si GSAP no llegara a ejecutarse, una animación CSS la retira a los 4 s.
 * - No captura el puntero ni bloquea el scroll.
 */
export function EscanerEntrada({ medida }: { medida: string }) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // GSAP toma el relevo de la retirada de seguridad en CSS
        if (raiz.current) raiz.current.style.animation = "none";
        const tl = gsap.timeline({ defaults: { ease: "power2.inOut" }, onComplete: () => raiz.current?.setAttribute("data-fin", "") });
        tl.fromTo(".gl-escaner__luz", { left: "0%" }, { left: "100%", duration: 1.5 }, 0.2)
          .fromTo(".gl-escaner__papel", { clipPath: "inset(0 0 0 0%)" }, { clipPath: "inset(0 0 0 100%)", duration: 1.5 }, 0.2)
          .fromTo(".gl-escaner__sello", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0)
          .to(".gl-escaner__sello", { autoAlpha: 0, duration: 0.4 }, 1.5)
          .to(".gl-escaner__luz", { autoAlpha: 0, duration: 0.3 }, 1.65);
      });
      return () => mm.revert();
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className="gl-escaner" aria-hidden="true">
      <div className="gl-escaner__papel" />
      <div className="gl-escaner__luz" />
      <p className="gl-escaner__sello">Copiando · {medida}</p>
    </div>
  );
}
