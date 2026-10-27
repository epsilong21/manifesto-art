"use client";

import Image from "next/image";
import Link from "next/link";
import type { PointerEvent } from "react";
import { BasquiatGrafico } from "@/components/concepts/BasquiatGrafico";
import { ElefantesGrafico } from "@/components/concepts/ElefantesGrafico";
import { GlennGrafico } from "@/components/concepts/GlennGrafico";
import { CONCEPTOS } from "@/content/conceptos";
import { miniaturaProtegida } from "@/lib/miniaturas";

const ART: Record<string, { src: string; width: number; height: number; pie?: string } | null> = {
  medusa: { src: "/obras/medusa.jpg", width: 2400, height: 2350 },
  "noche-estrellada": { src: "/obras/noche-estrellada.jpg", width: 3000, height: 2376 },
  // Dalí y Basquiat: obras protegidas. La misma reproducción que su hero, si este build
  // la tiene (src/lib/miniaturas.ts); si no, la composición propia de MANIFESTO.
  "los-elefantes": miniaturaProtegida("los-elefantes"),
  "basquiat-untitled": miniaturaProtegida("basquiat-untitled"),
  glenn: miniaturaProtegida("glenn"),
};

/** Las obras protegidas se ven enteras en la tarjeta: sin recorte ni ampliación. */
const INTEGRA = new Set(["los-elefantes", "basquiat-untitled", "glenn"]);

const NOTA_PROPIA: Record<string, string> = {
  "los-elefantes": "Imagen: composición gráfica de MANIFESTO, no la pintura de Dalí.",
  "basquiat-untitled": "Imagen: composición tipográfica de MANIFESTO, no la pintura de Basquiat.",
  glenn: "Imagen: composición gráfica de MANIFESTO, no la pintura de Basquiat.",
};

const MOD: Record<string, string> = {
  medusa: "sel-item--medusa",
  "noche-estrellada": "sel-item--noche",
  "los-elefantes": "sel-item--elefantes",
  "basquiat-untitled": "sel-item--basquiat",
  glenn: "sel-item--glenn",
};

/** El arte de cada entrada sigue al puntero con un leve desplazamiento (solo ratón). */
function track(e: PointerEvent<HTMLLIElement>) {
  if (e.pointerType !== "mouse") return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
  e.currentTarget.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
}
function reset(e: PointerEvent<HTMLLIElement>) {
  e.currentTarget.style.setProperty("--px", "0");
  e.currentTarget.style.setProperty("--py", "0");
}

export function SelectorList() {
  return (
    <ol className="sel-list" aria-label="Las cinco obras">
      {CONCEPTOS.map((c, i) => {
        const art = ART[c.slug];
        return (
          <li
            key={c.slug}
            className={`sel-item ${MOD[c.slug]}`}
            data-integra={art && INTEGRA.has(c.slug) ? "" : undefined}
            onPointerMove={track}
            onPointerLeave={reset}
          >
            <div className="sel-plate" aria-hidden="true">
            <div className="sel-art" data-integra={art && INTEGRA.has(c.slug) ? "" : undefined}>
              {art ? (
                <Image
                  src={art.src}
                  alt=""
                  fill
                  sizes="(min-width: 64rem) 50vw, 100vw"
                  quality={70}
                  // La primera entrada es visible al cargar: es el LCP de la página
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "auto"}
                />
              ) : c.slug === "basquiat-untitled" ? (
                <BasquiatGrafico className="sel-grafico" />
              ) : c.slug === "glenn" ? (
                <GlennGrafico className="sel-grafico" />
              ) : (
                <ElefantesGrafico id="sel-eg" className="sel-grafico" />
              )}
            </div>
            <div className="sel-shade" />
            </div>
            <div className="sel-body">
              <p className="sel-num">
                <span className="sel-num__n">{c.numero}</span>
                <span className="sel-num__de">
                  <span className="sr-only">de </span>
                  <span aria-hidden="true">/ </span>0{CONCEPTOS.length}
                </span>
                <span className="sel-num__idea">{c.idea}</span>
              </p>
              <h2 id={`sel-${c.slug}`} className="sel-name">
                {c.titulo}
              </h2>
              <p className="sel-meta">
                {c.autor}, {c.anio}
              </p>
              <p className="sel-quote">{c.pregunta}</p>
              <p className="sel-desc">{c.descripcion}</p>
              <p className="sel-gesto">{c.interaccion}</p>
              {INTEGRA.has(c.slug) ? (
                <p className="sel-nota">{art?.pie ? `Imagen: la pintura. ${art.pie}` : NOTA_PROPIA[c.slug]}</p>
              ) : null}
              <Link href={`/conceptos/${c.slug}`} className="sel-link">
                Entrar en {c.titulo}
                <svg aria-hidden="true" width="16" height="10" viewBox="0 0 16 10" fill="none">
                  <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </Link>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
