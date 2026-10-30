/** Tienda de MANIFESTO (la misma de la cabecera y el pie). */
export const TIENDA_URL = "https://manifestocol.com";

/**
 * Prenda de la tienda inspirada en cada obra (catálogo público de manifestocol.com, 30/10/2026).
 * Las dos obras de Basquiat comparten su camiseta. Sin precios: cambian en la tienda y aquí quedarían desfasados.
 */
export const PRODUCTOS: Record<string, { handle: string; titulo: string; imagen: string }> = {
  "medusa": {
    handle: "camiseta-semioversize-medusa",
    titulo: "Camiseta Semioversize Medusa",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/2_aceee9ff-e22d-4fa5-ab03-c0e762658c8b.png?v=1791466964",
  },
  "noche-estrellada": {
    handle: "camiseta-regular-noche-estrellada",
    titulo: "Camiseta Regular Noche Estrellada Van Gogh",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/7.png?v=1791468323",
  },
  "los-elefantes": {
    handle: "camiseta-regular-noche-de-van-gogh",
    titulo: "Camiseta Regular Elefantes Dalí Old Wash",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/3.png?v=1791467126",
  },
  "basquiat-untitled": {
    handle: "camiseta-regular-basquiat",
    titulo: "Camiseta Regular Basquiat",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/5.png?v=1791468533",
  },
  "glenn": {
    handle: "camiseta-regular-basquiat",
    titulo: "Camiseta Regular Basquiat",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/5.png?v=1791468533",
  },
  "ascension-al-empireo": {
    handle: "camiseta-oversize-woman-ochre-copia",
    titulo: "Camiseta Oversize Ascención al Empíreo",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/CAMISETA_ASCENSION_TRASERO.jpg?v=1779368956",
  },
  "el-descendimiento-de-la-cruz": {
    handle: "camiseta-regular-descendimiento-de-la-cruz",
    titulo: "Camiseta Regular Descendimiento de la Cruz",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/CAMISETADESENDIMIENTOTRASERO.jpg?v=1779375188",
  },
  "la-loca-meg": {
    handle: "camiseta-oversize-dullet-griet",
    titulo: "Camiseta Oversize Dullet Griet",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/CAMISETADULLEGRIETTRASERO.jpg?v=1779372510",
  },
  "los-siete-pecados-capitales": {
    handle: "crop-top-mesa-de-los-pecados",
    titulo: "Crop Top Mesa de los Pecados",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/CROPTOPNEGROTRASERO.jpg?v=1779376809",
  },
  "cristo-de-san-juan-de-la-cruz": {
    handle: "camiseta-regular-cristo-de-san-juan",
    titulo: "Camiseta Regular Cristo de San Juan",
    imagen: "https://cdn.shopify.com/s/files/1/0843/2235/3449/files/CAMISETACRISTOSANJUANTRASERO.jpg?v=1779374603",
  },
};

export function urlProducto(handle: string) {
  return `${TIENDA_URL}/products/${handle}`;
}

/** Imagen del CDN de Shopify a un ancho dado. */
export function imagenProducto(src: string, ancho = 640) {
  return `${src}${src.includes("?") ? "&" : "?"}width=${ancho}`;
}
