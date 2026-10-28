import { DESC_IMG as I } from "@/content/descendimiento";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** El panel central completo, sin recortes ni filtros (primera pantalla). */
export function Panel({ className }: { className?: string }) {
  const a = I.anchos;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`${BASE}${I.base}-${a[1]}.webp`}
      srcSet={`${BASE}${I.base}-${a[0]}.webp ${a[0]}w, ${BASE}${I.base}-${a[1]}.webp ${a[1]}w`}
      sizes="(min-width: 56rem) 45vw, 90vw"
      width={I.width}
      height={I.height}
      alt={I.alt}
      fetchPriority="high"
      decoding="async"
    />
  );
}
