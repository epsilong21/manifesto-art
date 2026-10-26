"use client";

import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/**
 * Tira horizontal que se arrastra con el ratón; en táctil, el desplazamiento nativo.
 * Con el teclado (la región es enfocable), las flechas pasan de hoja en hoja e Inicio
 * y Fin van a los extremos. Con `scroll-snap`, cada hoja queda alineada al soltar.
 */
export function CronologiaArrastrable({ children, etiqueta }: { children: ReactNode; etiqueta: string }) {
  const tira = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ id: number; x: number; scroll: number; movido: boolean } | null>(null);

  const abajo = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !tira.current) return;
    arrastre.current = { id: e.pointerId, x: e.clientX, scroll: tira.current.scrollLeft, movido: false };
  };
  const mover = (e: PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    const t = tira.current;
    if (!a || a.id !== e.pointerId || !t) return;
    const dx = e.clientX - a.x;
    if (!a.movido && Math.abs(dx) > 4) {
      a.movido = true;
      t.setPointerCapture(e.pointerId);
      t.setAttribute("data-arrastrando", "");
    }
    if (a.movido) t.scrollLeft = a.scroll - dx;
  };
  const arriba = (e: PointerEvent<HTMLDivElement>) => {
    if (arrastre.current?.id !== e.pointerId) return;
    arrastre.current = null;
    tira.current?.removeAttribute("data-arrastrando");
  };

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = tira.current;
    const hoja = t?.querySelector("li");
    if (!t || !hoja) return;
    const paso = hoja.getBoundingClientRect().width;
    const destino: Record<string, number> = {
      ArrowRight: t.scrollLeft + paso,
      ArrowLeft: t.scrollLeft - paso,
      Home: 0,
      End: t.scrollWidth,
    };
    if (!(e.key in destino)) return;
    e.preventDefault();
    const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollTo({ left: destino[e.key], behavior: suave ? "smooth" : "auto" });
  };

  return (
    <div
      ref={tira}
      className="gl-tira"
      tabIndex={0}
      role="region"
      aria-label={etiqueta}
      onPointerDown={abajo}
      onPointerMove={mover}
      onPointerUp={arriba}
      onPointerCancel={arriba}
      onKeyDown={teclas}
    >
      {children}
    </div>
  );
}
