"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { CAPAS_GLENN, HALLAZGOS_GLENN, LIENZO_GLENN, OBRA_GLENN, REGIONES_GLENN, ZONAS_GLENN } from "@/content/glenn";
import { EsquemaGlenn } from "./EsquemaGlenn";

type Modo = "hallazgos" | "capas" | "fotocopiar" | "ampliar";
type CapaId = (typeof CAPAS_GLENN)[number]["id"];

const MODOS: { id: Modo; nombre: string }[] = [
  { id: "hallazgos", nombre: "Hallazgos" },
  { id: "capas", nombre: "Capas" },
  { id: "fotocopiar", nombre: "Fotocopiar" },
  { id: "ampliar", nombre: "Ampliar" },
];

const PASOS_ZOOM = [1, 1.5, 2, 3, 4];
/** Hasta dónde se amplía la reproducción: como mucho 2,5 px de pantalla por píxel del archivo. */
const AMPLIACION_MAX_ARCHIVO = 2.5;
const DEV = process.env.NODE_ENV === "development";

/**
 * «Mirar de cerca»: una sola escena con cuatro maneras de mirar la obra.
 * - Hallazgos: cinco puntos numerados; cada uno abre su ficha (aria-live) con su etiqueta.
 * - Capas: separa figura, fondo y gesto con zonas aproximadas, y una vista solo de valores.
 * - Fotocopiar: una luz que se arrastra (o un deslizador) y deja a su paso una simulación
 *   de fotocopia en blanco y negro. Filtro en pantalla, nunca una alteración del archivo.
 * - Ampliar: zoom ×1–×4 y desplazamiento por arrastre, flechas o regiones predefinidas.
 *
 * Sin reproducción, la escena usa el esquema propio de MANIFESTO (la fotocopiadora
 * queda desactivada: no hay nada que copiar). Sin JavaScript, los hallazgos se leen
 * como lista. Sin animación continua: solo transiciones al interactuar.
 */
export function MesaDeLuz({ conImagen }: { conImagen: boolean }) {
  const { imagen, alt } = OBRA_GLENN;
  const proporcion = conImagen ? imagen.width / imagen.height : LIENZO_GLENN.w / LIENZO_GLENN.h;
  const base = useId();
  const [modo, setModo] = useState<Modo>("hallazgos");
  const [activo, setActivo] = useState<string | null>(null);
  const [capas, setCapas] = useState<Set<CapaId>>(() => new Set<CapaId>(["figura"]));
  const [valores, setValores] = useState(false);
  const [corte, setCorte] = useState(38);
  const [zoom, setZoom] = useState(1);
  // El techo del zoom depende del ancho del visor y de la resolución del archivo (sin archivo, el esquema es vectorial)
  const [zoomMax, setZoomMax] = useState(PASOS_ZOOM[PASOS_ZOOM.length - 1]);
  const [calibrar, setCalibrar] = useState<string | null>(null);

  const visor = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const centro = useRef({ x: 0.5, y: 0.5 });
  const arrastre = useRef<{ id: number; x: number; y: number } | null>(null);
  const marco = useRef(0);

  const pintar = useCallback(() => {
    marco.current = 0;
    const v = visor.current;
    const l = lienzo.current;
    if (!v || !l) return;
    if (modo !== "ampliar" || zoom === 1) {
      l.style.transform = "";
      return;
    }
    const m = 1 / (2 * zoom);
    const cx = Math.min(1 - m, Math.max(m, centro.current.x));
    const cy = Math.min(1 - m, Math.max(m, centro.current.y));
    centro.current = { x: cx, y: cy };
    const w = v.clientWidth;
    const h = v.clientHeight;
    l.style.transform = `translate3d(${w / 2 - cx * w * zoom}px, ${h / 2 - cy * h * zoom}px, 0) scale(${zoom})`;
  }, [modo, zoom]);

  const programar = useCallback(() => {
    if (!marco.current) marco.current = requestAnimationFrame(pintar);
  }, [pintar]);

  useEffect(() => {
    pintar();
    const ro = new ResizeObserver(() => {
      const v = visor.current;
      if (v && conImagen && v.clientWidth) {
        const limite = (AMPLIACION_MAX_ARCHIVO * imagen.width) / v.clientWidth;
        const tope = PASOS_ZOOM.filter((p) => p <= Math.max(1.5, limite)).pop() ?? 1.5;
        setZoomMax(tope);
        setZoom((z) => Math.min(z, tope));
      }
      programar();
    });
    if (visor.current) ro.observe(visor.current);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(marco.current);
      marco.current = 0;
    };
  }, [pintar, programar, conImagen, imagen.width]);

  const cambiarModo = (m: Modo) => {
    setModo(m);
    if (m !== "hallazgos") setActivo(null);
  };

  const fraccion = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };

  const pulsar = (e: PointerEvent<HTMLDivElement>) => {
    // Ayuda de calibración, solo en next dev: /conceptos/glenn?calibrar
    if (DEV && new URLSearchParams(location.search).has("calibrar")) {
      // Coordenadas en fracciones de la imagen sin ampliar (la ayuda solo mide con zoom ×1)
      const { x, y } = fraccion(e);
      const t = `x: ${x.toFixed(3)}, y: ${y.toFixed(3)}`;
      console.info(`[Glenn · calibrar] ${t}`);
      setCalibrar(t);
    }
    if (modo === "fotocopiar" && conImagen) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setCorte(Math.round(fraccion(e).x * 100));
    } else if (modo === "ampliar" && zoom > 1) {
      e.currentTarget.setPointerCapture(e.pointerId);
      arrastre.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      // Durante el arrastre la imagen sigue al dedo sin la transición del zoom
      e.currentTarget.setAttribute("data-arrastrando", "");
    }
  };

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    if (modo === "fotocopiar" && conImagen && e.buttons & 1) {
      setCorte(Math.round(fraccion(e).x * 100));
      return;
    }
    const a = arrastre.current;
    const v = visor.current;
    if (modo !== "ampliar" || !a || a.id !== e.pointerId || !v) return;
    centro.current = {
      x: centro.current.x - (e.clientX - a.x) / (v.clientWidth * zoom),
      y: centro.current.y - (e.clientY - a.y) / (v.clientHeight * zoom),
    };
    arrastre.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    programar();
  };

  const soltar = () => {
    arrastre.current = null;
    visor.current?.removeAttribute("data-arrastrando");
  };

  const ampliar = (z: number) => setZoom(Math.min(zoomMax, Math.max(1, z)));
  const siguientePaso = (d: 1 | -1) => {
    const i = PASOS_ZOOM.findIndex((p) => p >= zoom);
    const actual = i < 0 ? PASOS_ZOOM.length - 1 : i;
    ampliar(PASOS_ZOOM[Math.min(PASOS_ZOOM.length - 1, Math.max(0, actual + d))]);
  };
  const irA = (x: number, y: number) => {
    centro.current = { x, y };
    if (zoom < 2) setZoom(Math.min(2, zoomMax));
    else programar();
  };

  const teclasVisor = (e: KeyboardEvent<HTMLDivElement>) => {
    if (modo !== "ampliar") return;
    const paso = 0.08 / zoom;
    const mov: Record<string, [number, number]> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] };
    if (mov[e.key] && zoom > 1) {
      e.preventDefault();
      centro.current = { x: centro.current.x + mov[e.key][0], y: centro.current.y + mov[e.key][1] };
      programar();
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      siguientePaso(1);
    } else if (e.key === "-") {
      e.preventDefault();
      siguientePaso(-1);
    } else if (e.key === "0") {
      e.preventDefault();
      setZoom(1);
    }
  };

  const teclasTabs = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = MODOS.findIndex((m) => m.id === modo);
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const j = e.key === "Home" ? 0 : e.key === "End" ? MODOS.length - 1 : (i + d + MODOS.length) % MODOS.length;
    cambiarModo(MODOS[j].id);
    document.getElementById(`${base}-tab-${MODOS[j].id}`)?.focus();
  };

  const alternarCapa = (id: CapaId) =>
    setCapas((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const hallazgo = HALLAZGOS_GLENN.find((h) => h.id === activo) ?? null;
  const m = ZONAS_GLENN.mascara;
  const b = ZONAS_GLENN.boca;
  const { columnas, filas } = ZONAS_GLENN.hojas;
  // Con la reproducción, el contorno medido de la cabeza; con el esquema, su elipse
  const figura = conImagen
    ? `M${ZONAS_GLENN.contorno.map(([x, y]) => `${x * 100} ${y * 100}`).join("L")}Z`
    : `M${m.cx * 100 - m.rx * 100} ${m.cy * 100} a${m.rx * 100} ${m.ry * 100} 0 1 0 ${m.rx * 200} 0 a${m.rx * 100} ${m.ry * 100} 0 1 0 ${-m.rx * 200} 0Z`;
  const xs = conImagen ? ZONAS_GLENN.contorno.map(([x]) => x) : [m.cx + m.rx];
  const ys = conImagen ? ZONAS_GLENN.contorno.map(([, y]) => y) : [m.cy - m.ry];
  const copiando = modo === "fotocopiar" && conImagen;
  // En el inspector, una variante más ancha para que el zoom no se vea borroso antes de tiempo
  const sizes = modo === "ampliar" ? "(min-width: 64rem) 180vw, 300vw" : "(min-width: 64rem) 66vw, 100vw";

  return (
    <section id="gl-mesa" className="gl-seccion gl-mesa" aria-labelledby="gl-mesa-t" data-modo={modo}>
      <header className="gl-seccion__cab">
        <p className="gl-seccion__n">02</p>
        <h2 id="gl-mesa-t" className="gl-h2">
          Mirar de cerca
        </h2>
        <p className="gl-seccion__intro">
          Una mesa de luz con cuatro maneras de mirar: abre los hallazgos, separa las capas, pasa la obra por la
          fotocopiadora o amplíala.
        </p>
      </header>

      <div className="gl-mesa__cuerpo">
        <div className="gl-mesa__escena" style={{ "--gl-ratio": proporcion } as CSSProperties}>
          <div
            ref={visor}
            className="gl-visor"
            style={{ aspectRatio: proporcion }}
            data-arrastrable={(modo === "ampliar" && zoom > 1) || copiando ? "" : undefined}
            tabIndex={modo === "ampliar" ? 0 : undefined}
            role={modo === "ampliar" ? "group" : undefined}
            aria-label={modo === "ampliar" ? `Obra ampliada ×${zoom}. Flechas: desplazar; + y −: zoom; 0: restablecer.` : undefined}
            onPointerDown={pulsar}
            onPointerMove={mover}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            onKeyDown={teclasVisor}
          >
            <div ref={lienzo} className="gl-visor__lienzo">
              <div className="gl-visor__obra" data-valores={valores && modo === "capas" ? "" : undefined}>
                {conImagen ? <Image src={imagen.src} width={imagen.width} height={imagen.height} alt={alt} sizes={sizes} quality={80} /> : <EsquemaGlenn />}
              </div>

              {copiando ? (
                <div className="gl-copia" style={{ clipPath: `inset(0 ${100 - corte}% 0 0)` }} aria-hidden="true">
                  <Image src={imagen.src} width={imagen.width} height={imagen.height} alt="" sizes={sizes} quality={80} />
                </div>
              ) : null}
              {copiando ? <div className="gl-copia__luz" style={{ left: `${corte}%` }} aria-hidden="true" /> : null}

              {modo === "capas" ? (
                <>
                  <svg className="gl-capas" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {capas.has("figura") ? (
                      <path
                        className="gl-capas__foco"
                        fillRule="evenodd"
                        d={`M0 0H100V100H0Z ${figura}`}
                      />
                    ) : null}
                    {capas.has("fondo") ? (
                      <g className="gl-capas__hojas">
                        {/* La retícula solo orienta en el esquema: sobre la pintura no coincidiría con las hojas reales */}
                        {conImagen
                          ? null
                          : [
                              ...Array.from({ length: columnas - 1 }, (_, i) => (
                                <line key={`c${i}`} x1={((i + 1) * 100) / columnas} y1="0" x2={((i + 1) * 100) / columnas} y2="100" />
                              )),
                              ...Array.from({ length: filas - 1 }, (_, i) => (
                                <line key={`f${i}`} x1="0" y1={((i + 1) * 100) / filas} x2="100" y2={((i + 1) * 100) / filas} />
                              )),
                            ]}
                        <path d={figura} className="gl-capas__tapa" />
                      </g>
                    ) : null}
                    {capas.has("gesto") ? (
                      <g className="gl-capas__gesto">
                        <path d={figura} />
                        <ellipse cx={b.cx * 100} cy={b.cy * 100} rx={b.rx * 100} ry={b.ry * 100} />
                      </g>
                    ) : null}
                  </svg>
                  {capas.has("fondo") ? (
                    <span className="gl-capas__etq gl-capas__etq--fondo" aria-hidden="true">
                      A máquina
                    </span>
                  ) : null}
                  {capas.has("gesto") ? (
                    <span
                      className="gl-capas__etq gl-capas__etq--gesto"
                      style={{ left: `${(Math.max(...xs) - 0.1) * 100}%`, top: `${Math.min(...ys) * 100}%` }}
                      aria-hidden="true"
                    >
                      A mano
                    </span>
                  ) : null}
                </>
              ) : null}

              {modo === "hallazgos" ? (
                <>
                  {hallazgo ? (
                    <div className="gl-foco" style={{ "--x": `${hallazgo.x * 100}%`, "--y": `${hallazgo.y * 100}%` } as CSSProperties} aria-hidden="true" />
                  ) : null}
                  {HALLAZGOS_GLENN.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className="gl-punto"
                      data-tipo={h.tipo}
                      style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
                      aria-pressed={activo === h.id}
                      aria-label={`${h.n}. ${h.titulo}`}
                      onClick={() => setActivo(activo === h.id ? null : h.id)}
                    >
                      {h.n}
                    </button>
                  ))}
                </>
              ) : null}
            </div>
          </div>

          {copiando ? (
            <label className="gl-corte">
              <span className="sr-only">Posición de la luz de copia</span>
              <input type="range" min={0} max={100} value={corte} onChange={(e) => setCorte(Number(e.target.value))} aria-valuetext={`${corte} % copiado`} />
            </label>
          ) : null}
          <p className="gl-escena__pie">
            {modo === "fotocopiar"
              ? conImagen
                ? "A la izquierda de la luz, un filtro de MANIFESTO en pantalla: blanco y negro con mucho contraste. No es una fotocopia real ni altera el archivo."
                : "La fotocopiadora necesita la reproducción de la obra; con el esquema no hay nada que copiar."
              : modo === "ampliar"
                ? `Ampliación de la misma reproducción, hasta ×${zoomMax}: el límite lo marca la resolución del archivo.`
                : "Puntos y zonas situados a mano, de forma aproximada. Son una guía para mirar, no medidas."}
          </p>
          {calibrar !== null ? (
            <output className="gl-calibrar" aria-live="polite">
              Calibrar: {calibrar}
            </output>
          ) : null}
        </div>

        <div className="gl-mandos">
          <div role="tablist" aria-label="Maneras de mirar" className="gl-tabs" onKeyDown={teclasTabs}>
            {MODOS.map((t) => (
              <button
                key={t.id}
                id={`${base}-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={modo === t.id}
                aria-controls={`${base}-panel`}
                tabIndex={modo === t.id ? 0 : -1}
                onClick={() => cambiarModo(t.id)}
              >
                {t.nombre}
              </button>
            ))}
          </div>

          <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${modo}`} className="gl-panel">
            {modo === "hallazgos" ? (
              <>
                <ol className="gl-lista-hallazgos">
                  {HALLAZGOS_GLENN.map((h) => (
                    <li key={h.id}>
                      <button type="button" aria-pressed={activo === h.id} onClick={() => setActivo(activo === h.id ? null : h.id)}>
                        <span className="gl-lista-hallazgos__n">{h.n}</span> {h.titulo}
                      </button>
                    </li>
                  ))}
                </ol>
                <div className="gl-ficha" aria-live="polite">
                  {hallazgo ? (
                    <>
                      <h3 className="gl-ficha__t">
                        {hallazgo.n} · {hallazgo.titulo}
                      </h3>
                      <p>{hallazgo.texto}</p>
                      <p className="gl-meta">
                        <KindTag tipo={hallazgo.tipo} /> <span>Fuente: {hallazgo.fuente}</span>
                      </p>
                    </>
                  ) : (
                    <p className="gl-ficha__vacia">Elige un número sobre la obra o en la lista.</p>
                  )}
                </div>
                {/* Sin JavaScript, los cinco hallazgos se leen enteros */}
                <noscript>
                  <dl className="gl-sinjs">
                    {HALLAZGOS_GLENN.map((h) => (
                      <div key={h.id}>
                        <dt>
                          {h.n} · {h.titulo}
                        </dt>
                        <dd>
                          {h.texto} Fuente: {h.fuente}.
                        </dd>
                      </div>
                    ))}
                  </dl>
                </noscript>
              </>
            ) : null}

            {modo === "capas" ? (
              <>
                <div className="gl-interruptores" role="group" aria-label="Capas visibles">
                  {CAPAS_GLENN.map((c) => (
                    <button key={c.id} type="button" data-capa={c.id} aria-pressed={capas.has(c.id)} onClick={() => alternarCapa(c.id)}>
                      {c.nombre}
                    </button>
                  ))}
                  <button type="button" data-capa="valores" aria-pressed={valores} onClick={() => setValores(!valores)} disabled={!conImagen}>
                    Solo claro y oscuro
                  </button>
                </div>
                <ul className="gl-capas-texto" aria-live="polite">
                  {CAPAS_GLENN.filter((c) => capas.has(c.id)).map((c) => (
                    <li key={c.id} data-capa={c.id}>
                      <p>
                        <strong>{c.nombre}.</strong> {c.texto}
                      </p>
                      <p className="gl-meta">
                        <KindTag tipo={c.tipo} />
                      </p>
                    </li>
                  ))}
                  {valores && conImagen ? (
                    <li data-capa="valores">
                      <p>
                        <strong>Claro y oscuro.</strong> Sin color se ve mejor el contraste entre la máscara y el muro de copias.
                        Es un filtro en pantalla.
                      </p>
                    </li>
                  ) : null}
                  {capas.size === 0 && !valores ? <li className="gl-ficha__vacia">Activa una capa para separarla.</li> : null}
                </ul>
              </>
            ) : null}

            {modo === "fotocopiar" ? (
              <div className="gl-texto-modo">
                <p>
                  El fondo de Glenn está hecho de fotocopias. La máquina reduce la imagen a negro y blanco y la multiplica; la
                  mano añade encima el color y el gesto.
                </p>
                <p className="gl-meta">
                  <KindTag tipo="hecho" /> <span>Fuente: Barbican, lista de préstamos (técnica)</span>
                </p>
                <p>¿Qué se pierde al copiar? ¿Qué queda, aunque la imagen se vuelva gris?</p>
                <p className="gl-meta">
                  <KindTag tipo="lectura" />
                </p>
                {conImagen ? (
                  <div className="gl-botonera">
                    <button type="button" className="gl-btn gl-btn--linea" onClick={() => setCorte(100)}>
                      Copiar todo
                    </button>
                    <button type="button" className="gl-btn gl-btn--linea" onClick={() => setCorte(0)}>
                      Ver el original
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {modo === "ampliar" ? (
              <div className="gl-texto-modo">
                <div className="gl-zoom" role="group" aria-label="Zoom">
                  <button type="button" className="gl-btn gl-btn--icono" onClick={() => siguientePaso(-1)} disabled={zoom <= 1} aria-label="Alejar">
                    −
                  </button>
                  <output className="gl-zoom__valor" aria-live="polite">
                    ×{zoom}
                  </output>
                  <button type="button" className="gl-btn gl-btn--icono" onClick={() => siguientePaso(1)} disabled={zoom >= zoomMax} aria-label="Acercar">
                    +
                  </button>
                  <button type="button" className="gl-btn gl-btn--linea" onClick={() => setZoom(1)} disabled={zoom === 1}>
                    Restablecer
                  </button>
                </div>
                <div className="gl-regiones" role="group" aria-label="Ir a una región">
                  {REGIONES_GLENN.map((r) => (
                    <button key={r.id} type="button" className="gl-btn gl-btn--linea" onClick={() => irA(r.x, r.y)}>
                      {r.nombre}
                    </button>
                  ))}
                </div>
                <p className="gl-ayuda">Arrastra sobre la obra para desplazarte. Con el teclado: flechas, + y −, y 0 para volver.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
