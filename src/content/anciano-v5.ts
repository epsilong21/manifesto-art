/**
 * El anciano de los días · V5 (prototipo del Acto I): textos y línea de tiempo.
 * Recorrido previsto: Prólogo (la pintura) → Acto I → Acto II → Acto III → Epílogo. Aquí solo existen el prólogo y el Acto I.
 */

/** Pantallas de scroll por tramo (escritorio / móvil): [prólogo, Acto I, Acto II, Acto III]. */
export const DURACION_V5 = {
  escritorio: [3.0, 5.2, 5.6, 6.2] as const,
  movil: [2.6, 4.6, 4.9, 5.4] as const,
};

export const TRAMOS_V5 = [
  { n: 1, kicker: "Prólogo", titulo: "La pintura" },
  { n: 2, kicker: "Acto I", titulo: "El nacimiento de la medida" },
  { n: 3, kicker: "Acto II", titulo: "La arquitectura del orden" },
  { n: 4, kicker: "Acto III", titulo: "El universo imposible" },
] as const;

export type FragmentoV5 = {
  tramo: 1 | 2 | 3 | 4;
  /** Progreso local (0–1) del tramo a partir del cual se muestra. */
  desde: number;
  tipo: "doc" | "int";
  etiqueta: string;
  momento: string;
  texto: string;
};

export const FRAGMENTOS_V5: FragmentoV5[] = [
  { tramo: 1, desde: 0, tipo: "doc", etiqueta: "Documentado", momento: "El despertar", texto: "Un anciano de barba y cabellos blancos se inclina desde un disco de luz y extiende un compás hacia la oscuridad. Es el frontispicio de Europe: a Prophecy, un libro ilustrado de William Blake de 1794." },
  { tramo: 1, desde: 0.22, tipo: "doc", etiqueta: "Documentado", momento: "La presencia", texto: "Es Urizen, personaje de la mitología propia de Blake. Aunque recuerda a un dios creador, encarna la razón que fija límites. El nombre «El anciano de los días» se usa mucho, pero no lo puso Blake." },
  { tramo: 1, desde: 0.58, tipo: "doc", etiqueta: "Documentado · lectura de un especialista", momento: "El instrumento", texto: "Con el compás, Urizen delimita el mundo material en el momento de la creación. Para el crítico Anthony Blunt es la razón imponiendo orden sobre el caos." },
  { tramo: 1, desde: 0.86, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El instrumento", texto: "Medir es poner un límite. MANIFESTO sigue la luz hasta las puntas del compás: de ahí nace lo que viene." },
  { tramo: 2, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El vacío recibe luz", texto: "En la lámina el compás está quieto. Aquí, MANIFESTO lo imagina trazando: la oscuridad recibe su primera línea." },
  { tramo: 2, desde: 0.1, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El primer círculo", texto: "Una punta se queda fija y la otra gira. Medir es dibujar un límite." },
  { tramo: 2, desde: 0.3, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La profundidad", texto: "El círculo no estaba solo. Detrás aparecen otros, cada vez más lejos: la medida no es un plano, es un espacio." },
  { tramo: 2, desde: 0.55, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El observatorio", texto: "Ejes, planos suspendidos y órbitas se levantan alrededor del primer trazo: una arquitectura gigantesca que nadie construyó. Es una creación visual de MANIFESTO, no una escena de Blake." },
  { tramo: 2, desde: 0.84, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "Contemplación", texto: "Todo queda en suspenso. Inclina los anillos o gira la vista: la estructura cambia según desde dónde se mida." },
  { tramo: 3, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El observatorio despierta", texto: "Lo que parecía quieto empieza a girar. Los anillos no se mueven al azar: cada uno obedece a los demás." },
  { tramo: 3, desde: 0.2, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La maquinaria del orden", texto: "La cámara avanza entre anillos cada vez mayores. Lo que se veía era solo una parte: forman un sistema mucho más grande." },
  { tramo: 3, desde: 0.5, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El centro de la medida", texto: "Todo se organiza alrededor de un núcleo. Abre la arquitectura y verás cómo se sostiene: cada nivel depende del centro." },
  { tramo: 3, desde: 0.76, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El límite del orden", texto: "Es el momento de mayor perfección: nada sobra y todo encaja. Y, sin embargo, algo empieza a tensarse." },
  { tramo: 4, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La primera contradicción", texto: "Un anillo gira en un sentido que no le corresponde. Los ejes dejan de alinearse y la luz empieza a comportarse de otra manera." },
  { tramo: 4, desde: 0.25, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La geometría desobedece", texto: "Los anillos se atraviesan sin romperse y los planos se pliegan hacia donde no hay espacio. Cada figura es posible por separado; juntas, no." },
  { tramo: 4, desde: 0.55, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El espacio imposible", texto: "Una puerta de luz contiene más espacio del que la rodea. Desplaza el plano: un gesto mínimo cambia por completo lo que hay dentro." },
  { tramo: 4, desde: 0.82, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El límite de la medida", texto: "Desde un único punto de vista todo encaja. Desde cualquier otro, no. La medida llega hasta aquí." },
];

export const AMPLIADO_V5: Record<1 | 2 | 3 | 4, { documentado: string[]; interpretacion: string[] }> = {
  1: {
    documentado: [
      "La imagen abre Europe: a Prophecy (Lambeth, 1794) y muestra a Urizen midiendo el mundo material con un enorme compás, según la Universidad de Glasgow.",
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
      "Los círculos, los ejes, los planos y los anillos son geometrías luminosas imaginadas por MANIFESTO a partir del gesto de medir. No existen en la lámina ni la modifican: la pintura se desvanece sin alterarse y puede verse entera en cualquier momento.",
    ],
  },
  3: {
    documentado: [
      "Según la Universidad de Glasgow, Urizen encarna la razón que fija límites; en Europe: a Prophecy esa razón organiza el mundo material con un compás.",
    ],
    interpretacion: [
      "Los anillos colosales, los cables, los satélites y el núcleo son geometrías imaginadas por MANIFESTO para pensar qué sería un sistema regido solo por la medida. No están en la lámina de Blake ni son una lectura documentada de ella.",
    ],
  },
  4: {
    documentado: [
      "Según Anthony Blunt (citado por Glasgow), Blake critica un orden racional que reduce lo infinito a lo finito. Es una lectura de especialistas, no un hecho cerrado.",
    ],
    interpretacion: [
      "El triángulo que solo se cierra desde un punto de vista (inspirado en las figuras imposibles, como el triángulo de Penrose), el nudo, los planos plegados y el portal son geometrías creadas por MANIFESTO. No están en la lámina de Blake ni son una lectura documentada de ella.",
    ],
  },
};
