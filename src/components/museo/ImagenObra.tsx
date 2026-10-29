import Image from "next/image";
import { BasquiatGrafico } from "@/components/concepts/BasquiatGrafico";
import { ElefantesGrafico } from "@/components/concepts/ElefantesGrafico";
import { GlennGrafico } from "@/components/concepts/GlennGrafico";
import { ALT, IMAGEN_NEXT, IMAGEN_PLANA, RATIO_GRAFICO } from "@/content/catalogo";
import type { Concepto } from "@/content/conceptos";
import { miniaturaProtegida } from "@/lib/miniaturas";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Origen = { tipo: "next"; src: string; width: number; height: number } | { tipo: "plana"; base: string; anchos: [number, number]; width: number; height: number } | { tipo: "grafico" };

function origen(slug: Concepto["slug"]): Origen {
  const n = IMAGEN_NEXT[slug];
  if (n) return { tipo: "next", ...n };
  const p = IMAGEN_PLANA[slug];
  if (p) return { tipo: "plana", ...p };
  const m = miniaturaProtegida(slug);
  return m ? { tipo: "next", src: m.src, width: m.width, height: m.height } : { tipo: "grafico" };
}

/** Proporción (ancho / alto) de la imagen que se mostrará de esta obra. */
export function proporcion(slug: Concepto["slug"]): number {
  const o = origen(slug);
  return o.tipo === "grafico" ? RATIO_GRAFICO : o.width / o.height;
}

/** ¿Se muestra la pintura original (true) o una composición propia de MANIFESTO (false)? */
export function esPintura(slug: Concepto["slug"]) {
  return origen(slug).tipo !== "grafico";
}

/** La pintura entera de una obra (sin recorte) o, si este build no la tiene, la composición de MANIFESTO. */
export function ImagenObra({
  slug,
  sizes,
  prioridad = false,
  ansiosa = false,
  className,
  uid = "mu",
}: {
  slug: Concepto["slug"];
  sizes: string;
  prioridad?: boolean;
  /** Carga ya (sin prioridad alta): imágenes que están en la primera pantalla aunque no se vean todavía. */
  ansiosa?: boolean;
  className?: string;
  /** Evita colisiones de ids del SVG si la composición aparece varias veces en la página. */
  uid?: string;
}) {
  const o = origen(slug);
  if (o.tipo === "next") {
    return <Image src={o.src} alt="" width={o.width} height={o.height} sizes={sizes} quality={70} className={className} style={{ aspectRatio: `${o.width} / ${o.height}` }} priority={prioridad} loading={prioridad ? undefined : ansiosa ? "eager" : "lazy"} />;
  }
  if (o.tipo === "plana") {
    const [a, b] = o.anchos;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`${BASE}${o.base}-${a}.webp`} srcSet={`${BASE}${o.base}-${a}.webp ${a}w, ${BASE}${o.base}-${b}.webp ${b}w`} sizes={sizes} width={o.width} height={o.height} alt="" className={className} style={{ aspectRatio: `${o.width} / ${o.height}` }} decoding="async" loading={prioridad || ansiosa ? "eager" : "lazy"} fetchPriority={prioridad ? "high" : undefined} />;
  }
  if (slug === "basquiat-untitled") return <BasquiatGrafico className={className} />;
  if (slug === "glenn") return <GlennGrafico className={className} />;
  return <ElefantesGrafico id={`${uid}-eg`} className={className} />;
}

export { ALT };
