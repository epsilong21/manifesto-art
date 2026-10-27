"use client";

import { useRef } from "react";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { LECTURAS, type LecturaId } from "@/content/basquiat-lecturas";
import { gsap, useGSAP } from "@/lib/gsap";

gsap.registerPlugin(MorphSVGPlugin);

type Vista = LecturaId | "tres" | "neutra";

/**
 * Las tres lecturas como un solo contorno de MANIFESTO que se transforma
 * (MorphSVG): cráneo, rostro o máscara. Geometría propia del esquema de la
 * cabeza (EsquemaCabeza), no la pintura. En «Las tres a la vez» los tres
 * contornos se superponen, cada uno con su color.
 *
 * Escucha los radios nativos de TresLecturas (name="bq-lectura"): la elección
 * sigue funcionando sin JavaScript; esto solo añade la figura.
 */
const FORMAS: Record<Exclude<Vista, "tres">, { cabeza: string; ojoI: string; ojoD: string; boca: string }> = {
  neutra: {
    cabeza: "M300 96 C412 96 470 186 470 300 C470 370 452 420 430 452 C410 540 360 600 300 604 C240 600 190 540 170 452 C148 420 130 370 130 300 C130 186 188 96 300 96Z",
    ojoI: "M206 318 C206 300 224 290 240 290 C256 290 274 300 274 318 C274 336 256 346 240 346 C224 346 206 336 206 318Z",
    ojoD: "M326 318 C326 300 344 290 360 290 C376 290 394 300 394 318 C394 336 376 346 360 346 C344 346 326 336 326 318Z",
    boca: "M248 486 C280 498 320 498 352 486 C320 504 280 504 248 486Z",
  },
  craneo: {
    cabeza: "M300 100 C420 100 476 190 470 300 C466 360 446 392 420 410 L414 470 C410 540 360 600 300 604 C240 600 190 540 186 470 L180 410 C154 392 134 360 130 300 C124 190 180 100 300 100Z",
    ojoI: "M186 320 C186 286 210 266 240 266 C270 266 290 286 290 320 C290 354 270 370 240 370 C210 370 186 354 186 320Z",
    ojoD: "M310 320 C310 286 330 266 360 266 C390 266 414 286 414 320 C414 354 390 370 360 370 C330 370 310 354 310 320Z",
    boca: "M212 470 L388 470 L388 512 L212 512Z",
  },
  rostro: {
    cabeza: "M300 92 C418 92 472 196 466 312 C462 400 430 470 392 530 C362 578 334 600 300 600 C266 600 238 578 208 530 C170 470 138 400 134 312 C128 196 182 92 300 92Z",
    ojoI: "M196 314 C196 284 216 268 240 268 C264 268 284 284 284 314 C284 344 264 360 240 360 C216 360 196 344 196 314Z",
    ojoD: "M362 318 C362 312 376 306 392 306 C408 306 422 312 422 318 C422 324 408 330 392 330 C376 330 362 324 362 318Z",
    boca: "M246 488 C280 476 320 476 354 488 C320 498 280 498 246 488Z",
  },
  mascara: {
    cabeza: "M300 112 L450 220 L462 470 L300 616 L138 470 L150 220Z",
    ojoI: "M196 314 L268 300 L268 328 L196 322Z",
    ojoD: "M404 314 L332 300 L332 328 L404 322Z",
    boca: "M240 470 L360 470 L360 488 L240 488Z",
  },
};
const COLOR: Record<LecturaId, string> = { craneo: "#ede6d6", rostro: "#f0c53a", mascara: "#4fb6f0" };

export function ContornoLecturas() {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const svg = raiz.current;
      if (!svg) return;
      const seccion = svg.closest(".bq-lecturas");
      const reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ir = (v: Vista) => {
        svg.dataset.vista = v;
        const f = FORMAS[v === "tres" ? "neutra" : v];
        const d = reducido ? 0 : 0.9;
        const color = v === "tres" || v === "neutra" ? "#8f887a" : COLOR[v];
        for (const parte of ["cabeza", "ojoI", "ojoD", "boca"] as const) {
          gsap.to(svg.querySelector(`[data-parte="${parte}"]`), { morphSVG: f[parte], stroke: color, duration: d, ease: "power3.inOut", overwrite: true });
        }
        gsap.to(svg.querySelectorAll(".bq-contorno__fantasma"), { autoAlpha: v === "tres" ? 1 : 0, duration: reducido ? 0 : 0.5, stagger: reducido ? 0 : 0.12 });
        gsap.fromTo(svg.querySelector(".bq-contorno__nombre"), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: reducido ? 0 : 0.5 });
      };
      const cambio = (e: Event) => {
        const t = e.target as HTMLInputElement;
        if (t.name === "bq-lectura" && t.checked) ir(t.value as Vista);
      };
      const marcado = seccion?.querySelector<HTMLInputElement>('input[name="bq-lectura"]:checked');
      if (marcado) ir(marcado.value as Vista);
      seccion?.addEventListener("change", cambio);
      return () => seccion?.removeEventListener("change", cambio);
    },
    { scope: raiz },
  );

  const n = FORMAS.neutra;
  return (
    <div ref={raiz} className="bq-contorno" data-vista="neutra" aria-hidden="true">
      <svg viewBox="0 0 600 700">
        {LECTURAS.map((l) => (
          <g key={l.id} className="bq-contorno__fantasma" style={{ stroke: COLOR[l.id] }}>
            <path d={FORMAS[l.id].cabeza} />
            <path d={FORMAS[l.id].ojoI} />
            <path d={FORMAS[l.id].ojoD} />
            <path d={FORMAS[l.id].boca} />
          </g>
        ))}
        <g className="bq-contorno__principal">
          <path data-parte="cabeza" d={n.cabeza} />
          <path data-parte="ojoI" d={n.ojoI} />
          <path data-parte="ojoD" d={n.ojoD} />
          <path data-parte="boca" d={n.boca} />
        </g>
      </svg>
      <p className="bq-contorno__nombre">
        {LECTURAS.map((l) => (
          <span key={l.id} data-de={l.id}>
            {l.nombre}
          </span>
        ))}
        <span data-de="tres">Las tres a la vez</span>
        <span data-de="neutra">Elige una mirada</span>
      </p>
      <p className="bq-contorno__aviso">Esquema de MANIFESTO · no es la pintura</p>
    </div>
  );
}
