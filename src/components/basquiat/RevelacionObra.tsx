import type { CSSProperties } from "react";
import Image from "next/image";
import { PIEZAS_REVELACION } from "@/content/basquiat-inspector";

type Props = { src: string; width: number; height: number; sizes: string };

/**
 * Revelación de entrada del hero: seis fragmentos de la reproducción se asientan
 * sobre un fondo carbón hasta formar la obra, y la capa desaparece (≈1,4 s, una vez).
 *
 * - La imagen principal se pinta debajo desde el primer momento: el LCP no espera
 *   a la animación. Cada fragmento es un encuadre de la misma imagen (mismo `src`,
 *   `sizes` y calidad: el navegador la descarga una sola vez), nunca una alteración.
 * - Solo CSS: sin JavaScript se ve igual; con movimiento reducido no existe
 *   (ver basquiat-p5.css). No captura el puntero ni retrasa la navegación.
 */
export function RevelacionObra({ src, width, height, sizes }: Props) {
  return (
    <div className="bq-revela" aria-hidden="true">
      <div className="bq-revela__fondo" />
      {PIEZAS_REVELACION.map(({ zona: [x, y, w, h], dx, dy, giro }, i) => (
        <div
          key={i}
          className="bq-revela__pieza"
          style={
            {
              left: `${x}%`,
              top: `${y}%`,
              width: `${w}%`,
              height: `${h}%`,
              "--dx": `${dx}%`,
              "--dy": `${dy}%`,
              "--giro": `${giro}deg`,
              "--d": `${0.08 + i * 0.07}s`,
            } as CSSProperties
          }
        >
          <Image
            src={src}
            width={width}
            height={height}
            alt=""
            sizes={sizes}
            quality={80}
            loading="eager"
            style={{ width: `${(100 / w) * 100}%`, left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
