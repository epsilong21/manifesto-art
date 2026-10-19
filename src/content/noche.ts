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
