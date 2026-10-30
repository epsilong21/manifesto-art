/** La web se sirve desde el tema de Shopify (npm run shopify:empaquetar) y no desde GitHub Pages: cambian el alojamiento y los enlaces a GitHub. */
export const EN_SHOPIFY = process.env.NEXT_PUBLIC_DESTINO === "shopify";
