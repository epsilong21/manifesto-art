import type { Metadata } from "next";
import Link from "next/link";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { Experiencia } from "@/components/san-pedro/Experiencia";
import { CREDITOS } from "@/content/san-pedro";
import { cormorant } from "@/lib/fonts/cormorant";
import "./san-pedro.css";

export const metadata: Metadata = {
  title: "San Pedro penitente, taller de Jusepe de Ribera — MANIFESTO",
  description:
    "Las tres negaciones extinguieron la luz. Esta experiencia la recupera. MANIFESTO explora el peso psicológico de la traición a través de la pintura de Ribera.",
  alternates: { canonical: "/conceptos/san-pedro-penitente" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "San Pedro penitente — Taller de Ribera",
    description:
      "El peso de la negación: luz, oscuridad y arrepentimiento en la pintura de Ribera.",
  },
};

export default function SanPedroPenitentePage() {
  return (
    <div className={`mf-theme theme-san-pedro ${cormorant.variable}`}>
      <div className="sp-vel" aria-hidden="true" />
      <div className="sp-cab">
        <ConceptHeader />
      </div>
      <main>
        <Experiencia />
      </main>
      <footer className="mf-footer sp-footer">
        <Link href="/conceptos" className="mf-footer__next">
          <span className="mf-footer__label">Todas las obras</span>
          <span className="mf-footer__title">Volver al catálogo</span>
        </Link>
        <div className="mf-footer__cols">
          <div>
            <h2 className="mf-footer__h">Procedencia de la imagen</h2>
            <div className="mf-footer__rights">
              <p>{CREDITOS.imagen}</p>
              <p>{CREDITOS.nota}</p>
            </div>
          </div>
          <div>
            <h2 className="mf-footer__h">Fuentes</h2>
            <ul>
              {CREDITOS.fuentes.map((f) => (
                <li key={f.href}>
                  <a href={f.href} target="_blank" rel="noopener noreferrer">
                    {f.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mf-footer__h">MANIFESTO</h2>
            <ul>
              <li>
                <Link href="/aviso-legal">Aviso legal</Link>
              </li>
              <li>
                <Link href="/politica-de-privacidad">Política de privacidad</Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
