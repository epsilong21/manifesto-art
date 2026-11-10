/** El anciano de los días (Blake, 1794): datos, textos y línea de tiempo de la instalación de tres escenas. */

export const ANCIANO_IMG = {
  base: "/anciano/anciano",
  anchos: [700, 1400, 2100] as const,
  width: 1400,
  height: 1934,
  /** Alto / ancho de la reproducción (4109 × 2975 px en el original). */
  ratio: 4109 / 2975,
  alt: "Urizen, un anciano de barba y cabellos blancos, se inclina desde un disco de luz dorada y extiende un compás hacia la oscuridad.",
};

/** Puntos de interés en fracciones de la imagen (0–1 desde arriba/izquierda), medidos sobre la reproducción. */
export const PUNTOS = {
  urizen: { x: 0.46, y: 0.36 },
  /** Centro del tramo de compás visible. */
  compas: { x: 0.5125, y: 0.82 },
  /** Puntas del compás: la izquierda es el centro del primer círculo y la derecha fija el radio. */
  puntaIzq: { x: 0.155, y: 0.954 },
  puntaDer: { x: 0.867, y: 0.945 },
};

/**
 * Duración de cada escena en pantallas de scroll (escritorio / móvil). Es lo único que hay que tocar
 * para alargar o acortar el recorrido: el resto de la progresión se reparte en proporción.
 */
export const DURACION = {
  escritorio: [2.6, 3.1, 2.0] as const,
  movil: [2.2, 2.6, 1.7] as const,
};

export type Fragmento = {
  escena: 1 | 2 | 3;
  /** Progreso local (0–1) de su escena a partir del cual se muestra. */
  desde: number;
  tipo: "doc" | "int";
  etiqueta: string;
  texto: string;
};

export const ESCENAS = [
  { n: 1, kicker: "Escena 01", titulo: "La revelación" },
  { n: 2, kicker: "Escena 02", titulo: "El límite" },
  { n: 3, kicker: "Escena 03", titulo: "Más allá de la medida" },
] as const;

export const FRAGMENTOS: Fragmento[] = [
  { escena: 1, desde: 0, tipo: "doc", etiqueta: "Documentado", texto: "Un anciano de barba y cabellos blancos se inclina desde un disco de luz y extiende un compás hacia la oscuridad. Es el frontispicio de Europe: a Prophecy, un libro ilustrado de William Blake de 1794." },
  { escena: 1, desde: 0.3, tipo: "doc", etiqueta: "Documentado", texto: "Es Urizen, personaje de la mitología propia de Blake. Aunque recuerda a un dios creador, encarna la razón que fija límites. El nombre «El anciano de los días» se usa mucho, pero no lo puso Blake." },
  { escena: 1, desde: 0.66, tipo: "doc", etiqueta: "Documentado · lectura de un especialista", texto: "Con el compás, Urizen delimita el mundo material en el momento de la creación. Para el crítico Anthony Blunt es la razón imponiendo orden sobre el caos." },
  { escena: 2, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", texto: "En la lámina el compás está quieto. Aquí, MANIFESTO lo imagina trazando: aparece una línea dorada entre sus dos puntas." },
  { escena: 2, desde: 0.14, tipo: "int", etiqueta: "Interpretación de MANIFESTO", texto: "Una punta se queda fija y la otra gira. El compás da una vuelta completa y deja un círculo: medir es dibujar un límite." },
  { escena: 2, desde: 0.5, tipo: "int", etiqueta: "Interpretación de MANIFESTO", texto: "Llegan más círculos, radios y polígonos: un universo ordenado y contenido en límites exactos. Estas geometrías no están en la obra de Blake; son una creación visual de MANIFESTO." },
  { escena: 3, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", texto: "Las líneas pierden su exactitud, se rompen y se sueltan. Lo medido deja de obedecer a la regla y empieza a fluir." },
  { escena: 3, desde: 0.5, tipo: "int", etiqueta: "Pregunta original de MANIFESTO · no es una cita de Blake", texto: "¿Y si no todo necesitara una medida?" },
];

export type Ampliado = { documentado: string[]; interpretacion: string[] };

export const AMPLIADO: Record<1 | 2 | 3, Ampliado> = {
  1: {
    documentado: [
      "La imagen abre Europe: a Prophecy (Lambeth, 1794) y muestra a Urizen midiendo el mundo material con un enorme compás, según la Universidad de Glasgow.",
      "Blake construyó una mitología propia. Según Martin Butler, citado por Glasgow, dividió la naturaleza humana en cuatro personajes: Los (la imaginación), Urizen (la razón), Luvah (los sentidos) y Tharmas (las emociones).",
      "Esta es la copia D del British Museum. La obra es de dominio público: Blake murió en 1827.",
    ],
    interpretacion: [
      "Una lectura gnóstica que recoge Glasgow ve a Urizen como un demiurgo —un creador subordinado— y no como un dios benévolo. Es una interpretación de especialistas, no un hecho cerrado.",
    ],
  },
  2: {
    documentado: [
      "Según Anthony Blunt (citado por Glasgow), la imagen resume lo que Blake critica en Europe: un orden racional impuesto al caos, lo infinito reducido a lo finito y, con ello, la imaginación destruida.",
    ],
    interpretacion: [
      "El círculo, los radios, las rosetas y las marcas son geometrías luminosas imaginadas por MANIFESTO a partir del gesto de medir. No existen en la lámina ni la modifican: la pintura se desvanece sin alterarse y puede verse entera en cualquier momento.",
    ],
  },
  3: {
    documentado: [
      "En la mitología de Blake, Los —la imaginación— es la posible fuente de redención frente a la razón de Urizen (Butler, citado por Glasgow).",
    ],
    interpretacion: [
      "La disolución de las líneas es una metáfora visual de MANIFESTO. La pregunta final es nuestra: no pretende cerrar la lectura de la obra de Blake ni atribuirle una frase.",
    ],
  },
};

export const DOCUMENTADO = [
  "El anciano de los días es el frontispicio de Europe: a Prophecy, publicado por William Blake en 1794 (Lambeth).",
  "Muestra a Urizen, un personaje de la mitología de Blake, usando un enorme compás para delimitar el mundo material en el momento de la creación.",
  "El título «The Ancient of Days» se usa con frecuencia, pero Blake no lo puso.",
  "Blake (1757–1827) hizo de Urizen la razón; Los, la imaginación, es en su mitología la fuente posible de redención.",
  "La imagen usada es la copia D, objeto 1, del British Museum (P_1859-0625-72), de dominio público.",
];

export const INTERPRETACION = [
  "Leer el compás como la razón que impone orden sobre el caos es una interpretación de especialistas (Anthony Blunt), no un hecho.",
  "La lectura gnóstica de Urizen como demiurgo es otra interpretación recogida por la Universidad de Glasgow.",
  "Las geometrías luminosas de la escena 02 y su disolución en la escena 03 son una creación visual de MANIFESTO; no están en la obra.",
  "«¿Y si no todo necesitara una medida?» es una pregunta original de MANIFESTO, no una cita de Blake.",
];

export const CREDITOS = {
  imagen: "William Blake, frontispicio de Europe: a Prophecy, copia D, objeto 1 (1794). British Museum, P_1859-0625-72. Reproducción fotográfica publicada en Wikimedia Commons.",
  nota: "Dominio público: Blake murió en 1827 y Commons considera libres las reproducciones fieles de obras bidimensionales. La imagen solo se ha redimensionado (WebP); no se recorta ni se retoca. Los efectos son capas independientes creadas por MANIFESTO.",
  fuentes: [
    { label: "University of Glasgow Library — Europe: a Prophecy (2007)", href: "https://www.gla.ac.uk/myglasgow/library/files/special/exhibns/month/nov2007.html" },
    { label: "British Museum — registro de la copia D", href: "https://www.britishmuseum.org/collection/object/P_1859-0625-72" },
    { label: "Wikimedia Commons — Europe a Prophecy, copy D, object 1", href: "https://commons.wikimedia.org/wiki/File:Europe_a_Prophecy,_copy_D,_object_1_(Bentley_1,_Erdman_i,_Keynes_i)_British_Museum.jpg" },
  ],
};
