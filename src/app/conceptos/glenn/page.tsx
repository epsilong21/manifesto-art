import type { Metadata } from "next";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { ContextoGlenn } from "@/components/glenn/ContextoGlenn";
import { ExpedienteGlenn } from "@/components/glenn/ExpedienteGlenn";
import { GlennFooter } from "@/components/glenn/GlennFooter";
import { GlennHero } from "@/components/glenn/GlennHero";
import { LecturasGlenn } from "@/components/glenn/LecturasGlenn";
import { MesaDeLuz } from "@/components/glenn/MesaDeLuz";
import { RevelarSecciones } from "@/components/glenn/RevelarSecciones";
import { plexMono } from "@/lib/fonts/plexmono";
import { hayImagenGlenn } from "@/lib/obraGlenn";
import "./glenn.css";
import "./glenn-muro.css";
import "./glenn-archivo.css";

export const metadata: Metadata = {
  title: "Glenn (1984–1985), de Jean-Michel Basquiat — MANIFESTO",
  description:
    "Una máscara sobre un muro de fotocopias: mira de cerca Glenn, de Jean-Michel Basquiat, y decide si es un retrato, una máscara o un archivo.",
  alternates: { canonical: "/conceptos/glenn" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Glenn, de Jean-Michel Basquiat",
    description: "Una máscara sobre un muro de fotocopias. ¿Retrato, máscara o archivo?",
  },
};

export default function GlennPage() {
  // Decidido en el servidor: sin reproducción, la página no enlaza ninguna imagen
  const conImagen = hayImagenGlenn();
  return (
    <div className={`mf-theme theme-glenn ${plexMono.variable}`}>
      <ConceptHeader actual="glenn" />
      <main>
        <GlennHero conImagen={conImagen} />
        <MesaDeLuz conImagen={conImagen} />
        <LecturasGlenn />
        <ContextoGlenn />
        <ExpedienteGlenn />
      </main>
      <GlennFooter conImagen={conImagen} />
      <RevelarSecciones />
    </div>
  );
}
