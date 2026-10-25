import type { CSSProperties } from "react";
import Image from "next/image";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { CARTELA_GLENN, DERECHOS_GLENN, GLENN, HERO_GLENN, LIENZO_GLENN, OBRA_GLENN } from "@/content/glenn";
import { Contemplar } from "./Contemplar";
import { EscanerEntrada } from "./EscanerEntrada";
import { EsquemaGlenn } from "./EsquemaGlenn";

/**
 * La lámina ocupa algo más de la mitad del ancho en escritorio y todo el ancho en móvil.
 * Sin min() ni cálculos, para que la precarga y la <img> elijan la misma variante.
 */
export const SIZES_GLENN = "(min-width: 64rem) 60vw, 100vw";

/**
 * Hero de «La máscara y la copia»: título de cartel a un lado y la obra apaisada como
 * una hoja sobre el cristal de una fotocopiadora (rótulo y cotas fuera de la imagen).
 * Sin reproducción, la lámina muestra el esquema propio de MANIFESTO y lo dice.
 */
export function GlennHero({ conImagen }: { conImagen: boolean }) {
  const { imagen, alt, credito } = OBRA_GLENN;
  const proporcion = conImagen ? imagen.width / imagen.height : LIENZO_GLENN.w / LIENZO_GLENN.h;
  const [l1, l2, l3] = HERO_GLENN.titulo;

  return (
    <section className="gl-hero" aria-labelledby="gl-t">
      <div className="gl-hero__cabeza">
        <p className="gl-kicker">
          <span className="gl-kicker__concepto">{HERO_GLENN.concepto}</span>
          <span>
            {GLENN.autor}, {GLENN.fecha}
          </span>
        </p>
        <h1 id="gl-t" className="gl-t">
          <span className="gl-t__l1">{l1}</span> <span className="gl-t__l2">{l2}</span> <span className="gl-t__l3">{l3}</span>
        </h1>
        <p className="gl-pregunta">{HERO_GLENN.pregunta}</p>
      </div>

      <figure className="gl-lamina" style={{ "--gl-ratio": proporcion } as CSSProperties}>
        <figcaption className="gl-lamina__rotulo">
          <span>Hoja 05</span>
          <span>
            <cite>{GLENN.titulo}</cite>, {GLENN.fecha}
          </span>
        </figcaption>
        <div className="gl-lamina__marco">
        <div className="gl-lamina__obra" style={{ aspectRatio: proporcion }}>
          {conImagen ? (
            <Image src={imagen.src} width={imagen.width} height={imagen.height} alt={alt} sizes={SIZES_GLENN} quality={80} loading="eager" fetchPriority="high" />
          ) : (
            <EsquemaGlenn />
          )}
          <EscanerEntrada medida={`${GLENN.ancho} × ${GLENN.alto}`} />
        </div>
        <span className="gl-cota gl-cota--ancho" aria-hidden="true">
          <span>{GLENN.ancho}</span>
        </span>
        <span className="gl-cota gl-cota--alto" aria-hidden="true">
          <span>{GLENN.alto}</span>
        </span>
        </div>
        <p className="gl-lamina__credito">
          {conImagen ? DERECHOS_GLENN.credito : "Esquema de MANIFESTO. La pintura está protegida y su reproducción está pendiente de autorización."}
        </p>
      </figure>

      <div className="gl-hero__pie">
        {conImagen ? (
          <>
            <Contemplar
              src={imagen.src}
              width={imagen.width}
              height={imagen.height}
              alt={alt}
              sizes="100vw"
              titulo={`${GLENN.autor}, ${GLENN.titulo}, ${GLENN.fecha}`}
              credito={DERECHOS_GLENN.credito}
            />
            <noscript>
              <style>{".gl-contemplar-btn{display:none}"}</style>
            </noscript>
          </>
        ) : null}
        <a href="#gl-mesa" className="gl-btn gl-btn--linea">
          Mirar de cerca
          <svg aria-hidden="true" width="12" height="14" viewBox="0 0 12 14" fill="none">
            <path d="M6 0v12M1 7.5 6 12.5l5-5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </a>

        <div className="gl-cartela">
          <p className="gl-cartela__ficha">
            {GLENN.tecnica}. {GLENN.medidas}. {GLENN.ubicacion}.
          </p>
          <ul className="gl-cartela__datos">
            {CARTELA_GLENN.map((d) => (
              <li key={d.id}>
                <p>{d.texto}</p>
                <p className="gl-meta">
                  <KindTag tipo={d.tipo} /> <span>Fuente: {d.fuente}</span>
                </p>
              </li>
            ))}
          </ul>
          {conImagen && credito.pie ? <p className="gl-cartela__aviso">{credito.pie}</p> : null}
        </div>
      </div>
    </section>
  );
}
