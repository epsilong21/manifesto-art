import type { Metadata } from "next";
import { BasquiatFooter } from "@/components/basquiat/BasquiatFooter";
import { BasquiatHero } from "@/components/basquiat/BasquiatHero";
import { DescifrarCapas } from "@/components/basquiat/DescifrarCapas";
import { Expediente } from "@/components/basquiat/Expediente";
import { TresLecturas } from "@/components/basquiat/TresLecturas";
import { ConceptHeader } from "@/components/concepts/ConceptChrome";
import { bricolage } from "@/lib/fonts/bricolage";
import { hayImagenBasquiat } from "@/lib/obraBasquiat";
import "./basquiat.css";
import "./basquiat-capas.css";
import "./basquiat-lecturas.css";
import "./basquiat-p5.css";
import "./basquiat-lab.css";

export const metadata: Metadata = {
  title: "Untitled (1981), de Jean-Michel Basquiat — MANIFESTO",
  description:
    "Una cabeza llena de ruido: contempla Untitled (1981), de Jean-Michel Basquiat, y pregúntate si es un cráneo, un rostro o una máscara.",
  alternates: { canonical: "/conceptos/basquiat-untitled" },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "Untitled, de Jean-Michel Basquiat",
    description: "Una cabeza llena de ruido. ¿Es un cráneo, un rostro o una máscara?",
  },
};

export default function BasquiatPage() {
  // Decidido en el servidor: sin reproducción, la página no enlaza ninguna imagen
  const conImagen = hayImagenBasquiat();
  return (
    <div className={`mf-theme theme-basquiat ${bricolage.variable}`}>
      <ConceptHeader actual="basquiat-untitled" />
      <main>
        <BasquiatHero conImagen={conImagen} />
        <DescifrarCapas conImagen={conImagen} />
        <TresLecturas conImagen={conImagen} />
        <Expediente />
      </main>
      <BasquiatFooter conImagen={conImagen} />
    </div>
  );
}
