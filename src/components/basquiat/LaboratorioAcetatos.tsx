"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { CAPAS, type CapaId } from "@/content/basquiat-capas";
import { PlanoCabeza } from "./EsquemaCabeza";

/** Giro de partida: la pila vista desde arriba y de lado, para que se lea la profundidad. */
const GIRO_INICIAL = { x: -16, y: -30 };
const GIRO_MAX = { x: 40, y: 70 };
/** Por debajo de este desplazamiento (px), un gesto sobre un acetato es un toque, no un giro. */
const UMBRAL = 6;

const limitar = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/**
 * «Laboratorio de acetatos»: el esquema de la cabeza (EsquemaCabeza) en cuatro
 * acetatos apilados en CSS 3D, uno por capa. Se separan y se juntan (botón o
 * deslizador), se elige uno tocándolo o desde los mandos y la pila gira al
 * arrastrar o con las flechas. La luz sigue al puntero sobre la escena.
 *
 * - `hero`: versión decorativa del hero, sin mandos; se abre sola al montarse y solo
 *   responde al puntero con la inclinación y la luz.
 * - Sin JavaScript, la pila queda junta y quieta; los textos están en <noscript>.
 * - Con movimiento reducido, sin transiciones ni apertura automática.
 */
export function LaboratorioAcetatos({ hero = false }: { hero?: boolean }) {
  const [sep, setSep] = useState(hero ? 0 : 0.6);
  const [sel, setSel] = useState<CapaId | null>(null);
  const [elemento, setElemento] = useState<number | null>(null);
  const escena = useRef<HTMLDivElement>(null);
  const pilaRef = useRef<HTMLDivElement>(null);
  // El giro va directo al estilo de la pila: arrastrar no vuelve a pintar los acetatos
  const giro = useRef(GIRO_INICIAL);
  const suprimirClic = useRef(false);
  const setGiro = (f: typeof GIRO_INICIAL | ((g: typeof GIRO_INICIAL) => typeof GIRO_INICIAL)) => {
    giro.current = typeof f === "function" ? f(giro.current) : f;
    pilaRef.current?.style.setProperty("--rx", `${giro.current.x.toFixed(2)}deg`);
    pilaRef.current?.style.setProperty("--ry", `${giro.current.y.toFixed(2)}deg`);
  };
  const gesto = useRef<{ id: number; x: number; y: number; giro: typeof GIRO_INICIAL; movido: boolean } | null>(null);

  // En el hero, la pila se abre una vez al aparecer
  useEffect(() => {
    if (!hero) return;
    // Con movimiento reducido se abre sin esperar (y sin transición, ver basquiat-lab.css)
    const t = setTimeout(() => setSep(0.7), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 400);
    return () => clearTimeout(t);
  }, [hero]);

  const luz = (e: PointerEvent<HTMLDivElement>) => {
    const el = escena.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--lx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--ly", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    return r;
  };

  const abajo = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    suprimirClic.current = false;
    gesto.current = { id: e.pointerId, x: e.clientX, y: e.clientY, giro: giro.current, movido: false };
  };

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    const r = luz(e);
    const g = gesto.current;
    if (hero) {
      // En el hero, la inclinación sigue al puntero sin arrastrar (solo con ratón)
      if (r && e.pointerType === "mouse") {
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        setGiro({ x: GIRO_INICIAL.x - ny * 14, y: GIRO_INICIAL.y + nx * 24 });
      }
      return;
    }
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.movido) {
      if (Math.hypot(dx, dy) < UMBRAL) return;
      // En táctil, un gesto vertical es desplazar la página (touch-action: pan-y)
      g.movido = true;
      escena.current?.setPointerCapture(e.pointerId);
      escena.current?.setAttribute("data-girando", "");
    }
    setGiro({ x: limitar(g.giro.x - dy * 0.3, GIRO_MAX.x), y: limitar(g.giro.y + dx * 0.4, GIRO_MAX.y) });
  };

  const arriba = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesto.current;
    if (!g || g.id !== e.pointerId) return;
    escena.current?.removeAttribute("data-girando");
    // Si hubo giro, el clic que sigue no selecciona
    suprimirClic.current = g.movido;
    gesto.current = null;
  };

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso = e.shiftKey ? 15 : 5;
    const k = e.key;
    if (k === "ArrowLeft") setGiro((g) => ({ ...g, y: limitar(g.y - paso, GIRO_MAX.y) }));
    else if (k === "ArrowRight") setGiro((g) => ({ ...g, y: limitar(g.y + paso, GIRO_MAX.y) }));
    else if (k === "ArrowUp") setGiro((g) => ({ ...g, x: limitar(g.x + paso, GIRO_MAX.x) }));
    else if (k === "ArrowDown") setGiro((g) => ({ ...g, x: limitar(g.x - paso, GIRO_MAX.x) }));
    else if (k === "+" || k === "=") setSep((s) => Math.min(1, s + 0.2));
    else if (k === "-") setSep((s) => Math.max(0, s - 0.2));
    else if (k === "0") setGiro(GIRO_INICIAL);
    else if (k === "Escape" && sel) setSel(null);
    else return;
    e.preventDefault();
  };

  const elegir = (id: CapaId) => {
    setSel(sel === id ? null : id);
    setElemento(null);
    if (sel !== id && sep < 0.35) setSep(0.6);
  };

  const capa = CAPAS.find((c) => c.id === sel) ?? null;
  const detalle = capa?.elementos.find((el) => el.n === elemento) ?? null;
  const n = CAPAS.length;

  const pila = (
    <div
      ref={escena}
      className="bq-lab__escena"
      data-hero={hero ? "" : undefined}
      tabIndex={hero ? undefined : 0}
      role={hero ? "img" : "group"}
      aria-label={
        hero
          ? "Esquema de MANIFESTO, no la pintura: una cabeza de lámina de anatomía en cuatro acetatos superpuestos."
          : "Pila de acetatos. Arrastra o usa las flechas para girarla; + y − para separar o juntar; 0 para volver al giro inicial."
      }
      onPointerDown={hero ? undefined : abajo}
      onPointerMove={mover}
      onPointerUp={hero ? undefined : arriba}
      onPointerCancel={hero ? undefined : arriba}
      onKeyDown={hero ? undefined : teclas}
    >
      <div
        ref={pilaRef}
        className="bq-lab__pila"
        data-separada={sep > 0.05 ? "" : undefined}
        data-sel={sel ?? undefined}
        style={{ "--rx": `${GIRO_INICIAL.x}deg`, "--ry": `${GIRO_INICIAL.y}deg`, "--sep": sep } as CSSProperties}
      >
        <div className="bq-lab__mesa" aria-hidden="true" />
        {CAPAS.map((c, i) => {
          const contenido = <PlanoCabeza capa={c.id} numeros={c.elementos.map((e) => e.n)} activo={sel === c.id ? elemento : null} />;
          const estilo = { "--i": i - (n - 1) / 2, "--c": c.color } as CSSProperties;
          return hero ? (
            <div key={c.id} className="bq-acetato" style={estilo}>
              {contenido}
              <span className="bq-acetato__brillo" />
            </div>
          ) : (
            <button
              key={c.id}
              type="button"
              className="bq-acetato"
              style={estilo}
              tabIndex={-1}
              aria-label={`Acetato ${c.nombre}`}
              data-on={sel === c.id ? "" : undefined}
              onClick={() => {
                if (suprimirClic.current) suprimirClic.current = false;
                else elegir(c.id);
              }}
            >
              {contenido}
              <span className="bq-acetato__brillo" />
              <span className="bq-acetato__pestana" aria-hidden="true">
                {String.fromCharCode(65 + i)} · {c.nombre}
              </span>
            </button>
          );
        })}
      </div>
      <p className="bq-lab__aviso" aria-hidden="true">
        Esquema de MANIFESTO · no es la pintura
      </p>
    </div>
  );

  if (hero) return pila;

  return (
    <div className="bq-lab">
      {pila}
      <div className="bq-lab__mandos">
        <div className="bq-lab__capas" role="group" aria-label="Elegir acetato">
          {CAPAS.map((c, i) => (
            <button key={c.id} type="button" aria-pressed={sel === c.id} style={{ "--c": c.color } as CSSProperties} onClick={() => elegir(c.id)}>
              <span className="bq-lab__letra" aria-hidden="true">
                {String.fromCharCode(65 + i)}
              </span>
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="bq-lab__sep">
          <button type="button" className="bq-lab__boton" onClick={() => setSep(sep > 0.3 ? 0 : 0.85)}>
            {sep > 0.3 ? "Juntar las capas" : "Separar las capas"}
          </button>
          <label>
            <span className="sr-only">Separación entre acetatos</span>
            <input type="range" min={0} max={100} value={Math.round(sep * 100)} onChange={(e) => setSep(Number(e.target.value) / 100)} aria-valuetext={sep < 0.05 ? "Juntas" : `${Math.round(sep * 100)} % separadas`} />
          </label>
          <button type="button" className="bq-lab__boton bq-lab__boton--tenue" onClick={() => setGiro(GIRO_INICIAL)}>
            Recolocar
          </button>
        </div>
        <div className="bq-lab__ficha" aria-live="polite">
          {capa ? (
            <>
              <h3 style={{ "--c": capa.color } as CSSProperties}>{capa.nombre}</h3>
              <p>{capa.intro.texto}</p>
              <p className="bq-meta">
                <KindTag tipo={capa.intro.tipo} /> <span>Fuente: {capa.intro.fuente}</span>
              </p>
              <ul className="bq-lab__elementos" aria-label={`Elementos de ${capa.nombre}`}>
                {capa.elementos.map((el) => (
                  <li key={el.n}>
                    <button type="button" aria-pressed={elemento === el.n} onClick={() => setElemento(elemento === el.n ? null : el.n)}>
                      <span className="bq-lab__n">{el.n}</span> {el.nombre}
                    </button>
                  </li>
                ))}
              </ul>
              {detalle ? (
                <p className="bq-lab__nota">
                  {detalle.nota} <KindTag tipo={detalle.tipo} />
                </p>
              ) : null}
            </>
          ) : (
            <p className="bq-lab__vacio">Toca un acetato o elige una capa. Arrastra la pila para girarla.</p>
          )}
        </div>
      </div>
    </div>
  );
}
