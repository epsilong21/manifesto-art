/**
 * Cristo de San Juan de la Cruz (Dalí, 1951): El vértigo de lo divino.
 * Coordenadas x, y en fracciones de la reproducción (0–1 desde arriba/izquierda), medidas a mano
 * sobre esta misma imagen (800 × 1426). Los radios van en fracciones del ANCHO.
 */

export const DALI_IMG = {
  base: "/cristo-dali/cristo",
  anchos: [400, 800] as const,
  width: 800,
  height: 1426,
  /** Alto / ancho de la reproducción (el lienzo mide 204,8 × 115,9 cm: 1,77). */
  ratio: 1426 / 800,
  alt: "Cristo de San Juan de la Cruz, de Dalí: un Cristo crucificado visto desde arriba, con la cabeza inclinada y sin rostro visible, flota sobre una bahía de Port Lligat con una barca y dos pescadores bajo un cielo de nubes.",
};

export const DATOS: [string, string][] = [
  ["Artista", "Salvador Dalí"],
  ["Año", "1951"],
  ["Técnica", "Óleo sobre lienzo"],
  ["Dimensiones", "204,8 × 115,9 cm"],
  ["Colección", "Kelvingrove Art Gallery and Museum, Glasgow"],
  ["Adquisición", "Comprada al artista en 1952"],
];

export type Estado = "perspectiva" | "mundos" | "nucleo";
export const ESTADOS: { id: Estado; nombre: string; titulo: string }[] = [
  { id: "perspectiva", nombre: "La perspectiva imposible", titulo: "Mirar desde arriba" },
  { id: "mundos", nombre: "Dos mundos", titulo: "Entre la sombra y la bahía" },
  { id: "nucleo", nombre: "El núcleo y la cruz", titulo: "Un triángulo, un círculo, un átomo" },
];

/** Estado A: lo que explica cada tramo del punto de vista. */
export const PERSPECTIVA = {
  /** Elevación de la mirada (grados) en cada extremo del control. */
  min: 0,
  max: 74,
  /** Aproximación a la mirada de Dalí: no es una reconstrucción exacta. */
  dali: 58,
  tramos: [
    { hasta: 18, texto: "A ras de la cruz, es un crucificado de frente: dos brazos y un tronco vertical, como en cualquier cruz." },
    { hasta: 48, texto: "Al subir la mirada, el travesaño se aplana y el tronco empieza a alejarse: sus bordes convergen hacia abajo." },
    { hasta: 75, texto: "Casi desde arriba, el travesaño queda ancho y cercano, y el tronco huye hacia un punto de fuga bajo: es la mirada que elige el cuadro." },
  ],
  documentado: "Dalí contó que el cuadro nació de un dibujo de la crucifixión de San Juan de la Cruz, visto desde arriba, y de un sueño en el que Cristo flotaba sobre la bahía de Port Lligat. Según Glasgow, el modelo, un especialista de cine, posó colgado del techo.",
  interpretacion: "Esta escena es un modelo geométrico de MANIFESTO: una cruz de bloques vista desde distintas alturas. No reconstruye la figura ni calcula la perspectiva exacta del cuadro; sirve para ver por qué la mirada «desde arriba» hace caer el tronco y concentra la luz en el travesaño.",
};

/** Estado B: umbral entre los dos mundos y luminosidad medida (0–100) en 40 franjas de arriba abajo. */
export const UMBRAL = 0.62;
export const HORIZONTE = 0.878;
export const PERFIL_LUZ = [12,13,15,31,35,22,22,17,17,14,10,8,9,9,8,7,6,5,5,5,4,4,4,6,8,10,20,21,23,30,32,35,32,27,26,34,33,15,19,21];
export const MEDIDAS_MUNDOS = { arriba: 11, abajo: 24 };
export const MUNDOS = [
  { hasta: 0.4, nombre: "El espacio oscuro", texto: "Arriba, la cruz flota en un negro casi total. La única luz cae sobre el cuerpo y el travesaño; no hay suelo ni cielo." },
  { hasta: 0.64, nombre: "El umbral", texto: "El tronco se apaga justo donde empiezan las nubes. Allí termina la sombra y empieza el mundo que se puede habitar." },
  { hasta: 1.01, nombre: "La bahía de Port Lligat", texto: "Abajo, una bahía con una barca y dos pescadores, a una luz tranquila de atardecer. Es un lugar real, mirado desde muy arriba." },
];
export const MUNDOS_DOCUMENTADO = "Glasgow Life señala que el espectador mira a la vez hacia el agua y hacia abajo, sobre Cristo. Las figuras de los pescadores se basan en dos obras: un cuadro de Louis Le Nain y un estudio de Velázquez.";
export const MUNDOS_INTERPRETACION = "Que el cuadro sean «dos mundos» (el oscuro, el luminoso) es una lectura de esta página; el brillo es medido sobre la reproducción, no sobre el lienzo.";

/** Estado C: geometría sobre la reproducción (fracciones). */
export const NUCLEO = {
  manoIzq: { x: 0.125, y: 0.112 },
  manoDer: { x: 0.875, y: 0.109 },
  pies: { x: 0.504, y: 0.393 },
  cabeza: { x: 0.52, y: 0.302, r: 0.07 },
  ejeX: 0.5,
  ejeY: 0.112,
  pasos: [
    {
      id: "ejes",
      nombre: "Los ejes",
      texto: "Dos líneas se cruzan: el eje vertical del tronco y el horizontal de los brazos. Es la cruz reducida a su esquema.",
      tipo: "interpretacion" as const,
    },
    {
      id: "triangulo",
      nombre: "El triángulo",
      texto: "En un boceto preparatorio, un triángulo representa el cuerpo de Cristo. Aquí se apoya en las dos manos y en los pies.",
      tipo: "documentado" as const,
    },
    {
      id: "circulo",
      nombre: "El círculo",
      texto: "En el mismo boceto, un círculo ocupa el lugar de la cabeza. Aquí se traza sobre la cabeza inclinada, la única parte del rostro que no vemos.",
      tipo: "documentado" as const,
    },
    {
      id: "nucleo",
      nombre: "El núcleo",
      texto: "Dalí creía que Cristo representaba el núcleo del átomo y lo llamó «misticismo nuclear». Triángulo, círculo y ejes se reúnen en un solo punto.",
      tipo: "documentado" as const,
    },
  ],
  cita: "Dalí anotó bajo el boceto que en 1950 tuvo un «sueño cósmico» en el que vio esta imagen en color y que, en el sueño, representaba el núcleo del átomo. Después ese núcleo cobró para él un sentido metafísico: la unidad misma del universo, el Cristo.",
  citaFuente: "Paráfrasis de MANIFESTO a partir de la transcripción en inglés que da Glasgow Life de la nota de Dalí en el boceto PR.1980.18. No se ha localizado el texto original.",
  interpretacion: "El boceto es un documento; las líneas que se trazan sobre el cuadro acabado son de MANIFESTO. Dalí no marcó estas guías en la obra final, y la posición exacta del triángulo y del círculo sobre ella es una medida nuestra, no suya.",
};

export const DOCUMENTADO = [
  "Óleo sobre lienzo de 204,8 × 115,9 cm, pintado en 1951 y conservado en el Kelvingrove Art Gallery and Museum de Glasgow. Se compró directamente al artista en 1952.",
  "Dalí explicó que lo inspiró un dibujo de la crucifixión del carmelita San Juan de la Cruz, visto desde arriba, y un sueño en el que Cristo flotaba sobre Port Lligat. Una voz le dijo que debía pintar ese Cristo.",
  "En una primera versión, Cristo tenía sangre y heridas, pintadas como claveles rojos y jazmines blancos. Hacia el final, otro sueño le mostró la imagen sin ningún atributo tradicional: el cuerpo perfecto, sin heridas ni corona de espinas.",
  "El modelo fue el especialista de cine Russell Saunders, que posó colgado del techo. Dalí dijo que tardó unos cinco meses.",
  "Dalí asoció la imagen con su «misticismo nuclear» y con su Manifiesto místico: Cristo como núcleo del átomo. Un boceto del cuadro (PR.1980.18) usa un triángulo para el cuerpo y un círculo para la cabeza.",
  "La compra, defendida por el director de los museos de Glasgow, Tom Honeyman, provocó una fuerte polémica. En 2005 los escoceses lo votaron su cuadro favorito.",
];

export const INTERPRETACION = [
  "La escena de «La perspectiva imposible» es un modelo geométrico de MANIFESTO, no una reconstrucción del espacio del cuadro.",
  "Hablar de «dos mundos» (la sombra y la bahía) y del vértigo como experiencia de lo divino es una lectura de esta página.",
  "Las guías de triángulo, círculo y ejes sobre la pintura son de MANIFESTO; lo documentado es el boceto de Dalí y su idea del núcleo.",
  "La luminosidad que se mide aquí es la de la reproducción, no la del lienzo.",
];

export const CREDITOS = {
  imagen: "Reproducción: Cristo de San Juan de la Cruz, Salvador Dalí (1951), imagen publicada en el catálogo razonado en línea de la Fundació Gala-Salvador Dalí (800 × 1426 px; la ficha atribuye el crédito de la imagen a Glasgow City Council). Redimensionada y convertida a WebP. Obra © Salvador Dalí, Fundació Gala-Salvador Dalí / VEGAP.",
  nota: "La obra sigue protegida por derechos de autor. MANIFESTO no dispone de autorización de VEGAP ni de la Fundació Gala-Salvador Dalí, ni de Glasgow Life para la imagen: se muestra por decisión editorial de MANIFESTO S.A.S., con finalidad educativa y sin ánimo de lucro, y se retirará si lo solicita su titular. Consultas: manifesto.msto@gmail.com.",
  fuentes: [
    { label: "Fundació Gala-Salvador Dalí: ficha de «El Cristo» (catálogo razonado)", href: "https://catalogues.salvador-dali.org/catalogues/es/heritageobject/706/" },
    { label: "Glasgow Life: Salvador Dalí's Christ of St John of the Cross", href: "https://www.glasgowlife.org.uk/museums/digital-welcome-pack/kelvingrove-art-gallery-and-museum/salvador-dalis-christ-of-st-john-of-the-cross" },
    { label: "VEGAP: derechos de autor de Dalí", href: "https://www.vegap.es/" },
  ],
};
