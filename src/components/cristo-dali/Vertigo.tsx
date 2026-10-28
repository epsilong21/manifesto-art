"use client";

import { useState } from "react";
import {
  ESTADOS,
  MEDIDAS_MUNDOS,
  MUNDOS,
  MUNDOS_DOCUMENTADO,
  MUNDOS_INTERPRETACION,
  NUCLEO,
  PERSPECTIVA,
  UMBRAL,
  type Estado,
} from "@/content/cristo-dali";
import { centroFranja, luzEn, Mundos, Nucleo, ReglaLuz } from "./Escenarios";
import { MIRADA_PAISAJE_GRADOS, Perspectiva } from "./Perspectiva";

/** Recorrido t que deja la franja de luz en un punto y de la pintura. */
const tEn = (y: number) => Math.min(1, Math.max(0, (y - 0.08) / 0.87));

/**
 * «El vértigo de lo divino»: tres estados sobre un mismo escenario. Todo son controles nativos
 * (botones y deslizadores), sin gestos de arrastre, y las transiciones se anulan con
 * prefers-reduced-motion.
 */
export function Vertigo() {
  const [estado, setEstado] = useState<Estado>("perspectiva");
  const [elev, setElev] = useState(0);
  const [t, setT] = useState(0);
  const [paso, setPaso] = useState(0);
  const [fundido, setFundido] = useState(0);

  const actual = ESTADOS.find((e) => e.id === estado)!;
  const c = centroFranja(t);
  const mundo = MUNDOS.find((m) => c < m.hasta)!;
  const tramo = PERSPECTIVA.tramos.find((x) => elev <= x.hasta) ?? PERSPECTIVA.tramos[PERSPECTIVA.tramos.length - 1];
  const brecha = Math.round(elev - MIRADA_PAISAJE_GRADOS);
  const p = NUCLEO.pasos[paso];

  return (
    <section className="vd-explora" aria-labelledby="vd-explora-h">
      <div className="vd-explora__cab">
        <h2 id="vd-explora-h" className="sp-h2">El vértigo de lo divino</h2>
        <p>Tres maneras de mirar el cuadro desde dentro: su perspectiva, su luz y su geometría.</p>
      </div>
      <div className="vd-explora__cuerpo">
        <div className="vd-escena">
          <div className="vd-marco" data-estado={estado}>
            {estado === "perspectiva" ? <Perspectiva elev={elev} /> : null}
            {estado === "mundos" ? <Mundos t={t} /> : null}
            {estado === "nucleo" ? <Nucleo paso={paso} fundido={fundido} /> : null}
          </div>
          {estado === "mundos" ? <ReglaLuz t={t} /> : null}
        </div>

        <div className="vd-mandos">
          <div className="vd-estados" role="group" aria-label="Estado">
            {ESTADOS.map((e, k) => (
              <button key={e.id} type="button" className="vd-estado" aria-pressed={estado === e.id} onClick={() => setEstado(e.id)}>
                <span>{k + 1}</span> {e.nombre}
              </button>
            ))}
          </div>

          <div className="vd-texto" aria-live="polite">
            <h3>{actual.titulo}</h3>

            {estado === "perspectiva" ? (
              <>
                <p className="vd-vis">{tramo.texto}</p>
                <p className="vd-estado-linea" data-imposible={brecha > 10}>
                  {brecha > 10
                    ? `Imposible: miras la cruz desde ${Math.round(elev)}° y el mar desde ${MIRADA_PAISAJE_GRADOS}°.`
                    : "Las dos miradas coinciden: la escena es posible."}
                </p>
              </>
            ) : null}

            {estado === "mundos" ? (
              <>
                <p className="vd-nombre">{mundo.nombre}</p>
                <p className="vd-vis">{mundo.texto}</p>
                <p className="vd-medida">
                  Luz en esta franja: <b>{luzEn(c)} %</b> · media de arriba {MEDIDAS_MUNDOS.arriba} %, de abajo {MEDIDAS_MUNDOS.abajo} %
                </p>
              </>
            ) : null}

            {estado === "nucleo" ? (
              <>
                <p className="vd-pos">Paso {paso + 1} de {NUCLEO.pasos.length} · {p.nombre}</p>
                <p className="vd-vis">
                  <span className="vd-etiqueta" data-tipo={p.tipo}>{p.tipo === "documentado" ? "Documentado" : "Interpretación"}</span> {p.texto}
                </p>
                {paso === NUCLEO.pasos.length - 1 ? (
                  <div className="vd-cita">
                    <p>{NUCLEO.cita}</p>
                    <footer>{NUCLEO.citaFuente}</footer>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {estado === "perspectiva" ? (
            <div className="vd-control">
              <label htmlFor="vd-elev">Elevación de la mirada <output>{Math.round(elev)}°</output></label>
              <input id="vd-elev" type="range" min={PERSPECTIVA.min} max={PERSPECTIVA.max} step={1} value={elev} onChange={(e) => setElev(Number(e.target.value))} aria-valuetext={`${Math.round(elev)} grados sobre la cruz`} />
              <div className="vd-botones">
                <button type="button" className="mf-btn" onClick={() => setElev(0)}>De frente</button>
                <button type="button" className="mf-btn mf-btn--solid" onClick={() => setElev(PERSPECTIVA.dali)}>Mirada de Dalí</button>
              </div>
            </div>
          ) : null}

          {estado === "mundos" ? (
            <div className="vd-control">
              <label htmlFor="vd-t">Recorrido <output>{mundo.nombre}</output></label>
              <input id="vd-t" type="range" min={0} max={100} step={1} value={Math.round(t * 100)} onChange={(e) => setT(Number(e.target.value) / 100)} aria-valuetext={`${mundo.nombre}, luz ${luzEn(c)} por ciento`} />
              <div className="vd-botones">
                <button type="button" className="mf-btn" onClick={() => setT(0)}>La sombra</button>
                <button type="button" className="mf-btn" onClick={() => setT(tEn(UMBRAL))}>El umbral</button>
                <button type="button" className="mf-btn" onClick={() => setT(1)}>La bahía</button>
              </div>
            </div>
          ) : null}

          {estado === "nucleo" ? (
            <div className="vd-control">
              <div className="vd-botones">
                <button type="button" className="mf-btn" onClick={() => setPaso(Math.max(0, paso - 1))} disabled={paso === 0}>← Anterior</button>
                <button type="button" className="mf-btn mf-btn--solid" onClick={() => setPaso(Math.min(NUCLEO.pasos.length - 1, paso + 1))} disabled={paso === NUCLEO.pasos.length - 1}>Siguiente →</button>
              </div>
              <ol className="vd-pasos" aria-label="Pasos">
                {NUCLEO.pasos.map((x, k) => (
                  <li key={x.id}>
                    <button type="button" aria-current={k === paso ? "step" : undefined} onClick={() => setPaso(k)}><span>{k + 1}</span> {x.nombre}</button>
                  </li>
                ))}
              </ol>
              <label htmlFor="vd-fund">Pintura ↔ geometría</label>
              <input id="vd-fund" type="range" min={0} max={100} step={1} value={Math.round(fundido * 100)} onChange={(e) => setFundido(Number(e.target.value) / 100)} aria-valuetext={`${Math.round(fundido * 100)} por ciento de geometría`} />
            </div>
          ) : null}

          <div className="vd-notas">
            <p><b>Documentado.</b> {estado === "perspectiva" ? PERSPECTIVA.documentado : estado === "mundos" ? MUNDOS_DOCUMENTADO : "En un boceto del cuadro, un triángulo representa el cuerpo de Cristo y un círculo ocupa el lugar de la cabeza; Dalí relacionó la imagen con el núcleo del átomo."}</p>
            <p className="vd-int"><b>Interpretación.</b> {estado === "perspectiva" ? PERSPECTIVA.interpretacion : estado === "mundos" ? MUNDOS_INTERPRETACION : NUCLEO.interpretacion}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
