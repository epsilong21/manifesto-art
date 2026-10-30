"use client";

import { useRef } from "react";
import { DALI_IMG as I } from "@/content/cristo-dali";
import { rutaPublica } from "@/lib/rutaPublica";


/**
 * Modo de contemplación: la pintura a toda la altura, sobre negro, sin más control que cerrar.
 * Usa <dialog> nativo: Esc cierra, el foco queda dentro y vuelve al botón al cerrar.
 */
export function Contemplar() {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="mf-btn" onClick={() => ref.current?.showModal()}>Contemplar</button>
      <dialog
        ref={ref}
        className="vd-contemp"
        aria-label="Contemplación de la pintura"
        onClick={(e) => {
          if (e.target === e.currentTarget) ref.current?.close();
        }}
      >
        <button type="button" className="vd-contemp__cerrar" onClick={() => ref.current?.close()} aria-label="Cerrar la contemplación" autoFocus>
          ×
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${rutaPublica(I.base)}-${I.anchos[1]}.webp`} width={I.width} height={I.height} alt={I.alt} decoding="async" onClick={() => ref.current?.close()} />
      </dialog>
    </>
  );
}
