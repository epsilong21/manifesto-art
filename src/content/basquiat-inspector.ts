/**
 * Basquiat P5: «Examinar trazos» (inspector de la lámina).
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
