/**
 * «Descifrar capas» (Basquiat P2): cuatro capas combinables y cinco hallazgos.
 *
 * Coordenadas en píxeles de la reproducción de referencia (921 × 1080), medidas
 * sobre la imagen con una retícula. Si cambia el archivo (proporción o encuadre),
 * recalibrar junto a `calibracion` en basquiat-reproducciones.json.
 *
 * Las citas de The Broad y de Fred Hoffman son traducciones de MANIFESTO.
 */

export type CapaId = "anatomia" | "rostro" | "mascara" | "marcas";
type Tipo = "hecho" | "lectura" | "observacion";
type Punto = [number, number];

/** Contorno de una zona: elipse (con giro opcional, en grados) o trazado SVG. */
export type Forma = { elipse: [cx: number, cy: number, rx: number, ry: number, giro?: number] } | { d: string };

export type Elemento = {
  n: number;
  nombre: string;
  nota: string;
  tipo: Tipo;
  formas: Forma[];
  /** Dónde va su número: en el borde del contorno, sobre fondo o zona sin detalle. */
  marca: Punto;
};

export type Capa = {
  id: CapaId;
  nombre: string;
  /** Color del trazo y patrón de discontinuidad (doble código: no depende solo del color). */
  color: string;
  trazo: string;
  intro: { texto: string; tipo: Tipo; fuente: string };
  elementos: Elemento[];
};

export const LIENZO_CAPAS = { w: 921, h: 1080 };

export const CAPAS: Capa[] = [
  {
    id: "anatomia",
    nombre: "Anatomía",
    color: "#ede6d6",
    trazo: "none",
    intro: {
      tipo: "hecho",
      texto:
        "Joanne Heyler, directora de The Broad, ve en la pintura «casi un mapa de la anatomía de un cerebro y una cabeza», como si se mirara a través de la cara.",
      fuente: "The Broad, audioguía",
    },
    elementos: [
      {
        n: 1,
        nombre: "Dientes",
        tipo: "observacion",
        nota: "Una hilera de dientes amarillos, cada uno con su contorno, a la vista bajo la mejilla.",
        formas: [{ elipse: [362, 822, 96, 58, 8] }],
        marca: [276, 772],
      },
      {
        n: 2,
        nombre: "Mandíbula",
        tipo: "observacion",
        nota: "El hueso de la mandíbula, dibujado por fuera de la cara, baja hasta el mentón y vuelve hacia la nuca.",
        formas: [{ d: "M150 842 L132 930 L158 990 L300 1004 L432 988 L520 924 L566 840" }, { d: "M492 864 Q614 824 760 800" }],
        marca: [128, 1004],
      },
      {
        n: 3,
        nombre: "Costura",
        tipo: "lectura",
        nota: "Una línea cosida cruza la frente. Puede leerse como la sutura de un cráneo o como una cicatriz.",
        formas: [{ elipse: [322, 488, 82, 24, -42] }],
        marca: [258, 552],
      },
      {
        n: 4,
        nombre: "Interior",
        tipo: "observacion",
        nota: "La bóveda está abierta: dentro hay negro, marrón y azul, rejillas blancas y trazos amarillos.",
        formas: [{ d: "M296 300 Q450 232 640 268 Q762 330 772 452 Q764 540 702 562 L440 556 Q330 542 290 470 Z" }],
        marca: [440, 252],
      },
    ],
  },
  {
    id: "rostro",
    nombre: "Rostro",
    color: "#f0c53a",
    trazo: "10 6",
    intro: {
      tipo: "hecho",
      texto:
        "The Broad describe una cara: «los ojos están apagados, el rostro hundido». Añade que la obra puede considerarse una forma de autorretrato; Heyler recuerda que eso nunca se ha verificado.",
      fuente: "The Broad, ficha de la obra y audioguía",
    },
    elementos: [
      {
        n: 5,
        nombre: "Ojo",
        tipo: "observacion",
        nota: "Un ojo muy abierto, de iris rojo, rodeado de pestañas amarillas.",
        formas: [{ elipse: [360, 600, 78, 50] }],
        marca: [360, 544],
      },
      {
        n: 6,
        nombre: "Segundo ojo",
        tipo: "lectura",
        nota: "En el borde hay otro ojo, más pálido. La cabeza parece mirar a la vez de perfil y de frente.",
        formas: [{ elipse: [194, 568, 60, 54] }],
        marca: [138, 614],
      },
      {
        n: 7,
        nombre: "Nariz",
        tipo: "observacion",
        nota: "Una nariz negra recortada por una línea blanca: es el perfil de la cara.",
        formas: [{ d: "M156 618 Q138 690 150 762 L232 768 Q274 700 264 626 Q210 606 156 618 Z" }],
        marca: [128, 700],
      },
      {
        n: 8,
        nombre: "Mejilla",
        tipo: "observacion",
        nota: "Zonas planas de amarillo y rosa cubren parte del hueso, como piel.",
        formas: [{ d: "M266 652 L470 640 L482 764 L300 772 Q256 724 266 652 Z" }],
        marca: [480, 652],
      },
    ],
  },
  {
    id: "mascara",
    nombre: "Máscara",
    color: "#4fb6f0",
    trazo: "14 5 3 5",
    intro: {
      tipo: "hecho",
      texto:
        "Según The Broad, en esta obra temprana Basquiat alude a la apropiación modernista de las máscaras africanas y usa la máscara para explorar la identidad.",
      fuente: "The Broad, ficha de la obra",
    },
    elementos: [
      {
        n: 9,
        nombre: "Contorno",
        tipo: "lectura",
        nota: "Un borde duro y cerrado, rematado por trazos cortos, recorta la cabeza contra el fondo como una pieza.",
        formas: [
          {
            d: "M148 522 L150 420 L175 340 L225 280 L320 224 L420 199 L540 197 L650 219 L740 264 L800 320 L840 400 L846 470 L816 540 L810 600 L830 690 L810 746 L740 776 L620 792 L590 832 L560 902 L510 962 L450 1002 L300 1012 L180 1006 L128 986 L114 900 L122 800 L114 740 L124 680 L120 600 Z",
          },
        ],
        marca: [848, 470],
      },
      {
        n: 10,
        nombre: "Plano frontal",
        tipo: "lectura",
        nota: "Ojos, nariz y dientes se apilan en una franja casi plana, vista de frente, como la cara de una máscara.",
        formas: [{ d: "M134 514 L470 514 L480 1000 L134 1000 Z" }],
        marca: [478, 1000],
      },
    ],
  },
  {
    id: "marcas",
    nombre: "Marcas",
    color: "#ff6252",
    trazo: "2 5",
    intro: {
      tipo: "hecho",
      texto:
        "Arriba y abajo, signos que parecen palabras «se comportan como un código, algo que solo el artista podía descifrar».",
      fuente: "The Broad, audioguía",
    },
    elementos: [
      {
        n: 11,
        nombre: "Signos",
        tipo: "observacion",
        nota: "Trazos negros que recuerdan letras, sobre una franja roja. MANIFESTO no los transcribe.",
        formas: [{ d: "M72 18 L548 18 Q558 18 558 28 L558 194 Q558 204 548 204 L72 204 Q62 204 62 194 L62 28 Q62 18 72 18 Z" }],
        marca: [558, 24],
      },
      {
        n: 12,
        nombre: "Trazos",
        tipo: "observacion",
        nota: "Abajo a la derecha, rayas azules y negras, rápidas y superpuestas.",
        formas: [{ d: "M598 858 L862 858 L862 1064 L598 1064 Z" }],
        marca: [590, 852],
      },
      {
        n: 13,
        nombre: "Peine",
        tipo: "observacion",
        nota: "Una línea con travesaños sale de la cabeza hacia el borde izquierdo.",
        formas: [{ d: "M42 478 L166 478 L166 550 L42 550 Z" }],
        marca: [40, 472],
      },
      {
        n: 14,
        nombre: "Barras",
        tipo: "observacion",
        nota: "Dos bandas negras verticales cierran el borde izquierdo del lienzo.",
        formas: [{ d: "M2 14 L54 14 L54 482 L2 482 Z" }, { d: "M2 554 L50 554 L50 836 L2 836 Z" }],
        marca: [60, 250],
      },
    ],
  },
];

export type Entrada = { tipo: Tipo; texto: string; fuente: string };

export type Hallazgo = {
  n: number;
  titulo: string;
  pregunta: string;
  texto: string;
  entradas: Entrada[];
  /** Zonas que el hallazgo deja a la vista (x, y, ancho, alto). */
  zonas: [number, number, number, number][];
  marca: Punto;
  capa?: CapaId;
};

const HOFFMAN = "Fred Hoffman, «The Defining Years», catálogo Basquiat (Brooklyn Museum, 2005), pp. 130–131, citado por Wikipedia; pendiente de cotejo";

export const HALLAZGOS: Hallazgo[] = [
  {
    n: 1,
    titulo: "El título que no le puso",
    pregunta: "¿Por qué la llamamos calavera?",
    texto: "Basquiat no le dio nombre: en el museo es Untitled. «Skull» llegó después, y se quedó.",
    entradas: [
      { tipo: "hecho", texto: "Se titula Untitled y así figura en la ficha de The Broad.", fuente: "The Broad, ficha de la obra" },
      {
        tipo: "lectura",
        texto: "Para el historiador Fred Hoffman, el nombre «Skull» viene de confundirla con el memento mori, donde una calavera significa muerte.",
        fuente: HOFFMAN,
      },
    ],
    zonas: [[112, 194, 740, 822]],
    marca: [868, 604],
  },
  {
    n: 2,
    titulo: "La mandíbula al descubierto",
    pregunta: "¿Es un cráneo?",
    texto: "Los dientes y la mandíbula se ven a través de la cara, como en una radiografía. De ahí nace la lectura de calavera.",
    entradas: [
      { tipo: "observacion", texto: "Bajo la mejilla amarilla aparecen los dientes y el hueso de la mandíbula, que llega hasta la nuca.", fuente: "Observación sobre la pintura" },
      {
        tipo: "lectura",
        texto: "Wikipedia atribuye a esa visión «como de rayos X» de las mandíbulas que se la tome por una calavera.",
        fuente: "Wikipedia, «Untitled (Skull)» (fuente secundaria)",
      },
    ],
    zonas: [[112, 738, 476, 280]],
    marca: [560, 1010],
    capa: "anatomia",
  },
  {
    n: 3,
    titulo: "Ojos sin mirada",
    pregunta: "¿Es un rostro?",
    texto: "Un ojo abierto de par en par y otro casi borrado. El museo los describe apagados.",
    entradas: [
      {
        tipo: "hecho",
        texto: "The Broad: «los ojos están apagados, el rostro hundido, y la cabeza parece lobotomizada y sometida».",
        fuente: "The Broad, ficha de la obra",
      },
      {
        tipo: "lectura",
        texto: "El museo sugiere que puede considerarse una forma de autorretrato. Su directora, Joanne Heyler, recuerda que nunca se ha verificado.",
        fuente: "The Broad, ficha de la obra y audioguía",
      },
    ],
    zonas: [[124, 506, 326, 152]],
    marca: [470, 520],
    capa: "rostro",
  },
  {
    n: 4,
    titulo: "Ruido interior",
    pregunta: "¿Qué hay dentro?",
    texto: "Fuera, una expresión apagada. Dentro, colores salvajes y marcas que no se quedan quietas.",
    entradas: [
      { tipo: "hecho", texto: "Para The Broad, esos colores y marcas «sugieren un exceso de actividad interior».", fuente: "The Broad, ficha de la obra" },
      {
        tipo: "hecho",
        texto: "Heyler: es «casi como si vieras a través de la cara de alguien, directamente su pensamiento».",
        fuente: "The Broad, audioguía",
      },
      {
        tipo: "lectura",
        texto: "Hoffman y la galerista Annina Nosei sospechaban que tardó en terminarla porque le intimidó la fuerza de la imagen.",
        fuente: HOFFMAN,
      },
    ],
    zonas: [[272, 222, 540, 346]],
    marca: [612, 420],
  },
  {
    n: 5,
    titulo: "Un código sin clave",
    pregunta: "¿Qué dicen esos signos?",
    texto: "Arriba y abajo hay marcas que parecen palabras. No las leemos: las señalamos.",
    entradas: [
      {
        tipo: "hecho",
        texto: "La audioguía de The Broad dice que se comportan «como un código, algo que solo el artista podía descifrar, una especie de ruptura de la comunicación».",
        fuente: "The Broad, audioguía",
      },
      { tipo: "lectura", texto: "Por eso MANIFESTO no las transcribe ni las traduce: cualquier lectura sería inventada.", fuente: "Interpretación de MANIFESTO" },
    ],
    zonas: [
      [56, 14, 508, 196],
      [594, 852, 272, 216],
    ],
    marca: [604, 148],
    capa: "marcas",
  },
];
