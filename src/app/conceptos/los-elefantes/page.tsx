import type { Metadata } from "next";
import { ConceptFooter, ConceptHeader, Etiqueta, KindTag } from "@/components/concepts/ConceptChrome";
import { DesiertoImposible } from "@/components/elefantes/DesiertoImposible";
import { LegLab } from "@/components/elefantes/LegLab";
import { ObraLectura } from "@/components/elefantes/ObraLectura";
import { ObraPendiente } from "@/components/elefantes/ObraPendiente";
import { CONTEXTO_ELEFANTES, DERECHOS_DALI, DESIERTO, ELEFANTES } from "@/content/elefantes";
import { shoulders } from "@/lib/fonts/shoulders";
import { hayImagenElefantes } from "@/lib/obraElefantes";
import "./elefantes.css";

export const metadata: Metadata = {
  title: "Los elefantes, de Salvador Dalí (1948) — MANIFESTO",
  description:
    "Contempla Los elefantes de Salvador Dalí (1948), acércate a cinco de sus detalles y descubre su historia, su simbolismo y la referencia a Bernini.",
  alternates: { canonical: "/conceptos/los-elefantes" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Los elefantes, de Salvador Dalí",
    description: "Los elefantes, de Salvador Dalí: fuerza, fragilidad y escala.",
  },
};

/** Escala real, en metros (Bernini: Wikipedia; persona: referencia genérica). */
const ESCALA = [
  { nombre: "Una persona", m: 1.7 },
  { nombre: "Obelisco de la piazza della Minerva", m: 5.47 },
  { nombre: "Monumento completo de Bernini", m: 12.69 },
];

export default function ElefantesPage() {
  // Decidido en el servidor: sin reproducción, la página no enlaza ninguna imagen
  const conImagen = hayImagenElefantes();
  return (
    <div className={`mf-theme theme-elefantes ${shoulders.variable}`}>
      <ConceptHeader actual="los-elefantes" />

      <main>
        {conImagen ? <ObraLectura /> : <ObraPendiente />}

        <section className="el-section" aria-labelledby="el-ctx-t">
          <header className="el-section__head">
            <div>
              <p className="el-kicker" aria-hidden="true">01 · Contexto</p>
              <h2 id="el-ctx-t" className="el-h2">
                De dónde viene
              </h2>
            </div>
          </header>
          <div className="el-context">
            {CONTEXTO_ELEFANTES.map((c) => (
              <article key={c.id} aria-labelledby={`ctx-${c.id}`}>
                <KindTag tipo={c.tipo} />
                <h3 id={`ctx-${c.id}`}>{c.titulo}</h3>
                <p>{c.texto}</p>
              </article>
            ))}
          </div>
          <div className="el-ficha">
            <Etiqueta
              rows={[
                ["Obra", `${ELEFANTES.titulo} (${ELEFANTES.original})`],
                ["Autor", ELEFANTES.autor],
                ["Fecha", ELEFANTES.fecha],
                ["Técnica", `${ELEFANTES.tecnica}, ${ELEFANTES.medidas}`],
                ["Ubicación", ELEFANTES.ubicacion],
              ]}
            />
            <p className="el-nota">{ELEFANTES.estadoDatos}</p>
            <p className="el-nota">
              <strong>Derechos.</strong> {DERECHOS_DALI.texto} Protegida hasta el {DERECHOS_DALI.hasta}.
              Gestión: {DERECHOS_DALI.gestion}.
            </p>
            <p className="el-nota">
              <strong>Sobre la escena.</strong> {DESIERTO.nota}
            </p>
          </div>
        </section>
        <section id="laboratorio" className="el-section el-lab-section" aria-labelledby="el-lab-t">
          <header className="el-section__head">
            <div>
              <p className="el-kicker" aria-hidden="true">02 · Laboratorio</p>
              <h2 id="el-lab-t" className="el-h2">
                Laboratorio de lo imposible
              </h2>
            </div>
            <p>
              ¿Cuánto tendría que medir una pata para sostener seis toneladas? Alarga y adelgaza las
              patas y comprueba cuándo la física deja de acompañar al sueño.
            </p>
          </header>
          <LegLab />
        </section>

        <section className="el-section" aria-labelledby="el-esc-t">
          <header className="el-section__head">
            <div>
              <p className="el-kicker" aria-hidden="true">03 · Escala</p>
              <h2 id="el-esc-t" className="el-h2">
                Escala
              </h2>
            </div>
            <p>
              El obelisco viene de Roma. En 1667 Bernini colocó uno egipcio sobre un elefante de
              mármol. Estas son sus medidas reales.
            </p>
          </header>
          <ol className="el-scale" aria-label="Comparación de alturas">
            {ESCALA.map((e) => (
              <li key={e.nombre} style={{ "--h": e.m / 12.69 } as React.CSSProperties}>
                <span className="el-scale__bar" aria-hidden="true" />
                <span className="el-scale__m">{e.m.toLocaleString("es-ES")} m</span>
                <span className="el-scale__name">{e.nombre}</span>
              </li>
            ))}
          </ol>
        </section>

        <DesiertoImposible />
      </main>

      <ConceptFooter
        current="los-elefantes"
        sources={[
          { label: "Fundació Gala-Salvador Dalí: derechos e imagen", href: "https://www.salvador-dali.org/en/dali-foundation/services/rights-and-image/" },
          { label: "Fundació Gala-Salvador Dalí: catálogo razonado de pintura", href: "https://catalogues.salvador-dali.org/catalogues/en/catalogue-raisonne-paintings/" },
          { label: "Wikipedia: The Elephants (fuente secundaria)", href: "https://en.wikipedia.org/wiki/The_Elephants" },
          { label: "Wikipedia: Elephant and Obelisk (fuente secundaria)", href: "https://en.wikipedia.org/wiki/Elephant_and_Obelisk" },
        ]}
        rights={
          <>
            <p>
              Los elefantes, de Salvador Dalí: obra protegida por derechos de autor hasta el{" "}
              {DERECHOS_DALI.hasta} ({DERECHOS_DALI.gestion}).{" "}
              {conImagen
                ? "La reproducción que se muestra requiere autorización y no forma parte de este repositorio."
                : "La reproducción de la pintura está pendiente de autorización y no se muestra."}
            </p>
            <p>
              La escena «{DESIERTO.nombre}», sus esculturas, la tipografía, el laboratorio y los diagramas
              son creaciones propias de MANIFESTO, generadas con código. No reproducen ni imitan la
              composición del cuadro.
            </p>
          </>
        }
      />
    </div>
  );
}
