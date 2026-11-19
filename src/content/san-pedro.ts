/** San Pedro penitente (Taller de Jusepe de Ribera): datos, textos y créditos. */

export const SP_IMG = {
  base: "/san-pedro/san-pedro",
  /** Anchos reales derivados del original de 1576 × 2000 px (sin ampliar). */
  anchos: [600, 1200, 1576] as const,
  width: 1576,
  height: 2000,
  ratio: 1576 / 2000,
  alt: "Pedro, anciano de barba y cabello canosos, con la boca entreabierta y la mirada alzada al cielo, apoya la cabeza en una mano. Viste un manto pardo y ocre y con la otra mano sostiene un objeto oscuro. A la derecha hay un bloque de piedra claro. El fondo es oscuro; la luz cae sobre el rostro, la barba y el manto.",
};

export const FICHA = {
  titulo: "San Pedro penitente",
  tituloOriginal: "The Penitent Saint Peter",
  autor: "Taller de Jusepe de Ribera",
  fecha: "siglo XVII",
  tecnica: "Óleo sobre lienzo",
  dimensiones: "125,7 × 99,4 cm",
  procedencia:
    "Sotheby's, Nueva York, 5 de junio de 2014, lote 31 (entonces como Jusepe de Ribera); Christie's, Nueva York, 17 de abril de 2024, venta 23048, lote 203",
};

export const ACTOS = {
  i: "Acto I · El encuentro a oscuras",
  ii: "Acto II · Las tres negaciones",
  iii: "Acto III · El silencio",
  iv: "Acto IV · Lo que permanece",
};

/**
 * Citas: Reina-Valera Antigua (dominio público), según Bible Gateway.
 * Se conserva la ortografía de la edición.
 */
export const DOCUMENTADO = [
  "Según Mateo 16:18, Jesús dijo a Simón: «tú eres Pedro, y sobre esta piedra edificaré mi iglesia».",
  "La noche del arresto, Pedro siguió a Jesús «de lejos» hasta la casa del príncipe de los sacerdotes y se sentó junto al fuego que habían encendido en la sala (Lucas 22:54–55). Allí fue reconocido tres veces y tres veces lo negó. Los cuatro Evangelios cuentan el episodio: Mateo 26:69–75, Marcos 14:66–72, Lucas 22:54–62 y Juan 18:15–27.",
  "Esta versión se cataloga como taller de Jusepe de Ribera (Xàtiva, 1591 – Nápoles, 1652). Christie's la describe como probable producción de taller de una composición que Ribera repitió varias veces, la más conocida la versión firmada y fechada en 1628 de la Corporation Art Gallery de Glasgow.",
];

export const NEGACIONES = [
  {
    numero: 1,
    cita: "Mujer, no le conozco.",
    fuente: "Lucas 22:57",
    contexto:
      "Una criada lo ve sentado junto al fuego y dice: «Y éste con él estaba» (Lucas 22:56). Pedro lo niega.",
  },
  {
    numero: 2,
    cita: "Hombre, no soy.",
    fuente: "Lucas 22:58",
    contexto:
      "Un poco después, otro lo reconoce: «Y tú de ellos eras». Juan 18:25 recoge la misma negación junto al fuego: «No soy».",
  },
  {
    numero: 3,
    cita: "Hombre, no sé qué dices.",
    fuente: "Lucas 22:60",
    contexto:
      "Pasada una hora, un tercero insiste en que estaba con él. Marcos 14:71 añade que Pedro empezó a maldecir y a jurar.",
  },
];

export const GALLO = {
  cita: "Y luego, estando él aún hablando, el gallo cantó.",
  fuente: "Lucas 22:60",
};

export const SILENCIO = {
  texto: "Lo que sigue a la traición no tiene fondo.",
  tipo: "Interpretación de MANIFESTO" as const,
  /** La brasa es el fuego del patio: dato del Evangelio, uso narrativo. */
  nota: "La brasa es el fuego junto al que Pedro se sentó (Lucas 22:55).",
};

export const REAPARICION = {
  intro: "Entonces, vuelto el Señor, miró a Pedro.",
  introFuente: "Lucas 22:61",
  cita: "Y saliendo fuera Pedro, lloró amargamente.",
  fuente: "Lucas 22:62",
};

export const DOCUMENTADO_FINAL = [
  "Pedro, anciano de barba y cabello canosos, alza los ojos al cielo con la boca entreabierta y apoya la cabeza en una mano; con la otra sostiene un objeto oscuro. Christie's describe las lágrimas en sus ojos y mejillas y el rostro vuelto hacia el cielo, iluminado desde arriba.",
  "No hay gallo, ni fuego, ni patio: solo la figura de medio cuerpo, un bloque de piedra y un fondo oscuro. La luz modela el rostro, la barba y el manto ocre y deja el resto en sombra.",
];

export const INTERPRETACION = [
  "Ribera no pinta el momento de las negaciones. Pinta lo que queda después: un hombre solo con el peso de lo que ha dicho.",
  "En esta experiencia la luz se retira con cada negación porque lo que se pierde no es material, y vuelve de otra manera: no como estaba. Es una lectura de MANIFESTO, no un dato de la pintura ni de los Evangelios.",
];

export const CREDITOS = {
  imagen:
    "Reproducción: fotografía de la pintura publicada en Wikimedia Commons («The penitent Saint Peter.jpg», 1576 × 2000 px), clasificada allí como dominio público; su crédito remite a Sotheby's, Nueva York, 5 de junio de 2014, lote 31. La obra es la que Christie's vendió en 2024 como taller de Ribera. Prototipo local: antes de cualquier publicación hay que revisar las condiciones de uso en cada jurisdicción.",
  nota: "Las intervenciones visuales (luz, sombra, brasa, saturación) son creaciones originales de MANIFESTO. Citas bíblicas: Reina-Valera Antigua (dominio público).",
  fuentes: [
    {
      label: "Christie's, venta 23048, lote 203 (17 abr. 2024)",
      href: "https://www.christies.com/en/lot/lot-6474861",
    },
    {
      label: "Wikimedia Commons — The penitent Saint Peter",
      href: "https://commons.wikimedia.org/wiki/File:The_penitent_Saint_Peter.jpg",
    },
  ],
};
