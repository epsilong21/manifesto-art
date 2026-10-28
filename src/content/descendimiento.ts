/**
 * El descendimiento de la cruz (Rubens), panel central: El peso de la luz.
 * Coordenadas x, y en fracciones de la imagen (0–1 desde arriba/izquierda),
 * verificadas a mano sobre la reproducción con recortes y rejilla.
 */

export const DESC_IMG = {
  base: "/descendimiento/descendimiento",
  anchos: [700, 1400] as const,
  width: 1400,
  height: 1904,
  /** Alto / ancho de la reproducción (el panel mide 421 × 311 cm: 1,35). */
  ratio: 1904 / 1400,
  alt: "El descendimiento de la cruz, panel central de Rubens: el cuerpo pálido de Cristo desciende en diagonal sobre un paño blanco, recibido por San Juan de rojo, la Virgen y la Magdalena.",
};

export type PuntoDiagonal = { id: string; titulo: string; x: number; y: number; texto: string };
export const DIAGONAL: PuntoDiagonal[] = [
  { id: "pano", titulo: "El paño entre los dientes", x: 0.74, y: 0.11, texto: "Arriba, un hombre sujeta el sudario con la boca y apoya una mano en el travesaño. Desde aquí arranca la bajada." },
  { id: "brazo", titulo: "El brazo caído", x: 0.62, y: 0.27, texto: "El brazo cuelga casi recto: el cuerpo parece pender de la tela, no de sí mismo." },
  { id: "cabeza", titulo: "La cabeza", x: 0.51, y: 0.354, texto: "La cabeza ladeada, de ojos cerrados, es el punto donde la línea gira hacia la izquierda." },
  { id: "torso", titulo: "El torso", x: 0.58, y: 0.46, texto: "El torso se arquea sobre el paño; la cadera y la pierna doblada lo llevan hacia el suelo." },
  { id: "pies", titulo: "Los pies", x: 0.42, y: 0.645, texto: "La diagonal termina en los pies, recogidos por manos de mujer: el peso llega a tierra." },
];

export type PuntoMano = { id: string; titulo: string; x: number; y: number; zoom: number; texto: string };
export const MANOS: PuntoMano[] = [
  { id: "arriba", titulo: "Las manos de arriba", x: 0.52, y: 0.265, zoom: 2.2, texto: "Desde la escalera, un hombre agarra el paño con una mano y alarga la otra hacia el cuerpo para guiarlo." },
  { id: "anciano", titulo: "El anciano de la túnica dorada", x: 0.352, y: 0.447, zoom: 2.2, texto: "Con una mano recoge la punta del sudario, justo donde la tela roza el brazo de la Virgen." },
  { id: "virgen", titulo: "La Virgen", x: 0.415, y: 0.475, zoom: 2.2, texto: "De azul, la Virgen alza una mano hacia el paño y mantiene la otra abierta, a la altura del pecho." },
  { id: "cristo", titulo: "La mano que ya no sostiene", x: 0.49, y: 0.535, zoom: 2.4, texto: "La mano de Cristo cuelga abierta, sin agarrar nada, entre las que sí sostienen." },
  { id: "juan", titulo: "San Juan", x: 0.62, y: 0.55, zoom: 2.2, texto: "De rojo y de espaldas, se inclina bajo el cuerpo para recibir su peso. Su manto es la mancha de color más fuerte del cuadro." },
  { id: "magdalena", titulo: "Las manos de abajo", x: 0.45, y: 0.63, zoom: 2.2, texto: "Una mujer rubia (tradicionalmente, la Magdalena) sostiene los pies con las dos manos, a la altura del suelo." },
];

export type LecturaLuz = { id: string; titulo: string; filtro: string; x: number; y: number; texto: string };
export const LUZ: LecturaLuz[] = [
  { id: "claro", titulo: "Solo lo claro", filtro: "brightness(0.62) contrast(2.3)", x: 0.74, y: 0.27, texto: "Al subir el contraste sobreviven sobre todo el cuerpo y el paño blanco: la luz del cuadro cabe en una franja estrecha." },
  { id: "valores", titulo: "Valores", filtro: "grayscale(1) contrast(1.15)", x: 0.55, y: 0.42, texto: "Sin color se ve la estructura: una diagonal clara que cruza un fondo casi negro." },
  { id: "sombra", titulo: "Levantar sombras", filtro: "brightness(2.1) contrast(0.8) saturate(0.9)", x: 0.88, y: 0.6, texto: "Si se levantan las sombras aparece lo que el negro esconde: la escalera, las figuras de la derecha y los pliegues." },
];

/** Medido sobre la reproducción (tonos de gris, 0–100): fracción casi negra y fracción clara. */
export const MEDIDAS = { oscuro: 55, claro: 7 };

export const DOCUMENTADO = [
  "Es el panel central de un tríptico: las alas interiores muestran La Visitación y La Presentación en el Templo, y San Cristóbal aparece en el exterior.",
  "Óleo sobre tabla de 421 × 311 cm, fechado en 1611–1614 por la Catedral de Nuestra Señora de Amberes, donde se conserva.",
  "Lo encargó la cofradía de los arcabuceros de Amberes en 1611; su patrón era San Cristóbal.",
  "Las tropas francesas lo llevaron al Louvre en 1794 y volvió a la catedral en 1815.",
  "San Juan, de rojo, y la Virgen, de azul, son identificaciones tradicionales; el cuadro no lleva rótulos.",
];

export const INTERPRETACION = [
  "La «gran diagonal» es una lectura de composición de esta página: el cuadro no marca ninguna línea.",
  "Que el cuerpo «cuelgue del paño» es lo que se ve; la intención de Rubens no está documentada.",
  "Las lecturas de luz son filtros sobre la reproducción: muestran la estructura tonal, no la pintura original.",
  "Se ha relacionado la composición con modelos italianos que Rubens conoció; no se afirma aquí una fuente concreta.",
];

export const CREDITOS = {
  imagen: "Reproducción: Peter Paul Rubens, El descendimiento de la cruz (panel central, Catedral de Amberes), vía Wikimedia Commons (ficha con enlace a BALAT, KIK-IRPA). Redimensionada y convertida a WebP.",
  nota: "La pintura (1611–1614) es de dominio público. Wikimedia Commons marca esta reproducción como dominio público, pero esa marca no sustituye una licencia del titular de la fotografía.",
  fuentes: [
    { label: "Rubens: El descendimiento de la cruz — Catedral de Amberes", href: "https://www.dekathedraal.be/en/rubens-descent-cross" },
    { label: "Archivo en Wikimedia Commons", href: "https://commons.wikimedia.org/wiki/File:Peter_Paul_Rubens_-_The_Descent_from_the_Cross_(Antwerp_Cathedral).jpg" },
    { label: "BALAT, KIK-IRPA", href: "https://balat.kikirpa.be/object/7598" },
  ],
};
