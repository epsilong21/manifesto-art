"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { GuiasObra, REVELAR, VelosObra } from "@/components/elefantes/GuiasObra";
import {
  CIERRE_LECTURA,
  DESCUBRIMIENTOS,
  NOTA_GUIAS,
  OBRA_ELEFANTES,
  type CapaLectura,
  type Descubrimiento,
  type Zona,
} from "@/content/elefantes";

const { imagen, alt, credito } = OBRA_ELEFANTES;
const CAPAS: CapaLectura[] = ["Composición", "Símbolo", "Contexto"];

/**
 * Resolución: nunca más de 1,5 px de pantalla por píxel de la reproducción.
 * Con un archivo autorizado de más resolución, el acercamiento crece solo.
 */
const PX_POR_PIXEL = 1.5;
/** Tope estético del acercamiento, por debajo del de resolución cuando este es mayor. */
const TOPE = 2.4;

type Vista = { s: number; x: number; y: number };
type Paso = { zona?: Zona; dur: number; ease: string };

/** Encuadre curado de una zona para un escenario de W × H px. Sin zona, la obra completa. */
function encuadre(zona: Zona | undefined, W: number, H: number): Vista {
  if (!zona) return { s: 1, x: 0, y: 0 };
  const zx = (zona.x / 100) * W;
  const zy = (zona.y / 100) * H;
  const zw = (zona.w / 100) * W;
  const zh = (zona.h / 100) * H;
  const ajuste = Math.min(W / (zw * 1.7), H / (zh * 1.7)); // la zona ocupa ~60 % del escenario
  const resolucion = (PX_POR_PIXEL * imagen.width) / W;
  const s = Math.max(1, Math.min(ajuste, resolucion, TOPE));
  const x = gsap.utils.clamp(W - W * s, 0, W / 2 - (zx + zw / 2) * s);
  const y = gsap.utils.clamp(H - H * s, 0, H / 2 - (zy + zh / 2) * s);
  return { s, x, y };
}

/** Movimiento de cámara propio de cada capítulo. */
function camara(d: Descubrimiento): Paso[] {
  switch (d.id) {
    case "colosos": // retrocede hasta abarcar a los dos
      return [{ dur: 1.1, ease: "power3.inOut" }];
    case "patas": // desciende por las patas, del cuerpo al suelo
      return [
        { zona: d.desde, dur: 0.7, ease: "power2.in" },
        { zona: d.zona, dur: 1.5, ease: "power1.inOut" },
      ];
    case "obeliscos": // se acerca despacio, hacia arriba
      return [{ zona: d.zona, dur: 1.5, ease: "power2.inOut" }];
    case "peso": // un acercamiento seco, como un golpe
      return [{ zona: d.zona, dur: 0.9, ease: "expo.inOut" }];
    case "desierto": // de las figuras diminutas a toda la amplitud del paisaje
      return [
        { zona: d.desde, dur: 0.9, ease: "power2.inOut" },
        { dur: 2.2, ease: "power2.inOut" },
      ];
  }
}

/**
 * La pintura en un solo escenario con dos modos: Ver (la obra completa, en
 * calma) y Descifrar (cinco capítulos, cada uno con su cámara, sus guías y su
 * revelación). La interpretación de MANIFESTO vive aparte, en su sección.
 */
export function ObraLectura() {
  const root = useRef<HTMLElement>(null);
  const escena = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const velos = useRef<HTMLDivElement>(null);
  const graf = useRef<HTMLDivElement>(null);
  const tituloCap = useRef<HTMLHeadingElement>(null);
  const botonDescifrar = useRef<HTMLButtonElement>(null);
  const movimiento = useRef(true);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [modo, setModo] = useState<"ver" | "descifrar">("ver");
  const [i, setI] = useState(0);
  const [capa, setCapa] = useState<CapaLectura>("Composición");
  const [ampliado, setAmpliado] = useState(false);
  const d = DESCUBRIMIENTOS[i];
  const capasDisponibles = CAPAS.filter((c) => d.entradas.some((e) => e.capa === c));
  const capaActiva = capasDisponibles.includes(capa) ? capa : capasDisponibles[0];
  const entrada = d.entradas.find((e) => e.capa === capaActiva)!;
  const ultimo = i === DESCUBRIMIENTOS.length - 1;

  /** Lleva cámara y guías al estado actual; sin animar, directamente al final. */
  const pinta = useCallback(
    (animar: boolean) => {
      const el = escena.current;
      if (!el) return;
      const W = el.clientWidth;
      const H = el.clientHeight;
      const q = gsap.utils.selector(el);
      const capas = [lienzo.current, velos.current, graf.current];
      tl.current?.progress(1).kill();
      const t = gsap.timeline({ paused: true });
      tl.current = t;
      // Capas compuestas solo mientras se mueven; en reposo se rasterizan nítidas
      t.set(capas, { willChange: "transform" }, 0);
      t.to(q(".ol-g, .ol-notas"), { autoAlpha: 0, duration: 0.25 }, 0);

      const cam = (v: Vista, dur: number, ease: string, en: number | string) => {
        t.to(capas, { x: v.x, y: v.y, scale: v.s, duration: dur, ease }, en);
        t.to(graf.current, { "--s": v.s, duration: dur, ease }, "<");
      };

      if (modo === "ver") {
        cam({ s: 1, x: 0, y: 0 }, 1.2, "power3.inOut", 0);
      } else {
        const sel = `[data-g="${d.id}"]`;
        let fin = 0.1;
        for (const p of camara(d)) {
          cam(encuadre(p.zona, W, H), p.dur, p.ease, fin);
          fin += p.dur;
        }
        t.to(q(sel), { autoAlpha: 1, duration: 0.6 }, 0.3);
        REVELAR[d.id](t, q, fin);
      }
      t.set(capas, { willChange: "auto" });
      if (animar && movimiento.current) t.play();
      else t.progress(1);
    },
    [modo, d],
  );

  // La revelación vuelve a montar el título: si tenía el foco, lo recupera el nuevo
  useEffect(() => {
    if (document.activeElement === document.body) tituloCap.current?.focus({ preventScroll: true });
  }, [i]);

  const pintaActual = useRef(pinta);
  useEffect(() => {
    pintaActual.current = pinta;
    pinta(true);
  }, [pinta]);

  // Recalcular solo si cambia el tamaño del escenario (rotación, ventana): la
  // primera notificación del observador no debe cortar la transición en curso
  useEffect(() => {
    const el = escena.current;
    if (!el) return;
    let previo = `${el.clientWidth}x${el.clientHeight}`;
    const ro = new ResizeObserver(() => {
      const ahora = `${el.clientWidth}x${el.clientHeight}`;
      if (ahora === previo) return;
      previo = ahora;
      pintaActual.current(false);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        movimiento.current = false;
        tl.current?.progress(1);
        return () => (movimiento.current = true);
      });
      return () => {
        mm.revert();
        tl.current?.kill();
      };
    },
    { scope: root },
  );

  const descifrar = (n = i) => {
    setI(n);
    setModo("descifrar");
    // En pantallas estrechas, la pintura vuelve a la vista
    const r = escena.current?.getBoundingClientRect();
    if (r && r.top < 0) escena.current?.scrollIntoView({ block: "start", behavior: movimiento.current ? "smooth" : "auto" });
    requestAnimationFrame(() => tituloCap.current?.focus({ preventScroll: true }));
  };
  const ver = () => {
    setModo("ver");
    requestAnimationFrame(() => botonDescifrar.current?.focus({ preventScroll: true }));
  };
  const paso = (delta: number) => setI((n) => (n + delta + DESCUBRIMIENTOS.length) % DESCUBRIMIENTOS.length);

  const teclas = (e: KeyboardEvent) => {
    if (modo !== "descifrar") return;
    if (e.key === "Escape") ver();
    else if (e.key === "ArrowRight") paso(1);
    else if (e.key === "ArrowLeft") paso(-1);
    else return;
    e.preventDefault();
  };

  return (
    <section ref={root} id="la-obra" className="ol" data-modo={modo} data-cap={modo === "descifrar" ? d.id : undefined} aria-labelledby="ol-t" onKeyDown={teclas}>
      <figure className="ol-obra">
        <div ref={escena} className="ol-escena">
          <div ref={lienzo} className="ol-lienzo">
            <Image src={imagen.src} width={imagen.width} height={imagen.height} alt={alt} quality={80} priority sizes="(min-width: 64rem) 64vw, 100vw" />
          </div>
          {/* Guías de MANIFESTO: encima de la obra, que no se altera */}
          <div ref={velos} className="ol-capa" aria-hidden="true">
            <VelosObra />
          </div>
          <div ref={graf} className="ol-capa ol-graf" aria-hidden="true">
            <GuiasObra />
          </div>
        </div>
        <figcaption className="ol-credito">
          {modo === "descifrar" ? (
            <span className="ol-credito__guias">
              <KindTag tipo="observacion" /> {NOTA_GUIAS}
            </span>
          ) : null}
          <span>{credito.corto}</span>
          <details>
            <summary>Imagen y autorización</summary>
            <p>
              {credito.obra} {credito.derechos}
            </p>
            <p>{credito.imagen}</p>
            <p>{credito.autorizacion}</p>
          </details>
        </figcaption>
      </figure>

      <div className="ol-texto">
        <p className="ol-autor">Salvador Dalí, 1948</p>
        <h1 id="ol-t" className="ol-t">
          Los elefantes
        </h1>

        <div className="ol-modos" role="group" aria-label="Modo de lectura">
          <button type="button" aria-pressed={modo === "ver"} onClick={ver}>
            Ver
          </button>
          <button ref={botonDescifrar} type="button" aria-pressed={modo === "descifrar"} onClick={() => descifrar()}>
            Descifrar
          </button>
          <a className="ol-modos__interpretar" href="#interpretacion">
            Interpretar
          </a>
        </div>

        {modo === "ver" ? (
          <div className="ol-ver">
            <p className="ol-sub">Toneladas de animal sobre patas de alambre: el equilibrio imposible de Dalí.</p>
            <button type="button" className="mf-btn mf-btn--solid" onClick={() => descifrar(0)}>
              Descifrar la obra en cinco capítulos
            </button>
          </div>
        ) : (
          <div className="ol-cap">
            <ol className="ol-recorrido" aria-label="Capítulos">
              {DESCUBRIMIENTOS.map((x, n) => (
                <li key={x.id}>
                  <button type="button" aria-current={n === i ? "step" : undefined} onClick={() => setI(n)}>
                    <span aria-hidden="true">{n + 1}</span>
                    <span className="sr-only">
                      Capítulo {n + 1}: {x.titulo}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div aria-live="polite">
              {/* La clave reinicia la revelación: pregunta → título → explicación */}
              <div key={d.id} className="ol-revela">
                <p className="ol-cap__n">
                  Capítulo {i + 1} de {DESCUBRIMIENTOS.length}
                </p>
                <p className="ol-cap__pregunta">{d.pregunta}</p>
                <h2 ref={tituloCap} tabIndex={-1} className="ol-cap__t">
                  {d.titulo}
                </h2>
                <p className="ol-cap__intro">{d.intro}</p>
              </div>
            </div>

            <div className="ol-ampliar">
              <button type="button" aria-expanded={ampliado} aria-controls="ol-capas" onClick={() => setAmpliado((a) => !a)}>
                <span aria-hidden="true">{ampliado ? "−" : "+"}</span> {ampliado ? "Cerrar" : "Ampliar"}: {capasDisponibles.join(" · ")}
              </button>
              <div id="ol-capas" hidden={!ampliado}>
                <div className="ol-capas" role="group" aria-label="Capa de lectura">
                  {capasDisponibles.map((c) => (
                    <button key={c} type="button" aria-pressed={c === capaActiva} onClick={() => setCapa(c)}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="ol-entrada" aria-live="polite">
                  <p>{entrada.texto}</p>
                  <p className="ol-entrada__meta">
                    <KindTag tipo={entrada.tipo} /> <span>Fuente: {entrada.fuente}</span>
                  </p>
                </div>
              </div>
            </div>
            {d.enlace ? (
              <a className="ol-enlace" href={d.enlace.href}>
                {d.enlace.texto}
              </a>
            ) : null}

            {ultimo ? (
              <aside className="ol-cierre" aria-labelledby="ol-cierre-t">
                <span className="ol-cierre__horizonte" aria-hidden="true" />
                <p id="ol-cierre-t" className="ol-cierre__t">
                  {CIERRE_LECTURA.titulo}
                </p>
                <p className="ol-cierre__texto">{CIERRE_LECTURA.texto}</p>
                <a className="mf-btn mf-btn--solid" href="#interpretacion">
                  {CIERRE_LECTURA.accion} <span aria-hidden="true">↓</span>
                </a>
              </aside>
            ) : null}

            <div className="ol-nav">
              <button type="button" className="mf-btn" onClick={() => paso(-1)} aria-label="Capítulo anterior">
                <span aria-hidden="true">←</span>
              </button>
              <button type="button" className="mf-btn" onClick={() => paso(1)} aria-label={ultimo ? "Volver al capítulo 1" : "Capítulo siguiente"}>
                <span aria-hidden="true">{ultimo ? "↺" : "→"}</span>
              </button>
              <button type="button" className="ol-nav__ver" onClick={ver}>
                Ver la obra completa
              </button>
            </div>
          </div>
        )}

        {/* Sin JavaScript: los cinco capítulos, legibles como texto */}
        <noscript>
          <ol className="ol-sinjs">
            {DESCUBRIMIENTOS.map((x) => (
              <li key={x.id}>
                <p className="ol-cap__pregunta">{x.pregunta}</p>
                <h2>{x.titulo}</h2>
                <p>{x.intro}</p>
                {x.entradas.map((e) => (
                  <p key={e.capa}>
                    <strong>{e.capa}.</strong> {e.texto} <small>({e.fuente})</small>
                  </p>
                ))}
              </li>
            ))}
          </ol>
          <p className="ol-sinjs__cierre">
            {CIERRE_LECTURA.titulo} <a href="#interpretacion">{CIERRE_LECTURA.accion}</a>
          </p>
        </noscript>
      </div>
    </section>
  );
}
