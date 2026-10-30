import { PEC_IMG as I } from "@/content/pecados";
import { rutaPublica } from "@/lib/rutaPublica";


/** La tabla completa, sin recortes ni filtros (primera pantalla). */
export function Tabla({ className }: { className?: string }) {
  const a = I.anchos;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`${rutaPublica(I.base)}-${a[1]}.webp`}
      srcSet={`${rutaPublica(I.base)}-${a[0]}.webp ${a[0]}w, ${rutaPublica(I.base)}-${a[1]}.webp ${a[1]}w`}
      sizes="(min-width: 56rem) 60vw, 94vw"
      width={I.width}
      height={I.height}
      alt={I.alt}
      fetchPriority="high"
      decoding="async"
    />
  );
}
