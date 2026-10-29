"use client";

import { useState, type CSSProperties } from "react";
import { MEG_IMG as I, PISTAS, TERRITORIOS, type Punto } from "@/content/loca-meg";
import { focusOn, OVERVIEW } from "@/lib/focus";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const VB_H = I.ratio * 100;
type Modo = "territorios" | "investigar";
type Estado = { modo: Modo; terr: number | null; desc: number | null; pista: number | null; nodo: number | null };
type Marca = { x: number; y: number; n?: number; on?: boolean };

/**
 * «Cartografía del caos»: un explorador panorámico sobre la reproducción completa.
 * Territorios (cinco encuadres, dos descubrimientos cada uno) y pistas que cruzan territorios.
 * Todo son botones y transiciones CSS; no hay gestos de arrastre, así que el desplazamiento
 * normal de la página nunca se bloquea. prefers-reduced-motion anula las transiciones.
 */
export function Cartografia() {
  const [s, setS] = useState<Estado>({ modo: "territorios", terr: null, desc: null, pista: null, nodo: null });
  const T = s.terr !== null ? TERRITORIOS[s.terr] : null;
  const P = s.pista !== null ? PISTAS[s.pista] : null;
  const enTerritorios = s.modo === "territorios";

  const punto: Punto | null = enTerritorios
    ? T && s.desc !== null ? T.descubrimientos[s.desc] : null
    : P && s.nodo !== null ? P.nodos[s.nodo] : null;
  const vista = punto
    ? focusOn({ x: punto.x * 100, y: punto.y * 100, zoom: punto.zoom })
    : enTerritorios && T?.vista
      ? focusOn({ x: T.vista.x * 100, y: T.vista.y * 100, zoom: T.vista.zoom })
      : OVERVIEW;

  const marcas: Marca[] = [];
  if (enTerritorios) {
    if (punto) marcas.push({ x: punto.x, y: punto.y, on: true });
    else if (T?.anillos) T.anillos.forEach((a) => marcas.push(a));
  } else if (P) {
    P.nodos.forEach((n, k) => marcas.push({ x: n.x, y: n.y, n: k + 1, on: s.nodo === k }));
  }
  // Con el cuadro entero a la vista, los cinco territorios se dibujan como un mapa: contornos y rótulos numerados
  const mapa = enTerritorios && s.terr === null;
  const unir = !enTerritorios && P && s.nodo === null;
  const zona = enTerritorios && T?.zona && s.desc === null ? T.zona : null;
  const ruta = P ? P.nodos.map((n, k) => `${k ? "L" : "M"}${(n.x * 100).toFixed(2)},${(n.y * VB_H).toFixed(2)}`).join(" ") : "";

  const etiqueta = enTerritorios
    ? `Territorio: ${T ? T.nombre : "el cuadro entero"}${punto ? `, ${punto.titulo}` : ""}`
    : `Pista: ${P ? P.titulo : "sin elegir"}${punto ? `, ${punto.titulo}` : ""}`;

  return (
    <section className="meg-explora" aria-labelledby="meg-explora-h">
      <div className="meg-explora__cab">
        <h2 id="meg-explora-h" className="sp-h2">Cartografía del caos</h2>
        <p>Cinco territorios para recorrer el cuadro, y pistas que cruzan de uno a otro.</p>
      </div>
      <div className="meg-explora__cuerpo">
        <div className="meg-escena">
          <div className="meg-marco" role="img" aria-label={etiqueta}>
            <div
              className="meg-lienzo"
              style={{ transform: `translate(${vista.tx}%, ${vista.ty}%) scale(${vista.scale})`, "--z": vista.scale } as CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="meg-img"
                src={`${BASE}${I.base}-${I.anchos[1]}.webp`}
                width={I.width}
                height={I.height}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <span
                className="meg-vela"
                data-on={zona !== null}
                aria-hidden="true"
                style={{ left: `${(zona?.x ?? 0) * 100}%`, top: `${(zona?.y ?? 0) * 100}%`, width: `${(zona?.w ?? 1) * 100}%`, height: `${(zona?.h ?? 1) * 100}%` }}
              />
              <svg className="meg-svg" viewBox={`0 0 100 ${VB_H}`} aria-hidden="true" preserveAspectRatio="none">
                {mapa
                  ? TERRITORIOS.map((x) =>
                      x.zona ? <rect key={x.id} className="meg-mapa" x={x.zona.x * 100} y={x.zona.y * VB_H} width={x.zona.w * 100} height={x.zona.h * VB_H} rx={0.4} /> : null,
                    )
                  : null}
                {unir ? <path className="meg-union" d={ruta} /> : null}
              </svg>
              {mapa
                ? TERRITORIOS.map((x, k) => {
                    const p = x.zona ? { left: x.zona.x, top: Math.max(x.zona.y, 0.05) } : x.anillos ? { left: x.anillos[0].x, top: x.anillos[0].y } : null;
                    return p ? (
                      <span key={x.id} className="meg-rotulo" style={{ left: `${p.left * 100}%`, top: `${p.top * 100}%` }} aria-hidden="true">
                        <b>{k + 1}</b>
                        <span>{x.nombre}</span>
                      </span>
                    ) : null;
                  })
                : null}
              {marcas.map((m, k) => (
                <span key={`${s.modo}-${s.terr}-${s.pista}-${k}`} className="meg-marca" data-on={m.on ?? false} style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }} aria-hidden="true">
                  {m.n ?? ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="meg-mandos">
          <div className="meg-modos" role="group" aria-label="Modo">
            <button type="button" className="meg-modo" aria-pressed={enTerritorios} onClick={() => setS({ ...s, modo: "territorios" })}>Territorios</button>
            <button type="button" className="meg-modo" aria-pressed={!enTerritorios} onClick={() => setS({ ...s, modo: "investigar" })}>Investigar</button>
          </div>

          {enTerritorios ? (
            <>
              <ol className="meg-lista" aria-label="Territorios">
                {TERRITORIOS.map((t, k) => (
                  <li key={t.id}>
                    <button type="button" aria-current={s.terr === k ? "step" : undefined} onClick={() => setS({ ...s, terr: s.terr === k ? null : k, desc: null })}>
                      <span>{k + 1}</span> {t.nombre}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="meg-texto" aria-live="polite">
                {T ? (
                  <>
                    <h3>{T.nombre}</h3>
                    <p className="meg-vis"><b>Se ve.</b> {T.seVe}</p>
                    <div className="meg-desc" role="group" aria-label="Descubrimientos">
                      {T.descubrimientos.map((d, k) => (
                        <button key={d.id} type="button" className="mf-btn" aria-pressed={s.desc === k} onClick={() => setS({ ...s, desc: s.desc === k ? null : k })}>
                          {d.titulo}
                        </button>
                      ))}
                    </div>
                    {punto ? <p className="meg-vis meg-vis--punto">{punto.texto}</p> : null}
                    <p className="meg-int"><b>Interpretación.</b> {T.interpretacion}</p>
                  </>
                ) : (
                  <p className="meg-vacio">Elige un territorio para acercarte a él. Se ve el cuadro entero, sin tocar.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <ol className="meg-lista" aria-label="Pistas">
                {PISTAS.map((p, k) => (
                  <li key={p.id}>
                    <button type="button" aria-current={s.pista === k ? "step" : undefined} onClick={() => setS({ ...s, pista: s.pista === k ? null : k, nodo: null })}>
                      <span>{k + 1}</span> {p.titulo}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="meg-texto" aria-live="polite">
                {P ? (
                  <>
                    <h3>{P.titulo}</h3>
                    <p className="meg-vis">{P.pregunta}</p>
                    <div className="meg-desc" role="group" aria-label="Elementos de la pista">
                      {P.nodos.map((n, k) => (
                        <button key={n.id} type="button" className="mf-btn" aria-pressed={s.nodo === k} onClick={() => setS({ ...s, nodo: s.nodo === k ? null : k })}>
                          {k + 1}. {n.titulo}
                        </button>
                      ))}
                    </div>
                    {s.nodo !== null ? (
                      <p className="meg-vis meg-vis--punto">
                        <b>{P.nodos[s.nodo].relacion}.</b> {P.nodos[s.nodo].texto}{" "}
                        <button type="button" className="meg-enlace" onClick={() => setS({ modo: "territorios", terr: P.nodos[s.nodo!].territorio, desc: null, pista: s.pista, nodo: null })}>
                          Ver territorio: {TERRITORIOS[P.nodos[s.nodo].territorio].nombre} →
                        </button>
                      </p>
                    ) : null}
                    <p className="meg-int"><b>Interpretación.</b> {P.lectura}</p>
                  </>
                ) : (
                  <p className="meg-vacio">Elige una pista: un objeto o un gesto que se repite, se transforma o contrasta en otra parte del cuadro.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
