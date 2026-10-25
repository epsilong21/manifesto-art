/**
 * Basquiat P3: «¿Qué estamos mirando?» (tres lecturas) y «El expediente».
 *
 * Cada lectura separa lo que se ve (Observación), lo que puede significar
 * (Interpretación) y lo que está documentado, con su fuente. Ninguna es «la
 * correcta»: la síntesis muestra por qué ninguna se sostiene sola.
 *
 * Fuentes consultadas el 23/10/2026. Las citas son traducciones de MANIFESTO.
 */

type Tipo = "hecho" | "lectura" | "observacion";
export type LecturaId = "craneo" | "rostro" | "mascara";
type Bloque = { tipo: Tipo; texto: string; fuente: string };

export type Lectura = {
  id: LecturaId;
  nombre: string;
  lema: string;
  /** La pregunta que esta lectura responde. */
  pregunta: string;
  /** Detalle de la pintura que acompaña a la lectura (x, y, ancho, alto en px de la reproducción). */
  recorte: [number, number, number, number];
  pieRecorte: string;
  bloques: Bloque[];
  /** Lo que esta lectura no explica: lo explica la siguiente. */
  limite: string;
};

const FICHA = "The Broad, ficha de la obra";
const AUDIOGUIA = "The Broad, audioguía";
const MANIFESTO = "Interpretación de MANIFESTO";

export const LECTURAS: Lectura[] = [
  {
    id: "craneo",
    nombre: "Cráneo",
    lema: "Lo que permanece",
    pregunta: "¿Qué queda de una cabeza?",
    recorte: [100, 630, 450, 450],
    pieRecorte: "Detalle: dientes y mandíbula",
    bloques: [
      {
        tipo: "observacion",
        texto:
          "Lo duro está dibujado con línea: los dientes, uno a uno; la mandíbula, cerrada en un trazo. Lo blando, la carne y el color, son manchas que no llegan a cubrirlo.",
        fuente: "Observación sobre la pintura",
      },
      {
        tipo: "lectura",
        texto:
          "Leída así, la pintura separa lo que dura de lo que pasa: la línea fija el hueso y la mancha anuncia lo que se irá. Es una lectura que evoca su nombre popular, «Skull», cuyo origen todavía está pendiente de cotejo.",
        fuente: MANIFESTO,
      },
      { tipo: "hecho", texto: "The Broad sitúa esta cabeza «en algún lugar entre la vida y la muerte».", fuente: FICHA },
      {
        tipo: "lectura",
        texto:
          "Basquiat murió en 1988, con veintisiete años. Ver el cuadro como un presagio es una lectura hecha después: nada en él la documenta.",
        fuente: "MANIFESTO; fecha y edad: The Broad, biografía del artista",
      },
    ],
    limite: "Un cráneo no mira. Este tiene un ojo abierto de par en par.",
  },
  {
    id: "rostro",
    nombre: "Rostro",
    lema: "Lo que expresa",
    pregunta: "¿Quién siente aquí?",
    recorte: [104, 440, 450, 450],
    pieRecorte: "Detalle: los ojos, la nariz y la boca",
    bloques: [
      {
        tipo: "observacion",
        texto:
          "La cabeza está de perfil, pero el ojo central está dibujado de frente, vuelto hacia quien mira. La boca, en cambio, no hace ningún gesto: hay dientes, pero no labios.",
        fuente: "Observación sobre la pintura",
      },
      {
        tipo: "lectura",
        texto:
          "Leída como rostro, la pintura retrata un estado más que a una persona: una mirada que busca al espectador y una boca que no le contesta.",
        fuente: MANIFESTO,
      },
      {
        tipo: "hecho",
        texto: "En 1981, el año del cuadro, Basquiat preparaba su primera individual en Nueva York, ante un mundo del arte mayoritariamente blanco.",
        fuente: `${AUDIOGUIA}; fecha de la exposición: MFA Boston`,
      },
      {
        tipo: "lectura",
        texto:
          "El museo propone ver la obra como una forma de autorretrato y relaciona su intensidad con la ansiedad de convertirse en un artista de éxito comercial. Es una hipótesis del museo, no una declaración del pintor.",
        fuente: FICHA,
      },
    ],
    limite: "Un rostro pide a alguien detrás. Que sea Basquiat nunca se ha verificado.",
  },
  {
    id: "mascara",
    nombre: "Máscara",
    lema: "Lo que oculta",
    pregunta: "¿Qué se enseña y qué se guarda?",
    recorte: [92, 184, 772, 772],
    pieRecorte: "Detalle: la cabeza entera, contra el fondo",
    bloques: [
      {
        tipo: "observacion",
        texto:
          "No hay sombra que dé volumen ni suelo donde apoyar la cabeza. Todo está en la superficie, plano, como una pieza recortada para ponerse delante de algo.",
        fuente: "Observación sobre la pintura",
      },
      {
        tipo: "lectura",
        texto:
          "Una máscara enseña una cara para guardar otra. Leída así, la pregunta deja de ser quién es y pasa a ser quién decide cómo se le ve.",
        fuente: MANIFESTO,
      },
      {
        tipo: "hecho",
        texto:
          "The Broad vincula la obra con la apropiación modernista de las máscaras africanas y con la máscara como medio para explorar la identidad.",
        fuente: FICHA,
      },
    ],
    limite: "Una máscara supone una cara debajo. Aquí, debajo, no hay cara: hay hueso y ruido.",
  },
];

/**
 * «Las tres a la vez»: los límites de cada lectura forman un ciclo. Cada una
 * tropieza con algo que explica la siguiente, y la tercera devuelve a la primera.
 */
export const SINTESIS = {
  titulo: "Ninguna se sostiene sola",
  entrada: "Cada lectura responde a una pregunta distinta. Lo interesante es dónde se detiene cada una.",
  ciclo: [
    { de: "craneo", tropieza: "Un cráneo no mira, y este tiene un ojo abierto.", explica: "rostro" },
    { de: "rostro", tropieza: "Un rostro pide a alguien, y nadie ha confirmado quién es.", explica: "mascara" },
    { de: "mascara", tropieza: "Una máscara tapa una cara, y aquí debajo solo hay hueso.", explica: "craneo" },
  ] satisfies { de: LecturaId; tropieza: string; explica: LecturaId }[],
  conclusion:
    "Cada lectura tropieza con algo que la siguiente explica, y la tercera devuelve a la primera. Por eso el cuadro no se deja cerrar: es las tres cosas a la vez, y ninguna del todo.",
  titulo2:
    "Basquiat lo dejó sin título. Llamarlo «Skull» fue elegir una de las tres miradas y apagar las otras dos.",
};

/* ── El expediente ─────────────────────────────────────────────── */

export const FICHA_EXPEDIENTE: [string, string][] = [
  ["Título", "Untitled (sin título)"],
  ["Denominación popular", "Skull («calavera»). No es un título del artista"],
  ["Autor", "Jean-Michel Basquiat (Brooklyn, Nueva York, 1960 – 1988)"],
  ["Fecha", "1981"],
  ["Técnica", "Acrílico y óleo en barra sobre lienzo"],
  ["Medidas", "205,74 × 175,9 cm (81 × 69 ¼ in)"],
  ["Colección", "The Broad, Los Ángeles"],
  ["Inventario", "B-BASQ-2P82.32"],
  ["Ingreso", "1982 (la ficha indica 12/09/82)"],
  ["Derechos", "© The Estate of Jean-Michel Basquiat. Licensed by Artestar, New York. Protegida hasta el 1 de enero de 2059"],
];

export type Hito = { cuando: string; texto: string; tipo: Tipo; fuente: string; pendiente?: boolean };

export const CRONOLOGIA: Hito[] = [
  { cuando: "1960", texto: "Nace en Brooklyn, hijo de padres haitiano y puertorriqueño.", tipo: "hecho", fuente: "The Broad, biografía del artista" },
  {
    cuando: "Feb.–abr. 1981",
    texto: "Participa en «New York/New Wave», en P.S. 1 (Long Island City), con una gran instalación de obras sobre lienzo.",
    tipo: "hecho",
    fuente: "MFA Boston, cronología de exposiciones",
  },
  {
    cuando: "Mayo 1981",
    texto: "Primera exposición individual, en la Galleria d'Arte Emilio Mazzoli de Módena (Italia).",
    tipo: "hecho",
    fuente: "MFA Boston, cronología de exposiciones",
  },
  {
    cuando: "1981",
    texto: "Pinta Untitled. Trabaja en ella durante meses (más de un año, según la audioguía), cuando solía acabar un cuadro en pocos días.",
    tipo: "hecho",
    fuente: `${FICHA} y audioguía`,
  },
  {
    cuando: "6 mar.–1 abr. 1982",
    texto:
      "Primera individual en Nueva York, en la galería de Annina Nosei, en SoHo. Untitled se presenta en ella. Basquiat trabajaba y vivía entonces en el sótano de la galería, donde, según recuerda Edye Broad, la pareja lo conoció.",
    tipo: "hecho",
    fuente: "MFA Boston (fechas); The Broad, ficha y audioguía (testimonio de Edye Broad)",
  },
  { cuando: "1982", texto: "Entra en la colección de Eli y Edythe Broad.", tipo: "hecho", fuente: `${FICHA} (fecha de ingreso)` },
  {
    cuando: "Después",
    texto:
      "Recibe el nombre de «Skull». Wikipedia lo sitúa tras la compra, sin citar fuente; el historiador Fred Hoffman lo atribuye a confundir la obra con un memento mori.",
    tipo: "lectura",
    fuente: "Wikipedia, «Untitled (Skull)»; Hoffman (2005), citado por Wikipedia",
    pendiente: true,
  },
  { cuando: "1988", texto: "Muere con veintisiete años.", tipo: "hecho", fuente: "The Broad, biografía del artista" },
  {
    cuando: "2005",
    texto:
      "Fred Hoffman la analiza entre cinco obras clave en el catálogo de la retrospectiva del Brooklyn Museum, que viajó a Los Ángeles (MOCA) y Houston (MFA).",
    tipo: "hecho",
    fuente: "Registros bibliográficos del catálogo; el análisis de la obra, citado por Wikipedia",
    pendiente: true,
  },
];

export const NOTA_TITULO = {
  tipo: "hecho" as Tipo,
  texto: "The Broad conserva otra pintura de Basquiat de 1981 también titulada Untitled.",
  fuente: "The Broad, biografía del artista (lista de obras)",
};

export type Fuente = { titulo: string; detalle: string; href?: string };

export const FUENTES_EXPEDIENTE: { grupo: string; nota: string; fuentes: Fuente[] }[] = [
  {
    grupo: "Institución titular",
    nota: "Fuente principal de los datos de la obra.",
    fuentes: [
      { titulo: "The Broad, ficha de Untitled (1981)", detalle: "Título, fecha, técnica, medidas, inventario, ingreso, derechos y texto del museo.", href: "https://www.thebroad.org/art/jean-michel-basquiat/untitled" },
      { titulo: "The Broad, audioguía", detalle: "Joanne Heyler (directora) y Edye Broad (coleccionista): testimonio y contexto de 1981.", href: "https://www.thebroad.org/tour-stops/jean-michel-basquiat-untitled-1981" },
      { titulo: "The Broad, biografía del artista", detalle: "Nacimiento, muerte y lista de obras de la colección.", href: "https://www.thebroad.org/art/jean-michel-basquiat" },
    ],
  },
  {
    grupo: "Fuentes secundarias",
    nota: "Contexto y fechas; lo que citan sin fuente se señala.",
    fuentes: [
      { titulo: "MFA Boston, «Basquiat and His Contemporaries: Exhibition Timeline»", detalle: "Fechas de P.S. 1, Módena y Annina Nosei.", href: "https://www.mfa.org/exhibition/writing-the-future/basquiat-contemporaries-exhibition-timeline" },
      { titulo: "Wikipedia, «Untitled (Skull)»", detalle: "Historia del nombre (sin fuente citada) y citas de Fred Hoffman.", href: "https://en.wikipedia.org/wiki/Untitled_(Skull)" },
    ],
  },
  {
    grupo: "Citada, pendiente de consulta directa",
    nota: "Se usa a través de Wikipedia; falta cotejarla con el libro.",
    fuentes: [
      {
        titulo: "Fred Hoffman, «The Defining Years: Notes on Five Key Works»",
        detalle: "En Marc Mayer (ed.), Basquiat. Brooklyn Museum / Merrell, 2005, pp. 130–131. Enlace: registro bibliográfico del catálogo.",
        href: "https://search.worldcat.org/title/basquiat/oclc/469563071",
      },
    ],
  },
  {
    grupo: "Consultadas y descartadas",
    nota: "No sostienen ningún dato de esta página.",
    fuentes: [
      { titulo: "Rise Art, «Canvassing the Masterpieces: Skull by Basquiat» (2023)", detalle: "Artículo de opinión sin fuentes.", href: "https://www.riseart.com/article/2706/canvassing-the-masterpieces-skull-by-basquiat" },
      { titulo: "La anécdota del Gray's Anatomy y el simbolismo vudú", detalle: "Aparecen en la audioguía infantil de The Broad, cuyo texto completo no se ha podido consultar." },
      { titulo: "Que sea un autorretrato", detalle: "No hay confirmación del artista; el museo lo plantea como posibilidad." },
    ],
  },
];

export const CREDITOS_EDITORIALES = [
  "Textos, selección de fuentes y traducción de las citas: MANIFESTO.",
  "Diseño, lámina, cotas, capas, recortes y diagramas: MANIFESTO. No reproducen ni imitan la escritura ni los signos de Basquiat.",
  "Las lecturas marcadas como Interpretación son propuestas de MANIFESTO o del museo, y así se indica en cada caso.",
  "La imagen para redes sociales es una composición tipográfica de MANIFESTO: no reproduce la pintura.",
];
