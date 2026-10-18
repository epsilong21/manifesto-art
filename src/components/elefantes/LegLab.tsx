"use client";

import { useId, useState } from "react";

/*
 * Modelo estático simplificado: cuatro patas como columnas macizas de hueso,
 * empotradas en el suelo y libres arriba (factor de longitud efectiva K = 2).
 * Valores de material orientativos para hueso cortical.
 */
const MASA = 6000; // kg, orden de magnitud de un elefante africano adulto
const G = 9.81;
const E = 17e9; // Pa, módulo de Young aproximado del hueso cortical
const RESISTENCIA = 170e6; // Pa, resistencia a compresión aproximada
const K = 2;

function analiza(largoM: number, diametroCm: number) {
  const d = diametroCm / 100;
  const F = (MASA * G) / 4;
  const area = (Math.PI * d * d) / 4;
  const inercia = (Math.PI * d ** 4) / 64;
  const tension = F / area;
  const critica = (Math.PI ** 2 * E * inercia) / (K * largoM) ** 2;
  const fAplast = RESISTENCIA / tension;
  const fPandeo = critica / F;
  const factor = Math.min(fAplast, fPandeo);
  const modo = fPandeo < fAplast ? "pandeo" : "aplastamiento";
  // Diámetro mínimo para no pandear con este largo
  const dMin = ((64 * F * (K * largoM) ** 2) / (Math.PI ** 3 * E)) ** 0.25;
  return { factor, modo, dMinCm: dMin * 100 };
}

/** Formato numérico español sin depender de la configuración regional del entorno. */
const num = (n: number, d: number) => n.toFixed(d).replace(".", ",");

const PRESETS = [
  { nombre: "Pata de elefante (aprox.)", largo: 1.8, diametro: 45 },
  { nombre: "Pata imposible", largo: 10, diametro: 4 },
];

export function LegLab() {
  const [largo, setLargo] = useState(6);
  const [diametro, setDiametro] = useState(12);
  const id = useId();
  const r = analiza(largo, diametro);
  const estado = r.factor >= 2 ? "resiste" : r.factor >= 1 ? "limite" : "colapsa";
  const veredicto = {
    resiste: "Resiste",
    limite: "Al límite",
    colapsa: r.modo === "pandeo" ? "Colapsa: las patas se doblan" : "Colapsa: el hueso se aplasta",
  }[estado];

  const titulo = `Esquema: un bloque de 6 toneladas sobre cuatro patas de ${num(largo, 1)} m y ${diametro} cm. ${veredicto}.`;

  // Dibujo a escala relativa
  const H = 320;
  const legPx = 40 + (largo / 12) * 170;
  const thick = Math.max(1, (diametro / 60) * 22);
  const groundY = H - 16;
  const topY = groundY - legPx;
  const bow = estado === "colapsa" && r.modo === "pandeo" ? Math.min(60, legPx * 0.35) : 0;
  const sag = estado === "colapsa" ? Math.min(legPx * 0.4, 50) : 0;
  const legsX = [70, 120, 200, 250];

  return (
    <div className="el-lab" data-estado={estado}>
      <figure className="el-lab__fig">
        <svg viewBox={`0 0 320 ${H}`} role="img" aria-labelledby={`${id}-t`}>
          {/* Un solo texto: React 19 no hidrata bien un <title> SVG con varios nodos */}
          <title id={`${id}-t`}>{titulo}</title>
          <line x1="10" x2="310" y1={groundY} y2={groundY} className="el-lab__ground" />
          {legsX.map((x, i) => {
            const y1 = topY + sag;
            const dir = i % 2 ? 1 : -1;
            const d = bow
              ? `M${x} ${groundY} Q ${x + dir * bow} ${(groundY + y1) / 2} ${x} ${y1}`
              : `M${x} ${groundY} L ${x} ${y1}`;
            return <path key={x} d={d} className="el-lab__leg" strokeWidth={thick} />;
          })}
          <rect x="50" y={topY + sag - 56} width="220" height="56" rx="6" className="el-lab__mass" />
          <text x="160" y={topY + sag - 22} textAnchor="middle" className="el-lab__massLabel">
            6 t
          </text>
        </svg>
        <figcaption>
          Modelo estático simplificado: patas como columnas macizas de hueso, sin viento ni
          movimiento. Valores orientativos.
        </figcaption>
      </figure>

      <div className="el-lab__controls">
        <label className="el-range">
          <span>
            Largo de cada pata <output>{num(largo, 1)} m</output>
          </span>
          <input type="range" min={1} max={12} step={0.1} value={largo} onChange={(e) => setLargo(+e.target.value)} />
        </label>
        <label className="el-range">
          <span>
            Diámetro <output>{diametro} cm</output>
          </span>
          <input type="range" min={2} max={60} step={1} value={diametro} onChange={(e) => setDiametro(+e.target.value)} />
        </label>
        <div className="el-lab__presets" role="group" aria-label="Proporciones de ejemplo">
          {PRESETS.map((p) => (
            <button
              key={p.nombre}
              type="button"
              className="mf-btn"
              onClick={() => {
                setLargo(p.largo);
                setDiametro(p.diametro);
              }}
            >
              {p.nombre}
            </button>
          ))}
        </div>
        <div className="el-lab__result" aria-live="polite">
          <p className="el-lab__verdict">{veredicto}</p>
          <p>
            Margen de seguridad: <strong>{r.factor >= 100 ? "más de 100" : r.factor < 0.01 ? "menos de 0,01" : num(r.factor, r.factor < 10 ? 2 : 0)}</strong>{" "}
            veces la carga. Con {num(largo, 1)} m de largo, cada pata necesitaría al menos{" "}
            <strong>{Math.ceil(r.dMinCm)} cm</strong> de diámetro para no doblarse.
          </p>
        </div>
      </div>
    </div>
  );
}
