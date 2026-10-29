/**
 * Imágenes de las diez obras para la portada y el catálogo.
 * Medusa, La noche estrellada y las obras protegidas salen del cargador de imágenes (next/image,
 * /obras/*); las obras 06–10 usan sus WebP de public/<obra>/ (dos anchos, el menor primero).
 * Las dimensiones son las del archivo: la pintura se muestra siempre entera, sin recorte.
 */
export type ImagenPlana = { base: string; anchos: [number, number]; width: number; height: number };

export const IMAGEN_PLANA: Partial<Record<string, ImagenPlana>> = {
  "ascension-al-empireo": { base: "/empireo/ascension", anchos: [640, 1200], width: 1200, height: 2668 },
  "el-descendimiento-de-la-cruz": { base: "/descendimiento/descendimiento", anchos: [700, 1400], width: 1400, height: 1904 },
  "la-loca-meg": { base: "/dulle-griet/dulle-griet", anchos: [1000, 2000], width: 2000, height: 1442 },
  "los-siete-pecados-capitales": { base: "/pecados/pecados", anchos: [1000, 2000], width: 2000, height: 1705 },
  "cristo-de-san-juan-de-la-cruz": { base: "/cristo-dali/cristo", anchos: [400, 800], width: 800, height: 1426 },
};

/** Obras vía next/image (originales en /obras). */
export const IMAGEN_NEXT: Partial<Record<string, { src: string; width: number; height: number }>> = {
  medusa: { src: "/obras/medusa.jpg", width: 2400, height: 2350 },
  "noche-estrellada": { src: "/obras/noche-estrellada.jpg", width: 3000, height: 2376 },
};

/** Proporción de la composición gráfica de Los elefantes (viewBox 800 × 640). */
export const RATIO_GRAFICO = 800 / 640;

/** Texto alternativo breve de cada imagen (la ficha de la obra lleva la descripción larga). */
export const ALT: Record<string, string> = {
  medusa: "Medusa, de Caravaggio: la cabeza cortada sobre un escudo",
  "noche-estrellada": "La noche estrellada, de Vincent van Gogh",
  "los-elefantes": "Composición gráfica de MANIFESTO sobre Los elefantes, de Dalí (no es la pintura)",
  "basquiat-untitled": "Untitled (1981), de Jean-Michel Basquiat",
  glenn: "Glenn, de Jean-Michel Basquiat",
  "ascension-al-empireo": "La ascensión al Empíreo, de El Bosco: un túnel de luz sobre ángeles y almas",
  "el-descendimiento-de-la-cruz": "El descendimiento de la cruz, de Rubens: panel central",
  "la-loca-meg": "La loca Meg, de Bruegel el Viejo",
  "los-siete-pecados-capitales": "Los siete pecados capitales, atribuida a El Bosco: la mesa con el ojo central",
  "cristo-de-san-juan-de-la-cruz": "Cristo de San Juan de la Cruz, de Salvador Dalí",
};
