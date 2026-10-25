import { IBM_Plex_Mono } from "next/font/google";

/** Rótulos de Glenn: monoespaciada de máquina, como el sello de una fotocopiadora o una ficha de archivo. */
export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-plexmono",
  display: "swap",
  // Sin precarga, como Bricolage: el CSS va en línea y el navegador la pide al pintar los rótulos
  preload: false,
});
