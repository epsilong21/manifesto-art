import type { Metadata } from "next";
import Link from "next/link";
import { ConceptHeader, SiteFooter, WhatsAppFlotante } from "@/components/concepts/ConceptChrome";
import { Distribuidores } from "@/components/concepts/Distribuidores";
import { Escenario, type ObraEscena } from "@/components/museo/Escenario";
import { ImagenObra, esPintura } from "@/components/museo/ImagenObra";
import { CONCEPTOS } from "@/content/conceptos";
import { PRODUCTOS, imagenProducto } from "@/content/tienda";
import { bricolage } from "@/lib/fonts/bricolage";
import { plexMono } from "@/lib/fonts/plexmono";
import ConceptosPage, { metadata as metadataSelector } from "./conceptos/page";
import "./conceptos/conceptos.css";
import "./portada.css";

/**
 * MANIFESTO_ENTRADA=selector (opcional): la entrada es directamente el catálogo.
 * Por defecto, también en GitHub Pages, la entrada es esta portada.
 */
const entradaSelector = process.env.MANIFESTO_ENTRADA === "selector";

export const metadata: Metadata = entradaSelector ? { ...metadataSelector, alternates: { canonical: "/" } } : {};

// La barca de Dante (prototipo 001) ocupaba esta ruta: se conserva en
// src/prototipos/barca-de-dante/ (ver docs/prototipo-barca-de-dante.md).

// La miniatura del friso pide el mismo ancho que la lámina: el navegador reutiliza la misma descarga
const SIZES_ESCENA = "(min-width: 64rem) 44vw, 90vw";

const OBRAS: ObraEscena[] = CONCEPTOS.map((c) => ({
  slug: c.slug,
  numero: c.numero,
  titulo: c.titulo,
  autor: c.autor,
  anio: c.anio,
  acento: c.acento,
  gesto: c.gesto,
  pregunta: c.pregunta,
  pintura: esPintura(c.slug),
  prenda: PRODUCTOS[c.slug],
}));

const PASOS = [
  { titulo: "Elige una obra", texto: "Cada obra es un universo con su luz, su tipografía y su ritmo. Puedes empezar por cualquiera." },
  { titulo: "Usa el gesto que propone", texto: "Inclinar, observar, descifrar, examinar, ampliar, subir, leer, recorrer, mirar o entrar: cada pintura pide un gesto distinto." },
  { titulo: "Separa lo que se sabe de lo que se interpreta", texto: "Lo documentado y lo interpretado van siempre por separado. Así se aprende a leer una obra, no solo a mirarla." },
];

export default function Portada() {
  if (entradaSelector) return (<><ConceptosPage /><SiteFooter /></>);
  return (
    <div className={`mf-theme theme-selector hm ${bricolage.variable} ${plexMono.variable}`}>
      <ConceptHeader superpuesta />
      <WhatsAppFlotante />
      <main>
        <div className="hm-oscuro">
        <div className="hm-hero">
          <div className="hm-copy">
            <p className="hm-kicker">Experimental Art Journal · diez obras</p>
            <h1 id="hm-t" className="hm-t">
              <span className="hm-t__a">El arte no se contempla</span>
              <span className="hm-t__b">solamente.</span>
              <span className="hm-t__c">Se explora.</span>
            </h1>
            <p className="hm-intro">
              MANIFESTO es una plataforma cultural para descubrir obras de arte desde dentro: sus símbolos, sus historias
              y lo que no se ve a primera vista. Cada obra se recorre con un gesto distinto.
            </p>
            <div className="hm-acciones">
              <Link href="/conceptos" className="mf-btn mf-btn--solid hm-cta">
                Entrar en la exposición
                <svg aria-hidden="true" width="18" height="10" viewBox="0 0 18 10" fill="none">
                  <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </Link>
              <a href="#hm-indice" className="hm-enlace">Ver el índice</a>
            </div>
          </div>
          <Escenario
            obras={OBRAS}
            laminas={CONCEPTOS.map((c, k) => (
              <ImagenObra key={c.slug} slug={c.slug} uid="hm-l" prioridad={k === 0} ansiosa sizes={SIZES_ESCENA} />
            ))}
            tiras={CONCEPTOS.map((c) => (
              <ImagenObra key={c.slug} slug={c.slug} uid="hm-t" ansiosa sizes={SIZES_ESCENA} />
            ))}
          />
        </div>
        </div>

        <Distribuidores />

        <section className="hm-indice" id="hm-indice" aria-labelledby="hm-indice-t">
          <h2 id="hm-indice-t" className="hm-h2"><span>La exposición</span></h2>
          <ol className="hm-grid">
            {CONCEPTOS.map((c) => (
              <li key={c.slug} className="hm-tile">
                <Link href={`/conceptos/${c.slug}`} prefetch={false}>
                  <span className="hm-tile__img">
                    <ImagenObra slug={c.slug} uid="hm-g" sizes="(min-width: 48rem) 25vw, 50vw" />
                    {PRODUCTOS[c.slug] ? (
                      // Al pasar el cursor, la tarjeta muestra la prenda de la tienda (como el cambio de foto de producto)
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="hm-tile__prenda" src={imagenProducto(PRODUCTOS[c.slug].imagen, 640)} alt="" width={640} height={960} loading="lazy" decoding="async" />
                    ) : null}
                    <span className="hm-tile__n">{c.numero}</span>
                  </span>
                  <span className="hm-tile__t">{c.titulo}</span>
                  <span className="hm-tile__a">{c.autor}, {c.anio}</span>
                  <span className="hm-tile__g">{c.gesto}</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/conceptos" className="hm-volver">Ver el catálogo completo</Link>
        </section>

        <section className="hm-metodo" aria-labelledby="hm-metodo-t">
          <h2 id="hm-metodo-t" className="hm-h2"><span>Cómo se recorre una obra</span></h2>
          <ol className="hm-pasos">
            {PASOS.map((p) => (
              <li key={p.titulo}>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="hm-ig" aria-labelledby="hm-ig-t">
          <h2 id="hm-ig-t" className="hm-h2 hm-h2--ig"><span>Síguenos en Instagram</span></h2>
          <a className="hm-ig__enlace" href="https://www.instagram.com/manifesto_msto" target="_blank" rel="noopener noreferrer">
            @manifesto_msto
          </a>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
