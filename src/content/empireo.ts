/** La ascensión al Empíreo (Bosch): datos, estaciones y perfil de luz. */

export const EMPIREO_IMG = {
  base: "/empireo/ascension",
  anchos: [640, 1200] as const,
  width: 1200,
  height: 2668,
  /** Proporción alto/ancho de la reproducción. */
  ratio: 4269 / 1920,
  alt: "Tabla vertical de El Bosco: figuras desnudas y ángeles ascienden en la oscuridad hacia un túnel circular de luz.",
};

/** Luminosidad media (0–100) de 48 franjas de la reproducción, de arriba abajo. Medida con sharp. */
export const PERFIL_LUZ = [10,10,11,16,19,21,23,25,28,30,30,32,35,36,33,29,26,20,16,12,12,11,12,11,12,14,14,14,13,13,14,15,16,17,18,19,22,20,17,16,17,17,18,20,22,24,26,24];

export type Estacion = {
  id: string;
  titulo: string;
  /** Centro en fracciones de la imagen (0–1, desde arriba/izquierda). */
  x: number;
  y: number;
  zoom: number;
  texto: string;
};

export const ESTACIONES: Estacion[] = [
  { id: "base", titulo: "Entre las alas", x: 0.32, y: 0.9, zoom: 1.6, texto: "El viaje empieza abajo: ángeles envueltos en mantos oscuros sostienen a los recién llegados. Casi no hay luz." },
  { id: "alma", titulo: "El cuerpo que se eleva", x: 0.62, y: 0.76, zoom: 1.6, texto: "Un desnudo de brazos abiertos sube sin esfuerzo, acompañado. Es la figura más iluminada de la mitad inferior." },
  { id: "guia", titulo: "Guiados", x: 0.36, y: 0.52, zoom: 1.8, texto: "Un ángel de alas rojas conduce a otra figura. Aquí la oscuridad se aclara: el fondo empieza a tener halo." },
  { id: "pareja", titulo: "Los que miran arriba", x: 0.82, y: 0.4, zoom: 2, texto: "Una pareja, ya fuera del grupo, alza la vista hacia el túnel. Nadie mira atrás." },
  { id: "luz", titulo: "La luz", x: 0.31, y: 0.268, zoom: 2.4, texto: "Dentro del túnel, una figura diminuta espera ante un círculo casi blanco. Es lo más luminoso del cuadro y lo más pequeño." },
];

export const DOCUMENTADO = [
  "Es una de las cuatro tablas de las «Visiones del más allá» (Paraíso terrenal, Ascensión al Empíreo, Caída de los condenados e Infierno).",
  "Óleo sobre tabla de unos 88 × 40 cm (las fuentes dan entre 86,5 y 88,8 cm de alto). Se conserva en el Palazzo Ducale de Venecia.",
  "Las tablas pertenecieron al cardenal Domenico Grimani, que las legó a Venecia en 1523; la referencia más antigua conocida es de 1521.",
  "Datación estilística hacia 1505–1515; un estudio dendrocronológico propone fechas anteriores y no está verificado aquí.",
  "En la cosmología medieval, el Empíreo es el cielo más alto, hecho de luz: así lo describe Dante en el Paraíso.",
];

export const INTERPRETACION = [
  "El túnel de luz recuerda a los relatos modernos de experiencias cercanas a la muerte: es una lectura actual, no una intención documentada de Bosch.",
  "La ascensión sin esfuerzo, sin peso ni juicio, contrasta con la «Caída de los condenados», su tabla hermana.",
  "El aumento de luz que mide esta página es de la reproducción, no de la tabla original.",
];

export const CREDITOS = {
  imagen: "Reproducción: Hieronymus Bosch, Ascensión de los bienaventurados (Visiones del más allá), vía Wikimedia Commons (archivo a partir del Bosch Research and Conservation Project). Redimensionada y convertida a WebP.",
  nota: "La pintura (c. 1505–1515) es de dominio público. Wikimedia Commons marca esta reproducción como dominio público, pero esa marca no sustituye una licencia del titular de la fotografía.",
  fuentes: [
    { label: "Ascent of the Blessed — Wikipedia", href: "https://en.wikipedia.org/wiki/Ascent_of_the_Blessed" },
    { label: "Archivo en Wikimedia Commons", href: "https://commons.wikimedia.org/wiki/File:Visions_of_the_Hereafter_-_Ascent_of_the_Blessed.jpg" },
    { label: "Bosch Research and Conservation Project", href: "http://boschproject.org/bosch_in_venice.html" },
    { label: "Palazzo Ducale, Venecia", href: "https://palazzoducale.visitmuve.it/" },
  ],
};
