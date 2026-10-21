"use client";

import Image from "next/image";
import { useId, useState, type CSSProperties } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { MEDUSA } from "@/content/medusa";
import { RECORTE_SOMBRA, SOMBRA, ZONA_SOMBRA, type Lectura } from "@/content/medusa-v3";

/** Posición de la sombra: -1 la recoge hacia dentro (cóncava), 0 la deja neutra (plana), 1 la empuja hacia fuera (convexa). */
const PRESETS: { nombre: string; posicion: number; intensidad: number }[] = [
  { nombre: "Convexa", posicion: 80, intensidad: 70 },
  { nombre: "Plana", posicion: 0, intensidad: 70 },
  { nombre: "Como Caravaggio", posicion: -80, intensidad: 75 },
];

const lectura = (p: number): Lectura => (p > 0.33 ? "convexa" : p < -0.33 ? "concava" : "plana");

/** Esfera y disco, en el sistema del dibujo (viewBox 400 × 250). */
const DISCO = { cx: 200, cy: 125, r: 108 };
const ESFERA = { cx: 182, cy: 104, r: 24 };

/** Recorte de la obra: la reproducción se coloca para que la ventana [x0, x1] × [y0, y1] llene el marco. */
const rw = RECORTE_SOMBRA.x1 - RECORTE_SOMBRA.x0;
const rh = RECORTE_SOMBRA.y1 - RECORTE_SOMBRA.y0;
const RECORTE_ESTILO: CSSProperties = {
  width: `${100 / rw}%`,
  left: `${(-RECORTE_SOMBRA.x0 / rw) * 100}%`,
  top: `${(-RECORTE_SOMBRA.y0 / rh) * 100}%`,
};
const RECORTE_PROPORCION = (rw * MEDUSA.imagen.width) / (rh * MEDUSA.imagen.height);
const ZONA = {
  cx: ((ZONA_SOMBRA.cx - RECORTE_SOMBRA.x0) / rw) * 100,
  cy: ((ZONA_SOMBRA.cy - RECORTE_SOMBRA.y0) / rh) * 100,
  rx: (ZONA_SOMBRA.rx / rw) * 100,
  ry: (ZONA_SOMBRA.ry / rh) * 100,
};

/**
 * Laboratorio «La sombra que miente»: la misma superficie se lee convexa, plana o
 * cóncava según la sombra que se le pinta. «Ver de perfil» enseña un corte lateral
 * con la forma real, siempre convexa. Sin bucle de animación: solo transiciones CSS.
 */
export function SombraLab() {
  const [posicion, setPosicion] = useState(-80);
  const [intensidad, setIntensidad] = useState(75);
  const [perfil, setPerfil] = useState(false);
  const id = useId().replace(/:/g, "");

  const p = posicion / 100;
  const a = intensidad / 100;
  const estado = lectura(p);
  const v = SOMBRA.veredictos[estado];

  // Sombra pintada: hacia fuera y comprimida (convexa) o recogida y alargada (cóncava)
  const sombra: CSSProperties = {
    transform: `translate(${ESFERA.cx + 30 + 22 * p}px, ${ESFERA.cy + 28 + 16 * p}px) rotate(${32 + 18 * p}deg) scale(${1.15 - 0.35 * p}, ${0.62 - 0.2 * p})`,
    opacity: 0.2 + 0.75 * a,
  };
  // Sombreado del disco: la luz cae arriba a la izquierda si sale hacia ti, abajo a la derecha si es un cuenco
  const luz = { fx: 0.5 - 0.22 * p, fy: 0.5 - 0.24 * p };
  const contraste = Math.abs(p);

  const titulo = perfil
    ? `Corte lateral: el escudo real es convexo. La sombra pintada sugiere una superficie ${estado === "concava" ? "cóncava" : estado}.`
    : `Disco con una esfera delante y su sombra pintada. ${v.nombre}; la superficie real es convexa.`;

  return (
    <div className="mv-lab" data-lectura={estado} data-perfil={perfil || undefined}>
      <figure className="mv-lab__fig">
        <div className="mv-lab__view">
          <svg viewBox="0 0 400 250" role="img" aria-labelledby={`${id}-t`}>
            <title id={`${id}-t`}>{titulo}</title>
            <defs>
              <radialGradient id={`${id}-disco`} cx={luz.fx} cy={luz.fy} r="0.75">
                <stop offset="0" stopColor={`rgb(${150 + 20 * contraste} ${158 + 18 * contraste} ${108 + 10 * contraste})`} />
                <stop offset="0.6" stopColor="#5f6a3d" />
                <stop offset="1" stopColor={`rgb(${70 - 25 * contraste} ${80 - 25 * contraste} ${44 - 18 * contraste})`} />
              </radialGradient>
              <radialGradient id={`${id}-esfera`} cx="0.35" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#f3ecdc" />
                <stop offset="0.55" stopColor="#b8ae98" />
                <stop offset="1" stopColor="#4d4639" />
              </radialGradient>
              <filter id={`${id}-difusa`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
              <clipPath id={`${id}-recorte`}>
                <circle cx={DISCO.cx} cy={DISCO.cy} r={DISCO.r} />
              </clipPath>
            </defs>

            {/* Vista frontal */}
            <g className="mv-frente">
              <circle cx={DISCO.cx} cy={DISCO.cy} r={DISCO.r + 7} className="mv-canto" />
              <circle cx={DISCO.cx} cy={DISCO.cy} r={DISCO.r} fill={`url(#${id}-disco)`} />
              <g clipPath={`url(#${id}-recorte)`}>
                <g className="mv-sombra" style={sombra}>
                  <ellipse rx="26" ry="26" fill="#141a0b" filter={`url(#${id}-difusa)`} />
                </g>
              </g>
              <circle cx={ESFERA.cx} cy={ESFERA.cy} r={ESFERA.r} fill={`url(#${id}-esfera)`} />
              {/* Debajo de la etiqueta del veredicto (arriba a la izquierda) */}
              <path className="mv-luz" d="M70 64 L136 98 M136 98 l-14 -2 M136 98 l-5 -13" />
              <text x="38" y="68" className="mv-rotulo">Luz</text>
            </g>

            {/* Corte lateral: la forma real */}
            <g className="mv-corte" aria-hidden={!perfil || undefined}>
              <path className="mv-luz" d="M378 22 L326 70 M326 70 l13 -3 M326 70 l3 -13" />
              <text x="352" y="16" className="mv-rotulo">Luz</text>
              <path
                className="mv-sugerida"
                d={estado === "concava" ? "M220 28 Q172 125 220 222" : estado === "plana" ? "M220 28 L220 222" : "M220 28 Q268 125 220 222"}
              />
              <path className="mv-real" d="M220 28 Q268 125 220 222" />
              <circle cx="300" cy="104" r="18" fill={`url(#${id}-esfera)`} />
              <path className="mv-ojo" d="M364 125 q12 -9 22 0 q-10 9 -22 0 Z" />
              <text x="366" y="148" className="mv-rotulo">Tú</text>
              <text x="160" y="240" className="mv-rotulo mv-rotulo--real">Escudo real: convexo</text>
              <text x="22" y="125" className="mv-rotulo mv-rotulo--sugerida">Lo que sugiere la sombra</text>
            </g>
          </svg>
          <p className="mv-lab__tag" aria-hidden="true">
            {perfil ? "De perfil" : v.nombre}
          </p>
        </div>
        <figcaption>{perfil ? SOMBRA.perfil : SOMBRA.aviso}</figcaption>
      </figure>

      <div className="mv-lab__controls">
        <label className="mv-range">
          <span>
            Sombra pintada{" "}
            <output htmlFor={`${id}-p`}>{posicion > 33 ? "hacia fuera" : posicion < -33 ? "hacia dentro" : "neutra"}</output>
          </span>
          <input id={`${id}-p`} type="range" min={-100} max={100} step={1} value={posicion} onChange={(e) => setPosicion(+e.target.value)} />
        </label>
        <label className="mv-range">
          <span>
            Intensidad <output htmlFor={`${id}-i`}>{intensidad} %</output>
          </span>
          <input id={`${id}-i`} type="range" min={10} max={90} step={1} value={intensidad} onChange={(e) => setIntensidad(+e.target.value)} />
        </label>
        <div className="mv-lab__presets" role="group" aria-label="Lecturas de ejemplo">
          {PRESETS.map((x) => (
            <button
              key={x.nombre}
              type="button"
              className="mf-btn"
              aria-pressed={posicion === x.posicion && intensidad === x.intensidad}
              onClick={() => {
                setPosicion(x.posicion);
                setIntensidad(x.intensidad);
              }}
            >
              {x.nombre}
            </button>
          ))}
        </div>
        <button type="button" className="mf-btn mv-lab__perfil" aria-pressed={perfil} onClick={() => setPerfil((x) => !x)}>
          {perfil ? "Ver de frente" : "Ver de perfil"}
        </button>
        <div className="mv-lab__result" aria-live="polite">
          <p className="mv-lab__verdict">{v.nombre}</p>
          <p>{v.texto}</p>
          <p className="mv-lab__real">La superficie real es convexa.</p>
        </div>
      </div>

      <div className="mv-lab__obra">
        <figure className="mv-recorte">
          <div className="mv-recorte__marco" style={{ aspectRatio: RECORTE_PROPORCION }}>
            <Image
              src={MEDUSA.imagen.src}
              alt="Detalle de la Medusa de Caravaggio: a la derecha de la cabeza, entre las serpientes, una sombra oscura se extiende sobre el fondo verde del escudo."
              width={MEDUSA.imagen.width}
              height={MEDUSA.imagen.height}
              sizes="(min-width: 64rem) 760px, 240vw"
              quality={70}
              loading="lazy"
              style={RECORTE_ESTILO}
            />
            <svg className="mv-recorte__zona" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <ellipse cx={ZONA.cx} cy={ZONA.cy} rx={ZONA.rx} ry={ZONA.ry} />
            </svg>
          </div>
          <figcaption>{SOMBRA.recorte}</figcaption>
        </figure>
        <div className="mv-lab__texto">
          <div className="mv-bloque">
            <KindTag tipo="hecho" />
            <p>{SOMBRA.hecho}</p>
          </div>
          <div className="mv-bloque">
            <KindTag tipo="hecho" />
            <p>{SOMBRA.soporte}</p>
          </div>
          <details className="mv-mas">
            <summary>Leer más y ver las fuentes</summary>
            <div className="mv-bloque">
              <KindTag tipo="lectura" />
              <p>{SOMBRA.lectura}</p>
            </div>
            <ul>
              {SOMBRA.fuentes.map((f) => (
                <li key={f.href}>
                  <a href={f.href} target="_blank" rel="noopener noreferrer">
                    {f.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
