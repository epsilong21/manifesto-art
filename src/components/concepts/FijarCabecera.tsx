"use client";

import { useEffect } from "react";

/**
 * Cabecera superpuesta de la portada (como la de la tienda): transparente sobre el hero y, al bajar, blanca y fija
 * arriba. Sin JavaScript se queda transparente sobre el hero, que es oscuro.
 */
export function FijarCabecera() {
  useEffect(() => {
    const cabecera = document.querySelector<HTMLElement>(".mf-header--superpuesta");
    if (!cabecera) return;
    const umbral = document.querySelector<HTMLElement>(".mf-aviso")?.offsetHeight ?? 0;
    let pendiente = false;
    const actualizar = () => {
      pendiente = false;
      cabecera.classList.toggle("is-fijo", window.scrollY > umbral);
    };
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(actualizar);
    };
    actualizar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);
  return null;
}
