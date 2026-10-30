/** Textos de «La gravedad invisible» (V7) y de la transición que la separa del análisis de la tabla. */

export const TRANSICION = {
  titulo: "Una interpretación de MANIFESTO",
  entrada: "Hasta aquí, la tabla de Rubens y lo que se puede ver en ella. Lo que sigue no está en el cuadro.",
  tabla: {
    etiqueta: "En la tabla",
    tipo: "Lo que se ve",
    texto: "Un cuerpo baja sobre un paño blanco. Varias figuras lo sostienen a la vez: desde la escalera, a los lados y, abajo, a los pies.",
  },
  sala: {
    etiqueta: "En esta sala",
    tipo: "Interpretación de MANIFESTO",
    texto: "Una escultura abstracta a partir de una sola idea, la de un peso que se reparte entre muchas manos: una tela, una carga de bronce y seis cuerdas. No hay figuras ni cruz, y ni la forma ni los materiales vienen de Rubens.",
  },
};

export type EstadoGravedad = "equilibrio" | "tension" | "desequilibrio" | "restaurado";

export const ESTADOS: Record<EstadoGravedad, { titulo: string; texto: string }> = {
  equilibrio: {
    titulo: "En equilibrio",
    texto: "Seis cuerdas sostienen una sola carga. Ninguna la lleva entera: el peso se reparte, y las del centro de los lados cargan más que las esquinas.",
  },
  tension: {
    titulo: "La tensión cambia",
    texto: "Al subir o bajar un apoyo, el peso no desaparece: se desplaza. Las cuerdas vecinas lo recogen y la carga busca el punto más bajo de la tela.",
  },
  desequilibrio: {
    titulo: "Desequilibrio",
    texto: "Una cuerda suelta deja su parte a las demás. La tela cede, la carga se recoloca y el conjunto encuentra otro equilibrio, más frágil.",
  },
  restaurado: {
    titulo: "Equilibrio restaurado",
    texto: "Todas las cuerdas vuelven a su largo y la tela recupera, poco a poco, la forma del principio.",
  },
};

export const NOTA_GRAVEDAD =
  "Escultura imaginada por MANIFESTO, no una obra de Rubens. La tela, las cuerdas y el reparto del peso son una simulación aproximada que se calcula en esta página.";
