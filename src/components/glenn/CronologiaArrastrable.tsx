"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Tira horizontal que se arrastra con el ratón; en táctil y con el teclado es el
 * desplazamiento nativo (la región es enfocable y las flechas la mueven). Con
 * `scroll-snap`, cada hoja queda alineada al soltar.
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
    >
      {children}
    </div>
  );
}
