"use client";

import { useEffect, useRef, useState } from "react";

/** Remolinos de la pintura, en coordenadas de la obra (0–1). Signo: sentido de giro. */
const VORTICES = [
  { x: 0.57, y: 0.38, k: 1.0 },
  { x: 0.68, y: 0.5, k: -0.7 },
  { x: 0.91, y: 0.17, k: 0.6 },
  { x: 0.2, y: 0.22, k: 0.45 },
];
const IMG_ASPECT = 3000 / 2376;
const COLORS = ["224,170,69", "244,233,207", "160,196,232"];
/** Ciprés y horizonte (coordenadas de la obra): ahí no hay cielo y las corrientes se apagan. */
const CIPRES = [
  [0.195, 0.05], [0.225, 0.2], [0.25, 0.4], [0.3, 0.58], [0.35, 0.68], [0.42, 0.85], [0.46, 1],
  [0.11, 1], [0.12, 0.7], [0.13, 0.45], [0.155, 0.3], [0.18, 0.15],
];
const HORIZONTE = [[0, 0.7], [0.3, 0.66], [0.45, 0.68], [0.6, 0.62], [0.75, 0.6], [0.88, 0.52], [1, 0.5]];
/** El diseño original se ajustó a 60 Hz: rastro y cursor se escalan por tiempo, no por fotograma. */
const FADE_60 = 0.075;

function enCielo(u: number, v: number) {
  let h = HORIZONTE[HORIZONTE.length - 1][1];
  for (let i = 1; i < HORIZONTE.length; i++) {
    const [x0, y0] = HORIZONTE[i - 1];
    const [x1, y1] = HORIZONTE[i];
    if (u <= x1) {
      h = y0 + ((y1 - y0) * (u - x0)) / (x1 - x0);
      break;
    }
  }
  if (v > h) return false;
  let dentro = false;
  for (let i = 0, j = CIPRES.length - 1; i < CIPRES.length; j = i++) {
    const [xi, yi] = CIPRES[i];
    const [xj, yj] = CIPRES[j];
    if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return !dentro;
}

/** z: profundidad (0 lejos, 1 cerca). vis: visibilidad suavizada sobre el cielo. */
type P = { x: number; y: number; px: number; py: number; life: number; max: number; c: string; w: number; z: number; vis: number };

/** Encuadre de la obra cuando el contenedor la amplía (ver src/lib/focus.ts). */
export type SkyView = { scale: number; tx: number; ty: number };

type Props = {
  /** Contenedor que recibe el puntero (normalmente la sección entera). */
  targetRef: React.RefObject<HTMLElement | null>;
  paused: boolean;
  hidden: boolean;
  /** Encuadre ampliado de la obra (explorador); sin él, la obra cubre el contenedor. */
  view?: SkyView;
  /** Brillo de las estelas (1 = hero). */
  intensity?: number;
  /** Fuerza de los remolinos (1 = hero). */
  swirl?: number;
  /** Partículas por superficie (1 = hero). */
  density?: number;
  className?: string;
};

/**
 * Relevo entre lienzos: si dos están a la vista (el final del hero y el
 * explorador), solo anima el que más se ve. Nunca hay dos bucles a la vez.
 */
const visibles = new Map<symbol, number>();
const esPrincipal = (id: symbol) => {
  const mio = visibles.get(id) ?? 0;
  if (mio <= 0) return false;
  for (const [otro, r] of visibles) if (otro !== id && r > mio) return false;
  return true;
};

/**
 * Corrientes de luz sobre la pintura (Canvas 2D). La obra queda debajo, intacta:
 * el lienzo es transparente y las estelas se desvanecen con «destination-out».
 */
export function SkyField({ targetRef, paused, hidden, view, intensity = 1, swirl = 1, density = 1, className = "nc-field" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [supported, setSupported] = useState(true);
  const state = useRef({ paused, hidden, view, intensity, swirl });
  useEffect(() => {
    state.current = { paused, hidden, view, intensity, swirl };
  }, [paused, hidden, view, intensity, swirl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = targetRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setSupported(false);
      return;
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const id = Symbol("cielo");

    let W = 0;
    let H = 0;
    let dpr = 1;
    let parts: P[] = [];
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let slowFrames = 0;
    // Estela del puntero: posición, dirección del gesto y fuerza (se apaga con el tiempo)
    const pointer = { x: -1, y: -1, dx: 0, dy: 0, strength: 0 };
    // Transformación «object-fit: cover» de la obra al lienzo (s = ancho de la obra en px)
    let map = { s: 1, ox: 0, oy: 0 };
    let mappedView = state.current.view;

    const budget = () => {
      const small = W < 768;
      const lowEnd = (navigator.hardwareConcurrency ?? 8) <= 4;
      let n = Math.round(((W * H) / (small ? 1500 : 1900)) * density);
      n = Math.min(n, small ? 320 : 900);
      return lowEnd ? Math.round(n / 2) : n;
    };

    const cielo = (x: number, y: number) => enCielo((x - map.ox) / map.s, (y - map.oy) / (map.s / IMG_ASPECT));

    const spawn = (p?: P): P => {
      const q = p ?? ({} as P);
      // Nace en el cielo pintado (unos pocos intentos; si no, donde caiga, y se apagará)
      for (let i = 0; i < 6; i++) {
        q.x = Math.random() * W;
        q.y = Math.random() * H * 0.78;
        if (cielo(q.x, q.y)) break;
      }
      q.px = q.x;
      q.py = q.y;
      q.life = q.max = 80 + Math.random() * 220;
      q.z = Math.random() ** 1.4;
      // Las lejanas tiran a frías; las cercanas conservan el oro de las estrellas
      q.c = q.z < 0.35 ? COLORS[Math.random() < 0.7 ? 2 : 1] : COLORS[Math.random() < 0.55 ? 0 : Math.random() < 0.6 ? 1 : 2];
      q.w = (0.6 + Math.random() * 1.1) * (0.55 + 0.6 * q.z) * dpr;
      q.vis = cielo(q.x, q.y) ? 1 : 0;
      return q;
    };

    const resize = () => {
      const r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.25 : 1.5);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      // Alto de la obra al cubrir el contenedor; map.s guarda su ancho
      const ih = Math.max(W / IMG_ASPECT, H);
      const iw = ih * IMG_ASPECT;
      // Igual que el CSS de la obra (object-position: 50% 40%)
      map = { s: iw, ox: (W - iw) * 0.5, oy: (H - ih) * 0.4 };
      // Encuadre ampliado: translate(tx%, ty%) scale(s) con origen arriba a la izquierda
      mappedView = state.current.view;
      if (mappedView) {
        const { scale, tx, ty } = mappedView;
        map = { s: map.s * scale, ox: (tx / 100) * W + map.ox * scale, oy: (ty / 100) * H + map.oy * scale };
      }
      const n = budget();
      parts = Array.from({ length: n }, () => spawn());
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const field = (x: number, y: number, t: number) => {
      // Deriva general de izquierda a derecha, como el cielo pintado
      let vx = 0.35 + Math.sin(y * 0.006 + t * 0.0002) * 0.25;
      let vy = Math.sin(x * 0.004 + t * 0.00015) * 0.18;
      const ih = map.s / IMG_ASPECT;
      for (const v of VORTICES) {
        const cx = map.ox + v.x * map.s;
        const cy = map.oy + v.y * ih;
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        const R = map.s * 0.12;
        const f = (v.k * state.current.swirl * R * 1.6) / (d2 / R + R);
        vx += -dy * f * 0.02;
        vy += dx * f * 0.02;
      }
      if (pointer.strength > 0.01) {
        // Estela: el cielo acompaña el gesto y gira un poco a su alrededor, sin arrastrarlo todo
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        const R = Math.min(170, Math.max(90, Math.min(W, H) * 0.16));
        const f = (pointer.strength * R * R) / (d2 + R * R);
        vx += pointer.dx * f * 2.2 + (-dy / R) * f * 1.4;
        vy += pointer.dy * f * 2.2 + (dx / R) * f * 1.4;
      }
      return [vx, vy];
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || state.current.paused || state.current.hidden || reduce.matches || !esPrincipal(id)) return;
      // Nuevo encuadre: se recoloca todo (el lienzo está oculto mientras cambia)
      if (state.current.view !== mappedView) resize();
      const dt = Math.min(48, now - last);
      last = now;
      // Si el dispositivo no llega, se reduce la carga
      slowFrames = dt > 30 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 45 && parts.length > 120) {
        parts.length = Math.round(parts.length * 0.6);
        slowFrames = 0;
      }
      const step = dt / 16.7;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${(1 - (1 - FADE_60) ** step).toFixed(4)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (const p of parts) {
        const [vx, vy] = field(p.x, p.y, now);
        const lejos = 0.55 + 0.65 * p.z;
        p.px = p.x;
        p.py = p.y;
        p.x += vx * step * 1.7 * lejos;
        p.y += vy * step * 1.7 * lejos;
        p.life -= step;
        if (p.life <= 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) {
          spawn(p);
          continue;
        }
        p.vis += ((cielo(p.x, p.y) ? 1 : 0) - p.vis) * Math.min(1, 0.12 * step);
        // Fundido al nacer y al morir: sin destellos que aparecen de golpe
        const a = Math.min(1, (p.max - p.life) / 18) * Math.min(1, p.life / 60) * (0.45 + 0.55 * p.z) * p.vis * 0.75 * state.current.intensity;
        if (a < 0.01) continue;
        ctx.strokeStyle = `rgba(${p.c},${a})`;
        ctx.lineWidth = p.w / dpr;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      pointer.strength *= 0.96 ** step;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf && visible && !state.current.paused && !state.current.hidden && !reduce.matches && esPrincipal(id)) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // La fuerza crece con la distancia recorrida, no con el número de eventos
      const d = pointer.x < 0 ? 0 : Math.hypot(x - pointer.x, y - pointer.y);
      if (d > 0.5) {
        pointer.dx += ((x - pointer.x) / d - pointer.dx) * 0.3;
        pointer.dy += ((y - pointer.y) / d - pointer.dy) * 0.3;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.strength = Math.min(1, pointer.strength + Math.min(d, 60) / 120);
    };
    // Un toque nuevo empieza un gesto nuevo: sin saltos desde el anterior
    const onDown = (e: PointerEvent) => {
      pointer.x = -1;
      onMove(e);
    };

    resize();
    start();
    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(host);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        visibles.set(id, visible ? entry.intersectionRatio || 0.001 : 0);
        if (visible) start();
        else stop();
      },
      { threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1] },
    );
    io.observe(host);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    const onReduce = () => (reduce.matches ? stop() : start());
    reduce.addEventListener("change", onReduce);
    // Reanudar cuando cambian los controles
    const poll = window.setInterval(start, 400);

    return () => {
      stop();
      visibles.delete(id);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      reduce.removeEventListener("change", onReduce);
      window.clearInterval(poll);
    };
  }, [targetRef, density]);

  if (!supported) return null;
  return <canvas ref={canvasRef} className={`${className} ${hidden ? "is-hidden" : ""}`} aria-hidden="true" />;
}
