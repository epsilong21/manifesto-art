import { Gloock } from "next/font/google";

/** Display de Medusa. Un módulo por familia: así cada ruta precarga solo la suya. */
export const gloock = Gloock({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gloock",
  display: "swap",
  // Sin precarga: el CSS va en línea y el navegador la pide en cuanto pinta el título.
  // Precargar las tres en cada ruta competía con la imagen principal en móvil.
  preload: false,
});
