"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EMPIREO_IMG as I, ESTACIONES, PERFIL_LUZ } from "@/content/empireo";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const luzEn = (y: number) => {
  const f = clamp(y, 0, 1) * (PERFIL_LUZ.length - 1);
  const i = Math.floor(f);
  const j = Math.min(i + 1, PERFIL_LUZ.length - 1);
  return PERFIL_LUZ[i] + (PERFIL_LUZ[j] - PERFIL_LUZ[i]) * (f - i);
};
const LUZ_MAX = Math.max(...PERFIL_LUZ);
/** Regla de luz: el perfil real de la reproducción, de arriba abajo. */
const REGLA = `linear-gradient(to bottom, ${PERFIL_LUZ.map(
  (v, i) => `hsl(40 ${Math.round(v * 1.2)}% ${Math.round(8 + (v / LUZ_MAX) * 62)}%) ${((i / (PERFIL_LUZ.length - 1)) * 100).toFixed(1)}%`,
).join(", ")})`;

type Vista = { x: number; y: number; z: number };
const INICIO: Vista = { x: ESTACIONES[0].x, y: ESTACIONES[0].y, z: ESTACIONES[0].zoom };

/**
 * Explorador de la ascensión: una ventana sobre la tabla que sube de la oscuridad a la luz.
 * La vista objetivo (x, y, zoom, en fracciones de la imagen) se persigue con una sola animación
 * que solo corre mientras la ventana se desplaza; con movimiento reducido salta sin transición.
 */
export function Ascension() {
  const ventana = useRef<HTMLDivElement>(null);
  const hoja = useRef<HTMLDivElement>(null);
  const actual = useRef<Vista>({ ...INICIO });
  const meta = useRef<Vista>({ ...INICIO });
  const raf = useRef(0);
  const tam = useRef({ w: 1, h: 1 });
  const [est, setEst] = useState(0);
  const [vista, setVista] = useState<Vista>(INICIO);
  const [luz, setLuz] = useState(() => Math.round(luzEn(ESTACIONES[0].y)));

  const pintar = useCallback(() => {
    const el = hoja.current;
    if (!el) return;
    const { x, y, z } = actual.current;
    const { w, h } = tam.current;
    const sw = w * z;
    const sh = sw * I.ratio;
    const tx = clamp(w / 2 - x * sw, w - sw, 0);
    const ty = clamp(h / 2 - y * sh, h - sh, 0);
    el.style.width = `${sw}px`;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    const yc = (h / 2 - ty) / sh; // centro real de la ventana, ya limitado por los bordes
    const l = luzEn(yc);
    setLuz(Math.round(l));
    ventana.current?.style.setProperty("--brillo", (l / LUZ_MAX).toFixed(3));
  }, []);

  const animar = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      actual.current = { ...meta.current };
      pintar();
      return;
    }
    const paso = () => {
      const a = actual.current;
      const m = meta.current;
      a.x += (m.x - a.x) * 0.14;
      a.y += (m.y - a.y) * 0.14;
      a.z += (m.z - a.z) * 0.14;
      const cerca = Math.abs(m.x - a.x) + Math.abs(m.y - a.y) + Math.abs(m.z - a.z) < 0.0008;
      if (cerca) actual.current = { ...m };
      pintar();
      if (cerca) return;
      // Pestaña oculta: no se anima; al volver se salta a la meta
      if (document.hidden) {
        actual.current = { ...m };
        pintar();
        return;
      }
      raf.current = requestAnimationFrame(paso);
    };
    raf.current = requestAnimationFrame(paso);
  }, [pintar]);

  const ir = useCallback(
    (v: Vista, e: number) => {
      meta.current = v;
      setVista(v);
      setEst(e);
      animar();
    },
    [animar],
  );

  useEffect(() => {
    const v = ventana.current;
    if (!v) return;
    const medir = () => {
      tam.current = { w: v.clientWidth, h: v.clientHeight };
      pintar();
    };
    const ro = new ResizeObserver(medir);
    ro.observe(v);
    medir();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf.current);
    };
  }, [pintar]);

  const estacion = ESTACIONES[est];
  const irA = (i: number) => {
    const n = clamp(i, 0, ESTACIONES.length - 1);
    const e = ESTACIONES[n];
    ir({ x: e.x, y: e.y, z: e.zoom }, n);
  };
  // Mando continuo: 0 = abajo (oscuridad), 100 = arriba (luz). Solo mueve la altura.
  const sube = Math.round((1 - vista.y) * 100);
  const mover = (p: number) => {
    const y = 1 - p / 100;
    let cerca = 0;
    ESTACIONES.forEach((e, i) => {
      if (Math.abs(e.y - y) < Math.abs(ESTACIONES[cerca].y - y)) cerca = i;
    });
    ir({ ...meta.current, y }, cerca);
  };
  const entero = vista.z <= 1.05;
  const acercar = () => ir({ ...meta.current, z: entero ? estacion.zoom : 1 }, est);

  return (
    <section className="emp-explora" aria-labelledby="emp-explora-h">
      <div className="emp-explora__cab">
        <h2 id="emp-explora-h" className="sp-h2">Sube hacia la luz</h2>
        <p>Recorre cinco estaciones de abajo arriba y mira cuánta luz hay en cada una.</p>
      </div>
      <div className="emp-explora__cuerpo">
        <div className="emp-ventana-col">
          <div className="emp-ventana" ref={ventana} role="img" aria-label={`Ventana sobre la tabla: ${estacion.titulo}`}>
            <div className="emp-hoja" ref={hoja}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${BASE}${I.base}-${I.anchos[1]}.webp`}
                width={I.width}
                height={I.height}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              {ESTACIONES.map((e, i) => (
                <span key={e.id} className="emp-marca" data-on={i === est} style={{ left: `${e.x * 100}%`, top: `${e.y * 100}%` }} aria-hidden="true" />
              ))}
            </div>
            <div className="emp-vela" aria-hidden="true" />
          </div>
          <div className="emp-regla" style={{ backgroundImage: REGLA }} aria-hidden="true">
            <span className="emp-regla__marca" style={{ top: `${vista.y * 100}%` }} />
          </div>
        </div>

        <div className="emp-mandos">
          <p className="emp-luz">
            <span className="emp-luz__n">{luz}</span>
            <span className="emp-luz__u">% de luz en la reproducción</span>
          </p>
          <div className="emp-estacion" aria-live="polite">
            <p className="emp-estacion__n">
              Estación {est + 1} de {ESTACIONES.length}
            </p>
            <h3>{estacion.titulo}</h3>
            <p>{estacion.texto}</p>
          </div>
          <label className="emp-rango">
            <span>Altura</span>
            <input type="range" min={0} max={100} step={1} value={sube} onChange={(e) => mover(Number(e.target.value))} aria-valuetext={`${sube} % de ascenso`} />
          </label>
          <div className="emp-botones">
            <button type="button" className="mf-btn" onClick={() => irA(est - 1)} disabled={est === 0}>↓ Bajar</button>
            <button type="button" className="mf-btn mf-btn--solid" onClick={() => irA(est + 1)} disabled={est === ESTACIONES.length - 1}>Subir ↑</button>
            <button type="button" className="mf-btn" onClick={acercar} aria-pressed={!entero}>{entero ? "Acercar" : "Alejar"}</button>
          </div>
          <ol className="emp-lista" aria-label="Estaciones">
            {ESTACIONES.map((e, i) => (
              <li key={e.id}>
                <button type="button" onClick={() => irA(i)} aria-current={i === est ? "step" : undefined}>
                  <span>{i + 1}</span> {e.titulo}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
