import type { Metadata } from "next";
import { Presencia } from "@/prototipos/madonna-presencia/Presencia";
import "@/prototipos/madonna-presencia/presencia.css";

export const metadata: Metadata = {
  title: "La Madona de Portlligat (primera versión), de Salvador Dalí (1949) — MANIFESTO",
  description:
    "Contempla La Madona de Portlligat (primera versión) de Salvador Dalí y cruza a una instalación tridimensional original de MANIFESTO que interpreta su composición.",
  alternates: { canonical: "/conceptos/la-madona-de-portlligat" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "article",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "La Madona de Portlligat — Salvador Dalí, 1949",
    description:
      "Una instalación tridimensional inspirada en la composición de la primera Madona de Dalí. Tres estaciones, una arquitectura interior y el regreso a la pintura.",
  },
};

export default function MadonaDePortlligatPage() {
  return <Presencia />;
}
