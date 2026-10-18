import type { Metadata } from "next";
import { ConceptHeader, SiteFooter } from "@/components/concepts/ConceptChrome";
import { SelectorList } from "@/components/concepts/SelectorList";
import { gloock } from "@/lib/fonts/gloock";
import { instrument } from "@/lib/fonts/instrument";
import { shoulders } from "@/lib/fonts/shoulders";

export const metadata: Metadata = {
  title: "Tres obras. Tres universos — MANIFESTO",
  description:
    "Medusa de Caravaggio, La noche estrellada de Van Gogh y Los elefantes de Dalí: tres experiencias interactivas para explorar el arte en lugar de contemplarlo.",
  alternates: { canonical: "/conceptos" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Tres obras. Tres universos.",
    description: "El arte no se contempla solamente. Se explora.",
  },
};

export default function ConceptosPage() {
  return (
    <div className={`mf-theme theme-selector ${gloock.variable} ${instrument.variable} ${shoulders.variable}`}>
      <ConceptHeader />
      <main>
        <section className="sel-intro" aria-labelledby="sel-title">
          <h1 id="sel-title" className="sel-title">
            <span>Tres obras.</span>
            <span>Tres universos.</span>
          </h1>
          <p className="sel-sub">
            Cada obra se recorre de una manera distinta: inclinar, observar, descifrar. Elige por dónde
            empezar.
          </p>
        </section>
        <SelectorList />
      </main>
      <SiteFooter />
    </div>
  );
}
