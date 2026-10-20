/**
 * La noche estrellada, Van Gogh. Contenido editorial.
 *
 * Fuente principal: ficha del MoMA (moma.org/collection/works/79802), que
 * distingue explícitamente observación e imaginación. Complemento: Historia Arte.
 */

export type Capa = "observacion" | "imaginacion";

export const NOCHE = {
  titulo: "La noche estrellada",
  autor: "Vincent van Gogh",
  vida: "Países Bajos, 1853–1890",
  fecha: "Saint-Rémy-de-Provence, junio de 1889",
  tecnica: "Óleo sobre lienzo",
  medidas: "73,7 × 92,1 cm",
  museo: "MoMA, Nueva York",
  inventario: "472.1941",
  credito: "Adquirida mediante el legado de Lillie P. Bliss (por intercambio)",
  imagen: {
    src: "/obras/noche-estrellada.jpg",
    width: 3000,
    height: 2376,
    alt: "La noche estrellada, de Van Gogh: un cielo azul agitado por remolinos, once estrellas con halos amarillos y una luna creciente arriba a la derecha. A la izquierda se alza un ciprés oscuro como una llama. Abajo, un pueblo con un campanario puntiagudo duerme entre colinas.",
  },
} as const;

export type DetalleNoche = {
  id: string;
  nombre: string;
  titulo: string;
  capa: Capa;
  x: number;
  y: number;
  zoom: number;
  /** Centro del encuadre, si no coincide con el punto (en % de la obra). */
  foco?: { x: number; y: number };
  texto: string;
  lectura?: string;
};

export const DETALLES_NOCHE: DetalleNoche[] = [
  {
    id: "luna",
    nombre: "La luna",
    titulo: "Una luna que sí estaba ahí",
    capa: "observacion",
    x: 91.5,
    y: 17,
    zoom: 2.1,
    texto:
      "Según el MoMA, el cielo está dominado por la luna brillante de la derecha. Algunos rasgos del cielo se reconstruyeron tal como se observaron.",
    lectura:
      "Su forma y su resplandor sí son de Van Gogh: el MoMA señala que alteró las formas celestes y añadió una sensación de brillo.",
  },
  {
    id: "venus",
    nombre: "Venus",
    titulo: "El lucero del centro",
    capa: "observacion",
    x: 35,
    y: 52,
    zoom: 2.2,
    texto:
      "El MoMA identifica la estrella grande a la izquierda del centro como Venus, visible desde la ventana del asilo de Saint-Paul-de-Mausole.",
  },
  {
    id: "remolino",
    nombre: "Las pinceladas",
    titulo: "El cielo que se mueve",
    capa: "imaginacion",
    x: 57,
    y: 38,
    zoom: 1.7,
    texto:
      "Azules y amarillos intensos aplicados con un gesto rápido y visible. El cielo en espiral no describe ningún fenómeno: es pintura que se muestra como pintura.",
    lectura:
      "Van Gogh dio a la noche y a la naturaleza un lenguaje emocional que las alejaba de su aspecto real.",
  },
  {
    id: "cipres",
    nombre: "El ciprés",
    titulo: "Más cerca de lo que estaba",
    capa: "imaginacion",
    x: 22,
    y: 62,
    // Encuadre más abierto y algo más alto: la silueta entera, de la tierra a la copa
    zoom: 1.2,
    foco: { x: 24, y: 45 },
    texto:
      "Según el MoMA, el ciprés de la izquierda aparece mucho más cerca de lo que estaba en realidad.",
    lectura:
      "Al acercarlo, el árbol une la tierra y el cielo como una llama oscura. Es el único elemento que cruza el horizonte.",
  },
  {
    id: "pueblo",
    nombre: "El pueblo",
    titulo: "Un pueblo que no se veía",
    capa: "imaginacion",
    x: 62,
    y: 86,
    zoom: 2,
    texto:
      "El pueblo bajo las colinas se basó en otras vistas: desde su ventana no podía verse. Además, la escena es nocturna, pero el cuadro se pintó en varias sesiones durante el día.",
    lectura:
      "Las casas, quietas y de trazos cortos, son el contrapunto estable al cielo en movimiento.",
  },
];

export const CAPAS: Record<Capa, { nombre: string; resumen: string }> = {
  observacion: {
    nombre: "Observación",
    resumen: "Lo que el MoMA considera visto desde la ventana: la luna, Venus y las colinas.",
  },
  imaginacion: {
    nombre: "Imaginación",
    resumen: "Lo que Van Gogh añadió, movió o transformó: el pueblo, el ciprés acercado y el cielo en espiral.",
  },
};

export const CONTEXTO_NOCHE: { id: string; titulo: string; texto: string }[] = [
  {
    id: "saint-remy",
    titulo: "Saint-Rémy, 1889",
    texto:
      "Van Gogh pasó doce meses, entre 1889 y 1890, en el asilo de Saint-Paul-de-Mausole, en Saint-Rémy-de-Provence, buscando alivio a su enfermedad mental. Allí pintó esta obra a mediados de junio de 1889.",
  },
  {
    id: "ventana",
    titulo: "La ventana",
    texto:
      "El punto de partida fue la vista desde su ventana. La visión era nocturna, pero el cuadro se pintó de día y en varias sesiones, con una luz y un clima muy distintos.",
  },
  {
    id: "postimpresionismo",
    titulo: "Postimpresionismo",
    texto:
      "Para el MoMA, la obra anuncia la apertura de la pintura moderna al estado de ánimo, la expresión, el símbolo y el sentimiento. El color y la materia describen el mundo y, a la vez, se muestran como lo que son: color y pintura.",
  },
  {
    id: "hoy",
    titulo: "Dónde está hoy",
    texto:
      "En el Museum of Modern Art de Nueva York (inventario 472.1941). Llegó en 1941 mediante el legado de Lillie P. Bliss, por intercambio.",
  },
];

/* ─────────────────────────────────────────────────────────────
   V4 · Bajo el explorador: laboratorio, escala e interpretación.
   «hecho» = Documentado (con fuente); «lectura» = Interpretación.
   ───────────────────────────────────────────────────────────── */

type Tipo = "hecho" | "lectura";
export type Fuente = { label: string; href: string };

export const FUENTES_V4 = {
  wikipedia: { label: "Wikipedia: The Starry Night (fuente secundaria; cita las cartas 776 y 777)", href: "https://en.wikipedia.org/wiki/The_Starry_Night" },
  aragon: {
    label: "Aragón, Naumis, Bai, Torres y Maini (2008), J. Math. Imaging Vis. 30: 275–283",
    href: "https://doi.org/10.1007/s10851-007-0055-0",
  },
  ma: { label: "Ma, Cheng, Huang, Schmitt, Lin y Huang (2024), Physics of Fluids 36, 095140", href: "https://doi.org/10.1063/5.0213627" },
  riley: {
    label: "Riley y Gad-el-Hak (2025), Journal of Turbulence: réplica al estudio de 2024",
    href: "https://doi.org/10.1080/14685248.2025.2477244",
  },
  horizons: { label: "NASA JPL Horizons: distancia Tierra–Venus en junio de 1889", href: "https://ssd.jpl.nasa.gov/horizons/" },
  mausole: { label: "Wikipedia (fr): Monastère Saint-Paul-de-Mausole (coordenadas)", href: "https://fr.wikipedia.org/wiki/Monast%C3%A8re_Saint-Paul-de-Mausole" },
  proxima: { label: "Wikipedia: Proxima Centauri (fuente secundaria)", href: "https://en.wikipedia.org/wiki/Proxima_Centauri" },
} satisfies Record<string, Fuente>;

/** Laboratorio «Turbulencia»: qué dicen los estudios (con su debate) y qué muestra el modelo. */
export const TURBULENCIA = {
  estudios: [
    {
      id: "aragon",
      titulo: "2008 · Brillo turbulento",
      texto:
        "Aragón y colegas compararon cómo cambia el brillo entre puntos de varios cuadros del último periodo de Van Gogh con la estadística de la turbulencia de Kolmogorov, y encontraron un parecido.",
      fuente: FUENTES_V4.aragon,
    },
    {
      id: "ma",
      titulo: "2024 · Una cascada en el cielo",
      texto:
        "Ma y colegas analizaron 14 remolinos de La noche estrellada: en las escalas grandes, el brillo sigue la ley −5/3 de Kolmogorov; cerca del ancho de una pincelada, una ley −1 (Batchelor), que atribuyen a la mezcla de la pintura.",
      fuente: FUENTES_V4.ma,
    },
    {
      id: "riley",
      titulo: "2025 · La réplica",
      texto:
        "Riley y Gad-el-Hak lo discuten: el brillo de un cuadro no es una propiedad medible de un fluido, y el flujo supuesto no cumple las condiciones de la teoría. Para ellos, el cuadro es arte abstracto, no un registro de física.",
      fuente: FUENTES_V4.riley,
    },
  ],
  lectura:
    "El laboratorio no demuestra nada sobre el cuadro. Muestra en qué se parecen: el cielo pintado tiene remolinos grandes que contienen otros más pequeños, hasta el ancho de una pincelada, igual que una cascada turbulenta.",
  modelo:
    "Modelo de juguete de MANIFESTO, no una simulación de fluidos: capas de remolinos cada vez más pequeños, con velocidades en la proporción de Kolmogorov, que la viscosidad apaga por debajo de una escala mínima.",
  veredictos: {
    laminar: {
      nombre: "Laminar",
      texto: "Las líneas corren paralelas. Sin energía suficiente no aparecen remolinos: aquí el parecido con el cielo pintado se rompe por quietud.",
    },
    cascada: {
      nombre: "Cascada",
      texto: "Remolinos grandes que contienen otros más pequeños, sin bajar del ancho de una pincelada. En este rango el flujo se parece al cielo de Van Gogh.",
    },
    ruido: {
      nombre: "Ruido",
      texto: "La cascada sigue por debajo de la pincelada: ningún pincel podría pintar remolinos tan pequeños. Los grandes se deshacen en una maraña y el parecido se rompe por exceso.",
    },
  },
};

export type Parada = { id: string; nombre: string; m: number; valor: string; tipo: Tipo; texto: string };

/** Escala «De la ventana a Venus»: distancias desde la ventana del asilo, en metros. */
export const ESCALA_NOCHE: Parada[] = [
  {
    id: "cipres",
    nombre: "Los cipreses",
    m: 1e2,
    valor: "≈ 100 m",
    tipo: "lectura",
    texto: "Orden de magnitud estimado por MANIFESTO: estaban más allá del muro del campo de trigo cercado. En el cuadro, Van Gogh los acercó.",
  },
  {
    id: "pueblo",
    nombre: "Saint-Rémy",
    m: 1.4e3,
    valor: "≈ 1,4 km",
    tipo: "hecho",
    texto: "Del asilo a la colegiata de Saint-Martin, en línea recta. Desde la ventana no se veía: el pueblo del cuadro sale de un dibujo hecho desde una colina.",
  },
  {
    id: "venus",
    nombre: "Venus",
    m: 6.6e10,
    valor: "≈ 66 millones de km",
    tipo: "hecho",
    texto: "Su distancia a la Tierra el 6 de junio de 1889, la semana en que escribió que la había visto. Su luz tardaba unos 3,7 minutos en llegar.",
  },
  {
    id: "estrellas",
    nombre: "La estrella más cercana",
    m: 4.02e16,
    valor: "4,25 años luz",
    tipo: "hecho",
    texto: "Próxima Centauri, la estrella más cercana al Sol, es invisible a simple vista. Cualquier estrella que Van Gogh pudiera ver estaba todavía más lejos.",
  },
];

export type PuntoVentana = {
  id: "ventana" | "memoria" | "turbulencia" | "distancia";
  num: string;
  nombre: string;
  escena: string;
  hecho: string;
  lectura?: string;
  enlace?: { href: string; texto: string };
};

/**
 * «La ventana»: interpretación original de MANIFESTO, generada con código. No
 * reproduce ni imita la composición del cuadro: recompone la vista desde la
 * ventana del asilo (Día) en la del cuadro (Noche).
 */
export const VENTANA = {
  nombre: "La ventana",
  nota: "Escena original de MANIFESTO, generada con código. La noche evoca la recomposición del cuadro; no reproduce la pintura.",
  estados: {
    dia: "Día: la vista desde la ventana, tal como la describió. Un campo de trigo cercado, las colinas y el sol que sale por la derecha.",
    noche: "Noche: la vista recompuesta. El muro se retira, aparece un pueblo que no se veía, el ciprés se acerca hasta cruzar el horizonte y el cielo se pone en movimiento.",
  },
  puntos: [
    {
      id: "ventana",
      num: "01",
      nombre: "Ventana",
      escena: "La reja parte el paisaje en recuadros. Lo que cabe en ellos es lo que de verdad se veía desde la habitación.",
      hecho:
        "Su dormitorio, en el piso de arriba del asilo de Saint-Paul-de-Mausole, daba al este. «A través de la ventana con barrotes veo un cuadrado de trigo cercado… sobre el que, por la mañana, veo salir el sol en toda su gloria», escribió a Theo hacia el 23 de mayo de 1889 (carta 776). Pintó esa vista una veintena de veces.",
    },
    {
      id: "memoria",
      num: "02",
      nombre: "Memoria",
      escena: "Al pasar a Noche, el paisaje no se oscurece: se recompone. Aparece el pueblo, el ciprés se acerca y el cielo se mueve.",
      hecho:
        "En el dormitorio no le dejaban pintar: allí dibujaba a tinta o a carbón. Pintaba en un taller de la planta baja, y la escena nocturna se hizo en varias sesiones durante el día. El pueblo no se veía desde la ventana: sale de un dibujo hecho desde una colina sobre Saint-Rémy.",
      lectura:
        "No es exactamente pintar de memoria: se apoyaba en una vista que observó y dibujó muchas veces. Pero entre la ventana de arriba y el taller de abajo, la noche tenía que reconstruirse.",
    },
    {
      id: "turbulencia",
      num: "03",
      nombre: "Turbulencia",
      escena: "Aquí el cielo es un campo de corrientes generado con código: remolinos dentro de remolinos, no las espirales del cuadro.",
      hecho:
        "Dos estudios (2008 y 2024) encontraron en el brillo de sus cielos una estadística parecida a la de la turbulencia de Kolmogorov. Una réplica de 2025 sostiene que esa comparación no es válida.",
      lectura: "Lo que sí comparten es la forma: escalas grandes que contienen escalas pequeñas.",
      enlace: { href: "#turbulencia", texto: "Probarlo en el laboratorio" },
    },
    {
      id: "distancia",
      num: "04",
      nombre: "Distancia",
      escena: "El punto más brillante, sobre las colinas del este, es Venus: el lucero que se adelanta al sol.",
      hecho:
        "A principios de junio de 1889 escribió que había visto el campo desde su ventana mucho antes del amanecer, «sin nada más que la estrella de la mañana, que parecía muy grande» (carta 777). Venus estaba entonces a unos 66 millones de kilómetros.",
      lectura: "El cuadro aplana en una sola superficie un ciprés a cien metros y un planeta a millones de kilómetros.",
    },
  ] satisfies PuntoVentana[],
};
