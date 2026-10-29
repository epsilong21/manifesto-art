"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { ATMOSFERAS, EMPIREO_IMG as I, ESTACIONES, luzEn, PERFIL_LUZ } from "@/content/empireo";
import { crearUmbral, type Umbral as Motor } from "./umbralGL";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const IMG = `${BASE}${I.base}-${I.anchos[1]}.webp`;
const ROMANOS = ["I", "II", "III", "IV", "V"];
const MAX = ESTACIONES.length - 1;
const LUCES = ESTACIONES.map((e) => Math.round(luzEn(e.y)));
const LMIN = Math.min(...PERFIL_LUZ);
const LMAX = Math.max(...PERFIL_LUZ);
/** Proporción alto/ancho del archivo, para encuadrar las visiones. */
const ALTO = I.height / I.width;

const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
/** Valor de una estación interpolado en un punto continuo del recorrido. */
const enViaje = (v: number, f: (k: number) => number) => {
  const i = Math.min(Math.floor(v), MAX);
  return mezcla(f(i), f(Math.min(i + 1, MAX)), v - i);
};
const enViaje3 = (v: number, f: (k: number) => [number, number, number]): [number, number, number] => [
  enViaje(v, (k) => f(k)[0]),
  enViaje(v, (k) => f(k)[1]),
  enViaje(v, (k) => f(k)[2]),
];

/** Encuadre de cada visión dentro de la tabla, sin salirse de sus bordes. */
const VISIONES = ESTACIONES.map((e) => {
  const mx = 0.5 / e.zoom;
  const my = 0.5 / (e.zoom * ALTO);
  return { x: limitar(e.x, mx, 1 - mx), y: limitar(e.y, my, 1 - my), z: e.zoom };
});

/**
 * «Umbral de luz»: el visitante atraviesa un túnel de luz en cinco estaciones. Mantener pulsado
 * «Ascender» avanza de forma continua; un toque, las flechas o la tabla del lateral llevan a cada
 * estación. El brillo del túnel sigue la luz medida en la reproducción. Un solo canvas animado,
 * en pausa fuera de pantalla o con la pestaña oculta; con movimiento reducido no hay bucle y la
 * escena se repinta en cada cambio.
 */
export function Umbral() {
  const sala = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const mapa = useRef<HTMLDivElement>(null);
  const visiones = useRef<(HTMLDivElement | null)[]>([]);
  const repintar = useRef<() => void>(() => {});
  const s = useRef({ viaje: 0, meta: 0, sube: false, desde: 0, t: 0, par: [0, 0], parMeta: [0, 0], quieto: false, est: 0 });
  const [est, setEst] = useState(0);
  const [gl, setGl] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [alFinal, setAlFinal] = useState(false);

  const aplicar = useCallback((motor: Motor | null) => {
    const e = s.current;
    const v = e.viaje;
    visiones.current.forEach((el, k) => {
      if (!el) return;
      const d = v - k;
      const o = Math.max(0, 1 - Math.abs(d) / 0.55);
      el.style.opacity = (o * o * (3 - 2 * o)).toFixed(3);
      el.style.visibility = o > 0 ? "visible" : "hidden";
      el.style.setProperty("--k", (1 + d * 0.4).toFixed(3));
    });
    const luz = enViaje(v, (k) => LUCES[k]);
    mapa.current?.style.setProperty("--y", enViaje(v, (k) => ESTACIONES[k].y).toFixed(4));
    sala.current?.style.setProperty("--luz", ((luz - LMIN) / (LMAX - LMIN)).toFixed(3));
    const n = Math.round(v);
    if (n !== e.est) {
      e.est = n;
      setEst(n);
    }
    setAlFinal(e.meta >= MAX - 0.001);
    motor?.pintar({
      tiempo: e.t,
      viaje: v,
      luz: (luz - LMIN) / (LMAX - LMIN),
      final: limitar(v - (MAX - 1), 0, 1) ** 2,
      tinte: enViaje3(v, (k) => ATMOSFERAS[k].tinte),
      nucleo: enViaje3(v, (k) => ATMOSFERAS[k].nucleo),
      par: [e.par[0], e.par[1]],
    });
  }, []);

  useEffect(() => {
    const canvas = lienzo.current;
    const raiz = sala.current;
    if (!canvas || !raiz) return;
    const e = s.current;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    e.quieto = mq.matches;
    let motor = crearUmbral(canvas);
    setGl(!!motor);
    let escala = Math.min(window.devicePixelRatio || 1, 1.5) * (window.matchMedia("(pointer: coarse)").matches ? 0.75 : 1);
    let raf = 0;
    let ultimo = 0;
    let lentos = 0;
    let visible = false;

    const frame = (ahora: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, ultimo ? (ahora - ultimo) / 1000 : 0.016);
      ultimo = ahora;
      // Resolución adaptativa: si los fotogramas se alargan, se pinta con menos píxeles
      if (dt > 0.026) lentos++;
      else lentos = Math.max(0, lentos - 1);
      if (lentos > 45 && escala > 0.5) {
        escala *= 0.8;
        motor?.medir(escala);
        lentos = 0;
      }
      e.t += dt;
      if (e.sube) e.meta = Math.min(MAX, e.meta + dt * 0.6);
      const k = 1 - Math.exp(-dt * 3.2);
      e.viaje += (e.meta - e.viaje) * k;
      e.par[0] += (e.parMeta[0] - e.par[0]) * k;
      e.par[1] += (e.parMeta[1] - e.par[1]) * k;
      aplicar(motor);
    };
    const parar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ultimo = 0;
    };
    const arrancar = () => {
      if (raf || e.quieto || !visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };
    repintar.current = () => {
      if (!e.quieto) return;
      e.viaje = e.meta;
      aplicar(motor);
    };

    const medir = () => {
      motor?.medir(escala);
      aplicar(motor);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(canvas);
    const io = new IntersectionObserver(([x]) => {
      visible = x.isIntersecting;
      if (visible) arrancar();
      else parar();
    });
    io.observe(raiz);
    const alOcultar = () => (document.hidden ? parar() : arrancar());
    document.addEventListener("visibilitychange", alOcultar);
    const alCambiarMovimiento = () => {
      e.quieto = mq.matches;
      if (e.quieto) {
        parar();
        repintar.current();
      } else arrancar();
    };
    mq.addEventListener("change", alCambiarMovimiento);
    const perdido = (ev: Event) => {
      ev.preventDefault();
      parar();
      motor = null;
      setGl(false);
      arrancar();
    };
    canvas.addEventListener("webglcontextlost", perdido);

    return () => {
      parar();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", alOcultar);
      mq.removeEventListener("change", alCambiarMovimiento);
      canvas.removeEventListener("webglcontextlost", perdido);
      motor?.liberar();
    };
  }, [aplicar]);

  const irA = (k: number) => {
    s.current.meta = limitar(k, 0, MAX);
    s.current.sube = false;
    repintar.current();
  };
  const siguiente = () => irA(Math.floor(s.current.meta + 0.001) + 1);
  const anterior = () => irA(Math.ceil(s.current.meta - 0.001) - 1);

  const pulsar = (ev: PointerEvent<HTMLButtonElement>) => {
    if (ev.button !== 0) return;
    try {
      ev.currentTarget.setPointerCapture(ev.pointerId);
    } catch {
      // Sin captura el gesto sigue funcionando: soltar fuera del botón lo termina igual
    }
    s.current.desde = ev.timeStamp || 1;
    if (!s.current.quieto) s.current.sube = true;
    setSubiendo(true);
  };
  const soltar = (ev: PointerEvent<HTMLButtonElement>) => {
    const e = s.current;
    if (!e.desde) return;
    const breve = ev.timeStamp - e.desde < 260;
    e.desde = 0;
    setSubiendo(false);
    if (e.quieto || breve) {
      e.sube = false;
      siguiente();
      return;
    }
    e.sube = false;
    e.meta = Math.min(MAX, Math.round(e.meta + 0.25));
  };

  const teclas = (ev: KeyboardEvent<HTMLElement>) => {
    const acciones: Record<string, () => void> = {
      ArrowUp: siguiente,
      PageUp: siguiente,
      ArrowRight: siguiente,
      ArrowDown: anterior,
      PageDown: anterior,
      ArrowLeft: anterior,
      Home: () => irA(0),
      End: () => irA(MAX),
    };
    const f = acciones[ev.key];
    if (!f) return;
    ev.preventDefault();
    f();
  };

  const mover = (ev: PointerEvent<HTMLElement>) => {
    if (ev.pointerType !== "mouse" || s.current.quieto) return;
    const r = ev.currentTarget.getBoundingClientRect();
    s.current.parMeta = [(ev.clientX - r.left) / r.width - 0.5, (ev.clientY - r.top) / r.height - 0.5];
  };

  const e = ESTACIONES[est];

  return (
    <section
      ref={sala}
      className="um-sala"
      data-gl={gl ? "si" : "no"}
      aria-labelledby="um-titulo"
      aria-roledescription="instalación"
      onKeyDown={teclas}
      onPointerMove={mover}
      onPointerLeave={() => (s.current.parMeta = [0, 0])}
      style={{ "--y": ESTACIONES[0].y } as CSSProperties}
    >
      <div className="um-fondo" aria-hidden="true" />
      <canvas ref={lienzo} className="um-lienzo" aria-hidden="true" />

      {VISIONES.map((v, k) => (
        <div
          key={ESTACIONES[k].id}
          ref={(el) => {
            visiones.current[k] = el;
          }}
          className="um-vision"
          aria-hidden="true"
          style={{ "--x": v.x, "--y": v.y, "--z": v.z, "--alto": ALTO, backgroundImage: `url(${IMG})`, opacity: k === 0 ? 1 : 0, visibility: k === 0 ? "visible" : "hidden" } as CSSProperties}
        />
      ))}

      <header className="um-cab">
        <p className="um-cab__k">Instalación de MANIFESTO</p>
        <h2 id="um-titulo" className="um-cab__t">Umbral de luz</h2>
        <p className="um-cab__p">Atraviesa el túnel en cinco estaciones. Su luz sigue la luz medida en cada tramo de la tabla.</p>
      </header>

      <div className="um-pie" aria-live="polite">
        <p className="um-pie__n">
          <span>{ROMANOS[est]}</span> <em className="um-pie__e">Estación {est + 1} de {ESTACIONES.length} · </em>{LUCES[est]} % de luz
        </p>
        <h3 className="um-pie__t">{e.titulo}</h3>
        <p className="um-pie__x">{e.texto}</p>
      </div>

      <div className="um-eje">
        <div ref={mapa} className="um-mapa" style={{ backgroundImage: `url(${IMG})` }}>
          <span className="um-mapa__luz" style={{ backgroundImage: `url(${IMG})` }} aria-hidden="true" />
          {ESTACIONES.map((x, k) => (
            <button
              key={x.id}
              type="button"
              className="um-nodo"
              style={{ top: `${x.y * 100}%` }}
              aria-current={est === k ? "step" : undefined}
              aria-label={`Estación ${k + 1}: ${x.titulo}`}
              onClick={() => irA(k)}
            >
              <span aria-hidden="true">{ROMANOS[k]}</span>
            </button>
          ))}
        </div>
        <div className="um-control">
          <button type="button" className="um-bajar" onClick={anterior} disabled={est === 0} aria-label="Descender una estación">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M5 11l5 5 5-5" /></svg>
          </button>
          {alFinal ? (
            <button type="button" className="um-subir" onClick={() => irA(0)} aria-label="Volver a la primera estación">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5M4 3v3h3" /></svg>
            </button>
          ) : (
            <button
              type="button"
              className="um-subir"
              data-activo={subiendo}
              aria-label="Ascender: mantén pulsado para subir, o pulsa para pasar a la estación siguiente"
              onPointerDown={pulsar}
              onPointerUp={soltar}
              onLostPointerCapture={soltar}
              onClick={(ev) => {
                if (ev.detail === 0) siguiente();
              }}
              onContextMenu={(ev) => ev.preventDefault()}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M5 9l5-5 5 5" /></svg>
            </button>
          )}
        </div>
        <p className="um-pista" aria-hidden="true">{alFinal ? "Volver" : "Mantén para ascender"}</p>
      </div>

      <ol className="um-nojs">
        {ESTACIONES.map((x, k) => (
          <li key={x.id}>
            <strong>{ROMANOS[k]} · {x.titulo}</strong> ({LUCES[k]} % de luz). {x.texto}
          </li>
        ))}
      </ol>
    </section>
  );
}
