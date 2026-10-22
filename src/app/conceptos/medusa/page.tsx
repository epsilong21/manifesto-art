import type { Metadata } from "next";
import Image from "next/image";
import { ConceptFooter, ConceptHeader, Etiqueta, KindTag } from "@/components/concepts/ConceptChrome";
import { ElReflejo } from "@/components/medusa/ElReflejo";
import { MedusaShield } from "@/components/medusa/MedusaShield";
import { SombraLab } from "@/components/medusa/SombraLab";
import { DOSSIER_MEDUSA, MEDUSA } from "@/content/medusa";
import { FUENTES_MEDUSA_V3, REFLEJO } from "@/content/medusa-v3";
import { gloock } from "@/lib/fonts/gloock";
import "./medusa.css";
import "./medusa-v3.css";

export const metadata: Metadata = {
  title: "Medusa de Caravaggio: la mirada prohibida — MANIFESTO",
  description:
    "Inclina el escudo de Medusa de Caravaggio, examina la mirada, las serpientes y la sangre, y descubre su historia: de regalo para los Médici a las Galerías de los Uffizi.",
  alternates: { canonical: "/conceptos/medusa" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "No deberías estar mirando.",
    description: "Medusa, de Caravaggio, explorada detalle a detalle.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VisualArtwork",
  name: "Medusa",
  creator: { "@type": "Person", name: "Caravaggio" },
  dateCreated: "1597",
  artMedium: "Óleo sobre lienzo aplicado a un escudo de madera",
  contentLocation: { "@type": "Museum", name: "Galerías de los Uffizi, Florencia" },
};

export default function MedusaPage() {
  return (
    <div className={`mf-theme theme-medusa ${gloock.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ConceptHeader actual="medusa" />

      <main>
        <section className="md-hero" aria-labelledby="md-title">
          <div className="md-hero__shield" aria-hidden="true">
            <Image
              src={MEDUSA.imagen.src}
              alt=""
              width={MEDUSA.imagen.width}
              height={MEDUSA.imagen.height}
              sizes="(min-width: 64rem) 52vw, 96vw"
              quality={70}
              // Es el elemento LCP: prioridad alta. Misma variante que el escudo
              // interactivo, así se descarga una sola vez.
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="md-hero__copy">
            <h1 id="md-title" className="md-title">
              <span>La mirada</span>
              <span>prohibida</span>
            </h1>
            <p className="md-warning">No deberías estar mirando.</p>
            <a href="#escudo" className="mf-btn mf-btn--solid md-cta">
              Mirar de todos modos
            </a>
          </div>
          <div className="md-hero__label">
            <Etiqueta
              rows={[
                ["Obra", MEDUSA.titulo],
                ["Autor", "Caravaggio"],
                ["Fecha", MEDUSA.fecha],
                ["Soporte", "Lienzo sobre escudo de madera"],
                ["Conservación", MEDUSA.museo],
              ]}
            />
          </div>
        </section>

        <section id="escudo" className="md-section" aria-labelledby="md-escudo-t">
          <header className="md-section__head">
            <h2 id="md-escudo-t" className="md-h2">
              Escudo interactivo
            </h2>
            <p>
              Perseo solo pudo mirarla a través de un reflejo. Tú tienes una pantalla. Inclina el
              escudo y abre los cinco expedientes.
            </p>
          </header>
          <MedusaShield />
          {/* Fuera del componente del escudo: tras los cinco puntos, a la interpretación original */}
          <p className="mv-enlace">
            <a href="#reflejo">Ya conoces la obra. Ahora descubre nuestra interpretación</a>
          </p>
        </section>

        <section className="md-section md-dossier" aria-labelledby="md-dossier-t">
          <header className="md-section__head">
            <h2 id="md-dossier-t" className="md-h2">
              El expediente
            </h2>
            <p>
              Quién la pintó, para quién, sobre qué y dónde está hoy. Los cuadrados marcan hechos
              documentados; los círculos, interpretaciones.
            </p>
          </header>
          <div className="md-dossier__grid">
            {DOSSIER_MEDUSA.map((c) => (
              <article key={c.id} className="md-case" aria-labelledby={`case-${c.id}`}>
                <h3 id={`case-${c.id}`} className="md-case__title">
                  {c.titulo}
                </h3>
                {c.bloques.map((b, i) => (
                  <div key={i} className="md-case__block">
                    <KindTag tipo={b.tipo} />
                    <p>{b.texto}</p>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>

        <section id="sombra" className="md-section mv-lab-section" aria-labelledby="mv-lab-t">
          <header className="md-section__head">
            <h2 id="mv-lab-t" className="md-h2">
              La sombra que miente
            </h2>
            <p>
              El escudo sale hacia ti, pero su sombra dice lo contrario. Gíralo, míralo de perfil y en sección para ver
              su forma real.
            </p>
          </header>
          <SombraLab />
        </section>

        <ElReflejo />
      </main>

      <ConceptFooter
        current="medusa"
        sources={[
          { label: "Gallerie degli Uffizi (ficha en Google Arts & Culture)", href: "https://artsandculture.google.com/asset/medusa/FAFPqU12CekL8Q" },
          { label: "Gallerie degli Uffizi", href: "https://www.uffizi.it/" },
          { label: "Historia Arte: Medusa de Caravaggio", href: "https://historia-arte.com/obras/medusa-de-caravaggio" },
          ...Object.values(FUENTES_MEDUSA_V3),
        ]}
        rights={
          <>
            <p>
              Caravaggio, Medusa, hacia 1597–1598. Gallerie degli Uffizi, Florencia. Obra en dominio
              público.
            </p>
            <p>
              Reproducción: Google Arts &amp; Culture vía Wikimedia Commons (
              <a
                href="https://commons.wikimedia.org/wiki/File:Caravaggio_-_Medusa_-_Google_Art_Project.jpg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Caravaggio - Medusa - Google Art Project.jpg
              </a>
              , PD-Art), solo recortada y redimensionada. Uso cultural y educativo sin ánimo de lucro
              (art. 108.3-bis del Codice dei beni culturali).
            </p>
            <p>
              La petrificación, la luz y los tratamientos de color son capas artísticas de MANIFESTO: no
              alteran el archivo de la reproducción.
            </p>
            <p>
              El laboratorio «La sombra que miente» y la escena «{REFLEJO.nombre}» son creaciones de MANIFESTO,
              generadas con código. El laboratorio muestra además un recorte de la reproducción de la obra.
            </p>
            <p>
              En el espejo de «{REFLEJO.nombre}»: Franz von Stuck, Cabeza de Medusa, hacia 1892. Obra en dominio
              público. Reproducción: Wikimedia Commons (
              <a href={FUENTES_MEDUSA_V3.stuck.href} target="_blank" rel="noopener noreferrer">
                Haupt der Medusa by Franz von Stuck.jpg
              </a>
              , PD-Art), sin modificar el archivo; se muestra invertida y con una ligera deformación de espejo
              convexo.
            </p>
          </>
        }
      />
    </div>
  );
}
