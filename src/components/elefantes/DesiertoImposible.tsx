"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { CAPAS_ELEFANTES, CONTEXTO_ELEFANTES, DESIERTO, type Capa } from "@/content/elefantes";
import { DUNAS, MESAS, MOJON, MONOLITO, PUERTA, ROCA, type Pieza } from "./desierto/geometria";

type Punto =
  | { id: Capa["id"]; tipo: "concepto"; num: string; capa: Capa }
  | { id: string; tipo: "hito"; marca: string; rotulo: string; ctx: (typeof CONTEXTO_ELEFANTES)[number] };

/** Orden de lectura de la escena: de la masa al vacío, y después los hitos. */
const ORDEN: Capa["id"][] = ["masa", "soporte", "carga", "vacio"];
const PUNTOS: Punto[] = [
  ...ORDEN.map((id, i) => ({
    id,
    tipo: "concepto" as const,
    num: String(i + 1).padStart(2, "0"),
    capa: CAPAS_ELEFANTES.find((c) => c.id === id)!,
  })),
  ...CONTEXTO_ELEFANTES.map((ctx) => ({ id: ctx.id, tipo: "hito" as const, ...DESIERTO.hitos[ctx.id], ctx })),
];

/** Profundidad y proporción de cada escultura (mundo y capa interactiva comparten valores). */
const ESC: Record<Capa["id"], { depth: number; ar: number }> = {
  vacio: { depth: 0.3, ar: 140 / 160 },
  soporte: { depth: 0.78, ar: 220 / 376 },
  masa: { depth: 0.68, ar: 400 / 420 },
  carga: { depth: 0.9, ar: 120 / 600 },
};

/** Atributos de una pieza que se separa al deconstruir. */
const frag = (p: Pick<Pieza, "dx" | "dy" | "r" | "s">) => ({
  className: "ds-frag",
  "data-dx": p.dx,
  "data-dy": p.dy,
  "data-r": p.r,
  "data-s": p.s ?? 1,
});

/** Motas de polvo: posiciones fijas (deterministas) para que SSR y cliente coincidan. */
const POLVO = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  bottom: `${8 + ((i * 23) % 38)}%`,
  animationDelay: `${-((i * 1.7) % 14).toFixed(1)}s`,
  animationDuration: `${14 + (i % 5) * 3}s`,
}));

/**
 * «El desierto imposible»: instalación escultórica original, todo SVG y CSS.
 * GSAP añade el parallax (ratón, tacto y scroll), el movimiento en reposo, la
 * transformación Deconstruir / Ensamblar y el reencuadre de cámara al explorar.
 * Con movimiento reducido la escena es estática y los cambios son instantáneos.
 */
export function DesiertoImposible() {
  const root = useRef<HTMLElement>(null);
  const titulo = useRef<HTMLHeadingElement>(null); // h2: la pintura es el h1 de la página
  const panelTitulo = useRef<HTMLHeadingElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const encuadre = useRef<(id: string | null) => void>(() => {});
  const construir = useRef<(abiertoYa: boolean) => void>(() => {});
  const abierto = useRef(false);
  const selRef = useRef<string | null>(null);
  const ultimo = useRef<HTMLElement | null>(null);
  const [deconstruido, setDeconstruido] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [amplio, setAmplio] = useState(false);

  useGSAP(
    () => {
      const el = root.current!;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(
        { motion: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          const motion = Boolean(ctx.conditions?.motion);
          const dur = (s: number) => (motion ? s : 0);
          const cams = q(".ds-cam");

          // ── Deconstruir / Ensamblar: transformación escénica, no diagrama ──
          // Se construye al primer uso: medir las 17 piezas en la carga bloqueaba el hilo principal
          const construye = (abiertoYa: boolean) => {
            const t = gsap.timeline({ paused: true, defaults: { duration: dur(1.6), ease: "expo.inOut" } });
            q(".ds-frag").forEach((g, i) => {
              const d = (g as Element as SVGGElement).dataset;
              t.to(
                g,
                { x: Number(d.dx), y: Number(d.dy), rotation: Number(d.r), scale: Number(d.s), transformOrigin: "50% 50%" },
                motion ? i * 0.025 : 0,
              );
            });
            // La cámara se acerca, el horizonte se hunde y cae la luz del atardecer
            t.to(cams, { scale: 1.045, transformOrigin: "50% 62%", ease: "power3.inOut" }, 0);
            t.to(q("[data-split]"), { yPercent: (_: number, n: HTMLElement) => Number(n.dataset.split), ease: "power3.inOut" }, 0);
            t.to(q(".ds-fog--horizon"), { autoAlpha: 0.35, duration: dur(1.2), ease: "power2.inOut" }, 0);
            t.to(q(".ds-dusk, .ds-flare, .ds-glow"), { autoAlpha: 1, duration: dur(1.3), ease: "power2.inOut" }, dur(0.25));
            // Solo opacidad: las etiquetas se colocan con translate (CSS) y GSAP lo absorbería
            t.fromTo(q(".ds-tag"), { autoAlpha: 0 }, { autoAlpha: 1, duration: dur(0.7), stagger: dur(0.08), ease: "power2.out" }, dur(1));
            t.progress(abiertoYa ? 1 : 0);
            timeline.current = t;
          };
          // ctx.add ejecuta dentro del contexto: matchMedia lo revierte igual que lo demás
          construir.current = (abiertoYa) => ctx.add(() => construye(abiertoYa));
          // Si matchMedia se reevalúa con la escena abierta, se reconstruye ya abierta
          if (abierto.current) construir.current(true);

          // ── Reencuadre: el objeto elegido queda visible junto al panel ──
          encuadre.current = (id) => {
            if (!id) {
              gsap.to(cams, { x: 0, y: 0, duration: dur(1.1), ease: "power3.inOut", overwrite: "auto" });
              return;
            }
            const target = el.querySelector(`.ds-world [data-id="${id}"], .ds-hito--${id}`);
            const panel = el.querySelector<HTMLElement>(".ds-panel");
            if (!target || !panel) return;
            const b = el.getBoundingClientRect();
            const r = target.getBoundingClientRect();
            const cx = r.left + r.width / 2 - b.left;
            const cy = r.top + r.height / 2 - b.top;
            const x0 = Number(gsap.getProperty(cams[0], "x"));
            const y0 = Number(gsap.getProperty(cams[0], "y"));
            let dx: number;
            let dy = 0;
            if (window.matchMedia("(min-width: 64rem)").matches) {
              // Lo justo para que quede entero a la izquierda del panel (la composición apenas se mueve)
              const libre = b.width - panel.offsetWidth - 48;
              dx = r.right - b.left > libre ? libre - (r.right - b.left) : 0;
              if (r.left - b.left + dx < 24) dx = 24 - (r.left - b.left);
            } else {
              dx = b.width * 0.5 - cx;
              dy = Math.min(0, (b.height - panel.offsetHeight) * 0.62 - cy);
            }
            gsap.to(cams, {
              x: gsap.utils.clamp(-b.width * 0.42, b.width * 0.42, x0 + dx),
              y: gsap.utils.clamp(-b.height * 0.32, 0, y0 + dy),
              duration: dur(1.1),
              ease: "power3.inOut",
              overwrite: "auto",
            });
          };
          const onResize = () => encuadre.current(selRef.current);
          window.addEventListener("resize", onResize);
          if (selRef.current) encuadre.current(selRef.current);

          if (!motion) {
            return () => {
              timeline.current = null;
              window.removeEventListener("resize", onResize);
            };
          }

          // El parallax y el reposo arrancan después del primer pintado, en otra tarea
          let limpiaMovimiento = () => {};
          const arranque = window.setTimeout(
            () =>
              ctx.add(() => {
                // ── Parallax: un único estado de cámara alimenta todas las capas ──
                const capas = q("[data-depth]").map((n) => ({
                  d: Number((n as HTMLElement).dataset.depth),
                  x: gsap.quickSetter(n, "x", "px"),
                  y: gsap.quickSetter(n, "y", "px"),
                }));
                const cam = { x: 0, y: 0, s: 0 };
                const pinta = () => {
                  const r = Math.min(34, el.clientWidth * 0.024);
                  for (const c of capas) {
                    c.x(cam.x * c.d * r);
                    // Al hacer scroll lo lejano se retrasa y lo cercano acompaña a la página
                    c.y(cam.y * c.d * r * 0.5 + cam.s * (1 - c.d) * 120);
                  }
                };
                const mira = (x: number, y: number, duration = 1.1) =>
                  gsap.to(cam, { x, y, duration, ease: "power3.out", overwrite: "auto", onUpdate: pinta });

                const onMove = (e: PointerEvent) => {
                  const b = el.getBoundingClientRect();
                  const nx = (e.clientX - b.left) / b.width;
                  mira((nx - 0.5) * 2, ((e.clientY - b.top) / b.height - 0.5) * 2);
                  // El título se estira con el ratón, como un peso que tira de él
                  if (e.pointerType === "mouse") titulo.current?.style.setProperty("--stretch", (1.25 + nx * 0.6).toFixed(3));
                };
                const onLeave = () => mira(0, 0, 2.2);
                el.addEventListener("pointermove", onMove);
                el.addEventListener("pointerleave", onLeave);
                el.addEventListener("pointerup", onLeave);
                el.addEventListener("pointercancel", onLeave);

                // ── Reposo sobre envoltorios HTML (capas compuestas: el SVG no se repinta) ──
                const reposo = [
                  gsap.to(q(".ds-obj--carga .ds-body"), { y: -12, duration: 3.6, ease: "sine.inOut", repeat: -1, yoyo: true }),
                  gsap.to(q(".ds-obj--carga .ds-sombra"), { scaleX: 0.84, opacity: 0.55, duration: 3.6, ease: "sine.inOut", repeat: -1, yoyo: true }),
                  gsap.fromTo(
                    q(".ds-obj--soporte .ds-body"),
                    { rotation: -0.6 },
                    { rotation: 0.6, transformOrigin: "50% 100%", duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true },
                  ),
                  gsap.to(cams, { xPercent: -1.2, duration: 11, ease: "sine.inOut", repeat: -1, yoyo: true }),
                ];

                ScrollTrigger.create({
                  trigger: el,
                  start: "top top",
                  end: "bottom top",
                  onUpdate: (s) => {
                    cam.s = s.progress;
                    pinta();
                  },
                });
                // Fuera de pantalla no se anima nada (ni GSAP ni las animaciones CSS)
                ScrollTrigger.create({
                  trigger: el,
                  start: "top bottom",
                  end: "bottom top",
                  onToggle: (s) => {
                    reposo.forEach((tw) => tw.paused(!s.isActive));
                    el.classList.toggle("is-away", !s.isActive);
                  },
                });

                limpiaMovimiento = () => {
                  el.removeEventListener("pointermove", onMove);
                  el.removeEventListener("pointerleave", onLeave);
                  el.removeEventListener("pointerup", onLeave);
                  el.removeEventListener("pointercancel", onLeave);
                };
              }),
            0,
          );

          return () => {
            timeline.current = null;
            window.clearTimeout(arranque);
            limpiaMovimiento();
            window.removeEventListener("resize", onResize);
          };
        },
      );
      return () => mm.revert();
    },
    { scope: root },
  );

  useEffect(() => {
    abierto.current = deconstruido;
    if (!timeline.current) {
      if (!deconstruido) return;
      construir.current(false);
    }
    const t = timeline.current;
    if (!t) return;
    if (deconstruido) t.timeScale(1).play();
    else t.timeScale(1.3).reverse();
  }, [deconstruido]);

  useEffect(() => {
    const antes = selRef.current;
    selRef.current = sel;
    encuadre.current(sel);
    // Al abrir (no al pasar de un punto a otro) el foco entra en el panel
    if (sel && !antes) panelTitulo.current?.focus({ preventScroll: true });
  }, [sel]);

  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSel(null);
      ultimo.current?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel]);

  const punto = PUNTOS.find((p) => p.id === sel) ?? null;
  const abre = (id: string, trigger: HTMLElement) => {
    ultimo.current = trigger;
    setAmplio(false);
    setSel((s) => (s === id ? null : id));
  };
  const cierra = (e?: MouseEvent) => {
    setSel(null);
    // El anillo de foco solo se muestra si se cerró con teclado
    ultimo.current?.focus({ preventScroll: true, focusVisible: !e || e.detail === 0 } as FocusOptions);
  };
  const paso = (delta: number) => {
    const i = PUNTOS.findIndex((p) => p.id === sel);
    setAmplio(false);
    setSel(PUNTOS[(i + delta + PUNTOS.length) % PUNTOS.length].id);
  };

  const hot = (id: Capa["id"]) => {
    const p = PUNTOS.find((pt) => pt.id === id) as Extract<Punto, { tipo: "concepto" }>;
    return (
      <>
        <button type="button" className="ds-hot" aria-expanded={sel === id} aria-controls="ds-panel" onClick={(e) => abre(id, e.currentTarget)}>
          {/* El número visible forma parte del nombre accesible (WCAG 2.5.3) */}
          <span className="ds-hot__ring">{p.num}</span>
          <span className="sr-only">
            {" "}
            {p.capa.concepto}: {DESIERTO.esculturas[id].nombre}
          </span>
        </button>
        <span className="ds-tag" aria-hidden="true">
          <span className="ds-tag__num">{p.num}</span>
          <span className="ds-tag__txt">
            <em>{p.capa.concepto}</em>
            <span className="ds-tag__name">{DESIERTO.esculturas[id].nombre}</span>
          </span>
        </span>
      </>
    );
  };

  const obj = (id: Capa["id"], svg: ReactNode) => (
    <div className={`ds-obj ds-obj--${id}`} data-id={id} data-depth={ESC[id].depth} style={{ "--ar": ESC[id].ar } as CSSProperties}>
      <span className="ds-sombra" />
      <div className="ds-body">
        {/* Luz interior que escapa al abrir la escultura (capa propia: el fundido no repinta el SVG) */}
        <span className="ds-glow" />
        {svg}
      </div>
    </div>
  );

  return (
    <section
      ref={root}
      className="ds"
      id="interpretacion"
      aria-labelledby="el-title"
      data-estado={deconstruido ? "deconstruido" : "ensamblado"}
      data-sel={sel ?? undefined}
    >
      {/* Materiales compartidos (no display:none: rompería las referencias) */}
      <svg className="ds-defs" aria-hidden="true" focusable="false">
        <defs>
          {/* Piedra: luz cálida arriba a la derecha, sombra fría abajo a la izquierda */}
          <radialGradient id="ds-piedra" cx="0.7" cy="0.2" r="0.95">
            <stop offset="0" stopColor="#f6c793" />
            <stop offset="0.24" stopColor="#c47a55" />
            <stop offset="0.52" stopColor="#7a4544" />
            <stop offset="0.78" stopColor="#3a2c42" />
            <stop offset="1" stopColor="#171320" />
          </radialGradient>
          {/* Dos caras talladas: la fría en sombra, la cálida al sol */}
          <linearGradient id="ds-cara" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#1b1626" />
            <stop offset="0.53" stopColor="#3b2d45" />
            <stop offset="0.56" stopColor="#b9714f" />
            <stop offset="0.85" stopColor="#e8ae7c" />
            <stop offset="1" stopColor="#f8d2a2" />
          </linearGradient>
          {/* Contraluz: la puerta, frente al sol, es casi silueta */}
          <linearGradient id="ds-contraluz" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#2f2332" />
            <stop offset="0.7" stopColor="#4a3038" />
            <stop offset="1" stopColor="#7a4a40" />
          </linearGradient>
          {/* Luz de borde: solo en el lado del sol */}
          <linearGradient id="ds-filo" x1="0.15" y1="0.95" x2="0.95" y2="0.1">
            <stop offset="0.45" stopColor="#ffd9a8" stopOpacity="0" />
            <stop offset="0.8" stopColor="#ffd9a8" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff1d6" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="ds-hilo" x1="0" x2="0" y1="-700" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#efe1c9" stopOpacity="0" />
            <stop offset="1" stopColor="#efe1c9" stopOpacity="0.7" />
          </linearGradient>
          <pattern id="ds-mineral" width="160" height="160" patternUnits="userSpaceOnUse">
            <image href={`${process.env.NEXT_PUBLIC_BASE_PATH}/texturas/mineral.png`} width="160" height="160" />
          </pattern>
        </defs>
      </svg>

      <div className="ds-world" aria-hidden="true">
        <div className="ds-cam">
          <div className="ds-sky" data-depth="0.08" data-split="-5">
            <div className="ds-rays" />
            <div className="ds-dusk" />
            <div className="ds-flare" />
          </div>
          <svg className="ds-land ds-land--mesas" viewBox="0 0 1600 200" preserveAspectRatio="none" data-depth="0.16" data-split="-12">
            <path d={MESAS} />
          </svg>
          <svg className="ds-land ds-land--far" viewBox="0 0 1600 200" preserveAspectRatio="none" data-depth="0.26" data-split="-9">
            <path d={DUNAS.lejos} />
          </svg>
          <div className="ds-fog ds-fog--horizon" />

          {obj(
            "vacio",
            <svg viewBox={PUERTA.viewBox}>
              {PUERTA.piezas.map((p) => (
                <g key={p.d} {...frag(p)}>
                  <path d={p.d} className="ds-solido" fill="url(#ds-contraluz)" />
                </g>
              ))}
              <path d={PUERTA.figura} className="ds-figura" />
              <circle {...PUERTA.cabeza} className="ds-figura" />
            </svg>,
          )}

          <svg className="ds-land ds-land--mid" viewBox="0 0 1600 200" preserveAspectRatio="none" data-depth="0.42" data-split="-4">
            <path d={DUNAS.medio} />
          </svg>
          <div className="ds-ground" data-depth="0.6" data-split="3" />

          {obj(
            "soporte",
            <svg viewBox={MOJON.viewBox}>
              {MOJON.piedras.map((p) => (
                <g key={p.d} {...frag(p)}>
                  <path d={p.d} className="ds-solido" fill="url(#ds-piedra)" />
                  <path d={p.d} className="ds-textura" />
                </g>
              ))}
            </svg>,
          )}

          {obj(
            "masa",
            <svg viewBox={ROCA.viewBox}>
              <defs>
                <clipPath id="ds-roca-forma">
                  <path d={ROCA.cuerpo} />
                </clipPath>
                {ROCA.piezas.map((p, i) => (
                  <clipPath key={p.clip} id={`ds-roca-${i}`}>
                    <polygon points={p.clip} />
                  </clipPath>
                ))}
                <g id="ds-roca-cuerpo">
                  <path d={ROCA.cuerpo} className="ds-solido" fill="url(#ds-piedra)" />
                  <g clipPath="url(#ds-roca-forma)">
                    <path d={ROCA.cuerpo} className="ds-textura" />
                    <g className="ds-estratos">
                      {ROCA.estratos.map((d) => (
                        <path key={d} d={d} />
                      ))}
                    </g>
                    {/* Grietas recortadas a la silueta: labio oscuro y filo claro */}
                    <g className="ds-grieta">
                      {ROCA.grietas.map((d) => (
                        <path key={d} d={d} />
                      ))}
                    </g>
                    <g className="ds-grieta-luz">
                      {ROCA.grietas.map((d) => (
                        <path key={d} d={d} />
                      ))}
                    </g>
                  </g>
                </g>
              </defs>
              <path d={ROCA.aguja} className="ds-solido" fill="url(#ds-cara)" />
              {ROCA.piezas.map((p, i) => (
                <g key={p.clip} {...frag(p)}>
                  <g clipPath={`url(#ds-roca-${i})`}>
                    <use href="#ds-roca-cuerpo" />
                  </g>
                </g>
              ))}
            </svg>,
          )}

          {obj(
            "carga",
            <svg viewBox={MONOLITO.viewBox}>
              <line className="ds-hilo" x1={MONOLITO.apice.x} x2={MONOLITO.apice.x} y1="-2400" y2={MONOLITO.apice.y} />
              {MONOLITO.piezas.map((p) => (
                <g key={p.d} {...frag(p)}>
                  <path d={p.d} className="ds-solido" fill="url(#ds-cara)" />
                  <path d={p.d} className="ds-textura" />
                </g>
              ))}
            </svg>,
          )}

          <div className="ds-dust">
            {POLVO.map((m, i) => (
              <span key={i} style={m} />
            ))}
          </div>
          <div className="ds-fog ds-fog--low" />
        </div>
        <div className="ds-grain" />
      </div>

      <div className="ds-copy">
        {/* Sección secundaria: no es la pintura, sino una lectura propia de sus temas */}
        <p className="ds-eyebrow">04 · Interpretación original de MANIFESTO inspirada en los temas de la obra</p>
        <h2 ref={titulo} id="el-title" className="el-title">
          <span>El peso</span>
          <span>de lo</span>
          <span>imposible</span>
        </h2>
        <p className="el-lede">
          Toneladas de piedra sobre apoyos de nada. Un desierto donde la fuerza y la fragilidad son la misma cosa.
        </p>
        {/* En pantallas compactas, al deconstruir: los números de los anillos, explicados aquí */}
        <ol className="ds-leyenda" aria-hidden="true">
          {PUNTOS.filter((p) => p.tipo === "concepto").map((p) => (
            <li key={p.id}>
              <span>{p.num}</span>
              {p.capa.concepto}
            </li>
          ))}
        </ol>
      </div>

      <div className="ds-dock">
        <div className="ds-switch" role="group" aria-label="Estado de la escena">
          <button type="button" aria-pressed={!deconstruido} onClick={() => setDeconstruido(false)}>
            Ensamblar
          </button>
          <button type="button" aria-pressed={deconstruido} onClick={() => setDeconstruido(true)}>
            Deconstruir
          </button>
        </div>
        <p className="ds-hint">
          <span className="ds-hint--mouse">Mueve el cursor para mirar.</span>
          <span className="ds-hint--touch">Arrastra para mirar.</span> Abre los puntos y las señales de la arena.
        </p>
        <p className="ds-note">{DESIERTO.notaBreve}</p>
        <p className="sr-only" aria-live="polite">
          {deconstruido
            ? "Escena deconstruida: cada escultura se abre en sus piezas y deja escapar su luz interior."
            : "Escena ensamblada."}
        </p>
      </div>

      {/* Capa interactiva: misma geometría que el mundo, pero accesible (en el DOM, tras los mandos) */}
      <div className="ds-ui">
        <div className="ds-cam ds-cam--ui">
          {ORDEN.map((id) => (
            <div key={id} className={`ds-anchor ds-obj--${id}`} data-depth={ESC[id].depth} style={{ "--ar": ESC[id].ar } as CSSProperties}>
              {hot(id)}
            </div>
          ))}
          {PUNTOS.filter((p) => p.tipo === "hito").map((p) => (
            <div key={p.id} className={`ds-hito ds-hito--${p.id}`} data-depth="1.1">
              <button type="button" aria-expanded={sel === p.id} aria-controls="ds-panel" onClick={(e) => abre(p.id, e.currentTarget)}>
                <span className="ds-hito__marca">{p.marca}</span>
                <span className="ds-hito__rotulo">{p.rotulo}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Siempre montado: aria-controls apunta a un elemento que existe */}
      <div id="ds-panel" className="ds-panel" role="region" aria-labelledby="ds-panel-t" hidden={!punto} data-amplio={amplio || undefined}>
        {punto ? (
          <div className="ds-panel__inner">
            <div className="ds-panel__bar">
              <button
                type="button"
                className="ds-panel__more"
                aria-expanded={amplio}
                aria-controls="ds-panel-body"
                onClick={() => setAmplio((a) => !a)}
              >
                {amplio ? "Leer menos" : "Leer más"}
              </button>
              <button type="button" className="ds-panel__close" onClick={cierra} aria-label="Cerrar detalle">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <p className="ds-panel__kicker">
              {punto.tipo === "concepto" ? `${punto.num} · ${punto.capa.concepto}` : `Hito · ${punto.marca}`}
            </p>
            <h2 id="ds-panel-t" ref={panelTitulo} tabIndex={-1} className="ds-panel__t">
              {punto.tipo === "concepto" ? DESIERTO.esculturas[punto.id].nombre : punto.ctx.titulo}
            </h2>
            <div id="ds-panel-body" className="ds-panel__body">
              {punto.tipo === "concepto" ? (
                <>
                  <p className="ds-panel__escena">{DESIERTO.esculturas[punto.id].texto}</p>
                  <div className="ds-panel__obra">
                    <KindTag tipo={punto.capa.tipo} />
                    <h3>En la obra de Dalí: {punto.capa.nombre.toLowerCase()}</h3>
                    <p>{punto.capa.texto}</p>
                  </div>
                </>
              ) : (
                <div className="ds-panel__obra">
                  <KindTag tipo={punto.ctx.tipo} />
                  <p>{punto.ctx.texto}</p>
                </div>
              )}
            </div>
            <div className="ds-panel__nav">
              <button type="button" className="mf-btn" onClick={() => paso(-1)}>
                Anterior
              </button>
              <button type="button" className="mf-btn" onClick={() => paso(1)}>
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
