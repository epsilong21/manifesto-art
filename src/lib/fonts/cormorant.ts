import { Cormorant_Garamond } from "next/font/google";

/** Display de La ascensión al Empíreo: serif de contraste alto, de luz sobre fondo oscuro. */
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});
