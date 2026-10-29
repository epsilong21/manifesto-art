"use client";

import { useEffect } from "react";

/**
 * Fundido breve (solo opacidad) en los textos que cambian de estado en las obras 06–10.
 * Observa las regiones aria-live de la página y reinicia una animación CSS: no remonta nada, así que
 * ni el foco ni el anuncio de lectores de pantalla cambian. No hace nada con movimiento reducido.
 */
export function FundidoEstados() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const regiones = document.querySelectorAll<HTMLElement>(".mu-sala [aria-live]");
    const pendientes = new WeakSet<HTMLElement>();
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        const r = (m.target instanceof HTMLElement ? m.target : m.target.parentElement)?.closest<HTMLElement>(".mu-sala [aria-live]");
        if (!r || pendientes.has(r)) continue;
        pendientes.add(r);
        requestAnimationFrame(() => {
          pendientes.delete(r);
          r.classList.remove("mu-fundido");
          void r.offsetWidth;
          r.classList.add("mu-fundido");
        });
      }
    });
    regiones.forEach((r) => obs.observe(r, { childList: true, subtree: true, characterData: true }));
    return () => obs.disconnect();
  }, []);
  return null;
}
