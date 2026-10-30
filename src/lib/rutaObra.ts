/**
 * Obra de la página actual, a partir de su URL. Sirve igual en las tres formas de publicar la web:
 * `/conceptos/medusa/` (servidor y GitHub Pages), `/pages/obra-medusa` (tema de Shopify) y, al probar el tema sin
 * crear páginas, `/pages/<cualquiera>?view=obra-medusa`.
 */
export function slugDeObra(ruta: string): string {
  const busqueda = typeof window === "undefined" ? "" : window.location.search;
  const vista = new URLSearchParams(busqueda).get("view");
  const ultimo = ruta.split("/").filter(Boolean).pop() ?? "";
  return (vista || ultimo).replace(/^obra-/, "");
}
