"use client";

import { useEffect, useRef } from "react";
import { CORONA_IMG, EPILOGO } from "@/content/corona";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const FRASES = EPILOGO.texto.split(/(?<=\.)\s+/);
const REMATE = FRASES[FRASES.length - 1];
const CUERPO = FRASES.slice(0, -1).join(" ");

export function Cierre() {
  const secRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;
    const items = sec.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!items.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.visible = "";
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.35 },
    );
    items.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const srcSet = CORONA_IMG.anchos
    .map((w) => `${BASE}${CORONA_IMG.base}-${w}.webp ${w}w`)
    .join(", ");

  return (
    <section
      ref={secRef}
      className="co-cierre"
      aria-labelledby="co-cierre-t"
    >
      <div className="co-cierre__monumento" data-reveal>
        <img
          src={`${BASE}${CORONA_IMG.base}-1200.webp`}
          srcSet={srcSet}
          sizes="(min-width: 64rem) 34vw, 78vw"
          width={CORONA_IMG.width}
          height={CORONA_IMG.height}
          alt={CORONA_IMG.alt}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="co-cierre__epilogo" data-reveal>
        <p className="co-kicker" aria-hidden="true">
          Acto IV
        </p>
        <h2 id="co-cierre-t" className="co-cierre__h">
          {EPILOGO.titulo}
        </h2>
        <p className="co-cierre__texto">{CUERPO}</p>
        <p className="co-cierre__remate">{REMATE}</p>
      </div>
    </section>
  );
}
