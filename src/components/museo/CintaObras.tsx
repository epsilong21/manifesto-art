"use client";

import { useEffect, useState } from "react";

type Item = { slug: string; numero: string; titulo: string; acento: string };

/**
 * Cinta de navegación del catálogo: las diez obras como saltos de ancla. Queda pegada bajo la cabecera
 * y marca la obra que se está viendo. Sin JavaScript sigue siendo una lista de enlaces a cada placa.
 */
export function CintaObras({ items }: { items: Item[] }) {
  const [activa, setActiva] = useState<string | null>(null);

  useEffect(() => {
    const placas = items.map((i) => document.getElementById(`obra-${i.slug}`)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (es) => {
        const visibles = es.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibles[0]) setActiva(visibles[0].target.id.replace("obra-", ""));
      },
      { rootMargin: "-30% 0px -45% 0px", threshold: [0, 0.2, 0.5, 1] },
    );
    placas.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="cat-cinta" aria-label="Saltar a una obra">
      <ol>
        {items.map((i) => (
          <li key={i.slug} style={{ "--ta": i.acento } as React.CSSProperties}>
            <a href={`#obra-${i.slug}`} aria-current={activa === i.slug ? "true" : undefined}>
              <span className="cat-cinta__n">{i.numero}</span>
              <span className="cat-cinta__t">{i.titulo}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
