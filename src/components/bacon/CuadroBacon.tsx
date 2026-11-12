/**
 * Prólogo: la pintura original. La reproducción de Crucifixion (1933) está protegida (© The Estate of Francis Bacon)
 * y NO entra en el repositorio. Para verla en local: copiar el archivo a public/bacon/crucifixion-1933.jpg (ignorado
 * por Git) y arrancar con NEXT_PUBLIC_BACON_CUADRO=1. Sin eso se muestra un marcador de posición, rotulado como tal.
 */
const CON_CUADRO = process.env.NEXT_PUBLIC_BACON_CUADRO === "1";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function CuadroBacon({ className }: { className?: string }) {
  if (CON_CUADRO) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={className} src={`${BASE}/bacon/crucifixion-1933.jpg`} alt="Crucifixion, de Francis Bacon (1933): una figura pálida y sin rostro sobre un fondo oscuro." width={485} height={620} decoding="async" fetchPriority="high" />
    );
  }
  return (
    <div
      className={`${className ?? ""} bc-marcador`}
      role="img"
      aria-label="Marcador de posición: aquí va la reproducción de Crucifixion (1933), de Francis Bacon, pendiente de licencia."
    >
      <span className="bc-marcador__t">Marcador de posición</span>
      <span className="bc-marcador__p">Reproducción de Crucifixion (1933) pendiente de licencia</span>
    </div>
  );
}
