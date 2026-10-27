"use client";

import { useEffect, useRef } from "react";

/** Colores de la página (basquiat.css): el ruido no inventa una paleta. */
const COLORES = ["240 197 58", "211 58 58", "59 164 225", "243 166 143", "237 230 214"];
const W = 180;
const H = 210;

/**
 * «Ruido interior» (hallazgo 4): un campo de estática dentro de la bóveda del
 * acetato de Anatomía, en Canvas 2D. Es ruido abstracto de laboratorio (grano,
 * bandas de interferencia y destellos de color), no marcas ni signos: no imita
 * nada de la pintura. Se agita cuando el puntero se mueve sobre la escena y se
 * calma cuando se queda quieto.
 *
 * Solo anima mientras `activo` y la escena es visible; con movimiento reducido,
 * un único fotograma quieto.
 */
export function RuidoInterior({ activo }: { activo: boolean }) {
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !activo) return;
    c.width = W;
    c.height = H;
    const escena = c.closest<HTMLElement>(".bq-lab__escena");
    let energia = 1;
    let objetivo = 1;
    let quieto = 0;
    let marco = 0;
    let visible = true;
    let t0 = performance.now();
    // Un solo búfer para todos los fotogramas, escrito píxel a píxel como enteros
    // (RGBA little-endian) con un xorshift: ni basura por fotograma ni Math.random por píxel
    const img = ctx.createImageData(W, H);
    const px = new Uint32Array(img.data.buffer);
    let semilla = 0x9e3779b9;

    const pintar = (t: number) => {
      const dt = Math.min(0.05, (t - t0) / 1000);
      t0 = t;
      quieto += dt;
      // Un segundo sin mover el puntero: el ruido se va calmando
      objetivo = quieto > 1 ? 0.12 : 1;
      energia += (objetivo - energia) * Math.min(1, dt * 2.5);
      const escala = 0.25 + energia * 0.5;
      const alfa = ((90 + energia * 110) & 255) << 24;
      for (let i = 0; i < px.length; i++) {
        semilla ^= semilla << 13;
        semilla ^= semilla >>> 17;
        semilla ^= semilla << 5;
        const v = ((semilla >>> 24) * escala) & 255;
        px[i] = alfa | (v << 16) | (v << 8) | v;
      }
      ctx.putImageData(img, 0, 0);
      // Bandas de interferencia que suben despacio
      const bandas = 2 + Math.round(energia * 4);
      for (let b = 0; b < bandas; b++) {
        const y = (((t / 40) * (0.3 + b * 0.17) + b * 53) % (H + 20)) - 10;
        ctx.fillStyle = `rgb(${COLORES[b % COLORES.length]} / ${0.12 + energia * 0.25})`;
        ctx.fillRect(0, H - y, W, 2 + (b % 3));
      }
      // Destellos: rectángulos de color sin forma reconocible
      const n = Math.round(energia * 26);
      for (let k = 0; k < n; k++) {
        ctx.fillStyle = `rgb(${COLORES[k % COLORES.length]} / ${0.35 + Math.random() * 0.5})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 10 * energia, 1 + Math.random() * 3);
      }
      if (visible) marco = requestAnimationFrame(pintar);
    };

    const despertar = () => {
      quieto = 0;
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      energia = 0.5;
      quieto = 0;
      visible = false;
      pintar(performance.now());
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(marco);
      if (visible) {
        t0 = performance.now();
        marco = requestAnimationFrame(pintar);
      }
    });
    io.observe(c);
    escena?.addEventListener("pointermove", despertar);
    return () => {
      io.disconnect();
      cancelAnimationFrame(marco);
      escena?.removeEventListener("pointermove", despertar);
    };
  }, [activo]);

  return <canvas ref={lienzo} className="bq-ruido" data-activo={activo ? "" : undefined} aria-hidden="true" />;
}
