/**
 * Basquiat P5: «Examinar trazos» (inspector de la lámina) y revelación del hero.
 *
 * Las coordenadas están en px de la reproducción calibrada (921 × 1080), como las
 * zonas de basquiat-capas.ts, que no se tocan. Si cambia el archivo, recalibrar.
 */

/**
 * Píxeles CSS por píxel de la reproducción en la lupa. 1 = el archivo a su tamaño:
 * la lámina lo muestra reducido y la lupa sin reescalar, así que no hay píxeles
 * inventados. El archivo de referencia (921 × 1080) es el original de The Broad;
 * no se ha encontrado una reproducción mayor.
 */
export const ESCALA_LUPA = 1;

/** Regiones predefinidas: la alternativa por teclado al arrastre. La primera al entrar es el ojo. */
export const REGIONES_EXAMEN = [
  { nombre: "Los signos de arriba", x: 300, y: 110 },
  { nombre: "El ojo", x: 360, y: 600 },
  { nombre: "Los dientes", x: 365, y: 822 },
  { nombre: "El interior", x: 520, y: 400 },
  { nombre: "El borde de trazos", x: 640, y: 250 },
  { nombre: "Los trazos de abajo", x: 730, y: 960 },
];

export const REGION_INICIAL = 1;

/**
 * Revelación del hero: seis fragmentos rectangulares de la propia reproducción que
 * cubren la obra entera sin solaparse (x, y, ancho, alto en % de la imagen). Cada uno
 * llega desde un desplazamiento leve (dx, dy en % de su tamaño) y un giro de 2° como
 * máximo: un collage que se asienta, nunca una deformación.
 */
export const PIEZAS_REVELACION: { zona: [number, number, number, number]; dx: number; dy: number; giro: number }[] = [
  { zona: [0, 0, 58, 34], dx: -7, dy: -9, giro: -1.6 },
  { zona: [58, 0, 42, 46], dx: 8, dy: -6, giro: 1.4 },
  { zona: [0, 34, 36, 38], dx: -9, dy: 3, giro: 1.2 },
  { zona: [36, 34, 22, 38], dx: 0, dy: 7, giro: -0.8 },
  { zona: [58, 46, 42, 54], dx: 7, dy: 5, giro: -1.2 },
  { zona: [0, 72, 58, 28], dx: -5, dy: 9, giro: 0.9 },
];
