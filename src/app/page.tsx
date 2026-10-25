import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConceptHeader, SiteFooter } from "@/components/concepts/ConceptChrome";
import { BasquiatGrafico } from "@/components/concepts/BasquiatGrafico";
import { ElefantesGrafico } from "@/components/concepts/ElefantesGrafico";
import { GlennGrafico } from "@/components/concepts/GlennGrafico";
import { CONCEPTOS } from "@/content/conceptos";
import { bricolage } from "@/lib/fonts/bricolage";
import { plexMono } from "@/lib/fonts/plexmono";
import ConceptosPage, { metadata as metadataSelector } from "./conceptos/page";
import "./conceptos/conceptos.css";
import "./portada.css";

/**
 * Publicación simplificada (MANIFESTO_ENTRADA=selector, p. ej. en GitHub Pages):
 * la entrada es directamente el selector «Cinco obras. Cinco universos.».
 */
const entradaSelector = process.env.MANIFESTO_ENTRADA === "selector";

export const metadata: Metadata = entradaSelector ? { ...metadataSelector, alternates: { canonical: "/" } } : {};


/** Fragmento de cada obra que asoma por su mirilla. */
const FRAGMENTO: Record<string, { src: string; width: number; height: number } | null> = {
  medusa: { src: "/obras/medusa.jpg", width: 2400, height: 2350 },
  "noche-estrellada": { src: "/obras/noche-estrellada.jpg", width: 3000, height: 2376 },
  // Dalí y Basquiat: obras protegidas. La mirilla muestra la composición propia de MANIFESTO.
  "los-elefantes": null,
  "basquiat-untitled": null,
  glenn: null,
};

const PASOS = [
  {
    titulo: "Elige una obra",
    texto: "Cada obra es un universo con su propia luz, su tipografía y su ritmo. Puedes empezar por cualquiera.",
  },
  {
    titulo: "Usa el gesto que propone",
    texto: "Inclina el escudo de Medusa, observa cómo se mueve el cielo de Van Gogh, descifra los cinco misterios de Dalí, examina la cabeza de Basquiat capa a capa o amplía la máscara de Glenn.",
  },
  {
    titulo: "Separa lo que se sabe de lo que se interpreta",
    texto: "Un cuadrado marca lo documentado u observado; un círculo, la interpretación. Así se aprende a leer una obra, no solo a mirarla.",
  },
];

export default function Portada() {
  if (entradaSelector) return <ConceptosPage />;
  return (
    <div className={`mf-theme theme-selector hm ${bricolage.variable} ${plexMono.variable}`}>
      <ConceptHeader />
      <main>
        <section className="hm-hero" aria-labelledby="hm-t">
          <div className="hm-copy">
            <h1 id="hm-t" className="hm-t">
              <span className="hm-t__a">El arte no se contempla</span>
              <span className="hm-t__b">solamente.</span>
              <span className="hm-t__c">Se explora.</span>
            </h1>
            <p className="hm-intro">
              MANIFESTO es una plataforma cultural para descubrir obras de arte desde dentro: sus símbolos,
              sus historias y lo que no se ve a primera vista. Cada obra se recorre con un gesto distinto.
            </p>
            <div className="hm-acciones">
              <Link href="/conceptos" className="mf-btn mf-btn--solid hm-cta">
                Explorar las obras
                <svg aria-hidden="true" width="18" height="10" viewBox="0 0 18 10" fill="none">
                  <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </Link>
              <p className="hm-cuenta">Caravaggio, Van Gogh, Dalí y dos veces Basquiat: cinco obras, cinco maneras de entrar.</p>
            </div>
          </div>

          <ul className="hm-mirillas" aria-label="Entrar directamente en una obra">
            {CONCEPTOS.map((c, i) => {
              const img = FRAGMENTO[c.slug];
              return (
                <li key={c.slug} className="hm-mirilla" data-obra={c.slug} style={{ "--i": i } as React.CSSProperties}>
                  <Link href={`/conceptos/${c.slug}`} className="hm-mirilla__link">
                    <span className="hm-mirilla__ventana" aria-hidden="true">
                      {img ? (
                        <Image
                          src={img.src}
                          alt=""
                          width={img.width}
                          height={img.height}
                          // El fragmento se amplía ×1,5–2,1 dentro de la mirilla
                          sizes="(min-width: 64rem) 28vw, 60vw"
                          quality={70}
                        />
                      ) : c.slug === "basquiat-untitled" ? (
                        <BasquiatGrafico className="hm-grafico" />
                      ) : c.slug === "glenn" ? (
                        <GlennGrafico className="hm-grafico" />
                      ) : (
                        <ElefantesGrafico id="hm-eg" className="hm-grafico" />
                      )}
                    </span>
                    <span className="hm-mirilla__pie">
                      <span className="hm-mirilla__n">{c.numero}</span>
                      <span className="hm-mirilla__t">{c.titulo}</span>
                      <span className="hm-mirilla__a">{c.autor}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="hm-nota">
            Fragmentos de Medusa y La noche estrellada. Las otras tres mirillas son composiciones de
            MANIFESTO sobre Los elefantes, Untitled y Glenn, no las pinturas de Dalí y Basquiat.
          </p>
        </section>

        <section className="hm-metodo" aria-labelledby="hm-metodo-t">
          <h2 id="hm-metodo-t" className="hm-h2">
            Cómo se recorre una obra
          </h2>
          <ol className="hm-pasos">
            {PASOS.map((p) => (
              <li key={p.titulo}>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
          <Link href="/conceptos" className="hm-volver">
            Ver las cinco obras
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
