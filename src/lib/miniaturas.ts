/**
 * Miniatura auténtica de las obras protegidas (Dalí y Basquiat) para el catálogo y la
 * portada: la misma reproducción que muestra el hero de cada obra, elegida por
 * next.config.ts al compilar. Fuera de una publicación incluye la de referencia local.
 *
 * Al publicar (`MANIFESTO_PUBLICACION`), solo Untitled y Glenn muestran la pintura en el
 * catálogo y la portada (decisión editorial de MANIFESTO S.A.S., 28/10/2026). Los elefantes
 * sigue con su composición propia: mostrar ahí la pintura necesita una decisión aparte,
 * aunque el hero ya la muestre.
 *
 * Solo lee las variables de entorno, no los textos de cada obra: sirve en componentes
 * de cliente sin cargar su contenido.
 */
type Reproduccion = { archivo: string; width: number; height: number; pie: string };

export type Miniatura = { src: string; width: number; height: number; pie: string };

const leer = (json: string | undefined): Reproduccion | null => (json ? (JSON.parse(json) as Reproduccion) : null);

const REPRODUCCIONES: Record<string, Reproduccion | null> = {
  "los-elefantes": leer(process.env.MANIFESTO_ELEFANTES_REPRODUCCION),
  "basquiat-untitled": leer(process.env.MANIFESTO_BASQUIAT_REPRODUCCION),
  glenn: leer(process.env.MANIFESTO_GLENN_REPRODUCCION),
};

/** Obras cuya pintura también se muestra en el catálogo publicado */
const EN_CATALOGO_PUBLICO = new Set(["basquiat-untitled", "glenn"]);

export function miniaturaProtegida(slug: string): Miniatura | null {
  if (process.env.MANIFESTO_PUBLICACION === "1" && !EN_CATALOGO_PUBLICO.has(slug)) return null;
  const r = REPRODUCCIONES[slug];
  return r ? { src: `/obras/${r.archivo}`, width: r.width, height: r.height, pie: r.pie } : null;
}
