"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CAPAS, DETALLES_NOCHE, NOCHE, type Capa } from "@/content/noche";
import { focusOn, OVERVIEW } from "@/lib/focus";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { alternarCielo, useCieloPausado, useMovimientoReducido } from "./cielo";
import { SkyField } from "./SkyField";

type Filtro = "todo" | Capa;
type Efecto = "halo" | "anillos" | "corrientes" | "silueta" | "calma";

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
/** Silueta del ciprés calcada sobre la reproducción (en % de la obra), con sus tres llamas. */
const CIPRES: [number, number][] = [
  [19.5, 7], [20, 14], [20.6, 21], [22, 28], [23.5, 33], [24, 40], [24.8, 46], [25.2, 53], [25.6, 58],
  [29, 57], [30.8, 62.5], [33, 67.5], [35.2, 72], [38, 76.5], [40.2, 81.5], [41.8, 87.5], [43, 94], [43.5, 100],
  [12, 100], [12.7, 90], [13.8, 80], [14.6, 69], [14.8, 59], [14.7, 49], [15.1, 39], [15.3, 31.5], [17.6, 36],
  [18.4, 30], [18.7, 21], [19, 11],
];
const SILUETA = CIPRES.map(([u, v], i) => `${i ? "L" : "M"}${u} ${v}`).join(" ") + " Z";

/**
 * Cómo se descubre cada elemento: una capa visual de MANIFESTO, siempre
 * reversible, sobre la reproducción intacta. «nota» describe la capa, no la obra.
 */
const EFECTOS: Record<string, { efecto: Efecto; nota: string }> = {
  luna: { efecto: "halo", nota: "Halo cálido alrededor de la luna" },
  venus: { efecto: "anillos", nota: "Anillos de luz alrededor de Venus" },
  remolino: { efecto: "corrientes", nota: "Corrientes que siguen el giro de las pinceladas" },
  cipres: { efecto: "silueta", nota: "La silueta del ciprés, con el resto en penumbra" },
  pueblo: { efecto: "calma", nota: "El cielo sigue en movimiento; el pueblo, quieto" },
};

/** «La luna» → «la luna»; los nombres propios («Venus») no cambian. */
const enFrase = (nombre: string) => nombre.replace(/^(El|La|Los|Las) /, (m) => m.toLowerCase());

/** Duración del cambio de encuadre (igual que la transición de .nc-canvas). */
const VIAJE_MS = 1100;

export function NocheExplorer() {
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const [active, setActive] = useState<number | null>(null);
  const [vistos, setVistos] = useState<ReadonlySet<number>>(() => new Set());
  const [capasLuz, setCapasLuz] = useState(true);
  const [viajando, setViajando] = useState(false);
  const [wantsDetail, setWantsDetail] = useState(false);
  const [detailReady, setDetailReady] = useState(false);
  const paused = useCieloPausado();
  const reduced = useMovimientoReducido();
  const stageRef = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const detail = active === null ? null : DETALLES_NOCHE[active];
  const fx = detail ? EFECTOS[detail.id] : null;
  const view = useMemo(
    () => (detail ? focusOn({ ...detail, ...detail.foco }) : OVERVIEW),
    [detail],
  );
  const skyView = useMemo(() => ({ scale: view.scale, tx: view.tx, ty: view.ty }), [view]);

  // Mientras el encuadre viaja, las corrientes se apagan y vuelven ya colocadas
  const viaje = useRef(0);
  useEffect(() => () => window.clearTimeout(viaje.current), []);
  const encuadrar = (i: number | null) => {
    setActive(i);
    setViajando(true);
    window.clearTimeout(viaje.current);
    viaje.current = window.setTimeout(() => setViajando(false), VIAJE_MS);
  };

  const abrir = (i: number) => {
    if (active === i) return cerrar();
    encuadrar(i);
    setVistos((v) => new Set(v).add(i));
    setWantsDetail(true);
  };

  // Desde el índice (en móvil, bajo la obra): primero la mirada, así que la obra vuelve a la vista
  const abrirDesdeIndice = (i: number) => {
    abrir(i);
    const stage = stageRef.current;
    if (stage && stage.getBoundingClientRect().top < 0) {
      stage.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    }
  };

  const elegirCapa = (f: Filtro) => {
    setFiltro(f);
    if (active !== null) encuadrar(null);
  };

  const cerrar = () => {
    const prev = active;
    encuadrar(null);
    if (prev !== null) refs.current[prev]?.focus({ preventScroll: true });
  };

  // Sugerencia, nunca obligación: el siguiente sin descubrir (o el siguiente sin más)
  const siguiente =
    active === null
      ? null
      : (Array.from({ length: DETALLES_NOCHE.length - 1 }, (_, k) => (active + 1 + k) % DETALLES_NOCHE.length).find(
          (i) => !vistos.has(i),
        ) ?? (active + 1) % DETALLES_NOCHE.length);

  // Corrientes: tenues en la vista general; protagonistas en las pinceladas; ausentes
  // cuando otra capa (halo, silueta, composición) necesita la atención
  const corrientes = !capasLuz
    ? null
    : active === null
      ? filtro === "todo"
        ? { intensity: 0.5, swirl: 1 }
        : null
      : fx?.efecto === "corrientes"
        ? { intensity: 1.25, swirl: 1.9 }
        : fx?.efecto === "calma"
          ? { intensity: 0.95, swirl: 1.2 }
          : null;

  const canvasStyle = { "--s": view.scale, "--tx": `${view.tx}%`, "--ty": `${view.ty}%` } as CSSProperties;
  const stageStyle = { "--sx": `${view.spotX}%`, "--sy": `${view.spotY}%`, "--sr": view.spotR } as CSSProperties;

  return (
    <div
      className="nc-explore"
      data-filtro={filtro}
      data-efecto={capasLuz && fx ? fx.efecto : undefined}
      data-capas={capasLuz ? "si" : "no"}
      onKeyDown={(e) => {
        if (e.key === "Escape" && active !== null) {
          e.stopPropagation();
          cerrar();
        }
      }}
    >
      <div className="nc-explore__grid">
        <figure className="nc-figure">
          <div ref={stageRef} className={`nc-stage ${active !== null ? "is-focus" : ""}`} style={stageStyle}>
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
                  sizes="(min-width: 64rem) 150vw, 220vw"
                  quality={80}
                  draggable={false}
                  onLoad={() => setDetailReady(true)}
                  className={`nc-detail ${detailReady ? "is-ready" : ""}`}
                />
              )}

              {/* Capas de MANIFESTO: la reproducción queda debajo, intacta */}
              <svg className="nc-veils" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <filter id="nc-suave" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.9" />
                  </filter>
                  <mask id="nc-m-silueta" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                    <rect width="100" height="100" fill="#fff" />
                    <path d={SILUETA} fill="#000" filter="url(#nc-suave)" />
                  </mask>
                  {(["observacion", "imaginacion"] as Capa[]).map((c) => (
                    <mask key={c} id={`nc-m-${c}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
                      <rect width="100" height="100" fill="#fff" />
                      {ZONAS.filter((z) => z.capa === c).map((z, i) => (
                        <ellipse key={i} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill="#000" filter="url(#nc-suave)" />
                      ))}
                    </mask>
                  ))}
                </defs>
                <rect className="nc-veil nc-veil--silueta" width="100" height="100" mask="url(#nc-m-silueta)" />
                <rect className="nc-veil nc-veil--observacion" width="100" height="100" mask="url(#nc-m-observacion)" />
                <rect className="nc-veil nc-veil--imaginacion" width="100" height="100" mask="url(#nc-m-imaginacion)" />
                <path className="nc-silueta" d={SILUETA} pathLength={1} />
              </svg>
              <svg className="nc-zones" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {ZONAS.map((z, i) => (
                  <ellipse key={i} data-capa={z.capa} cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} />
                ))}
                <path data-capa="observacion" d={COLINAS} />
              </svg>
              {DETALLES_NOCHE.map((d) =>
                d.id === "luna" ? (
                  <span key={d.id} className="nc-halo" style={{ left: `${d.x}%`, top: `${d.y}%` }} aria-hidden="true" />
                ) : d.id === "venus" ? (
                  <span key={d.id} className="nc-rings" style={{ left: `${d.x}%`, top: `${d.y}%` }} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null,
              )}

              {/* Puntos de luz sobre la pintura: para el puntero y el tacto. El teclado y
                  los lectores de pantalla usan el índice de al lado, con los mismos nombres. */}
              {DETALLES_NOCHE.map((d, i) => (
                <button
                  key={d.id}
                  type="button"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="nc-hotspot"
                  data-capa={d.capa}
                  data-edge={d.x > 80 ? "end" : undefined}
                  data-visto={vistos.has(i) || undefined}
                  style={{ left: `${d.x}%`, top: `${d.y}%`, "--i": i } as CSSProperties}
                  aria-pressed={active === i}
                  onClick={() => abrir(i)}
                >
                  <span className="nc-hotspot__star" />
                  <span className="nc-hotspot__label">{d.nombre}</span>
                </button>
              ))}
            </div>
            <div className="nc-lantern" aria-hidden="true" />
            <SkyField
                targetRef={stageRef}
                className="nc-field nc-field--stage"
                paused={paused || reduced}
                hidden={!corrientes || viajando}
                view={skyView}
                intensity={corrientes?.intensity ?? 0.5}
                swirl={corrientes?.swirl ?? 1}
                density={1.5}
              />
            {active !== null && (
              <button type="button" className="nc-back" onClick={cerrar}>
                Volver a la obra completa
              </button>
            )}
            {fx && capasLuz && (
              <p className="nc-fxnote" key={detail?.id}>
                <span>Capa visual</span> {fx.nota}
              </p>
            )}
          </div>
          <div className="nc-tools" role="group" aria-label="Capas visuales">
            <button type="button" className="nc-tool" aria-pressed={capasLuz} onClick={() => setCapasLuz((c) => !c)}>
              Capas de luz
            </button>
            {!reduced && (
              <button type="button" className="nc-tool" aria-pressed={paused} onClick={alternarCielo}>
                {paused ? "Reanudar el cielo" : "Pausar el cielo"}
              </button>
            )}
          </div>
          <figcaption className="nc-caption">
            {NOCHE.autor}, <cite>{NOCHE.titulo}</cite>. {NOCHE.fecha}. {NOCHE.tecnica}, {NOCHE.medidas}.{" "}
            {NOCHE.museo}.
          </figcaption>
        </figure>

        <div className="nc-side">
          {/* La obra ya está a la vista: el encabezado acompaña, no vuelve a presentarla */}
          <header className="nc-intro">
            <h2 id="nc-obs-t" className="nc-intro__title">
              Observación <em>e</em> imaginación
            </h2>
            <p>
              El MoMA lo resume así: el cuadro es a la vez un ejercicio de observación y un claro
              alejamiento de ella.
            </p>
          </header>

          <nav className="nc-index" aria-label="Cinco descubrimientos">
            {/* Cada grupo es también la capa de lectura: su nombre la resalta sobre la obra */}
            {(["observacion", "imaginacion"] as Capa[]).map((c) => (
              <div key={c} className="nc-group" data-capa={c}>
                <button
                  type="button"
                  className="nc-group__filter"
                  aria-pressed={filtro === c}
                  onClick={() => elegirCapa(filtro === c ? "todo" : c)}
                >
                  {CAPAS[c].nombre}
                  <span className="sr-only">: resaltar en la obra</span>
                </button>
                <ul>
                  {DETALLES_NOCHE.map((d, i) =>
                    d.capa !== c ? null : (
                <li key={d.id}>
                  <button
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    type="button"
                    className="nc-chip"
                    data-capa={d.capa}
                    data-visto={vistos.has(i) || undefined}
                    aria-pressed={active === i}
                    aria-controls="nc-panel"
                    onClick={() => abrirDesdeIndice(i)}
                  >
                    <span className="nc-chip__star" aria-hidden="true" />
                    {d.nombre}
                    <span className="sr-only">
                      {" "}
                      ({CAPAS[d.capa].nombre}){vistos.has(i) ? ", ya descubierto" : ""}
                    </span>
                  </button>
                </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
            <p className="nc-count" aria-live="polite">
              {filtro !== "todo"
                ? CAPAS[filtro].resumen
                : vistos.size === 0
                  ? "Toca una luz sobre la pintura o elige aquí, en el orden que quieras."
                  : `${vistos.size} de ${DETALLES_NOCHE.length} descubiertos.`}
            </p>
          </nav>

          <div id="nc-panel" className="nc-panel">
            <p className="sr-only" aria-live="polite">
              {detail ? `${detail.nombre}. ${detail.titulo}.` : "Obra completa."}
            </p>
            <ol className="nc-cards">
              {DETALLES_NOCHE.map((d, i) => (
                <li key={d.id} className={`nc-card ${active === i ? "is-active" : ""}`}>
                  <article aria-labelledby={`nc-${d.id}`}>
                    <KindTag tipo={d.capa} />
                    <h3 id={`nc-${d.id}`} className="nc-card__title">
                      {d.titulo}
                    </h3>
                    <p className="nc-card__text">{d.texto}</p>
                    <details className="nc-more">
                      <summary>{d.lectura ? "Interpretación y capa visual" : "Sobre la capa visual"}</summary>
                      {d.lectura ? (
                        <div className="nc-card__read">
                          <KindTag tipo="lectura" />
                          <p>{d.lectura}</p>
                        </div>
                      ) : null}
                      <p className="nc-more__fx">
                        {EFECTOS[d.id].nota}: es una capa de MANIFESTO sobre la reproducción, que no cambia.
                        Puedes quitarla con «Capas de luz».
                      </p>
                    </details>
                    {active === i && siguiente !== null && (
                      <p className="nc-next">
                        <button type="button" onClick={() => abrirDesdeIndice(siguiente)}>
                          Seguir con {enFrase(DETALLES_NOCHE[siguiente].nombre)}
                        </button>
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
