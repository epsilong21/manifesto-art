/**
 * La loca Meg (Bruegel el Viejo): Cartografía del caos.
 * Coordenadas x, y en fracciones de la reproducción (0–1 desde arriba/izquierda),
 * calibradas a mano sobre esta misma imagen (2000 × 1442) con recortes y rejilla.
 */

export const MEG_IMG = {
  base: "/dulle-griet/dulle-griet",
  anchos: [1000, 2000] as const,
  width: 2000,
  height: 1442,
  /** Alto / ancho de la reproducción (la tabla mide 115 × 161 cm: 0,71). */
  ratio: 1442 / 2000,
  alt: "La loca Meg, de Pieter Bruegel el Viejo: una mujer con casco y peto avanza a zancadas, cargada de cacharros, hacia una boca monstruosa, entre incendios, criaturas híbridas y una multitud de mujeres.",
};

export type Punto = { id: string; titulo: string; x: number; y: number; zoom: number; texto: string };
export type Zona = { x: number; y: number; w: number; h: number };

export type Territorio = {
  id: string;
  nombre: string;
  /** Encuadre del territorio; sin él se muestra el cuadro entero con los objetos marcados. */
  vista?: { x: number; y: number; zoom: number };
  /** Zona que queda iluminada; el resto se oscurece. */
  zona?: Zona;
  /** Anillos sobre el cuadro entero (solo el territorio de los objetos). */
  anillos?: { x: number; y: number }[];
  seVe: string;
  interpretacion: string;
  descubrimientos: [Punto, Punto];
};

export const TERRITORIOS: Territorio[] = [
  {
    id: "meg",
    nombre: "Meg y su avance",
    vista: { x: 0.41, y: 0.69, zoom: 2.2 },
    zona: { x: 0.3, y: 0.46, w: 0.25, h: 0.46 },
    seVe: "Una mujer con casco, peto y espada cruza el cuadro a zancadas, cargada de cacharros, con la mirada puesta en la izquierda.",
    interpretacion: "Se la ha leído como sátira de la mujer pendenciera, como figura de la codicia y como heroína. El cuadro no decide entre esas lecturas.",
    descubrimientos: [
      { id: "armadura", titulo: "Armadura y paso largo", x: 0.36, y: 0.56, zoom: 4, texto: "Lleva casco, peto y una manga roja; la falda azul grisácea se echa hacia atrás con el paso." },
      { id: "botin", titulo: "El botín", x: 0.43, y: 0.66, zoom: 4.2, texto: "Del brazo cuelga un cesto de platos y cacerolas, y junto a él un saco blanco." },
    ],
  },
  {
    id: "boca",
    nombre: "La boca del infierno",
    vista: { x: 0.15, y: 0.56, zoom: 2.3 },
    zona: { x: 0.0, y: 0.34, w: 0.27, h: 0.46 },
    seVe: "Un rostro enorme ocupa la izquierda y abre una boca dentada a ras de suelo; dentro se mueven figuras pequeñas.",
    interpretacion: "Se identifica como la entrada del infierno, hacia donde avanza Meg, y se relaciona con la tradición de El Bosco.",
    descubrimientos: [
      { id: "ojo", titulo: "El ojo", x: 0.16, y: 0.43, zoom: 4.5, texto: "Un ojo abierto bajo una tablilla a modo de ceja; un tronco seco cruza la cara." },
      { id: "dentro", titulo: "Dentro de la boca", x: 0.17, y: 0.68, zoom: 4.2, texto: "Entre los dientes se ven figuras diminutas que gesticulan, un yelmo y una barca." },
    ],
  },
  {
    id: "paisaje",
    nombre: "El paisaje en conflicto",
    vista: { x: 0.62, y: 0.27, zoom: 1.7 },
    zona: { x: 0.32, y: 0.0, w: 0.62, h: 0.56 },
    seVe: "A la derecha arden edificios y un barco con estandarte; en el centro, una figura vestida de rosa cuelga boca abajo con una barca encima; el cielo rojizo se vuelve verdoso hacia el medio.",
    interpretacion: "La mezcla de incendio, guerra y fantasía se ha leído como un mundo al revés. El cuadro no lo rotula.",
    descubrimientos: [
      { id: "incendio", titulo: "El incendio", x: 0.86, y: 0.28, zoom: 3.3, texto: "Casas en llamas junto a una escala, por la que sube una criatura con una jaula en la mano." },
      { id: "cupula", titulo: "La cúpula transparente", x: 0.54, y: 0.28, zoom: 4, texto: "Una cúpula de cristal cubre una casa y un recodo de río; debajo, una barca llena de figuras." },
    ],
  },
  {
    id: "criaturas",
    nombre: "Las criaturas y sus acciones",
    vista: { x: 0.31, y: 0.88, zoom: 1.7 },
    zona: { x: 0.0, y: 0.76, w: 0.61, h: 0.24 },
    seVe: "Abajo hay seres mitad objeto, mitad animal: uno sostiene un cuenco con cuchara, otro lleva una olla de sombrero, otro asoma de un huevo.",
    interpretacion: "Son criaturas del repertorio de El Bosco; qué hace exactamente cada una no está documentado.",
    descubrimientos: [
      { id: "huevo", titulo: "El huevo en el nido", x: 0.29, y: 0.94, zoom: 4.5, texto: "Un huevo roto en un nido deja ver una cara pequeña; un pájaro oscuro se posa encima." },
      { id: "olla", titulo: "El de la olla", x: 0.41, y: 0.915, zoom: 4.5, texto: "Una olla con un cuchillo hace de sombrero sobre un cuerpo blanco y redondo; una vara larga llega hasta su mano." },
    ],
  },
  {
    id: "objetos",
    nombre: "Objetos y símbolos cotidianos",
    anillos: [
      { x: 0.157, y: 0.12 },
      { x: 0.37, y: 0.13 },
      { x: 0.5, y: 0.565 },
      { x: 0.79, y: 0.46 },
      { x: 0.29, y: 0.94 },
    ],
    seVe: "Sartenes, cestos, calderos, jaulas y esferas aparecen por todo el cuadro, usados como armas, refugios o casas.",
    interpretacion: "Se ha propuesto leerlos como refranes ilustrados; sin rótulos, cada lectura es una hipótesis.",
    descubrimientos: [
      { id: "sarten", titulo: "La sartén", x: 0.5, y: 0.565, zoom: 4.5, texto: "Una sartén de mango largo asoma junto al hombro de Meg, sobre platos y cacerolas." },
      { id: "caldero", titulo: "El caldero", x: 0.79, y: 0.46, zoom: 4, texto: "Un caldero enorme, sobre una torre roja, lleva dentro hombres con casco y lanzas que asoman por el borde." },
    ],
  },
];

/** `territorio` es el índice en TERRITORIOS al que pertenece el elemento. */
export type Nodo = Punto & { territorio: number; relacion: string };
export type Pista = { id: string; titulo: string; pregunta: string; nodos: [Nodo, Nodo, Nodo]; lectura: string };

export const PISTAS: Pista[] = [
  {
    id: "cascaras",
    titulo: "Mundos en una cáscara",
    pregunta: "¿Cuántas veces algo vive dentro de una cáscara, una esfera o una jaula?",
    nodos: [
      { id: "huevo", titulo: "El huevo abierto", territorio: 3, relacion: "Punto de partida", x: 0.29, y: 0.94, zoom: 4.5, texto: "Un huevo roto en un nido aloja una cara pequeña." },
      { id: "cascara", titulo: "La cáscara verde", territorio: 2, relacion: "Se repite", x: 0.4, y: 0.275, zoom: 4.2, texto: "Una gran cáscara ovalada, abierta por un lado, aloja una figura oscura." },
      { id: "esfera", titulo: "La esfera enrejada", territorio: 4, relacion: "Se repite", x: 0.157, y: 0.12, zoom: 4.2, texto: "Una esfera de rejas cuelga de un gancho curvo, arriba a la izquierda." },
    ],
    lectura: "Lectura de esta página: la idea de un interior protegido se repite como cáscara, cúpula o jaula, en un mundo donde nada protege de verdad.",
  },
  {
    id: "cocina",
    titulo: "De la cocina a la batalla",
    pregunta: "¿Qué pasa cuando los utensilios de casa se usan como armas?",
    nodos: [
      { id: "sarten", titulo: "La sartén de Meg", territorio: 0, relacion: "Punto de partida", x: 0.5, y: 0.565, zoom: 4.5, texto: "Una sartén de mango largo, tan a mano como la espada que Meg lleva en la otra." },
      { id: "olla", titulo: "La olla-sombrero", territorio: 3, relacion: "Se transforma", x: 0.41, y: 0.915, zoom: 4.5, texto: "Una olla con un cuchillo clavado hace de sombrero sobre una criatura." },
      { id: "caldero", titulo: "El caldero fortaleza", territorio: 4, relacion: "Se transforma", x: 0.79, y: 0.46, zoom: 4, texto: "Un caldero enorme hace de fortaleza para hombres con casco y lanzas." },
    ],
    lectura: "Lectura de esta página: el menaje cambia de oficio tres veces (arma, sombrero, fortaleza) y deja la cocina fuera de su sitio.",
  },
  {
    id: "bocas",
    titulo: "Bocas abiertas",
    pregunta: "¿Hay otras bocas, además de la del infierno?",
    nodos: [
      { id: "boca", titulo: "La boca dentada", territorio: 1, relacion: "Punto de partida", x: 0.14, y: 0.58, zoom: 4, texto: "La boca del gran rostro, con dientes, hacia la que avanza Meg." },
      { id: "pez", titulo: "El pez que escupe", territorio: 3, relacion: "Se repite", x: 0.79, y: 0.9, zoom: 4.5, texto: "Una cabeza de pez abre la boca y de ella sale un brazo largo y delgado." },
      { id: "cueva", titulo: "El arco oscuro", territorio: 2, relacion: "Contrasta", x: 0.95, y: 0.74, zoom: 4, texto: "A la derecha, una abertura oscura sobre un grupo de hombres con casco: una puerta negra frente a la boca de Meg." },
    ],
    lectura: "Lectura de esta página: la boca de la izquierda es la que Meg busca; las de la derecha esperan a los demás.",
  },
];

/** Estación de restauración: cielo recuperado y fecha. */
export const RESTAURACION = {
  cielo: { x: 0.55, y: 0.1, zoom: 2.6 },
  hitos: [
    { fecha: "Enero de 2017", texto: "La tabla llega al instituto belga KIK-IRPA, en Bruselas, para su restauración y estudio." },
    { fecha: "Septiembre de 2018", texto: "Se presentan los resultados: el cielo recupera su azul verdoso y la fecha pasa de 1561 a 1563." },
    { fecha: "Enero de 2019", texto: "Vuelve a colgar en el Museum Mayer van den Bergh, en Amberes." },
  ],
};

export const DOCUMENTADO = [
  "Óleo sobre tabla de 115 × 161 cm, de Pieter Bruegel el Viejo, en el Museum Mayer van den Bergh de Amberes (inventario MMB.0045).",
  "Se fechaba en 1561. Al limpiarla y retirar repintes históricos apareció en la tabla la fecha «1563». Bruegel se casó, con toda probabilidad en Bruselas, en agosto de ese año; no se sabe con precisión cuándo se trasladó allí.",
  "La restauración, en el KIK-IRPA (Bruselas), empezó en enero de 2017 y duró más de dieciocho meses. Recuperó un cielo azul verdoso que llevaba décadas oculto bajo repintes y barniz amarillento.",
  "El análisis descartó que Bruegel hubiera escrito «Dul» como título: esos trazos se añadieron después.",
  "«Dulle Griet» es un personaje del folclore flamenco, asociado a un refrán: «podía saquear delante del infierno y volver indemne».",
];

export const INTERPRETACION = [
  "Si Meg es una sátira, una figura de la codicia o una heroína es una cuestión abierta; las fuentes consultadas no coinciden.",
  "El rostro de la izquierda se identifica como boca del infierno y se vincula con El Bosco; el cuadro no lleva rótulos.",
  "Los «territorios» y las pistas de esta página son una manera de ordenar la mirada, no una estructura que Bruegel marcara.",
  "Las lecturas de las pistas (cáscaras, menaje, bocas) son de esta página y están marcadas como tales.",
];

export const CREDITOS = {
  imagen: "Reproducción completa posterior a la restauración: Dulle Griet, Pieter Bruegel I, Museum Mayer van den Bergh (MMB.0045). Foto: Cedric Verhelst, vía Art in Flanders (Vlaamse Kunstcollectie, licencia «public domain») y Wikimedia Commons. Redimensionada y convertida a WebP.",
  nota: "La pintura (1563) es de dominio público. La ficha de Art in Flanders marca esta fotografía como dominio público. En esta página no hay imágenes de la obra «antes» de la restauración, así que no se simula ninguna comparación.",
  fuentes: [
    { label: "Art in Flanders: Dulle Griet (MMB.0045)", href: "https://artinflanders.be/en/artwork/0750026000" },
    { label: "Museum Mayer van den Bergh: la restauración de Dulle Griet", href: "https://museummayervandenbergh.be/en/page/restoration-dulle-griet-reveals-unseen-wealth-colour-and-fresh-discoveries" },
    { label: "Vlaamse Kunstcollectie: restauración de Dulle Griet", href: "https://vlaamsekunstcollectie.be/en/news/restoration-bruegel-dullegriet" },
    { label: "Art & Object: comunicado de prensa de la restauración (2018)", href: "https://artandobject.com/news/restoration-dulle-griet-reveals-fresh-discoveries" },
    { label: "KIK-IRPA: comunicado del 18 de septiembre de 2018", href: "https://www.kikirpa.be/files/Pers/Persberichten-ouder-FR/18-septembre-2018-La-restauration-et-l%E2%80%99e%CC%81tude-de-la-Dulle-Griet-du-Muse%CC%81e-Mayer-van-den-Bergh-de%CC%81voilent-une-palette-inoui%CC%88e-et-de-nouvelles-de%CC%81couvertes.pdf" },
    { label: "VRT NWS: «Dulle Griet» is weer thuis in Antwerpen", href: "https://www.vrt.be/vrtnws/nl/2019/01/22/_dulle-griet_-is-weer-thuis-in-antwerpen/" },
  ],
};
