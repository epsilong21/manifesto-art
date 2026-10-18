"use client";

import Image, { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { DETALLES_MEDUSA, MEDUSA } from "@/content/medusa";
import { focusOn, OVERVIEW } from "@/lib/focus";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { gsap } from "@/lib/gsap";
import { crearEscudoGL, type EscudoGL, type Uniformes } from "@/components/medusa/escudoGL";

const MAX_TILT = 12; // grados
const RIM = 7; // capas del canto de madera
const NUMERALES = ["I", "II", "III", "IV", "V"];

type Estado = "obra" | "petrificando" | "piedra" | "restaurando";
const ESTADO_TEXTO: Record<Estado, string> = {
  obra: "Obra auténtica",
  petrificando: "Petrificando · capa artística de MANIFESTO",
  piedra: "Petrificada · capa artística de MANIFESTO, no es la obra",
  restaurando: "Volviendo a la obra auténtica",
};

/** Variantes del optimizador de imágenes: la textura comparte caché con las <Image> de la página. */
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
 * El escudo como objeto: perspectiva, canto de madera, sombra y una superficie
 * convexa iluminada por píxel (WebGL2, con versión CSS si no está disponible).
 * La petrificación es una capa artística de MANIFESTO, progresiva y reversible,
 * que nace en la mirada. Los cinco detalles se abren sobre el propio escudo.
 */
export function MedusaShield() {
  const [active, setActive] = useState<number | null>(null);
  const [estado, setEstado] = useState<Estado>("obra");
  const [conGL, setConGL] = useState(false);
  // Alta resolución solo tras el primer enfoque (versión CSS)
  const [wantsDetail, setWantsDetail] = useState(false);
  const [detailReady, setDetailReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gl = useRef<EscudoGL | null>(null);
  const u = useRef<Uniformes>({ s: 1, tx: 0, ty: 0, lx: -0.35, ly: -0.45, p: 0, c: 0, t: 0 });
  const target = useRef({ rx: 0, ry: 0, lx: -0.35, ly: -0.45 });
  const current = useRef({ rx: 0, ry: 0, lx: -0.35, ly: -0.45 });
  const raf = useRef(0);
  const visible = useRef(false);
  const tocado = useRef(false);
  const reduced = useRef(false);
  const tlPiedra = useRef<gsap.core.Timeline | null>(null);
  const hotspotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const texturaAlta = useRef(false);
  const hayTextura = useRef(false);

  const detail = active === null ? null : DETALLES_MEDUSA[active];
  const alterada = estado !== "obra";

  /** Un fotograma: suaviza la inclinación y la luz, y repinta el material si hace falta. */
  const frame = useCallback(function step(now: number) {
    raf.current = 0;
    const c = current.current;
    const t = target.current;
    const k = reduced.current ? 1 : 0.1;
    c.rx += (t.rx - c.rx) * k;
    c.ry += (t.ry - c.ry) * k;
    c.lx += (t.lx - c.lx) * k;
    c.ly += (t.ly - c.ly) * k;
    const el = tiltRef.current;
    if (el) {
      el.style.setProperty("--rx", `${c.rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${c.ry.toFixed(2)}deg`);
    }
    stageRef.current?.style.setProperty("--lx", c.lx.toFixed(3));
    stageRef.current?.style.setProperty("--ly", c.ly.toFixed(3));
    const quieto = Math.abs(t.rx - c.rx) < 0.02 && Math.abs(t.ry - c.ry) < 0.02 && Math.abs(t.lx - c.lx) < 0.002 && Math.abs(t.ly - c.ly) < 0.002;
    const vivo = u.current.p > 0 && u.current.p < 1; // la escarcha del frente se mueve
    if (gl.current && visible.current) {
      u.current.lx = c.lx;
      u.current.ly = c.ly;
      u.current.t = now / 1000;
      gl.current.pinta(u.current);
    }
    if (!quieto || vivo) raf.current = requestAnimationFrame(step);
  }, []);
  const pedir = useCallback(() => {
    if (!raf.current) raf.current = requestAnimationFrame(frame);
  }, [frame]);

  const aim = useCallback(
    (nx: number, ny: number) => {
      // nx, ny en [-1, 1]: el escudo se inclina hacia ahí y la luz lo sigue
      const lim = reduced.current ? 0 : MAX_TILT;
      target.current = { rx: -ny * lim, ry: nx * lim, lx: nx * 0.85, ly: ny * 0.85 };
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
      // A 0: si el componente vuelve a montarse, el bucle debe poder arrancar de nuevo
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      tlPiedra.current?.kill();
    };
  }, []);

  /** Carga (o mejora) la textura del material. */
  const cargaTextura = useCallback(
    (px: number) => {
      const v = variante(px);
      if (!v || !gl.current) return;
      const img = new window.Image();
      img.decoding = "async";
      img.src = v.url;
      img
        .decode()
        .then(() => {
          // Subir la textura bloquea el hilo principal: la mejora de resolución nunca entra en
          // mitad de un zoom o de la petrificación (la primera textura, sí, porque aún no se ve)
          const sube = () => {
            if (!gl.current) return;
            if (hayTextura.current && gsap.isTweening(u.current)) return void gsap.delayedCall(0.15, sube);
            hayTextura.current = true;
            gl.current.textura(img);
            setConGL(true);
            pedir();
          };
          sube();
        })
        .catch(() => {});
    },
    [pedir],
  );

  // WebGL al acercarse a la vista; pausa fuera de ella. Un vaivén inicial enseña que es un objeto.
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    let presentado = false;
    let vaiven: gsap.core.Timeline | undefined;
    const tactil = matchMedia("(pointer: coarse)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
        if (!e.isIntersecting) return;
        if (!gl.current && !canvas.dataset.fallo) {
          gl.current = crearEscudoGL(canvas, tactil ? 1.5 : 2);
          if (!gl.current) canvas.dataset.fallo = "1";
          else cargaTextura(stage.clientWidth * Math.min(devicePixelRatio || 1, 2));
        }
        pedir();
        if (!presentado && e.intersectionRatio > 0.55 && !reduced.current && !tocado.current) {
          presentado = true;
          const r = { x: 0, y: 0 };
          vaiven = gsap
            .timeline({ onUpdate: () => !tocado.current && aim(r.x, r.y) })
            .to(r, { x: 0.75, y: -0.35, duration: 1.1, ease: "sine.inOut" })
            .to(r, { x: -0.6, y: 0.25, duration: 1.4, ease: "sine.inOut" })
            .to(r, { x: 0, y: 0, duration: 1.1, ease: "sine.inOut" });
        }
      },
      { rootMargin: "200px 0px", threshold: [0, 0.6] },
    );
    io.observe(stage);
    const perdido = (e: Event) => {
      e.preventDefault();
      gl.current = null;
      canvas.dataset.fallo = "1";
      setConGL(false);
    };
    canvas.addEventListener("webglcontextlost", perdido);
    const ro = new ResizeObserver(() => pedir());
    ro.observe(stage);
    return () => {
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", perdido);
      vaiven?.kill();
      // El canvas sigue en el DOM: se liberan los recursos, no el contexto
      gl.current?.libera();
      gl.current = null;
      hayTextura.current = false;
      texturaAlta.current = false;
      setConGL(false);
    };
  }, [aim, cargaTextura, pedir]);

  // Encuadre: el escudo gira hacia el detalle y su superficie se amplía
  useEffect(() => {
    const view = detail ? focusOn(detail) : OVERVIEW;
    if (detail) aim((detail.x - 50) / 50, (detail.y - 50) / 50);
    else aim(0, 0);
    const face = faceRef.current;
    const v = u.current;
    gsap.to(v, {
      s: view.scale,
      tx: view.tx / 100,
      ty: view.ty / 100,
      duration: reduced.current ? 0 : 1.1,
      ease: "power3.inOut",
      overwrite: "auto",
      onUpdate: () => {
        face?.style.setProperty("--s", v.s.toFixed(4));
        face?.style.setProperty("--tx", `${(v.tx * 100).toFixed(3)}%`);
        face?.style.setProperty("--ty", `${(v.ty * 100).toFixed(3)}%`);
        pedir();
      },
    });
    if (detail && gl.current && !texturaAlta.current) {
      texturaAlta.current = true;
      cargaTextura(2048);
    }
  }, [detail, aim, pedir, cargaTextura]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" && e.buttons === 0) return;
    tocado.current = true;
    if (active !== null) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    aim(Math.max(-1, Math.min(1, nx)), Math.max(-1, Math.min(1, ny)));
  };
  const onLeave = () => {
    if (active === null) aim(0, 0);
  };

  const select = (i: number | null) => {
    setActive(i);
    if (i !== null) setWantsDetail(true);
  };

  /** Petrificar o devolver la vida: siempre reversible, también a mitad de camino. */
  const petrificar = (piedra: boolean) => {
    const v = u.current;
    tlPiedra.current?.kill();
    const stage = stageRef.current;
    if (piedra) {
      setEstado("petrificando");
      tlPiedra.current = gsap
        .timeline({
          onUpdate: pedir,
          onComplete: () => {
            setEstado("piedra");
            // Golpe sordo: la piedra pesa
            if (!reduced.current && stage) {
              stage.classList.remove("is-golpe");
              void stage.offsetWidth;
              stage.classList.add("is-golpe");
            }
          },
        })
        .to(v, { p: 1, duration: 2.8 * (1 - v.p), ease: "power2.inOut" }, 0)
        .to(v, { c: 1, duration: 1.6, ease: "power1.in" }, 1.1);
    } else {
      setEstado("restaurando");
      tlPiedra.current = gsap
        .timeline({ onUpdate: pedir, onComplete: () => setEstado("obra") })
        .to(v, { c: 0, duration: 0.5, ease: "power1.out" }, 0)
        .to(v, { p: 0, duration: 2.2 * v.p, ease: "power2.inOut" }, 0.25);
    }
    if (reduced.current) tlPiedra.current.progress(1);
    pedir();
  };

  const backToWork = () => {
    const prev = active;
    setActive(null);
    if (estado !== "obra") petrificar(false);
    if (prev !== null) hotspotRefs.current[prev]?.focus({ preventScroll: true });
  };

  const enPiedra = estado === "petrificando" || estado === "piedra";

  return (
    <div
      className="md-explore"
      onKeyDown={(e) => {
        if (e.key === "Escape" && (active !== null || alterada)) {
          e.stopPropagation();
          backToWork();
        }
      }}
    >
      <div className="md-stage-wrap">
        <div
          ref={stageRef}
          className={`md-stage ${active !== null ? "is-focus" : ""} ${conGL ? "has-gl" : ""}`}
          data-estado={estado}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={onLeave}
          onPointerUp={(e) => e.pointerType !== "mouse" && onLeave()}
          onAnimationEnd={(e) => e.currentTarget.classList.remove("is-golpe")}
        >
          {/* Sombra sobre la pared: se desplaza al contrario que la luz */}
          <div className="md-cast" aria-hidden="true" />
          <div ref={tiltRef} className="md-tilt">
            {Array.from({ length: RIM }, (_, i) => (
              <div key={i} className="md-rim" style={{ "--i": i + 1 } as React.CSSProperties} aria-hidden="true" />
            ))}
            <div ref={faceRef} className="md-face">
              <div className="md-canvas">
                <div className="md-shield">
                  <Image
                    src={MEDUSA.imagen.src}
                    alt={MEDUSA.imagen.alt}
                    width={MEDUSA.imagen.width}
                    height={MEDUSA.imagen.height}
                    sizes="(min-width: 64rem) 52vw, 96vw"
                    quality={70}
                    draggable={false}
                  />
                  {wantsDetail && !conGL && (
                    <Image
                      src={MEDUSA.imagen.src}
                      alt=""
                      width={MEDUSA.imagen.width}
                      height={MEDUSA.imagen.height}
                      sizes="(min-width: 64rem) 130vw, 240vw"
                      quality={80}
                      draggable={false}
                      onLoad={() => setDetailReady(true)}
                      className={`md-detail ${detailReady ? "is-ready" : ""}`}
                    />
                  )}
                </div>
                {/* Versión sin WebGL de la capa artística: nunca la obra */}
                <div className="md-stone" aria-hidden="true">
                  <Image
                    src={MEDUSA.imagen.src}
                    alt=""
                    width={MEDUSA.imagen.width}
                    height={MEDUSA.imagen.height}
                    sizes="(min-width: 64rem) 52vw, 96vw"
                    quality={70}
                    draggable={false}
                  />
                </div>
              </div>
              {/* Material: luz por píxel y petrificación (WebGL2) */}
              <canvas ref={canvasRef} className="md-gl" aria-hidden="true" />
              <div className="md-glare" aria-hidden="true" />
              <div className="md-canvas md-canvas--hot">
                {DETALLES_MEDUSA.map((d, i) => (
                  <button
                    key={d.id}
                    ref={(el) => {
                      hotspotRefs.current[i] = el;
                    }}
                    type="button"
                    className="md-hotspot"
                    style={{ left: `${(d.marca ?? d).x}%`, top: `${(d.marca ?? d).y}%` }}
                    // Cerca del borde derecho, el nombre se abre hacia la izquierda: en móvil no se recorta
                    data-lado={(d.marca ?? d).x > 65 ? "izquierda" : undefined}
                    aria-pressed={active === i}
                    aria-controls="md-panel"
                    aria-label={`${NUMERALES[i]}. ${d.nombre}: ${d.titulo}`}
                    onClick={() => select(active === i ? null : i)}
                  >
                    <span className="md-hotspot__ring" aria-hidden="true">
                      {NUMERALES[i]}
                    </span>
                    <span className="md-hotspot__name" aria-hidden="true">
                      {d.nombre}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="md-estado" data-estado={estado} role="status">
          <span aria-hidden="true" /> {ESTADO_TEXTO[estado]}
        </p>
        <div className="md-controls" role="group" aria-label="Controles del escudo">
          <button type="button" className="mf-btn md-petrify" aria-pressed={enPiedra} onClick={() => petrificar(!enPiedra)}>
            {enPiedra ? "Devolver la vida" : "Sostener la mirada"}
          </button>
          <button type="button" className="mf-btn" onClick={backToWork} disabled={active === null && !alterada}>
            Ver la obra auténtica
          </button>
        </div>
        <p className="md-hint">
          Inclina el escudo con el cursor o arrastrándolo. Toca un numeral para acercarte. Sostener la
          mirada lo convierte en piedra; siempre puedes devolverle la vida.
        </p>
      </div>

      <div id="md-panel" className="md-panel">
        <p className="sr-only" aria-live="polite">
          {detail ? `${detail.nombre}. ${detail.titulo}.` : "Vista completa del escudo."}
        </p>

        <nav aria-label="Detalles del escudo" className="md-index">
          <ul>
            {DETALLES_MEDUSA.map((d, i) => (
              <li key={d.id}>
                <button type="button" aria-pressed={active === i} aria-controls="md-panel" onClick={() => select(active === i ? null : i)}>
                  <span aria-hidden="true">{NUMERALES[i]}</span> {d.nombre}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className={`md-file ${active === null ? "is-active" : ""}`}>
          <p className="md-file__title">Cinco pruebas en un escudo.</p>
          <p className="md-file__text">
            Elige un detalle. El escudo girará hacia él y se abrirá su expediente: lo que dicen las
            fuentes y lo que se ha querido ver.
          </p>
        </div>
        <ol className="md-files">
          {DETALLES_MEDUSA.map((d, i) => (
            <li key={d.id} className={`md-file ${active === i ? "is-active" : ""}`}>
              <article aria-labelledby={`md-${d.id}`}>
                <p className="md-file__kicker">
                  {NUMERALES[i]} · {d.nombre}
                </p>
                <h3 id={`md-${d.id}`} className="md-file__title">
                  {d.titulo}
                </h3>
                <div className="md-file__block">
                  <KindTag tipo="hecho" />
                  <p>{d.hecho}</p>
                </div>
                <div className="md-file__block md-file__block--read">
                  <KindTag tipo="lectura" />
                  <p>{d.lectura}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
