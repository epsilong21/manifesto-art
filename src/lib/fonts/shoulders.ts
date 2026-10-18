import { Big_Shoulders } from "next/font/google";

/** Display de Los elefantes: a peso fino, las astas son finas como las patas. */
export const shoulders = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-shoulders",
  display: "swap",
  // Sin precarga: el CSS va en línea y el navegador la pide en cuanto pinta el título.
  // Precargar las tres en cada ruta competía con la imagen principal en móvil.
  preload: false,
  // Next no tiene métricas de ajuste para esta familia: fallback condensado del sistema
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "sans-serif"],
});
