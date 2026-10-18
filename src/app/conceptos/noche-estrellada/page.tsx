import type { Metadata } from "next";
import { ConceptFooter, ConceptHeader, Etiqueta } from "@/components/concepts/ConceptChrome";
import { NocheExplorer } from "@/components/noche/NocheExplorer";
import { NocheHero } from "@/components/noche/NocheHero";
import { CONTEXTO_NOCHE, NOCHE } from "@/content/noche";
import { instrument } from "@/lib/fonts/instrument";
import "./noche.css";

export const metadata: Metadata = {
  title: "La noche estrellada de Van Gogh: el cielo que respira — MANIFESTO",
  description:
    "Mueve el cielo de La noche estrellada y separa lo que Van Gogh observó desde su ventana en Saint-Rémy de lo que imaginó. Junio de 1889, MoMA.",
  alternates: { canonical: "/conceptos/noche-estrellada" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "El cielo nunca estuvo quieto.",
    description: "La noche estrellada, de Van Gogh: observación e imaginación.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VisualArtwork",
  name: "La noche estrellada",
  alternateName: "The Starry Night",
  creator: { "@type": "Person", name: "Vincent van Gogh" },
  dateCreated: "1889-06",
  artMedium: "Óleo sobre lienzo",
  locationCreated: { "@type": "Place", name: "Saint-Rémy-de-Provence" },
  contentLocation: { "@type": "Museum", name: "The Museum of Modern Art, Nueva York" },
};

export default function NochePage() {
  return (
    <div className={`mf-theme theme-noche ${instrument.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="nc-top">
        <ConceptHeader actual="noche-estrellada" />
      </div>

      <main>
        <NocheHero />

        <section id="observar" className="nc-section" aria-labelledby="nc-obs-t">
          <header className="nc-section__head">
            <h2 id="nc-obs-t" className="nc-h2">
              Observación <em>e</em> imaginación
            </h2>
            <p>
              El MoMA lo resume así: el cuadro es a la vez un ejercicio de observación y un claro
              alejamiento de ella. Aquí puedes separar las dos capas.
            </p>
          </header>
          <NocheExplorer />
        </section>

        <section className="nc-section nc-context" aria-labelledby="nc-ctx-t">
          <header className="nc-section__head">
            <h2 id="nc-ctx-t" className="nc-h2">
              Junio de 1889
            </h2>
            <Etiqueta
              rows={[
                ["Obra", NOCHE.titulo],
                ["Autor", NOCHE.autor],
                ["Lugar y fecha", NOCHE.fecha],
                ["Técnica", `${NOCHE.tecnica}, ${NOCHE.medidas}`],
                ["Conservación", `${NOCHE.museo}, ${NOCHE.inventario}`],
              ]}
            />
          </header>
          <ol className="nc-timeline">
            {CONTEXTO_NOCHE.map((c) => (
              <li key={c.id}>
                <h3>{c.titulo}</h3>
                <p>{c.texto}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <ConceptFooter
        current="noche-estrellada"
        sources={[
          { label: "MoMA: The Starry Night (472.1941)", href: "https://www.moma.org/collection/works/79802" },
          { label: "Historia Arte: La noche estrellada", href: "https://historia-arte.com/obras/noche-estrellada-van-gogh" },
        ]}
        rights={
          <p>
            Obra en dominio público. Reproducción de Wikimedia Commons (Google Art Project), marcada
            como dominio público. Las partículas son una capa visual de MANIFESTO y no modifican la
            imagen.
          </p>
        }
      />
    </div>
  );
}
