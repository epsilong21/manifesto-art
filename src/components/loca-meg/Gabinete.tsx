"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CALMA, NOTA_GABINETE, OBJETOS, PISTA, RESTAURADO, describir, type Toque } from "@/content/loca-meg-gabinete";
import { crearPintor2D, crearPintorGL, type Pintor } from "./gabineteGL";
import { GIRO, INCLINACION, REPOSO, camara, clamp, geometria, mundoPorPixel, proyectar, type Estado, type V3 } from "./gabineteEstado";

const CLAVES = ["h", "t", "g"] as const;
type Clave = (typeof CLAVES)[number];
/** Recorrido en el mundo que equivale a todo el rango de cada mando. */
const RECORRIDO: Record<Clave, number> = { h: 1.3, t: 1.1, g: 1.6 };
const PASO: Record<Clave, number> = { h: 0.1, t: 0.15, g: 0.15 };
const grados = (rad: number) => Math.round(rad * (180 / Math.PI));

function valorTexto(k: Clave, e: Estado): string {
  if (k === "h") {
    const d = Math.round((e.h - 0.5) * 200);
    return d === 0 ? "A su altura de partida" : `${d > 0 ? "Sube" : "Baja"} ${Math.abs(d)} % de su recorrido`;
  }
  if (k === "t") {
    const d = grados(e.t * INCLINACION);
    return d === 0 ? "Recto" : `Inclinado ${Math.abs(d)}° a la ${d > 0 ? "derecha" : "izquierda"}`;
  }
  const d = grados(e.g * GIRO);
  return d === 0 ? "De frente" : `Girado ${Math.abs(d)}° a la ${d > 0 ? "derecha" : "izquierda"}`;
}
const valorNum = (k: Clave, e: Estado) => (k === "h" ? Math.round(e.h * 100) : Math.round(e[k] * 100));

/**
 * «El gabinete de lo imposible»: tres objetos que cuelgan de la misma viga. Cada uno se maneja
 * directamente (arrastrando o con el teclado) y los otros dos responden por una regla matemática.
 * La escena solo se dibuja mientras algo se mueve.
 */
export function Gabinete() {
  const escena = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const mandos = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const motor = useRef<{ despertar: () => void; resumir: () => void; alto: () => number } | null>(null);
  const s = useRef({
    cur: { ...REPOSO } as Estado,
    tgt: { ...REPOSO } as Estado,
    vel: { h: 0, t: 0, g: 0 },
    raf: 0,
    ultimo: 0,
    visible: false,
    quieto: false,
    toque: null as Toque,
    pintor: null as Pintor | null,
    w: 1,
    h: 1,
    mov: false,
    arrastre: null as null | { k: number; x: number; y: number; ini: Estado },
  });
  const [gl, setGl] = useState<boolean | null>(null);
  const [listo, setListo] = useState(false);
  const [valores, setValores] = useState<Estado>({ ...REPOSO });
  const [resumen, setResumen] = useState<{ titulo: string; texto: string }>(CALMA);
  const [selec, setSelec] = useState<number | null>(null);

  useEffect(() => {
    const st = s.current;
    const cv = lienzo.current!;
    const caja = escena.current!;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    st.quieto = mq.matches;
    const movil = matchMedia("(pointer: coarse)").matches || innerWidth < 700;

    const pintar = (calidad = 1) => {
      const p = st.pintor;
      if (!p) return;
      const cam = camara(st.w / st.h);
      const g = geometria(st.cur);
      p.pintar(g, cam, calidad);
      const pos: V3[] = [g.hierro.pos, g.recipiente.pos, g.ensamble.centro];
      pos.forEach((q, k) => {
        const el = mandos.current[k];
        if (!el) return;
        const [x, y] = proyectar(cam, q);
        el.style.left = `${(x * 100).toFixed(2)}%`;
        el.style.top = `${(y * 100).toFixed(2)}%`;
      });
    };

    const resumir = () => {
      const g = geometria(st.tgt);
      setValores({ ...st.tgt });
      const igual = CLAVES.every((k) => Math.abs(st.tgt[k] - REPOSO[k]) < 1e-6);
      setResumen(igual && st.toque === null ? CALMA : igual ? RESTAURADO : describir(st.tgt, st.toque, g.desorden));
    };

    const paso = (ts: number) => {
      st.raf = 0;
      if (!st.visible) return;
      const dt = st.ultimo ? clamp((ts - st.ultimo) / 1000, 0, 0.05) : 0.016;
      st.ultimo = ts;
      let fin = true;
      for (const k of CLAVES) {
        const a = 70 * (st.tgt[k] - st.cur[k]) - 11 * st.vel[k];
        st.vel[k] += a * dt;
        st.cur[k] += st.vel[k] * dt;
        if (Math.abs(st.tgt[k] - st.cur[k]) > 4e-4 || Math.abs(st.vel[k]) > 4e-3) fin = false;
      }
      if (fin) {
        CLAVES.forEach((k) => {
          st.cur[k] = st.tgt[k];
          st.vel[k] = 0;
        });
        st.mov = false;
        st.ultimo = 0;
        pintar(1);
        return;
      }
      st.mov = true;
      pintar(0.72);
      st.raf = requestAnimationFrame(paso);
    };

    const despertar = () => {
      if (!st.pintor) return;
      if (st.quieto) {
        CLAVES.forEach((k) => {
          st.cur[k] = st.tgt[k];
          st.vel[k] = 0;
        });
        pintar(1);
        return;
      }
      if (st.raf || !st.visible) return;
      st.ultimo = 0;
      st.raf = requestAnimationFrame(paso);
    };
    motor.current = { despertar, resumir, alto: () => st.h };

    const arrancar = (gl2: boolean) => {
      const p = gl2 ? crearPintorGL(cv, movil) : crearPintor2D(cv);
      if (!p) return false;
      st.pintor?.liberar();
      st.pintor = p;
      p.medir(st.w, st.h);
      setGl(gl2);
      setListo(true);
      pintar(1);
      return true;
    };
    const medir = () => {
      st.w = Math.max(1, caja.clientWidth);
      st.h = Math.max(1, caja.clientHeight);
      const d = clamp(1.5 / mundoPorPixel(camara(st.w / st.h), st.h), 56, 170);
      caja.style.setProperty("--gb-d", `${d.toFixed(0)}px`);
      st.pintor?.medir(st.w, st.h);
      pintar(1);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(caja);
    // El sombreador se compila cuando la sala está cerca, no al cargar la página
    let cancelado = false;
    const cerca = new IntersectionObserver(
      ([en]) => {
        if (!en.isIntersecting || st.pintor || cancelado) return;
        if (!arrancar(true)) setGl(false);
      },
      { rootMargin: "100% 0px" },
    );
    cerca.observe(caja);
    const io = new IntersectionObserver(([en]) => {
      st.visible = en.isIntersecting;
      if (st.visible) {
        st.ultimo = 0;
        pintar(1);
        if (!CLAVES.every((k) => st.cur[k] === st.tgt[k])) despertar();
      }
    });
    io.observe(caja);
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
      cancelado = true;
      ro.disconnect();
      cerca.disconnect();
      io.disconnect();
      mq.removeEventListener("change", cambio);
      cv.removeEventListener("webglcontextlost", perdido);
      cancelAnimationFrame(st.raf);
      st.raf = 0;
      motor.current = null;
      st.pintor?.liberar();
      st.pintor = null;
    };
  }, []);

  // Sin WebGL (o con el contexto perdido): el mismo dibujo en 2D sobre un lienzo nuevo
  useEffect(() => {
    if (gl !== false) return;
    const st = s.current;
    const cv = lienzo.current;
    if (!cv) return;
    st.pintor?.liberar();
    const p = crearPintor2D(cv);
    if (!p) return;
    st.pintor = p;
    p.medir(st.w, st.h);
    setListo(true);
    motor.current?.despertar();
    const cam = camara(st.w / st.h);
    p.pintar(geometria(st.cur), cam, 1);
    mandos.current.forEach((el, k) => {
      if (!el) return;
      const g = geometria(st.cur);
      const [x, y] = proyectar(cam, [g.hierro.pos, g.recipiente.pos, g.ensamble.centro][k]);
      el.style.left = `${(x * 100).toFixed(2)}%`;
      el.style.top = `${(y * 100).toFixed(2)}%`;
    });
  }, [gl]);

  const poner = useCallback((k: Clave, v: number, toque: Toque) => {
    const st = s.current;
    const [min, max] = k === "h" ? [0, 1] : [-1, 1];
    st.tgt[k] = clamp(Math.round(v * 1000) / 1000, min, max);
    st.toque = toque;
    motor.current?.despertar();
  }, []);

  const teclas = (i: number) => (ev: KeyboardEvent<HTMLDivElement>) => {
    const k = CLAVES[i];
    const paso = PASO[k] * (ev.key === "PageUp" || ev.key === "PageDown" ? 2.5 : 1);
    let v: number;
    if (ev.key === "ArrowUp" || ev.key === "ArrowRight" || ev.key === "PageUp") v = s.current.tgt[k] + paso;
    else if (ev.key === "ArrowDown" || ev.key === "ArrowLeft" || ev.key === "PageDown") v = s.current.tgt[k] - paso;
    else if (ev.key === "Home") v = REPOSO[k];
    else return;
    ev.preventDefault();
    poner(k, v, i as Toque);
    motor.current?.resumir();
  };

  const agarrar = (i: number) => (ev: PointerEvent<HTMLDivElement>) => {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    ev.currentTarget.focus({ preventScroll: true });
    s.current.arrastre = { k: i, x: ev.clientX, y: ev.clientY, ini: { ...s.current.tgt } };
  };
  const arrastrar = (ev: PointerEvent<HTMLDivElement>) => {
    const a = s.current.arrastre;
    if (!a) return;
    const k = CLAVES[a.k];
    const wpp = mundoPorPixel(camara(s.current.w / s.current.h), s.current.h);
    // El hierro sigue al puntero en vertical; el recipiente y el ensamblaje, en horizontal
    const d = k === "h" ? -(ev.clientY - a.y) : ev.clientX - a.x;
    poner(k, a.ini[k] + (d * wpp) / RECORRIDO[k], a.k as Toque);
  };
  const soltar = () => {
    if (!s.current.arrastre) return;
    s.current.arrastre = null;
    motor.current?.resumir();
  };

  const restaurar = () => {
    const st = s.current;
    CLAVES.forEach((k) => (st.tgt[k] = REPOSO[k]));
    st.toque = null;
    motor.current?.despertar();
    motor.current?.resumir();
    setResumen(RESTAURADO);
  };

  const separado = CLAVES.some((k) => Math.abs(valores[k] - REPOSO[k]) > 1e-6);

  return (
    <section id="gabinete-de-lo-imposible" className="gb-sala" data-gl={gl === false ? "no" : "si"} data-listo={listo} aria-labelledby="gb-titulo" aria-roledescription="instalación">
      <header className="gb-cabeza">
        <p className="gb-ante">Instalación de MANIFESTO</p>
        <h2 id="gb-titulo">El gabinete de lo imposible</h2>
        <p className="gb-lema">Tres objetos cuelgan de una viga. Mueve uno y los otros responden.</p>
      </header>

      <div className="gb-escena" ref={escena}>
        <canvas key={gl === false ? "2d" : "gl"} ref={lienzo} className="gb-lienzo" aria-hidden="true" />
        <div className="gb-capa">
          {OBJETOS.map((o, i) => {
            const k = CLAVES[i];
            return (
              <div
                key={o.n}
                ref={(el) => {
                  mandos.current[i] = el;
                }}
                className="gb-mando"
                role="slider"
                tabIndex={listo ? 0 : -1}
                data-sel={selec === i}
                data-activo={Math.abs(valores[k] - REPOSO[k]) > 1e-6}
                aria-label={`${o.n} · ${o.nombre}: ${o.mando}`}
                aria-orientation={k === "h" ? "vertical" : "horizontal"}
                aria-valuemin={k === "h" ? 0 : -100}
                aria-valuemax={100}
                aria-valuenow={valorNum(k, valores)}
                aria-valuetext={valorTexto(k, valores)}
                data-eje={k === "h" ? "v" : "h"}
                onKeyDown={teclas(i)}
                onFocus={() => setSelec(i)}
                onBlur={() => setSelec((v) => (v === i ? null : v))}
                onPointerDown={agarrar(i)}
                onPointerMove={arrastrar}
                onPointerUp={soltar}
                onPointerCancel={soltar}
              >
                <span aria-hidden="true">{o.n}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="gb-pie">
        <div className="gb-texto" aria-live="polite" aria-atomic="true">
          <h3>{resumen.titulo}</h3>
          <p>{resumen.texto}</p>
        </div>
        <div className="gb-acciones">
          <button type="button" className="gb-restaurar" onClick={restaurar} aria-disabled={!separado}>
            <span aria-hidden="true">↺</span> Restaurar la composición
          </button>
        </div>
        <p className="gb-pista">{PISTA}</p>
        <p className="gb-nota">{NOTA_GABINETE}</p>
      </div>

      <div className="gb-nojs">
        {OBJETOS.map((o) => (
          <p key={o.n}>
            <strong>
              {o.n} · {o.nombre}.
            </strong>{" "}
            {o.n === "I"
              ? "Un volumen de hierro envejecido que parece pesado y permanece suspendido. Al subirlo, baja el recipiente."
              : o.n === "II"
                ? "Un recipiente de bronce cuyo interior brilla. Al inclinarlo, las formas suspendidas fluyen hacia ese lado, contra la gravedad."
                : "Siete piezas abstractas en orden. Se desordenan cuando el hierro o el recipiente se mueven y se recomponen al devolverlos."}
          </p>
        ))}
        <p>{NOTA_GABINETE}</p>
      </div>
    </section>
  );
}
