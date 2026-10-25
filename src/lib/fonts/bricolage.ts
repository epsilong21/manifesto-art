import { Bricolage_Grotesque } from "next/font/google";

/** Display de Basquiat: grotesca de imprenta, estrecha y pesada, para titulares de cartel. */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
  // Sin precarga: el CSS va en línea y el navegador la pide en cuanto pinta el título.
  // Precargar las tres en cada ruta competía con la imagen principal en móvil.
  preload: false,
});
