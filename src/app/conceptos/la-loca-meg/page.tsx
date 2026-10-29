import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Cartografia } from "@/components/loca-meg/Cartografia";
import { Cuadro } from "@/components/loca-meg/Cuadro";
import { Restauracion } from "@/components/loca-meg/Restauracion";
import { Ficha } from "@/components/sprint/Ficha";
import { PieObra } from "@/components/sprint/PieObra";
import { CREDITOS, DOCUMENTADO, INTERPRETACION } from "@/content/loca-meg";
import { instrument } from "@/lib/fonts/instrument";
import "../sprint.css";
import "./loca-meg.css";
import "../pulido.css";

export const metadata: Metadata = {
  title: "La loca Meg, de Bruegel el Viejo — MANIFESTO",
  description: "Recorre La loca Meg por cinco territorios y sigue las pistas que cruzan el cuadro: criaturas, objetos, bocas y un cielo recuperado por la restauración.",
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
            <a className="mf-btn mf-btn--solid" href="#meg-explora-h">Recorrer el caos ↓</a>
          </div>
        </section>
        <Cartografia />
        <Restauracion />
        <Ficha documentado={DOCUMENTADO} interpretacion={INTERPRETACION} />
      </main>
      <PieObra actual="la-loca-meg" {...CREDITOS} />
    </div>
  );
}
