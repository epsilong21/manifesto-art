/**
 * La Madona de Portlligat (primera versión, 1949) · V2.3 — sistema de reproducción y derechos.
 *
 * La pintura es una obra protegida (© Salvador Dalí, Fundació Gala-Salvador Dalí, VEGAP). No se asume ninguna licencia
 * pública de reproducción o transformación. La experiencia funciona y tiene sentido sin la lámina.
 *
 * Estados (ver `resolverReproduccion`):
 *  - "sin"          Sin reproducción: ficha oficial y alternativa honesta (lámina vacía rotulada). Es el estado de TODA
 *                   compilación pública.
 *  - "integra"      Reproducción íntegra: la lámina completa, sin alterar sus píxeles. Dos orígenes:
 *                     · "autorizada": hay una autorización documentada (`AUTORIZACION`). En esta fase no existe.
 *                     · "local-pendiente": revisión privada en desarrollo, con un archivo de referencia que NO está en Git
 *                       (`public/obras/madona-portlligat-1949-referencia.jpg`, ignorado). Solo se activa si el build se hizo
 *                       con `NEXT_PUBLIC_MADONA_REPRO_LOCAL=1`, y la interfaz lo rotula como «pendiente de autorización».
 *  - "transformada" Transformación autorizada (animar, recortar, filtrar…): estado SEPARADO, no habilitado en esta fase.
 *                   `transformacionHabilitada()` devuelve siempre false y ningún componente transforma la lámina.
 */

export type EstadoReproduccion = "sin" | "integra" | "transformada";
export type OrigenReproduccion = "autorizada" | "local-pendiente";

export type Autorizacion = {
  alcance: "integra" | "transformada";
  /** Titular que concede la licencia y documento que la acredita (ruta o referencia). */
  titular: string;
  documento: string;
  fecha: string;
  /** Archivo bajo /public (relativo a la raíz, sin prefijo) y crédito que debe mostrarse junto a la lámina. */
  archivo: string;
  credito: string;
};

/**
 * Autorización documentada de reproducción. `null`: no hay ninguna. Rellenarla (y solo entonces) habilita el estado
 * "integra"/"autorizada" en las compilaciones públicas. No se declara ninguna licencia que no exista.
 */
export const AUTORIZACION: Autorizacion | null = null;

/** Solo se activa en un entorno de desarrollo controlado (bandera de compilación). */
export const REVISION_LOCAL = process.env.NEXT_PUBLIC_MADONA_REPRO_LOCAL === "1";
/** Archivo de referencia local: ignorado por Git, nunca se versiona ni se publica. Solo se define cuando la bandera está activa para que el nombre no se filtre al bundle público. */
export const ARCHIVO_LOCAL = REVISION_LOCAL ? "/obras/madona-portlligat-1949-referencia.jpg" : "";

export type Reproduccion =
  | { estado: "sin" }
  | { estado: "integra"; origen: OrigenReproduccion; src: string; credito: string };

/** La transformación (estado separado) no se habilita en esta fase. */
export const transformacionHabilitada = (): false => false;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Fuente candidata según la configuración (antes de comprobar que el archivo existe). */
export function candidata(): Reproduccion {
  if (AUTORIZACION && AUTORIZACION.alcance === "integra") {
    return { estado: "integra", origen: "autorizada", src: `${BASE}/${AUTORIZACION.archivo}`, credito: AUTORIZACION.credito };
  }
  if (REVISION_LOCAL) {
    return {
      estado: "integra",
      origen: "local-pendiente",
      src: `${BASE}${ARCHIVO_LOCAL}`,
      credito: "Reproducción de referencia local, pendiente de autorización. No se publica.",
    };
  }
  return { estado: "sin" };
}

/** Comprueba que el archivo se carga; si no, cae a "sin" (nunca se sustituye la obra en silencio por otra cosa). */
export function resolverReproduccion(): Promise<Reproduccion> {
  const c = candidata();
  if (c.estado === "sin" || typeof window === "undefined") return Promise.resolve({ estado: "sin" });
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => ok(c);
    img.onerror = () => ok({ estado: "sin" });
    img.src = c.src;
  });
}

/* ── Datos documentales (cada dato con su fuente) ── */
export const OBRA = {
  artista: "Salvador Dalí",
  titulo: "La Madona de Portlligat (primera versión)",
  fecha: "1949",
  tecnica: "Óleo sobre tela",
  /** Altura × anchura según la convención de los catálogos; la ficha no rotula cuál es cuál. */
  medidas: "49,5 × 38,3 cm",
  coleccion: "Haggerty Museum of Art, Marquette University, Milwaukee",
  credito: "Donación de Mr. y Mrs. Ira Haupt",
  catalogo: "P 643",
  derechos: "© Salvador Dalí, Fundació Gala-Salvador Dalí, Figueres",
  /** Proporción de la lámina (ancho / alto) para la lámina vacía; con una imagen real manda la de la imagen. */
  proporcion: 38.3 / 49.5,
} as const;

export const FICHAS = {
  catalogo: {
    nombre: "Ficha del catálogo razonado (Fundació Gala-Salvador Dalí)",
    url: "https://catalogues.salvador-dali.org/catalogues/es/heritageobject/333-bc25/",
  },
  museo: {
    nombre: "Ficha del Haggerty Museum of Art",
    url: "https://haggerty.zetcom.net/en/collection/item/943/",
  },
} as const;
