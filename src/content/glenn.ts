/**
 * Glenn (1984–1985), Jean-Michel Basquiat. Contenido editorial de «La máscara y la copia».
 *
 * DERECHOS: obra protegida hasta el 1 de enero de 2059 (70 años desde la muerte
 * del autor, 1988). Los derechos son de The Estate of Jean-Michel Basquiat, que los
 * licencia a través de Artestar (Nueva York). La reproducción de referencia no tiene
 * licencia y se publica por decisión editorial de MANIFESTO S.A.S. (ver
 * glenn-reproducciones.json).
 *
 * Datos de catálogo: lista de objetos prestados a «Basquiat: Boom for Real»
 * (Barbican, 2017), consultada el 24/10/2026. La fecha no es unívoca: esa lista
 * dice «Date: 1984» y, en la procedencia, «Created in 1985»; otros créditos de la
 * misma exposición usan 1984 (Lévy Gorvy) o 1985 (FAD Magazine). Se muestra 1984–1985.
 *
 * Las descripciones de lo que se ve proceden de textos de terceros (Gagosian, Musart)
 * y se marcan como «Observación»; ninguna sustituye a cotejarlas con la pintura.
 */

export const GLENN = {
  titulo: "Glenn",
  autor: "Jean-Michel Basquiat",
  vida: "Nueva York, 1960–1988",
  fecha: "1984–1985",
  tecnica: "Acrílico, óleo en barra y collage de fotocopias sobre lienzo",
  medidas: "254 × 289,6 cm",
  alto: "254 cm",
  ancho: "289,6 cm",
  ubicacion: "Colección particular",
};

export const DERECHOS_GLENN = {
  hasta: "1 de enero de 2059",
  // Aviso de derechos de la obra, no una licencia de MANIFESTO: se dice expresamente
  credito: "© The Estate of Jean-Michel Basquiat. Licencias de reproducción: Artestar, Nueva York. MANIFESTO no dispone de ninguna.",
};

export const HERO_GLENN = {
  concepto: "La máscara y la copia",
  titulo: ["Una máscara", "sobre un muro de", "fotocopias"],
  pregunta: "¿Es el retrato de un amigo, una máscara o un archivo de copias?",
};

export type Tipo = "hecho" | "lectura" | "observacion";

/** Cartela del hero: tres datos breves, cada uno con su fuente. */
export const CARTELA_GLENN: { id: string; tipo: Tipo; texto: string; fuente: string }[] = [
  {
    id: "copias",
    tipo: "hecho",
    texto: "Casi tres metros de ancho. Debajo de la pintura no hay solo lienzo: hay hojas fotocopiadas pegadas.",
    fuente: "Barbican, lista de préstamos de «Basquiat: Boom for Real» (2017)",
  },
  {
    id: "boone",
    tipo: "hecho",
    texto: "Su procedencia empieza en la Mary Boone Gallery de Nueva York, donde Basquiat expuso en 1984 y en 1985.",
    fuente: "Barbican, lista de préstamos; cronología del Whitney (1992), notas 46 y 52",
  },
  {
    id: "nombre",
    tipo: "lectura",
    texto: "El título es un nombre propio. Probablemente remite a Glenn O'Brien, escritor y amigo del pintor; la obra no lo confirma.",
    fuente: "Gagosian Shop, ficha del plato Glenn (2012)",
  },
];

/** Hitos de 1984–1985 y del recorrido de la obra. Solo hechos con su fuente. */
export const CONTEXTO_GLENN: { id: string; fecha: string; texto: string; fuente: string }[] = [
  {
    id: "boone-84",
    fecha: "Mayo de 1984",
    texto: "Exposición de pinturas en la Mary Boone Gallery. The New York Times la reseña el 11 de mayo (Vivien Raynor).",
    fuente: "Cronología del Whitney (1992), nota 46",
  },
  {
    id: "nyt",
    fecha: "10 de febrero de 1985",
    texto: "Basquiat ocupa la portada de The New York Times Magazine. El artículo de Cathleen McGuigan se titula «New Art, New Money: The Marketing of an American Artist».",
    fuente: "Cronología del Whitney (1992), nota 11",
  },
  {
    id: "boone-85",
    fecha: "1985",
    texto: "Nueva exposición en Nueva York, con catálogo de la Mary Boone–Michael Werner Gallery.",
    fuente: "Cronología del Whitney (1992), nota 52",
  },
  {
    id: "warhol",
    fecha: "20 de septiembre de 1985",
    texto: "The New York Times publica «Art: Basquiat, Warhol», sobre las pinturas que hicieron a cuatro manos.",
    fuente: "Cronología del Whitney (1992), nota 54; nota de prensa de la Barbican (2017)",
  },
];

/** O'Brien: lo documentado de su relación con Basquiat (para la lectura «Retrato»). */
export const OBRIEN = {
  texto:
    "Glenn O'Brien escribió el guion de New York Beat, la película que protagonizó Basquiat, y lo llevó a nueve episodios de su programa de televisión por cable TV Party.",
  fuente: "Barbican, nota de prensa de «Basquiat: Boom for Real» (2017)",
};

/** Procedencia y exposición, tal como las da la lista de préstamos de la Barbican. */
export const PROCEDENCIA_GLENN = [
  "Mary Boone Gallery, Nueva York",
  "Thaddaeus Ropac, Salzburgo",
  "Christie's, Nueva York, 16 de mayo de 2000, lote 43",
  "Christie's, Nueva York, 10 de noviembre de 2004, lote 35",
];

export const EXPOSICION_GLENN = "«Basquiat: Boom for Real», Barbican Art Gallery, Londres, 21/09/2017–28/01/2018";

export const FICHA_GLENN: [string, string][] = [
  ["Artista", `${GLENN.autor} (${GLENN.vida})`],
  ["Título", GLENN.titulo],
  ["Fecha", `${GLENN.fecha}. La lista de la Barbican la data en 1984 y anota «Created in 1985»`],
  ["Técnica", GLENN.tecnica],
  ["Medidas", `${GLENN.medidas} (alto × ancho, aprox.)`],
  ["Colección", `${GLENN.ubicacion}. En la lista de la Barbican (2017) figura como prestador The Museum of Modern Art, Nueva York`],
  ["Derechos", `Protegida hasta el ${DERECHOS_GLENN.hasta}. The Estate of Jean-Michel Basquiat (Artestar)`],
];

export const FUENTES_GLENN = [
  {
    label: "Barbican: lista de objetos prestados a «Basquiat: Boom for Real» (2017)",
    href: "https://www.barbican.org.uk/sites/default/files/documents/2017-08/immunity-from-seizure.pdf",
  },
  {
    label: "Barbican: nota de prensa de «Basquiat: Boom for Real» (2017)",
    href: "https://www.barbican.org.uk/sites/default/files/documents/2017-09/Basquiat_Boom%20for%20Real%20press%20release_Final_%20Sept_2017_0.pdf",
  },
  { label: "Lévy Gorvy: «Basquiat: Boom for Real» en la Barbican (crédito de Glenn)", href: "https://levygorvy.com/happenings/basquiat-boom-for-real-at-the-barbican/" },
  { label: "basquiat.com: notas de la cronología del Whitney Museum (1992)", href: "https://www.basquiat.com/chronology" },
  { label: "Sotheby's: Tenor (1985), nota de catálogo (2014)", href: "https://www.sothebys.com/en/auctions/ecatalogue/2014/contemporary-art-evening-auction-l14020/lot.29.html" },
  { label: "Gagosian Shop: plato Glenn, Ligne Blanche con el Estate (descripción; fuente comercial)", href: "https://www.gagosianshop.com/products/jean-michel-basquiat-glenn-plate" },
  { label: "Musart: plato Glenn (descripción; fuente comercial)", href: "https://musart.com/en/jean-michel-basquiat-limoges-porcelain-plate-small-glenn-1984-musbow-cajmb20" },
];

/* ── Mesa de luz ─────────────────────────────────────────────────────────────
 * Coordenadas en fracciones de la imagen (0–1), calibradas el 24/10/2026 sobre la
 * reproducción de referencia (800 × 705, encuadre del lienzo completo). Otra reproducción
 * con otro encuadre obliga a recalibrarlas con ?calibrar en next dev.
 */

export type Hallazgo = { id: string; n: string; titulo: string; tipo: Tipo; texto: string; fuente: string; x: number; y: number };

export const HALLAZGOS_GLENN: Hallazgo[] = [
  {
    id: "mascara",
    n: "01",
    titulo: "La máscara",
    tipo: "observacion",
    texto: "Una gran cabeza negra ocupa la mitad derecha del lienzo, con orejas rojas y nariz verde. No tiene los rasgos de nadie en concreto: se lee antes como máscara que como cara.",
    fuente: "Descripciones de Gagosian Shop y Musart",
    x: 0.69,
    y: 0.31,
  },
  {
    id: "boca",
    n: "02",
    titulo: "La boca abierta",
    tipo: "observacion",
    texto: "La boca está abierta de par en par y enseña los dientes, blancos y negros.",
    fuente: "Descripción de Musart",
    x: 0.6,
    y: 0.62,
  },
  {
    id: "trazos",
    n: "03",
    titulo: "Lo que sale de la boca",
    tipo: "lectura",
    texto: "De la boca salen trazos rápidos. Se han leído como sonido, quizá jazz, una de las pasiones de Basquiat. Es una conjetura, no un dato.",
    fuente: "Gagosian Shop («perhaps signify»)",
    x: 0.4,
    y: 0.6,
  },
  {
    id: "copias",
    n: "04",
    titulo: "El muro de copias",
    tipo: "hecho",
    texto: "El fondo es un collage de hojas fotocopiadas pegadas al lienzo. En obras de esa serie, Basquiat fotocopiaba dibujos suyos anteriores para cubrir el fondo.",
    fuente: "Barbican, lista de préstamos (técnica); Sotheby's, nota de Tenor (la serie)",
    x: 0.12,
    y: 0.45,
  },
  {
    id: "dibujos",
    n: "05",
    titulo: "Coches, cabezas, órganos",
    tipo: "observacion",
    texto: "En las copias se reconocen dibujos de coches, de cabezas y de órganos internos: un inventario debajo de la máscara.",
    fuente: "Descripción de Gagosian Shop",
    x: 0.375,
    y: 0.79,
  },
];

/** Capas de análisis: lo que separa cada una y qué se puede afirmar de ella. */
export const CAPAS_GLENN: { id: "figura" | "fondo" | "gesto"; nombre: string; tipo: Tipo; texto: string }[] = [
  {
    id: "figura",
    nombre: "Figura",
    tipo: "observacion",
    texto: "La máscara negra, al frente. Es la mancha más oscura y compacta del cuadro.",
  },
  {
    id: "fondo",
    nombre: "Fondo",
    tipo: "hecho",
    texto: "Las hojas fotocopiadas: imágenes hechas a máquina, en serie, pegadas como un muro.",
  },
  {
    id: "gesto",
    nombre: "Gesto",
    tipo: "observacion",
    texto: "El acrílico y el óleo en barra: lo hecho a mano. La cabeza está pintada encima del collage.",
  },
];

/** Zona aproximada de la máscara (elipse, con las orejas) y de la boca, en fracciones. */
export const ZONAS_GLENN = {
  /** Elipse orientativa: solo para el esquema sin reproducción. */
  mascara: { cx: 0.7, cy: 0.5, rx: 0.23, ry: 0.37 },
  /**
   * Contorno de la cabeza con las orejas, medido sobre la referencia (polígono en fracciones).
   * La cabeza es un bloque casi rectangular: una elipse dejaba fuera la mandíbula y las orejas.
   */
  contorno: [
    [0.498, 0.225], [0.544, 0.16], [0.682, 0.14], [0.843, 0.147], [0.912, 0.186], [0.933, 0.225],
    [0.933, 0.461], [0.884, 0.513], [0.889, 0.775], [0.843, 0.834], [0.74, 0.86], [0.601, 0.864],
    [0.498, 0.821], [0.457, 0.762], [0.486, 0.709], [0.498, 0.605], [0.475, 0.487], [0.472, 0.369],
    [0.486, 0.251],
  ] as [number, number][],
  boca: { cx: 0.64, cy: 0.66, rx: 0.14, ry: 0.08 },
  /** Retícula orientativa de hojas del esquema sin reproducción: columnas × filas. */
  hojas: { columnas: 10, filas: 7 },
};

/** Regiones de salto del inspector (teclado y botones), en fracciones. */
export const REGIONES_GLENN = [
  { id: "mascara", nombre: "La máscara", x: 0.7, y: 0.35 },
  { id: "boca", nombre: "La boca", x: 0.62, y: 0.66 },
  { id: "copias", nombre: "Las copias", x: 0.15, y: 0.3 },
  { id: "dibujos", nombre: "Los dibujos", x: 0.375, y: 0.79 },
];

/* ── Tres lecturas ─────────────────────────────────────────────────────────── */

export type Lectura = {
  id: "retrato" | "mascara" | "archivo";
  nombre: string;
  tesis: string;
  apoyos: { tipo: Tipo; texto: string; fuente: string }[];
  limite: string;
};

export const LECTURAS_GLENN: Lectura[] = [
  {
    id: "retrato",
    nombre: "Retrato",
    tesis: "Es el retrato de un amigo: Glenn O'Brien.",
    apoyos: [
      { tipo: "hecho", texto: "El título es un nombre propio, no una descripción.", fuente: "Barbican, lista de préstamos" },
      { tipo: "hecho", texto: OBRIEN.texto, fuente: OBRIEN.fuente },
      { tipo: "lectura", texto: "Que el título remita a O'Brien es probable, según la ficha de un objeto editado con el Estate.", fuente: "Gagosian Shop" },
    ],
    limite:
      "La cabeza no tiene rasgos individuales. Si es un retrato, no busca el parecido: retrata a alguien con una máscara.",
  },
  {
    id: "mascara",
    nombre: "Máscara",
    tesis: "No es una cara, es una máscara: un rostro que oculta tanto como muestra.",
    apoyos: [
      { tipo: "observacion", texto: "La cabeza es negra, frontal y sin rasgos de una persona concreta; la boca abierta enseña los dientes.", fuente: "Descripciones de Gagosian Shop y Musart" },
      { tipo: "lectura", texto: "Se la ha comparado con una gran máscara africana.", fuente: "Gagosian Shop" },
    ],
    limite:
      "La comparación no identifica ninguna máscara concreta, y la etiqueta «africana» puede reducir la obra a un tópico. Es una lectura formal, no un dato.",
  },
  {
    id: "archivo",
    nombre: "Archivo",
    tesis: "Es un archivo: Basquiat copia y multiplica sus propias imágenes y pone una máscara delante.",
    apoyos: [
      { tipo: "hecho", texto: "El fondo es un collage de fotocopias.", fuente: "Barbican, lista de préstamos" },
      { tipo: "hecho", texto: "En la serie de mediados de los ochenta, fotocopiaba dibujos suyos anteriores para el fondo.", fuente: "Sotheby's, nota de Tenor (1985)" },
      { tipo: "hecho", texto: "En febrero de 1985 su nombre era portada como fenómeno de mercado: «New Art, New Money».", fuente: "Cronología del Whitney (1992), nota 11" },
    ],
    limite:
      "No hay ninguna declaración del artista que una las fotocopias con el mercado. La fotocopia también era un recurso rápido y barato para trabajar.",
  },
];

/** Las dos cabezas de Basquiat en MANIFESTO: relación con la obra 04. */
export const RELACION_GLENN = {
  slug: "basquiat-untitled",
  titulo: "Untitled",
  fecha: "1981",
  texto:
    "Entre Untitled y Glenn hay unos cuatro años. Allí, una cabeza pintada durante meses que deja ver su interior; aquí, una máscara pintada encima de copias hechas a máquina.",
  pregunta: "¿Es la misma cabeza vista desde dentro y desde fuera?",
};

type Reproduccion = { clave: string; archivo: string; width: number; height: number; imagen: string; autorizacion: string; pie: string };

/**
 * La reproducción elegida al compilar (scripts/glenn/reproduccion.mjs, datos en
 * glenn-reproducciones.json): la autorizada si existe; si no, la REFERENCIA local,
 * publicable por decisión editorial. null: no hay ninguna y la página usa el esquema propio.
 */
export const REPRODUCCION_GLENN: Reproduccion | null = process.env.MANIFESTO_GLENN_REPRODUCCION
  ? JSON.parse(process.env.MANIFESTO_GLENN_REPRODUCCION)
  : null;
const r = REPRODUCCION_GLENN;

/** El lienzo mide 289,6 × 254 cm (ancho × alto): la lámina conserva esa proporción. */
export const LIENZO_GLENN = { w: 2896, h: 2540 };

export const OBRA_GLENN = {
  imagen: { src: r ? `/obras/${r.archivo}` : "", width: r?.width ?? LIENZO_GLENN.w, height: r?.height ?? LIENZO_GLENN.h },
  alt: "Glenn, de Jean-Michel Basquiat: en la mitad derecha, una gran cabeza negra, como una máscara, con orejas rojas, nariz verde, ojos naranjas y una corona de trazos; la boca abierta enseña dientes blancos y negros y de ella salen trazos de colores hacia la izquierda. Todo el fondo es un muro de hojas fotocopiadas con dibujos.",
  credito: {
    obra: `${GLENN.autor}, ${GLENN.titulo}, ${GLENN.fecha}. ${GLENN.tecnica}, ${GLENN.medidas}. ${GLENN.ubicacion}.`,
    imagen: r?.imagen ?? "",
    autorizacion: r?.autorizacion ?? "",
    pie: r?.pie ?? "",
  },
};
