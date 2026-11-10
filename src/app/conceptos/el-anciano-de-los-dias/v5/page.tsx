import type { Metadata } from "next";
import Link from "next/link";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { EscenaV5 } from "@/components/anciano/v5/EscenaV5";
import { CREDITOS } from "@/content/anciano";
import { cormorant } from "@/lib/fonts/cormorant";
import "../../sprint.css";
import "../anciano.css";
import "../../pulido.css";
import "./v5.css";

/** Ruta experimental (prólogo, tres actos y epílogo): sin indexar y fuera del catálogo, el menú y el sitemap. */
export const metadata: Metadata = {
  title: "El anciano de los días · V5, recorrido experimental — MANIFESTO",
  description: "Versión experimental de El anciano de los días, de William Blake: tres actos y un epílogo sobre la medida y sus límites.",
  robots: { index: false, follow: false },
};

export default function AncianoV5Page() {
  return (
    <div className={`mf-theme mu-sala theme-anciano ${cormorant.variable}`}>
      <noscript>
        <style>{`.v5-pista{height:auto!important}.v5-escenario{position:static!important;height:auto!important;min-height:0!important}.v5-ventana{position:relative!important;height:80svh;left:0!important}.v5-texto{position:static!important;width:auto!important}.v5-pie,.v5-velo,.v5-lienzo{display:none}`}</style>
      </noscript>
      <div className="an-cab" style={{ position: "absolute", inset: "0 0 auto 0", zIndex: 30 }}><ConceptHeader /></div>
      <main>
        <EscenaV5 />
      </main>
      <footer className="mf-footer">
        <Link href="/conceptos" className="mf-footer__next">
          <span className="mf-footer__label">Todas las obras</span>
          <span className="mf-footer__title">Volver al catálogo</span>
        </Link>
        <div className="mf-footer__cols">
          <div>
            <h2 className="mf-footer__h">Procedencia de la imagen</h2>
            <div className="mf-footer__rights"><p>{CREDITOS.imagen}</p><p>{CREDITOS.nota}</p></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
