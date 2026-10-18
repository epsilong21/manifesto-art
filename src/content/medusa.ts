/**
 * Medusa, Caravaggio. Contenido editorial.
 *
 * Fuentes: ficha de Google Arts & Culture publicada por las Galerías de los
 * Uffizi (asset FAFPqU12CekL8Q), Historia Arte (historia-arte.com/obras/medusa-de-caravaggio)
 * y Ovidio, Metamorfosis IV. Lo no confirmado en fuente primaria se marca en docs/.
 */

export type Tipo = "hecho" | "lectura";

export const MEDUSA = {
  titulo: "Medusa",
  autor: "Michelangelo Merisi da Caravaggio",
  vida: "Milán, 1571 – Porto Ercole, 1610",
  fecha: "c. 1597–1598",
  tecnica: "Óleo sobre lienzo aplicado a un escudo de madera",
  medidas: "unos 60 × 55 cm",
  museo: "Galerías de los Uffizi, Florencia",
  imagen: {
    src: "/obras/medusa.jpg",
    width: 2400,
    height: 2350,
    alt: "Medusa, de Caravaggio: sobre un escudo redondo de fondo verde, la cabeza cortada de Medusa grita con los ojos muy abiertos. Su cabello son serpientes enroscadas y del cuello caen chorros de sangre. El borde del escudo tiene una cenefa dorada.",
  },
} as const;

export type DetalleMedusa = {
  id: string;
  nombre: string;
  titulo: string;
  x: number;
  y: number;
  zoom: number;
  /** Dónde se graba el numeral, si no debe tapar el centro del detalle (ojos, boca). */
  marca?: { x: number; y: number };
  hecho: string;
  lectura: string;
};

export const DETALLES_MEDUSA: DetalleMedusa[] = [
  {
    id: "mirada",
    nombre: "La mirada",
    titulo: "Los ojos que convierten en piedra",
    x: 54,
    y: 41,
    zoom: 2.4,
    marca: { x: 56, y: 33 },
    hecho:
      "Según el mito, quien miraba a Medusa quedaba petrificado. Ovidio cuenta en las Metamorfosis que Perseo la decapitó sin mirarla de frente, guiándose por su reflejo en un escudo de bronce.",
    lectura:
      "Caravaggio no pinta una amenaza, sino a la víctima: los ojos desorbitados parecen descubrir lo que le está pasando. La lectura más difundida es que Medusa se ve a sí misma, reflejada, en el último instante.",
  },
  {
    id: "grito",
    nombre: "El grito",
    titulo: "Un grito que nunca termina",
    x: 51,
    y: 58.5,
    zoom: 2.4,
    marca: { x: 59, y: 62 },
    hecho:
      "La cabeza está pintada en el instante de la decapitación: todavía viva, con la boca abierta y el ceño contraído.",
    lectura:
      "Varias fuentes, entre ellas los propios Uffizi, leen el rostro como un autorretrato: el pintor se habría usado a sí mismo como modelo del monstruo moribundo.",
  },
  {
    id: "serpientes",
    nombre: "Las serpientes",
    titulo: "Cabellos que muerden",
    x: 82,
    y: 33.5,
    zoom: 2.6,
    hecho:
      "En el mito, el cabello de Medusa son serpientes. Caravaggio las individualiza una a una: cada cuerpo tiene su propio dibujo, y varias cabezas asoman con la boca abierta.",
    lectura:
      "Las serpientes se retuercen hacia fuera como si quisieran huir de la cabeza que muere. Es la única parte del cuadro que aún parece tener futuro.",
  },
  {
    id: "sangre",
    nombre: "La sangre",
    titulo: "Lo que cae después del golpe",
    x: 39,
    y: 69,
    zoom: 2.4,
    hecho:
      "Del cuello cortado caen chorros de sangre pintados con trazos rectos y verticales. Según la mitología clásica, de la sangre de Medusa nacieron Pegaso y Crisaor.",
    lectura:
      "La sangre convierte el mito en un hecho físico: no hay distancia heroica, solo una herida reciente.",
  },
  {
    id: "escudo",
    nombre: "El escudo",
    titulo: "Un arma que nunca fue al combate",
    x: 85.5,
    y: 79.5,
    zoom: 2.2,
    hecho:
      "Es un lienzo aplicado sobre un escudo de madera. El cardenal Francesco Maria del Monte lo regaló al gran duque Fernando I de Médici en 1598. Entró sin atribución en la armería de los Uffizi y en 1631 se registró como obra de Caravaggio, expuesto con una armadura persa sobre un maniquí a caballo.",
    lectura:
      "La imagen de Medusa decoraba escudos desde la Antigüedad para paralizar al enemigo. Caravaggio hereda ese uso protector y lo convierte en espectáculo.",
  },
];

export const DOSSIER_MEDUSA: { id: string; titulo: string; bloques: { tipo: Tipo; texto: string }[] }[] = [
  {
    id: "pintor",
    titulo: "Caravaggio",
    bloques: [
      { tipo: "hecho", texto: "Michelangelo Merisi, llamado Caravaggio, nació en Milán en 1571 y murió en Porto Ercole en 1610. Cuando pintó esta Medusa trabajaba en Roma bajo la protección del cardenal Del Monte." },
      { tipo: "lectura", texto: "Su forma de pintar la luz, que arranca las figuras de la oscuridad, cambió la pintura europea del siglo XVII." },
    ],
  },
  {
    id: "mito",
    titulo: "Perseo y el reflejo",
    bloques: [
      { tipo: "hecho", texto: "Medusa era una de las Gorgonas. Perseo la venció mirándola solo a través de un reflejo. Después, según el mito, la cabeza acabó en la égida de Atenea, como arma." },
      { tipo: "lectura", texto: "El escudo de Caravaggio repite la trampa del mito: para mirar a Medusa necesitamos un soporte, una pantalla, un intermediario." },
    ],
  },
  {
    id: "soporte",
    titulo: "Técnica y soporte",
    bloques: [
      { tipo: "hecho", texto: "No está pintada directamente sobre la madera: Caravaggio pintó un lienzo y lo pegó al escudo. Mide unos 60 × 55 cm." },
      { tipo: "hecho", texto: "La cabeza proyecta una sombra sobre el fondo verde, como si la superficie fuera plana, aunque el escudo es curvo." },
      { tipo: "lectura", texto: "Ese juego entre cóncavo y convexo hace que la cabeza parezca sobresalir y que los ojos sigan al espectador." },
    ],
  },
  {
    id: "barroco",
    titulo: "Contexto barroco",
    bloques: [
      { tipo: "hecho", texto: "Hacia 1600, Roma era el centro de una pintura nueva que buscaba conmover al espectador con escenas inmediatas, cuerpos reales y contrastes violentos de luz." },
      { tipo: "lectura", texto: "La Medusa resume ese programa en un objeto: un mito antiguo convertido en un instante de terror casi documental." },
    ],
  },
  {
    id: "origen",
    titulo: "Origen y ubicación",
    bloques: [
      { tipo: "hecho", texto: "Regalo del cardenal Del Monte a Fernando I de Médici en 1598. Se conservó en la armería de los Médici y hoy está en las Galerías de los Uffizi, en Florencia." },
      { tipo: "hecho", texto: "Existe otra versión, anterior, en colección privada. Las fuentes difieren en la fecha exacta de la de los Uffizi: entre 1595 y 1599." },
    ],
  },
];
