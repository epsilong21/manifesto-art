"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import {
  MEDIDAS_MUNDOS,
  MUNDOS,
  MUNDOS_DOCUMENTADO,
  MUNDOS_INTERPRETACION,
  NUCLEO,
  PERSPECTIVA,
} from "@/content/cristo-dali";
import { centroFranja, luzEn, Nucleo } from "./Escenarios";
import { crearEscena, mirar, type Camara, type Escena } from "./imposibleGL";

type V3 = [number, number, number];
const MOMENTOS = ["El punto imposible", "Dos mundos", "La geometría del silencio"] as const;
const MOMENTOS_CORTOS = ["El punto", "Dos mundos", "Geometría"];
const ROMANOS = ["I", "II", "III"];
/** Mirada fija del paisaje en el cuadro (grados sobre el horizonte): casi de frente. */
const MIRADA_PAISAJE = 3;
const ORIGEN: V3 = [0, -0.6, 0];
const DIST = 8.4;
const FOCO = 1.6;
/** Costura entre las dos cámaras: el umbral del cuadro (62 % desde arriba). */
const COSTURA = 1 - 0.62;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rad = (g: number) => (g * Math.PI) / 180;
const mezcla = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const suave = (e: number) => e * e * (3 - 2 * e);

/** Órbita alrededor de la estructura: azimut y elevación en grados. */
const orbita = (az: number, el: number, lejos = 1): [V3, V3] => [
  [ORIGEN[0] + DIST * lejos * Math.cos(rad(el)) * Math.sin(rad(az)), ORIGEN[1] + DIST * lejos * Math.sin(rad(el)), ORIGEN[2] + DIST * lejos * Math.cos(rad(el)) * Math.cos(rad(az))],
  ORIGEN,
];
/** Cámara de la bahía: casi a ras del agua, inclinada para dejar el horizonte donde lo pone el cuadro (88 % desde arriba). */
const bahia = (foco: number): [V3, V3] => {
  const pos: V3 = [0, -13.8, 18];
  const p = Math.atan(0.378 / foco);
  return [pos, [0, pos[1] + Math.sin(p) * 20, pos[2] - Math.cos(p) * 20]];
};
const BAHIA = bahia(FOCO);
/** Focal según la proporción: en vertical se abre el campo para que la estructura quepa a lo ancho. */
const focoPara = (aspecto: number) => FOCO * Math.min(1, aspecto / 1.5);
/** Descenso de los dos mundos: del vacío sobre la estructura a la bahía, pasando por las nubes. */
const DESCENSO: [V3, V3][] = [
  [[0, 8.0, 5.8], [0, -1.0, 0]],
  [[0, 0.4, 10.5], [0, -1.3, 0]],
  // El umbral: rozando el manto de nubes, con el tronco hundiéndose hacia ellas en lo alto del encuadre
  [[0, -7.9, 15], [0, -3.4, -6]],
  BAHIA,
];
function descenso(m: number): [V3, V3] {
  const u = clamp(m, 0, 1) * (DESCENSO.length - 1);
  const k = Math.min(DESCENSO.length - 2, Math.floor(u));
  const e = suave(u - k);
  return [mezcla(DESCENSO[k][0], DESCENSO[k + 1][0], e), mezcla(DESCENSO[k][1], DESCENSO[k + 1][1], e)];
}

const MIRADA_DALI = PERSPECTIVA.dali;
const EL_MAX = PERSPECTIVA.max;

/**
 * «La perspectiva imposible»: instalación 3D en WebGL2 (ver imposibleGL.ts) con tres momentos sobre
 * la misma escena. I: la cruz desde arriba y la bahía de frente en un solo encuadre, como en el cuadro.
 * II: la cámara desciende del vacío a la bahía. III: ejes, triángulo, círculo y núcleo como líneas de
 * luz, comparables con la pintura. Solo se dibuja cuando algo cambia; sin WebGL2, una composición fija.
 */
export function Imposible() {
  const [momento, setMomento] = useState(0);
  const [el, setEl] = useState(MIRADA_DALI);
  const [dual, setDual] = useState(true);
  const [m, setM] = useState(0);
  const [paso, setPaso] = useState(0);
  const [geo, setGeo] = useState(true);
  const [gl, setGl] = useState<boolean | null>(null);

  const lienzo = useRef<HTMLCanvasElement>(null);
  const motor = useRef<{ despertar: () => void } | null>(null);
  const s = useRef({
    momento: 0, az: 0, el: MIRADA_DALI, dual: 1, m: 0, paso: 0, geo: 1, elF: MIRADA_DALI, mF: 0,
    // valores mostrados (suavizados)
    pos: orbita(0, MIRADA_DALI)[0], obj: ORIGEN as V3, dualV: 1, mundoV: 0, geoV: [0, 0, 0, 0] as [number, number, number, number],
    quieto: false, visible: false, raf: 0, ultimo: 0, escala: 1, lentos: 0, arrastre: null as null | { x: number; y: number; tipo: string },
  });

  useEffect(() => {
    const st = s.current;
    const cv = lienzo.current!;
    const escena: Escena | null = crearEscena(cv);
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    st.quieto = mq.matches;
    // Presupuesto de píxeles: unos 450 000 como mucho, sin pasar de la densidad de la pantalla
    const escalaBase = () => Math.min(Math.min(devicePixelRatio || 1, 2), Math.sqrt(450000 / Math.max(1, cv.clientWidth * cv.clientHeight)));
    st.escala = escalaBase();
    setGl(!!escena);

    const objetivo = (): [V3, V3] => {
      if (st.momento === 1) return descenso(st.m);
      // En III la mirada baja para ver la geometría casi de frente
      return st.momento === 2 ? orbita(st.az, Math.min(st.el, 24), 1.18) : orbita(st.az, st.el);
    };

    const pintar = () => {
      if (!escena) return;
      const foco = focoPara(cv.clientWidth / Math.max(1, cv.clientHeight));
      const a: Camara = mirar(st.pos, st.obj);
      const bb = bahia(foco);
      const b: Camara = mirar(bb[0], bb[1]);
      escena.pintar({ a, b, dual: st.dualV, costura: COSTURA, mundo: st.mundoV, geo: st.geoV, foco });
    };

    const paso_ = (ahora: number) => {
      st.raf = 0;
      const dt = st.ultimo ? Math.min(0.1, (ahora - st.ultimo) / 1000) : 1 / 60;
      st.ultimo = ahora;
      const k = st.quieto ? 1 : 1 - Math.exp(-dt * 3.2);
      let mov = 0;
      const ir = (a: number, b: number, kk = k) => {
        const d = b - a;
        if (Math.abs(d) < 1e-4) return b;
        mov = Math.max(mov, Math.abs(d));
        return a + d * kk;
      };
      const [pos, obj] = objetivo();
      st.pos = [ir(st.pos[0], pos[0]), ir(st.pos[1], pos[1]), ir(st.pos[2], pos[2])];
      st.obj = [ir(st.obj[0], obj[0]), ir(st.obj[1], obj[1]), ir(st.obj[2], obj[2])];
      st.dualV = ir(st.dualV, st.momento === 0 && st.dual ? 1 : 0);
      st.mundoV = ir(st.mundoV, st.momento === 1 ? st.m : st.momento === 0 ? 0.35 : 0.2);
      const g = st.momento === 2 && st.geo ? st.paso : -1;
      st.geoV = [0, 1, 2, 3].map((i) => ir(st.geoV[i], g >= i ? 1 : 0, st.quieto ? 1 : 1 - Math.exp(-dt * 2.2))) as [number, number, number, number];

      // Resolución adaptativa: si los fotogramas pesan, se baja la escala
      if (dt > 0.028 && !st.quieto) {
        if (++st.lentos > 8 && st.escala > 0.5) {
          st.escala *= 0.82;
          st.lentos = 0;
          escena?.medir(st.escala);
        }
      } else st.lentos = Math.max(0, st.lentos - 1);

      pintar();
      if (mov > 0 && st.visible) st.raf = requestAnimationFrame(paso_);
    };

    const despertar = () => {
      if (st.raf || !st.visible) return;
      st.ultimo = 0;
      st.raf = requestAnimationFrame(paso_);
    };
    motor.current = { despertar };

    const medir = () => {
      st.escala = escalaBase();
      escena?.medir(st.escala);
      pintar();
    };
    medir();

    const ro = new ResizeObserver(medir);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      st.visible = e.isIntersecting;
      if (st.visible) despertar();
    });
    io.observe(cv);
    const cambio = () => {
      st.quieto = mq.matches;
      despertar();
    };
    mq.addEventListener("change", cambio);
    const perdido = (ev: Event) => {
      ev.preventDefault();
      setGl(false);
    };
    cv.addEventListener("webglcontextlost", perdido);
    return () => {
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener("change", cambio);
      cv.removeEventListener("webglcontextlost", perdido);
      cancelAnimationFrame(st.raf);
      st.raf = 0;
      motor.current = null;
      escena?.liberar();
    };
  }, []);

  useEffect(() => {
    Object.assign(s.current, { momento, el, dual: dual ? 1 : 0, m, paso, geo: geo ? 1 : 0 });
    motor.current?.despertar();
  }, [momento, el, dual, m, paso, geo]);

  const restablecer = () => {
    s.current.az = 0;
    setEl(MIRADA_DALI);
    setDual(true);
    setM(0);
    setPaso(0);
    setGeo(true);
    motor.current?.despertar();
  };

  // ── Gestos: arrastre horizontal = girar alrededor; vertical (ratón) = subir o bajar la mirada ──
  const abajo = (ev: RPointerEvent<HTMLCanvasElement>) => {
    Object.assign(s.current, { elF: el, mF: m });
    s.current.arrastre = { x: ev.clientX, y: ev.clientY, tipo: ev.pointerType };
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
  };
  const mueve = (ev: RPointerEvent<HTMLCanvasElement>) => {
    const a = s.current.arrastre;
    if (!a) return;
    const dx = ev.clientX - a.x, dy = ev.clientY - a.y;
    a.x = ev.clientX;
    a.y = ev.clientY;
    const h = ev.currentTarget.clientHeight || 500;
    if (momento !== 1) s.current.az = clamp(s.current.az - dx * 0.25, -70, 70);
    // Con el dedo, el arrastre vertical desplaza la página (touch-action: pan-y): solo el ratón sube y baja
    if (a.tipo === "mouse") {
      const st = s.current;
      if (momento === 1) {
        st.mF = clamp(st.mF + dy / (h * 1.4), 0, 1);
        setM(Math.round(st.mF * 100) / 100);
      } else {
        st.elF = clamp(st.elF + (dy / h) * 90, 0, EL_MAX);
        setEl(Math.round(st.elF));
      }
    }
    motor.current?.despertar();
  };
  const arriba = () => (s.current.arrastre = null);

  const teclas = (ev: KeyboardEvent) => {
    const d = { ArrowUp: 1, ArrowDown: -1 }[ev.key];
    const g = { ArrowLeft: -1, ArrowRight: 1 }[ev.key];
    if (d) {
      if (momento === 1) setM((v) => clamp(v - d * 0.05, 0, 1));
      else setEl((v) => clamp(v + d * 4, 0, EL_MAX));
    } else if (g && momento !== 1) {
      s.current.az = clamp(s.current.az + g * 8, -70, 70);
      motor.current?.despertar();
    } else if (ev.key === "Home" || ev.key === "0") restablecer();
    else return;
    ev.preventDefault();
  };

  // Raíl vertical: elevación (I y III) o descenso (II); el único control táctil del eje vertical
  const fijarRail = (v: number) => (momento === 1 ? setM(clamp(v, 0, 1)) : setEl(clamp(v, 0, 1) * EL_MAX));
  const railArrastre = useRef(false);
  const railPuntero = (ev: RPointerEvent<HTMLDivElement>) => {
    if (ev.type === "pointerdown") {
      railArrastre.current = true;
      try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
    } else if (!railArrastre.current) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const f = (ev.clientY - r.top) / r.height;
    // En I/III arriba es más elevación; en II arriba es el vacío y abajo la bahía
    fijarRail(momento === 1 ? f : 1 - f);
  };
  const railTeclas = (ev: KeyboardEvent) => {
    const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[ev.key];
    // Arriba sube la mirada en I/III y vuelve al vacío en II
    if (d && momento === 1) setM((v) => clamp(v - d * 0.05, 0, 1));
    else if (d) setEl((v) => clamp(v + d * 4, 0, EL_MAX));
    else if (ev.key === "Home") fijarRail(momento === 1 ? 0 : 1);
    else if (ev.key === "End") fijarRail(momento === 1 ? 1 : 0);
    else return;
    ev.preventDefault();
  };

  // ── Textos de cada momento (datos de cristo-dali.ts) ──
  const tramo = PERSPECTIVA.tramos.find((x) => el <= x.hasta) ?? PERSPECTIVA.tramos[PERSPECTIVA.tramos.length - 1];
  const brecha = Math.round(el - MIRADA_PAISAJE);
  const c = centroFranja(m);
  const mundo = MUNDOS.find((x) => c < x.hasta)!;
  const p = NUCLEO.pasos[paso];
  const railTexto = momento === 1 ? `${mundo.nombre}, luz ${luzEn(c)} por ciento` : `${Math.round(el)} grados sobre la estructura`;
  const descripcion =
    momento === 0
      ? `Estructura suspendida vista desde ${Math.round(el)} grados${dual ? "; la bahía, abajo, casi de frente" : "; toda la escena con la misma mirada"}.`
      : momento === 1
        ? `Descenso de la mirada: ${mundo.nombre.toLowerCase()}.`
        : `Geometría de la estructura: ${geo ? NUCLEO.pasos.slice(0, paso + 1).map((x) => x.nombre.toLowerCase()).join(", ") : "sin líneas"}.`;

  return (
    <section id="perspectiva-imposible" className="pi-sala" data-momento={momento} data-gl={gl === false ? "no" : "si"} aria-labelledby="pi-titulo" aria-roledescription="instalación">
      <div className="pi-escena">
        <canvas
          ref={lienzo}
          className="pi-lienzo"
          tabIndex={0}
          role="img"
          aria-label={`${descripcion} Flechas para cambiar el punto de vista; Inicio para restablecerlo.`}
          onKeyDown={teclas}
          onPointerDown={abajo}
          onPointerMove={mueve}
          onPointerUp={arriba}
          onPointerCancel={arriba}
        />
        <div className="pi-alternativa" aria-hidden="true">
          <svg viewBox="-50 -40 100 80" preserveAspectRatio="xMidYMid slice">
            <g className="pi-alt-cruz">
              <path d="M-26 -10 L26 -10 M0 -22 L0 18" />
              <path d="M-25 -9 L25 -9 L0 16 Z" className="pi-alt-tri" />
              <circle cx="0" cy="-12" r="3.4" className="pi-alt-esf" />
            </g>
          </svg>
        </div>
        <div className="pi-costura" aria-hidden="true" data-on={momento === 0 && dual} />

        <header className="pi-cabeza">
          <p className="pi-ante">Instalación · escena 3D</p>
          <h2 id="pi-titulo">La perspectiva imposible</h2>
          <div className="pi-momentos" role="group" aria-label="Momento">
            {MOMENTOS.map((n, k) => (
              <button key={n} type="button" aria-label={n} aria-pressed={momento === k} onClick={() => setMomento(k)}>
                <span aria-hidden="true">{ROMANOS[k]}</span> <b className="pi-largo">{n}</b>
                <b className="pi-corto" aria-hidden="true">{MOMENTOS_CORTOS[k]}</b>
              </button>
            ))}
          </div>
        </header>

        {momento !== 2 ? (
          <div
            className="pi-rail"
            role="slider"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label={momento === 1 ? "Descenso de la mirada, del vacío a la bahía" : "Elevación de la mirada"}
            aria-valuemin={0}
            aria-valuemax={momento === 1 ? 100 : EL_MAX}
            aria-valuenow={momento === 1 ? Math.round(m * 100) : Math.round(el)}
            aria-valuetext={railTexto}
            onPointerDown={railPuntero}
            onPointerMove={railPuntero}
            onPointerUp={() => (railArrastre.current = false)}
            onPointerCancel={() => (railArrastre.current = false)}
            onKeyDown={railTeclas}
          >
            <span className="pi-rail__via" />
            {momento === 0 ? <span className="pi-rail__dali" style={{ top: `${(1 - MIRADA_DALI / EL_MAX) * 100}%` }} title="Mirada de Dalí" /> : null}
            <span className="pi-rail__asa" style={{ top: `${(momento === 1 ? m : 1 - el / EL_MAX) * 100}%` }}>
              <i>{momento === 1 ? mundo.nombre : `${Math.round(el)}°`}</i>
            </span>
          </div>
        ) : null}

        <div className="pi-acciones">
          {momento === 0 ? (
            <button type="button" aria-pressed={!dual} onClick={() => setDual(!dual)}>
              {dual ? "Una sola mirada" : "Como en el cuadro"}
            </button>
          ) : null}
          {momento === 2 ? (
            <button type="button" aria-pressed={geo} onClick={() => setGeo(!geo)}>
              {geo ? "Ocultar la geometría" : "Mostrar la geometría"}
            </button>
          ) : null}
          <button type="button" className="pi-restablecer" onClick={restablecer} aria-label="Restablecer la vista">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" /></svg>
            <span>Vista original</span>
          </button>
        </div>
      </div>

      <div className="pi-cartela">
        <div className="pi-texto" aria-live="polite">
          <p className="pi-n">{ROMANOS[momento]} · {MOMENTOS[momento]}</p>
          {momento === 0 ? (
            <>
              <h3>{brecha > 10 && dual ? `La estructura a ${Math.round(el)}°, la bahía a ${MIRADA_PAISAJE}°` : dual ? "Las dos miradas coinciden" : `Una sola mirada, a ${Math.round(el)}°`}</h3>
              <p>{tramo.texto}</p>
              {dual ? <p className="pi-dato">{brecha > 10 ? "Imposible: ningún punto de vista ve así las dos cosas a la vez. Pulsa «Una sola mirada» para unirlas." : "Con la mirada baja, la escena vuelve a ser posible."}</p> : <p className="pi-dato">Con una sola cámara, la bahía también se ve desde arriba: el cuadro no lo hace.</p>}
            </>
          ) : null}
          {momento === 1 ? (
            <>
              <h3>{mundo.nombre}</h3>
              <p>{mundo.texto}</p>
              <p className="pi-dato">
                Luz medida en la franja equivalente de la reproducción: <b>{luzEn(c)}{" "}%</b> · media arriba {MEDIDAS_MUNDOS.arriba}{" "}%, abajo {MEDIDAS_MUNDOS.abajo}{" "}%
              </p>
            </>
          ) : null}
          {momento === 2 ? (
            <>
              <h3>{p.nombre}</h3>
              <p>
                <span className="pi-etiqueta" data-tipo={p.tipo}>{p.tipo === "documentado" ? "Documentado" : "Interpretación"}</span> {p.texto}
              </p>
              {paso === NUCLEO.pasos.length - 1 ? (
                <blockquote className="pi-cita">
                  <p>{NUCLEO.cita}</p>
                  <footer>{NUCLEO.citaFuente}</footer>
                </blockquote>
              ) : null}
            </>
          ) : null}
        </div>

        {momento === 2 ? (
          <div className="pi-pasos" role="group" aria-label="Geometría, paso a paso">
            {NUCLEO.pasos.map((x, k) => (
              <button key={x.id} type="button" aria-pressed={paso === k} onClick={() => setPaso(k)}>
                <span aria-hidden="true">{k + 1}</span> {x.nombre}
              </button>
            ))}
          </div>
        ) : null}

        {momento === 2 ? (
          <figure className="pi-lamina">
            <Nucleo paso={geo ? paso : -1} fundido={geo ? 0.35 : 0} />
            <figcaption>Las mismas guías sobre la pintura{geo ? "" : " (ocultas)"}.</figcaption>
          </figure>
        ) : null}

        <details className="pi-notas">
          <summary>Documentado e interpretación</summary>
          <p><b>Documentado.</b> {momento === 0 ? PERSPECTIVA.documentado : momento === 1 ? MUNDOS_DOCUMENTADO : "En un boceto del cuadro, un triángulo representa el cuerpo de Cristo y un círculo ocupa el lugar de la cabeza; Dalí relacionó la imagen con el núcleo del átomo."}</p>
          <p><b>Interpretación.</b> {momento === 0 ? PERSPECTIVA.interpretacion : momento === 1 ? MUNDOS_INTERPRETACION : NUCLEO.interpretacion}</p>
          <p>La escena 3D es una abstracción original de MANIFESTO: dos vigas, el triángulo y la esfera del boceto. No representa el cuerpo de Cristo.</p>
        </details>
      </div>
    </section>
  );
}
