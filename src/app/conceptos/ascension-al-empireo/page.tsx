import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Pintura } from "@/components/empireo/Pintura";
import { Umbral } from "@/components/empireo/Umbral";
import { Ficha } from "@/components/sprint/Ficha";
import { PieObra } from "@/components/sprint/PieObra";
import { CREDITOS, DOCUMENTADO, INTERPRETACION } from "@/content/empireo";
import { cormorant } from "@/lib/fonts/cormorant";
import "../sprint.css";
import "./empireo.css";
import "./umbral.css";
import "../pulido.css";
import { FundidoEstados } from "@/components/museo/FundidoEstados";

export const metadata: Metadata = {
  title: "La ascensión al Empíreo, de El Bosco — MANIFESTO",
  description: "Atraviesa un túnel de luz en cinco estaciones de la tabla de El Bosco: su brillo sigue la luz medida en cada tramo de la pintura.",
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
      <FundidoEstados />
      <ConceptHeader />
      <main>
        <section className="emp-hero" aria-labelledby="emp-titulo">
          <div className="emp-hero__texto">
            <p className="emp-kicker">06 · Hieronymus Bosch · hacia 1505–1515</p>
            <h1 id="emp-titulo">La ascensión al Empíreo</h1>
            <p className="emp-lede">Un túnel de luz al final de una subida en silencio. ¿Cuánta luz hace falta para llegar?</p>
            <a className="mf-btn mf-btn--solid" href="#um-titulo">Entrar en el umbral ↓</a>
          </div>
          <figure className="emp-hero__fig">
            <Pintura prioridad className="emp-hero__img" />
            <figcaption>Tabla completa · Palazzo Ducale, Venecia</figcaption>
          </figure>
        </section>
        <Umbral />
        <Ficha documentado={DOCUMENTADO} interpretacion={INTERPRETACION} />
      </main>
      <PieObra {...CREDITOS} />
    </div>
  );
}
