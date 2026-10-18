/**
 * Los elefantes, Salvador Dalí. Contenido editorial.
 *
 * DERECHOS: obra protegida hasta el 1 de enero de 2060 (70 años desde la muerte
 * del autor, 1989). Su reproducción requiere autorización de la Fundació
 * Gala-Salvador Dalí, que la gestiona a través de VEGAP. Esta página NO
 * reproduce ni imita la obra: usa diagramas conceptuales propios.
 *
 * Datos de catálogo de fuente secundaria (Wikipedia), pendientes de cotejo con
 * el catálogo razonado de la Fundació.
 */

export const ELEFANTES = {
  titulo: "Los elefantes",
  original: "Els elefants",
  autor: "Salvador Dalí",
  vida: "Figueres, 1904–1989",
  fecha: "1948",
  tecnica: "Óleo sobre lienzo",
  medidas: "49 × 60 cm",
  ubicacion: "Colección privada",
  estadoDatos: "Datos de catálogo pendientes de verificar en el catálogo razonado de la Fundació Gala-Salvador Dalí.",
} as const;

export type Capa = {
  id: "masa" | "soporte" | "carga" | "vacio";
  nombre: string;
  concepto: string;
  texto: string;
  tipo: "hecho" | "lectura";
};

/** Las cuatro capas de la deconstrucción: ideas, no partes del cuadro. */
export const CAPAS_ELEFANTES: Capa[] = [
  {
    id: "vacio",
    nombre: "El vacío",
    concepto: "Escala",
    tipo: "hecho",
    texto:
      "A diferencia de otras obras de Dalí, llenas de detalles, aquí el fondo es despejado y en degradado: los animales son el centro absoluto.",
  },
  {
    id: "soporte",
    nombre: "Las patas",
    concepto: "Fragilidad",
    tipo: "lectura",
    texto:
      "Las patas largas, finas y con muchas articulaciones se han descrito como «patas del deseo» y se han leído como símbolo de la memoria y sus distorsiones.",
  },
  {
    id: "masa",
    nombre: "El elefante",
    concepto: "Fuerza",
    tipo: "lectura",
    texto:
      "En muchas culturas el elefante simboliza fuerza, poder y peso. Dalí conserva ese cuerpo y le quita el apoyo: el símbolo de la estabilidad queda en equilibrio imposible.",
  },
  {
    id: "carga",
    nombre: "El obelisco",
    concepto: "Peso",
    tipo: "hecho",
    texto:
      "Los obeliscos sobre los lomos remiten al Elefante y obelisco de Gian Lorenzo Bernini (1667), en la piazza della Minerva de Roma, una referencia que el propio Dalí mencionó.",
  },
];

export const CONTEXTO_ELEFANTES: { id: string; titulo: string; texto: string; tipo: "hecho" | "lectura" }[] = [
  {
    id: "motivo",
    titulo: "Un motivo que vuelve",
    tipo: "hecho",
    texto:
      "El elefante de patas de zancuda aparece por primera vez en Sueño causado por el vuelo de una abeja alrededor de una granada un segundo antes del despertar (1944). Reaparece en La tentación de San Antonio (1946), y en Los elefantes se convierte en el único protagonista.",
  },
  {
    id: "bernini",
    titulo: "Roma, 1667",
    tipo: "hecho",
    texto:
      "Bernini colocó un pequeño obelisco egipcio, de 5,47 m, sobre el lomo de un elefante de mármol. Dalí toma esa imagen de peso sostenido y la lleva al límite.",
  },
  {
    id: "suenio",
    titulo: "Sueño y psicoanálisis",
    tipo: "lectura",
    texto:
      "Dalí creía en el poder de los sueños, influido por el psicoanálisis freudiano. El elefante sobre patas imposibles funciona como una imagen de sueño: lógica en apariencia, absurda al examinarla.",
  },
];

export const DERECHOS_DALI = {
  hasta: "1 de enero de 2060",
  gestion: "Fundació Gala-Salvador Dalí, a través de VEGAP",
  texto:
    "La obra de Salvador Dalí está protegida por derechos de autor. Reproducirla, incluso en una web, requiere la autorización de la Fundació Gala-Salvador Dalí, gestionada por VEGAP.",
};

/**
 * «El desierto imposible»: escena original de MANIFESTO generada con código
 * (SVG, CSS y GSAP). Interpreta ideas generales (peso, fragilidad,
 * percepción) sin reproducir ni imitar la composición de la pintura: no hay
 * animales ni figuras sobre patas.
 */
export const DESIERTO = {
  nombre: "El desierto imposible",
  notaBreve: "Escena original de MANIFESTO, generada con código. No reproduce ni imita la pintura.",
  nota: "Escena original de MANIFESTO generada con código. No reproduce ni imita la pintura de Dalí: interpreta ideas generales de peso, fragilidad y percepción.",
  esculturas: {
    masa: {
      nombre: "La roca sobre la aguja",
      texto: "Cientos de toneladas de piedra apoyadas en un único punto. La masa parece estable solo porque nadie la ha tocado todavía.",
    },
    soporte: {
      nombre: "El mojón invertido",
      texto: "Un apilamiento de piedras al revés: cada una pesa más que todas las que la sostienen. Un leve temblor basta para dudar de ella.",
    },
    carga: {
      nombre: "El monolito suspendido",
      texto: "Una aguja de piedra cuelga de un hilo que no termina en ninguna parte. Su sombra, abajo, es lo único que toca la arena.",
    },
    vacio: {
      nombre: "La puerta en el horizonte",
      texto: "Una puerta sola en mitad de la nada. A su lado, una figura diminuta da la medida del vacío y convierte las esculturas en colosos.",
    },
  } satisfies Record<Capa["id"], { nombre: string; texto: string }>,
  /**
   * Hitos señalizados en la arena: abren el contexto histórico.
   * Marca y rótulo salen de los textos documentados de CONTEXTO_ELEFANTES.
   */
  hitos: {
    bernini: { marca: "1667", rotulo: "Bernini, Roma" },
    motivo: { marca: "1944", rotulo: "Primera aparición" },
    suenio: { marca: "Sueño", rotulo: "Psicoanálisis" },
  } as Record<string, { marca: string; rotulo: string }>,
};

/**
 * La pintura auténtica (V4). Obra protegida: su reproducción no está incluida
 * en este repositorio y requiere autorización (Fundació Gala-Salvador Dalí /
 * VEGAP). Sin el archivo, la página usa ObraPendiente (src/lib/obraElefantes.ts).
 */
export const OBRA_ELEFANTES = {
  imagen: { src: "/obras/los-elefantes-referencia.jpg", width: 1596, height: 1270 },
  alt: "Los elefantes, de Salvador Dalí: dos elefantes de patas larguísimas y articuladas, con obeliscos sobre el lomo, se encuentran frente a frente bajo un cielo rojo que se vuelve amarillo en el horizonte. Abajo, en el desierto, un pequeño templo y dos figuras diminutas.",
  credito: {
    corto: "Salvador Dalí, Los elefantes, 1948. © Fundació Gala-Salvador Dalí, VEGAP.",
    obra: "Salvador Dalí, Los elefantes (Els elefants), 1948. Óleo sobre lienzo, 49 × 60 cm. Colección particular.",
    derechos: "© Salvador Dalí, Fundació Gala-Salvador Dalí, VEGAP.",
    imagen: "Imagen: reproducción no incluida en este repositorio.",
    autorizacion: "Autorización de reproducción: pendiente.",
  },
};

/** Capas de lectura: no ampliamos la imagen, la leemos desde tres ángulos. */
export type CapaLectura = "Composición" | "Símbolo" | "Contexto";

export type Entrada = {
  capa: CapaLectura;
  tipo: "hecho" | "lectura" | "observacion";
  texto: string;
  fuente: string;
};

/** Zona sobre la reproducción, en % (x, y = esquina superior izquierda). */
export type Zona = { x: number; y: number; w: number; h: number };

export type Descubrimiento = {
  id: "colosos" | "patas" | "obeliscos" | "peso" | "desierto";
  titulo: string;
  /** Lo primero que se lee: una pregunta breve de MANIFESTO. */
  pregunta: string;
  /** Explicación inicial: dos frases como máximo. */
  intro: string;
  /** Encuadre curado. Sin zona, la obra completa. */
  zona?: Zona;
  /** Encuadre de partida de la transición (la cámara viaja de aquí a la zona). */
  desde?: Zona;
  entradas: Entrada[];
  enlace?: { texto: string; href: string };
};

/**
 * Cinco capítulos para descifrar la pintura. Zonas (y las guías de
 * GuiasObra.tsx) calibradas sobre la reproducción de referencia
 * (1596 × 1270 px): si cambia el archivo, recalibrar.
 * Fuentes: historia-arte.com (Miguel Calvo Santos, 2017) y Wikipedia,
 * «The Elephants», con las citas que recoge cada artículo.
 */
export const DESCUBRIMIENTOS: Descubrimiento[] = [
  {
    id: "colosos",
    titulo: "Dos colosos frente a frente",
    pregunta: "¿Se están mirando?",
    intro:
      "Dos elefantes se encuentran frente a frente, uno en cada borde del cuadro. Entre ellos, más de la mitad del lienzo queda vacía.",
    entradas: [
      {
        capa: "Composición",
        tipo: "hecho",
        texto:
          "Dos elefantes cruzan un desierto al atardecer. A diferencia de otras obras de Dalí, apenas hay más figuras, objetos o detalles: ellos son el centro absoluto.",
        fuente: "historia-arte.com; Wikipedia",
      },
      {
        capa: "Símbolo",
        tipo: "lectura",
        texto:
          "El elefante suele asociarse a la fuerza, el poder y el peso. Dalí conserva el cuerpo enorme y da la vuelta a la idea: lo convierte en un ser frágil.",
        fuente: "Wikipedia; historia-arte.com",
      },
      {
        capa: "Contexto",
        tipo: "hecho",
        texto:
          "El elefante de patas de zancuda aparece por primera vez en «Sueño causado por el vuelo de una abeja alrededor de una granada un segundo antes del despertar» (1944) y vuelve en «La tentación de San Antonio».",
        fuente: "Wikipedia",
      },
    ],
  },
  {
    id: "patas",
    titulo: "Patas del deseo",
    pregunta: "¿Cuánto miden sus patas?",
    intro:
      "Casi tres cuartas partes de la altura de cada elefante son patas. Largas, finas y articuladas en varios puntos, como las de una araña.",
    zona: { x: 0, y: 24, w: 38, h: 73 },
    desde: { x: 0, y: 12, w: 38, h: 40 },
    entradas: [
      {
        capa: "Composición",
        tipo: "hecho",
        texto:
          "Larguísimas, finas, casi de araña y articuladas en varios puntos. Se han descrito como «patas del deseo, multiarticuladas, casi invisibles».",
        fuente: "Wikipedia, citando la colección Dalí Universe; historia-arte.com",
      },
      {
        capa: "Símbolo",
        tipo: "lectura",
        texto: "Se han interpretado como un símbolo de la memoria y de sus distorsiones.",
        fuente: "SINGULART (2023), citado en Wikipedia",
      },
    ],
    enlace: { texto: "Pruébalo en el laboratorio de lo imposible", href: "#laboratorio" },
  },
  {
    id: "obeliscos",
    titulo: "Un obelisco llegado de Roma",
    pregunta: "¿Qué hace un obelisco sobre un elefante?",
    intro:
      "Es una cita de Roma: el «Elefante y obelisco» de Bernini, de 1667. Junto a su firma, Dalí escribió «Roma 1948».",
    zona: { x: 77, y: 0, w: 23, h: 16 },
    entradas: [
      {
        capa: "Contexto",
        tipo: "hecho",
        texto:
          "Los obeliscos remiten al «Elefante y obelisco» de Gian Lorenzo Bernini (1667), en la piazza della Minerva de Roma. El propio Dalí mencionó esta referencia en varias ocasiones.",
        fuente: "Wikipedia, citando a M. Taylor en D. Ades (ed.), «Dalí», 2004",
      },
      {
        capa: "Composición",
        tipo: "hecho",
        texto: "Junto a la firma, en la esquina superior derecha, Dalí escribió «Roma 1948».",
        fuente: "historia-arte.com",
      },
      {
        capa: "Símbolo",
        tipo: "lectura",
        texto:
          "Bernini hizo que un elefante sostuviera un obelisco. Dalí conserva la carga y le quita la solidez al animal que la sostiene.",
        fuente: "Lectura de MANIFESTO",
      },
    ],
  },
  {
    id: "peso",
    titulo: "El peso que no pesa",
    pregunta: "¿Dónde se apoya todo ese peso?",
    intro:
      "Cuerpo y obelisco forman una masa enorme sobre cuatro patas finísimas. Y, mirada de cerca, la carga ni siquiera descansa sobre el lomo.",
    zona: { x: 4, y: 0, w: 23, h: 44 },
    entradas: [
      {
        capa: "Composición",
        tipo: "observacion",
        texto: "Los obeliscos no descansan sobre el lomo: flotan sobre él.",
        fuente: "Wikipedia",
      },
      {
        capa: "Símbolo",
        tipo: "lectura",
        texto:
          "Dalí refuerza la apariencia de fuerza con cargas enormes y, a la vez, la desmiente. Se ha descrito como un contraste entre el peso y el espacio.",
        fuente: "Wikipedia",
      },
    ],
  },
  {
    id: "desierto",
    titulo: "Un desierto casi vacío",
    pregunta: "¿Quién más hay en el cuadro?",
    intro:
      "Abajo, casi perdidos en el horizonte, dos figuras diminutas y un pequeño templo. A su lado, los elefantes parecen todavía más grandes.",
    desde: { x: 37, y: 89, w: 26, h: 11 },
    entradas: [
      {
        capa: "Composición",
        tipo: "hecho",
        texto:
          "Al fondo, un paisaje desértico con algunas colinas, dos estatuas-maniquí al estilo de De Chirico y una especie de templo.",
        fuente: "historia-arte.com",
      },
      {
        capa: "Símbolo",
        tipo: "lectura",
        texto: "El fondo despejado y en degradado deja a los elefantes como protagonistas absolutos.",
        fuente: "Wikipedia",
      },
    ],
  },
];

/** Invitación al terminar el recorrido: de la obra real a la interpretación de MANIFESTO. */
export const CIERRE_LECTURA = {
  titulo: "Ya conoces la obra. Ahora descubre nuestra interpretación.",
  texto: `«${DESIERTO.nombre}» parte de las mismas preguntas (peso, fragilidad, escala) con esculturas propias. No reproduce la pintura.`,
  accion: `Entrar en ${DESIERTO.nombre}`,
};

/** Las guías dibujadas sobre la obra son de MANIFESTO, no de Dalí. */
export const NOTA_GUIAS = "Guías de MANIFESTO · medidas aproximadas";
