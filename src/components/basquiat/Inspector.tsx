"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import { LIENZO_CAPAS } from "@/content/basquiat-capas";
import { ESCALA_LUPA, REGION_INICIAL, REGIONES_EXAMEN } from "@/content/basquiat-inspector";

const { w: W, h: H } = LIENZO_CAPAS;

/**
 * «Examinar trazos»: una retícula sobre la lámina y una lupa con la reproducción a su
 * tamaño real (ESCALA_LUPA: 1 px CSS por píxel del archivo). El centro se guarda en px de la
 * reproducción; el puntero escribe en el DOM una vez por fotograma, sin re-render.
 *
 * - Ratón: basta con moverlo sobre la obra. Tacto y lápiz: arrastrar; mientras se
 *   examina, la lámina no desplaza la página (touch-action: none, solo en la obra).
 * - Teclado: las regiones predefinidas del panel.
 */
export function useInspector(activo: boolean) {
  const centro = useRef({ x: REGIONES_EXAMEN[REGION_INICIAL].x, y: REGIONES_EXAMEN[REGION_INICIAL].y });
  const reticula = useRef<HTMLDivElement>(null);
  const lupa = useRef<HTMLDivElement>(null);
  const lupaImg = useRef<HTMLImageElement>(null);
  const marco = useRef(0);
  const [region, setRegion] = useState<number | null>(REGION_INICIAL);

  const pintar = useCallback(() => {
    marco.current = 0;
    const l = lupa.current;
    const r = reticula.current;
    const img = lupaImg.current;
    if (!l || !r || !img) return;
    // Región examinada (px de la reproducción): lo que cabe en la lupa a la escala fija
    const rw = Math.min(W, l.clientWidth / ESCALA_LUPA);
    const rh = Math.min(H, l.clientHeight / ESCALA_LUPA);
    const cx = Math.min(W - rw / 2, Math.max(rw / 2, centro.current.x));
    const cy = Math.min(H - rh / 2, Math.max(rh / 2, centro.current.y));
    centro.current = { x: cx, y: cy };
    r.style.left = `${((cx - rw / 2) / W) * 100}%`;
    r.style.top = `${((cy - rh / 2) / H) * 100}%`;
    r.style.width = `${(rw / W) * 100}%`;
    r.style.height = `${(rh / H) * 100}%`;
    img.style.width = `${W * ESCALA_LUPA}px`;
    img.style.transform = `translate3d(${l.clientWidth / 2 - cx * ESCALA_LUPA}px, ${l.clientHeight / 2 - cy * ESCALA_LUPA}px, 0)`;
  }, []);

  const programar = useCallback(() => {
    if (!marco.current) marco.current = requestAnimationFrame(pintar);
  }, [pintar]);

  useEffect(() => {
    if (!activo) return;
    pintar();
    const ro = new ResizeObserver(programar);
    if (lupa.current) ro.observe(lupa.current);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(marco.current);
      marco.current = 0;
    };
  }, [activo, pintar, programar]);

  const mover = (e: PointerEvent<HTMLElement>) => {
    if (!activo) return;
    // Con tacto o lápiz solo cuenta el arrastre; con ratón, también el paso del puntero
    if (e.pointerType !== "mouse" && !(e.buttons & 1)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    centro.current = { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
    if (region !== null) setRegion(null);
    programar();
  };

  const pulsar = (e: PointerEvent<HTMLElement>) => {
    if (!activo) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    mover(e);
  };

  const irA = (i: number) => {
    centro.current = { x: REGIONES_EXAMEN[i].x, y: REGIONES_EXAMEN[i].y };
    setRegion(i);
    programar();
  };

  return { reticulaRef: reticula, lupaRef: lupa, lupaImgRef: lupaImg, region, mover, pulsar, irA };
}

type PanelProps = {
  src: string;
  width: number;
  height: number;
  lupaRef: RefObject<HTMLDivElement | null>;
  lupaImgRef: RefObject<HTMLImageElement | null>;
  region: number | null;
  irA: (i: number) => void;
  onSalir: () => void;
};

/** Panel del inspector: lupa, regiones para teclado y salida. Sustituye a la lectura mientras se examina. */
export function PanelInspector({ src, width, height, lupaRef, lupaImgRef, region, irA, onSalir }: PanelProps) {
  const r = region !== null ? REGIONES_EXAMEN[region] : null;
  return (
    <div className="bq-inspector">
      <div
        ref={lupaRef}
        className="bq-lupa"
        role="img"
        aria-label={`Ampliación de la reproducción: ${r ? r.nombre.toLowerCase() : "zona elegida con el puntero"}`}
      >
        <Image ref={lupaImgRef} src={src} width={width} height={height} alt="" sizes="921px" quality={80} className="bq-lupa__img" />
      </div>
      <p className="bq-lupa__pie" aria-live="polite">
        <span>{r ? r.nombre : "Zona elegida con el puntero"}</span>
        <span>Archivo a tamaño real (1:1)</span>
      </p>
      <p className="bq-inspector__ayuda">
        Mueve el puntero o arrastra sobre la obra para elegir qué examinar. Las anotaciones vuelven al salir.
      </p>
      <div className="bq-regiones" role="group" aria-label="Regiones para examinar">
        {REGIONES_EXAMEN.map((g, i) => (
          <button key={g.nombre} type="button" aria-pressed={region === i} onClick={() => irA(i)}>
            {g.nombre}
          </button>
        ))}
      </div>
      <button type="button" className="bq-aux bq-inspector__salir" onClick={onSalir}>
        Salir del examen <span className="bq-tecla" aria-hidden="true">Esc</span>
      </button>
    </div>
  );
}
