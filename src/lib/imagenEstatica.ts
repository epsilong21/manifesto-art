"use client";

import ANCHOS from "./imagenAnchos.json";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Cargador de next/image para la exportación estática (GitHub Pages), donde
 * no hay optimizador de imágenes. Las variantes WebP de cada obra se generan
 * al exportar (scripts/pages/exportar.mjs) con los mismos anchos; aquí se
 * elige la menor que cubre el ancho pedido. Solo se usa con
 * MANIFESTO_DESTINO=pages: en desarrollo y en `next start` sigue el optimizador.
 */
export default function imagenEstatica({ src, width }: { src: string; width: number; quality?: number }) {
  const obra = src.match(/^\/obras\/([\w-]+)\.\w+$/);
  if (!obra) return `${BASE}${src}`;
  const ancho = ANCHOS.find((a) => a >= width) ?? ANCHOS[ANCHOS.length - 1];
  return `${BASE}/img/${obra[1]}-${ancho}.webp`;
}
