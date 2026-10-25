import type { Metadata } from "next";
import { ConceptHeader, SiteFooter } from "@/components/concepts/ConceptChrome";
import { SelectorList } from "@/components/concepts/SelectorList";
import { gloock } from "@/lib/fonts/gloock";
import { instrument } from "@/lib/fonts/instrument";
import { bricolage } from "@/lib/fonts/bricolage";
import { plexMono } from "@/lib/fonts/plexmono";
import { shoulders } from "@/lib/fonts/shoulders";

export const metadata: Metadata = {
  title: "Cinco obras. Cinco universos — MANIFESTO",
  description:
    "Medusa de Caravaggio, La noche estrellada de Van Gogh, Los elefantes de Dalí, y Untitled y Glenn de Basquiat: cinco experiencias interactivas para explorar el arte en lugar de contemplarlo.",
  alternates: { canonical: "/conceptos" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Cinco obras. Cinco universos.",
    description: "El arte no se contempla solamente. Se explora.",
  },
};

export default function ConceptosPage() {
  return (
    <div className={`mf-theme theme-selector ${gloock.variable} ${instrument.variable} ${shoulders.variable} ${bricolage.variable} ${plexMono.variable}`}>
      <ConceptHeader />
      <main>
        <section className="sel-intro" aria-labelledby="sel-title">
          <h1 id="sel-title" className="sel-title">
            <span>Cinco obras.</span>
            <span>Cinco universos.</span>
          </h1>
          <p className="sel-sub">
            Cada obra se recorre de una manera distinta: inclinar, observar, descifrar, examinar, ampliar.
            Elige por dónde empezar.
          </p>
        </section>
        <SelectorList />
      </main>
      <SiteFooter />
    </div>
  );
}
