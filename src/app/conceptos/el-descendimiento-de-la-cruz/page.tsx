import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Gravedad } from "@/components/descendimiento/Gravedad";
import { Interpretacion } from "@/components/descendimiento/Interpretacion";
import { Panel } from "@/components/descendimiento/Panel";
import { PesoDeLaLuz } from "@/components/descendimiento/PesoDeLaLuz";
import { Ficha } from "@/components/sprint/Ficha";
import { PieObra } from "@/components/sprint/PieObra";
import { CREDITOS, DOCUMENTADO, INTERPRETACION } from "@/content/descendimiento";
import { gloock } from "@/lib/fonts/gloock";
import "../sprint.css";
import "./descendimiento.css";
import "./peso.css";
import "./gravedad.css";
import "../pulido.css";
import { FundidoEstados } from "@/components/museo/FundidoEstados";

export const metadata: Metadata = {
  title: "El descendimiento de la cruz, de Rubens — MANIFESTO",
  description: "El panel central de Rubens en penumbra: una luz dirigida recorre su diagonal, se detiene en las seis manos que sostienen el cuerpo y revela su claroscuro.",
  alternates: { canonical: "/conceptos/el-descendimiento-de-la-cruz" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "El descendimiento de la cruz, de Rubens",
    description: "El peso de la luz: una diagonal, seis manos y un fondo casi negro.",
  },
};

export default function DescendimientoPage() {
  return (
    <div className={`mf-theme mu-sala theme-descendimiento ${gloock.variable}`}>
      <FundidoEstados />
      <ConceptHeader />
      <main>
        <section className="dsc-hero" aria-labelledby="dsc-titulo">
          <figure className="dsc-hero__fig">
            <Panel className="dsc-hero__img" />
            <figcaption>Panel central · óleo sobre tabla, 421 × 311 cm · Catedral de Nuestra Señora, Amberes</figcaption>
          </figure>
          <div className="dsc-hero__texto">
            <p className="dsc-kicker">07 · Peter Paul Rubens · 1611–1614</p>
            <h1 id="dsc-titulo">El descendimiento de la cruz</h1>
            <p className="dsc-lede">Un cuerpo muerto baja sobre un paño blanco, y toda la escena se ordena para sostenerlo. ¿Cuánto pesa la luz?</p>
            <a className="mf-btn mf-btn--solid" href="#peso-de-la-luz">Entrar en la penumbra ↓</a>
          </div>
        </section>
        <PesoDeLaLuz />
        <Ficha documentado={DOCUMENTADO} interpretacion={INTERPRETACION} />
        <Interpretacion />
        <Gravedad />
      </main>
      <PieObra actual="el-descendimiento-de-la-cruz" {...CREDITOS} />
    </div>
  );
}
