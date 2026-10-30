"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CONCEPTOS, type Concepto } from "@/content/conceptos";

const TOTAL = String(CONCEPTOS.length).padStart(2, "0");

function Tarjeta({ obra, etiqueta, lamina }: { obra: Concepto; etiqueta: string; lamina: ReactNode }) {
  return (
    <Link href={`/conceptos/${obra.slug}`} prefetch={false} className="mf-sig__tarjeta">
      <span className="mf-sig__img">
        {lamina}
        <span className="mf-sig__n">{obra.numero}</span>
      </span>
      <span className="mf-sig__k">{etiqueta}</span>
      <span className="mf-sig__t">{obra.titulo}</span>
      <span className="mf-sig__a">
        {obra.autor}, {obra.anio}
      </span>
      <span className="mf-sig__go">
        Ver la obra
        <svg aria-hidden="true" width="18" height="10" viewBox="0 0 18 10" fill="none">
          <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    </Link>
  );
}

/**
 * Cierre de cada obra: la obra siguiente y, si es otra, la relacionada (p. ej. del mismo artista). Se decide por la
 * ruta, así es igual en las diez obras y queda fuera del universo de cada una. En el catálogo no aparece.
 * Las láminas llegan ya pintadas desde el servidor (una por obra); aquí solo se elige cuáles mostrar.
 */
export function SiguienteObra({ laminas }: { laminas: Record<string, ReactNode> }) {
  const ruta = usePathname() ?? "";
  const slug = ruta.split("/").filter(Boolean).pop() ?? "";
  const i = CONCEPTOS.findIndex((c) => c.slug === slug);
  if (i < 0) return null;

  const siguiente = CONCEPTOS[(i + 1) % CONCEPTOS.length];
  const relacionada = CONCEPTOS.find((c) => c.slug === CONCEPTOS[i].relacionada);
  const mismaObra = relacionada?.slug === siguiente.slug;

  return (
    <section className="mf-sig" aria-labelledby="mf-sig-t">
      <h2 id="mf-sig-t" className="mf-sig__h">
        <span>Sigue explorando</span>
      </h2>
      <div className="mf-sig__grid">
        <Tarjeta
          obra={siguiente}
          etiqueta={`Siguiente obra · ${siguiente.numero} / ${TOTAL}${mismaObra ? " · relacionada" : ""}`}
          lamina={laminas[siguiente.slug]}
        />
        {relacionada && !mismaObra ? (
          <Tarjeta obra={relacionada} etiqueta={`Obra relacionada · ${relacionada.numero} / ${TOTAL}`} lamina={laminas[relacionada.slug]} />
        ) : null}
      </div>
      <Link href="/conceptos" prefetch={false} className="mf-sig__todas">
        Ver las diez obras
      </Link>
    </section>
  );
}
