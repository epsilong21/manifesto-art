/**
 * La Madona de Portlligat (primera versión, 1949) · V2.8 — sistema de reproducción y derechos.
 *
 * La pintura es una obra protegida (© Salvador Dalí, Fundació Gala-Salvador Dalí, VEGAP). No se asume ninguna licencia
 * pública de reproducción o transformación.
 *
 * Estados (ver `resolverReproduccion`):
 *  - "sin"          Sin reproducción: ficha oficial y alternativa honesta (lámina vacía rotulada). Es el estado si
 *                   ninguno de los orígenes de abajo está disponible.
 *  - "integra"      Reproducción íntegra: la lámina completa, sin alterar sus píxeles. Tres orígenes, que NUNCA deben
 *                   confundirse entre sí:
 *                     · "autorizada": hay una autorización DOCUMENTADA (`AUTORIZACION`, con titular y fecha). En esta
 *                       fase no existe; `AUTORIZACION` es `null` y así debe seguir hasta que llegue una licencia real.
 *                     · "editorial-sin-licencia": NO hay autorización. Se publica por decisión expresa del responsable
 *                       del proyecto (25/11/2026), que asume el riesgo de derechos de autor — el mismo criterio ya
 *                       aplicado a Los elefantes, Untitled (Basquiat) y Glenn (Basquiat). Ver `PUBLICACION_EDITORIAL` y
 *                       `/aviso-legal`. Esto no es una licencia ni una excepción legal: es una decisión editorial.
 *                     · "local-pendiente": revisión privada en desarrollo con un archivo que NO está en Git (ignorado).
 *                       Solo se activa con `NEXT_PUBLIC_MADONA_REPRO_LOCAL=1` y nunca llega a una compilación pública
 *                       (ver scripts/pages/verificar.mjs, sección 2e).
 *  - "transformada" Transformación autorizada (animar, recortar, filtrar…): estado SEPARADO, no habilitado en esta fase.
 *                   `transformacionHabilitada()` devuelve siempre false y ningún componente transforma la lámina.
 */

export type EstadoReproduccion = "sin" | "integra" | "transformada";
export type OrigenReproduccion = "autorizada" | "editorial-sin-licencia" | "local-pendiente";

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
 * Autorización DOCUMENTADA de reproducción (una licencia real, con titular y fecha). `null`: no hay ninguna — y no la
 * hay. Rellenarla (y solo entonces) habilita el estado "integra"/"autorizada". No se declara ninguna licencia que no
 * exista, y `PUBLICACION_EDITORIAL_SIN_LICENCIA` (abajo) NUNCA debe confundirse con esto.
 */
export const AUTORIZACION: Autorizacion | null = null;

/**
 * Publicación SIN autorización documentada: decisión editorial expresa del responsable del proyecto (25/11/2026),
 * que asume el riesgo de derechos de autor frente a la Fundació Gala-Salvador Dalí y VEGAP. Mismo criterio ya
 * aplicado a Los elefantes (19/10/2026), Untitled y Glenn (28/10/2026) — ver CREDITOS.md y /aviso-legal. El archivo
 * está en Git (`public/obras/madona-portlligat-1949-referencia.jpg`) y se sirve a través de las variantes WebP
 * generadas al exportar (scripts/pages/exportar.mjs), igual que las demás obras del sitio.
 *
 * Esta constante es deliberadamente independiente de `AUTORIZACION`: que valga `true` no implica ni simula que exista
 * una licencia, y ninguna pantalla debe presentarlo como tal (ver el aviso legal en Presencia.tsx y en /aviso-legal).
 */
export const PUBLICACION_EDITORIAL_SIN_LICENCIA = {
  activa: true,
  archivo: "madona-portlligat-1949-referencia.jpg",
  /** Ancho mínimo de las variantes generadas (src/lib/imagenAnchos.json); el origen mide 295 × 380 px. */
  ancho: 384,
  credito:
    "Reproducción de baja resolución (295 × 380 px), sin licencia de reproducción de la Fundació Gala-Salvador Dalí " +
    "ni de VEGAP. Se publica por decisión editorial de MANIFESTO S.A.S. (25/11/2026), con finalidad educativa, y se " +
    "retirará si lo pide el titular de los derechos. Este aviso no concede ni sustituye ninguna autorización.",
} as const;

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
  if (PUBLICACION_EDITORIAL_SIN_LICENCIA.activa) {
    const p = PUBLICACION_EDITORIAL_SIN_LICENCIA;
    const nombre = p.archivo.replace(/\.\w+$/, "");
    return { estado: "integra", origen: "editorial-sin-licencia", src: `${BASE}/img/${nombre}-${p.ancho}.webp`, credito: p.credito };
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
