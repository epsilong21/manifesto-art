import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Panel } from "@/components/descendimiento/Panel";
import { PesoDeLaLuz } from "@/components/descendimiento/PesoDeLaLuz";
import { Ficha } from "@/components/sprint/Ficha";
import { PieObra } from "@/components/sprint/PieObra";
import { CREDITOS, DOCUMENTADO, INTERPRETACION } from "@/content/descendimiento";
import { gloock } from "@/lib/fonts/gloock";
import "../sprint.css";
import "./descendimiento.css";
import "../pulido.css";
import { FundidoEstados } from "@/components/museo/FundidoEstados";

export const metadata: Metadata = {
  title: "El descendimiento de la cruz, de Rubens — MANIFESTO",
  description: "Lee el panel central de Rubens por su diagonal, por las manos que reciben el cuerpo y por la luz que lo separa de la sombra.",
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
            <a className="mf-btn mf-btn--solid" href="#dsc-explora-h">Leer el cuadro ↓</a>
          </div>
        </section>
        <PesoDeLaLuz />
        <Ficha documentado={DOCUMENTADO} interpretacion={INTERPRETACION} />
      </main>
      <PieObra actual="el-descendimiento-de-la-cruz" {...CREDITOS} />
    </div>
  );
}
