import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Contemplar } from "@/components/cristo-dali/Contemplar";
import { Imposible } from "@/components/cristo-dali/Imposible";
import { Pintura } from "@/components/cristo-dali/Pintura";
import { Ficha } from "@/components/sprint/Ficha";
import { PieObra } from "@/components/sprint/PieObra";
import { CREDITOS, DATOS, DOCUMENTADO, INTERPRETACION } from "@/content/cristo-dali";
import { instrument } from "@/lib/fonts/instrument";
import "../sprint.css";
import "./cristo-dali.css";
import "./imposible.css";
import "../pulido.css";
import { FundidoEstados } from "@/components/museo/FundidoEstados";

export const metadata: Metadata = {
  title: "Cristo de San Juan de la Cruz, de Dalí — MANIFESTO",
  description: "Una escena 3D original sobre el Cristo de Dalí: cambia el punto de vista para ver su perspectiva imposible, desciende del vacío a la bahía y revela la geometría del núcleo.",
  alternates: { canonical: "/conceptos/cristo-de-san-juan-de-la-cruz" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Cristo de San Juan de la Cruz, de Dalí",
    description: "El vértigo de lo divino: una cruz vista desde arriba sobre una bahía vista de frente.",
  },
};

export default function CristoDaliPage() {
  return (
    <div className={`mf-theme mu-sala theme-dali ${instrument.variable}`}>
      <FundidoEstados />
      <ConceptHeader />
      <main>
        <section className="vd-hero" aria-labelledby="vd-titulo">
          <figure className="vd-hero__fig">
            <Pintura className="vd-hero__img" />
            <figcaption>Óleo sobre lienzo, 204,8 × 115,9 cm · Kelvingrove Art Gallery and Museum, Glasgow</figcaption>
          </figure>
          <div className="vd-hero__texto">
            <p className="vd-kicker">10 · Salvador Dalí · 1951</p>
            <h1 id="vd-titulo">Cristo de San Juan de la Cruz</h1>
            <p className="vd-lede">Un crucificado sin rostro flota sobre una bahía tranquila. Lo miramos desde arriba; el mar, de frente. ¿Dónde estamos?</p>
            <dl className="vd-datos">
              {DATOS.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <div className="vd-acciones">
              <a className="mf-btn mf-btn--solid" href="#perspectiva-imposible">Cambiar de punto de vista ↓</a>
              <Contemplar />
            </div>
          </div>
        </section>
        <Imposible />
        <Ficha documentado={DOCUMENTADO} interpretacion={INTERPRETACION} />
      </main>
      <PieObra {...CREDITOS} />
    </div>
  );
}
