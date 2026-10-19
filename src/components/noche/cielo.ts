"use client";

import { useSyncExternalStore } from "react";

/**
 * «Pausar el cielo» es una sola decisión para toda la página: el hero y el
 * explorador comparten el mismo estado.
 */
let pausado = false;
const oyentes = new Set<() => void>();

const suscribir = (fn: () => void) => {
  oyentes.add(fn);
  return () => {
    oyentes.delete(fn);
  };
};

export function alternarCielo() {
  pausado = !pausado;
  oyentes.forEach((fn) => fn());
}

export function useCieloPausado() {
  return useSyncExternalStore(
    suscribir,
    () => pausado,
    () => false,
  );
}

/** Preferencia de movimiento reducido, en vivo. */
export function useMovimientoReducido() {
  return useSyncExternalStore(
    (fn) => {
      const mq = matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", fn);
      return () => mq.removeEventListener("change", fn);
    },
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
