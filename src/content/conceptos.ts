/** Las cinco obras de MANIFESTO: catálogo /conceptos, portada y navegación global. */

export type Concepto = {
  slug: "medusa" | "noche-estrellada" | "los-elefantes" | "basquiat-untitled" | "glenn";
  numero: string;
  titulo: string;
  /** Nombre corto para la navegación. */
  corto: string;
  autor: string;
  anio: string;
  /** Lo que la obra pone en juego. */
  idea: string;
  /** Pregunta breve que abre la obra. */
  pregunta: string;
  /** El gesto que propone la experiencia, en infinitivo. */
  gesto: string;
  /** Mecánica principal, como invitación. */
  interaccion: string;
  descripcion: string;
  /** Otra obra con la que dialoga (p. ej. del mismo artista): el pie de la obra la enlaza. */
  relacionada?: Concepto["slug"];
};

export const CONCEPTOS: Concepto[] = [
  {
    slug: "medusa",
    numero: "01",
    titulo: "Medusa",
    corto: "Medusa",
    autor: "Caravaggio",
    anio: "hacia 1597–1598",
    idea: "La mirada, el miedo y la transformación",
    pregunta: "¿Te atreverías a sostenerle la mirada?",
    gesto: "Inclinar",
    interaccion: "Inclina el escudo. Desafía su mirada.",
    descripcion:
      "Un escudo de madera con una cabeza que grita. Muévelo, abre sus cinco expedientes y descubre por qué nadie debía mirarla de frente.",
  },
  {
    slug: "noche-estrellada",
    numero: "02",
    titulo: "La noche estrellada",
    corto: "La noche estrellada",
    autor: "Vincent van Gogh",
    anio: "1889",
    idea: "Movimiento, contemplación y naturaleza",
    pregunta: "¿Qué vio Van Gogh desde su ventana y qué imaginó?",
    gesto: "Observar",
    interaccion: "Observa cómo respira el cielo.",
    descripcion:
      "Un cielo que se mueve bajo tu dedo. Separa lo que el pintor observó en Saint-Rémy de lo que añadió su imaginación.",
  },
  {
    slug: "los-elefantes",
    numero: "03",
    titulo: "Los elefantes",
    corto: "Los elefantes",
    autor: "Salvador Dalí",
    anio: "1948",
    idea: "Simbolismo, contradicción, peso y fragilidad",
    pregunta: "¿Cómo se sostiene lo que no debería sostenerse?",
    gesto: "Descifrar",
    interaccion: "Descifra sus cinco misterios.",
    descripcion:
      "Toneladas sobre patas de alambre. Recorre la pintura en cinco capítulos: escala, equilibrio, obeliscos, peso y vacío.",
  },
  {
    slug: "basquiat-untitled",
    numero: "04",
    titulo: "Untitled",
    corto: "Untitled",
    autor: "Jean-Michel Basquiat",
    anio: "1981",
    idea: "Identidad, anatomía y ruido",
    pregunta: "¿Es un cráneo, un rostro o una máscara?",
    gesto: "Examinar",
    interaccion: "Examina la cabeza capa a capa.",
    descripcion:
      "Una cabeza llena de ruido. Separa sus cuatro capas, abre cinco hallazgos y decide cuál de las tres lecturas te convence.",
    relacionada: "glenn",
  },
  {
    slug: "glenn",
    numero: "05",
    titulo: "Glenn",
    corto: "Glenn",
    autor: "Jean-Michel Basquiat",
    anio: "1984–1985",
    idea: "Máscara, copia y archivo",
    pregunta: "¿Es un retrato, una máscara o un archivo?",
    gesto: "Ampliar",
    interaccion: "Amplía la máscara y fotocopia el muro.",
    descripcion:
      "Una máscara negra sobre un muro de fotocopias. Abre cinco hallazgos, separa figura y fondo, pásala por la fotocopiadora y elige entre tres lecturas.",
    relacionada: "basquiat-untitled",
  },
];
