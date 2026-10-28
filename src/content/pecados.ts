/**
 * Los siete pecados capitales y las cuatro postrimerías (atribuida a El Bosco): El ojo que todo lo ve.
 * Geometría calibrada a mano sobre esta misma reproducción (2863 × 2441, Museo del Prado vía Commons):
 * los siete sectores NO son iguales (de unos 34° a unos 68° de arco) y se midieron uno a uno.
 * x, y en fracciones de la imagen (0–1 desde arriba/izquierda); los radios, en fracciones del ANCHO.
 */

export const PEC_IMG = {
  base: "/pecados/pecados",
  anchos: [1000, 2000] as const,
  width: 2000,
  height: 1705,
  /** Alto / ancho de la reproducción. */
  ratio: 1705 / 2000,
  alt: "La mesa de los pecados capitales: un gran círculo con un ojo en el centro, en cuya pupila aparece Cristo, rodeado por siete escenas de pecados, y cuatro medallones en las esquinas con la muerte, el juicio, el infierno y la gloria.",
};

/** Centro del gran círculo, radio interior (el ojo) y exterior, en fracciones. */
export const CIRCULO = { x: 0.4915, y: 0.5, rInt: 0.135, rExt: 0.3 };

export type Grupo = "pecado" | "postrimeria" | "ojo";
export type Forma =
  | { tipo: "sector"; desde: number; hasta: number }
  | { tipo: "circulo"; x: number; y: number; r: number };

export type Escena = {
  id: string;
  grupo: Grupo;
  nombre: string;
  /** Nombre latino que aparece escrito en la tabla, si lo hay. */
  rotulo?: string;
  forma: Forma;
  /** Encuadre de la ampliación. */
  x: number;
  y: number;
  zoom: number;
  observacion: string;
  interpretacion: string;
};

/** Sectores en sentido horario desde el este (ángulos en grados, y hacia abajo), medidos sobre la reproducción. */
export const ESCENAS: Escena[] = [
  {
    id: "ira", grupo: "pecado", nombre: "Ira", rotulo: "Ira",
    forma: { tipo: "sector", desde: 54, hasta: 122 }, x: 0.47, y: 0.79, zoom: 3,
    observacion: "Ante una taberna, un hombre con una silla en alto y un cuchillo se enfrenta a una figura de cofia blanca que blande una espada curva. En el suelo quedan un sombrero, un casco y una tela rosa.",
    interpretacion: "Una riña de taberna sirve de ejemplo cotidiano de la ira: sin santos ni héroes, solo vecinos fuera de sí.",
  },
  {
    id: "soberbia", grupo: "pecado", nombre: "Soberbia", rotulo: "Superbia",
    forma: { tipo: "sector", desde: 12, hasta: 54 }, x: 0.66, y: 0.66, zoom: 3.3,
    observacion: "Una mujer de rosa, ricamente vestida, se inclina sobre un mueble en un interior con jarras, un cofre y una cama.",
    interpretacion: "Tradicionalmente se describe como una dama que se mira al espejo: vanidad, el pecado de quien solo se mira a sí mismo.",
  },
  {
    id: "lujuria", grupo: "pecado", nombre: "Lujuria", rotulo: "Luxuria",
    forma: { tipo: "sector", desde: 322, hasta: 372 }, x: 0.71, y: 0.46, zoom: 3.3,
    observacion: "Bajo un pabellón rojo conversan varias parejas; en la hierba hay un arpa, una flauta, una copa y un plato con fruta.",
    interpretacion: "La música y el banquete se asocian aquí a la sensualidad; la lectura es tradicional, el cuadro solo escribe «Luxuria».",
  },
  {
    id: "pereza", grupo: "pecado", nombre: "Pereza", rotulo: "Accidia",
    forma: { tipo: "sector", desde: 288.5, hasta: 322 }, x: 0.6, y: 0.28, zoom: 3.3,
    observacion: "Un hombre de verde duerme sobre un banco, junto a una chimenea; delante, una monja vestida de negro le tiende un rosario.",
    interpretacion: "Se lee como pereza espiritual: dormir mientras se llama a la oración.",
  },
  {
    id: "gula", grupo: "pecado", nombre: "Gula", rotulo: "Gula",
    forma: { tipo: "sector", desde: 239, hasta: 288.5 }, x: 0.47, y: 0.26, zoom: 3.3,
    observacion: "Una mesa servida en una cocina, con un plato de pescado y jarras: un hombre bebe de una jarra mientras otros comen y beben alrededor.",
    interpretacion: "La escena muestra el exceso de comida y bebida; el cuadro no cuenta sus consecuencias.",
  },
  {
    id: "avaricia", grupo: "pecado", nombre: "Avaricia", rotulo: "Avaricia",
    forma: { tipo: "sector", desde: 190, hasta: 239 }, x: 0.33, y: 0.36, zoom: 3.3,
    observacion: "Un hombre de azul se inclina hacia otro de ropas rosadas y gorro negro, junto a una mesa con un libro; alrededor, varios hombres con papeles.",
    interpretacion: "Se ha leído como la corrupción de la justicia: la avaricia de quien la vende.",
  },
  {
    id: "envidia", grupo: "pecado", nombre: "Envidia", rotulo: "Invidia",
    forma: { tipo: "sector", desde: 122, hasta: 190 }, x: 0.29, y: 0.62, zoom: 2.9,
    observacion: "Dos perros se disputan un hueso ante una casa; en la casa, varias personas se asoman a las ventanas, y dos hombres pasan cargados con sacos.",
    interpretacion: "La envidia como mirada hacia lo ajeno: los perros lo muestran en pequeño y las figuras de la ventana, en grande.",
  },
  {
    id: "muerte", grupo: "postrimeria", nombre: "Muerte",
    forma: { tipo: "circulo", x: 0.153, y: 0.174, r: 0.105 }, x: 0.153, y: 0.174, zoom: 4.2,
    observacion: "Un moribundo recibe los últimos auxilios de un sacerdote, con familiares y religiosas en torno a la cama; sobre la cama se asoman un ángel y un pequeño demonio negro.",
    interpretacion: "Primera postrimería: la muerte llega en una habitación corriente, con testigos que rezan.",
  },
  {
    id: "juicio", grupo: "postrimeria", nombre: "Juicio Final",
    forma: { tipo: "circulo", x: 0.846, y: 0.176, r: 0.1096 }, x: 0.846, y: 0.176, zoom: 4.2,
    observacion: "Cristo, de rojo, preside entre ángeles que tocan trompetas; a los lados, apóstoles y santos, y abajo los muertos salen de sus tumbas.",
    interpretacion: "Segunda postrimería: el juicio divino al final de los tiempos.",
  },
  {
    id: "infierno", grupo: "postrimeria", nombre: "Infierno",
    forma: { tipo: "circulo", x: 0.152, y: 0.82, r: 0.115 }, x: 0.152, y: 0.82, zoom: 4,
    observacion: "Demonios atormentan a condenados desnudos; a la derecha hierve un gran caldero y arriba hay un dosel con un lecho.",
    interpretacion: "Tercera postrimería: el castigo eterno, con el imaginario de monstruos y suplicios habitual en El Bosco.",
  },
  {
    id: "gloria", grupo: "postrimeria", nombre: "Gloria",
    forma: { tipo: "circulo", x: 0.84, y: 0.82, r: 0.1115 }, x: 0.84, y: 0.82, zoom: 4.2,
    observacion: "En una gran iglesia, Dios entronizado en lo alto y coros de ángeles; abajo, ángeles músicos y los salvados, desnudos, guiados por santos y ángeles.",
    interpretacion: "Cuarta postrimería: la recompensa eterna, en el medallón más luminoso de los cuatro.",
  },
  {
    id: "ojo", grupo: "ojo", nombre: "El ojo",
    forma: { tipo: "circulo", x: 0.4923, y: 0.5, r: 0.135 }, x: 0.4923, y: 0.51, zoom: 3.2,
    observacion: "En la pupila, sobre un fondo azul, Cristo se alza con una mano en la cadera y otra en alto; una inscripción dorada rodea la pupila: «Cave, cave, Dominus videt».",
    interpretacion: "Todo lo que rodea al ojo es lo que Dios ve. Cristo en la pupila hace que esa mirada no sea solo vigilancia: es la del que juzga y la del que se ofreció por los pecados.",
  },
];

/** Cuántas escenas hay que visitar para leer el ojo con todo lo que mira. */
export const TOTAL_ESCENAS = ESCENAS.length - 1;
export const CIERRE_OJO =
  "Has recorrido las once escenas. Mira otra vez la tabla: los siete pecados quedan en el borde, las cuatro postrimerías en las esquinas y el ojo, en medio, mira cada rincón.";

export const GRUPOS: { id: Grupo; nombre: string }[] = [
  { id: "pecado", nombre: "Los siete pecados" },
  { id: "postrimeria", nombre: "Las cuatro postrimerías" },
  { id: "ojo", nombre: "El ojo" },
];

export const DOCUMENTADO = [
  "Tabla al óleo de 119,5 × 139,5 cm, en el Museo Nacional del Prado, Madrid (título del museo: «Mesa de los pecados capitales»).",
  "El Prado la cataloga como de El Bosco, hacia 1505–1510. La atribución se discute: el proyecto de investigación y conservación de El Bosco (dirigido por Matthijs Ilsink) considera probable que sea de un seguidor, y el Prado rechaza esa desatribución. La cuestión sigue abierta.",
  "Está documentada en El Escorial desde 1574; pasó al Prado en 1936.",
  "Compone cinco círculos: el ojo central, con Cristo en la pupila, y cuatro medallones en las esquinas con la Muerte, el Juicio, el Infierno y la Gloria.",
  "Una inscripción latina rodea la pupila: «Cave, cave, Dominus videt» («Cuidado, cuidado, el Señor ve»). Dos filacterias remiten al capítulo 32 del Deuteronomio.",
  "Cada pecado lleva su nombre en latín junto a la escena. Sobre esta reproducción, los sectores miden entre unos 34° y unos 68° de arco: no son iguales.",
];

export const INTERPRETACION = [
  "Que la tabla sea de El Bosco, de su taller o de un seguidor, y su fecha, son cuestiones discutidas; esta página no toma partido.",
  "Se la llama «mesa» por su formato y por las escenas orientadas hacia fuera; cómo se usó no está documentado.",
  "Las lecturas morales de cada escena son tradicionales; la tabla solo rotula el nombre del pecado.",
  "Leer la pupila como la mirada de Dios y a Cristo como quien la sostiene es la lectura habitual; esta página la ofrece como lectura.",
  "El recorrido pecados → postrimerías → ojo es de esta página; no se sabe en qué orden debía mirarse.",
];

export const CREDITOS = {
  imagen: "Reproducción completa: Los siete pecados capitales y las cuatro postrimerías, atribuida a El Bosco, Museo Nacional del Prado (Madrid). Fotografía del Prado, vía Wikimedia Commons (título del museo: «Mesa de los pecados capitales»). Redimensionada y convertida a WebP.",
  nota: "La pintura es de dominio público. Wikimedia Commons marca esta fotografía como dominio público, pero esa marca no sustituye una licencia del titular de la fotografía: los términos de reutilización del Prado están pendientes de confirmar.",
  fuentes: [
    { label: "Museo del Prado: Mesa de los pecados capitales (ficha)", href: "https://www.museodelprado.es/coleccion/obra-de-arte/mesa-de-los-pecados-capitales/3fc0a84e-d77d-4217-b960-8a34b8873b70" },
    { label: "Museo del Prado: explicación multimedia", href: "https://www.museodelprado.es/actualidad/multimedia/mesa-de-los-pecados-capitales-el-bosco/cf31bb21-0e63-1c39-8275-5d000887842f" },
    { label: "Archivo en Wikimedia Commons", href: "https://commons.wikimedia.org/wiki/File:Hieronymus_Bosch-_The_Seven_Deadly_Sins_and_the_Four_Last_Things.JPG" },
    { label: "BBVA: Los pecados del Bosco (guía de la exposición)", href: "https://www.bbva.com/es/bosco-la-exposicion-del-v-centenario/" },
    { label: "ACI Prensa: Los siete pecados capitales", href: "https://www.aciprensa.com/arte/Bosco/sietepecados.htm" },
  ],
};
