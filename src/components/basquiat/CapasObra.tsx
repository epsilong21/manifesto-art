"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { CAPAS, HALLAZGOS, LIENZO_CAPAS, type CapaId } from "@/content/basquiat-capas";
import { GuiasCapas } from "./GuiasCapas";
import { PanelInspector, useInspector } from "./Inspector";

type Props = { src: string; width: number; height: number; alt: string; sizes: string };

const capaDe = (n: number) => CAPAS.find((c) => c.elementos.some((e) => e.n === n));
const pos = ([x, y]: [number, number]) => ({ left: `${(x / LIENZO_CAPAS.w) * 100}%`, top: `${(y / LIENZO_CAPAS.h) * 100}%` });

/** Separación mínima entre marcas y cuánto puede apartarse una de su sitio, en px. */
const HUECO = 2;
const DESVIO_MAX = 16;

/**
 * Aparta las marcas que se tocan en una lámina pequeña (p. ej. móvil en horizontal).
 * Es solo presentación: las coordenadas de las zonas no cambian. Prioridad: hallazgos,
 * números de la capa que se explica y, por último, los de las demás capas; cada marca
 * se desplaza lo justo respecto a las ya colocadas, por el eje de menor solape.
 */
function separarMarcas(lienzo: HTMLElement) {
  const orden = [
    ...lienzo.querySelectorAll<HTMLElement>(".bq-marca"),
    ...lienzo.querySelectorAll<HTMLElement>(".bq-num[data-principal]"),
    ...lienzo.querySelectorAll<HTMLElement>(".bq-num:not([data-principal])"),
  ];
  for (const m of orden) {
    m.style.removeProperty("--dx");
    m.style.removeProperty("--dy");
  }
  const colocadas: { x: number; y: number; w: number; h: number }[] = [];
  const tope = (v: number) => Math.max(-DESVIO_MAX, Math.min(DESVIO_MAX, v));
  for (const m of orden) {
    if (getComputedStyle(m).visibility === "hidden") continue;
    // Se mide lo que se ve: en las marcas «+», el cuadrado, no su área táctil de 44 px
    const r = (m.querySelector(".bq-marca__cuadro") ?? m).getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = 0;
    let dy = 0;
    for (let vuelta = 0; vuelta < 3; vuelta++) {
      let movida = false;
      for (const q of colocadas) {
        const ox = (r.width + q.w) / 2 + HUECO - Math.abs(cx + dx - q.x);
        const oy = (r.height + q.h) / 2 + HUECO - Math.abs(cy + dy - q.y);
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) dx += Math.sign(cx + dx - q.x || 1) * ox;
        else dy += Math.sign(cy + dy - q.y || 1) * oy;
        movida = true;
      }
      if (!movida) break;
    }
    dx = tope(dx);
    dy = tope(dy);
    if (dx || dy) {
      m.style.setProperty("--dx", `${dx.toFixed(1)}px`);
      m.style.setProperty("--dy", `${dy.toFixed(1)}px`);
    }
    colocadas.push({ x: cx + dx, y: cy + dy, w: r.width, h: r.height });
  }
}

/**
 * «Descifrar capas»: la pintura como lámina con cuatro capas que se combinan
 * libremente y cinco hallazgos que se abren desde la obra (marcas «+») o desde
 * el índice. Las capas solo dibujan contornos y números en sus bordes; los
 * nombres y los textos van fuera de la obra, en el panel. «Sin anotaciones»
 * lo oculta todo sin perder el estado. Escape cierra el hallazgo o la nota
 * abiertos y devuelve el foco al control que los abrió.
 *
 * «Examinar trazos» (P5) es una modalidad de la misma lámina: retira las
 * anotaciones mientras dura y, al salir (botón o Escape), todo vuelve como estaba.
 */
export function CapasObra({ src, width, height, alt, sizes }: Props) {
  // Capas activas en el orden en que se encendieron; `vista` es la que explica el panel
  const [activas, setActivas] = useState<CapaId[]>([]);
  const [vista, setVista] = useState<CapaId | null>(null);
  const [elemento, setElemento] = useState<number | null>(null);
  const [hallazgo, setHallazgo] = useState<number | null>(null);
  const [limpio, setLimpio] = useState(false);
  const [examinar, setExaminar] = useState(false);
  const { reticulaRef, lupaRef, lupaImgRef, region, mover, pulsar, irA } = useInspector(examinar);
  const botonExaminar = useRef<HTMLButtonElement>(null);
  const origen = useRef<HTMLElement | null>(null);
  const lectura = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const el = lienzo.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tras cada cambio de marcas visibles o de tamaño, antes de pintar
  useLayoutEffect(() => {
    if (lienzo.current) separarMarcas(lienzo.current);
  }, [activas, vista, hallazgo, limpio, ancho, examinar]);

  // Al examinar, obra y lupa tienen que verse a la vez: en móvil vertical la obra sube
  // arriba (la lupa queda debajo); en horizontal, la lámina entera (la lupa va al lado);
  // en escritorio, la mesa, solo si la lupa no cabe en pantalla
  const entrarExamen = () => {
    setExaminar(true);
    requestAnimationFrame(() => {
      const columna = matchMedia("(max-width: 63.99rem)").matches;
      const apaisado = matchMedia("(orientation: landscape)").matches;
      if (columna && !apaisado) lienzo.current?.scrollIntoView({ block: "start" });
      else if (columna) lienzo.current?.closest(".bq-tabla")?.scrollIntoView({ block: "start" });
      else {
        const lupa = document.querySelector(".bq-lupa")?.getBoundingClientRect();
        const mesa = lienzo.current?.closest(".bq-mesa");
        if (mesa && lupa && (lupa.bottom > innerHeight || mesa.getBoundingClientRect().top < 0)) mesa.scrollIntoView({ block: "start" });
      }
    });
  };

  const salirExamen = () => {
    setExaminar(false);
    botonExaminar.current?.focus();
  };

  const alternar = (id: CapaId) => {
    if (activas.includes(id)) {
      const resto = activas.filter((c) => c !== id);
      setActivas(resto);
      if (vista === id) setVista(resto.at(-1) ?? null);
      if (elemento !== null && capaDe(elemento)?.id === id) setElemento(null);
      return;
    }
    setActivas([...activas, id]);
    setVista(id);
    setElemento(null);
    setHallazgo(null);
    setLimpio(false);
  };

  const quitarCapas = () => {
    setActivas([]);
    setVista(null);
    setElemento(null);
  };

  // En una columna la lectura puede quedar fuera de la pantalla: se acerca lo justo
  // (con el desplazamiento del sitio: suave, o inmediato con movimiento reducido)
  const mostrarLectura = () =>
    requestAnimationFrame(() => {
      const r = lectura.current?.getBoundingClientRect();
      if (r && (r.top < 0 || r.top > innerHeight - 120)) lectura.current?.scrollIntoView({ block: "nearest" });
    });

  const abrirHallazgo = (n: number, desde: HTMLElement | null) => {
    origen.current = desde;
    setHallazgo(n);
    setElemento(null);
    setLimpio(false);
    mostrarLectura();
  };

  const elegirElemento = (n: number, desde: HTMLElement | null) => {
    origen.current = desde;
    setElemento(elemento === n ? null : n);
    setVista(capaDe(n)?.id ?? vista);
    setHallazgo(null);
    mostrarLectura();
  };

  const cerrar = () => {
    setHallazgo(null);
    setElemento(null);
    origen.current?.focus();
  };

  const teclas = (e: KeyboardEvent) => {
    if (e.key === "Escape" && examinar) {
      e.preventDefault();
      salirExamen();
      return;
    }
    if (e.key === "Escape" && (hallazgo !== null || elemento !== null)) {
      e.preventDefault();
      cerrar();
    }
  };

  const h = HALLAZGOS.find((x) => x.n === hallazgo);
  const capa = CAPAS.find((c) => c.id === vista);
  const el = capa?.elementos.find((x) => x.n === elemento);
  // Con tres o cuatro capas, la que se explica manda y las demás se atenúan (ver basquiat-capas.css)
  const jerarquia = activas.length >= 3 && !h;
  // La capa principal se dibuja la última: sus números quedan por encima
  const encendidas = CAPAS.filter((c) => activas.includes(c.id)).sort((a, b) => Number(a.id === vista) - Number(b.id === vista));

  return (
    <div className="bq-mesa" onKeyDown={teclas} data-examinar={examinar || undefined}>
      <div className="bq-mandos">
        <div className="bq-mandos__capas" role="group" aria-label="Capas">
          {CAPAS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="bq-capa-btn"
              aria-pressed={activas.includes(c.id)}
              onClick={() => alternar(c.id)}
              style={{ "--c": c.color } as CSSProperties}
            >
              <svg className="bq-capa-btn__muestra" viewBox="0 0 28 8" aria-hidden="true" focusable="false">
                <line x1="1" y1="4" x2="27" y2="4" strokeDasharray={c.trazo === "none" ? undefined : c.trazo} />
              </svg>
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="bq-mandos__aux">
          <button type="button" className="bq-aux" aria-pressed={limpio} onClick={() => setLimpio(!limpio)}>
            Sin anotaciones
          </button>
          <button type="button" className="bq-aux" onClick={quitarCapas} disabled={!activas.length}>
            Quitar capas
          </button>
          <button
            ref={botonExaminar}
            type="button"
            className="bq-aux bq-examinar"
            aria-pressed={examinar}
            onClick={() => (examinar ? salirExamen() : entrarExamen())}
          >
            <span className="bq-examinar__lente" aria-hidden="true" />
            Examinar trazos
          </button>
        </div>
      </div>

      <figure
        className="bq-tabla"
        data-limpio={limpio || undefined}
        data-hallazgo={h ? true : undefined}
        data-jerarquia={jerarquia || undefined}
        data-examinar={examinar || undefined}
      >
        <figcaption className="bq-tabla__rotulo">
          <span>Lám. II</span>
          <span>
            {examinar
              ? "Examinar trazos"
              : limpio
                ? "Sin anotaciones"
                : activas.length
                  ? CAPAS.filter((c) => activas.includes(c.id)).map((c) => c.nombre).join(" · ")
                  : "Capas"}
          </span>
        </figcaption>
        <div
          ref={lienzo}
          className="bq-tabla__lienzo"
          style={{ aspectRatio: `${width} / ${height}` }}
          onPointerDown={pulsar}
          onPointerMove={mover}
        >
          <Image src={src} width={width} height={height} alt={alt} sizes={sizes} quality={80} />
          <GuiasCapas activas={activas} vista={vista} elemento={elemento} hallazgo={hallazgo} />
          {/* Retícula del inspector: marca en la obra la región que muestra la lupa */}
          {examinar ? <div ref={reticulaRef} className="bq-reticula" aria-hidden="true" /> : null}
          {/* Números de las capas: atajo con puntero; con teclado se eligen en el panel */}
          {encendidas.map((c) =>
            c.elementos.map((e) => (
              <button
                key={e.n}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className="bq-num"
                data-principal={c.id === vista || undefined}
                data-sel={elemento === e.n || undefined}
                style={{ ...pos(e.marca), "--c": c.color } as CSSProperties}
                onClick={(ev) => elegirElemento(e.n, ev.currentTarget)}
              >
                {e.n}
              </button>
            )),
          )}
          {HALLAZGOS.map((x) => (
            <button
              key={x.n}
              type="button"
              className="bq-marca"
              aria-label={`Hallazgo ${x.n}: ${x.titulo}`}
              aria-pressed={hallazgo === x.n}
              style={pos(x.marca)}
              onClick={(ev) => (hallazgo === x.n ? cerrar() : abrirHallazgo(x.n, ev.currentTarget))}
            >
              <span className="bq-marca__cuadro" aria-hidden="true">
                +
              </span>
            </button>
          ))}
        </div>
      </figure>

      {/* Lectura antes que índice en el DOM y en pantalla: el orden de foco sigue al visual */}
      <div className="bq-panel">
        {/* Mientras se examina, el inspector ocupa el panel; lectura e índice siguen montados y vuelven tal cual */}
        {examinar ? (
          <PanelInspector
            src={src}
            width={width}
            height={height}
            lupaRef={lupaRef}
            lupaImgRef={lupaImgRef}
            region={region}
            irA={irA}
            onSalir={salirExamen}
          />
        ) : null}
        <div ref={lectura} className="bq-lectura" aria-live="polite" hidden={examinar}>
          {h ? (
            <article className="bq-hallazgo" aria-labelledby="bq-h-t">
              <p className="bq-lectura__k">
                Hallazgo {h.n} de {HALLAZGOS.length} · {h.pregunta}
              </p>
              <h3 id="bq-h-t" className="bq-lectura__t">
                {h.titulo}
              </h3>
              <p className="bq-lectura__texto">{h.texto}</p>
              <ul className="bq-entradas">
                {h.entradas.map((en) => (
                  <li key={en.texto}>
                    <p>{en.texto}</p>
                    <p className="bq-meta">
                      <KindTag tipo={en.tipo} /> <span>Fuente: {en.fuente}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <div className="bq-lectura__nav">
                <button type="button" className="bq-aux" onClick={() => abrirHallazgo(h.n === 1 ? HALLAZGOS.length : h.n - 1, origen.current)}>
                  Anterior
                </button>
                <button type="button" className="bq-aux" onClick={() => abrirHallazgo(h.n === HALLAZGOS.length ? 1 : h.n + 1, origen.current)}>
                  Siguiente
                </button>
                {h.capa && !activas.includes(h.capa) ? (
                  <button type="button" className="bq-aux" onClick={() => alternar(h.capa!)}>
                    Ver capa: {CAPAS.find((c) => c.id === h.capa)?.nombre}
                  </button>
                ) : null}
                <button type="button" className="bq-aux" onClick={cerrar}>
                  Cerrar <span className="bq-tecla" aria-hidden="true">Esc</span>
                </button>
              </div>
            </article>
          ) : capa ? (
            <div className="bq-leyenda" style={{ "--c": capa.color } as CSSProperties}>
              {activas.length > 1 ? (
                <div className="bq-pestanas" role="group" aria-label="Capa que se explica">
                  {CAPAS.filter((c) => activas.includes(c.id)).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={vista === c.id}
                      onClick={() => {
                        setVista(c.id);
                        setElemento(null);
                      }}
                      style={{ "--c": c.color } as CSSProperties}
                    >
                      {c.nombre}
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="bq-lectura__k">Capa</p>
              <h3 className="bq-lectura__t">{capa.nombre}</h3>
              <p className="bq-lectura__texto">{capa.intro.texto}</p>
              <p className="bq-meta">
                <KindTag tipo={capa.intro.tipo} /> <span>Fuente: {capa.intro.fuente}</span>
              </p>
              <ul className="bq-elementos" aria-label={`Zonas señaladas: ${capa.nombre}`}>
                {capa.elementos.map((e) => (
                  <li key={e.n}>
                    <button type="button" aria-pressed={elemento === e.n} onClick={(ev) => elegirElemento(e.n, ev.currentTarget)}>
                      <span className="bq-elementos__n" aria-hidden="true">
                        {e.n}
                      </span>
                      {e.nombre}
                    </button>
                  </li>
                ))}
              </ul>
              {el ? (
                <div className="bq-nota">
                  <p>
                    <strong>{el.nombre}.</strong> {el.nota}
                  </p>
                  <p className="bq-meta">
                    <KindTag tipo={el.tipo} />
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="bq-lectura__vacia">
              Enciende una o varias capas, en el orden que quieras, o abre un hallazgo desde la obra (+) o desde la
              lista. Las guías rodean la pintura; no la tapan.
            </p>
          )}
        </div>

        <div className="bq-indice" role="group" aria-label="Cinco hallazgos" hidden={examinar}>
          <p className="bq-panel__t" aria-hidden="true">
            Cinco hallazgos
          </p>
          <ol>
            {HALLAZGOS.map((x) => (
              <li key={x.n}>
                <button
                  type="button"
                  aria-pressed={hallazgo === x.n}
                  onClick={(ev) => (hallazgo === x.n ? cerrar() : abrirHallazgo(x.n, ev.currentTarget))}
                >
                  <span className="bq-indice__n" aria-hidden="true">
                    {x.n}
                  </span>
                  {x.titulo}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
