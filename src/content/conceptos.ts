/** Las diez obras de MANIFESTO: catálogo /conceptos, portada y navegación global. */

export type Concepto = {
  slug:
    | "medusa"
    | "noche-estrellada"
    | "los-elefantes"
    | "basquiat-untitled"
    | "glenn"
    | "ascension-al-empireo"
    | "el-descendimiento-de-la-cruz"
    | "la-loca-meg"
    | "los-siete-pecados-capitales"
    | "cristo-de-san-juan-de-la-cruz";
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
  /** Color propio de la obra (el de su página): acento de su placa en el catálogo y la portada. */
  acento: string;
  /** Otra obra con la que dialoga (p. ej. del mismo artista): el pie de la obra la enlaza. */
  relacionada?: Concepto["slug"];
};

export const CONCEPTOS: Concepto[] = [
  {
    slug: "medusa",
    acento: "#b62632",
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
    acento: "#e0aa45",
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
    acento: "#dc9b65",
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
    acento: "#e8c33a",
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
    acento: "#d9482f",
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
  {
    slug: "ascension-al-empireo",
    acento: "#f1d7a0",
    numero: "06",
    titulo: "La ascensión al Empíreo",
    corto: "El Empíreo",
    autor: "El Bosco",
    anio: "hacia 1505–1515",
    idea: "Luz, ascenso y tránsito",
    pregunta: "¿Cuánta luz hace falta para llegar?",
    gesto: "Subir",
    interaccion: "Sube estación a estación y mide la luz.",
    descripcion: "Un túnel de luz al final de una subida en silencio. Cinco estaciones, de abajo arriba, para ver cuánta luz tiene cada tramo.",
  },
  {
    slug: "el-descendimiento-de-la-cruz",
    acento: "#c8372d",
    numero: "07",
    titulo: "El descendimiento de la cruz",
    corto: "El descendimiento",
    autor: "Peter Paul Rubens",
    anio: "1611–1614",
    idea: "Peso, diagonal y luz",
    pregunta: "¿Cuánto pesa la luz?",
    gesto: "Leer",
    interaccion: "Lee el cuadro por su diagonal, sus manos y su luz.",
    descripcion: "Un cuerpo baja sobre un paño blanco y toda la escena se ordena para sostenerlo. Tres lecturas: la línea, las manos y la luz.",
  },
  {
    slug: "la-loca-meg",
    acento: "#e0793a",
    numero: "08",
    titulo: "La loca Meg",
    corto: "La loca Meg",
    autor: "Pieter Bruegel el Viejo",
    anio: "1563",
    idea: "Caos, guerra y avaricia",
    pregunta: "¿Dónde mirar primero?",
    gesto: "Recorrer",
    interaccion: "Recorre cinco territorios y sigue las pistas.",
    descripcion: "Una mujer armada avanza hacia la boca del infierno mientras el cuadro se desordena. Cinco territorios, tres pistas y un cielo recuperado.",
  },
  {
    slug: "los-siete-pecados-capitales",
    acento: "#e0bb55",
    numero: "09",
    titulo: "Los siete pecados capitales",
    corto: "Los siete pecados",
    autor: "Atribuida a El Bosco",
    anio: "hacia 1505–1510",
    idea: "Vigilancia, pecado y juicio",
    pregunta: "¿Qué ve el ojo que todo lo ve?",
    gesto: "Mirar",
    interaccion: "Mira la mesa sector a sector, hasta el ojo.",
    descripcion: "Un ojo enorme, con Cristo en la pupila, vigila siete pecados y cuatro destinos. Recorre la mesa, los medallones y el ojo central.",
  },
  {
    slug: "cristo-de-san-juan-de-la-cruz",
    acento: "#dcb85c",
    numero: "10",
    titulo: "Cristo de San Juan de la Cruz",
    corto: "Cristo de San Juan",
    autor: "Salvador Dalí",
    anio: "1951",
    idea: "Vértigo, perspectiva y lo divino",
    pregunta: "¿Desde dónde miramos?",
    gesto: "Entrar",
    interaccion: "Cambia de punto de vista y entra en el cuadro.",
    descripcion: "Un crucificado sin rostro flota sobre una bahía tranquila. Una perspectiva imposible, dos mundos de luz y la geometría de un núcleo.",
  },
];
