import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Cartografia } from "@/components/loca-meg/Cartografia";
import { Cuadro } from "@/components/loca-meg/Cuadro";
import { Gabinete } from "@/components/loca-meg/Gabinete";
import { InterpretacionGabinete } from "@/components/loca-meg/InterpretacionGabinete";
import { Restauracion } from "@/components/loca-meg/Restauracion";
import { Ficha } from "@/components/sprint/Ficha";
import { PieObra } from "@/components/sprint/PieObra";
import { CREDITOS, DOCUMENTADO, INTERPRETACION } from "@/content/loca-meg";
import { instrument } from "@/lib/fonts/instrument";
import "../sprint.css";
import "./loca-meg.css";
import "./cartografia.css";
import "./gabinete.css";
import "../pulido.css";
import { FundidoEstados } from "@/components/museo/FundidoEstados";

export const metadata: Metadata = {
  title: "La loca Meg, de Bruegel el Viejo — MANIFESTO",
  description: "Explora La loca Meg como una carta antigua: arrastra y acércate por la tabla, viaja a sus cinco territorios y sigue tres expediciones entre criaturas, objetos y bocas.",
  alternates: { canonical: "/conceptos/la-loca-meg" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "La loca Meg, de Bruegel el Viejo",
    description: "Cartografía del caos: cinco territorios y tres pistas sobre una tabla de 1563.",
  },
};

export default function LocaMegPage() {
  return (
    <div className={`mf-theme mu-sala theme-meg ${instrument.variable}`}>
      <FundidoEstados />
      <ConceptHeader />
      <main>
        <section className="meg-hero" aria-labelledby="meg-titulo">
          <figure className="meg-hero__fig">
            <Cuadro className="meg-hero__img" />
            <figcaption>Tabla completa · óleo, 115 × 161 cm · Museum Mayer van den Bergh, Amberes</figcaption>
          </figure>
          <div className="meg-hero__texto">
            <p className="meg-kicker">08 · Pieter Bruegel el Viejo · 1563</p>
            <h1 id="meg-titulo">La loca Meg</h1>
            <p className="meg-lede">Una mujer armada con sartén y espada avanza hacia la boca del infierno, y el cuadro entero se desordena a su alrededor. ¿Dónde mirar primero?</p>
            <a className="mf-btn mf-btn--solid" href="#mundo-de-meg">Entrar en la carta ↓</a>
          </div>
        </section>
        <Cartografia />
        <Restauracion />
        <Ficha documentado={DOCUMENTADO} interpretacion={INTERPRETACION} />
        <InterpretacionGabinete />
        <Gabinete />
      </main>
      <PieObra actual="la-loca-meg" {...CREDITOS} />
    </div>
  );
}
