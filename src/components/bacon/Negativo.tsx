"use client";

/**
 * Instalación II · «El negativo del cuerpo» (Canvas 2D, sin WebGL).
 *
 * Tres membranas cuelgan delante de un muro. Una lámpara baja proyecta sus sombras hacia arriba, ampliadas. Cada membrana
 * lleva fragmentos distintos de materia; ninguna contiene el cuerpo. El visitante desplaza los planos y, en una posición
 * concreta (que se puede encontrar sin instrucciones: hay una atracción suave cerca), las tres sombras componen en el muro una
 * figura suspendida. Al acercarse, la penumbra se afila, la lámpara sube y las membranas se vuelven más transparentes.
 *
 * Se dibuja bajo demanda: solo mientras algo se mueve (arrastre, muelles, transición del encuentro) y con la escena visible.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { NEGATIVO } from "@/content/bacon";
import { crearRuido, generarMuro, generarPlano, geometria, OBJETIVO, sueloY, type Geometria, type Plano } from "./negativo/texturas";

/** Posición de partida de cada plano (en U): desordenados, sus sombras no dicen nada. */
const INICIO = [-0.16, 0.14, -0.09];
const RANGO = 0.26;
const ORDEN_DIBUJO = [2, 1, 0];
const reducido = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const suave = (a: number, b: number, v: number) => { const t = limitar((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

type Arrastre = { i: number; id: number; x0: number; p0: number; ultimo: number; t: number };

export function Negativo() {
  const escenaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<"espera" | "lista" | "sin-canvas">("espera");
  const [sel, setSel] = useState(0);
  const [alineado, setAlineado] = useState(false);
  const [tocado, setTocado] = useState(false);
  const selRef = useRef(0);

  const g = useRef<Geometria | null>(null);
  const planos = useRef<Plano[]>([]);
  const muro = useRef<HTMLCanvasElement | null>(null);
  const dpr = useRef(1);
  const x = useRef([...INICIO]);
  const v = useRef([0, 0, 0]);
  const destino = useRef<(number | null)[]>([null, null, null]);
  const giro = useRef([0, 0, 0]);
  const giroV = useRef([0, 0, 0]);
  const vel = useRef([0, 0, 0]);
  const I = useRef(0);
  const arr = useRef<Arrastre | null>(null);
  const raf = useRef(0);
  const tPrev = useRef(0);
  const visible = useRef(false);
  const alineadoRef = useRef(false);
  const tecladoRef = useRef(false);
  const tocadoRef = useRef(false);
  const hover = useRef(-1);
  const empujado = useRef(false);
  const Iprev = useRef(0);

  const objetivoI = () => {
    const a = x.current.reduce((s, xi, i) => s + Math.abs(xi - OBJETIVO[i]), 0);
    const t = limitar(1 - a / 0.06, 0, 1);
    return t * t;
  };

  const dibujar = useCallback(() => {
    const c = canvasRef.current, G = g.current, M = muro.current;
    if (!c || !G || !M || planos.current.length < 3) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { W, H, U, L, s } = G;
    const k = I.current;
    /** Transformación de un plano: desplazamiento, giro alrededor de su línea de enganche, flexión (la parte baja se queda
     * atrás al moverlo) y un leve escorzo cuando gira. Devuelve también la función que aplica lo mismo a un punto. */
    const formaPlano = (i: number, p: Plano, U: number) => {
      const dx = (x.current[i] - OBJETIVO[i]) * U;
      const gi = giro.current[i];
      const th = gi * 0.55, k = gi * 1.15, sx = 1 - Math.min(0.08, Math.abs(gi) * 0.9);
      const cos = Math.cos(th), sin = Math.sin(th);
      const [ax, ay] = p.ancla;
      const punto = (px: number, py: number): [number, number] => {
        const x1 = (px - ax) * sx, y1 = py - ay;
        const x2 = x1 + k * y1;
        return [ax + dx + cos * x2 - sin * y1, ay + sin * x2 + cos * y1];
      };
      const aplicar = (ctx: CanvasRenderingContext2D) => {
        ctx.translate(ax + dx, ay);
        ctx.rotate(th);
        ctx.transform(1, 0, k, 1, 0, 0);
        ctx.scale(sx, 1);
        ctx.translate(-ax, -ay);
      };
      return { punto, aplicar };
    };

    ctx.setTransform(dpr.current, 0, 0, dpr.current, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(M, 0, 0, W, H);
    // La lámpara sube y abre su cono al encontrarse la figura (antes de las sombras: no las aclara)
    const gl = ctx.createRadialGradient(L[0], L[1], 0, L[0], L[1], (1.15 + 0.3 * k) * U);
    gl.addColorStop(0, `rgba(255,176,96,${0.1 + 0.22 * k})`);
    gl.addColorStop(0.55, `rgba(200,120,60,${0.04 + 0.1 * k})`);
    gl.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
    const formas = [0, 1, 2].map((i) => formaPlano(i, planos.current[i], U));
    // Sombras en el muro: cada plano escalado desde la lámpara. La del plano más cercano a la lámpara es más difusa;
    // al encontrarse la figura todas se afilan y aparece, detrás, un eco más ancho (la penumbra de la lámpara): profundidad.
    const nitidez = [0.22, 0.45, 0.75];
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, sueloY(G)); ctx.clip();
    if (k > 0.01) {
      for (const i of ORDEN_DIBUJO) {
        const p = planos.current[i];
        ctx.save();
        ctx.translate(L[0], L[1]); ctx.scale(s[i] * 1.07, s[i] * 1.07); ctx.translate(-L[0], -L[1]);
        formas[i].aplicar(ctx);
        ctx.globalAlpha = 0.26 * k;
        ctx.drawImage(p.sombraSuave, p.ox, p.oy, p.w, p.h);
        ctx.restore();
      }
    }
    for (const i of ORDEN_DIBUJO) {
      const p = planos.current[i];
      const n = Math.min(1, nitidez[i] + k);
      ctx.save();
      ctx.translate(L[0], L[1]); ctx.scale(s[i], s[i]); ctx.translate(-L[0], -L[1]);
      formas[i].aplicar(ctx);
      if (n < 1) { ctx.globalAlpha = 0.92 * (1 - n); ctx.drawImage(p.sombraSuave, p.ox, p.oy, p.w, p.h); }
      ctx.globalAlpha = (0.86 + 0.12 * k) * n;
      ctx.drawImage(p.sombra, p.ox, p.oy, p.w, p.h);
      ctx.restore();
    }
    ctx.restore();
    // Los planos, del fondo hacia delante
    const activoI = arr.current?.i ?? -1;
    for (const i of ORDEN_DIBUJO) {
      const p = planos.current[i];
      const f = formas[i];
      if (i < 2) {
        // oclusión: el plano oscurece lo que tiene detrás, muy cerca
        ctx.save();
        ctx.translate(0.014 * U, 0.02 * U);
        f.aplicar(ctx);
        ctx.globalAlpha = 0.34;
        ctx.drawImage(p.sombraSuave, p.ox, p.oy, p.w, p.h);
        ctx.restore();
      }
      // halo: separa la piel del muro; crece al tocarla y cuando la luz la atraviesa en el encuentro
      const marcado = i === activoI ? 0.3 : i === hover.current ? 0.2 : tecladoRef.current && i === selRef.current ? 0.24 : 0;
      ctx.save();
      const [hcx, hcy] = [(p.mem[0] + p.mem[2]) / 2, (p.mem[1] + p.mem[3]) / 2];
      f.aplicar(ctx);
      ctx.translate(hcx, hcy); ctx.scale(1.05, 1.03); ctx.translate(-hcx, -hcy);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.1 + marcado + 0.18 * k;
      ctx.drawImage(p.halo, p.ox, p.oy, p.w, p.h);
      ctx.restore();
      // dos cables por plano: del techo a sus enganches (siguen al plano cuando se inclina)
      const resaltar = (tecladoRef.current && i === selRef.current) || i === activoI;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = resaltar ? "rgba(200,149,90,0.85)" : "rgba(214,196,168,0.36)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const e of p.enganches) {
        const [ex, ey] = f.punto(e[0], e[1]);
        const techo = e[0] + (x.current[i] - OBJETIVO[i]) * U + (e === p.enganches[0] ? -0.02 : 0.02) * U;
        ctx.moveTo(techo, 0); ctx.lineTo(ex, ey);
      }
      ctx.stroke();
      ctx.save();
      f.aplicar(ctx);
      ctx.globalAlpha = 1 - 0.22 * k; // al encontrarse la figura, la materia cede un poco y manda la sombra
      ctx.drawImage(p.tex, p.ox, p.oy, p.w, p.h);
      ctx.restore();
      // señal de arrastre, hasta el primer gesto: dos marcas a los lados del pie de la membrana
      if (!tocadoRef.current) {
        const [bx, by] = f.punto((p.mem[0] + p.mem[2]) / 2, p.mem[3]);
        const d = Math.max(14, (p.mem[2] - p.mem[0]) * 0.28);
        ctx.strokeStyle = "rgba(232,212,180,0.6)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(bx - d, by - 5); ctx.lineTo(bx - d - 5, by); ctx.lineTo(bx - d, by + 5);
        ctx.moveTo(bx + d, by - 5); ctx.lineTo(bx + d + 5, by); ctx.lineTo(bx + d, by + 5);
        ctx.stroke();
      }
    }
    // Viñeta: la sala se cierra un poco más en el encuentro
    ctx.globalAlpha = 1;
    const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.hypot(W, H) * 0.62);
    vg.addColorStop(0, "rgba(4,3,2,0)");
    vg.addColorStop(1, `rgba(4,3,2,${0.55 + 0.25 * k})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }, []);

  const pasoRef = useRef<(t: number) => void>(() => {});
  /** Un paso de física: arrastre con atracción suave, muelles, balanceo y la intensidad del encuentro. */
  const paso = useCallback((ahora: number) => {
    raf.current = 0;
    const dt = Math.min(0.05, tPrev.current ? (ahora - tPrev.current) / 1000 : 0.016);
    tPrev.current = ahora;
    const quieto = reducido();
    let activo = !!arr.current;
    for (let i = 0; i < 3; i++) {
      const d = destino.current[i];
      if (d !== null && arr.current?.i !== i) {
        if (quieto) { x.current[i] = d; v.current[i] = 0; destino.current[i] = null; }
        else {
          const a = -90 * (x.current[i] - d) - 19 * v.current[i];
          v.current[i] += a * dt; x.current[i] += v.current[i] * dt;
          if (Math.abs(x.current[i] - d) < 1e-4 && Math.abs(v.current[i]) < 1e-3) { x.current[i] = d; v.current[i] = 0; destino.current[i] = null; }
          else activo = true;
        }
      }
      // Balanceo: el plano cuelga de un cable; al moverlo se inclina y luego oscila hasta quedarse quieto
      if (quieto) { giro.current[i] = 0; giroV.current[i] = 0; }
      else {
        vel.current[i] *= Math.exp(-dt * 7);
        const objetivoGiro = limitar(-vel.current[i] * 0.05, -0.07, 0.07);
        const a = -58 * (giro.current[i] - objetivoGiro) - 7.5 * giroV.current[i];
        giroV.current[i] += a * dt; giro.current[i] += giroV.current[i] * dt;
        if (Math.abs(giro.current[i]) > 2e-4 || Math.abs(giroV.current[i]) > 2e-3 || Math.abs(vel.current[i]) > 1e-3) activo = true;
        else { giro.current[i] = 0; giroV.current[i] = 0; }
      }
    }
    const It = objetivoI();
    if (quieto) I.current = It;
    else {
      I.current += (It - I.current) * Math.min(1, dt * 2.4);
      if (Math.abs(It - I.current) > 0.002) activo = true; else I.current = It;
    }
    if (!activo && escenaRef.current) escenaRef.current.dataset.x = x.current.map((n) => n.toFixed(3)).join(" ");
    // al cruzar el umbral del encuentro, las capas acusan el cambio: un pequeño estremecimiento
    if (!quieto && Iprev.current < 0.6 && I.current >= 0.6) { giroV.current[0] += 0.2; giroV.current[1] -= 0.15; giroV.current[2] += 0.1; activo = true; }
    Iprev.current = I.current;
    const al = I.current > 0.92;
    if (al !== alineadoRef.current) { alineadoRef.current = al; setAlineado(al); }
    dibujar();
    if (activo && visible.current && document.visibilityState !== "hidden") raf.current = requestAnimationFrame((t) => pasoRef.current(t));
    else tPrev.current = 0;
  }, [dibujar]);
  useEffect(() => { pasoRef.current = paso; }, [paso]);

  const pedir = useCallback(() => {
    if (raf.current || !visible.current) return;
    raf.current = requestAnimationFrame((t) => pasoRef.current(t));
  }, []);

  /** Al soltar: si un plano quedó muy cerca de su sitio, se asienta en él (sin decidir por el visitante si está lejos). */
  const asentar = useCallback((i: number) => {
    if (Math.abs(x.current[i] - OBJETIVO[i]) < 0.04) destino.current[i] = OBJETIVO[i];
    pedir();
  }, [pedir]);

  // Preparación: geometría, ruido y texturas cuando la sala se acerca; se rehace si cambia el tamaño
  useEffect(() => {
    const escena = escenaRef.current, canvas = canvasRef.current;
    if (!escena || !canvas) return;
    if (!canvas.getContext("2d")) { setEstado("sin-canvas"); return; }
    let vivo = true;
    let generando = false;
    let medida = "";
    const ruido = crearRuido(1933);
    /** Un primer balanceo, una sola vez, cuando la sala está a la vista y lista. */
    const empujar = () => {
      if (empujado.current || !g.current || tocadoRef.current || reducido()) return;
      empujado.current = true;
      giroV.current[0] += 0.3; giroV.current[1] -= 0.22; giroV.current[2] += 0.16;
      pedir();
    };
    const preparar = async () => {
      const W = Math.round(escena.clientWidth), H = Math.round(escena.clientHeight);
      if (!W || !H || generando || `${W}x${H}` === medida) return;
      generando = true;
      medida = `${W}x${H}`;
      const movil = Math.min(innerWidth, innerHeight) < 700;
      const d = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 1.75);
      const G = geometria(W, H, Math.min(d, 1.25));
      const respiro = () => new Promise<void>((r) => setTimeout(r, 0));
      const M = await generarMuro(G, ruido, respiro);
      const P: Plano[] = [];
      for (let i = 0; i < 3; i++) { if (!vivo) return; P.push(await generarPlano(i, G, ruido, respiro)); }
      if (!vivo) return;
      dpr.current = d;
      canvas.width = Math.round(W * d);
      canvas.height = Math.round(H * d);
      g.current = G; muro.current = M; planos.current = P;
      // centro de cada membrana (en su sitio) y la unidad: para orientarse en pruebas automáticas
      escena.dataset.planos = P.map((p) => `${Math.round((p.mem[0] + p.mem[2]) / 2)},${Math.round((p.mem[1] + p.mem[3]) / 2)}`).join(" ");
      escena.dataset.u = G.U.toFixed(1);
      escena.dataset.x = x.current.map((n) => n.toFixed(3)).join(" ");
      generando = false;
      setEstado("lista");
      dibujar();
      if (visible.current) empujar();
      if (`${Math.round(escena.clientWidth)}x${Math.round(escena.clientHeight)}` !== medida) preparar();
    };
    const cerca = new IntersectionObserver(([en]) => { if (en.isIntersecting) { cerca.disconnect(); preparar(); } }, { rootMargin: "150% 0px 150% 0px" });
    cerca.observe(escena);
    const vis = new IntersectionObserver(([en]) => {
      visible.current = en.intersectionRatio > 0;
      if (en.intersectionRatio >= 0.5) empujar();
      if (en.isIntersecting) pedir();
    }, { threshold: [0, 0.5] });
    vis.observe(escena);
    let espera = 0;
    const ro = new ResizeObserver(() => {
      if (!g.current) return;
      clearTimeout(espera);
      espera = window.setTimeout(preparar, 220);
    });
    ro.observe(escena);
    const alVolver = () => { if (document.visibilityState !== "hidden") pedir(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vivo = false;
      cerca.disconnect(); vis.disconnect(); ro.disconnect();
      clearTimeout(espera);
      document.removeEventListener("visibilitychange", alVolver);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [dibujar, pedir]);

  // ── Puntero ──
  const local = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };
  const tocar = (px: number, py: number, holgura = 10) => {
    const G = g.current;
    if (!G) return -1;
    for (let i = 0; i < 3; i++) {
      const p = planos.current[i];
      const lx = px - (x.current[i] - OBJETIVO[i]) * G.U, ly = py;
      const [m0, m1, m2, m3] = p.mem;
      if (lx >= m0 - holgura && lx <= m2 + holgura && ly >= m1 - holgura && ly <= m3 + holgura) return i;
      const hx = Math.floor((lx - p.ox) / 4), hy = Math.floor((ly - p.oy) / 4);
      if (hx >= 0 && hy >= 0 && hx < p.hw && hy < p.hh && p.hit[hy * p.hw + hx] > 30) return i;
    }
    return -1;
  };
  const alBajar = (e: React.PointerEvent) => {
    if (e.button !== 0 || !g.current) return;
    const [px, py] = local(e);
    // con el dedo, el margen para agarrar un plano es más generoso
    const i = tocar(px, py, e.pointerType === "touch" ? 24 : 10);
    if (i < 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arr.current = { i, id: e.pointerId, x0: x.current[i], p0: px, ultimo: px, t: performance.now() };
    destino.current[i] = null;
    v.current[i] = 0;
    selRef.current = i; setSel(i);
    tecladoRef.current = false;
    tocadoRef.current = true;
    if (!tocado) setTocado(true);
    giroV.current[i] += 0.06; // al agarrarlo, el plano acusa el tirón
    e.currentTarget.classList.add("is-arrastre");
    pedir();
  };
  const alMover = (e: React.PointerEvent) => {
    const a = arr.current, G = g.current;
    if (!G) return;
    const [px, py] = local(e);
    if (!a || a.id !== e.pointerId) {
      if (e.pointerType === "mouse") {
        const h = tocar(px, py);
        e.currentTarget.classList.toggle("is-sobre", h >= 0);
        if (h !== hover.current) { hover.current = h; dibujar(); }
      }
      return;
    }
    const ahora = performance.now();
    const crudo = limitar(a.x0 + (px - a.p0) / G.U, OBJETIVO[a.i] - RANGO, OBJETIVO[a.i] + RANGO);
    // Atracción suave: muy cerca del sitio, el plano «quiere» quedarse; nunca lo mueve si el visitante tira en contra
    const d = OBJETIVO[a.i] - crudo;
    x.current[a.i] = crudo + d * 0.5 * suave(0.028, 0, Math.abs(d));
    const dtm = Math.max(1, ahora - a.t);
    vel.current[a.i] = 0.6 * vel.current[a.i] + 0.4 * (((px - a.ultimo) / G.U) / (dtm / 1000));
    a.ultimo = px; a.t = ahora;
    pedir();
  };
  const alSoltar = (e: React.PointerEvent) => {
    const a = arr.current;
    if (!a || a.id !== e.pointerId) return;
    arr.current = null;
    e.currentTarget.classList.remove("is-arrastre");
    asentar(a.i);
  };

  // ── Teclado ──
  const elegir = (i: number) => { selRef.current = i; setSel(i); tecladoRef.current = true; dibujar(); };
  const alTeclado = (e: React.KeyboardEvent) => {
    const i = selRef.current;
    if (e.key === "1" || e.key === "2" || e.key === "3") { e.preventDefault(); elegir(Number(e.key) - 1); return; }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); elegir((i + (e.key === "ArrowDown" ? 1 : 2)) % 3); return; }
    const dir = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    tecladoRef.current = true;
    tocadoRef.current = true;
    if (!tocado) setTocado(true);
    destino.current[i] = null;
    const paso = e.shiftKey ? 0.03 : 0.008;
    x.current[i] = limitar(x.current[i] + dir * paso, OBJETIVO[i] - RANGO, OBJETIVO[i] + RANGO);
    vel.current[i] = dir * (e.shiftKey ? 1.2 : 0.5);
    pedir();
  };
  const alSoltarTecla = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") asentar(selRef.current);
  };
  const separar = () => {
    for (let i = 0; i < 3; i++) { destino.current[i] = INICIO[i]; v.current[i] = 0; }
    pedir();
  };

  return (
    <section className="bc-neg" aria-labelledby="bc-neg-t" data-alineado={alineado ? "" : undefined}>
      <header className="bc-neg__cab">
        <p className="bc-kicker">{NEGATIVO.kicker}</p>
        <h2 id="bc-neg-t" className="bc-neg__h">{NEGATIVO.titulo}</h2>
        <p className="bc-neg__linea">{NEGATIVO.linea}</p>
      </header>
      <div
        ref={escenaRef}
        className={`bc-neg__escena${estado === "lista" ? " is-lista" : ""}`}
        role="group"
        tabIndex={0}
        aria-label={NEGATIVO.aria}
        aria-describedby="bc-neg-ay"
        onKeyDown={alTeclado}
        onKeyUp={alSoltarTecla}
        onBlur={() => { tecladoRef.current = false; dibujar(); }}
      >
        <canvas
          ref={canvasRef}
          className="bc-neg__canvas"
          aria-hidden="true"
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onPointerLeave={(e) => { e.currentTarget.classList.remove("is-sobre"); if (hover.current >= 0) { hover.current = -1; dibujar(); } }}
        />
        <p className="bc-neg__toque" aria-hidden="true" data-oculto={tocado || estado !== "lista" ? "" : undefined}>{NEGATIVO.toque}</p>
        <p className="bc-neg__encuentro" aria-hidden={!alineado}>{NEGATIVO.encuentro}</p>
        <span className="bc-sr" role="status">{alineado ? NEGATIVO.encuentroSr : ""}</span>
        {estado === "sin-canvas" ? <p className="bc-neg__sin">{NEGATIVO.sinCanvas}</p> : null}
      </div>
      <div className="bc-neg__mandos">
        <div className="bc-neg__planos" role="group" aria-label="Plano seleccionado para el teclado">
          {NEGATIVO.planos.map((nombre, i) => (
            <button key={nombre} type="button" className="bc-neg__plano" aria-pressed={sel === i} onClick={() => { elegir(i); escenaRef.current?.focus(); }}>
              {nombre}
            </button>
          ))}
        </div>
        <button type="button" className="bc-neg__separar" onClick={separar}>{NEGATIVO.separar}</button>
        <p id="bc-neg-ay" className="bc-neg__ay">{NEGATIVO.ayuda}</p>
      </div>
    </section>
  );
}
