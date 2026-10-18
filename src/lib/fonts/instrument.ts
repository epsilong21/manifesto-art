import { Instrument_Serif } from "next/font/google";

/** Display de Noche estrellada. */
export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
  // Sin precarga: el CSS va en línea y el navegador la pide en cuanto pinta el título.
  // Precargar las tres en cada ruta competía con la imagen principal en móvil.
  preload: false,
});
