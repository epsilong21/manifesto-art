"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ANCIANO_IMG as I } from "@/content/anciano";
import { rutaPublica } from "@/lib/rutaPublica";
import { AMPLIADO_V5, DURACION_V5, ESPECIFICO_DESDE, FRAGMENTOS_V5, PRESENTACION_V5, TRAMOS_V5 } from "@/content/anciano-v5";
import { controlesEn, crearGuion, etapas, pEn, tEn, trLocal, type Controles, type Guion } from "./presentacion";
import { CENTRO, FOCO_COMPAS, FOCO_URIZEN, clamp, mezcla, suave } from "../limiteGeom";
import { PUNTA_DER, crearMundo, hayLuzViajera, pintarActo, pintarPrologo, soltarCapa, type Mundo } from "./mundo3d";


type Medidas = {
  W: number; H: number;
  vx: number; vy: number; vw: number; vh: number;
  ancho: number; kU: number; kC: number; dpr: number;
  R: number; th0: number; c0x: number; c0y: number; f: number; rr: number;
  /** Encuadre: desplazamiento vertical del centro (fracción del alto de la ventana, solo móvil), zoom y fracción libre del epílogo (cine móvil) */
  desp: number; zoom: number; libre: number;
};

/** Valores que el visitante modifica; cada uno tiene un objetivo (lo que pide) y un valor pintado (que lo sigue sin saltos). */
type Mando = { cur: number; tgt: number };

/** Separación mínima entre dos fotogramas pintados por el scroll, un arrastre o la presentación (ms): en pantallas de 120 Hz o más se pinta cada dos refrescos (≈60 fps). El resto de la página sigue a la frecuencia de la pantalla. */
const MIN_DIB = 9;
/** Encuadre del cine en móvil vertical: zoom de cámara y fracción libre del epílogo (se ajustan mirando cada tramo) */
const ZOOM_CINE = 1;
/** Zoom de la exploración en móvil vertical (anchos < 640 px): la estructura gana presencia sin cortar el punto de interés */
const ZOOM_EXPL = 1.15;
const LIBRE_CINE = 0.7;
/** En tabletas verticales (≥ 480 px) el epílogo se encuadra más holgado para no cortar el portal ni los brazos del compás */
const LIBRE_CINE_ANCHO = 0.56;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

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
  /** Instante del último fotograma pintado por el scroll, un arrastre o la presentación (el reposo ambiental no repinta si acaba de haber uno) */
  const ultimoDib = useRef(0);
  const reenc = useRef(0);
  const ultimoCine = useRef("");
  /** Instante del último avance del reloj ambiental (0 = parado): el reloj corre con el tiempo real mientras se pinta el tramo final del epílogo, con cualquier bucle */
  const relojMarca = useRef(0);
  const presDeuda = useRef(0);
  const presTimer = useRef(0);

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

  /* ── Modo presentación: reloj propio que escribe el progreso (única fuente de verdad) y la coreografía de los mandos ── */
  type EstadoPres = "inactivo" | "reproduciendo" | "pausado" | "finalizado";
  const [pres, setPres] = useState<EstadoPres>("inactivo");
  const presRef = useRef<EstadoPres>("inactivo");
  const [vel, setVel] = useState(1);
  const velRef = useRef(1);
  const [pasos, setPasos] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const [aviso, setAviso] = useState("");
  /** El visitante ya está dentro de una modalidad (explorando): no se le vuelve a pedir que elija */
  const [explorando, setExplorando] = useState(false);
  const presTr = useRef<HTMLSpanElement>(null);
  const presRest = useRef<HTMLSpanElement>(null);
  const guion = useRef<Guion | null>(null);
  const presT = useRef(0);
  const presUlt = useRef(0);
  const presRaf = useRef(0);
  const presY = useRef(0);
  const presP = useRef(-1);
  const presDib = useRef(0);
  const presGeo = useRef({ y0: 0, dist: 1 });
  const presFase = useRef<{ t: number; desde: Controles }>({ t: 0, desde: { giro: 0, tilt: 0, abre: 0, plano: 0.5 } });
  const uiPres = useRef<Controles>({ giro: 0, tilt: 0, abre: 0, plano: 0.5 });
  const presBarra = useRef<HTMLSpanElement>(null);
  const presSeg = useRef(-1);
  const enfocar = useRef<"play" | "nav" | "fin" | null>(null);
  const cabAlto = useRef(0);
  const presUiT = useRef(0);
  const presScrollT = useRef(0);
  const playBtn = useRef<HTMLButtonElement>(null);

  const dibujar = useCallback((p: number, amb = false, lenta = false) => {
    const m = med.current;
    const f = fig.current;
    const cv = lienzo.current;
    if (!m || !f) return;
    const { e1, e2, e3, e4 } = limite.current;
    const tr: 1 | 2 | 3 | 4 | 5 = p < e1 ? 1 : p < e2 ? 2 : p < e3 ? 3 : p < e4 ? 4 : 5;
    const ahoraDib = performance.now();
    if (!amb) ultimoDib.current = ahoraDib;
    const local = tr === 1 ? p / e1 : tr === 2 ? (p - e1) / (e2 - e1) : tr === 3 ? (p - e2) / (e3 - e2) : tr === 4 ? (p - e3) / (e4 - e3) : (p - e4) / (1 - e4);
    // Política de los ajustes del visitante: se conservan, pero solo rigen donde sus mandos están disponibles
    // (giro, cabeceo e inclinación desde ~55 % del Acto I; abrir la arquitectura desde ~50 % del Acto II). Fuera de ahí su
    // efecto se desvanece con el scroll (sin saltos) y el prólogo restaura todo: así retroceder recupera la composición diseñada.
    const vig = tr === 2 ? suave((local - 0.35) / 0.2) : tr >= 3 ? 1 : 0;
    const vigAbre = tr === 3 ? suave((local - 0.35) / 0.15) : tr >= 4 ? 1 : 0;
    if (tr === 1 && (giro.current.tgt || cabeceo.current.tgt || tilt.current.tgt || abre.current.tgt || plano.current.tgt !== 0.5)) {
      for (const mnd of [giro.current, cabeceo.current, tilt.current, abre.current]) { mnd.cur = 0; mnd.tgt = 0; }
      plano.current.cur = 0.5; plano.current.tgt = 0.5;
      setGiroUI(0); setTiltUI(0); setAbreUI(0); setPlanoUI(0.5);
    }
    // Reloj ambiental (luces que viajan, velos que respiran): avanza con el tiempo real cada vez que se pinta el tramo final del epílogo (desde que asoman las luces), sea cual sea el bucle
    // (reposo, scroll, arrastre o presentación). Un salto tras una pausa se acota a 0,5 s; los bucles lo ponen a 0 al pararse.
    if (tr === 5 && local > 0.6) {
      if (relojMarca.current) reloj.current += Math.min(0.5, Math.max(0, (ahoraDib - relojMarca.current) / 1000));
      relojMarca.current = ahoraDib;
    } else relojMarca.current = 0;
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
          ctx, w: m.W, h: m.H, cx, cy: m.W < 640 ? cy - m.vh * m.desp * suave((a - 0.1) / 0.5) : cy, c0x: m.c0x, c0y: m.c0y, R: m.R, th0: m.th0, f: m.f, rr: m.rr,
          a, b, tilt: tilt.current.cur * vig, giro: giro.current.cur * vig, cabeceo: cabeceo.current.cur * vig, abre: abre.current.cur * vigAbre,
          rx: tr === 3 ? Math.min(1, Math.abs(abre.current.tgt - abre.current.cur) * 4) : tr === 4 ? Math.min(1, Math.abs(plano.current.tgt - plano.current.cur) * 5) : 0,
          c, plano: plano.current.cur, d, t: reloj.current, amb: amb && tr === 5, lenta, zoom: m.zoom, libre: m.libre,
        });
      }
    }
    // Reposo ambiental: solo cambia el lienzo; el resto de la escena (cámara, textos, mandos) ya está como corresponde
    if (amb && tr === 5) return;
    f.style.transform = `translate3d(${(-camX * k * m.ancho).toFixed(1)}px, ${(-camY * k * m.ancho).toFixed(1)}px, 0) scale(${k.toFixed(4)})`;
    f.style.opacity = opac.toFixed(3);
    const borde = `${(clamp((k - 1) / 0.8) * 4).toFixed(2)}%`;
    if (borde !== ultimoBorde.current) { ultimoBorde.current = borde; f.style.setProperty("--an-borde", borde); }

    setTramo(tr);
    const fr = FRAGMENTOS_V5.reduce((acc, fg, i) => (fg.tramo === tr && fg.desde <= local ? i : acc), FRAGMENTOS_V5.findIndex((fg) => fg.tramo === tr));
    setFrag(fr);
    const hayMando = (tr === 2 && local > 0.55) || tr >= 3;
    setEspec(tr === 3 ? local >= ESPECIFICO_DESDE[3] : tr === 4 ? local >= ESPECIFICO_DESDE[4] : true);
    arrastrable.current = (tr === 2 && local > 0.45) || tr >= 3;
    setMando(hayMando);
    setReposo(tr === 5 && local > 0.8);
    barra.current?.style.setProperty("--an-p", p.toFixed(4));
    // Título cinematográfico: aparece al comenzar cada tramo y se retira antes de su mitad (no se queda sobre la geometría)
    const cineO = (suave(local / 0.1) * (1 - suave((local - 0.45) / 0.2))).toFixed(3);
    if (cineO !== ultimoCine.current) { ultimoCine.current = cineO; escenario.current?.style.setProperty("--cine-o", cineO); }
  }, []);

  /* La cabecera del sitio se superpone al comienzo de la escena: el reproductor se coloca justo debajo de su parte visible */
  const actualizarCab = useCallback(() => {
    escenario.current?.style.setProperty("--v5-cab-vis", `${Math.max(0, cabAlto.current - window.scrollY).toFixed(0)}px`);
  }, []);

  const medir = useCallback(() => {
    const st = escenario.current, v = ventana.current, cv = lienzo.current, f = fig.current;
    if (!st || !v || !f) return;
    cabAlto.current = document.querySelector<HTMLElement>(".an-cab")?.offsetHeight ?? 0;
    actualizarCab();
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
    // Encuadre propio del cine en pantalla vertical (sin texto ni mandos): la escena ocupa todo el espacio útil, centrada, y el compás del epílogo crece hasta llenarlo
    const cineV = st.dataset.modo === "cine" && W < 896 && H > 512;
    const nuevo: Medidas = { W, H, vx, vy, vw, vh, ancho, kU, kC, dpr, R, th0: Math.atan2(yR - yL, xR - xL), c0x: xL, c0y: yL, f: 1.5 * R, rr: Math.max(16, esc * 0.05), desp: cineV ? 0 : 0.16, zoom: cineV ? ZOOM_CINE : W < 640 ? ZOOM_EXPL : 1, libre: cineV ? (W < 480 ? LIBRE_CINE : LIBRE_CINE_ANCHO) : 0 };
    const previa = med.current;
    // Si solo cambió el encuadre (p. ej. al pasar de cine a exploración) la cámara se reencuadra con suavidad en lugar de saltar
    const reencuadre = !!previa && !manualRef.current && previa.W === W && previa.H === H && previa.dpr === dpr && (previa.vh !== vh || previa.vy !== vy || previa.desp !== nuevo.desp || previa.zoom !== nuevo.zoom || previa.libre !== nuevo.libre);
    cancelAnimationFrame(reenc.current); reenc.current = 0;
    const poner = (mm: Medidas) => { med.current = mm; f.style.width = `${mm.ancho}px`; f.style.height = `${mm.ancho * I.ratio}px`; };
    if (reencuadre && previa) {
      const t0 = performance.now();
      const paso = (ahora: number) => {
        const k = suave((ahora - t0) / 450);
        const mm = { ...nuevo } as Medidas;
        for (const c of Object.keys(nuevo) as (keyof Medidas)[]) mm[c] = mezcla(previa[c], nuevo[c], k);
        poner(mm); dibujar(progreso.current);
        if (k < 1) reenc.current = requestAnimationFrame(paso); else { reenc.current = 0; poner(nuevo); dibujar(progreso.current); }
      };
      poner(previa);
      reenc.current = requestAnimationFrame(paso);
    } else poner(nuevo);
    if (cv) {
      // Reasignar el tamaño reserva de nuevo la memoria del lienzo y lo vacía: solo cuando realmente cambia
      const cw = Math.round(W * dpr), ch = Math.round(H * dpr);
      if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
      const ctx = cv.getContext("2d");
      if (!ctx) { setSinLienzo(true); return; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const denso = !movil;
    if (!mundo.current || mundo.current.denso !== denso) { soltarCapa(mundo.current); mundo.current = crearMundo(denso); }
    const dur = W < 640 ? DURACION_V5.movil : DURACION_V5.escritorio;
    const total = dur[0] + dur[1] + dur[2] + dur[3] + dur[4];
    limite.current = { e1: dur[0] / total, e2: (dur[0] + dur[1]) / total, e3: (dur[0] + dur[1] + dur[2]) / total, e4: (dur[0] + dur[1] + dur[2] + dur[3]) / total };
    pista.current?.style.setProperty("--v5-pant", String(total + 1));
    guion.current = crearGuion();
    dibujar(progreso.current);
  }, [dibujar, actualizarCab]);

  /** Mantiene vivo el bucle solo mientras algún valor no haya alcanzado su objetivo. */
  const animar = useCallback(function tick(ahora?: number) {
    // En pantallas de alta frecuencia no se repinta en cada refresco
    if (ahora !== undefined && ahora - ultimoDib.current < MIN_DIB && ahora >= ultimoDib.current - 20) { anim.current = requestAnimationFrame(tick); return; }
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
    if (ahora - ultimoDib.current < MIN_DIB && ahora >= ultimoDib.current - 20) { sv.raf = requestAnimationFrame(tick); return; }
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

  /** Lee el scroll y pinta si el progreso cambió. Devuelve true si hay un cambio pendiente que no se pudo pintar todavía (por el tope de fotogramas). */
  const leer = useCallback((permitir = true): boolean => {
    const t = pista.current;
    if (!t || manualRef.current || presRef.current === "reproduciendo") return false;
    const r = t.getBoundingClientRect();
    const vh = escenario.current?.clientHeight ?? window.innerHeight;
    const dist = Math.max(1, r.height - vh);
    const p = clamp(-r.top / dist);
    if (peekP.current !== null && Math.abs(p - peekP.current) > 0.003) { peekP.current = null; setMirando(false); }
    if (peekAlLlegar.current && p < 0.001) { peekAlLlegar.current = false; peekP.current = p; setMirando(true); }
    objetivo.current = p;
    const sv = suav.current;
    if (!sv.activo) {
      if (p === progreso.current) return false;
      if (!permitir) return true;
      progreso.current = p;
      dibujar(p);
      return false;
    }
    if (!sv.raf && p !== progreso.current) { sv.t = performance.now(); sv.raf = requestAnimationFrame(avanzar); }
    return false;
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
    // Si hay un cambio de scroll pendiente pero acaba de pintarse otro fotograma, se espera al siguiente refresco (tope de ≈60 fps); sin cambio pendiente no se reencola nada
    const pedir = () => { if (!raf && visible) raf = requestAnimationFrame((ts) => { raf = 0; if (leer(!(ts - ultimoDib.current < MIN_DIB && ts >= ultimoDib.current - 20))) pedir(); }); };
    const ro = new ResizeObserver(() => { medir(); pedir(); });
    ro.observe(st);
    if (ventana.current) ro.observe(ventana.current);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pedir(); }, { rootMargin: "20% 0px" });
    io.observe(t);
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("scroll", actualizarCab, { passive: true });
    window.addEventListener("resize", pedir, { passive: true });
    pedir();
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(anim.current);
      anim.current = 0;
      ro.disconnect();
      cancelAnimationFrame(reenc.current); reenc.current = 0;
      io.disconnect();
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("scroll", actualizarCab);
      window.removeEventListener("resize", pedir);
    };
  }, [medir, leer, manual, actualizarCab]);

  /* Reposo final del epílogo, hasta 90 s sin interacción y solo mientras la escena es visible. Dos ritmos:
     · lento (≈8 Hz en móvil, 10 Hz en escritorio): velos, rayos y halos que respiran, cuyo cambio entre fotogramas es imperceptible;
     · vivo (≈60 fps): mientras una luz recorre una línea (la del brazo, las de los anillos, el pulso del círculo) se repinta cada fotograma con el reloj real,
       porque a 8–10 fps esos puntos saltan. Sin ninguna luz viajera se vuelve al ritmo lento. Si el dispositivo no sostiene ~36 fps, baja a 30 fps.
     Cada fotograma se planifica con un temporizador y un único requestAnimationFrame (no un rAF en bucle). El reloj ambiental vive en dibujar() y se
     detiene al parar el bucle, de modo que tras ocultar la pestaña continúa donde estaba, sin saltos. */
  useEffect(() => {
    const st = escenario.current;
    if (!reposo || manual || !st) return;
    const lentoCada = mundo.current?.denso === false ? 125 : 100;
    let marcoMs = 12, timer = 0, raf = 0, visible = true, ultLento = 0, ultPintado = 0, media = 0, muestras = 0, modoViva = false, bajoDesde = 0;
    let hasta = performance.now() + 90000;
    const parar = () => { clearTimeout(timer); timer = 0; cancelAnimationFrame(raf); raf = 0; relojMarca.current = 0; ultPintado = 0; modoViva = false; };
    const programar = (espera: number) => { timer = window.setTimeout(() => { timer = 0; raf = requestAnimationFrame(pintar); }, Math.max(0, espera)); };
    function pintar(ahora: number) {
      raf = 0;
      if (!visible || document.hidden || ahora > hasta) { relojMarca.current = 0; ultPintado = 0; modoViva = false; return; }
      // Ritmo vivo: se sigue el refresco de la pantalla y se pinta cada ≥12 ms (60 fps a 60/120 Hz, 72 a 144 Hz); los refrescos intermedios no hacen nada
      // Tras 20 s a 30 fps se vuelve a probar el ritmo pleno (un pico puntual no debe dejar el reposo a medio ritmo para siempre)
      if (marcoMs > 12 && ahora - bajoDesde > 20000) { marcoMs = 12; muestras = 0; }
      if (modoViva && ahora - ultPintado < marcoMs) { raf = requestAnimationFrame(pintar); return; }
      const lenta = ahora - ultLento >= lentoCada;
      if (lenta) ultLento = ahora;
      // Si el scroll, un arrastre o la presentación han pintado en los últimos 100 ms, este fotograma sobra (esos bucles ya llevan las luces con el reloj real,
      // y un fotograma de reposo intercalado invalidaría la caché en cada cambio de cámara)
      const dibuja = presRef.current !== "reproduciendo" && ahora - ultimoDib.current >= 100;
      if (dibuja) dibujar(progreso.current, true, lenta);
      const viva = dibuja && hayLuzViajera();
      // Vigilancia del ritmo real: si el intervalo medio entre fotogramas vivos supera ~28 ms, se pasa a 30 fps
      if (viva && ultPintado) { const dlt = ahora - ultPintado; if (dlt < 500) { media = muestras ? media * 0.9 + dlt * 0.1 : dlt; if (++muestras > 45 && media > 28 && marcoMs < 29) { marcoMs = 29; bajoDesde = ahora; } } }
      ultPintado = dibuja ? ahora : 0;
      modoViva = viva;
      if (viva) raf = requestAnimationFrame(pintar);
      else programar(lentoCada - (performance.now() - ahora) - 4);
    }
    const arrancar = () => { if (timer || raf || !visible || document.hidden) return; raf = requestAnimationFrame(pintar); };
    const alVisibilidad = () => { if (document.hidden) parar(); else arrancar(); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) arrancar(); else parar(); });
    io.observe(st);
    const despertar = () => { hasta = performance.now() + 90000; arrancar(); };
    document.addEventListener("visibilitychange", alVisibilidad);
    st.addEventListener("pointerdown", despertar);
    st.addEventListener("keydown", despertar);
    arrancar();
    return () => { parar(); io.disconnect(); document.removeEventListener("visibilitychange", alVisibilidad); st.removeEventListener("pointerdown", despertar); st.removeEventListener("keydown", despertar); soltarCapa(mundo.current); };
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

  /* ── Modo presentación ── */
  const geoScroll = useCallback(() => {
    const t = pista.current;
    if (!t) return;
    const vh = escenario.current?.clientHeight ?? window.innerHeight;
    presGeo.current = { y0: t.getBoundingClientRect().top + window.scrollY, dist: Math.max(1, t.offsetHeight - vh) };
  }, []);
  const cambiarPres = useCallback((e: EstadoPres) => { presRef.current = e; setPres(e); }, []);
  const cancelarPres = useCallback(() => { cancelAnimationFrame(presRaf.current); presRaf.current = 0; clearTimeout(presTimer.current); presTimer.current = 0; }, []);
  /** Fija los mandos a los valores de la coreografía (los sliders visibles muestran siempre el valor real). Devuelve si algo cambió. */
  const aplicarControles = useCallback((c: Controles, ui = true) => {
    let cambio = false;
    const fijar = (m: Mando, v: number) => { if (m.cur !== v || m.tgt !== v) { m.cur = v; m.tgt = v; cambio = true; } };
    fijar(giro.current, c.giro); fijar(tilt.current, c.tilt); fijar(abre.current, c.abre); fijar(plano.current, c.plano);
    if (!ui) return cambio;
    const u = uiPres.current;
    if (Math.abs(u.giro - c.giro) > 0.01) { u.giro = c.giro; setGiroUI(c.giro); }
    if (Math.abs(u.tilt - c.tilt) > 0.01) { u.tilt = c.tilt; setTiltUI(c.tilt); }
    if (Math.abs(u.abre - c.abre) > 0.01) { u.abre = c.abre; setAbreUI(c.abre); }
    if (Math.abs(u.plano - c.plano) > 0.01) { u.plano = c.plano; setPlanoUI(c.plano); }
    return cambio;
  }, []);
  /** Vuelca a los sliders visibles los valores reales de los mandos (al pausar, al terminar y a 10 Hz durante la reproducción) */
  const volcarUI = useCallback(() => {
    const v = { giro: giro.current.cur, tilt: tilt.current.cur, abre: abre.current.cur, plano: plano.current.cur };
    aplicarControles(v, true);
  }, [aplicarControles]);
  const reiniciarMandos = useCallback(() => {
    for (const mnd of [giro.current, cabeceo.current, tilt.current, abre.current]) { mnd.cur = 0; mnd.tgt = 0; }
    plano.current.cur = 0.5; plano.current.tgt = 0.5;
    uiPres.current = { giro: 0, tilt: 0, abre: 0, plano: 0.5 };
    setGiroUI(0); setTiltUI(0); setAbreUI(0); setPlanoUI(0.5);
  }, []);

  const sincScroll = useCallback((p: number) => {
    const y = Math.round(presGeo.current.y0 + p * presGeo.current.dist);
    if (Math.abs(y - presY.current) >= 1) { window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }); presY.current = window.scrollY; }
  }, []);

  /** Un fotograma de la presentación: el tiempo real (no los fps) decide el progreso; el scroll y el lienzo lo siguen */
  const paso = useCallback(function tick(ahora: number) {
    presRaf.current = 0;
    if (presRef.current !== "reproduciendo") return;
    const g = guion.current;
    if (!g) return;
    // El reloj narrativo sigue al tiempo real: una caída de rendimiento no alarga la película. Para no dar un salto al recuperarse, el avance por
    // fotograma se limita a 0,25 s de película y el resto se recupera en los siguientes (lo que pase de 1 s se descarta: no es una caída, es una parada).
    const dt = Math.max(0, (ahora - presUlt.current) / 1000);
    presUlt.current = ahora;
    const vl = velRef.current;
    presDeuda.current = Math.min(1, presDeuda.current + dt * vl);
    const avance = Math.min(presDeuda.current, 0.25 * vl);
    presDeuda.current -= avance;
    presT.current = Math.min(g.total, presT.current + avance);
    const t = presT.current, fin = t >= g.total;
    const p = fin ? 1 : pEn(g, t);
    const { tr, local } = trLocal(p, limite.current);
    const c = controlesEn(tr - 1 + local);
    // tras reanudar, los mandos vuelven a la coreografía con un fundido (sin saltos)
    const k = suave((ahora - presFase.current.t) / 800), d = presFase.current.desde;
    const verUI = ahora - presUiT.current >= 100 || fin;
    if (verUI) presUiT.current = ahora;
    const cambioC = aplicarControles({ giro: mezcla(d.giro, c.giro, k), tilt: mezcla(d.tilt, c.tilt, k), abre: mezcla(d.abre, c.abre, k), plano: mezcla(d.plano, c.plano, k) }, verUI);
    progreso.current = p; objetivo.current = p;
    // Ritmo de dibujo: pleno en escritorio; 30 fps en móvil o equipos modestos, salvo en el tramo final del epílogo, donde las luces viajeras
    // necesitan fluidez y la escena enlaza con el reposo vivo (≈60 fps)
    const minDt = mundo.current?.denso === false && !(tr === 5 && local > 0.6) ? 33 : MIN_DIB;
    let dibujado = false;
    if (fin || ((cambioC || p !== presP.current) && ahora - presDib.current >= minDt) || ahora - presDib.current > 100) {
      presDib.current = ahora; presP.current = p; dibujado = true;
      dibujar(p);
    }
    // El scroll de la página acompaña al progreso (barra de desplazamiento, cabecera) a ~8 Hz: basta, y evita forzar el layout en cada fotograma
    if (!manualRef.current && (fin || ahora - presScrollT.current >= 120)) { presScrollT.current = ahora; sincScroll(p); }
    if (verUI) presBarra.current?.style.setProperty("--pp", (t / g.total).toFixed(4));
    const seg = Math.floor(t);
    if (seg !== presSeg.current) { presSeg.current = seg; if (presTr.current) presTr.current.textContent = fmt(t); if (presRest.current) presRest.current.textContent = `−${fmt(g.total - t)}`; }
    if (fin) { enfocar.current = "fin"; cambiarPres("finalizado"); setAviso("Presentación finalizada. La composición queda suspendida. Puedes volver a verla o explorar la obra."); return; }
    // A ~30 fps (móvil) se espera al siguiente fotograma útil en lugar de despertar al navegador en cada refresco de la pantalla (60–120 Hz)
    const espera = dibujado && minDt > 0 ? minDt - 5 - (performance.now() - ahora) : 0;
    if (espera > 4) presTimer.current = window.setTimeout(() => { presTimer.current = 0; presRaf.current = requestAnimationFrame(tick); }, espera);
    else presRaf.current = requestAnimationFrame(tick);
  }, [dibujar, aplicarControles, cambiarPres, sincScroll]);

  const pausar = useCallback((gesto?: string) => {
    if (presRef.current !== "reproduciendo") return;
    cancelarPres(); relojMarca.current = 0;
    // El progreso exacto vuelve al scroll y los sliders al valor real, para continuar en modo manual sin saltos
    if (!manualRef.current && gesto === "exacto") { const y = Math.round(presGeo.current.y0 + objetivo.current * presGeo.current.dist); window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }); presY.current = window.scrollY; }
    volcarUI();
    cambiarPres("pausado");
    setAviso("Presentación en pausa. Puedes seguir en modo manual o reanudarla desde este punto.");
  }, [cambiarPres, volcarUI, cancelarPres]);

  const comenzar = useCallback(() => {
    cancelarPres();
    // Ninguna animación del modo exploración (suavizado del scroll, mandos pendientes) puede competir con el reloj cinematográfico
    cancelAnimationFrame(suav.current.raf); suav.current.raf = 0;
    cancelAnimationFrame(anim.current); anim.current = 0;
    peekP.current = null; peekAlLlegar.current = false; setMirando(false);
    reiniciarMandos();
    const g = guion.current ?? crearGuion();
    guion.current = g;
    if (manualRef.current) {
      // Movimiento reducido: recorrido por etapas, sin desplazamientos automáticos
      setPasos(true); setEtapa(0); setPManual(etapas(limite.current)[0]); cambiarPres("inactivo");
      setAviso("Recorrido por etapas. Usa Siguiente y Anterior para avanzar.");
      enfocar.current = "play";
      return;
    }
    geoScroll();
    progreso.current = 0; objetivo.current = 0; presP.current = -1;
    window.scrollTo({ top: presGeo.current.y0, behavior: "instant" as ScrollBehavior });
    presY.current = window.scrollY;
    dibujar(0);
    presT.current = 0; presSeg.current = -1;
    presFase.current = { t: performance.now() - 1000, desde: { giro: 0, tilt: 0, abre: 0, plano: 0.5 } };
    presUlt.current = performance.now(); presDib.current = 0; presDeuda.current = 0;
    cambiarPres("reproduciendo");
    setAviso("Presentación iniciada.");
    enfocar.current = "play";
    presRaf.current = requestAnimationFrame(paso);
  }, [dibujar, paso, reiniciarMandos, cambiarPres, geoScroll, cancelarPres]);

  const reanudar = useCallback(() => {
    if (presRef.current === "finalizado") { comenzar(); return; }
    const g = guion.current ?? crearGuion();
    guion.current = g;
    geoScroll();
    presT.current = tEn(g, objetivo.current);
    presFase.current = { t: performance.now(), desde: { giro: giro.current.cur, tilt: tilt.current.cur, abre: abre.current.cur, plano: plano.current.cur } };
    presY.current = window.scrollY; presP.current = -1;
    uiPres.current = { giro: 9, tilt: 9, abre: 9, plano: 9 };
    presUlt.current = performance.now(); presDeuda.current = 0;
    cambiarPres("reproduciendo");
    setAviso("Presentación reanudada.");
    presRaf.current = requestAnimationFrame(paso);
  }, [comenzar, paso, cambiarPres, geoScroll]);

  /** Cinematográfico → exploración: se detiene el reloj, el punto narrativo actual pasa a ser el scroll (una sola fuente de verdad) y los mandos muestran su valor real */
  const salir = useCallback(() => {
    cancelarPres();
    if (!manualRef.current && presRef.current !== "inactivo") {
      const y = Math.round(presGeo.current.y0 + objetivo.current * presGeo.current.dist);
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }); presY.current = window.scrollY;
    }
    volcarUI();
    cambiarPres("inactivo"); setPasos(false); setExplorando(true);
    setAviso("Modo exploración. Desplaza la página para avanzar a tu ritmo.");
    enfocar.current = "nav";
  }, [cambiarPres, volcarUI, cancelarPres]);
  const elegirExplorar = () => {
    setExplorando(true);
    setAviso("Modo exploración. Desplaza la página para avanzar a tu ritmo.");
    enfocar.current = "nav";
  };

  const ciclarVel = () => {
    const v = PRESENTACION_V5.velocidades;
    const sig = v[(v.indexOf(velRef.current as (typeof v)[number]) + 1) % v.length];
    velRef.current = sig; setVel(sig);
    setAviso(`Velocidad ${String(sig).replace(".", ",")} por.`);
  };
  const irEtapa = (i: number) => {
    const lista = etapas(limite.current);
    const n = Math.max(0, Math.min(lista.length - 1, i));
    const { tr, local } = trLocal(lista[n], limite.current);
    aplicarControles(controlesEn(tr - 1 + local));
    setEtapa(n); setPManual(lista[n]); progreso.current = lista[n]; objetivo.current = lista[n];
    dibujar(lista[n]);
  };

  /* Mientras reproduce, cualquier gesto del visitante (rueda, tacto, teclas de desplazamiento, pulsar la escena o un mando,
     o un scroll que no escribió el reproductor) pausa la presentación y deja el control en sus manos; Escape la cierra. */
  useEffect(() => {
    if (pres !== "reproduciendo") return;
    const st = escenario.current;
    const alScroll = () => { if (Math.abs(window.scrollY - presY.current) > 8) pausar(); };
    const alTecla = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key) && !(e.target as Element | null)?.closest?.(".v5-player, .v5-cine-barra")) pausar();
    };
    const alBajar = (e: PointerEvent) => { if (!(e.target as Element | null)?.closest?.(".v5-player, .v5-cine-barra")) pausar("exacto"); };
    const alOcultar = () => { if (document.hidden) pausar("exacto"); };
    const alGesto = () => pausar();
    window.addEventListener("wheel", alGesto, { passive: true });
    window.addEventListener("touchmove", alGesto, { passive: true });
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("keydown", alTecla);
    document.addEventListener("visibilitychange", alOcultar);
    st?.addEventListener("pointerdown", alBajar);
    return () => {
      window.removeEventListener("wheel", alGesto);
      window.removeEventListener("touchmove", alGesto);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("keydown", alTecla);
      document.removeEventListener("visibilitychange", alOcultar);
      st?.removeEventListener("pointerdown", alBajar);
    };
  }, [pres, pausar]);
  useEffect(() => {
    if (pres === "inactivo" && !pasos) return;
    const alTecla = (e: KeyboardEvent) => { if (e.key === "Escape") salir(); };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [pres, pasos, salir]);
  useEffect(() => () => cancelarPres(), [cancelarPres]);
  useEffect(() => {
    if (enfocar.current === "play") { enfocar.current = null; playBtn.current?.focus(); }
    else if (enfocar.current === "fin") { enfocar.current = null; document.querySelector<HTMLElement>(".v5-cine-fin button")?.focus(); }
    else if (enfocar.current === "nav" && pres === "inactivo" && !pasos) { enfocar.current = null; document.querySelector<HTMLElement>(".v5-pie .an-nav [aria-current]")?.focus(); }
  });

  /* Si el mando propio deja de estar disponible mientras tiene el foco (p. ej. al retroceder), el foco pasa a «Girar la vista» */
  useEffect(() => {
    if (!espec && document.activeElement?.closest("[data-esp]")) giroIn.current?.focus();
  }, [espec]);

  const f = FRAGMENTOS_V5[frag];
  const ocultoEsp = espec ? undefined : "v5-oculto";
  const final = frag === FRAGMENTOS_V5.length - 1;
  const cine = pres !== "inactivo";

  return (
    <div ref={pista} className={`v5-pista${manual ? " v5-pista--manual" : ""}`} style={{ ["--v5-pant" as string]: 9.2 }}>
      <section ref={escenario} className="v5-escenario" data-modo={cine ? "cine" : "exploracion"} data-tramo={tramo} data-mando={mando} aria-label="El anciano de los días, recorrido interactivo">
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

        {/* En móvil vertical la hoja agrupa mandos y texto, anclada al pie; en escritorio y apaisado es transparente (display: contents) */}
        <div className="v5-hoja">
        <div className="v5-texto">
          <div className="v5-texto__cuerpo">
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
          {tramo === 1 && frag === 0 && !explorando && !pasos && !cine && (
            <div className="v5-eleccion" role="group" aria-labelledby="v5-elec-t">
              <p id="v5-elec-t" className="v5-eleccion__t">Contempla la obra a tu manera</p>
              <div className="v5-eleccion__op">
                <button type="button" className="v5-op" onClick={comenzar}>
                  <span className="v5-op__n">Cinematográfico</span>
                  <span className="v5-op__m">{manual ? "Por etapas" : "60 segundos"}<span className="v5-op__x"> · Una experiencia guiada</span></span>
                  <span className="v5-op__d">La creación, el orden y lo imposible se despliegan ante ti.</span>
                </button>
                <button type="button" className="v5-op" onClick={elegirExplorar}>
                  <span className="v5-op__n">Explorar</span>
                  <span className="v5-op__m">A tu ritmo<span className="v5-op__x"> · Descubre e interactúa</span></span>
                  <span className="v5-op__d">Recorre los actos, altera las estructuras y comprende su significado.</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desde el Acto I el hueco de los mandos queda reservado (invisible hasta que están disponibles): al aparecer no mueven el texto ni se desplazan */}
        {(mando || tramo >= 2) && (
          <div className={`v5-mando${mando ? "" : " v5-oculto"}`} role="group" aria-label="Explorar la estructura">
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
        </div>

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
          {!manual && tramo === 1 && frag === 0 && pres === "inactivo" && <p className="an-guia" aria-hidden="true">Desplaza para acercarte</p>}
          {cine && (
            <div className="v5-cine-barra" role="group" aria-label="Presentación cinematográfica">
              <button type="button" ref={playBtn} className="v5-player__b v5-player__ico" aria-label={pres === "reproduciendo" ? "Pausar presentación" : pres === "finalizado" ? "Repetir presentación" : "Reanudar presentación"} onClick={() => (pres === "reproduciendo" ? pausar("exacto") : reanudar())}>
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
                  {pres === "reproduciendo" ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : pres === "finalizado" ? <path d="M8 2a6 6 0 1 0 6 6h-2a4 4 0 1 1-1.2-2.8L9 7h5V2l-1.8 1.8A6 6 0 0 0 8 2z" /> : <path d="M4 2.5v11l9-5.5z" />}
                </svg>
              </button>
              <span ref={presTr} className="v5-player__t" aria-hidden="true">0:00</span>
              <span ref={presBarra} className="v5-cine-prog" aria-hidden="true" />
              <span ref={presRest} className="v5-player__t" aria-hidden="true">−1:00</span>
              <button type="button" className="v5-player__b" aria-label={`Velocidad ${String(vel).replace(".", ",")} por. Cambiar velocidad`} onClick={ciclarVel}>{String(vel).replace(".", ",")}×</button>
              <button type="button" className="v5-player__b v5-cine-salir" aria-label="Salir de la presentación y explorar la obra" onClick={salir}>Explorar</button>
            </div>
          )}
        </div>
        {!cine && !pasos && !(tramo === 1 && frag === 0 && !explorando) && (
          <div className="v5-player v5-player--ver">
            <button type="button" className="v5-player__b v5-ver" onClick={comenzar}>
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor"><path d="M4 2.5v11l9-5.5z" /></svg>
              {manual ? "Por etapas" : "Cinematográfico · 60 s"}
            </button>
          </div>
        )}
        {cine && pres !== "finalizado" && (
          <div className="v5-cine-zona" aria-hidden="true">
            <div className="v5-cine-t">
              <p className="an-kicker">{TRAMOS_V5[tramo - 1].kicker}</p>
              <h2 className="an-titulo an-titulo--escena">{tramo === 1 ? "El anciano de los días" : TRAMOS_V5[tramo - 1].titulo}</h2>
            </div>
          </div>
        )}
        {pres === "finalizado" && (
          <div className="v5-cine-zona">
            <div className="v5-cine-fin" role="group" aria-label="Fin de la presentación">
              <p className="an-kicker">Fin · Lo que no puede medirse</p>
              <p className="an-principal">Cada forma que acabas de ver tiene una explicación. Explora la obra a tu ritmo para comprenderla.</p>
              <div className="an-fin">
                <button type="button" className="an-btn" onClick={comenzar}>Volver a ver</button>
                <button type="button" className="an-btn an-btn--solido" onClick={salir}>Explorar la obra</button>
              </div>
            </div>
          </div>
        )}
        {pasos && (
          <div className="v5-player" role="group" aria-label="Recorrido por etapas">
            <button type="button" ref={playBtn} className="v5-player__b" onClick={() => irEtapa(etapa - 1)} disabled={etapa <= 0}>Anterior</button>
            <span className="v5-player__t" aria-hidden="true">{etapa + 1} / {FRAGMENTOS_V5.length}</span>
            <button type="button" className="v5-player__b" onClick={() => irEtapa(etapa + 1)} disabled={etapa >= FRAGMENTOS_V5.length - 1}>Siguiente</button>
            <button type="button" className="v5-player__b v5-player__ico" aria-label="Salir de la presentación" onClick={salir}>
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l10 10M13 3L3 13" /></svg>
            </button>
          </div>
        )}
        <p className="sr-only" role="status">{aviso}</p>
        <p className="sr-only" role="status">{`${TRAMOS_V5[tramo - 1].kicker}: ${TRAMOS_V5[tramo - 1].titulo}`}</p>
      </section>
    </div>
  );
}
