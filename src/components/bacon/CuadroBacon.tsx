/**
 * Prólogo: la pintura original, Crucifixion (1933), de Francis Bacon (CR 33-01, óleo sobre lienzo, 62 × 48,5 cm).
 * Obra protegida (© The Estate of Francis Bacon). MANIFESTO NO tiene licencia ni autorización documentada: se muestra por
 * decisión editorial del titular del sitio, que asume el riesgo de reclamación (ver CREDITOS.md y el pie de la página).
 * Reproducción: ficha pública de WikiArt (https://www.wikiart.org/en/francis-bacon/crucifixion-1933), JPEG de 600 × 781 px
 * (el máximo que publica la ficha, etiquetada «Fair Use»; no es una licencia). Se muestra completa, sin recortes, filtros
 * ni ampliación mayor que el tamaño CSS acotado en bacon.css (≤ 30 rem). El fondo oscuro del <img> deja un panel legible
 * con el texto alternativo si el archivo no carga.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function CuadroBacon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`${BASE}/bacon/crucifixion-1933-wikiart.jpg`}
      alt="Crucifixion, de Francis Bacon (1933): una figura pálida y sin rostro, de brazos abiertos sobre un travesaño, en un fondo gris oscuro."
      width={600}
      height={781}
      decoding="async"
      fetchPriority="high"
    />
  );
}
