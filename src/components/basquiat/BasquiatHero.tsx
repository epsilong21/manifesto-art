import type { CSSProperties } from "react";
import Image from "next/image";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { BASQUIAT, CARTELA_BASQUIAT, DERECHOS_BASQUIAT, HERO_BASQUIAT, LIENZO_BASQUIAT, OBRA_BASQUIAT } from "@/content/basquiat";
import { RevelacionObra } from "./RevelacionObra";
import { VerSoloLaObra } from "./VerSoloLaObra";

/**
 * Ancho de la pintura según el layout de basquiat.css: media pantalla en escritorio;
 * en móvil, todo el ancho salvo en horizontal, donde la limita la altura.
 * Sin min() ni cálculos: la precarga que genera Next y la <img> deben elegir la misma
 * variante en todos los navegadores (un sizes que el escáner de precarga evalúe distinto
 * deja una variante precargada sin usar).
 */
const SIZES = "(min-width: 64rem) 50vw, (orientation: landscape) 70vh, 100vw";

/**
 * Hero de «Dentro de la cabeza»: la pintura como lámina, con el título y la
 * pregunta a un lado. La gráfica de lámina anatómica (rótulo, cotas del lienzo)
 * queda fuera de la imagen, que nunca se tapa ni se altera.
 *
 * Sin reproducción autorizada (`conImagen` falso), la lámina queda vacía con la
 * proporción real del lienzo y una cartela que explica por qué: no hay pintura
 * sustitutiva ni nada que la imite.
 */
export function BasquiatHero({ conImagen }: { conImagen: boolean }) {
  const { imagen, alt, credito } = OBRA_BASQUIAT;
  const proporcion = conImagen ? imagen.width / imagen.height : LIENZO_BASQUIAT.w / LIENZO_BASQUIAT.h;
  const [l1, l2, l3] = HERO_BASQUIAT.titulo;

  return (
    <section className="bq-hero" aria-labelledby="bq-t">
      <div className="bq-hero__cabeza">
        <p className="bq-kicker">
          <span className="bq-kicker__concepto">{HERO_BASQUIAT.concepto}</span>
          <span>
            {BASQUIAT.autor}, {BASQUIAT.fecha}
          </span>
        </p>
        <h1 id="bq-t" className="bq-t">
          <span className="bq-t__l1">{l1}</span> <span className="bq-t__l2">{l2}</span>{" "}
          <span className="bq-t__l3">{l3}</span>
        </h1>
        <p className="bq-pregunta">{HERO_BASQUIAT.pregunta}</p>
      </div>

      <figure className="bq-lamina" style={{ "--bq-ratio": proporcion } as CSSProperties}>
        <figcaption className="bq-lamina__rotulo">
          <span>Lám. I</span>
          <span>
            <cite>{BASQUIAT.titulo}</cite>, {BASQUIAT.fecha}
          </span>
        </figcaption>
        <div className="bq-lamina__obra" style={{ aspectRatio: proporcion }}>
          {conImagen ? (
            <Image
              src={imagen.src}
              width={imagen.width}
              height={imagen.height}
              alt={alt}
              sizes={SIZES}
              quality={80}
              loading="eager"
              fetchPriority="high"
            />
          ) : null}
          {conImagen ? (
            <RevelacionObra src={imagen.src} width={imagen.width} height={imagen.height} sizes={SIZES} />
          ) : (
            <div className="bq-pendiente">
              <p className="bq-pendiente__t">Reproducción pendiente de autorización</p>
              <p>
                {BASQUIAT.titulo}, de {BASQUIAT.autor}, está protegida por derechos de autor. La pintura se
                mostrará aquí cuando su reproducción esté autorizada. Este marco vacío tiene la proporción
                real del lienzo.
              </p>
              <a href={BASQUIAT.ficha} target="_blank" rel="noopener noreferrer" className="bq-pendiente__enlace">
                Ver la obra en la ficha de The Broad
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </div>
          )}
        </div>
        {/* Cotas del lienzo, como en una lámina: el dato está también en la cartela */}
        <span className="bq-cota bq-cota--alto" aria-hidden="true">
          <span>{BASQUIAT.alto}</span>
        </span>
        <span className="bq-cota bq-cota--ancho" aria-hidden="true">
          <span>{BASQUIAT.ancho}</span>
        </span>
        <p className="bq-lamina__credito">{conImagen ? DERECHOS_BASQUIAT.credito : `Obra: ${DERECHOS_BASQUIAT.credito}`}</p>
      </figure>

      <div className="bq-hero__pie">
        {conImagen ? (
          <>
            <VerSoloLaObra
              src={imagen.src}
              width={imagen.width}
              height={imagen.height}
              alt={alt}
              sizes={SIZES}
              titulo={`${BASQUIAT.autor}, ${BASQUIAT.titulo}, ${BASQUIAT.fecha}`}
              credito={DERECHOS_BASQUIAT.credito}
            />
            {/* Sin JavaScript no hay modo contemplación: la obra ya está a la vista sin nada encima */}
            <noscript>
              <style>{".bq-ver{display:none}"}</style>
            </noscript>
          </>
        ) : null}

        <div className="bq-cartela">
          <p className="bq-cartela__ficha">
            {BASQUIAT.tecnica}. {BASQUIAT.medidas}. {BASQUIAT.ubicacion}.
          </p>
          <ul className="bq-cartela__datos">
            {CARTELA_BASQUIAT.map((d) => (
              <li key={d.id}>
                <p>{d.texto}</p>
                <p className="bq-cartela__meta">
                  <KindTag tipo={d.tipo} /> <span>Fuente: {d.fuente}</span>
                </p>
              </li>
            ))}
          </ul>
          {conImagen && credito.pie ? <p className="bq-cartela__aviso">{credito.pie}</p> : null}
        </div>
      </div>
    </section>
  );
}
