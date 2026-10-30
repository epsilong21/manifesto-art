import type { Metadata } from "next";
import Link from "next/link";
import { ConceptHeader, SiteFooter } from "@/components/concepts/ConceptChrome";
import { Escenario, type ObraEscena } from "@/components/museo/Escenario";
import { ImagenObra, esPintura } from "@/components/museo/ImagenObra";
import { CONCEPTOS } from "@/content/conceptos";
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
}));

const PASOS = [
  { titulo: "Elige una obra", texto: "Cada obra es un universo con su luz, su tipografía y su ritmo. Puedes empezar por cualquiera." },
  { titulo: "Usa el gesto que propone", texto: "Inclinar, observar, descifrar, examinar, ampliar, subir, leer, recorrer, mirar o entrar: cada pintura pide un gesto distinto." },
  { titulo: "Separa lo que se sabe de lo que se interpreta", texto: "Lo documentado y lo interpretado van siempre por separado. Así se aprende a leer una obra, no solo a mirarla." },
];

export default function Portada() {
  if (entradaSelector) return <ConceptosPage />;
  return (
    <div className={`mf-theme theme-selector hm ${bricolage.variable} ${plexMono.variable}`}>
      <ConceptHeader marca />
      <main>
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

        <section className="hm-indice" id="hm-indice" aria-labelledby="hm-indice-t">
          <h2 id="hm-indice-t" className="hm-h2">Índice de la exposición</h2>
          <p className="hm-indice__intro">MANIFESTO es una plataforma cultural para descubrir obras de arte desde dentro: sus símbolos, sus historias y lo que no se ve a primera vista.</p>
          <ol className="hm-lista">
            {CONCEPTOS.map((c) => (
              <li key={c.slug} style={{ "--ta": c.acento } as React.CSSProperties}>
                <Link href={`/conceptos/${c.slug}`} prefetch={false}>
                  <span className="hm-lista__n">{c.numero}</span>
                  <span className="hm-lista__t">{c.titulo}</span>
                  <span className="hm-lista__a">{c.autor}, {c.anio}</span>
                  <span className="hm-lista__g">{c.gesto}</span>
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/conceptos" className="hm-volver">Ver el catálogo completo</Link>
        </section>

        <section className="hm-metodo" aria-labelledby="hm-metodo-t">
          <h2 id="hm-metodo-t" className="hm-h2">Cómo se recorre una obra</h2>
          <ol className="hm-pasos">
            {PASOS.map((p) => (
              <li key={p.titulo}>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
