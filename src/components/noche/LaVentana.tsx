"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { VENTANA, type PuntoVentana } from "@/content/noche";
import { useCieloPausado } from "./cielo";
import { EscalaVentana } from "./EscalaVentana";
import { CASCADA, montarFlujo, reynolds } from "./flujo";

/** El cielo de Noche usa el régimen «Cascada» del laboratorio. */
const CIELO = { re: reynolds(CASCADA.energia, CASCADA.viscosidad), energia: CASCADA.energia };

type Estado = "dia" | "noche";

/* ── Geometría generada (semilla fija: servidor y cliente dibujan lo mismo) ── */

function semilla(s: number) {
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = semilla(1889);
const f = (n: number) => Math.round(n * 10) / 10;

/** Colinas del este: bajan de derecha a izquierda (dos planos). */
const colina = (y0: number, y1: number, amp: number) => {
  let d = `M0 330 L0 ${y0}`;
  for (let x = 0; x <= 400; x += 16) {
    const y = y0 + ((y1 - y0) * x) / 400 + Math.sin(x * 0.045 + y0) * amp + (rnd() - 0.5) * amp;
    d += ` L${x} ${f(y)}`;
  }
  return `${d} L400 330 Z`;
};
const COLINA_LEJOS = colina(262, 196, 5);
const COLINA_CERCA = colina(292, 232, 7);

/** Surcos del campo cercado: más juntos cuanto más lejos. */
const SURCOS = Array.from({ length: 16 }, (_, i) => {
  const y = 306 + 194 * (i / 15) ** 1.7;
  return `M-4 ${f(y)} Q200 ${f(y + 1.5 + i * 0.3)} 404 ${f(y - 1)}`;
});
/** Espigas: trazos cortos, más altos en primer plano. */
const ESPIGAS = Array.from({ length: 150 }, () => {
  const y = 306 + 194 * rnd() ** 1.5;
  const x = rnd() * 400;
  const h = 2 + ((y - 300) / 200) * 11;
  return `M${f(x)} ${f(y)} l${f((rnd() - 0.5) * h * 0.5)} ${f(-h)}`;
}).join(" ");

/** Ciprés en coordenadas propias: base en (0,0), copa en (0,-1). Huso rayado, no una llama. */
const HUSO = "M0 0 C-0.17 -0.22 -0.13 -0.7 0 -1 C0.12 -0.72 0.16 -0.24 0 0 Z";
const RAYADO = Array.from({ length: 46 }, () => {
  // Trazos cortos repartidos por todo el huso, inclinados hacia el eje
  const y = -0.06 - rnd() * 0.86;
  const medio = 0.13 * Math.sin(Math.PI * -y) ** 0.75;
  const x = (rnd() * 2 - 1) * medio * 0.8;
  const largo = 0.06 + rnd() * 0.1;
  return `M${x.toFixed(3)} ${y.toFixed(3)} L${(x * 0.6).toFixed(3)} ${(y - largo).toFixed(3)}`;
}).join(" ");

/** El pueblo que no se veía: casas bajas y un campanario, generados. */
const CASAS = Array.from({ length: 15 }, (_, i) => {
  const w = 12 + rnd() * 14;
  const h = 8 + rnd() * 9;
  const x = 132 + i * 17 + rnd() * 6;
  const y = 336 + Math.sin(i * 1.3) * 7 + rnd() * 6;
  return { x: f(x), y: f(y), w: f(w), h: f(h), luz: rnd() < 0.5 };
});

/** Muro de piedra que cierra el campo de trigo (carta 776: «un cuadrado de trigo cercado»). */
const MURO = "M-4 305 L404 299 L404 281 L-4 287 Z";
/** Juntas de las piedras: dos hiladas, con las verticales alternas (sin azar: no cambia la semilla). */
const JUNTAS = [
  "M-4 296 L404 290",
  ...Array.from({ length: 19 }, (_, i) => {
    const x = i * 22 + (i % 2 ? 11 : 0);
    const y = 287 - (6 * x) / 408;
    return `M${x} ${f(y)} v9 M${x + 11} ${f(y + 9)} v9`;
  }),
].join(" ");

/** Barrotes: la reja de la habitación. El horizontal bajo pasa por el campo, no por el pueblo. */
const BARROTES_V = [80, 160, 240, 320];
const BARROTES_H = [170, 440];

/** Posición de cada punto sobre la ventana (%). */
const POS: Record<PuntoVentana["id"], { x: number; y: number }> = {
  // En el cruce del barrote bajo
  ventana: { x: 20, y: 88 },
  // En el campo, bajo las casas: ni el número ni el rótulo las tapan
  memoria: { x: 64, y: 77 },
  turbulencia: { x: 34, y: 17 },
  // Junto a Venus (290, 146), sin taparla
  distancia: { x: 60, y: 21 },
};
/** Cada punto se cuenta mejor con un estado de la escena. */
const ESTADO_DE: Record<PuntoVentana["id"], Estado> = {
  ventana: "dia",
  memoria: "noche",
  turbulencia: "noche",
  distancia: "noche",
};

const PUNTOS = VENTANA.puntos;

/**
 * «La ventana»: interpretación original de MANIFESTO. Día es la vista que
 * describió desde la habitación; Noche, su recomposición (pueblo añadido,
 * ciprés acercado, cielo en movimiento). Cuatro puntos abren su contexto.
 */
export function LaVentana() {
  const [estado, setEstado] = useState<Estado>("dia");
  const [sel, setSel] = useState<PuntoVentana["id"] | null>(null);
  const [amplio, setAmplio] = useState(false);
  const paused = useCieloPausado();
  const pausaRef = useRef(paused);
  const ventanaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flujo = useRef<ReturnType<typeof montarFlujo>>(null);
  const panelTitulo = useRef<HTMLHeadingElement>(null);
  const ultimo = useRef<HTMLElement | null>(null);
  const selRef = useRef(sel);

  useEffect(() => {
    pausaRef.current = paused;
  }, [paused]);

  // Cielo de corrientes: solo de noche, y solo si es el lienzo principal de la página
  useEffect(() => {
    if (!canvasRef.current || !ventanaRef.current) return;
    flujo.current = montarFlujo(
      {
        canvas: canvasRef.current,
        host: ventanaRef.current,
        paleta: ["224,170,69", "244,233,207", "160,196,232"],
        densidad: 0.75,
        rastro: 0.03,
        // Mismo régimen que «Cascada», compuesto para la ventana: tres remolinos grandes
        // fijos en el cielo (no en el lugar de los del cuadro), los menores dentro, poca deriva
        remolino: 0.9,
        ancla: [
          { x: 0.42, y: 0.2, g: 1 },
          { x: 0.8, y: 0.26, g: -1 },
          { x: 0.16, y: 0.12, g: -1 },
        ],
        deriva: 0.25,
        giro: 0.15,
        pausado: () => pausaRef.current,
      },
      { ...CIELO, activo: false },
    );
    return () => flujo.current?.destruir();
  }, []);
  useEffect(() => {
    flujo.current?.actualizar({ ...CIELO, activo: estado === "noche" });
  }, [estado]);

  useEffect(() => {
    const antes = selRef.current;
    selRef.current = sel;
    // Al abrir (no al pasar de un punto a otro) el foco entra en el panel
    if (sel && !antes) panelTitulo.current?.focus({ preventScroll: false });
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

  const elige = (id: PuntoVentana["id"]) => {
    setAmplio(false);
    setSel(id);
    setEstado(ESTADO_DE[id]);
  };
  const abre = (id: PuntoVentana["id"], trigger: HTMLElement) => {
    ultimo.current = trigger;
    if (sel === id) return cierra();
    elige(id);
  };
  const cierra = (e?: MouseEvent) => {
    setSel(null);
    // El anillo de foco solo se muestra si se cerró con teclado
    ultimo.current?.focus({ preventScroll: true, focusVisible: !e || e.detail === 0 } as FocusOptions);
  };
  const paso = (delta: number) => {
    const i = PUNTOS.findIndex((p) => p.id === sel);
    elige(PUNTOS[(i + delta + PUNTOS.length) % PUNTOS.length].id);
  };

  const punto = PUNTOS.find((p) => p.id === sel) ?? null;

  return (
    <section id="ventana" className="vt" aria-labelledby="vt-title" data-estado={estado} data-sel={sel ?? undefined}>
      <div className="vt-copy">
        {/* Sección secundaria: no es la pintura, sino una lectura propia */}
        <p className="vt-eyebrow">Interpretación original de MANIFESTO inspirada en la obra</p>
        <h2 id="vt-title" className="nc-h2">
          La <em>ventana</em>
        </h2>
        <p className="vt-lede">
          Lo que se veía desde la habitación y lo que el cuadro hizo con ello. Pasa del día a la noche y abre los
          cuatro puntos.
        </p>
        <div className="vt-switch" role="group" aria-label="Momento de la escena">
          <button type="button" aria-pressed={estado === "dia"} onClick={() => setEstado("dia")}>
            Día
          </button>
          <button type="button" aria-pressed={estado === "noche"} onClick={() => setEstado("noche")}>
            Noche
          </button>
        </div>
        <p className="vt-estado" aria-live="polite">
          {VENTANA.estados[estado]}
        </p>
      </div>

      <div className="vt-stage">
        <div ref={ventanaRef} className="vt-ventana">
          <canvas ref={canvasRef} className="vt-cielo" aria-hidden="true" />
          <svg className="vt-paisaje" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="vt-dia" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#c9d8e6" />
                <stop offset="0.55" stopColor="#ecdcc0" />
                <stop offset="0.62" stopColor="#f3c98c" />
              </linearGradient>
              <radialGradient id="vt-halo">
                <stop offset="0" stopColor="#fff4d6" stopOpacity="0.95" />
                <stop offset="0.3" stopColor="#ffe3a0" stopOpacity="0.45" />
                <stop offset="1" stopColor="#e0aa45" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect className="vt-cielo-dia" width="400" height="500" fill="url(#vt-dia)" />
            <g className="vt-sol">
              <circle cx="322" cy="186" r="34" fill="url(#vt-halo)" />
              <circle cx="322" cy="186" r="12" />
            </g>
            <g className="vt-venus">
              <circle cx="290" cy="146" r="22" fill="url(#vt-halo)" />
              <circle cx="290" cy="146" r="3.2" />
            </g>
            <path className="vt-colina vt-colina--lejos" d={COLINA_LEJOS} />
            <path className="vt-colina vt-colina--cerca" d={COLINA_CERCA} />
            <path className="vt-tierra" d="M-4 300 L404 294 L404 504 L-4 504 Z" />
            <g className="vt-campo">
              {SURCOS.map((d) => (
                <path key={d} d={d} />
              ))}
              <path className="vt-espigas" d={ESPIGAS} />
            </g>
            <g className="vt-pueblo">
              {CASAS.map((c) => (
                <g key={`${c.x}-${c.y}`}>
                  <path d={`M${c.x} ${c.y} h${c.w} v${-c.h} l${f(-c.w / 2)} ${f(-c.h * 0.5)} l${f(-c.w / 2)} ${f(c.h * 0.5)} Z`} />
                  {c.luz ? <rect className="vt-luz" x={f(c.x + c.w * 0.4)} y={f(c.y - c.h * 0.6)} width="2.4" height="2.8" /> : null}
                </g>
              ))}
              <path className="vt-campanario" d="M246 352 h10 v-40 l-5 -34 l-5 34 Z" />
            </g>
            {/* De día, los cipreses quedan más allá del muro; de noche el muro se retira y
                uno de ellos se acerca hasta cruzar el horizonte */}
            <g className="vt-cipres vt-cipres--fijo">
              <path d={HUSO} />
              <path className="vt-rayado" d={RAYADO} />
            </g>
            <g className="vt-cipres vt-cipres--movil">
              <path d={HUSO} />
              <path className="vt-rayado" d={RAYADO} />
            </g>
            <g className="vt-muro">
              <path d={MURO} />
              <path className="vt-muro__juntas" d={JUNTAS} />
            </g>
          </svg>
          <svg className="vt-reja" viewBox="0 0 400 500" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {BARROTES_V.map((x) => (
              <rect key={`v${x}`} x={x - 3} y="0" width="6" height="500" rx="2" />
            ))}
            {BARROTES_H.map((y) => (
              <rect key={`h${y}`} x="0" y={y - 3} width="400" height="6" rx="2" />
            ))}
          </svg>

          {PUNTOS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="vt-hot"
              style={{ left: `${POS[p.id].x}%`, top: `${POS[p.id].y}%` } as CSSProperties}
              aria-expanded={sel === p.id}
              aria-controls="vt-panel"
              onClick={(e) => abre(p.id, e.currentTarget)}
            >
              {/* El número visible forma parte del nombre accesible (WCAG 2.5.3) */}
              <span className="vt-hot__ring">{p.num}</span>{" "}
              <span className="vt-hot__label">{p.nombre}</span>
            </button>
          ))}
        </div>
        <p className="vt-nota">{VENTANA.nota}</p>
      </div>

      {/* Siempre montado: aria-controls apunta a un elemento que existe */}
      <div id="vt-panel" className="vt-panel" role="region" aria-labelledby="vt-panel-t" hidden={!punto}>
        {punto ? (
          <div className="vt-panel__inner">
            <div className="vt-panel__bar">
              <p className="vt-panel__kicker">
                {punto.num} · {punto.nombre}
              </p>
              <button type="button" className="vt-panel__close" onClick={cierra} aria-label="Cerrar detalle">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <h3 id="vt-panel-t" ref={panelTitulo} tabIndex={-1} className="vt-panel__t">
              {punto.escena}
            </h3>
            <div className="vt-panel__obra">
              <KindTag tipo="hecho" />
              <p>{punto.hecho}</p>
            </div>
            {/* La escala vive aquí: es el contenido del punto, no una sección más */}
            {punto.id === "distancia" ? (
              <div className="vt-panel__escala">
                <p className="vt-panel__sub">De la ventana a Venus</p>
                <EscalaVentana />
              </div>
            ) : null}
            {punto.lectura ? (
              <>
                <button
                  type="button"
                  className="vt-panel__more"
                  aria-expanded={amplio}
                  aria-controls="vt-panel-body"
                  onClick={() => setAmplio((a) => !a)}
                >
                  {amplio ? "Leer menos" : "Leer más"}
                </button>
                <div id="vt-panel-body" className="vt-panel__obra" hidden={!amplio}>
                  <KindTag tipo="lectura" />
                  <p>{punto.lectura}</p>
                </div>
              </>
            ) : null}
            {punto.enlace ? (
              <p className="vt-panel__link">
                <a href={punto.enlace.href}>{punto.enlace.texto}</a>
              </p>
            ) : null}
            <div className="vt-panel__nav">
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
