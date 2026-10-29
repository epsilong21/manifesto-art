"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { CIERRE_OJO, CIRCULO as C, ESCENAS, PEC_IMG as I, TOTAL_ESCENAS, type Escena } from "@/content/pecados";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SRC = `${BASE}${I.base}-${I.anchos[1]}.webp`;
const VB_H = I.ratio * 100;
/** Nitidez: como mucho 1,35 píxeles CSS por píxel de la reproducción (2000 px), y nunca más de 5×. */
const NITIDEZ = 1.35;
const ZOOM_MAX = 5;
/** Aumento de la lupa sobre la mesa entera. */
const AUMENTO = 2.6;
const rad = (a: number) => (a * Math.PI) / 180;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const facil = (e: number) => (e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2);
/** Punto del círculo central, en unidades del SVG (el ancho vale 100). */
const pt = (r: number, a: number): [number, number] => [(C.x + r * Math.cos(rad(a))) * 100, (C.y * I.ratio + r * Math.sin(rad(a))) * 100];

function trazo(e: Escena): string {
  const f = e.forma;
  if (f.tipo === "circulo") {
    const r = f.r * 100;
    return `M${(f.x * 100 - r).toFixed(2)},${(f.y * VB_H).toFixed(2)} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0Z`;
  }
  const [x1, y1] = pt(C.rExt, f.desde), [x2, y2] = pt(C.rExt, f.hasta);
  const [x3, y3] = pt(C.rInt, f.hasta), [x4, y4] = pt(C.rInt, f.desde);
  const g = f.hasta - f.desde > 180 ? 1 : 0;
  const R = C.rExt * 100, r = C.rInt * 100;
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${g} 1 ${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)} A${r},${r} 0 ${g} 0 ${x4.toFixed(2)},${y4.toFixed(2)}Z`;
}

/**
 * Giro que deja derecha una escena. En la tabla, el suelo de cada pecado mira hacia el borde del
 * círculo (la Ira se ve derecha abajo, la Gula invertida arriba): para leerlas hay que rodear la mesa.
 * Aquí la mesa gira hasta que el borde de la escena queda abajo. Medallones y ojo no giran.
 */
const giro = (e: Escena) => (e.forma.tipo === "sector" ? 90 - (e.forma.desde + e.forma.hasta) / 2 : 0);

/** Qué zona hay bajo un punto de la tabla (fracciones), con la misma geometría que el SVG. */
function zonaEn(x: number, y: number): Escena | null {
  for (const e of ESCENAS) {
    if (e.forma.tipo !== "circulo" || e.grupo === "ojo") continue;
    if (Math.hypot(x - e.forma.x, (y - e.forma.y) * I.ratio) < e.forma.r) return e;
  }
  const dx = x - C.x, dy = (y - C.y) * I.ratio, d = Math.hypot(dx, dy);
  if (d < C.rInt) return ESCENAS.find((e) => e.grupo === "ojo")!;
  if (d > C.rExt) return null;
  const a = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  return ESCENAS.find((e) => e.forma.tipo === "sector" && ((a >= e.forma.desde && a < e.forma.hasta) || (a + 360 >= e.forma.desde && a + 360 < e.forma.hasta))) ?? null;
}

type Cam = { x: number; y: number; z: number; g: number };
const MESA: Cam = { x: 0.5, y: 0.5, z: 1, g: 0 };
const N_PECADOS = ESCENAS.filter((e) => e.grupo === "pecado").length;

/**
 * «El ojo que observa»: la mesa en un banco óptico. Al elegir una zona, la mesa gira hasta dejarla
 * derecha y un ocular de bronce la encuadra (en los medallones y el ojo, ajustado a su círculo). Una
 * lupa de aumento real permite mirar antes de entrar. Cada escena vista traza un rayo desde el ojo:
 * el contador de once escenas se dibuja sobre la propia mesa. Cámara con transformaciones CSS; solo
 * hay bucle mientras algo se mueve; con movimiento reducido, cada cambio es un corte.
 */
export function Mesa() {
  const [sel, setSel] = useState<string | null>(null);
  const [vistas, setVistas] = useState<string[]>([]);
  const [lupa, setLupa] = useState(false);
  const [bajo, setBajo] = useState<string | null>(null);

  const vista = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const ocular = useRef<HTMLDivElement>(null);
  const lente = useRef<HTMLDivElement>(null);
  const lenteImg = useRef<HTMLImageElement>(null);
  const motor = useRef<{ ir: (id: string | null) => void; lupa: (x: number, y: number, dedo: boolean) => void; lupaPaso: (dx: number, dy: number) => void } | null>(null);
  const m = useRef({
    w: 0, h: 0, bw: 0, bh: 0, zMax: 4, D: 0,
    cam: { ...MESA }, vuelo: null as null | { de: Cam; a: Cam; t0: number; dur: number },
    lx: 0.5, ly: 0.5, lxM: 0.5, lyM: 0.5, sel: null as string | null,
    quieto: false, visible: false, raf: 0, arrastre: false, toqueX: 0, toqueY: 0,
  });

  const idx = sel ? ESCENAS.findIndex((x) => x.id === sel) : -1;
  const e = idx >= 0 ? ESCENAS[idx] : null;
  const nVistas = vistas.filter((v) => v !== "ojo").length;

  useEffect(() => {
    const s = m.current;
    const vi = vista.current!;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    s.quieto = mq.matches;

    /** Encuadre de cada zona: los círculos llenan el ocular; los sectores usan su zoom verificado. */
    const destino = (id: string | null): Cam => {
      const z = ESCENAS.find((x) => x.id === id);
      if (!z) return { ...MESA };
      const cap = (v: number) => clamp(v, 1, s.zMax);
      if (z.forma.tipo === "circulo") {
        const zc = (s.D * 0.47) / (z.forma.r * s.bw);
        return { x: z.forma.x, y: z.forma.y, z: cap(zc), g: 0 };
      }
      return { x: z.x, y: z.y, z: cap(z.zoom), g: giro(z) };
    };

    const pintar = () => {
      const { cam } = s;
      const ex = s.w / 2, ey = s.h / 2;
      lienzo.current!.style.transform = `translate(${ex.toFixed(1)}px, ${ey.toFixed(1)}px) rotate(${cam.g.toFixed(3)}deg) scale(${cam.z.toFixed(4)}) translate(${(-cam.x * s.bw).toFixed(1)}px, ${(-cam.y * s.bh).toFixed(1)}px)`;
      // Lupa (solo con la mesa entera, sin giro): un círculo con la reproducción a mayor escala
      const lt = lente.current!, li = lenteImg.current!;
      if (!s.sel && lt.dataset.on === "true") {
        const ox = ex - 0.5 * s.bw, oy = ey - 0.5 * s.bh;
        const R = lt.offsetWidth / 2;
        const M = Math.min(AUMENTO, s.zMax);
        const sx = ox + s.lx * s.bw, sy = oy + s.ly * s.bh;
        lt.style.transform = `translate(${(sx - R).toFixed(1)}px, ${(sy - R).toFixed(1)}px)`;
        li.style.width = `${s.bw * M}px`;
        li.style.height = `${s.bh * M}px`;
        li.style.transform = `translate(${(R - s.lx * s.bw * M).toFixed(1)}px, ${(R - s.ly * s.bh * M).toFixed(1)}px)`;
      }
    };

    const paso = (ahora: number) => {
      s.raf = 0;
      let sigue = false;
      if (s.vuelo) {
        const f = s.vuelo;
        const e = s.quieto ? 1 : clamp((ahora - f.t0) / f.dur, 0, 1);
        const k = facil(e);
        const d = Math.hypot(f.a.x - f.de.x, (f.a.y - f.de.y) * I.ratio);
        const arco = Math.min(0.45, d * 1.4);
        s.cam = {
          x: f.de.x + (f.a.x - f.de.x) * k,
          y: f.de.y + (f.a.y - f.de.y) * k,
          z: Math.max(1, Math.exp(Math.log(f.de.z) + (Math.log(f.a.z) - Math.log(f.de.z)) * k) * (1 - arco * Math.sin(Math.PI * k))),
          g: f.de.g + (f.a.g - f.de.g) * k,
        };
        if (e >= 1) s.vuelo = null;
        else sigue = true;
      }
      const kl = s.quieto ? 1 : 0.35;
      const dl = Math.abs(s.lxM - s.lx) + Math.abs(s.lyM - s.ly);
      if (dl > 1e-4) {
        s.lx += (s.lxM - s.lx) * kl;
        s.ly += (s.lyM - s.ly) * kl;
        sigue = true;
      }
      lienzo.current!.style.willChange = sigue ? "transform" : "auto";
      pintar();
      if (sigue && s.visible) s.raf = requestAnimationFrame(paso);
    };
    const despertar = () => {
      if (!s.raf && s.visible) s.raf = requestAnimationFrame(paso);
    };

    const medir = () => {
      const r = vi.getBoundingClientRect();
      s.w = r.width;
      s.h = r.height;
      const mg = Math.max(12, Math.min(s.w, s.h) * 0.035);
      s.bw = Math.min(s.w - 2 * mg, (s.h - 2 * mg) / I.ratio);
      s.bh = s.bw * I.ratio;
      s.zMax = clamp((I.width * NITIDEZ) / s.bw, 1, ZOOM_MAX);
      s.D = Math.min(s.w, s.h) * 0.94;
      ocular.current!.style.setProperty("--d", `${s.D}px`);
      const el = lienzo.current!;
      el.style.width = `${s.bw}px`;
      el.style.height = `${s.bh}px`;
      if (!s.vuelo) s.cam = destino(s.sel);
      pintar();
    };

    motor.current = {
      ir: (id) => {
        s.sel = id;
        const a = destino(id);
        // El giro va por el camino corto
        const de = { ...s.cam };
        let dg = a.g - de.g;
        dg = ((((dg + 180) % 360) + 360) % 360) - 180;
        a.g = de.g + dg;
        const d = Math.hypot(a.x - de.x, (a.y - de.y) * I.ratio) + Math.abs(dg) / 400 + Math.abs(Math.log(a.z / de.z)) * 0.2;
        s.vuelo = { de, a, t0: performance.now(), dur: 900 + 900 * Math.min(1, d * 1.6) };
        despertar();
      },
      lupa: (x, y, dedo) => {
        const r = vi.getBoundingClientRect();
        const ox = r.width / 2 - 0.5 * s.bw, oy = r.height / 2 - 0.5 * s.bh;
        // Con el dedo, la lupa va por encima de la yema
        s.lxM = clamp((x - r.left - ox) / s.bw, 0, 1);
        s.lyM = clamp((y - r.top - (dedo ? 84 : 0) - oy) / s.bh, 0, 1);
        despertar();
      },
      lupaPaso: (dx, dy) => {
        s.lxM = clamp(s.lxM + dx, 0, 1);
        s.lyM = clamp(s.lyM + dy, 0, 1);
        despertar();
      },
    };
    medir();

    const ro = new ResizeObserver(medir);
    ro.observe(vi);
    const io = new IntersectionObserver(([en]) => {
      s.visible = en.isIntersecting;
      if (s.visible) despertar();
    });
    io.observe(vi);
    const cambio = () => {
      s.quieto = mq.matches;
    };
    mq.addEventListener("change", cambio);
    return () => {
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener("change", cambio);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    motor.current?.ir(sel);
  }, [sel]);

  // Al sacar la lupa, se coloca donde estaba
  useEffect(() => {
    if (lupa) motor.current?.lupaPaso(0, 0);
  }, [lupa]);

  // La zona bajo la lupa se anuncia mientras se mueve
  useEffect(() => {
    if (!lupa || sel) return;
    const t = setInterval(() => {
      const s = m.current;
      setBajo(zonaEn(s.lx, s.ly)?.id ?? null);
    }, 180);
    return () => clearInterval(t);
  }, [lupa, sel]);

  const elegir = (id: string | null) => {
    setSel(id);
    if (id) setVistas((v) => (v.includes(id) ? v : [...v, id]));
  };
  const ir = (n: number) => elegir(ESCENAS[(n + ESCENAS.length) % ESCENAS.length].id);

  const zonaTecla = (id: string) => (ev: KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      elegir(id);
    }
  };
  const salaTecla = (ev: KeyboardEvent<HTMLElement>) => {
    if (ev.key === "Escape" && sel) {
      elegir(null);
      ev.preventDefault();
    }
  };
  const vistaTecla = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (sel) {
      if (ev.key === "ArrowRight") ir(idx + 1);
      else if (ev.key === "ArrowLeft") ir(idx - 1);
      else return;
      ev.preventDefault();
      return;
    }
    if (!lupa) return;
    const d: Record<string, [number, number]> = { ArrowLeft: [-0.03, 0], ArrowRight: [0.03, 0], ArrowUp: [0, -0.03], ArrowDown: [0, 0.03] };
    if (d[ev.key]) {
      motor.current?.lupaPaso(...d[ev.key]);
      ev.preventDefault();
    } else if (ev.key === "Enter") {
      const z = zonaEn(m.current.lx, m.current.ly);
      if (z) elegir(z.id);
      ev.preventDefault();
    }
  };

  const puntero = (ev: RPointerEvent<HTMLDivElement>, tipo: "abajo" | "mueve" | "arriba") => {
    if (!lupa || sel) return;
    const s = m.current;
    if (tipo === "abajo") {
      s.arrastre = true;
      s.toqueX = ev.clientX;
      s.toqueY = ev.clientY;
      try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
    }
    if (tipo === "arriba") {
      s.arrastre = false;
      // Un toque sin arrastre entra en la zona que la lupa está mirando
      if (Math.hypot(ev.clientX - s.toqueX, ev.clientY - s.toqueY) < 6) {
        const z = zonaEn(s.lx, s.ly);
        if (z) elegir(z.id);
      }
      return;
    }
    if (tipo === "abajo" && ev.pointerType !== "mouse") return;
    if (ev.pointerType === "mouse" || s.arrastre) motor.current?.lupa(ev.clientX, ev.clientY, ev.pointerType === "touch");
  };

  const etiqueta = (z: Escena) => (z.grupo === "pecado" ? `Pecado: ${z.nombre}` : z.grupo === "postrimeria" ? `Postrimería: ${z.nombre}` : "El ojo");
  const posicion = e ? (e.grupo === "pecado" ? `Pecado ${idx + 1} de ${N_PECADOS}` : e.grupo === "postrimeria" ? `Postrimería ${idx - N_PECADOS + 1} de 4` : "El centro") : "";
  const zBajo = bajo ? ESCENAS.find((x) => x.id === bajo) : null;
  const centro: [number, number] = [C.x * 100, C.y * VB_H];

  return (
    <section id="ojo-que-observa" className="oj-sala" data-ocular={!!e} data-lupa={lupa && !e} aria-labelledby="oj-titulo" aria-roledescription="instalación" onKeyDown={salaTecla}>
      <header className="oj-cabeza">
        <p className="oj-ante">Instalación · banco óptico</p>
        <h2 id="oj-titulo">El ojo que observa</h2>
      </header>

      <div className="oj-banco">
        <div
          ref={vista}
          className="oj-vista"
          tabIndex={0}
          role="group"
          aria-label={e ? `${etiqueta(e)}, en el ocular. Flechas izquierda y derecha para girar la mesa a la zona contigua; Escape para volver.` : lupa ? "Mesa con la lupa. Flechas para moverla; Intro para entrar en la zona que mira." : "La mesa entera"}
          onKeyDown={vistaTecla}
          onPointerDown={(ev) => puntero(ev, "abajo")}
          onPointerMove={(ev) => puntero(ev, "mueve")}
          onPointerUp={(ev) => puntero(ev, "arriba")}
          onPointerCancel={() => (m.current.arrastre = false)}
        >
          <div ref={lienzo} className="oj-lienzo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SRC} width={I.width} height={I.height} alt="" loading="lazy" decoding="async" draggable={false} />
            <svg viewBox={`0 0 100 ${VB_H}`} preserveAspectRatio="none">
              {/* Rayos de la mirada: uno por cada escena vista */}
              <g className="oj-rayos" aria-hidden="true">
                {ESCENAS.filter((z) => z.grupo !== "ojo" && vistas.includes(z.id)).map((z) => {
                  const zx = (z.forma.tipo === "circulo" ? z.forma.x : z.x) * 100, zy = (z.forma.tipo === "circulo" ? z.forma.y : z.y) * VB_H;
                  const a = Math.atan2(zy - centro[1], zx - centro[0]);
                  const r0 = C.rInt * 100 * 1.04;
                  return (
                    <g key={z.id}>
                      <line x1={centro[0] + Math.cos(a) * r0} y1={centro[1] + Math.sin(a) * r0} x2={zx} y2={zy} />
                      <circle cx={zx} cy={zy} r={0.7} />
                    </g>
                  );
                })}
              </g>
              {/* Diafragma: con una zona en el ocular, el resto de la mesa se apaga */}
              <path className="oj-iris" d={`M-50,-50H150V${VB_H + 50}H-50Z ${e ? trazo(e) : ""}`} fillRule="evenodd" aria-hidden="true" />
              <g role="group" aria-label="Zonas de la mesa">
                {ESCENAS.map((z) => (
                  <path
                    key={z.id}
                    className="oj-zona"
                    d={trazo(z)}
                    data-visto={vistas.includes(z.id)}
                    data-bajo={bajo === z.id}
                    role="button"
                    tabIndex={e ? -1 : 0}
                    aria-label={`${etiqueta(z)}${vistas.includes(z.id) ? " (vista)" : ""}`}
                    aria-pressed={sel === z.id}
                    onClick={() => !lupa && elegir(z.id)}
                    onKeyDown={zonaTecla(z.id)}
                    onPointerEnter={() => !lupa && setBajo(z.id)}
                    onPointerLeave={() => !lupa && setBajo(null)}
                  />
                ))}
              </g>
            </svg>
          </div>

          <div ref={lente} className="oj-lupa" data-on={lupa && !e} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={lenteImg} src={SRC} width={I.width} height={I.height} alt="" loading="lazy" decoding="async" draggable={false} />
          </div>

          <div ref={ocular} className="oj-ocular" aria-hidden="true">
            <svg viewBox="-50 -50 100 100">
              <circle r="48.6" className="oj-ocular__aro" />
              {Array.from({ length: 72 }, (_, k) => {
                const a = rad(k * 5), l = k % 6 === 0 ? 3.2 : 1.6;
                return <line key={k} x1={Math.cos(a) * 47} y1={Math.sin(a) * 47} x2={Math.cos(a) * (47 - l)} y2={Math.sin(a) * (47 - l)} />;
              })}
            </svg>
          </div>

          <p className="oj-placa" aria-hidden="true">
            {e ? (e.rotulo ? `«${e.rotulo}»` : e.nombre) : zBajo ? zBajo.nombre : lupa ? "Mueve la lupa" : "Elige una escena"}
          </p>
        </div>

        <div className="oj-cartela" aria-live="polite">
          {e ? (
            <>
              <p className="oj-pos">{posicion}</p>
              <h3>
                {e.nombre}
                {e.rotulo && e.rotulo !== e.nombre ? <span className="oj-rotulo"> «{e.rotulo}»</span> : null}
              </h3>
              <p><b>Se ve.</b> {e.observacion}</p>
              <p className="oj-int"><b>Interpretación.</b> {e.interpretacion}</p>
              {e.grupo === "pecado" ? <p className="oj-nota">La mesa ha girado: en la tabla, el suelo de cada pecado mira hacia el borde del círculo.</p> : null}
              {e.id === "ojo" ? (
                <p className="oj-cierre">{nVistas >= TOTAL_ESCENAS ? CIERRE_OJO : `Has visto ${nVistas} de las ${TOTAL_ESCENAS} escenas que rodean al ojo; recórrelas todas para leerlo completo.`}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="oj-pos">La mesa entera</p>
              <h3>Siete pecados, cuatro postrimerías y un ojo</h3>
              <p>Toca una escena: la mesa girará hasta dejarla derecha bajo el ocular. Con la lupa puedes mirar antes de entrar.</p>
            </>
          )}
          <p className="oj-cuenta">
            <span aria-hidden="true">{Array.from({ length: TOTAL_ESCENAS }, (_, k) => (k < nVistas ? "●" : "○")).join("")}</span> {nVistas} de {TOTAL_ESCENAS} escenas vistas
          </p>
        </div>

        <div className="oj-perillas">
          {e ? (
            <>
              <button type="button" onClick={() => ir(idx - 1)} aria-label={`Girar a la anterior: ${ESCENAS[(idx - 1 + ESCENAS.length) % ESCENAS.length].nombre}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4" transform="matrix(-1 0 0 1 24 0)" /></svg>
              </button>
              <button type="button" onClick={() => ir(idx + 1)} aria-label={`Girar a la siguiente: ${ESCENAS[(idx + 1) % ESCENAS.length].nombre}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95M19 4v4h-4" /></svg>
              </button>
              <button type="button" className="oj-texto-b" onClick={() => elegir(null)}>Volver a la mesa</button>
            </>
          ) : (
            <>
              <button type="button" className="oj-texto-b" aria-pressed={lupa} onClick={() => { setLupa(!lupa); setBajo(null); }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="M14.5 14.5 20 20" /></svg>
                {lupa ? "Guardar la lupa" : "Lupa"}
              </button>
              <button type="button" className="oj-texto-b" onClick={() => elegir(ESCENAS[0].id)}>Empezar por la Ira</button>
              <button type="button" className="oj-texto-b" onClick={() => elegir("ojo")}>Mirar el ojo</button>
            </>
          )}
        </div>
      </div>

      <ol className="oj-nojs">
        {ESCENAS.map((z) => (
          <li key={z.id}>
            <strong>{etiqueta(z)}.</strong> {z.observacion} <em>Interpretación: {z.interpretacion}</em>
          </li>
        ))}
      </ol>
    </section>
  );
}
