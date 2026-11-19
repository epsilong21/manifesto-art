/** Cristo coronado de espinas (Guido Reni, c. 1636–1637): datos, textos y créditos. */

export const CORONA_IMG = {
  base: "/corona/corona",
  anchos: [600, 1200, 2100] as const,
  width: 2826,
  height: 3553,
  ratio: 3553 / 2826,
  alt: "Cristo, con los ojos alzados y lágrimas en el rostro, lleva una corona de espinas sobre la cabeza. Fondo oscuro, luz cálida sobre la piel.",
};

export const FICHA = {
  titulo: "Cristo coronado de espinas",
  autor: "Guido Reni",
  fecha: "hacia 1636–1637",
  tecnica: "Óleo sobre lienzo",
  coleccion: "Gemäldegalerie Alte Meister, Dresde",
  inventario: "Gal.-Nr. 329",
};

export const DOCUMENTADO = [
  "Guido Reni (Bolonia, 1575–1642) fue uno de los pintores más celebrados del barroco italiano. Formado en la Accademia degli Incamminati de los Carracci, desarrolló un estilo que combina el idealismo clásico con el dramatismo lumínico del naturalismo.",
  "Esta pintura pertenece a su período tardío, cuando su paleta se volvió más ligera y su ejecución más libre. Según su biógrafo Carlo Cesare Malvasia, en estos años Reni trabajaba con urgencia, a menudo para saldar deudas de juego, lo que explica la existencia de múltiples versiones y copias de taller de sus composiciones.",
  "El tema de Cristo coronado de espinas (o Ecce Homo) fue uno de los más frecuentes en la obra de Reni. Se conocen al menos tres versiones autógrafas: esta de Dresde, otra en el Fitzwilliam Museum de Cambridge (1639) y otras en diversas colecciones.",
  "La composición muestra a Cristo de busto, con los ojos elevados hacia el cielo en un gesto de aceptación del sufrimiento. La corona de espinas descansa sobre su cabeza sin presión aparente: es un objeto ligero que, sin embargo, concentra todo el peso simbólico de la escena.",
  "Reni evita la violencia explícita. No hay sangre abundante, no hay verdugos, no hay multitud. El sufrimiento se expresa a través de la mirada, la inclinación del rostro y la luz que modela la piel con una suavidad casi escultórica.",
];

export const DESCUBRIMIENTOS = [
  {
    id: "luz",
    titulo: "La luz que modela",
    texto:
      "La luz cae desde la izquierda y recorre la piel con una suavidad casi escultórica. Reni no pinta sombras: las disuelve. La transición entre luz y oscuridad en el pecho, el cuello y el pómulo no tiene bordes. La carne parece translúcida, modelada con luz en lugar de con líneas.",
    tipo: "Observación documentada",
  },
  {
    id: "corona-detalle",
    titulo: "La corona sin sangre",
    texto:
      "Otros pintores del Ecce Homo muestran espinas clavadas en la carne y sangre corriendo por la frente. Reni no. Su corona descansa sobre la cabeza sin presión visible: no hay heridas, no hay sangre en el rostro. El instrumento de tortura se ha convertido en algo casi ceremonial. La paradoja central de esta pintura: el símbolo más pesado, representado sin peso.",
    tipo: "Observación documentada",
  },
  {
    id: "cana",
    titulo: "La caña y el manto",
    texto:
      "Cristo sostiene una caña: el cetro de burla que los soldados le entregaron. El manto púrpura sobre el hombro izquierdo es la parodia de la vestimenta real. Ambos objetos de humillación están sostenidos con una dignidad que contradice su propósito. Reni elimina la violencia de la escena y la sustituye por compostura.",
    tipo: "Observación documentada",
  },
];

export const PUENTE = {
  antes:
    "Una corona puede parecer ligera hasta que deja de ser un símbolo y se convierte en una fuerza.",
  despues:
    "MANIFESTO no reproduce la escena. Separa la corona de la cabeza y la convierte en una estructura que responde a la presión.",
};

export const UMBRAL = {
  linea1: "El peso permanece en la materia.",
  linea2: "Pero no todo lo que soporta el peso desaparece.",
};

export const EPILOGO = {
  titulo: "Lo que la luz revela",
  texto:
    "Reni no pintó un mártir. Pintó a alguien que ya había aceptado. La corona está ahí, pero no define el rostro. La caña está en la mano, pero no se cierra con fuerza. Lo que queda cuando apartas los instrumentos de la humillación no es un héroe: es presencia.",
};

export const COMPRENDER = [
  {
    pregunta: "¿Qué representa la corona en la instalación?",
    respuesta:
      "No es un objeto religioso: es una estructura de presión. Al comprimirla, el visitante experimenta cómo una forma aparentemente ligera puede concentrar una fuerza invisible. La corona no cambia de material; lo que cambia es la relación entre su forma y el espacio que ocupa.",
  },
  {
    pregunta: "¿Qué son los tres descubrimientos?",
    respuesta:
      "Son observaciones sobre la pintura, no interpretaciones. Señalan detalles visibles —la luz, la corona, la caña— que revelan las decisiones del pintor. Los textos distinguen lo documentado de la lectura propia de MANIFESTO.",
  },
  {
    pregunta: "¿Cómo se relaciona la experiencia con la pintura?",
    respuesta:
      "El recorrido comienza con la pintura completa, se detiene en tres detalles y luego aísla la corona para explorarla como estructura. Es una lectura visual progresiva: de la contemplación al descubrimiento, del descubrimiento a la presión.",
  },
];

export const CREDITOS = {
  imagen:
    "Guido Reni, Cristo coronado de espinas, hacia 1636–1637. Gemäldegalerie Alte Meister, Staatliche Kunstsammlungen Dresden. Gal.-Nr. 329. Obra en dominio público. Fotografía: Dguendel / Wikimedia Commons, CC BY 4.0.",
  nota: "La instalación interactiva es una creación original de MANIFESTO: no altera ni reproduce la pintura.",
  fuentes: [
    {
      label: "Ficha en la colección digital de SKD (Dresden)",
      href: "https://skd-online-collection.skd.museum/Details/Index/378309",
    },
    {
      label: "Imagen en Wikimedia Commons",
      href: "https://commons.wikimedia.org/wiki/File:Dresden,_Gem%C3%A4ldegalerie_Alte_Meister,_Guido_Reni,_Christus_mit_der_Dornenkrone.jpg",
    },
    {
      label: "Guido Reni en Wikipedia",
      href: "https://en.wikipedia.org/wiki/Guido_Reni",
    },
  ],
};

export const INTERPRETACION_MANIFESTO = [
  "MANIFESTO no reproduce el sufrimiento de la pintura. Explora la presión invisible que permanece cuando apartamos el rostro.",
  "En la instalación, la corona deja de ser un símbolo fijo y se convierte en una estructura que responde a la fuerza. El visitante controla esa fuerza y descubre que la presión no necesita ser visible para ser real.",
];
