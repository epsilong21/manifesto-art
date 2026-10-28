import { EMPIREO_IMG as I } from "@/content/empireo";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** La tabla completa. Dos variantes WebP propias (640 y 1200 px), sin optimizador. */
export function Pintura({ prioridad = false, className }: { prioridad?: boolean; className?: string }) {
  const a = I.anchos;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={`${BASE}${I.base}-${a[1]}.webp`}
      srcSet={`${BASE}${I.base}-${a[0]}.webp ${a[0]}w, ${BASE}${I.base}-${a[1]}.webp ${a[1]}w`}
      sizes="(min-width: 48rem) 40vw, 80vw"
      width={I.width}
      height={I.height}
      alt={I.alt}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : "auto"}
      decoding="async"
    />
  );
}
