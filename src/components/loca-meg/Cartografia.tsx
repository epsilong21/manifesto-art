"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { MEG_IMG as I, PISTAS, TERRITORIOS, type Punto, type Zona } from "@/content/loca-meg";
import { rutaPublica } from "@/lib/rutaPublica";

const SRC = `${rutaPublica(I.base)}-${I.anchos[1]}.webp`;
const MINI = `${rutaPublica(I.base)}-${I.anchos[0]}.webp`;
const VB_H = I.ratio * 100;
const ROMANOS = ["I", "II", "III", "IV", "V"];
const COLUMNAS = "ABCDEFGH";
const FILAS = 6;
/** Nitidez: como mucho 1,35 píxeles CSS por píxel de la reproducción (2000 px de ancho), y nunca más de 5×. */
const NITIDEZ = 1.35;
const ZOOM_MAX = 5;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Cuadrante de la retícula de esta página (A–H, 1–6). */
const cuadrante = (x: number, y: number) => `${COLUMNAS[clamp(Math.floor(x * 8), 0, 7)]}${clamp(Math.floor(y * FILAS), 0, FILAS - 1) + 1}`;

type Revelado = "marcha" | "iris" | "llama" | "barrido" | "constelacion";
/**
 * Identidad de cada territorio (decisiones de diseño, no datos del cuadro): emblema, tinte de la
 * penumbra y forma en que se abre su zona. Meg avanza hacia la izquierda: su zona se abre en ese
 * sentido; la boca se abre como un ojo; el incendio sube; las criaturas desfilan; los objetos se
 * encienden uno a uno.
 */
const ESTILO: { ancla: { x: number; y: number }; tinte: [number, number, number]; revelado: Revelado; emblema: string }[] = [
  { ancla: { x: 0.4, y: 0.6 }, tinte: [38, 12, 6], revelado: "marcha", emblema: "M5 5l14 14M19 5 5 19M4 8l4-4M16 4l4 4" },
  { ancla: { x: 0.15, y: 0.55 }, tinte: [8, 12, 9], revelado: "iris", emblema: "M3 10c3-5 15-5 18 0M3 10c2 7 16 7 18 0M7 11l1.3 2 1.3-2 1.4 2 1.3-2 1.4 2 1.3-2 1.3 2" },
  { ancla: { x: 0.62, y: 0.22 }, tinte: [34, 12, 3], revelado: "llama", emblema: "M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 3-6 0 2 1 3 2 3 0-3-1-5 1-8z" },
  { ancla: { x: 0.31, y: 0.88 }, tinte: [7, 15, 10], revelado: "barrido", emblema: "M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11zM8 13l2 2 2-2 2 2 2-2" },
  { ancla: { x: 0.79, y: 0.46 }, tinte: [26, 19, 10], revelado: "constelacion", emblema: "M3 14a6 6 0 1 0 12 0 6 6 0 1 0-12 0M14.5 11.5 21 5" },
];

type Vista =
  | { tipo: "mapa" }
  | { tipo: "terr"; t: number; d: number | null }
  | { tipo: "ruta"; p: number; n: number };
type Cam = { x: number; y: number; z: number };
const TODO: Cam = { x: 0.5, y: 0.5, z: 1 };

/** Tramos de una ruta: curvas suaves (como los caminos de las cartas antiguas) entre sus tres paradas. */
function tramos(p: number) {
  const n = PISTAS[p].nodos;
  return [0, 1].map((k) => {
    const a = n[k], b = n[k + 1];
    const ax = a.x * 100, ay = a.y * VB_H, bx = b.x * 100, by = b.y * VB_H;
    const dx = bx - ax, dy = by - ay;
    const cx = (ax + bx) / 2 - dy * 0.18, cy = (ay + by) / 2 + dx * 0.18;
    return `M${ax.toFixed(2)},${ay.toFixed(2)} Q${cx.toFixed(2)},${cy.toFixed(2)} ${bx.toFixed(2)},${by.toFixed(2)}`;
  });
}

const facil = (e: number) => (e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2);

/**
 * «Cartografía del caos»: la tabla como un territorio. Una cámara (transformaciones CSS) que se
 * arrastra, se pellizca y vuela en arco entre territorios; una penumbra en canvas 2D, teñida por
 * territorio, que abre cada zona a su manera; rutas que se dibujan mientras se viaja y una carta de
 * situación. El zoom nunca supera la nitidez de la reproducción. Solo hay bucle mientras algo se mueve.
 */
export function Cartografia() {
  const [vista, setVista] = useState<Vista>({ tipo: "mapa" });

  const escena = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const velo = useRef<HTMLCanvasElement>(null);
  const carta = useRef<HTMLDivElement>(null);
  const tramo = useRef<(SVGPathElement | null)[]>([]);
  const motor = useRef<{ ir: (v: Vista) => void; zoom: (f: number, px?: number, py?: number) => void; mover: (dx: number, dy: number) => void; centrar: (x: number, y: number) => void; soltar: () => void; agarrar: () => void } | null>(null);
  const m = useRef({
    w: 0, h: 0, res: 0, bw: 0, bh: 0, ox: 0, oy: 0, zw: 0, zh: 0, zMax: 3,
    cam: { ...TODO }, vuelo: null as null | { de: Cam; a: Cam; t0: number; dur: number },
    inercia: { vx: 0, vy: 0 }, vista: { tipo: "mapa" } as Vista, revela: 0, tRevela: 0, avance: 1,
    quieto: false, visible: false, raf: 0, ultimo: 0,
    punteros: new Map<number, { x: number; y: number }>(), arrastre: 0, pinza: 0, tMov: 0, toque: { t: 0, x: 0, y: 0 },
  });

  useEffect(() => {
    const s = m.current;
    const es = escena.current!, cv = velo.current!;
    const ctx = cv.getContext("2d");
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    s.quieto = mq.matches;
    const RES = 0.5;

    const destino = (v: Vista): Cam => {
      const cap = (z: number) => clamp(z, 1, s.zMax);
      if (v.tipo === "terr") {
        const T = TERRITORIOS[v.t];
        const d = v.d !== null ? T.descubrimientos[v.d] : null;
        if (d) return { x: d.x, y: d.y, z: cap(d.zoom) };
        return T.vista ? { x: T.vista.x, y: T.vista.y, z: cap(T.vista.zoom) } : { ...TODO };
      }
      if (v.tipo === "ruta" && v.n < 3) {
        const n = PISTAS[v.p].nodos[v.n];
        return { x: n.x, y: n.y, z: cap(n.zoom * 0.8) };
      }
      return { ...TODO };
    };

    const encuadrar = () => {
      const zw = s.bw * s.cam.z, zh = s.bh * s.cam.z;
      let ox = s.w / 2 - s.cam.x * zw, oy = (s.h - s.res) / 2 - s.cam.y * zh;
      ox = zw > s.w ? clamp(ox, s.w - zw, 0) : (s.w - zw) / 2;
      oy = zh > s.h - s.res ? clamp(oy, s.h - s.res - zh, 0) : (s.h - s.res - zh) / 2;
      s.cam.x = (s.w / 2 - ox) / zw;
      s.cam.y = ((s.h - s.res) / 2 - oy) / zh;
      Object.assign(s, { ox, oy, zw, zh });
    };

    const hueco = (dibujar: () => void, pluma: number) => {
      // La forma se dibuja fuera del lienzo y solo cae su sombra desenfocada: borde suave
      if (!ctx) return;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = pluma;
      ctx.shadowOffsetX = 10000 * RES;
      ctx.translate(-10000, 0);
      ctx.fillStyle = "#000";
      ctx.beginPath();
      dibujar();
      ctx.fill();
      ctx.restore();
    };

    const pintar = () => {
      encuadrar();
      const { ox, oy, zw, zh } = s;
      // Transformación 2D: en reposo el navegador vuelve a rasterizar la imagen a la escala real
      const tr = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${s.cam.z.toFixed(4)})`;
      lienzo.current!.style.transform = tr;
      capa.current!.style.transform = tr;
      capa.current!.style.setProperty("--z", s.cam.z.toFixed(3));
      es.dataset.cerca = String(s.cam.z > 1.02);

      // Carta de situación: la parte visible de la tabla
      const ve = carta.current!.parentElement!;
      ve.dataset.on = String(s.cam.z > 1.05);
      const l = clamp(-ox / zw, 0, 1), t = clamp(-oy / zh, 0, 1);
      const r = clamp((s.w - ox) / zw, 0, 1), b = clamp((s.h - s.res - oy) / zh, 0, 1);
      Object.assign(carta.current!.style, { left: `${l * 100}%`, top: `${t * 100}%`, width: `${(r - l) * 100}%`, height: `${(b - t) * 100}%` });

      // Ruta: el tramo en curso se dibuja con el vuelo
      const v = s.vista;
      tramo.current.forEach((p, k) => {
        if (!p) return;
        const hecho = v.tipo === "ruta" ? (v.n > k + 1 ? 1 : v.n === k + 1 ? s.avance : 0) : 0;
        // Con trazo de grosor fijo los guiones se miden en píxeles de pantalla: longitud real × escala
        const largo = p.getTotalLength() * ((s.bw * s.cam.z) / 100);
        p.style.strokeDasharray = `${(largo * hecho).toFixed(1)} ${(largo + 10).toFixed(1)}`;
        p.style.opacity = hecho > 0.001 ? "1" : "0";
      });

      if (!ctx) return;
      ctx.setTransform(RES, 0, 0, RES, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, s.w, s.h);
      const X = (x: number) => ox + x * zw, Y = (y: number) => oy + y * zh;
      const p = s.revela;
      if (v.tipo === "terr") {
        const E = ESTILO[v.t], T = TERRITORIOS[v.t];
        const [cr, cg, cb] = E.tinte;
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${(0.66 * Math.min(1, p * 2)).toFixed(3)})`;
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.globalCompositeOperation = "destination-out";
        const pluma = 28 * s.cam.z;
        const d = v.d !== null ? T.descubrimientos[v.d] : null;
        if (d) {
          const R = Math.min(s.w, s.h) * 0.34;
          hueco(() => ctx.arc(X(d.x), Y(d.y), R, 0, Math.PI * 2), pluma);
        } else if (T.zona) {
          const z: Zona = T.zona, e = facil(p);
          const x0 = X(z.x), y0 = Y(z.y), w0 = z.w * zw, h0 = z.h * zh;
          hueco(() => {
            if (E.revelado === "marcha") ctx.rect(x0 + w0 * (1 - e), y0, w0 * e, h0);
            else if (E.revelado === "llama") ctx.rect(x0, y0 + h0 * (1 - e), w0, h0 * e);
            else if (E.revelado === "barrido") ctx.rect(x0, y0, w0 * e, h0);
            else ctx.ellipse(x0 + w0 / 2, y0 + h0 / 2, (w0 / 2) * 1.3 * e, (h0 / 2) * 1.3 * e, 0, 0, Math.PI * 2);
          }, pluma);
        } else if (T.anillos) {
          T.anillos.forEach((a, k) => {
            const e = facil(clamp(p * 1.6 - k * 0.15, 0, 1));
            if (e > 0) hueco(() => ctx.arc(X(a.x), Y(a.y), Math.max(s.w, s.h) * 0.075 * e, 0, Math.PI * 2), 18);
          });
        }
      } else if (v.tipo === "ruta" && v.n < 3) {
        const n = PISTAS[v.p].nodos[v.n];
        ctx.fillStyle = `rgba(20, 12, 6, ${(0.5 * Math.min(1, p * 2)).toFixed(3)})`;
        ctx.fillRect(0, 0, s.w, s.h);
        ctx.globalCompositeOperation = "destination-out";
        hueco(() => ctx.arc(X(n.x), Y(n.y), Math.min(s.w, s.h) * 0.36, 0, Math.PI * 2), 40);
      }
    };

    const paso = (ahora: number) => {
      s.raf = 0;
      const dt = s.ultimo ? Math.min(0.1, (ahora - s.ultimo) / 1000) : 1 / 60;
      s.ultimo = ahora;
      let sigue = false;
      if (s.vuelo) {
        const f = s.vuelo;
        const e = s.quieto ? 1 : clamp((ahora - f.t0) / f.dur, 0, 1);
        const k = facil(e);
        const d = Math.hypot(f.a.x - f.de.x, (f.a.y - f.de.y) * I.ratio);
        const arco = Math.min(0.55, d * 1.2);
        const z = Math.exp(Math.log(f.de.z) + (Math.log(f.a.z) - Math.log(f.de.z)) * k) * (1 - arco * Math.sin(Math.PI * k));
        s.cam = { x: f.de.x + (f.a.x - f.de.x) * k, y: f.de.y + (f.a.y - f.de.y) * k, z: Math.max(1, z) };
        s.avance = k;
        if (e >= 1) s.vuelo = null;
        else sigue = true;
      } else if (Math.abs(s.inercia.vx) + Math.abs(s.inercia.vy) > 15 && !s.punteros.size) {
        s.cam.x -= (s.inercia.vx * dt) / s.zw;
        s.cam.y -= (s.inercia.vy * dt) / s.zh;
        const fr = Math.exp(-dt * 5);
        s.inercia.vx *= fr;
        s.inercia.vy *= fr;
        sigue = true;
      }
      if (s.revela < 1) {
        s.revela = s.quieto ? 1 : clamp((ahora - s.tRevela) / 1100, 0, 1);
        sigue = true;
      }
      // En movimiento, capa compuesta (barata); al detenerse, se suelta para recuperar la nitidez
      movimiento(sigue || s.punteros.size > 0);
      pintar();
      if (sigue && s.visible) s.raf = requestAnimationFrame(paso);
    };

    const movimiento = (on: boolean) => {
      const v = on ? "transform" : "auto";
      if (lienzo.current!.style.willChange !== v) lienzo.current!.style.willChange = v;
    };

    const despertar = () => {
      if (s.raf || !s.visible) return;
      s.ultimo = 0;
      s.raf = requestAnimationFrame(paso);
    };

    const volar = (a: Cam) => {
      const de = { ...s.cam };
      const d = Math.hypot(a.x - de.x, (a.y - de.y) * I.ratio) + Math.abs(Math.log(a.z / de.z)) * 0.25;
      s.inercia = { vx: 0, vy: 0 };
      s.vuelo = { de, a, t0: performance.now(), dur: 750 + 1100 * Math.min(1, d * 1.5) };
      despertar();
    };

    const medir = () => {
      const r = es.getBoundingClientRect();
      s.w = r.width;
      s.h = r.height;
      // En pantallas estrechas los mandos ocupan una barra inferior: la tabla se encuadra por encima
      s.res = matchMedia("(max-width: 63.99rem)").matches ? 56 : 0;
      const mx = Math.max(24, s.w * 0.03), my = Math.max(28, (s.h - s.res) * 0.07);
      s.bw = Math.min(s.w - 2 * mx, (s.h - s.res - 2 * my) / I.ratio);
      s.bh = s.bw * I.ratio;
      s.zMax = clamp((I.width * NITIDEZ) / s.bw, 1, ZOOM_MAX);
      for (const el of [lienzo.current!, capa.current!]) {
        el.style.width = `${s.bw}px`;
        el.style.height = `${s.bh}px`;
      }
      cv.width = Math.max(1, Math.round(s.w * RES));
      cv.height = Math.max(1, Math.round(s.h * RES));
      s.cam.z = clamp(s.cam.z, 1, s.zMax);
      pintar();
    };

    motor.current = {
      ir: (v) => {
        const antes = s.vista;
        s.vista = v;
        const cambiaZona = v.tipo !== antes.tipo || (v.tipo === "terr" && antes.tipo === "terr" && (v.t !== antes.t || v.d !== antes.d)) || (v.tipo === "ruta" && antes.tipo === "ruta" && v.n !== antes.n);
        if (cambiaZona) {
          s.revela = 0;
          s.tRevela = performance.now() + (v.tipo === "terr" && v.d === null ? 350 : 150);
        }
        s.avance = 0;
        volar(destino(v));
      },
      zoom: (f, px = s.w / 2, py = (s.h - s.res) / 2) => {
        s.vuelo = null;
        const z = clamp(s.cam.z * f, 1, s.zMax);
        // El punto bajo el cursor se queda quieto
        const ux = (px - s.ox) / s.zw, uy = (py - s.oy) / s.zh;
        const zw = s.bw * z, zh = s.bh * z;
        s.cam = { x: (s.w / 2 - (px - ux * zw)) / zw, y: ((s.h - s.res) / 2 - (py - uy * zh)) / zh, z };
        pintar();
      },
      mover: (dx, dy) => {
        s.vuelo = null;
        s.cam.x -= dx / s.zw;
        s.cam.y -= dy / s.zh;
        pintar();
      },
      centrar: (x, y) => volar({ x, y, z: Math.max(s.cam.z, Math.min(2, s.zMax)) }),
      soltar: despertar,
      agarrar: () => movimiento(true),
    };
    medir();

    const rueda = (ev: WheelEvent) => {
      // Solo el gesto de pellizco del panel táctil (ctrl + rueda); la rueda normal desplaza la página
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      const r = es.getBoundingClientRect();
      motor.current?.zoom(Math.exp(-ev.deltaY * 0.01), ev.clientX - r.left, ev.clientY - r.top);
    };
    es.addEventListener("wheel", rueda, { passive: false });
    const ro = new ResizeObserver(medir);
    ro.observe(es);
    const io = new IntersectionObserver(([e]) => {
      s.visible = e.isIntersecting;
      if (s.visible) despertar();
    });
    io.observe(es);
    const cambio = () => {
      s.quieto = mq.matches;
    };
    mq.addEventListener("change", cambio);
    return () => {
      es.removeEventListener("wheel", rueda);
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener("change", cambio);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    motor.current?.ir(vista);
  }, [vista]);

  // ── Gestos sobre la escena: arrastrar, pellizcar, doble toque ──
  const abajo = (ev: RPointerEvent<HTMLDivElement>) => {
    if ((ev.target as Element).closest("button")) return;
    const s = m.current;
    s.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    s.inercia = { vx: 0, vy: 0 };
    s.arrastre = 0;
    s.tMov = 0;
    motor.current?.agarrar();
    if (s.punteros.size === 2) {
      const [a, b] = [...s.punteros.values()];
      s.pinza = Math.hypot(a.x - b.x, a.y - b.y);
    }
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
  };
  const mueve = (ev: RPointerEvent<HTMLDivElement>) => {
    const s = m.current;
    const prev = s.punteros.get(ev.pointerId);
    if (!prev) return;
    const dx = ev.clientX - prev.x, dy = ev.clientY - prev.y;
    s.punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const r = ev.currentTarget.getBoundingClientRect();
    if (s.punteros.size === 2) {
      const [a, b] = [...s.punteros.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (s.pinza > 0) motor.current?.zoom(d / s.pinza, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      s.pinza = d;
      s.arrastre = 99;
      return;
    }
    s.arrastre += Math.abs(dx) + Math.abs(dy);
    if (s.arrastre < 4) return;
    motor.current?.mover(dx, dy);
    const dt = Math.max(8, ev.timeStamp - (s.tMov || ev.timeStamp - 16));
    s.inercia = { vx: (dx / dt) * 1000 * 0.6, vy: (dy / dt) * 1000 * 0.6 };
    s.tMov = ev.timeStamp;
  };
  const arriba = (ev: RPointerEvent<HTMLDivElement>) => {
    const s = m.current;
    if (!s.punteros.delete(ev.pointerId)) return;
    if (s.punteros.size) return;
    s.pinza = 0;
    if (s.arrastre < 4) {
      // Doble toque: acercarse al punto; ya cerca del límite, volver al cuadro entero
      const r = ev.currentTarget.getBoundingClientRect();
      const x = ev.clientX - r.left, y = ev.clientY - r.top;
      const t = s.toque;
      if (ev.timeStamp - t.t < 320 && Math.hypot(x - t.x, y - t.y) < 30) {
        if (s.cam.z > s.zMax * 0.92) setVista({ tipo: "mapa" });
        else motor.current?.zoom(1.8, x, y);
        s.toque = { t: 0, x: 0, y: 0 };
      } else s.toque = { t: ev.timeStamp, x, y };
      s.inercia = { vx: 0, vy: 0 };
    } else {
      s.toque = { t: 0, x: 0, y: 0 };
      // Si el dedo se quedó quieto antes de soltar, no hay impulso
      if (s.quieto || ev.timeStamp - s.tMov > 90) s.inercia = { vx: 0, vy: 0 };
      motor.current?.soltar();
    }
  };
  const fuera = (ev: RPointerEvent<HTMLDivElement>) => {
    m.current.punteros.delete(ev.pointerId);
    m.current.pinza = 0;
  };

  const atras = () => {
    if (vista.tipo === "terr" && vista.d !== null) setVista({ ...vista, d: null });
    else setVista({ tipo: "mapa" });
  };
  const teclas = (ev: KeyboardEvent<HTMLDivElement>) => {
    const paso = 60;
    const mov: Record<string, [number, number]> = { ArrowLeft: [paso, 0], ArrowRight: [-paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] };
    if (mov[ev.key]) motor.current?.mover(...mov[ev.key]);
    else if (ev.key === "+" || ev.key === "=") motor.current?.zoom(1.4);
    else if (ev.key === "-") motor.current?.zoom(1 / 1.4);
    else if (ev.key === "0" || ev.key === "Home") setVista({ tipo: "mapa" });
    else return;
    ev.preventDefault();
  };
  const salaTeclas = (ev: KeyboardEvent<HTMLElement>) => {
    if (ev.key === "Escape" && vista.tipo !== "mapa") {
      atras();
      ev.preventDefault();
    }
  };

  const T = vista.tipo === "terr" ? TERRITORIOS[vista.t] : null;
  const det: Punto | null = vista.tipo === "terr" && vista.d !== null ? T!.descubrimientos[vista.d] : null;
  const P = vista.tipo === "ruta" ? PISTAS[vista.p] : null;
  const nodo = vista.tipo === "ruta" && vista.n < 3 ? P!.nodos[vista.n] : null;
  const enMapa = vista.tipo === "mapa";

  return (
    <section id="mundo-de-meg" className="cg-sala" data-tipo={vista.tipo} aria-labelledby="cg-titulo" aria-roledescription="instalación" onKeyDown={salaTeclas}>
      <header className="cg-cabeza">
        <p className="cg-ante">Instalación · Carta de la tabla</p>
        <h2 id="cg-titulo">Cartografía del caos</h2>
      </header>

      <div
        ref={escena}
        className="cg-escena"
        tabIndex={0}
        role="group"
        aria-roledescription="mapa"
        aria-label="La tabla de Bruegel como mapa. Flechas para recorrerla, más y menos para acercarse, cero para la vista completa."
        onKeyDown={teclas}
        onPointerDown={abajo}
        onPointerMove={mueve}
        onPointerUp={arriba}
        onPointerCancel={fuera}
      >
        <div ref={lienzo} className="cg-lienzo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SRC} width={I.width} height={I.height} alt="" loading="lazy" decoding="async" draggable={false} />
          <svg viewBox={`0 0 100 ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
            {P ? (
              <>
                {tramos(vista.tipo === "ruta" ? vista.p : 0).map((d, k) => (
                  <g key={k}>
                    <path className="cg-camino" d={d} />
                    <path ref={(el) => { tramo.current[k] = el; }} className="cg-trazo" d={d} />
                  </g>
                ))}
              </>
            ) : null}
          </svg>
        </div>
        <canvas ref={velo} className="cg-velo" aria-hidden="true" />

        <div ref={capa} className="cg-capa">
          <span className="cg-orla" aria-hidden="true">
            {COLUMNAS.split("").map((c, k) => (
              <i key={c} className="cg-col" style={{ left: `${((k + 0.5) / 8) * 100}%` }}>{c}</i>
            ))}
            {Array.from({ length: FILAS }, (_, k) => (
              <i key={k} className="cg-fila" style={{ top: `${((k + 0.5) / FILAS) * 100}%` }}>{k + 1}</i>
            ))}
          </span>

          {vista.tipo !== "ruta" && !det
            ? TERRITORIOS.map((t, k) => (
                <button
                  key={t.id}
                  type="button"
                  className="cg-sello"
                  data-on={vista.tipo === "terr" && vista.t === k}
                  aria-label={`Territorio ${ROMANOS[k]}: ${t.nombre}`}
                  aria-pressed={vista.tipo === "terr" && vista.t === k}
                  style={{ left: `${ESTILO[k].ancla.x * 100}%`, top: `${ESTILO[k].ancla.y * 100}%` }}
                  onClick={() => setVista({ tipo: "terr", t: k, d: null })}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ESTILO[k].emblema} /></svg>
                  <span className="cg-sello__n" aria-hidden="true">{ROMANOS[k]}</span>
                  <span className="cg-sello__t" aria-hidden="true">{t.nombre}</span>
                </button>
              ))
            : null}

          {T && vista.tipo === "terr"
            ? T.descubrimientos.map((d, k) => (
                <button
                  key={d.id}
                  type="button"
                  className="cg-hallazgo"
                  data-on={vista.d === k}
                  aria-label={`Detalle: ${d.titulo}`}
                  aria-pressed={vista.d === k}
                  style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
                  onClick={() => setVista({ tipo: "terr", t: vista.t, d: vista.d === k ? null : k })}
                >
                  <span className="cg-hallazgo__t" aria-hidden="true">{d.titulo}</span>
                </button>
              ))
            : null}

          {P && vista.tipo === "ruta"
            ? P.nodos.map((n, k) => (
                <button
                  key={n.id}
                  type="button"
                  className="cg-etapa"
                  data-on={vista.n === k}
                  data-hecha={vista.n > k}
                  aria-label={`Etapa ${k + 1}: ${n.titulo}`}
                  style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
                  onClick={() => setVista({ tipo: "ruta", p: vista.p, n: k })}
                >
                  {k + 1}
                </button>
              ))
            : null}
        </div>

        <div className="cg-situacion" data-on="false" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MINI}
            width={I.anchos[0]}
            height={Math.round(I.anchos[0] * I.ratio)}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onPointerDown={(ev) => {
              ev.stopPropagation();
              const r = ev.currentTarget.getBoundingClientRect();
              motor.current?.centrar((ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height);
            }}
          />
          <span ref={carta} />
        </div>

        <div className="cg-mando">
          <button type="button" onClick={() => motor.current?.zoom(1 / 1.5)} aria-label="Alejar">−</button>
          <button type="button" onClick={() => motor.current?.zoom(1.5)} aria-label="Acercar">+</button>
          <button type="button" className="cg-todo" onClick={() => setVista({ tipo: "mapa" })}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            <span>Vista completa</span>
          </button>
        </div>
      </div>

      <div className="cg-leyenda">
        <div className="cg-texto" aria-live="polite">
          {enMapa ? (
            <>
              <p className="cg-texto__n">Carta general · cinco territorios</p>
              <h3>El mundo de Meg</h3>
              <p>Toca un sello para viajar a su territorio. Arrastra para recorrer la tabla; acércate con doble toque, pellizcando o con + y −.</p>
              <p className="cg-clave">
                {TERRITORIOS.map((t, k) => (
                  <span key={t.id}>{k ? " · " : ""}<b>{ROMANOS[k]}</b> {t.nombre}</span>
                ))}
              </p>
            </>
          ) : null}

          {T && vista.tipo === "terr" && !det ? (
            <>
              <p className="cg-texto__n">
                Territorio {ROMANOS[vista.t]} · cuadrante {cuadrante(ESTILO[vista.t].ancla.x, ESTILO[vista.t].ancla.y)}
              </p>
              <h3>{T.nombre}</h3>
              <p><b>Se ve.</b> {T.seVe}</p>
              <p className="cg-int"><b>Interpretación.</b> {T.interpretacion}</p>
              <p className="cg-pista">Dos detalles marcados con ✕ sobre la tabla.</p>
            </>
          ) : null}

          {det && vista.tipo === "terr" ? (
            <>
              <p className="cg-texto__n">
                Territorio {ROMANOS[vista.t]} · detalle {vista.d! + 1} de 2 · cuadrante {cuadrante(det.x, det.y)}
              </p>
              <h3>{det.titulo}</h3>
              <p>{det.texto}</p>
            </>
          ) : null}

          {P && vista.tipo === "ruta" ? (
            <>
              <p className="cg-texto__n">
                Expedición · {P.titulo} · {nodo ? `etapa ${vista.n + 1} de 3` : "la ruta entera"}
              </p>
              {nodo ? (
                <>
                  <h3>{nodo.titulo}</h3>
                  <p><b>{nodo.relacion}.</b> {nodo.texto}</p>
                  <p className="cg-pregunta">{P.pregunta}</p>
                </>
              ) : (
                <>
                  <h3>{P.pregunta}</h3>
                  <p className="cg-int"><b>Interpretación.</b> {P.lectura.replace(/^Lectura de esta página: (.)/, (_, c: string) => c.toUpperCase())}</p>
                </>
              )}
            </>
          ) : null}
        </div>

        <div className="cg-acciones">
          {vista.tipo === "terr" && !det ? (
            <div className="cg-fila-b">
              <button type="button" onClick={() => setVista({ tipo: "terr", t: (vista.t + 4) % 5, d: null })} aria-label={`Territorio anterior: ${TERRITORIOS[(vista.t + 4) % 5].nombre}`}>←</button>
              <button type="button" onClick={() => setVista({ tipo: "terr", t: (vista.t + 1) % 5, d: null })} aria-label={`Territorio siguiente: ${TERRITORIOS[(vista.t + 1) % 5].nombre}`}>→</button>
              {T!.descubrimientos.map((d, k) => (
                <button key={d.id} type="button" className="cg-texto-b" onClick={() => setVista({ tipo: "terr", t: vista.t, d: k })}>
                  ✕ {d.titulo}
                </button>
              ))}
            </div>
          ) : null}

          {det && vista.tipo === "terr" ? (
            <div className="cg-fila-b">
              <button type="button" className="cg-texto-b" onClick={() => setVista({ tipo: "terr", t: vista.t, d: null })}>
                ← {T!.nombre}
              </button>
              <button type="button" className="cg-texto-b" onClick={() => setVista({ tipo: "terr", t: vista.t, d: vista.d === 0 ? 1 : 0 })}>
                ✕ {T!.descubrimientos[vista.d === 0 ? 1 : 0].titulo}
              </button>
            </div>
          ) : null}

          {P && vista.tipo === "ruta" ? (
            <div className="cg-fila-b">
              {nodo ? (
                <>
                  <button type="button" className="cg-avanza" onClick={() => setVista({ tipo: "ruta", p: vista.p, n: vista.n + 1 })}>
                    {vista.n < 2 ? "Siguiente etapa →" : "Ver la ruta entera →"}
                  </button>
                  <button type="button" className="cg-texto-b" onClick={() => setVista({ tipo: "terr", t: nodo.territorio, d: null })}>
                    Territorio {ROMANOS[nodo.territorio]}: {TERRITORIOS[nodo.territorio].nombre}
                  </button>
                </>
              ) : (
                <button type="button" className="cg-texto-b" onClick={() => setVista({ tipo: "ruta", p: vista.p, n: 0 })}>
                  ↺ Repetir la expedición
                </button>
              )}
            </div>
          ) : null}

          {enMapa || (vista.tipo === "ruta" && !nodo) ? (
            <div className="cg-expediciones" role="group" aria-label="Expediciones">
              <p className="cg-texto__n">Tres expediciones</p>
              {PISTAS.map((p, k) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={vista.tipo === "ruta" && vista.p === k}
                  onClick={() => setVista({ tipo: "ruta", p: k, n: 0 })}
                >
                  <span aria-hidden="true">{"ABC"[k]}</span> {p.titulo}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <p className="cg-nota">La retícula, los sellos y las rutas son de esta página: ordenan la mirada; Bruegel no los marcó.</p>
      </div>

      <div className="cg-nojs">
        <ol>
          {TERRITORIOS.map((t, k) => (
            <li key={t.id}>
              <strong>{ROMANOS[k]} · {t.nombre}.</strong> {t.seVe} {t.descubrimientos.map((d) => `${d.titulo}: ${d.texto}`).join(" ")} <em>Interpretación: {t.interpretacion}</em>
            </li>
          ))}
        </ol>
        <ol>
          {PISTAS.map((p) => (
            <li key={p.id}>
              <strong>{p.titulo}.</strong> {p.pregunta} {p.nodos.map((n) => `${n.titulo}: ${n.texto}`).join(" ")} <em>{p.lectura}</em>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
