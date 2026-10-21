"use client";

import Image, { getImageProps } from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { MEDUSA } from "@/content/medusa";
import { REFLEJO, type PuntoReflejo } from "@/content/medusa-v3";
import { gsap } from "@/lib/gsap";

/* ── Geometría (semilla fija: servidor y cliente dibujan lo mismo) ── */

function semilla(s: number) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = semilla(1598);
const f = (n: number) => Math.round(n * 10) / 10;

/** Escena 400 × 500. */
const ANCHO = 400;
const ALTO = 500;
/** Radio del espejo, en unidades de la escena. */
const R = 92;

/**
 * Ventana de la reproducción que ocupa la escena (fracciones de la imagen): la cara
 * es más grande que el espejo, así que hay que moverlo para verla entera.
 */
const VENTANA = { x0: 0.29, x1: 0.75, y0: 0.1764 };
const IMG = (() => {
  const w = ANCHO / (VENTANA.x1 - VENTANA.x0);
  const h = (w * MEDUSA.imagen.height) / MEDUSA.imagen.width;
  return { x: -VENTANA.x0 * w, y: -VENTANA.y0 * h, w, h };
})();
/** Un punto de la obra (fracciones) en la escena, ya invertido como en un espejo. */
const enEscena = (px: number, py: number) => ({ x: ANCHO - (IMG.x + px * IMG.w), y: IMG.y + py * IMG.h });
const OJOS = [enEscena(0.484, 0.411), enEscena(0.599, 0.448)];
const BOCA = enEscena(0.51, 0.579);
const CUELLO = enEscena(0.4, 0.66);
const CARA = enEscena(0.5, 0.5);

/** Variantes del optimizador: el reflejo comparte caché con las <Image> de la página. */
const VARIANTES = (getImageProps({ src: MEDUSA.imagen.src, alt: "", width: MEDUSA.imagen.width, height: MEDUSA.imagen.height, sizes: "100vw", quality: 70 }).props.srcSet ?? "")
  .split(", ")
  .map((c) => {
    const [url, w] = c.split(" ");
    return { url, w: parseInt(w, 10) };
  })
  .filter((v) => v.w > 0)
  .sort((a, b) => a.w - b.w);
const variante = (px: number) => VARIANTES.find((v) => v.w >= px) ?? VARIANTES.at(-1);

/**
 * Espejo convexo: mapa de desplazamiento para feDisplacementMap. El centro se amplía
 * (hasta ×1,25) y el borde se comprime, como en un escudo pulido.
 */
const CONVEXO = { centro: 0.2, borde: 0.1, escala: 24 };
function mapaConvexo() {
  const n = 2 * R;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = n;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const img = ctx.createImageData(n, n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const px = ((i + 0.5) / n) * 2 - 1;
      const py = ((j + 0.5) / n) * 2 - 1;
      const r2 = Math.min(1, px * px + py * py);
      // Se muestrea en p · (1 + g): más cerca del centro dentro, más lejos en el borde
      const g = -CONVEXO.centro + (CONVEXO.centro + CONVEXO.borde) * r2;
      const k = (j * n + i) * 4;
      img.data[k] = Math.round((0.5 + (g * px * R) / CONVEXO.escala) * 255);
      img.data[k + 1] = Math.round((0.5 + (g * py * R) / CONVEXO.escala) * 255);
      img.data[k + 2] = 128;
      img.data[k + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

/** Fuera del espejo, solo indicios: serpientes que asoman por los bordes. */
type Serpiente = { d: string; cabeza: { x: number; y: number; a: number } };
const SERPIENTES: Serpiente[] = Array.from({ length: 14 }, (_, i) => {
  // Reparto por los cuatro bordes, desde fuera hacia dentro
  const borde = i % 4;
  const t = 0.12 + rnd() * 0.76;
  const [x0, y0] = [
    [t * ANCHO, -12],
    [ANCHO + 12, t * ALTO],
    [t * ANCHO, ALTO + 12],
    [-12, t * ALTO],
  ][borde];
  const a = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][borde] + (rnd() - 0.5) * 0.9;
  const largo = 70 + rnd() * 80;
  const onda = 5 + rnd() * 7;
  const fase = rnd() * Math.PI * 2;
  const vueltas = 1.4 + rnd() * 1.2;
  const pts = Array.from({ length: 15 }, (_, s) => {
    const u = s / 14;
    const w = Math.sin(u * vueltas * Math.PI * 2 + fase) * onda * (0.4 + 0.6 * u);
    return [x0 + Math.cos(a) * largo * u - Math.sin(a) * w, y0 + Math.sin(a) * largo * u + Math.cos(a) * w];
  });
  // Curva suave por los puntos medios
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let s = 1; s < pts.length - 1; s++) {
    const mx = (pts[s][0] + pts[s + 1][0]) / 2;
    const my = (pts[s][1] + pts[s + 1][1]) / 2;
    d += ` Q${f(pts[s][0])} ${f(pts[s][1])} ${f(mx)} ${f(my)}`;
  }
  const [hx, hy] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  return { d, cabeza: { x: f(hx), y: f(hy), a: f((Math.atan2(hy - py, hx - px) * 180) / Math.PI) } };
});
const CAPAS = [0, 1, 2].map((k) => SERPIENTES.filter((_, i) => i % 3 === k));

/** Posición de cada punto sobre la escena (%), lejos del espejo inicial. */
const POS: Record<PuntoReflejo["id"], { x: number; y: number }> = {
  espejo: { x: 14, y: 10 },
  sombra: { x: 86, y: 13 },
  rostro: { x: 14, y: 88 },
  superficie: { x: 86, y: 88 },
};
const PUNTOS = REFLEJO.puntos;

/** El espejo empieza sobre los ojos: ya se reconoce a Medusa, pero no entera. */
const INICIO = { x: f((OJOS[0].x + OJOS[1].x) / 2), y: f((OJOS[0].y + OJOS[1].y) / 2) };
const limita = (m: { x: number; y: number }) => ({
  x: Math.min(ANCHO - R * 0.4, Math.max(R * 0.4, m.x)),
  y: Math.min(ALTO - R * 0.4, Math.max(R * 0.4, m.y)),
});

/** Qué refleja el espejo, para los lectores de pantalla. */
function zona(m: { x: number; y: number }) {
  const cerca = (q: { x: number; y: number }, r: number) => Math.hypot(m.x - q.x, m.y - q.y) < r;
  if (cerca(INICIO, 55)) return "los ojos de Medusa";
  if (cerca(BOCA, 55)) return "la boca abierta de Medusa";
  if (cerca(CUELLO, 60)) return "el cuello cortado y la sangre";
  if (cerca(CARA, 115)) return "parte del rostro de Medusa";
  return m.y < 130 ? "las serpientes de su cabeza" : "sus serpientes";
}

/** El mundo reflejado, colocado para que el espejo muestre la zona m (en unidades del disco). */
const mundo = (m: { x: number; y: number }) => `translate(${f(R - m.x)} ${f(R - m.y)})`;

/**
 * «El reflejo»: interpretación original de MANIFESTO. De frente, una escena oscura
 * con indicios (serpientes en los bordes, el brillo de unos ojos); en el espejo, que
 * se arrastra o se mueve con las flechas, la Medusa de Caravaggio invertida y curvada
 * como en un escudo convexo. Cuatro puntos abren su contexto. Solo hay movimiento en
 * reposo si es la sección que más se ve frente al escudo de la V2, con la pestaña
 * visible y sin movimiento reducido.
 */
export function ElReflejo() {
  const [sel, setSel] = useState<PuntoReflejo["id"] | null>(null);
  const [amplio, setAmplio] = useState(false);
  const [tocado, setTocado] = useState(false);
  const [aviso, setAviso] = useState(zona(INICIO));
  const [href, setHref] = useState<string | null>(null);
  const [mapa, setMapa] = useState<string | null>(null);
  const filtro = `rf-convexo-${useId().replace(/:/g, "")}`;
  const escenaRef = useRef<HTMLDivElement>(null);
  const espejoRef = useRef<HTMLButtonElement>(null);
  const mundoRef = useRef<SVGGElement>(null);
  const capasRef = useRef<(HTMLDivElement | null)[]>([]);
  const panelTitulo = useRef<HTMLHeadingElement>(null);
  const ultimo = useRef<HTMLElement | null>(null);
  const selRef = useRef(sel);
  const m = useRef({ ...INICIO });
  const arrastre = useRef<{ id: number; ox: number; oy: number } | null>(null);

  /** Coloca el espejo y su contenido (solo transform: no repinta la escena). */
  const pon = (nuevo: { x: number; y: number }) => {
    m.current = limita(nuevo);
    const { x, y } = m.current;
    if (espejoRef.current) {
      espejoRef.current.style.left = `${((x - R) / ANCHO) * 100}%`;
      espejoRef.current.style.top = `${((y - R) / ALTO) * 100}%`;
    }
    mundoRef.current?.setAttribute("transform", mundo(m.current));
  };

  // La reproducción solo se descarga al acercarse a la escena, en la variante que pide su tamaño
  useEffect(() => {
    const escena = escenaRef.current;
    if (!escena) return;
    setMapa(mapaConvexo());
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const v = variante(escena.clientWidth * (IMG.w / ANCHO) * Math.min(devicePixelRatio || 1, 2));
        if (!v) return;
        const img = new window.Image();
        img.decoding = "async";
        img.src = v.url;
        img
          .decode()
          .catch(() => {})
          .finally(() => setHref(v.url));
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(escena);
    return () => io.disconnect();
  }, []);

  // Movimiento en reposo: deriva lenta de las serpientes y destello de los ojos, con relevo frente al escudo
  useEffect(() => {
    const escena = escenaRef.current;
    if (!escena) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const tweens = capasRef.current.map((capa, k) =>
      capa
        ? gsap.to(capa, {
            x: [10, -8, 6][k],
            y: [-6, 8, -10][k],
            rotation: [1.2, -0.9, 0.7][k],
            duration: [9, 11, 13][k],
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            paused: true,
          })
        : null,
    );
    const ratios = { escena: 0, escudo: 0 };
    const decide = () => {
      const vivo = ratios.escena > 0 && ratios.escena >= ratios.escudo && !document.hidden && !reduce.matches;
      tweens.forEach((t) => (vivo ? t?.play() : t?.pause()));
      escena.classList.toggle("is-quieto", !vivo);
    };
    const umbrales = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
    const ioEscena = new IntersectionObserver(([e]) => {
      ratios.escena = e.isIntersecting ? e.intersectionRatio || 0.001 : 0;
      decide();
    }, { threshold: umbrales });
    ioEscena.observe(escena);
    // El escudo de la V2 se observa en solo lectura: no se modifica
    const escudo = document.querySelector(".md-stage");
    const ioEscudo = new IntersectionObserver(([e]) => {
      ratios.escudo = e.isIntersecting ? e.intersectionRatio || 0.001 : 0;
      decide();
    }, { threshold: umbrales });
    if (escudo) ioEscudo.observe(escudo);
    document.addEventListener("visibilitychange", decide);
    reduce.addEventListener("change", decide);
    decide();
    return () => {
      tweens.forEach((t) => t?.kill());
      ioEscena.disconnect();
      ioEscudo.disconnect();
      document.removeEventListener("visibilitychange", decide);
      reduce.removeEventListener("change", decide);
    };
  }, []);

  useEffect(() => {
    pon(m.current);
  }, []);

  useEffect(() => {
    const antes = selRef.current;
    selRef.current = sel;
    // Al abrir (no al pasar de un punto a otro) el foco entra en el panel
    if (sel && !antes) panelTitulo.current?.focus({ preventScroll: false });
  }, [sel]);

  useEffect(() => {
    if (!sel) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSel(null);
      ultimo.current?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel]);

  /* ── Espejo: arrastre solo sobre el disco (touch-action: none únicamente ahí) ── */
  const aEscena = (e: PointerEvent) => {
    const r = escenaRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * ANCHO, y: ((e.clientY - r.top) / r.height) * ALTO };
  };
  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    const p = aEscena(e);
    arrastre.current = { id: e.pointerId, ox: p.x - m.current.x, oy: p.y - m.current.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    setTocado(true);
  };
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId) return;
    const p = aEscena(e);
    pon({ x: p.x - a.ox, y: p.y - a.oy });
  };
  const onUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (arrastre.current?.id !== e.pointerId) return;
    arrastre.current = null;
    setAviso(zona(m.current));
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const paso = e.shiftKey ? 40 : 12;
    const mov: Record<string, [number, number]> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] };
    if (e.key === "Home") {
      e.preventDefault();
      pon({ ...INICIO });
    } else if (mov[e.key]) {
      e.preventDefault();
      pon({ x: m.current.x + mov[e.key][0], y: m.current.y + mov[e.key][1] });
    } else return;
    setTocado(true);
    setAviso(zona(m.current));
  };

  /* ── Panel de los puntos (patrón del desierto y de La ventana) ── */
  const abre = (id: PuntoReflejo["id"], trigger: HTMLElement) => {
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
  const punto = PUNTOS.find((p) => p.id === sel) ?? null;

  // Tamaño y posición inicial en línea: el HTML del servidor (y sin JavaScript) ya trae el espejo en su sitio
  const espejoTam: CSSProperties = {
    width: `${((2 * R) / ANCHO) * 100}%`,
    height: `${((2 * R) / ALTO) * 100}%`,
    left: `${((INICIO.x - R) / ANCHO) * 100}%`,
    top: `${((INICIO.y - R) / ALTO) * 100}%`,
  };
  // Sin JavaScript: el disco, quieto sobre los ojos, con la reproducción invertida por CSS
  const sinJsImagen: CSSProperties = {
    width: `${(IMG.w / (2 * R)) * 100}%`,
    left: `${((IMG.x - (ANCHO - INICIO.x - R)) / (2 * R)) * 100}%`,
    top: `${((IMG.y - (INICIO.y - R)) / (2 * R)) * 100}%`,
  };

  return (
    <section id="reflejo" className="rf" aria-labelledby="rf-title" data-tocado={tocado || undefined}>
      <div className="rf-copy">
        {/* Sección secundaria: no es la pintura, sino una lectura propia */}
        <p className="rf-eyebrow">Interpretación original de MANIFESTO inspirada en la obra</p>
        <h2 id="rf-title" className="md-h2">
          El reflejo
        </h2>
        <p className="rf-lede">{REFLEJO.entrada}</p>
        <p className="rf-instrucciones">
          Arrastra el espejo o, con el teclado, muévelo con las flechas (Mayús para ir más rápido; Inicio lo devuelve a los ojos).
        </p>
      </div>

      <div className="rf-stage">
        <div ref={escenaRef} className="rf-escena">
          {/* De frente: solo indicios. Serpientes en los bordes, en tres capas que derivan despacio */}
          {CAPAS.map((capa, k) => (
            <div
              key={k}
              ref={(el) => {
                capasRef.current[k] = el;
              }}
              className="rf-capa"
              aria-hidden="true"
            >
              <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} focusable="false">
                {capa.map((x, i) => (
                  <g key={i}>
                    <path d={x.d} className="rf-serpiente" />
                    <path d={x.d} className="rf-serpiente rf-serpiente--escama" />
                    <path d={x.d} className="rf-serpiente rf-serpiente--brillo" />
                    <g transform={`translate(${x.cabeza.x} ${x.cabeza.y}) rotate(${x.cabeza.a})`}>
                      <ellipse rx="6.5" ry="4.2" className="rf-serpiente__cabeza" />
                      <circle cx="2.6" cy="-1.6" r="0.9" className="rf-serpiente__ojo" />
                    </g>
                  </g>
                ))}
              </svg>
            </div>
          ))}
          {/* El brillo de unos ojos, justo donde el espejo los mostraría */}
          {OJOS.map((o, i) => (
            <span key={i} className="rf-ojo" style={{ left: `${(o.x / ANCHO) * 100}%`, top: `${(o.y / ALTO) * 100}%` }} aria-hidden="true" />
          ))}

          {/* El espejo: se arrastra solo desde aquí; dentro, la obra invertida y curvada */}
          <button
            ref={espejoRef}
            type="button"
            className="rf-espejo"
            style={espejoTam}
            aria-label={`Espejo: refleja ${aviso}. Arrástralo o muévelo con las flechas.`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={onKey}
          >
            <span className="rf-espejo__vista" aria-hidden="true">
              <svg viewBox={`0 0 ${2 * R} ${2 * R}`} focusable="false">
                {mapa ? (
                  <defs>
                    <filter id={filtro} filterUnits="userSpaceOnUse" x="0" y="0" width={2 * R} height={2 * R} colorInterpolationFilters="sRGB">
                      <feImage href={mapa} x="0" y="0" width={2 * R} height={2 * R} preserveAspectRatio="none" result="mapa" />
                      <feDisplacementMap in="SourceGraphic" in2="mapa" scale={CONVEXO.escala} xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                  </defs>
                ) : null}
                <g filter={mapa ? `url(#${filtro})` : undefined}>
                  <rect width={2 * R} height={2 * R} className="rf-espejo__fondo" />
                  <g ref={mundoRef} transform={mundo(INICIO)}>
                    {/* Invertida como en un espejo: x' = ANCHO − x */}
                    <g transform={`translate(${ANCHO} 0) scale(-1 1)`}>
                      {href ? <image href={href} x={f(IMG.x)} y={f(IMG.y)} width={f(IMG.w)} height={f(IMG.h)} preserveAspectRatio="none" /> : null}
                    </g>
                  </g>
                </g>
              </svg>
            </span>
            <span className="rf-espejo__brillo" aria-hidden="true" />
          </button>
          <noscript>
            <span className="rf-espejo-sinjs" style={espejoTam}>
              <span className="rf-espejo__vista">
                <span className="rf-espejo-sinjs__invertido">
                  <Image
                    src={MEDUSA.imagen.src}
                    alt=""
                    width={MEDUSA.imagen.width}
                    height={MEDUSA.imagen.height}
                    sizes="(min-width: 64rem) 1200px, 220vw"
                    quality={70}
                    loading="lazy"
                    style={sinJsImagen}
                  />
                </span>
              </span>
            </span>
          </noscript>
          <p className="rf-pista" aria-hidden="true">
            {REFLEJO.pista}
          </p>

          {PUNTOS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="rf-hot"
              style={{ left: `${POS[p.id].x}%`, top: `${POS[p.id].y}%` } as CSSProperties}
              aria-expanded={sel === p.id}
              aria-controls="rf-panel"
              onClick={(e) => abre(p.id, e.currentTarget)}
            >
              {/* El número visible forma parte del nombre accesible (WCAG 2.5.3) */}
              <span className="rf-hot__ring">{p.num}</span>{" "}
              <span className="rf-hot__label">{p.nombre}</span>
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {tocado ? `El espejo refleja ${aviso}.` : ""}
        </p>
        <p className="rf-nota">{REFLEJO.nota}</p>
        <noscript>
          <ol className="rf-sinjs">
            {PUNTOS.map((p) => (
              <li key={p.id}>
                <strong>
                  {p.num} · {p.nombre}.
                </strong>{" "}
                {p.escena} {p.hecho} {p.lectura ?? ""}
              </li>
            ))}
          </ol>
        </noscript>
      </div>

      {/* Siempre montado: aria-controls apunta a un elemento que existe */}
      <div id="rf-panel" className="rf-panel" role="region" aria-labelledby="rf-panel-t" hidden={!punto}>
        {punto ? (
          <div className="rf-panel__inner">
            <div className="rf-panel__bar">
              <p className="rf-panel__kicker">
                {punto.num} · {punto.nombre}
              </p>
              <button type="button" className="rf-panel__close" onClick={cierra} aria-label="Cerrar detalle">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <h3 id="rf-panel-t" ref={panelTitulo} tabIndex={-1} className="rf-panel__t">
              {punto.escena}
            </h3>
            <div className="rf-panel__obra">
              <KindTag tipo="hecho" />
              <p>{punto.hecho}</p>
            </div>
            {punto.lectura ? (
              <>
                <button
                  type="button"
                  className="rf-panel__more"
                  aria-expanded={amplio}
                  aria-controls="rf-panel-body"
                  onClick={() => setAmplio((a) => !a)}
                >
                  {amplio ? "Leer menos" : "Leer más"}
                </button>
                <div id="rf-panel-body" className="rf-panel__obra" hidden={!amplio}>
                  <KindTag tipo="lectura" />
                  <p>{punto.lectura}</p>
                </div>
              </>
            ) : null}
            {punto.enlace ? (
              <p className="rf-panel__link">
                <a href={punto.enlace.href}>{punto.enlace.texto}</a>
              </p>
            ) : null}
            <div className="rf-panel__nav">
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
