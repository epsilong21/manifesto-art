"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ANCIANO_IMG as I } from "@/content/anciano";
import { rutaPublica } from "@/lib/rutaPublica";
import { AMPLIADO_V5, DURACION_V5, ESPECIFICO_DESDE, FRAGMENTOS_V5, TRAMOS_V5 } from "@/content/anciano-v5";
import { CENTRO, FOCO_COMPAS, FOCO_URIZEN, clamp, mezcla, suave } from "../limiteGeom";
import { PUNTA_DER, crearMundo, pintarActo, pintarPrologo, type Mundo } from "./mundo3d";


type Medidas = {
  W: number; H: number;
  vx: number; vy: number; vw: number; vh: number;
  ancho: number; kU: number; kC: number; dpr: number;
  R: number; th0: number; c0x: number; c0y: number; f: number; rr: number;
};

/** Valores que el visitante modifica; cada uno tiene un objetivo (lo que pide) y un valor pintado (que lo sigue sin saltos). */
type Mando = { cur: number; tgt: number };

/**
 * V5 · prólogo (la pintura), Actos I, II y III y epílogo. Un escenario fijo cuyo progreso lo marca el scroll (o un control con movimiento reducido).
 * Las medidas salen del contenedor, no de la ventana: funciona igual dentro de un iframe o de una plantilla ajena.
 */
export function EscenaV5() {
  const pista = useRef<HTMLDivElement>(null);
  const escenario = useRef<HTMLElement>(null);
  const ventana = useRef<HTMLDivElement>(null);
  const fig = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const mundo = useRef<Mundo | null>(null);
  const med = useRef<Medidas | null>(null);
  const progreso = useRef(0);
  const objetivo = useRef(0);
  const peekP = useRef<number | null>(null);
  const manualRef = useRef(false);
  /** Fin del prólogo y del Acto I en el progreso total */
  const limite = useRef({ e1: 0.15, e2: 0.35, e3: 0.6, e4: 0.85 });
  /** Reloj ambiental del reposo final (segundos) y petición de mostrar la pintura entera al llegar al inicio */
  const reloj = useRef(0);
  const peekAlLlegar = useRef(false);
  const suav = useRef({ raf: 0, t: 0, activo: false });
  const giro = useRef<Mando>({ cur: 0, tgt: 0 });
  const cabeceo = useRef<Mando>({ cur: 0, tgt: 0 });
  const tilt = useRef<Mando>({ cur: 0, tgt: 0 });
  const abre = useRef<Mando>({ cur: 0, tgt: 0 });
  /** Posición del plano del portal (Acto III): 0,5 = reposo */
  const plano = useRef<Mando>({ cur: 0.5, tgt: 0.5 });
  const arrastrable = useRef(false);
  const anim = useRef(0);
  const arrastre = useRef<{ id: number; x: number; y: number } | null>(null);
  const ultimoBorde = useRef("");

  const [tramo, setTramo] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [reposo, setReposo] = useState(false);
  /** El mando propio del tramo (inclinar / abrir / desplazar el plano) ya tiene un efecto comprensible */
  const [espec, setEspec] = useState(false);
  const giroIn = useRef<HTMLInputElement>(null);
  const [frag, setFrag] = useState(0);
  const [mando, setMando] = useState(false);
  const [manual, setManual] = useState(false);
  const [mirando, setMirando] = useState(false);
  const [sinLienzo, setSinLienzo] = useState(false);
  const [pManual, setPManual] = useState(0);
  const [giroUI, setGiroUI] = useState(0);
  const [tiltUI, setTiltUI] = useState(0);
  const [abreUI, setAbreUI] = useState(0);
  const [planoUI, setPlanoUI] = useState(0.5);

  const dibujar = useCallback((p: number) => {
    const m = med.current;
    const f = fig.current;
    const cv = lienzo.current;
    if (!m || !f) return;
    const { e1, e2, e3, e4 } = limite.current;
    const tr: 1 | 2 | 3 | 4 | 5 = p < e1 ? 1 : p < e2 ? 2 : p < e3 ? 3 : p < e4 ? 4 : 5;
    const local = tr === 1 ? p / e1 : tr === 2 ? (p - e1) / (e2 - e1) : tr === 3 ? (p - e2) / (e3 - e2) : tr === 4 ? (p - e3) / (e4 - e3) : (p - e4) / (1 - e4);
    let camX = 0, camY = 0, k = 1, opac = 1;
    const ctx = cv?.getContext("2d") ?? null;
    const cx = m.vx + m.vw / 2, cy = m.vy + m.vh / 2;
    if (tr === 1) {
      // El despertar (0–0.2) · La presencia (0.2–0.55) · El instrumento (0.58–1)
      const s0 = suave(local / 0.2);
      const s1 = suave((local - 0.2) / 0.3);
      const s2 = suave((local - 0.58) / 0.28);
      camX = mezcla(mezcla(0, FOCO_URIZEN.x, s1), FOCO_COMPAS.x, s2);
      camY = mezcla(mezcla(0, FOCO_URIZEN.y, s1), FOCO_COMPAS.y, s2);
      k = mezcla(mezcla(1 + 0.04 * s0, m.kU, s1), m.kC, s2);
      let v = 0.85 * (1 - s0);
      let tg = suave((local - 0.76) / 0.24);
      if (peekP.current !== null) { camX = 0; camY = 0; k = 1; v = 0; tg = 0; }
      if (ctx) pintarPrologo({ ctx, w: m.W, h: m.H, cx, cy, camX, camY, k, ancho: m.ancho, v, tg, rr: m.rr });
    } else {
      camX = FOCO_COMPAS.x; camY = FOCO_COMPAS.y; k = m.kC;
      // Acto I (a) y Acto II (b): el Acto II parte exactamente del estado final del Acto I
      const a = tr === 2 ? local : 1;
      const b = tr === 3 ? local : tr >= 4 ? 1 : 0;
      const c = tr === 4 ? local : tr === 5 ? 1 : 0;
      const d = tr === 5 ? local : 0;
      opac = 1 - suave(a / 0.2);
      if (ctx && mundo.current) {
        pintarActo(mundo.current, {
          ctx, w: m.W, h: m.H, cx, cy: m.W < 640 ? cy - m.vh * 0.16 * suave((a - 0.1) / 0.5) : cy, c0x: m.c0x, c0y: m.c0y, R: m.R, th0: m.th0, f: m.f, rr: m.rr,
          a, b, tilt: tilt.current.cur, giro: giro.current.cur, cabeceo: cabeceo.current.cur, abre: tr >= 3 ? abre.current.cur : 0,
          rx: tr === 3 ? Math.min(1, Math.abs(abre.current.tgt - abre.current.cur) * 4) : tr === 4 ? Math.min(1, Math.abs(plano.current.tgt - plano.current.cur) * 5) : 0,
          c, plano: plano.current.cur, d, t: reloj.current,
        });
      }
    }
    f.style.transform = `translate3d(${(-camX * k * m.ancho).toFixed(1)}px, ${(-camY * k * m.ancho).toFixed(1)}px, 0) scale(${k.toFixed(4)})`;
    f.style.opacity = opac.toFixed(3);
    const borde = `${(clamp((k - 1) / 0.8) * 4).toFixed(2)}%`;
    if (borde !== ultimoBorde.current) { ultimoBorde.current = borde; f.style.setProperty("--an-borde", borde); }

    setTramo(tr);
    const fr = FRAGMENTOS_V5.reduce((acc, fg, i) => (fg.tramo === tr && fg.desde <= local ? i : acc), FRAGMENTOS_V5.findIndex((fg) => fg.tramo === tr));
    setFrag(fr);
    const hayMando = (tr === 2 && local > 0.55) || tr >= 3;
    setEspec(tr === 3 ? local >= ESPECIFICO_DESDE[3] : tr === 4 ? local >= ESPECIFICO_DESDE[4] : true);
    arrastrable.current = (tr === 2 && local > 0.2) || tr >= 3;
    setMando(hayMando);
    setReposo(tr === 5 && local > 0.8);
    barra.current?.style.setProperty("--an-p", p.toFixed(4));
  }, []);

  const medir = useCallback(() => {
    const st = escenario.current, v = ventana.current, cv = lienzo.current, f = fig.current;
    if (!st || !v || !f) return;
    const W = st.clientWidth, H = st.clientHeight;
    const vw = v.clientWidth, vh = v.clientHeight;
    if (!W || !H || !vw || !vh) return;
    const vx = v.offsetLeft, vy = v.offsetTop;
    const ancho = Math.min(vw, vh / I.ratio);
    const span = Math.hypot(PUNTA_DER.x - CENTRO.x, PUNTA_DER.y - CENTRO.y);
    const kC = Math.min(1.9, (0.88 * vw) / (span * ancho));
    const kU = Math.min(1.75, (0.9 * vw) / (0.55 * ancho));
    const esc = kC * ancho;
    const xL = (CENTRO.x - FOCO_COMPAS.x) * esc, yL = (CENTRO.y - FOCO_COMPAS.y) * esc;
    const xR = (PUNTA_DER.x - FOCO_COMPAS.x) * esc, yR = (PUNTA_DER.y - FOCO_COMPAS.y) * esc;
    const R = Math.hypot(xR - xL, yR - yL);
    const movil = W < 640 || (navigator.hardwareConcurrency ?? 4) <= 2;
    const dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
    med.current = { W, H, vx, vy, vw, vh, ancho, kU, kC, dpr, R, th0: Math.atan2(yR - yL, xR - xL), c0x: xL, c0y: yL, f: 1.5 * R, rr: Math.max(16, esc * 0.05) };
    f.style.width = `${ancho}px`;
    f.style.height = `${ancho * I.ratio}px`;
    if (cv) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const ctx = cv.getContext("2d");
      if (!ctx) { setSinLienzo(true); return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const denso = !movil;
    if (!mundo.current || mundo.current.denso !== denso) mundo.current = crearMundo(denso);
    const dur = W < 640 ? DURACION_V5.movil : DURACION_V5.escritorio;
    const total = dur[0] + dur[1] + dur[2] + dur[3] + dur[4];
    limite.current = { e1: dur[0] / total, e2: (dur[0] + dur[1]) / total, e3: (dur[0] + dur[1] + dur[2]) / total, e4: (dur[0] + dur[1] + dur[2] + dur[3]) / total };
    pista.current?.style.setProperty("--v5-pant", String(total + 1));
    dibujar(progreso.current);
  }, [dibujar]);

  /** Mantiene vivo el bucle solo mientras algún valor no haya alcanzado su objetivo. */
  const animar = useCallback(function tick() {
    let activo = false;
    for (const mnd of [giro.current, cabeceo.current, tilt.current, abre.current, plano.current]) {
      const d = mnd.tgt - mnd.cur;
      // Con movimiento reducido el cambio es discreto: no hay transición intermedia
      if (!manualRef.current && Math.abs(d) > 0.002) { mnd.cur += d * 0.2; activo = true; } else mnd.cur = mnd.tgt;
    }
    dibujar(progreso.current);
    anim.current = activo ? requestAnimationFrame(tick) : 0;
  }, [dibujar]);
  const pedirAnim = useCallback(() => { if (!anim.current) anim.current = requestAnimationFrame(animar); }, [animar]);

  /** Interpolación del progreso pintado hacia el que marca el scroll, solo con rueda de ratón. */
  const avanzar = useCallback(function tick(ahora: number) {
    const sv = suav.current;
    const dt = Math.min(64, Math.max(0, ahora - sv.t));
    sv.t = ahora;
    const d = objetivo.current - progreso.current;
    if (Math.abs(d) < 0.0002) {
      sv.raf = 0;
      progreso.current = objetivo.current;
      dibujar(progreso.current);
      return;
    }
    progreso.current += d * (1 - Math.exp(-dt / 70));
    dibujar(progreso.current);
    sv.raf = requestAnimationFrame(tick);
  }, [dibujar]);

  const leer = useCallback(() => {
    const t = pista.current;
    if (!t || manualRef.current) return;
    const r = t.getBoundingClientRect();
    const vh = escenario.current?.clientHeight ?? window.innerHeight;
    const dist = Math.max(1, r.height - vh);
    const p = clamp(-r.top / dist);
    if (peekP.current !== null && Math.abs(p - peekP.current) > 0.003) { peekP.current = null; setMirando(false); }
    if (peekAlLlegar.current && p < 0.001) { peekAlLlegar.current = false; peekP.current = p; setMirando(true); }
    objetivo.current = p;
    const sv = suav.current;
    if (!sv.activo) {
      if (p === progreso.current) return;
      progreso.current = p;
      dibujar(p);
      return;
    }
    if (!sv.raf && p !== progreso.current) { sv.t = performance.now(); sv.raf = requestAnimationFrame(avanzar); }
  }, [dibujar, avanzar]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplicar = () => { manualRef.current = mq.matches; setManual(mq.matches); };
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sv = suav.current;
    const aplicar = () => {
      sv.activo = mq.matches && !manualRef.current;
      if (!sv.activo) { cancelAnimationFrame(sv.raf); sv.raf = 0; }
    };
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => { mq.removeEventListener("change", aplicar); cancelAnimationFrame(sv.raf); sv.raf = 0; };
  }, [manual]);

  useEffect(() => {
    medir();
    const st = escenario.current, t = pista.current;
    if (!st || !t) return;
    let raf = 0;
    let visible = true;
    const pedir = () => { if (!raf && visible) raf = requestAnimationFrame(() => { raf = 0; leer(); }); };
    const ro = new ResizeObserver(() => { medir(); pedir(); });
    ro.observe(st);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pedir(); }, { rootMargin: "20% 0px" });
    io.observe(t);
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    pedir();
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(anim.current);
      anim.current = 0;
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, [medir, leer, manual]);

  /* Reposo final del epílogo: un movimiento ambiental muy lento (10 fotogramas por segundo; 8 en móvil), solo mientras la escena es visible y hasta 90 s sin interacción */
  useEffect(() => {
    const st = escenario.current;
    if (!reposo || manual || !st) return;
    let raf = 0, ultimo = 0, visible = true;
    const intervalo = mundo.current?.denso === false ? 125 : 100;
    let hasta = performance.now() + 90000;
    const t0 = performance.now() - reloj.current * 1000;
    function paso(ahora: number) {
      raf = 0;
      if (!visible || document.hidden || ahora > hasta) return;
      if (ahora - ultimo >= intervalo) { ultimo = ahora; reloj.current = (ahora - t0) / 1000; dibujar(progreso.current); }
      raf = requestAnimationFrame(paso);
    }
    const arrancar = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(paso); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; arrancar(); });
    io.observe(st);
    const despertar = () => { hasta = performance.now() + 90000; arrancar(); };
    document.addEventListener("visibilitychange", arrancar);
    st.addEventListener("pointerdown", despertar);
    st.addEventListener("keydown", despertar);
    arrancar();
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", arrancar); st.removeEventListener("pointerdown", despertar); st.removeEventListener("keydown", despertar); };
  }, [reposo, manual, dibujar]);

  useEffect(() => {
    if (manual) { progreso.current = pManual; objetivo.current = pManual; dibujar(pManual); }
  }, [manual, pManual, dibujar]);

  /* ── Mandos del visitante: sliders nativos y arrastre sobre el lienzo ── */
  const cambiarGiro = (v: number) => { giro.current.tgt = clamp(v, -1, 1); setGiroUI(giro.current.tgt); pedirAnim(); };
  const cambiarTilt = (v: number) => { tilt.current.tgt = clamp(v, 0, 1); setTiltUI(tilt.current.tgt); pedirAnim(); };
  const cambiarPlano = (v: number) => { plano.current.tgt = clamp(v, 0, 1); setPlanoUI(plano.current.tgt); pedirAnim(); };
  const cambiarAbre = (v: number) => { abre.current.tgt = clamp(v, 0, 1); setAbreUI(abre.current.tgt); pedirAnim(); };
  const restablecer = () => {
    giro.current.tgt = 0; cabeceo.current.tgt = 0; tilt.current.tgt = 0; abre.current.tgt = 0; plano.current.tgt = 0.5;
    setGiroUI(0); setTiltUI(0); setAbreUI(0); setPlanoUI(0.5);
    pedirAnim();
  };
  const alBajar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!arrastrable.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    arrastre.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const alMover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId) return;
    const dx = e.clientX - a.x, dy = e.clientY - a.y;
    a.x = e.clientX; a.y = e.clientY;
    cambiarGiro(giro.current.tgt + dx * 0.006);
    if (e.pointerType === "mouse") cabeceo.current.tgt = clamp(cabeceo.current.tgt + dy * 0.006, -1, 1);
    pedirAnim();
  };
  const alSoltar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (arrastre.current?.id === e.pointerId) {
      arrastre.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const ir = (p: number) => {
    if (manualRef.current) { setPManual(clamp(p)); return; }
    const t = pista.current;
    if (!t) return;
    const vh = escenario.current?.clientHeight ?? window.innerHeight;
    const dist = t.offsetHeight - vh;
    const y = t.getBoundingClientRect().top + window.scrollY + p * dist + 1;
    window.scrollTo({ top: y, behavior: "smooth" });
  };
  const inicio = (n: 1 | 2 | 3 | 4 | 5) => {
    const { e1, e2, e3, e4 } = limite.current;
    if (manualRef.current) return n === 1 ? 0 : n === 2 ? e1 + (e2 - e1) * 0.85 : n === 3 ? e2 + (e3 - e2) * 0.7 : n === 4 ? e3 + (e4 - e3) * 0.75 : e4 + (1 - e4) * 0.8;
    return n === 1 ? 0 : n === 2 ? e1 : n === 3 ? e2 : n === 4 ? e3 : e4;
  };
  /** Vuelve al inicio y deja la pintura entera a la vista (sin acercamientos) */
  const verPintura = () => {
    if (manualRef.current) { peekP.current = 0; setMirando(true); setPManual(0); return; }
    peekAlLlegar.current = true;
    window.setTimeout(() => { peekAlLlegar.current = false; }, 6000);
    ir(0);
  };
  const alternarMirar = () => {
    if (peekP.current !== null) { peekP.current = null; setMirando(false); }
    else { peekP.current = objetivo.current; setMirando(true); }
    dibujar(progreso.current);
  };

  /* Si el mando propio deja de estar disponible mientras tiene el foco (p. ej. al retroceder), el foco pasa a «Girar la vista» */
  useEffect(() => {
    if (!espec && document.activeElement?.closest("[data-esp]")) giroIn.current?.focus();
  }, [espec]);

  const f = FRAGMENTOS_V5[frag];
  const ocultoEsp = espec ? undefined : "v5-oculto";
  const final = frag === FRAGMENTOS_V5.length - 1;

  return (
    <div ref={pista} className={`v5-pista${manual ? " v5-pista--manual" : ""}`} style={{ ["--v5-pant" as string]: 9.2 }}>
      <section ref={escenario} className="v5-escenario" data-tramo={tramo} data-mando={mando} aria-label="El anciano de los días, recorrido interactivo">
        <div className="v5-fondo" aria-hidden="true" />
        <div ref={ventana} className="v5-ventana">
          <div ref={fig} className={`an-fig v5-fig${mirando ? " an-fig--mirando" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rutaPublica(`${I.base}-${I.anchos[1]}.webp`)}
              srcSet={I.anchos.map((a) => `${rutaPublica(`${I.base}-${a}.webp`)} ${a}w`).join(", ")}
              sizes="(min-width: 48rem) 80vw, 160vw"
              width={I.width}
              height={I.height}
              alt={I.alt}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </div>
        <canvas
          ref={lienzo}
          className={`v5-lienzo${mando ? " v5-lienzo--mover" : ""}`}
          aria-hidden="true"
          hidden={sinLienzo}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
        />
        <div className="v5-velo" aria-hidden="true" />

        <div className="v5-texto">
          <p className="an-kicker">{TRAMOS_V5[tramo - 1].kicker} · {f.momento}</p>
          {tramo === 1 ? <h1 className="an-titulo">El anciano de los días</h1> : <h2 className="an-titulo an-titulo--escena">{TRAMOS_V5[tramo - 1].titulo}</h2>}
          {tramo === 1 && frag === 0 && <p className="an-autor">William Blake · 1794 · The Ancient of Days</p>}
          <div className="an-fragmento" key={frag}>
            <p className={`an-etiqueta an-etiqueta--${f.tipo}`}>{f.etiqueta}</p>
            <p className="an-principal">{f.texto}</p>
            {f.ayuda && <p className="an-ayuda">{f.ayuda}</p>}
          </div>
          <details className="an-mas">
            <summary>Comprender lo que estoy viendo</summary>
            <div className="an-mas__cuerpo">
              <h3 className="an-etiqueta an-etiqueta--doc">Documentado</h3>
              {AMPLIADO_V5[tramo].documentado.map((t) => <p key={t}>{t}</p>)}
              <h3 className="an-etiqueta an-etiqueta--int">Interpretación</h3>
              {AMPLIADO_V5[tramo].interpretacion.map((t) => <p key={t}>{t}</p>)}
            </div>
          </details>
          {tramo === 1 && (frag > 0 || mirando) && (
            <button type="button" className="an-btn" aria-pressed={mirando} onClick={alternarMirar}>
              {mirando ? "Volver al recorrido" : "Ver la pintura completa"}
            </button>
          )}
          {final && (
            <div className="an-fin an-fin--epilogo">
              <button type="button" className="an-btn" onClick={verPintura}><span className="v5-corto">La pintura</span><span className="v5-largo">Volver a la pintura</span></button>
              <button type="button" className="an-btn" onClick={() => ir(0)}><span className="v5-corto">Repetir</span><span className="v5-largo">Repetir la experiencia</span></button>
              <Link href="/conceptos" className="an-btn an-btn--solido"><span className="v5-corto">Catálogo</span><span className="v5-largo">Ir al catálogo</span></Link>
            </div>
          )}
        </div>

        {mando && (
          <div className="v5-mando" role="group" aria-label="Explorar la estructura">
          {tramo === 5 ? null : tramo === 4 ? (
            <label data-esp className={ocultoEsp} aria-hidden={!espec || undefined}>
              <span>Desplazar el plano</span>
              <input type="range" min={0} max={100} step={1} value={Math.round(planoUI * 100)} onChange={(e) => cambiarPlano(Number(e.target.value) / 100)} aria-valuetext={`plano al ${Math.round(planoUI * 100)} por ciento de su recorrido`} />
            </label>
          ) : tramo === 3 ? (
            <label data-esp className={ocultoEsp} aria-hidden={!espec || undefined}>
              <span>Abrir la arquitectura</span>
              <input type="range" min={0} max={100} step={1} value={Math.round(abreUI * 100)} onChange={(e) => cambiarAbre(Number(e.target.value) / 100)} aria-valuetext={`${Math.round(abreUI * 100)} por ciento abierta`} />
            </label>
          ) : (
            <label>
              <span>Inclinar los anillos</span>
              <input type="range" min={0} max={100} step={1} value={Math.round(tiltUI * 100)} onChange={(e) => cambiarTilt(Number(e.target.value) / 100)} aria-valuetext={`${Math.round(tiltUI * 100)} por ciento`} />
            </label>
          )}
          <label>
            <span>Girar la vista</span>
            <input ref={giroIn} type="range" min={-100} max={100} step={1} value={Math.round(giroUI * 100)} onChange={(e) => cambiarGiro(Number(e.target.value) / 100)} aria-valuetext={`${Math.round(giroUI * 100)} por ciento`} />
          </label>
          <div className="v5-mando__botones">
            {tramo === 3 && (
              <button type="button" data-esp className={`an-btn${espec ? "" : " v5-oculto"}`} aria-hidden={!espec || undefined} onClick={() => cambiarAbre(abreUI > 0.5 ? 0 : 1)}>{abreUI > 0.5 ? "Cerrar" : "Abrir"}</button>
            )}
            {tramo === 4 && (
              <button type="button" data-esp className={`an-btn${espec ? "" : " v5-oculto"}`} aria-hidden={!espec || undefined} onClick={() => cambiarPlano(Math.abs(planoUI - 0.5) < 0.25 ? 1 : 0.5)}>{Math.abs(planoUI - 0.5) < 0.25 ? "Desplazar" : "Volver"}</button>
            )}
            <button type="button" className="an-btn" onClick={restablecer}>{tramo === 5 ? <><span className="v5-corto">Restablecer</span><span className="v5-largo">Restablecer la vista</span></> : "Restablecer la vista"}</button>
          </div>
          <p className="v5-pista-texto">{tramo === 5 ? "Gira la vista: las piezas se alinean y se separan. También puedes arrastrar sobre la escena." : "También puedes arrastrar sobre la escena."}</p>
        </div>
        )}

        <div className="an-pie v5-pie">
          <span ref={barra} className="an-barra" aria-hidden="true" />
          <nav className="an-nav" aria-label="Tramos">
            {TRAMOS_V5.map((t) => (
              <button key={t.n} type="button" aria-current={tramo === t.n ? "step" : undefined} onClick={() => ir(inicio(t.n))}>
                <span aria-hidden="true">{String(t.n).padStart(2, "0")}</span>
                <span className="an-nav__t">{t.kicker}</span>
              </button>
            ))}
          </nav>
          {manual && (
            <label className="an-manual">
              <span>Progreso de la secuencia</span>
              <input type="range" min={0} max={1000} value={Math.round(pManual * 1000)} onChange={(e) => setPManual(Number(e.target.value) / 1000)} />
            </label>
          )}
          {!manual && tramo === 1 && frag === 0 && <p className="an-guia" aria-hidden="true">Desplaza para acercarte</p>}
        </div>
        <p className="sr-only" role="status">{`${TRAMOS_V5[tramo - 1].kicker}: ${TRAMOS_V5[tramo - 1].titulo}`}</p>
      </section>
    </div>
  );
}
