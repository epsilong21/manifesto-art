/**
 * Sustituye a ObraLectura en la exportación de GitHub Pages (alias en
 * next.config.ts). Allí la reproducción de Dalí siempre está desactivada y la
 * página usa ObraPendiente: así el sitio público no incluye el código del
 * visor ni los datos de la reproducción de referencia.
 */
export function ObraLectura() {
  return null;
}
