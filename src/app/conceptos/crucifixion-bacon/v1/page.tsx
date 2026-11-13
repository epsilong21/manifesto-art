import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { CuadroBacon } from "@/components/bacon/CuadroBacon";
import { Epilogo } from "@/components/bacon/Epilogo";
import { Instalacion } from "@/components/bacon/Instalacion";
import { Negativo } from "@/components/bacon/Negativo";
import { Umbral } from "@/components/bacon/Umbral";
import { PieObra } from "@/components/sprint/PieObra";
import { COMPRENDER, CREDITOS, DOCUMENTADO, FICHA, INTERPRETACION_DOC } from "@/content/bacon";
import { cormorant } from "@/lib/fonts/cormorant";
import "../../sprint.css";
import "./bacon.css";

/** Ruta experimental: sin indexar y fuera del catálogo, el menú y el sitemap. */
export const metadata: Metadata = {
  title: "Crucifixion, de Francis Bacon · V1 experimental — MANIFESTO",
  description: "Versión experimental: Crucifixion (1933), de Francis Bacon, y una interpretación de MANIFESTO en dos instalaciones, «La materia del sacrificio» y «El negativo del cuerpo».",
  robots: { index: false, follow: false },
};

export default function BaconV1Page() {
  return (
    <div className={`mf-theme mu-sala theme-bacon ${cormorant.variable}`}>
      <ConceptHeader />
      <main>
        <section className="bc-hero" aria-labelledby="bc-titulo">
          <figure className="bc-hero__fig">
            <CuadroBacon className="bc-hero__img" />
            <figcaption>Crucifixion · Francis Bacon, 1933 · óleo sobre lienzo, 62 × 48,5 cm</figcaption>
          </figure>
          <div className="bc-hero__texto">
            <p className="bc-kicker">Francis Bacon · 1933 · óleo sobre lienzo</p>
            <h1 id="bc-titulo">Crucifixion</h1>
            <p className="bc-lede">Una figura pálida y sin rostro cuelga sobre un fondo oscuro. No hay escena, ni testigos: solo un cuerpo convertido en forma.</p>
            <dl className="bc-ficha">
              {FICHA.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <a className="bc-bajar" href="#interpretacion">Una interpretación de MANIFESTO ↓</a>
          </div>
        </section>

        <section className="bc-doc" aria-labelledby="bc-doc-h">
          <h2 id="bc-doc-h" className="bc-etiqueta bc-etiqueta--doc">Documentado</h2>
          <ul>{DOCUMENTADO.map((t) => <li key={t}>{t}</li>)}</ul>
          <h2 className="bc-etiqueta bc-etiqueta--int">Lecturas, no hechos</h2>
          <ul>{INTERPRETACION_DOC.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>

        <div id="interpretacion" className="bc-umbral" role="separator" aria-label="Aquí empieza la interpretación de MANIFESTO">
          <span>A partir de aquí, una interpretación original de MANIFESTO</span>
          <strong>Inspirada en Bacon; no realizada ni avalada por él ni por su sucesión</strong>
        </div>

        <Instalacion />
        <Umbral />
        <Negativo />
        <Epilogo />

        <details className="bc-comprender" id="comprender">
          <summary>{COMPRENDER.titulo}</summary>
          <div className="bc-comprender__cuerpo">
            {COMPRENDER.bloques.map((b) => (
              <div key={b.k}>
                <h3>{b.k}</h3>
                <p>{b.t}</p>
              </div>
            ))}
          </div>
        </details>
      </main>
      <aside className="bc-derechos" aria-label="Derechos y contacto">
        <p>Las obras de terceros pertenecen a sus titulares. Esta página no incluye la pintura original por falta de licencia, y este aviso no concede derechos de reproducción. Para solicitudes de derechos, correcciones o retiradas: <a href="mailto:manifesto.msto@gmail.com">manifesto.msto@gmail.com</a>. Más en el <a href="../../../aviso-legal/">aviso legal</a>.</p>
      </aside>
      <PieObra {...CREDITOS} />
    </div>
  );
}
