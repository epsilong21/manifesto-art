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

export type Lectura = "convexa" | "plana" | "concava";

/** Laboratorio «La sombra que miente». */
export const SOMBRA = {
  aviso:
    "Modelo didáctico de MANIFESTO: una esfera y la sombra que «pinta» sobre un disco. Simplifica la óptica; no reproduce la del cuadro.",
  veredictos: {
    convexa: {
      nombre: "Se lee convexa",
      texto: "La sombra cae como lo haría sobre una superficie que sale hacia ti. Coincide con la forma real del escudo.",
    },
    plana: {
      nombre: "Se lee plana",
      texto: "La sombra no delata ninguna curvatura: el disco parece una tabla.",
    },
    concava: {
      nombre: "Se lee cóncava",
      texto: "La sombra se recoge hacia dentro, como en un cuenco. Es el engaño de Caravaggio: la superficie real sigue siendo convexa.",
    },
  } satisfies Record<Lectura, { nombre: string; texto: string }>,
  perfil: "De perfil, el escudo siempre sale hacia ti: es convexo. La línea discontinua es la superficie que sugiere la sombra.",
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
  entrada: "Medusa está aquí. Solo puedes verla en el espejo.",
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
      escena: "De frente, solo hay oscuridad y algún destello. En el espejo aparece ella: lo que no se puede mirar directamente se deja ver en el reflejo.",
      hecho:
        "Según el mito, Perseo venció a Medusa sin mirarla de frente: se guió por su reflejo en un escudo pulido, con la ayuda de Atenea.",
      lectura: "El escudo de Caravaggio repite la trampa del mito: para mirar a Medusa necesitamos algo que se interponga.",
    },
    {
      id: "sombra",
      num: "02",
      nombre: "Sombra",
      escena: "El espejo invierte y curva lo que muestra. La sombra del cuadro también engaña sobre la forma real de lo que tienes delante.",
      hecho: "El escudo es convexo, pero la sombra de la cabeza está pintada como si fuera cóncavo.",
      enlace: { href: "#sombra", texto: "Probarlo en el laboratorio" },
    },
    {
      id: "rostro",
      num: "03",
      nombre: "Rostro",
      escena: "En el espejo no está la Medusa de Caravaggio, sino la de Franz von Stuck: no grita, te mira.",
      hecho:
        "Franz von Stuck fue en 1892 uno de los fundadores de la Secesión de Múnich. Su Cabeza de Medusa se fecha hacia 1892: pastel sobre papel, 26,5 × 32,5 cm, en una colección particular (según Wikimedia Commons; pendiente de verificar).",
      lectura:
        "Caravaggio pinta el instante del grito, con la boca abierta y la sangre; Stuck, tres siglos después, una cara quieta que sostiene la mirada. En el mito, mirarla petrifica: aquí es ella quien no aparta los ojos.",
    },
    {
      id: "superficie",
      num: "04",
      nombre: "Superficie",
      escena: "Lo que hay en el escudo de Caravaggio es luz y sombra pintadas, no relieve: no podría tallarse.",
      hecho: "Caravaggio no pintó sobre la madera: pintó un lienzo y lo pegó sobre un escudo de chopo.",
      lectura:
        "Taro Kimura lo lee como un desafío a la escultura: la sombra arrojada y la sangre líquida solo puede mostrarlas la pintura.",
    },
  ] satisfies PuntoReflejo[],
};
