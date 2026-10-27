/**
 * Untitled (1981), Jean-Michel Basquiat. Contenido editorial de «Dentro de la cabeza».
 *
 * DERECHOS: obra protegida hasta el 1 de enero de 2059 (70 años desde la muerte
 * del autor, 1988). Los derechos son de The Estate of Jean-Michel Basquiat, que los
 * licencia a través de Artestar (Nueva York). La reproducción de referencia es solo
 * para desarrollo local (ver basquiat-reproducciones.json): no se publica.
 *
 * Datos de catálogo: ficha de The Broad (consultada el 22/10/2026).
 */

export const BASQUIAT = {
  titulo: "Untitled",
  /** Nombre popular, no el título: la ficha del museo no lo usa. */
  popular: "Skull",
  autor: "Jean-Michel Basquiat",
  vida: "Nueva York, 1960–1988",
  fecha: "1981",
  tecnica: "Acrílico y óleo en barra sobre lienzo",
  medidas: "205,74 × 175,9 cm",
  alto: "205,74 cm",
  ancho: "175,9 cm",
  ubicacion: "The Broad, Los Ángeles",
  inventario: "B-BASQ-2P82.32",
  ficha: "https://www.thebroad.org/art/jean-michel-basquiat/untitled",
};

export const DERECHOS_BASQUIAT = {
  hasta: "1 de enero de 2059",
  titular: "The Estate of Jean-Michel Basquiat",
  gestion: "Artestar, Nueva York",
  // Aviso de derechos de la obra, no una licencia de MANIFESTO: se dice expresamente
  credito: "© The Estate of Jean-Michel Basquiat. Licencias de reproducción: Artestar, Nueva York. MANIFESTO no dispone de ninguna.",
  texto:
    "La obra de Jean-Michel Basquiat está protegida por derechos de autor. Reproducirla, incluso en una web, requiere la autorización de The Estate of Jean-Michel Basquiat, que la licencia a través de Artestar.",
};

export const HERO_BASQUIAT = {
  concepto: "Dentro de la cabeza",
  titulo: ["Una cabeza", "llena de", "ruido"],
  pregunta: "¿Es un cráneo, un rostro o una máscara?",
};

type Tipo = "hecho" | "lectura" | "observacion";

/** Cartela histórica del hero: tres datos breves, cada uno con su fuente. */
export const CARTELA_BASQUIAT: { id: string; tipo: Tipo; texto: string; fuente: string }[] = [
  {
    id: "titulo",
    tipo: "hecho",
    texto: "Basquiat no le puso nombre: en la colección del museo se titula Untitled. «Skull», calavera, es el nombre con el que se la conoce.",
    fuente: "The Broad, ficha de la obra",
  },
  {
    id: "debut",
    tipo: "hecho",
    texto: "Se presentó en su primera exposición individual en Nueva York y entró en la colección de Eli y Edythe Broad en 1982.",
    fuente: "The Broad, ficha de la obra (fecha de ingreso: 1982)",
  },
  {
    id: "tiempo",
    tipo: "hecho",
    texto: "Solía terminar un cuadro en pocos días. En este trabajó durante meses; más de un año, según la audioguía del museo.",
    fuente: "The Broad, ficha de la obra y audioguía",
  },
];

export const FUENTES_BASQUIAT = [
  { label: "The Broad: ficha de Untitled (1981)", href: BASQUIAT.ficha },
  { label: "The Broad: audioguía (Joanne Heyler, Edye Broad)", href: "https://www.thebroad.org/tour-stops/jean-michel-basquiat-untitled-1981" },
  // P2: «visión como de rayos X» y las citas de Fred Hoffman (catálogo de 2005), pendientes de cotejo
  { label: "Wikipedia: Untitled (Skull) (fuente secundaria; cita a Fred Hoffman, 2005)", href: "https://en.wikipedia.org/wiki/Untitled_(Skull)" },
  // P3: biografía y lista de obras de la colección; fechas de exposiciones 1980–1982
  { label: "The Broad: biografía de Jean-Michel Basquiat", href: "https://www.thebroad.org/art/jean-michel-basquiat" },
  { label: "MFA Boston: Basquiat and His Contemporaries, cronología de exposiciones", href: "https://www.mfa.org/exhibition/writing-the-future/basquiat-contemporaries-exhibition-timeline" },
];

type Reproduccion = { clave: string; archivo: string; width: number; height: number; imagen: string; autorizacion: string; pie: string };

/**
 * La reproducción elegida al compilar (scripts/basquiat/reproduccion.mjs, datos en
 * basquiat-reproducciones.json): la autorizada si existe; si no, la REFERENCIA local,
 * que nunca se publica.
 * null: no hay ninguna y la página usa la lámina pendiente. Solo sus datos llegan al bundle.
 */
export const REPRODUCCION_BASQUIAT: Reproduccion | null = process.env.MANIFESTO_BASQUIAT_REPRODUCCION
  ? JSON.parse(process.env.MANIFESTO_BASQUIAT_REPRODUCCION)
  : null;
const r = REPRODUCCION_BASQUIAT;

/** El lienzo mide 175,9 × 205,74 cm: la lámina conserva esa proporción con o sin imagen. */
export const LIENZO_BASQUIAT = { w: 1759, h: 2057 };

export const OBRA_BASQUIAT = {
  imagen: { src: r ? `/obras/${r.archivo}` : "", width: r?.width ?? 921, height: r?.height ?? 1080 },
  alt: "Untitled (1981), de Jean-Michel Basquiat: una cabeza enorme, de perfil hacia la izquierda, ocupa casi todo el lienzo sobre un fondo azul celeste y salmón. Por dentro es negra, marrón y azul, cruzada por trazos blancos y amarillos; un ojo de iris rojo mira desde el centro, la mandíbula amarilla deja ver los dientes y un borde de trazos cortos rodea el cráneo. Arriba a la izquierda, signos negros sobre una franja roja.",
  credito: {
    obra: `${BASQUIAT.autor}, ${BASQUIAT.titulo}, ${BASQUIAT.fecha}. ${BASQUIAT.tecnica}, ${BASQUIAT.medidas}. ${BASQUIAT.ubicacion}.`,
    imagen: r?.imagen ?? "",
    autorizacion: r?.autorizacion ?? "",
    pie: r?.pie ?? "",
  },
};
