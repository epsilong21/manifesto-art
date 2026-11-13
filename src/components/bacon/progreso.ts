"use client";

import { useEffect, type RefObject } from "react";

/**
 * Progreso de desplazamiento de una sección alta con un bloque fijo (sticky): 0 cuando la sección entra por arriba,
 * 1 cuando su final llega al pie de la pantalla. Se escribe en la variable CSS --p de la sección y solo se calcula
 * mientras la sección está cerca de la pantalla. Con movimiento reducido queda fijo en `fijo`.
 */
export function useProgreso(ref: RefObject<HTMLElement | null>, fijo = 0.5): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", String(fijo));
      return;
    }
    let raf = 0;
    let cerca = false;
    const calcular = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const recorrido = Math.max(1, r.height - innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / recorrido));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const pedir = () => { if (cerca && !raf) raf = requestAnimationFrame(calcular); };
    const io = new IntersectionObserver(([en]) => { cerca = en.isIntersecting; pedir(); }, { rootMargin: "20% 0px 20% 0px" });
    io.observe(el);
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    calcular();
    return () => {
      io.disconnect();
      removeEventListener("scroll", pedir);
      removeEventListener("resize", pedir);
      cancelAnimationFrame(raf);
    };
  }, [ref, fijo]);
}
