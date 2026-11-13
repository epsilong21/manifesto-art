/** Crucifixion (1933), de Francis Bacon. Contenido de la ruta experimental /conceptos/crucifixion-bacon/v1. */

export const FICHA: [string, string][] = [
  ["Autor", "Francis Bacon"],
  ["Título", "Crucifixion"],
  ["Año", "1933"],
  ["Técnica", "Óleo sobre lienzo, 62 × 48,5 cm"],
  ["Catálogo razonado", "CR 33-01"],
  ["Paradero", "Colección privada (Murderme Collection)"],
];

/** Lo que se sostiene con fuente. Lo que no, va en INTERPRETACION_DOC. */
export const DOCUMENTADO = [
  "Es una de las primeras pinturas que Bacon dio por buenas: es un pintor de poco más de veinte años y todavía no es «Francis Bacon, el pintor». Años después descartaría gran parte de lo que hizo antes de 1944.",
  "Se reprodujo en Art Now, de Herbert Read (1933), frente a una obra de Picasso. Se expuso en la Mayor Gallery con el título Composition y la compró Sir Michael Sadler.",
  "El catálogo razonado la registra como CR 33-01. Ese mismo año Bacon pintó otras dos obras con el tema de la crucifixión.",
  "Es una pieza de formato pequeño: la figura es una forma ósea, pálida y sin rostro sobre un fondo oscuro, y no hay escena alrededor.",
];

export const INTERPRETACION_DOC = [
  "La crítica ha señalado la deuda con la figura central de Los tres bailarines (Picasso, 1925). Es una lectura formal, no una declaración de Bacon sobre este cuadro.",
  "Que el cuerpo sea «resto», «emblema» o «carne» es una lectura. Bacon decía que la crucifixión le interesaba como armazón para hablar de la carne y del cuerpo, no como asunto religioso.",
];

export type Acto = {
  id: "i" | "ii" | "iii";
  numero: string;
  titulo: string;
  /** Nombre corto para los botones en pantallas estrechas. */
  corto: string;
  /** Pista de acción, junto a la escena (visible sin bajar al texto). */
  pista: string;
  /** Una línea siempre visible: qué ocurre. */
  linea: string;
  /** Qué ves, qué hacer, por qué importa (ayuda contextual). */
  ves: string;
  haz: string;
  porque: string;
};

export const ACTOS: Acto[] = [
  {
    id: "i",
    numero: "I",
    titulo: "La aparición de la forma",
    corto: "Aparición",
    pista: "Desplaza la luz para revelar lo que permanece oculto.",
    linea: "Algo cuelga en la oscuridad. Todavía no se sabe qué.",
    ves: "Una masa que cuelga de un solo punto. La luz apenas roza sus bordes y sus pliegues.",
    haz: "Mueve la luz. Cada posición descubre otro volumen y desplaza su sombra en el muro.",
    porque: "No hay figura hasta que la luz decide dónde está. Aquí el cuerpo existe por lo que se le ilumina.",
  },
  {
    id: "ii",
    numero: "II",
    titulo: "La materia se abre",
    corto: "Apertura",
    pista: "Abre la materia y observa sus capas interiores.",
    linea: "La luz se ensancha y la forma enseña que tiene un adentro.",
    ves: "Una materia retorcida que una cuerda tira de lado, otra parte que cede por su peso y una grieta que se abre en bolsas desiguales, con capas por dentro.",
    haz: "Abre o cierra la materia con el control «Apertura». Sin dejar de mover la luz.",
    porque: "La herida no es un detalle: es el modo de leer la pieza. Cuanto más se abre, menos cuerpo y más soporte.",
  },
  {
    id: "iii",
    numero: "III",
    titulo: "El sacrificio sin altar",
    corto: "Sin altar",
    pista: "Baja la luz: la sombra crece. Abajo, un lugar que nadie ocupa.",
    linea: "No hay escena ni testigos. Solo un cuerpo-emblema y el vacío que lo rodea.",
    ves: "La luz viene de abajo y la sombra sube por el muro. Desde arriba, otra luz marca en el suelo un rectángulo vacío; solo la sombra del cuerpo entra en él.",
    haz: "Prueba a mover la luz hasta que la sombra pese más que la forma.",
    porque: "El altar está donde no hay nada. El sacrificio queda en la sombra y en el espacio que se deja vacío.",
  },
];

/** Etiquetas dinámicas de «qué observar» según la apertura (aria-live). */
export const ESTADOS_APERTURA = [
  "La materia resiste: la fisura apenas se insinúa.",
  "La materia cede: se ve el interior.",
  "La materia queda abierta: el cuerpo es ya soporte.",
];

/** Instalación I: la aparición (secuencia breve al llegar; se puede saltar y volver a ver). Una frase por momento. */
export const APARICION = {
  kicker: "Instalación I",
  titulo: "La materia del sacrificio",
  saltar: "Saltar y explorar",
  volver: "Volver a ver la aparición",
  momentos: ["Oscuridad.", "Algo cuelga.", "La luz lo encuentra.", "Tiene un adentro.", "La materia se abre.", "Queda la sombra."],
};

/** Umbral entre las dos instalaciones: el cuerpo se retira y deja su lugar. */
export const UMBRAL = {
  lineas: ["El cuerpo se retira.", "Queda el lugar que ocupaba.", "Y su sombra, repartida."],
};

/** Instalación II. */
export const NEGATIVO = {
  kicker: "Instalación II",
  titulo: "El negativo del cuerpo",
  linea: "Tres membranas cuelgan ante un muro. Ninguna contiene el cuerpo.",
  toque: "Arrastra los planos · mira el muro",
  ayuda: "Arrastra un plano a izquierda o derecha. Con teclado: elige plano (1, 2, 3 o ↑↓) y muévelo con ← →.",
  aria: "Tres planos suspendidos delante de un muro, iluminados desde abajo. Sus sombras se suman en el muro. Usa las flechas izquierda y derecha para mover el plano elegido; arriba y abajo para cambiar de plano.",
  planos: ["Delante", "En medio", "Al fondo"],
  reunir: "Reunir la figura",
  separar: "Separar los planos",
  encuentro: "Ningún plano lo contiene. Solo su sombra lo reúne.",
  encuentroSr: "Las tres sombras coinciden: en el muro aparece una figura suspendida.",
  sinCanvas: "Este navegador no puede dibujar la sala.",
};

/** Epílogo. */
export const EPILOGO = {
  titulo: "La forma que permanece",
  linea: "No queda el cuerpo. Queda el lugar donde la luz no pudo pasar.",
  volver: "Volver a la pintura",
};

export const COMPRENDER = {
  titulo: "Comprender lo que estoy viendo",
  bloques: [
    {
      k: "Documentado",
      t: "La pintura, su autor, el año, el formato y su historia son los de la ficha de arriba. Todo lo que está encima de «Una interpretación de MANIFESTO» procede de fuentes.",
    },
    {
      k: "Lectura de Bacon",
      t: "Tomamos de la obra tres rasgos: la figura sin rostro como forma ósea y pálida, el fondo oscuro que la deja sola y el uso de un tema religioso como armazón para hablar de la carne. Son lecturas nuestras, no afirmaciones del pintor.",
    },
    {
      k: "Construcción de MANIFESTO",
      t: "Las dos instalaciones son nuestras. La primera es una masa modelada en volumen y calculada en tiempo real, con una lámpara que puedes mover y una materia que se abre. La segunda son tres membranas cuyas sombras solo forman una figura en una posición concreta. Ninguna copia el cuadro ni lo traduce a 3D. No hay cruz: si aparece una, es solo sombra.",
    },
    {
      k: "El gesto principal",
      t: "Mover la luz es decidir qué parte del cuerpo existe; abrir la materia es decidir cuánto se deja ver de su interior. Tercer gesto: no ver el altar. El sacrificio está en lo que no se ilumina.",
    },
  ],
};

export const CREDITOS = {
  imagen:
    "Crucifixion (1933), Francis Bacon © The Estate of Francis Bacon. All rights reserved. Licencias de reproducción: DACS. La reproducción no se incluye: MANIFESTO no dispone de licencia ni autorización documentada, así que esta página usa un marcador de posición. Este aviso no concede derechos de reproducción ni constituye una excepción de copyright.",
  nota: "Las obras de terceros pertenecen a sus titulares. Las dos instalaciones, el umbral y el epílogo son interpretaciones independientes y originales de MANIFESTO, inspiradas en la obra y no realizadas ni avaladas por Francis Bacon ni por The Estate of Francis Bacon. Solicitudes de derechos, correcciones y retiradas: manifesto.msto@gmail.com.",
  fuentes: [
    { label: "The Estate of Francis Bacon: Crucifixion", href: "https://www.francis-bacon.com/artworks/paintings/crucifixion" },
    { label: "The Estate of Francis Bacon: derechos", href: "https://www.francis-bacon.com/rights" },
    { label: "DACS: Crucifixion, 1933", href: "https://www.dacs.org.uk/artwork/crucifixion-1933-3569" },
    { label: "Geist: Crucifixion, 1933 (ficha complementaria)", href: "https://geistmc.com/our-artists/francis-bacon/francis-bacon-originals/early-works/crucifixion-1933/" },
    { label: "Artchive: Crucifixion (1933)", href: "https://www.artchive.com/artwork/crucifixion-francis-bacon-1933/" },
    { label: "Wikipedia: Crucifixion (Francis Bacon, 1933)", href: "https://en.wikipedia.org/wiki/Crucifixion_(Francis_Bacon,_1933)" },
  ],
};
