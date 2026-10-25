"use client";

import Image from "next/image";
import { useRef } from "react";

type Props = {
  src: string;
  width: number;
  height: number;
  alt: string;
  sizes: string;
  titulo: string;
  credito: string;
};

/**
 * Modo contemplación: la pintura sola, a pantalla completa, sin anotaciones.
 * Mismo patrón que en Untitled: <dialog> modal nativo (atrapa el foco, Escape lo
 * cierra, el resto queda inerte) y el foco vuelve al botón al salir. Pulsar fuera no
 * cierra. Sin JavaScript el botón se oculta (ver GlennHero) y la obra sigue a la vista.
 */
export function Contemplar({ src, width, height, alt, sizes, titulo, credito }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button ref={boton} type="button" className="gl-btn gl-contemplar-btn" aria-haspopup="dialog" onClick={() => dialogo.current?.showModal()}>
        <span className="gl-contemplar-btn__marco" aria-hidden="true" />
        Contemplar la obra
      </button>
      <dialog ref={dialogo} className="gl-contemplar" aria-label={`${titulo}: solo la obra`} onClose={() => boton.current?.focus()}>
        <div className="gl-contemplar__barra">
          <p className="gl-contemplar__t">{titulo}</p>
          <button type="button" className="gl-btn gl-contemplar__salir" onClick={() => dialogo.current?.close()} autoFocus>
            Salir <span className="gl-tecla" aria-hidden="true">Esc</span>
          </button>
        </div>
        <div className="gl-contemplar__obra">
          <Image src={src} width={width} height={height} alt={alt} sizes={sizes} quality={80} />
        </div>
        <p className="gl-contemplar__credito">{credito}</p>
      </dialog>
    </>
  );
}
