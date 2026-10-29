import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Ascension } from "@/components/empireo/Ascension";
import { Pintura } from "@/components/empireo/Pintura";
import { Ficha } from "@/components/sprint/Ficha";
import { PieObra } from "@/components/sprint/PieObra";
import { CREDITOS, DOCUMENTADO, INTERPRETACION } from "@/content/empireo";
import { cormorant } from "@/lib/fonts/cormorant";
import "../sprint.css";
import "./empireo.css";
import "../pulido.css";

export const metadata: Metadata = {
  title: "La ascensión al Empíreo, de El Bosco — MANIFESTO",
  description: "Sube de la oscuridad a la luz por la tabla de El Bosco y mide, estación a estación, cuánta luz tiene el camino.",
  alternates: { canonical: "/conceptos/ascension-al-empireo" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "La ascensión al Empíreo, de El Bosco",
    description: "Una subida de la oscuridad a la luz, estación a estación.",
  },
};

export default function EmpireoPage() {
  return (
    <div className={`mf-theme mu-sala theme-empireo ${cormorant.variable}`}>
      <ConceptHeader />
      <main>
        <section className="emp-hero" aria-labelledby="emp-titulo">
          <div className="emp-hero__texto">
            <p className="emp-kicker">06 · Hieronymus Bosch · hacia 1505–1515</p>
            <h1 id="emp-titulo">La ascensión al Empíreo</h1>
            <p className="emp-lede">Un túnel de luz al final de una subida en silencio. ¿Cuánta luz hace falta para llegar?</p>
            <a className="mf-btn mf-btn--solid" href="#emp-explora-h">Empezar a subir ↓</a>
          </div>
          <figure className="emp-hero__fig">
            <Pintura prioridad className="emp-hero__img" />
            <figcaption>Tabla completa · Palazzo Ducale, Venecia</figcaption>
          </figure>
        </section>
        <Ascension />
        <Ficha documentado={DOCUMENTADO} interpretacion={INTERPRETACION} />
      </main>
      <PieObra actual="ascension-al-empireo" {...CREDITOS} />
    </div>
  );
}
