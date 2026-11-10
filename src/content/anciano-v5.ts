/**
 * El anciano de los días · V5: textos y línea de tiempo.
 * Recorrido: Prólogo (la pintura) → Acto I → Acto II → Acto III → Epílogo.
 */

/** Pantallas de scroll por tramo (escritorio / móvil): [prólogo, Acto I, Acto II, Acto III, epílogo]. */
export const DURACION_V5 = {
  escritorio: [3.0, 5.2, 5.6, 6.2, 3.8] as const,
  movil: [2.6, 4.6, 4.9, 5.4, 3.4] as const,
};

export const TRAMOS_V5 = [
  { n: 1, kicker: "Prólogo", titulo: "La pintura" },
  { n: 2, kicker: "Acto I", titulo: "El nacimiento de la medida" },
  { n: 3, kicker: "Acto II", titulo: "La arquitectura del orden" },
  { n: 4, kicker: "Acto III", titulo: "El universo imposible" },
  { n: 5, kicker: "Epílogo", titulo: "Lo que no puede medirse" },
] as const;

export type FragmentoV5 = {
  tramo: 1 | 2 | 3 | 4 | 5;
  /** Progreso local (0–1) del tramo a partir del cual se muestra. */
  desde: number;
  tipo: "doc" | "int";
  etiqueta: string;
  momento: string;
  texto: string;
  /** Instrucción contextual: solo aparece cuando el control que menciona ya está disponible */
  ayuda?: string;
};

/** Progreso local del tramo desde el que el mando específico (Abrir la arquitectura / Desplazar el plano) está disponible: cuando su efecto ya se ve. */
export const ESPECIFICO_DESDE = { 3: 0.5, 4: 0.55 } as const;

export const FRAGMENTOS_V5: FragmentoV5[] = [
  { tramo: 1, desde: 0, tipo: "doc", etiqueta: "Documentado", momento: "El despertar", texto: "Un anciano de barba y cabellos blancos se inclina desde un disco de luz y extiende un compás hacia la oscuridad. Es el frontispicio de Europe: a Prophecy, un libro ilustrado de William Blake de 1794." },
  { tramo: 1, desde: 0.22, tipo: "doc", etiqueta: "Documentado", momento: "La presencia", texto: "Es Urizen, personaje de la mitología propia de Blake. Aunque recuerda a un dios creador, encarna la razón que fija límites. El nombre «El anciano de los días» se usa mucho, pero no lo puso Blake." },
  { tramo: 1, desde: 0.58, tipo: "doc", etiqueta: "Documentado · lectura de un especialista", momento: "El instrumento", texto: "Con el compás, Urizen delimita el mundo material en el momento de la creación. Para el crítico Anthony Blunt es la razón imponiendo orden sobre el caos." },
  { tramo: 1, desde: 0.86, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El instrumento", texto: "Medir es poner un límite. MANIFESTO sigue la luz hasta las puntas del compás: de ahí nace lo que viene." },
  { tramo: 2, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El vacío recibe luz", texto: "En la lámina el compás está quieto. Aquí, MANIFESTO lo imagina trazando: la oscuridad recibe su primera línea." },
  { tramo: 2, desde: 0.1, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El primer círculo", texto: "Una punta se queda fija y la otra gira. Medir es dibujar un límite." },
  { tramo: 2, desde: 0.3, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La profundidad", texto: "El círculo no estaba solo. Detrás aparecen otros, cada vez más lejos: la medida no es un plano, es un espacio." },
  { tramo: 2, desde: 0.55, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El observatorio", texto: "Ejes, planos suspendidos y órbitas se levantan alrededor del primer trazo: una arquitectura gigantesca que nadie construyó. Es una creación visual de MANIFESTO, no una escena de Blake.", ayuda: "Ya puedes inclinar los anillos o girar la vista con los mandos de abajo." },
  { tramo: 2, desde: 0.84, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "Contemplación", texto: "Todo queda en suspenso. Inclina los anillos o gira la vista: la estructura cambia según desde dónde se mida." },
  { tramo: 3, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El observatorio despierta", texto: "Lo que parecía quieto empieza a girar. Los anillos no se mueven al azar: cada uno obedece a los demás." },
  { tramo: 3, desde: 0.2, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La maquinaria del orden", texto: "La cámara avanza entre anillos cada vez mayores. Lo que se veía era solo una parte: forman un sistema mucho más grande." },
  { tramo: 3, desde: 0.5, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El centro de la medida", texto: "Todo se organiza alrededor de un núcleo: cada nivel de la arquitectura depende del centro.", ayuda: "Abre la arquitectura y observa cómo se separan los niveles alrededor del núcleo." },
  { tramo: 3, desde: 0.76, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El límite del orden", texto: "Es el momento de mayor perfección: nada sobra y todo encaja. Y, sin embargo, algo empieza a tensarse." },
  { tramo: 4, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La primera contradicción", texto: "Un anillo gira en un sentido que no le corresponde. Los ejes dejan de alinearse y la luz empieza a comportarse de otra manera.", ayuda: "Gira la vista: mira el anillo que invierte su giro y el eje que se curva." },
  { tramo: 4, desde: 0.25, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La geometría desobedece", texto: "Los anillos se atraviesan sin romperse y los planos se pliegan hacia donde no hay espacio. Cada figura es posible por separado; juntas, no.", ayuda: "Busca los planos que se doblan por una línea brillante." },
  { tramo: 4, desde: 0.55, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El espacio imposible", texto: "Una puerta de luz contiene más espacio del que la rodea: dentro está el mismo universo, visto desde otro lado.", ayuda: "Desplaza el plano y observa cómo cambia el universo dentro del portal." },
  { tramo: 4, desde: 0.82, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El límite de la medida", texto: "Desde un único punto de vista todo encaja. Desde cualquier otro, no. La medida llega hasta aquí.", ayuda: "Gira la vista: el triángulo solo se cierra desde un punto de vista." },
  { tramo: 5, desde: 0, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "La última perspectiva", texto: "La cámara se retira. Lo que parecía el mundo entero es un solo trazo y, por encima, en la oscuridad, aparece un punto de luz." },
  { tramo: 5, desde: 0.36, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "El límite de la creación", texto: "Dos brazos descienden hasta el círculo del principio: es el gesto del compás, a la escala de un universo. Pero la punta no llega a tocarlo." },
  { tramo: 5, desde: 0.66, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "Lo que permanece", texto: "Nada se apaga. Toda esta estructura es la huella del gesto de medir: completa y extraordinaria, y aun así queda un hueco que ninguna medida alcanza.", ayuda: "Gira la vista para ver cómo las piezas se alinean y se separan." },
  { tramo: 5, desde: 0.9, tipo: "int", etiqueta: "Interpretación de MANIFESTO", momento: "Fin", texto: "Blake pintó a quien mide el mundo. MANIFESTO imaginó un universo que crece hasta no caber en su propia medida." },
];

export const AMPLIADO_V5: Record<1 | 2 | 3 | 4 | 5, { documentado: string[]; interpretacion: string[] }> = {
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
      "Qué ves: tras el orden perfecto del Acto II, la misma arquitectura empieza a desobedecerse. Un anillo gira al revés, el eje central se curva y una segunda luz carmesí llega del lado opuesto al núcleo.",
      "Los planos se doblan por una bisagra hacia donde no hay espacio y un anillo se atraviesa a sí mismo formando un nudo. Cada pieza es posible por separado; juntas, no.",
      "El portal es una puerta de luz que contiene la misma arquitectura vista desde otro lado y a otra escala. Al desplazar su plano, el interior cambia mucho más que el gesto: hay más espacio dentro que fuera.",
      "El triángulo solo se cierra desde un punto de vista (se inspira en las figuras imposibles, como el triángulo de Penrose). Al girar la vista se abre: la continuidad depende de desde dónde se mire.",
      "Todo esto, el triángulo, el nudo, los planos plegados y el portal, son geometrías creadas por MANIFESTO. No están en la lámina de Blake ni son una lectura documentada de ella.",
    ],
  },
  5: {
    documentado: [
      "Europe: a Prophecy (1794) es un libro ilustrado de William Blake: reúne poemas y grabados que él mismo coloreaba a mano. Su frontispicio es la imagen con la que empieza esta experiencia.",
      "La lámina muestra a Urizen en el instante de medir, con el compás extendido hacia la oscuridad. No muestra lo que ocurre después: ese final queda abierto.",
    ],
    interpretacion: [
      "El epílogo es una creación de MANIFESTO. La cámara se aleja y la arquitectura resulta ser la huella de un compás gigantesco: un punto de luz arriba, dos brazos que descienden y el círculo del principio. Es la imagen de la pintura llevada al tamaño de un universo.",
      "La punta no llega a tocar el círculo, y desde casi cualquier otro punto de vista las piezas no encajan. Es nuestra manera de pensar la crítica de Blake al orden racional, no una intención suya demostrada. La obra no da una respuesta: se queda en el misterio.",
    ],
  },
};

/**
 * Modo presentación («Ver presentación»): guion declarativo. Se ajusta aquí, sin tocar la lógica.
 * - duracion: segundos totales a 1× (60). El progreso avanza de forma lineal y constante, así que cada tramo ocupa un tiempo proporcional
 *   a su duración narrativa (DURACION_V5), sin pausas ni aceleraciones entre actos.
 * - viaje: parte de cada fragmento (la final) dedicada al desplazamiento hasta el fragmento siguiente; antes, la escena deriva muy despacio.
 * - controles: coreografía de cada mando como puntos [q, valor], con q = (tramo − 1) + progreso local del tramo (0 = prólogo … 5 = fin).
 *   Cada mando solo se mueve cuando ya existe en la narrativa (Inclinar desde q 1,55; Abrir desde 2,5; Desplazar el plano desde 3,55).
 */
export const PRESENTACION_V5 = {
  duracion: 60,
  velocidades: [0.75, 1, 1.25] as const,
  controles: {
    // Acto I: los anillos se inclinan al presentarse el observatorio
    tilt: [[1.55, 0], [1.66, 0], [1.78, 0.95], [1.92, 0.3], [2.0, 0]] as const,
    // Acto II: la arquitectura se abre y vuelve a cerrarse antes de la tensión final
    abre: [[2.48, 0], [2.6, 1], [2.82, 1], [2.95, 0]] as const,
    // Acto III: el plano del portal se desplaza cuando aparece el portal
    plano: [[3.56, 0.5], [3.66, 1], [3.74, 0.12], [3.82, 0.5]] as const,
    // Girar la vista: contemplación del Acto I, deriva del Acto II, primeras contradicciones, triángulo imposible y giro final del epílogo
    giro: [
      [1.8, 0], [1.92, 0.5], [2.0, 0],
      [2.12, 0], [2.3, 0.4], [2.55, -0.3], [2.8, 0.25], [2.95, 0],
      [3.08, 0], [3.24, 0.45], [3.42, -0.2], [3.54, 0],
      [3.84, 0], [3.9, 0.8], [3.96, -0.7], [4.0, 0],
      [4.1, 0], [4.35, 0.6], [4.65, -0.5], [4.9, 0.12], [5, 0.12],
    ] as const,
  },
};
