"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from "react";
import { CONCEPTOS, type Concepto } from "@/content/conceptos";

/** Publicación simplificada: el selector es la entrada, no hay otra portada. */
const ENTRADA_SELECTOR = process.env.NEXT_PUBLIC_MANIFESTO_ENTRADA === "selector";

/**
 * Selector de obras de la cabecera. Es un <details>: sin JavaScript se abre y
 * se cierra igual. Con JS se cierra al pulsar fuera, al salir el foco o con
 * Escape, pero solo cuando el foco está dentro del menú: el Escape de cada
 * experiencia (cerrar un detalle, salir de la contemplación) no se toca.
 */
export function ObrasMenu({ actual }: { actual?: Concepto["slug"] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [abierto, setAbierto] = useState(false);
  const obra = CONCEPTOS.find((c) => c.slug === actual);

  const cerrar = (devolverFoco = false) => {
    const el = ref.current;
    if (!el?.open) return;
    el.open = false;
    if (devolverFoco) el.querySelector("summary")?.focus();
  };

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  const teclas = (e: KeyboardEvent<HTMLDetailsElement>) => {
    if (e.key !== "Escape" || !ref.current?.open) return;
    e.preventDefault();
    // React escucha en el propio document: hay que frenar también a los oyentes
    // que las experiencias registran ahí después (Escape de Noche o del desierto)
    e.nativeEvent.stopImmediatePropagation();
    cerrar(true);
  };
  const salida = (e: FocusEvent<HTMLDetailsElement>) => {
    const destino = e.relatedTarget as Node | null;
    if (destino && !e.currentTarget.contains(destino)) cerrar();
  };

  return (
    <details
      ref={ref}
      className="mf-obras"
      onToggle={(e) => setAbierto(e.currentTarget.open)}
      onKeyDown={teclas}
      onBlur={salida}
    >
      <summary className="mf-obras__btn">
        {obra ? (
          <>
            <span className="sr-only">Obra </span>
            <span className="mf-obras__n">
              {obra.numero}
              <span aria-hidden="true"> / </span>
              <span className="sr-only"> de </span>{String(CONCEPTOS.length).padStart(2, "0")}
            </span>
            <span className="mf-obras__t">{obra.corto}</span>
            <span className="sr-only">. Cambiar de obra</span>
          </>
        ) : (
          <span className="mf-obras__t">Las obras</span>
        )}
        <span className="mf-obras__ico" aria-hidden="true" />
      </summary>

      <nav className="mf-obras__panel" aria-label="Obras de MANIFESTO">
        <ol className="mf-obras__lista">
          {CONCEPTOS.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/conceptos/${c.slug}`}
                prefetch={false}
                className="mf-obras__obra"
                data-obra={c.slug}
                style={{ "--o-accent": c.acento } as CSSProperties}
                aria-current={c.slug === actual ? "page" : undefined}
                onClick={() => cerrar()}
              >
                <span className="mf-obras__num" aria-hidden="true">
                  {c.numero}
                </span>
                <span className="mf-obras__titulo">{c.titulo}</span>
                <span className="mf-obras__meta">
                  {c.autor}, {c.anio}
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <ul className="mf-obras__extra">
          <li>
            <Link href={ENTRADA_SELECTOR ? "/" : "/conceptos"} onClick={() => cerrar()}>
              Ver las diez obras
            </Link>
          </li>
          {ENTRADA_SELECTOR ? null : (
            <li>
              <Link href="/" onClick={() => cerrar()}>
                Portada
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </details>
  );
}
