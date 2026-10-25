"use client";

import Image from "next/image";
import { useRef } from "react";

type Props = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** El mismo `sizes` que la lámina: el navegador reutiliza la variante ya descargada. */
  sizes: string;
  titulo: string;
  credito: string;
};

/**
 * «Ver solo la obra»: la pintura sola, a pantalla completa, sin nada encima.
 * Es un <dialog> modal nativo: atrapa el foco, Escape lo cierra y el resto de la
 * página queda inerte. Se sale con «Salir» o con Escape (pulsar fuera no cierra:
 * en móvil sería fácil salir sin querer). La barra y el crédito van fuera de la imagen.
 * Al cerrar, el foco vuelve al botón. Sin JavaScript, el botón no se muestra
 * (ver BasquiatHero) y la obra sigue a la vista en la lámina, sin superposiciones.
 */
export function VerSoloLaObra({ src, width, height, alt, sizes, titulo, credito }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const cerrar = () => dialogo.current?.close();

  return (
    <>
      <button ref={boton} type="button" className="bq-ver" aria-haspopup="dialog" onClick={() => dialogo.current?.showModal()}>
        <span className="bq-ver__marco" aria-hidden="true" />
        Ver solo la obra
      </button>
      <dialog
        ref={dialogo}
        className="bq-contemplar"
        aria-label={`${titulo}: solo la obra`}
        onClose={() => boton.current?.focus()}
      >
        <div className="bq-contemplar__barra">
          <p className="bq-contemplar__t">{titulo}</p>
          <button type="button" className="bq-contemplar__salir" onClick={cerrar} autoFocus>
            Salir
            <span className="bq-contemplar__tecla" aria-hidden="true">
              Esc
            </span>
          </button>
        </div>
        <div className="bq-contemplar__obra">
          <Image src={src} width={width} height={height} alt={alt} sizes={sizes} quality={80} />
        </div>
        <p className="bq-contemplar__credito">{credito}</p>
      </dialog>
    </>
  );
}
