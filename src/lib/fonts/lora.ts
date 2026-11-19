import { Lora } from "next/font/google";

/** Contemplative serif for Cristo coronado (Reni): moderate contrast, warm, beautiful italics. */
export const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});
