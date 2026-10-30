/**
 * URL de un archivo de /public (imagen, textura, logotipo…). Es el único sitio que sabe dónde vive cada archivo:
 *
 * - Servidor Node y GitHub Pages: `<prefijo>/ruta`, como siempre.
 * - Tema de Shopify (`NEXT_PUBLIC_DESTINO=shopify`, ver scripts/shopify/): los assets de un tema van en una carpeta
 *   plana, así que `/img/medusa-640.webp` pasa a llamarse `img--medusa-640.webp`. En el navegador la carpeta de
 *   assets la fija la página (`window.__MSTO_ASSETS`, con el `asset_url` del tema); al exportar no se conoce, y se deja
 *   un marcador que el empaquetador sustituye por `{{ 'nombre' | asset_url }}`.
 */
const PREFIJO = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SHOPIFY = process.env.NEXT_PUBLIC_DESTINO === "shopify";

declare global {
  interface Window {
    __MSTO_ASSETS?: string;
  }
}

/** Marcador de la exportación para Shopify; scripts/shopify/empaquetar.mjs lo cambia por el `asset_url` de la página. */
export const MARCADOR_ASSET = "https://msto-asset.invalid/";

export function rutaPublica(ruta: string): string {
  if (!SHOPIFY) return `${PREFIJO}${ruta}`;
  const plano = ruta.replace(/^\//, "").replaceAll("/", "--");
  return typeof window === "undefined" ? `${MARCADOR_ASSET}${plano}` : `${window.__MSTO_ASSETS ?? ""}${plano}`;
}
