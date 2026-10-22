"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { crearEscudoGL, type EscudoGL, type Uniformes } from "@/components/medusa/escudoGL";
import { MEDUSA } from "@/content/medusa";
import { RECORTE_SOMBRA, SOMBRA, ZONA_SOMBRA, type Vista } from "@/content/medusa-v3";

/** Límites del giro (grados): de lado basta para ver el canto sin esconder la obra. */
const MAX_Y = 40;
const MAX_X = 14;
const PERFIL = { rx: -4, ry: 36 };
const FRENTE = { rx: 0, ry: 0 };
const RIM = 8; // capas del canto
/** Luz fija en la sala, arriba a la izquierda; sobre la superficie se desplaza al girar el escudo. */
const LUZ = { lx: -0.35, ly: -0.45 };

/** Variantes del optimizador de imágenes (como en el escudo de la V2): la textura comparte caché. */
const VARIANTES = (getImageProps({ src: MEDUSA.imagen.src, alt: "", width: MEDUSA.imagen.width, height: MEDUSA.imagen.height, sizes: "100vw", quality: 70 }).props.srcSet ?? "")
  .split(", ")
  .map((c) => {
    const [url, w] = c.split(" ");
    return { url, w: parseInt(w, 10) };
  })
  .filter((v) => v.w > 0)
  .sort((a, b) => a.w - b.w);
const variante = (px: number) => VARIANTES.find((v) => v.w >= px) ?? VARIANTES.at(-1);

const limita = (v: number, m: number) => Math.max(-m, Math.min(m, v));

/** Recorte de la obra: la reproducción se coloca para que la ventana [x0, x1] × [y0, y1] llene el marco. */
const rw = RECORTE_SOMBRA.x1 - RECORTE_SOMBRA.x0;
const rh = RECORTE_SOMBRA.y1 - RECORTE_SOMBRA.y0;
const RECORTE_ESTILO: CSSProperties = {
  width: `${100 / rw}%`,
  // Alto explícito (no auto): Chrome lo pide en imágenes diferidas
  height: `${100 / rh}%`,
  left: `${(-RECORTE_SOMBRA.x0 / rw) * 100}%`,
  top: `${(-RECORTE_SOMBRA.y0 / rh) * 100}%`,
};
const RECORTE_PROPORCION = (rw * MEDUSA.imagen.width) / (rh * MEDUSA.imagen.height);
const ZONA = {
  cx: ((ZONA_SOMBRA.cx - RECORTE_SOMBRA.x0) / rw) * 100,
  cy: ((ZONA_SOMBRA.cy - RECORTE_SOMBRA.y0) / rh) * 100,
  rx: (ZONA_SOMBRA.rx / rw) * 100,
  ry: (ZONA_SOMBRA.ry / rh) * 100,
};

/**
 * Laboratorio «La sombra que miente»: el escudo bajo otra perspectiva. Se arrastra para
 * girarlo (con límites), «Ver perfil» lo lleva a una vista oblicua y «Ver sección» lo
 * sustituye por un corte esquemático. Reutiliza el material WebGL2 del escudo de la V2
 * (la curvatura es luz, no geometría: la pintura no se deforma). Solo hay bucle mientras
 * el escudo se mueve.
 */
export function SombraLab() {
  const [vista, setVista] = useState<Vista>("frente");
  const [tocado, setTocado] = useState(false);
  const [conGL, setConGL] = useState(false);
  const id = useId().replace(/:/g, "");
  const escenaRef = useRef<HTMLDivElement>(null);
  const escudoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gl = useRef<EscudoGL | null>(null);
  const u = useRef<Uniformes>({ s: 1, tx: 0, ty: 0, lx: LUZ.lx, ly: LUZ.ly, p: 0, c: 0, t: 0 });
  const target = useRef({ ...FRENTE });
  const current = useRef({ ...FRENTE });
  const arrastre = useRef<{ x: number; y: number; rx: number; ry: number; movido: boolean } | null>(null);
  const raf = useRef(0);
  const visible = useRef(false);
  const reduced = useRef(false);

  const v = SOMBRA.vistas[vista];
  const seccion = vista === "seccion";

  /** Un fotograma: suaviza el giro, mueve la luz sobre la superficie y repinta el material. */
  const frame = useCallback(function step() {
    raf.current = 0;
    const c = current.current;
    const t = target.current;
    const k = reduced.current || arrastre.current ? 1 : 0.12;
    c.rx += (t.rx - c.rx) * k;
    c.ry += (t.ry - c.ry) * k;
    escudoRef.current?.style.setProperty("--rx", `${c.rx.toFixed(2)}deg`);
    escudoRef.current?.style.setProperty("--ry", `${c.ry.toFixed(2)}deg`);
    escenaRef.current?.style.setProperty("--giro", (c.ry / MAX_Y).toFixed(3));
    if (gl.current && visible.current) {
      u.current.lx = LUZ.lx - (c.ry / MAX_Y) * 0.5;
      u.current.ly = LUZ.ly + (c.rx / MAX_X) * 0.4;
      gl.current.pinta(u.current);
    }
    if (Math.abs(t.rx - c.rx) > 0.02 || Math.abs(t.ry - c.ry) > 0.02) raf.current = requestAnimationFrame(step);
  }, []);
  const pedir = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(frame);
  }, [frame]);

  const ir = useCallback(
    (destino: Vista) => {
      setVista(destino);
      // La sección parte de la vista de perfil: el escudo gira y se convierte en su corte
      target.current = { ...(destino === "frente" ? FRENTE : PERFIL) };
      pedir();
    },
    [pedir],
  );

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reduced.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, []);

  // WebGL al acercarse a la vista; sin repintar fuera de ella
  useEffect(() => {
    const escena = escenaRef.current;
    const canvas = canvasRef.current;
    if (!escena || !canvas) return;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        if (!e.isIntersecting) return;
        if (!gl.current && !canvas.dataset.fallo) {
          gl.current = crearEscudoGL(canvas, matchMedia("(pointer: coarse)").matches ? 1.5 : 2);
          if (!gl.current) canvas.dataset.fallo = "1";
          else {
            const img = new window.Image();
            img.decoding = "async";
            img.src = variante(canvas.clientWidth * Math.min(devicePixelRatio || 1, 2))?.url ?? MEDUSA.imagen.src;
            img
              .decode()
              .then(() => {
                if (!gl.current) return;
                gl.current.textura(img);
                setConGL(true);
                pedir();
              })
              .catch(() => {});
          }
        }
        pedir();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(escena);
    const perdido = (e: Event) => {
      e.preventDefault();
      gl.current = null;
      canvas.dataset.fallo = "1";
      setConGL(false);
    };
    canvas.addEventListener("webglcontextlost", perdido);
    const ro = new ResizeObserver(() => pedir());
    ro.observe(escena);
    return () => {
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", perdido);
      gl.current?.libera();
      gl.current = null;
      setConGL(false);
    };
  }, [pedir]);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (seccion || (e.pointerType === "mouse" && e.button !== 0)) return;
    arrastre.current = { x: e.clientX, y: e.clientY, ...target.current, movido: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const a = arrastre.current;
    if (!a) return;
    const dx = e.clientX - a.x;
    const dy = e.clientY - a.y;
    if (!a.movido && Math.hypot(dx, dy) < 4) return;
    // En táctil, un gesto vertical es desplazar la página, no girar el escudo
    if (!a.movido && e.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx)) {
      arrastre.current = null;
      return;
    }
    if (!a.movido) {
      a.movido = true;
      setVista("libre");
      setTocado(true);
    }
    const r = e.currentTarget.getBoundingClientRect();
    target.current = { rx: limita(a.rx - (dy / r.height) * 60, MAX_X), ry: limita(a.ry + (dx / r.width) * 110, MAX_Y) };
    pedir();
  };
  const onUp = () => {
    arrastre.current = null;
    pedir();
  };

  const titulo = `Corte esquemático del escudo: la superficie real es convexa y sale hacia ti; la línea discontinua es la superficie cóncava que sugiere la sombra pintada. Sin escala.`;

  return (
    <div
      className="mv-lab"
      data-vista={vista}
      data-tocado={tocado || undefined}
      onKeyDown={(e) => {
        if (e.key === "Escape" && vista !== "frente") {
          e.stopPropagation();
          ir("frente");
        }
      }}
    >
      <figure className="mv-lab__fig">
        <div className="mv-lab__view">
          <div
            ref={escenaRef}
            className={`mv-escena ${conGL ? "has-gl" : ""}`}
            aria-hidden={seccion || undefined}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className="mv-escena__sombra" aria-hidden="true" />
            <div ref={escudoRef} className="mv-escudo">
              {Array.from({ length: RIM }, (_, i) => (
                <div key={i} className="mv-escudo__canto" style={{ "--i": i + 1 } as CSSProperties} aria-hidden="true" />
              ))}
              <div className="mv-escudo__cara">
                <Image
                  src={MEDUSA.imagen.src}
                  alt="El escudo de la Medusa de Caravaggio, con la cabeza gritando en el centro sobre un fondo verde."
                  width={MEDUSA.imagen.width}
                  height={MEDUSA.imagen.height}
                  sizes="(min-width: 64rem) 480px, 60vw"
                  quality={70}
                  loading="lazy"
                  draggable={false}
                />
                <canvas ref={canvasRef} className="mv-escudo__gl" aria-hidden="true" />
                <div className="mv-escudo__brillo" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Sección: esquema explicativo, no una medición */}
          <svg className="mv-corte" viewBox="0 0 400 250" role="img" aria-labelledby={`${id}-t`} aria-hidden={!seccion || undefined}>
            <title id={`${id}-t`}>{titulo}</title>
            <path className="mv-luz" d="M372 22 L322 62 M322 62 l13 -2 M322 62 l2 -13" />
            <text x="346" y="16" className="mv-rotulo">Luz</text>
            <path className="mv-sugerida" d="M200 30 Q140 125 200 220" />
            <path className="mv-real" d="M200 30 Q260 125 200 220" pathLength={1} />
            <path className="mv-flecha" d="M236 125 L272 125 M272 125 l-8 -5 M272 125 l-8 5" />
            <path className="mv-ojo" d="M344 125 q12 -9 22 0 q-10 9 -22 0 Z" />
            <text x="346" y="148" className="mv-rotulo">Tú</text>
            <text x="244" y="88" className="mv-rotulo mv-rotulo--real">Superficie real:</text>
            <text x="244" y="101" className="mv-rotulo mv-rotulo--real">convexa</text>
            <text x="158" y="186" textAnchor="end" className="mv-rotulo mv-rotulo--sugerida">Lo que sugiere</text>
            <text x="158" y="199" textAnchor="end" className="mv-rotulo mv-rotulo--sugerida">la sombra: cóncava</text>
            <text x="200" y="242" textAnchor="middle" className="mv-rotulo">Esquema sin escala</text>
          </svg>

          <p className="mv-lab__tag" aria-hidden="true">
            {v.nombre}
          </p>
          <p className="mv-pista" aria-hidden="true">
            {SOMBRA.pista}
          </p>
        </div>
        {/* Los dos pies ocupan la misma celda: el alto no cambia al pasar a la sección */}
        <figcaption className="mv-lab__pies">
          <span aria-hidden={seccion || undefined}>{SOMBRA.aviso}</span>
          <span aria-hidden={!seccion || undefined}>{SOMBRA.seccion}</span>
        </figcaption>
      </figure>

      <div className="mv-lab__controls">
        <div className="mv-lab__vistas" role="group" aria-label="Vistas del escudo">
          <button type="button" className="mf-btn" aria-pressed={vista === "perfil"} onClick={() => ir("perfil")}>
            Ver perfil
          </button>
          <button type="button" className="mf-btn" aria-pressed={seccion} onClick={() => ir("seccion")}>
            Ver sección
          </button>
          {/* aria-disabled y no disabled: el foco no se pierde al volver */}
          <button
            type="button"
            className="mf-btn mv-lab__volver"
            aria-disabled={vista === "frente"}
            onClick={() => vista !== "frente" && ir("frente")}
          >
            Volver al frente
          </button>
        </div>
        <div className="mv-lab__result">
          <div aria-live="polite">
            <p className="mv-lab__verdict">{v.nombre}</p>
            <p>{v.texto}</p>
            <p className="mv-lab__real">La superficie real es convexa.</p>
          </div>
          {/* Molde invisible con el texto más largo: el recuadro no cambia de alto entre vistas */}
          <div className="mv-lab__molde" aria-hidden="true">
            <p className="mv-lab__verdict">{SOMBRA.vistas.seccion.nombre}</p>
            <p>{SOMBRA.vistas.seccion.texto}</p>
            <p className="mv-lab__real">La superficie real es convexa.</p>
          </div>
        </div>
      </div>

      <div className="mv-lab__obra">
        <figure className="mv-recorte">
          <div className="mv-recorte__marco" style={{ aspectRatio: RECORTE_PROPORCION }}>
            <Image
              src={MEDUSA.imagen.src}
              alt="Detalle de la Medusa de Caravaggio: a la derecha de la cabeza, entre las serpientes, una sombra oscura se extiende sobre el fondo verde del escudo."
              width={MEDUSA.imagen.width}
              height={MEDUSA.imagen.height}
              sizes="(min-width: 64rem) 760px, 240vw"
              quality={70}
              loading="lazy"
              style={RECORTE_ESTILO}
            />
            <svg className="mv-recorte__zona" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <ellipse cx={ZONA.cx} cy={ZONA.cy} rx={ZONA.rx} ry={ZONA.ry} />
            </svg>
          </div>
          <figcaption>{SOMBRA.recorte}</figcaption>
        </figure>
        <div className="mv-lab__texto">
          <div className="mv-bloque">
            <KindTag tipo="hecho" />
            <p>{SOMBRA.hecho}</p>
          </div>
          <div className="mv-bloque">
            <KindTag tipo="hecho" />
            <p>{SOMBRA.soporte}</p>
          </div>
          <details className="mv-mas">
            <summary>Leer más y ver las fuentes</summary>
            <div className="mv-bloque">
              <KindTag tipo="lectura" />
              <p>{SOMBRA.lectura}</p>
            </div>
            <ul>
              {SOMBRA.fuentes.map((f) => (
                <li key={f.href}>
                  <a href={f.href} target="_blank" rel="noopener noreferrer">
                    {f.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
