import type { Metadata } from "next";
import Link from "next/link";
import { ConceptHeader, SiteFooter } from "@/components/concepts/ConceptChrome";
import { CintaObras } from "@/components/museo/CintaObras";
import { ImagenObra, esPintura, proporcion } from "@/components/museo/ImagenObra";
import { CONCEPTOS } from "@/content/conceptos";
import { bricolage } from "@/lib/fonts/bricolage";
import { cormorant } from "@/lib/fonts/cormorant";
import { gloock } from "@/lib/fonts/gloock";
import { instrument } from "@/lib/fonts/instrument";
import { plexMono } from "@/lib/fonts/plexmono";
import { shoulders } from "@/lib/fonts/shoulders";
import "./catalogo.css";

export const metadata: Metadata = {
  title: "Diez obras. Diez universos — MANIFESTO",
  description:
    "Medusa, La noche estrellada, Los elefantes, Untitled, Glenn, La ascensión al Empíreo, El descendimiento de la cruz, La loca Meg, Los siete pecados capitales y Cristo de San Juan de la Cruz: diez experiencias interactivas para explorar el arte en lugar de contemplarlo.",
  alternates: { canonical: "/conceptos" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Diez obras. Diez universos.",
    description: "El arte no se contempla solamente. Se explora.",
  },
};

/** Obras de autores con derechos vigentes: la imagen se muestra sin licencia de reproducción (aviso legal). */
const SIN_LICENCIA = new Set(["basquiat-untitled", "glenn", "cristo-de-san-juan-de-la-cruz"]);

export default function ConceptosPage() {
  return (
    <div className={`mf-theme theme-selector ${cormorant.variable} ${gloock.variable} ${instrument.variable} ${shoulders.variable} ${bricolage.variable} ${plexMono.variable}`}>
      <ConceptHeader marca />
      <main>
        <section className="cat-intro" aria-labelledby="cat-title">
          <p className="cat-intro__k">La exposición · {String(CONCEPTOS.length).padStart(2, "0")} obras</p>
          <h1 id="cat-title" className="cat-title">
            <span>Diez obras.</span>
            <span>Diez universos.</span>
          </h1>
          <p className="cat-intro__sub">
            Cada pintura se recorre con un gesto distinto: inclinar, observar, descifrar, examinar, ampliar, subir, leer,
            recorrer, mirar, entrar. Elige por dónde empezar.
          </p>
        </section>

        <CintaObras items={CONCEPTOS.map((c) => ({ slug: c.slug, numero: c.numero, titulo: c.corto, acento: c.acento }))} />

        <ol className="cat-sala" aria-label="Las diez obras">
          {CONCEPTOS.map((c, i) => {
            const r = proporcion(c.slug);
            const forma = r < 0.8 ? "alta" : r > 1.2 ? "ancha" : "media";
            return (
              <li key={c.slug} id={`obra-${c.slug}`} className="cat-placa" data-obra={c.slug} data-forma={forma} data-lado={i % 2 ? "d" : "i"} style={{ "--ta": c.acento, "--r": r } as React.CSSProperties}>
                <div className="cat-lamina">
                  <ImagenObra slug={c.slug} uid={`cat-${c.slug}`} sizes="(min-width: 64rem) 50vw, 100vw" prioridad={i === 0} className="cat-img" />
                </div>
                <div className="cat-ficha">
                  <p className="cat-num" aria-hidden="true">{c.numero}</p>
                  <p className="cat-idea">
                    <span className="sr-only">Obra {c.numero} de {CONCEPTOS.length}. </span>
                    {c.idea}
                  </p>
                  <h2 className="cat-titulo">
                    <Link href={`/conceptos/${c.slug}`} prefetch={false} className="cat-enlace">
                      {c.titulo}
                      <span className="sr-only">: entrar en la obra</span>
                    </Link>
                  </h2>
                  <p className="cat-autor">{c.autor}, {c.anio}</p>
                  <p className="cat-pregunta">{c.pregunta}</p>
                  <p className="cat-desc">{c.descripcion}</p>
                  <p className="cat-gesto">
                    <b>{c.gesto}</b>
                    <span>{c.interaccion}</span>
                  </p>
                  {!esPintura(c.slug) ? (
                    <p className="cat-nota">Imagen: composición gráfica de MANIFESTO, no la pintura.</p>
                  ) : SIN_LICENCIA.has(c.slug) ? (
                    <p className="cat-nota">Reproducción sin licencia de reproducción; ver el aviso legal.</p>
                  ) : null}
                  <span className="cat-entrar" aria-hidden="true">
                    Entrar
                    <svg width="18" height="10" viewBox="0 0 18 10" fill="none"><path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" /></svg>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
