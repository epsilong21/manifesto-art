/**
 * Medusa V3 · Bajo «El expediente»: el laboratorio «La sombra que miente» y la
 * interpretación original «El reflejo». «hecho» = Documentado (con fuente);
 * «lectura» = Interpretación. Lo que las fuentes no sostienen queda fuera.
 */

export type Fuente = { label: string; href: string };

export const FUENTES_MEDUSA_V3 = {
  wikipedia: { label: "Wikipedia: Medusa (Caravaggio) (fuente secundaria)", href: "https://en.wikipedia.org/wiki/Medusa_(Caravaggio)" },
  cfa: {
    label: "Conceptual Fine Arts: la sombra del escudo y el argumento de Taro Kimura",
    href: "https://www.conceptualfinearts.com/cfa/?p=5166",
  },
  beculture: { label: "BeCulture: Medusa by Caravaggio, la historia", href: "https://www.beculture.it/en/medusa-by-caravaggio-story/" },
  ndb: { label: "Neue Deutsche Biographie: Stuck, Franz von", href: "https://www.deutsche-biographie.de/sfz31093.html" },
  stuck: {
    label: "Wikimedia Commons: Haupt der Medusa, de Franz von Stuck",
    href: "https://commons.wikimedia.org/wiki/File:Haupt_der_Medusa_by_Franz_von_Stuck.jpg",
  },
} satisfies Record<string, Fuente>;

/** Zona de la sombra arrojada sobre el fondo verde, en fracciones de la reproducción (0-1). */
export const ZONA_SOMBRA = { cx: 0.665, cy: 0.6, rx: 0.09, ry: 0.17 };
/** Recorte de la obra que muestra el laboratorio (fracciones de la reproducción). */
export const RECORTE_SOMBRA = { x0: 0.52, x1: 0.9, y0: 0.36, y1: 0.82 };

export type Vista = "frente" | "perfil" | "seccion" | "libre";

/** Laboratorio «La sombra que miente»: el escudo bajo otra perspectiva. */
export const SOMBRA = {
  pista: "Arrastra para examinar el escudo",
  vistas: {
    frente: {
      nombre: "De frente",
      texto: "Así se mira el escudo. La sombra de la cabeza, a la derecha, se recoge sobre el fondo verde como si el disco se hundiera.",
    },
    perfil: {
      nombre: "De perfil",
      texto: "Al girarlo aparece el canto y la luz resbala por la superficie: no es una imagen plana, es un objeto.",
    },
    seccion: {
      nombre: "En sección",
      texto: "Cortado por la mitad, el escudo sale hacia ti: es convexo. La línea discontinua es la superficie cóncava que sugiere la sombra pintada.",
    },
    libre: {
      nombre: "Girado",
      texto: "La cabeza sigue en su sitio: la pintura no se deforma, solo cambia tu punto de vista.",
    },
  } satisfies Record<Vista, { nombre: string; texto: string }>,
  /** Pies de escena: lo que la escena hace realmente. */
  aviso:
    "Reproducción de la obra sobre un disco: el giro y el canto son una simulación de MANIFESTO y la curvatura se sugiere con luz, sin deformar la pintura.",
  seccion: "Esquema explicativo de MANIFESTO, no una medición: la curvatura y el grosor no están a escala.",
  hecho:
    "El escudo es convexo, pero la sombra que la cabeza proyecta sobre el fondo verde está pintada como si la superficie fuera cóncava. Esa sombra crea la ilusión de un hueco donde hay un relieve.",
  recorte: "Recorte de la obra: la sombra de la cabeza sobre el fondo verde, señalada por MANIFESTO.",
  soporte: "Lienzo pegado sobre un escudo de madera de chopo. Mide unos 60 × 55 cm.",
  lectura:
    "Para el historiador Taro Kimura, el escudo es un argumento del paragone, el viejo debate sobre si la pintura supera a la escultura: un escudo tallado no puede mostrar una sombra arrojada ni sangre líquida; uno pintado, sí.",
  fuentes: [FUENTES_MEDUSA_V3.cfa, FUENTES_MEDUSA_V3.beculture, FUENTES_MEDUSA_V3.wikipedia],
};

export type PuntoReflejo = {
  id: "espejo" | "sombra" | "rostro" | "superficie";
  num: string;
  nombre: string;
  escena: string;
  hecho: string;
  lectura?: string;
  enlace?: { href: string; texto: string };
};

/**
 * «El reflejo»: interpretación original de MANIFESTO. Medusa está en la escena, pero
 * solo se ve en el espejo, como en el mito de Perseo: dentro del disco, otra Medusa de
 * dominio público (la de Franz von Stuck) invertida; fuera, una escena oscura generada
 * con código.
 */
export const REFLEJO = {
  nombre: "El reflejo",
  entrada: "Para vencer a Medusa, Perseo debía enfrentarse a ella sin mirarla directamente.",
  contexto:
    "Según una versión del mito griego, quien contemplaba el rostro de Medusa quedaba convertido en piedra. Con ayuda de Atenea, Perseo utilizó el reflejo de un escudo pulido para localizarla sin cruzar su mirada.",
  instruccion: "Ahora estás en el lugar de Perseo. Mueve el reflejo para encontrar a Medusa sin mirarla directamente.",
  nota: "Escena original de MANIFESTO. En el espejo, Cabeza de Medusa de Franz von Stuck (dominio público), reflejada; el resto de la escena se genera con código.",
  /** Reproducción de Wikimedia Commons sin modificar (ver CREDITOS.md). */
  imagen: {
    src: "/obras/medusa-stuck.jpg",
    width: 1536,
    height: 1154,
    alt: "Reflejo de la Cabeza de Medusa de Franz von Stuck: un rostro pálido mira de frente con los ojos muy abiertos y la boca cerrada, enmarcado por serpientes oscuras.",
  },
  pista: "Mueve el espejo",
  puntos: [
    {
      id: "espejo",
      num: "01",
      nombre: "Espejo",
      escena: "Haces lo mismo que Perseo: no la miras de frente, la buscas en el espejo. Fuera de él solo hay oscuridad y algún destello.",
      hecho: "Ovidio cuenta en las Metamorfosis que Perseo la decapitó guiándose por su reflejo en un escudo de bronce.",
      lectura:
        "El gesto de Perseo es también el del espectador: nadie ha visto nunca a Medusa, solo imágenes de ella. Cada cuadro es otro escudo pulido.",
    },
    {
      id: "sombra",
      num: "02",
      nombre: "Sombra",
      escena:
        "El reflejo que guió a Perseo no era Medusa, solo una imagen de ella, invertida como en cualquier espejo. La sombra del cuadro también engaña sobre la forma de lo que tienes delante.",
      hecho: "El escudo es convexo, pero la sombra de la cabeza está pintada como si fuera cóncavo.",
      enlace: { href: "#sombra", texto: "Probarlo en el laboratorio" },
    },
    {
      id: "rostro",
      num: "03",
      nombre: "Rostro",
      escena:
        "En el espejo no está la Medusa de Caravaggio, sino la de Franz von Stuck: no grita, te mira. A través del reflejo puedes sostener esa mirada, como Perseo.",
      hecho:
        "Franz von Stuck fue en 1892 uno de los fundadores de la Secesión de Múnich. Su Cabeza de Medusa se fecha hacia 1892: pastel sobre papel, 26,5 × 32,5 cm, en una colección particular (según Wikimedia Commons; pendiente de verificar).",
      lectura:
        "Caravaggio pinta el instante del grito, con la boca abierta y la sangre; Stuck, tres siglos después, una cara quieta que sostiene la mirada. Si la de Caravaggio es el monstruo vencido, la de Stuck es la amenaza intacta.",
    },
    {
      id: "superficie",
      num: "04",
      nombre: "Superficie",
      escena:
        "Tras la victoria de Perseo, la cabeza de Medusa siguió siendo un arma. Caravaggio la lleva a un escudo, pero lo que hay en él es luz y sombra pintadas, no relieve.",
      hecho:
        "Según el mito, la cabeza acabó en la égida de Atenea, como arma. Caravaggio no la pintó sobre la madera: pintó un lienzo y lo pegó sobre un escudo de chopo.",
      lectura:
        "Taro Kimura lo lee como un desafío a la escultura: la sombra arrojada y la sangre líquida solo puede mostrarlas la pintura.",
    },
  ] satisfies PuntoReflejo[],
};
