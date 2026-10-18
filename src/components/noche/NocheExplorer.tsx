"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { CAPAS, DETALLES_NOCHE, NOCHE, type Capa } from "@/content/noche";
import { focusOn, OVERVIEW } from "@/lib/focus";
import { KindTag } from "@/components/concepts/ConceptChrome";

type Filtro = "todo" | Capa;

/** Zonas de cada capa, en % de la obra (rx, ry relativos a ancho y alto). */
const ZONAS: { capa: Capa; cx: number; cy: number; rx: number; ry: number }[] = [
  { capa: "observacion", cx: 91.5, cy: 17, rx: 8, ry: 11 },
  { capa: "observacion", cx: 35, cy: 52, rx: 5.5, ry: 7 },
  { capa: "imaginacion", cx: 57, cy: 36, rx: 17, ry: 15 },
  { capa: "imaginacion", cx: 22, cy: 62, rx: 9, ry: 37 },
  { capa: "imaginacion", cx: 64, cy: 86, rx: 22, ry: 11 },
];
// Colinas: línea de horizonte observada desde la ventana
const COLINAS = "M40 70 C 48 66, 56 69, 64 64 S 80 60, 88 56 S 96 52, 100 53";

export function NocheExplorer() {
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [active, setActive] = useState<number | null>(null);
  const [wantsDetail, setWantsDetail] = useState(false);
  const [detailReady, setDetailReady] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const view = active === null ? OVERVIEW : focusOn(DETALLES_NOCHE[active]);
  const detail = active === null ? null : DETALLES_NOCHE[active];

  const close = () => {
    const prev = active;
    setActive(null);
    if (prev !== null) refs.current[prev]?.focus({ preventScroll: true });
  };

  const canvasStyle = { "--s": view.scale, "--tx": `${view.tx}%`, "--ty": `${view.ty}%` } as CSSProperties;

  return (
    <div
      className="nc-explore"
      data-filtro={filtro}
      onKeyDown={(e) => {
        if (e.key === "Escape" && active !== null) {
          e.stopPropagation();
          close();
        }
      }}
    >
      <fieldset className="nc-layers">
        <legend className="sr-only">Capa de lectura</legend>
        {(["todo", "observacion", "imaginacion"] as Filtro[]).map((f) => (
          <label key={f} className="nc-layer">
            <input
              type="radio"
              name="nc-capa"
              value={f}
              checked={filtro === f}
              onChange={() => {
                setFiltro(f);
                setActive(null);
              }}
            />
            <span>{f === "todo" ? "Toda la obra" : CAPAS[f].nombre}</span>
          </label>
        ))}
      </fieldset>
      <p className="nc-layer-desc" aria-live="polite">
        {filtro === "todo"
          ? "Lo que vio y lo que imaginó conviven en el mismo lienzo. Elige una capa para separarlos."
          : CAPAS[filtro].resumen}
      </p>

      <div className="nc-explore__grid">
        <figure className="nc-figure">
          <div className={`nc-stage ${active !== null ? "is-focus" : ""}`}>
            <div className="nc-canvas" style={canvasStyle}>
              <Image
                src={NOCHE.imagen.src}
                alt={NOCHE.imagen.alt}
                width={NOCHE.imagen.width}
                height={NOCHE.imagen.height}
                sizes="(min-width: 64rem) 66vw, 100vw"
                quality={70}
                draggable={false}
              />
              {wantsDetail && (
                <Image
                  src={NOCHE.imagen.src}
                  alt=""
                  width={NOCHE.imagen.width}
                  height={NOCHE.imagen.height}
                  sizes="(min-width: 64rem) 160vw, 240vw"
                  quality={80}
                  draggable={false}
                  onLoad={() => setDetailReady(true)}
                  className={`nc-detail ${detailReady ? "is-ready" : ""}`}
                />
              )}
              <svg className="nc-zones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {ZONAS.map((z, i) => (
                  <ellipse key={i} data-capa={z.capa} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} />
                ))}
                <path data-capa="observacion" d={COLINAS} />
              </svg>
              {DETALLES_NOCHE.map((d, i) => (
                <button
                  key={d.id}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  type="button"
                  className="nc-hotspot"
                  data-capa={d.capa}
                  data-edge={d.x > 80 ? "end" : undefined}
                  style={{ left: `${d.x}%`, top: `${d.y}%` }}
                  aria-pressed={active === i}
                  aria-controls="nc-panel"
                  aria-label={`${d.nombre} (${CAPAS[d.capa].nombre}): ${d.titulo}`}
                  onClick={() => {
                    setActive(active === i ? null : i);
                    setWantsDetail(true);
                  }}
                >
                  <span className="nc-hotspot__star" aria-hidden="true" />
                  <span className="nc-hotspot__label" aria-hidden="true">
                    {d.nombre}
                  </span>
                </button>
              ))}
            </div>
            {active !== null && (
              <button type="button" className="nc-back" onClick={close}>
                Volver a la obra completa
              </button>
            )}
          </div>
          <figcaption className="nc-caption">
            {NOCHE.autor}, <cite>{NOCHE.titulo}</cite>. {NOCHE.fecha}. {NOCHE.tecnica}, {NOCHE.medidas}.{" "}
            {NOCHE.museo}.
          </figcaption>
        </figure>

        <div id="nc-panel" className="nc-panel">
          <p className="sr-only" aria-live="polite">
            {detail ? `${detail.nombre}. ${detail.titulo}.` : "Obra completa."}
          </p>
          <div className={`nc-card ${active === null ? "is-active" : ""}`}>
            <p className="nc-card__title">Cinco puntos de luz</p>
            <p className="nc-card__text">
              Toca una estrella sobre la pintura. Las de trazo lleno marcan lo observado; las de
              contorno, lo imaginado.
            </p>
            <ul className="nc-legend">
              <li data-capa="observacion">Observación: según el MoMA, visto desde la ventana</li>
              <li data-capa="imaginacion">Imaginación: añadido, desplazado o transformado</li>
            </ul>
          </div>
          <ol className="nc-cards">
            {DETALLES_NOCHE.map((d, i) => (
              <li key={d.id} className={`nc-card ${active === i ? "is-active" : ""}`}>
                <article aria-labelledby={`nc-${d.id}`}>
                  <KindTag tipo={d.capa} />
                  <h3 id={`nc-${d.id}`} className="nc-card__title">
                    {d.titulo}
                  </h3>
                  <p className="nc-card__text">{d.texto}</p>
                  {d.lectura ? (
                    <div className="nc-card__read">
                      <KindTag tipo="lectura" />
                      <p>{d.lectura}</p>
                    </div>
                  ) : null}
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
