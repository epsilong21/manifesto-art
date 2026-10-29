import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Mesa } from "@/components/pecados/Mesa";
import { Tabla } from "@/components/pecados/Tabla";
import { Ficha } from "@/components/sprint/Ficha";
import { PieObra } from "@/components/sprint/PieObra";
import { CREDITOS, DOCUMENTADO, INTERPRETACION } from "@/content/pecados";
import { cormorant } from "@/lib/fonts/cormorant";
import "../sprint.css";
import "./pecados.css";
import "./optico.css";
import "../pulido.css";
import { FundidoEstados } from "@/components/museo/FundidoEstados";

export const metadata: Metadata = {
  title: "Los siete pecados capitales, atribuida a El Bosco — MANIFESTO",
  description: "Mira la mesa de los siete pecados capitales, atribuida a El Bosco, por un ocular de bronce: la mesa gira para dejar derecha cada escena, y cada escena vista traza un rayo desde el ojo central.",
  alternates: { canonical: "/conceptos/los-siete-pecados-capitales" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Los siete pecados capitales, atribuida a El Bosco",
    description: "El ojo que todo lo ve: siete pecados, cuatro postrimerías y una pupila con Cristo.",
  },
};

export default function PecadosPage() {
  return (
    <div className={`mf-theme mu-sala theme-pec ${cormorant.variable}`}>
      <FundidoEstados />
      <ConceptHeader />
      <main>
        <section className="pec-hero" aria-labelledby="pec-titulo">
          <figure className="pec-hero__fig">
            <Tabla className="pec-hero__img" />
            <figcaption>Tabla completa · Museo Nacional del Prado, Madrid</figcaption>
          </figure>
          <div className="pec-hero__texto">
            <p className="pec-kicker">09 · Atribuida a El Bosco</p>
            <h1 id="pec-titulo">Los siete pecados capitales y las cuatro postrimerías</h1>
            <p className="pec-lede">Un ojo enorme, con Cristo en la pupila, vigila siete escenas de pecado y cuatro destinos. ¿Qué ve desde ahí?</p>
            <dl className="pec-datos">
              <div><dt>Autoría</dt><dd>Atribuida a El Bosco; discutida</dd></div>
              <div><dt>Fecha</dt><dd>Hacia 1505–1510 según el Prado; discutida</dd></div>
              <div><dt>Técnica</dt><dd>Óleo sobre tabla, 119,5 × 139,5 cm</dd></div>
              <div><dt>Colección</dt><dd>Museo Nacional del Prado</dd></div>
            </dl>
            <a className="mf-btn mf-btn--solid" href="#ojo-que-observa">Mirar por el ocular ↓</a>
          </div>
        </section>
        <Mesa />
        <Ficha documentado={DOCUMENTADO} interpretacion={INTERPRETACION} />
      </main>
      <PieObra actual="los-siete-pecados-capitales" {...CREDITOS} />
    </div>
  );
}
