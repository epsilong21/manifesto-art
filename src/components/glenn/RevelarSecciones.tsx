"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * Transición de entrada de las secciones de Glenn: el encabezado y el primer bloque
 * suben y aparecen una sola vez al llegar a la vista. Solo sin movimiento reducido;
 * el contenido está en el HTML y es legible sin JS. No pinta nada propio.
 */
export function RevelarSecciones() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      ScrollTrigger.batch(".gl-seccion__cab, .gl-hito, .gl-expediente__cols", {
        start: "top 88%",
        once: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", overwrite: true }),
      });
    });
    return () => mm.revert();
  });
  return null;
}
