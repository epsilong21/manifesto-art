"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACTOS,
  DOCUMENTADO,
  DOCUMENTADO_FINAL,
  FICHA,
  GALLO,
  INTERPRETACION,
  NEGACIONES,
  REAPARICION,
  SILENCIO,
  SP_IMG,
} from "@/content/san-pedro";
import { type Estado, acercar, estadoEn } from "./linea";
import {
  type NegacionState,
  type Rect,
  cargarImagen,
  destruir,
  iniciar,
  pintar,
  redimensionar,
} from "./negacionGL";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const FRAME_MS = 1000 / 30;
const srcset = SP_IMG.anchos
  .map((w) => `${BASE}${SP_IMG.base}-${w}.webp ${w}w`)
  .join(", ");
const src = (w: number) => `${BASE}${SP_IMG.base}-${w}.webp`;

const NOJS_CSS =
  ".sp-canvas,.sp-visor-zona,.sp-vel,.sp-baja{display:none}" +
  ".sp-pista .sp-beat{min-height:0;padding:2.5rem var(--sp-gutter)}" +
  ".sp-pista .sp-beat--hero .sp-bloque{margin-top:0}" +
  ".sp-pista .sp-beat--contemplar{display:none}" +
  ".sp-pista .sp-bloque{margin:0 auto;max-width:36rem;background:transparent;border:0;padding:0}" +
  ".sp-fb-fig--nojs{padding-top:5rem}";

/** Composición con la pintura al lado del texto (apaisado) o encima (vertical). */
const esLado = (vw: number, vh: number) => vw / vh >= 1.2;

function calcularRect(vw: number, vh: number): Rect {
  const R = SP_IMG.ratio;
  if (esLado(vw, vh)) {
    // deja libre la cabecera (arriba) y la franja del botón del visor (abajo)
    const y = Math.max(vh * 0.07, 76);
    const h = Math.max(120, vh - y - 66);
    const w = Math.min(h * R, vw * 0.5);
    return { x: vw * 0.67 - w / 2, y, w, h: w / R };
  }
  // vertical: cabecera + franja del botón del visor arriba de la pintura
  const arriba = 124;
  const zona = vh * 0.6 - arriba;
  const h = Math.max(120, Math.min(zona, (vw - 32) / R));
  const w = h * R;
  return { x: (vw - w) / 2, y: arriba + (zona - h) / 2, w, h };
}

/** En vertical el cambio de escala es más corto: la pintura nunca debe quedar pequeña en un teléfono. */
const escalaDe = (e: number, lado: boolean) => (lado ? e : 1 - (1 - e) * 0.6);

/** Escala el rectángulo respecto a su centro. */
function escalarRect(r: Rect, k: number): Rect {
  const w = r.w * k;
  const h = r.h * k;
  return { x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h };
}

export function Experiencia() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);
  const visorRef = useRef<HTMLDialogElement>(null);
  const abrirRef = useRef<HTMLButtonElement>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const pausaRef = useRef(false);
  const controlRef = useRef<{ arrancar: () => void; parar: () => void } | null>(null);
  const [sinWebGL, setSinWebGL] = useState(false);

  /* ── Motor ─────────────────────────────────────────── */
  useEffect(() => {
    const cv = canvasRef.current;
    const pista = pistaRef.current;
    if (!cv || !pista) return;
    const st: NegacionState | null = iniciar(cv);
    if (!st) {
      setSinWebGL(true);
      return;
    }
    pista.classList.add("sp-js");
    // si el contexto se pierde, mejor la alternativa estática que un canvas corrupto
    const onPerdido = (e: Event) => {
      e.preventDefault();
      setSinWebGL(true);
    };
    cv.addEventListener("webglcontextlost", onPerdido);

    const reducido = st.reducido;
    const actual: Estado = estadoEn(0);
    let objetivo: Estado = estadoEn(0);
    let base: Rect = { x: 0, y: 0, w: 1, h: 1 };
    let lado = true;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let ultimo = 0;
    let t0 = 0;
    // Altura estable: inmune a las barras dinámicas de Safari iOS.
    // En táctil solo se actualiza al cambiar el ancho (orientación real);
    // en escritorio sigue la altura de la ventana.
    const tactil = window.matchMedia("(pointer: coarse)").matches;
    let anchoAnt = window.innerWidth;
    let vhEstable = window.innerHeight;
    const pun: [number, number] = [0, 0];
    const punObj: [number, number] = [0, 0];

    const beats = () => Array.from(pista.querySelectorAll<HTMLElement>("[data-beat]"));

    /** Posición narrativa u a partir del scroll y de los tramos reales de contenido. */
    const posicionU = () => {
      const bs = beats();
      if (bs.length < 2) return 0;
      const ref = vhEstable * 0.5;
      const tops = bs.map((b) => b.getBoundingClientRect().top);
      const fin = bs[bs.length - 1].getBoundingClientRect().bottom;
      if (ref < tops[0]) return 0;
      for (let i = 0; i < bs.length; i++) {
        const sig = i + 1 < bs.length ? tops[i + 1] : fin;
        if (ref < sig) return i + (ref - tops[i]) / Math.max(1, sig - tops[i]);
      }
      return bs.length;
    };

    const medir = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Solo recalcular la geometría de la pintura cuando el ancho cambia
      // (orientación real), no cuando Safari muestra/oculta la barra dinámica.
      if (!tactil || Math.abs(vw - anchoAnt) > 1) {
        anchoAnt = vw;
        vhEstable = vh;
      }
      const movil = vw < 700 || (navigator.hardwareConcurrency ?? 4) <= 2;
      dpr = Math.min(window.devicePixelRatio || 1, movil ? 1 : 1.5);
      // El framebuffer llena el viewport real (sin huecos visuales).
      redimensionar(st, Math.round(vw * dpr), Math.round(vh * dpr));
      // La pintura usa la altura estable: posición y tamaño inmutables ante la barra.
      const r = calcularRect(vw, vhEstable);
      base = { x: r.x * dpr, y: r.y * dpr, w: r.w * dpr, h: r.h * dpr };
      lado = esLado(vw, vhEstable);
    };

    const dibujar = (t: number) =>
      pintar(st, actual, t, escalarRect(base, escalaDe(actual.escala, lado)), base, pun);

    const fijo = () => {
      // reduced-motion: un fotograma por cambio, sin interpolar
      objetivo = estadoEn(posicionU());
      Object.assign(actual, objetivo);
      st.cargada = 1;
      dibujar(0);
    };

    const marco = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || pausaRef.current) return;
      raf = requestAnimationFrame(marco);
      // margen: en 60 Hz el intervalo llega como 33,3 − ε y, sin él, se salta al siguiente vsync (20 fps)
      if (now - ultimo < FRAME_MS - 3) return;
      const dt = Math.min(0.1, (now - (ultimo || now - FRAME_MS)) / 1000);
      ultimo = now;
      if (!t0) t0 = now;
      objetivo = estadoEn(posicionU());
      acercar(actual, objetivo, dt, 0.16);
      st.cargada = Math.min(1, st.cargada + dt * 0.7);
      pun[0] += (punObj[0] - pun[0]) * Math.min(1, dt * 3);
      pun[1] += (punObj[1] - pun[1]) * Math.min(1, dt * 3);
      dibujar((now - t0) / 1000);
    };

    const arrancar = () => {
      if (reducido) {
        requestAnimationFrame(fijo);
        return;
      }
      if (!raf && visible && !document.hidden && !pausaRef.current) {
        ultimo = 0;
        raf = requestAnimationFrame(marco);
      }
    };
    const parar = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    controlRef.current = { arrancar, parar };

    medir();
    arrancar();

    const onResize = () => {
      medir();
      if (reducido) requestAnimationFrame(fijo);
    };
    const onScroll = () => {
      if (reducido) requestAnimationFrame(fijo);
    };
    const onPointer = (e: PointerEvent) => {
      if (reducido || !esLado(window.innerWidth, window.innerHeight)) return;
      punObj[0] = (e.clientX / window.innerWidth) * 2 - 1;
      punObj[1] = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onVis = () => (document.hidden ? parar() : arrancar());

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (window.matchMedia("(hover: hover)").matches)
      window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        // con el pie cubriendo la pantalla, el canvas ni se compone ni se pinta
        cv.style.visibility = visible ? "" : "hidden";
        if (visible) arrancar();
        else parar();
      },
      { threshold: 0 },
    );
    io.observe(pista);

    // el botón del visor se retira cuando el pie entra en pantalla
    const pie = document.querySelector(".sp-footer");
    const ioPie = new IntersectionObserver(
      ([e]) => {
        if (zonaRef.current) zonaRef.current.dataset.oculto = e.isIntersecting ? "1" : "";
      },
      { rootMargin: "0px 0px -96px 0px", threshold: 0 },
    );
    if (pie) ioPie.observe(pie);

    // pintura real: 1576 en pantallas amplias, 1200 en móvil
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (st.destruido) return;
      cargarImagen(st, img);
      if (reducido) requestAnimationFrame(fijo);
    };
    img.src = src(window.innerWidth < 700 ? 1200 : 1576);

    // aparición de los textos (sin JS el contenido queda visible)
    const rev = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            rev.unobserve(e.target);
          }
        }),
      { threshold: 0.2 },
    );
    pista.querySelectorAll(".sp-rev").forEach((n) => rev.observe(n));

    return () => {
      parar();
      io.disconnect();
      ioPie.disconnect();
      rev.disconnect();
      cv.removeEventListener("webglcontextlost", onPerdido);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      controlRef.current = null;
      destruir(st);
    };
  }, []);

  /* ── Visor de la pintura completa ──────────────────── */
  const abrirVisor = useCallback(() => {
    const d = visorRef.current;
    if (!d || d.open) return;
    pausaRef.current = true;
    controlRef.current?.parar();
    document.documentElement.classList.add("sp-bloqueado");
    d.showModal();
  }, []);

  const alCerrarVisor = useCallback(() => {
    pausaRef.current = false;
    document.documentElement.classList.remove("sp-bloqueado");
    abrirRef.current?.focus();
    controlRef.current?.arrancar();
  }, []);

  useEffect(
    () => () => document.documentElement.classList.remove("sp-bloqueado"),
    [],
  );

  const visor = (
    <dialog
      ref={visorRef}
      className="sp-visor"
      aria-label="La pintura completa, sin efectos"
      onClose={alCerrarVisor}
      onClick={(e) => {
        if (e.target === visorRef.current) visorRef.current?.close();
      }}
    >
      <div className="sp-visor__in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src(1200)}
          srcSet={srcset}
          sizes="min(92vw, 70svh)"
          width={SP_IMG.width}
          height={SP_IMG.height}
          alt={SP_IMG.alt}
          decoding="async"
          className="sp-visor__img"
        />
        <p className="sp-visor__pie">
          {FICHA.titulo} · {FICHA.autor} · {FICHA.tecnica}, {FICHA.dimensiones}
        </p>
        <form method="dialog">
          <button className="sp-btn" autoFocus>
            Cerrar
          </button>
        </form>
      </div>
    </dialog>
  );

  const botonVisor = (
    <button
      ref={abrirRef}
      type="button"
      className="sp-btn sp-btn--visor"
      onClick={abrirVisor}
    >
      Ver la pintura completa
    </button>
  );

  /* ── Alternativa sin WebGL ─────────────────────────── */
  if (sinWebGL) {
    return (
      <div className="sp-pista sp-fallback">
        <figure className="sp-fb-fig">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src(1200)}
            srcSet={srcset}
            sizes="(min-width: 900px) 40vw, 90vw"
            width={SP_IMG.width}
            height={SP_IMG.height}
            alt={SP_IMG.alt}
            decoding="async"
          />
        </figure>
        <Contenido />
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="sp-canvas"
        role="img"
        aria-label={SP_IMG.alt}
      />
      <div ref={zonaRef} className="sp-visor-zona">
        {botonVisor}
      </div>
      <div ref={pistaRef} className="sp-pista">
        {/* sin JS: la pintura va primero y el texto fluye sin alturas de scroll */}
        <noscript>
          <style>{NOJS_CSS}</style>
          <figure className="sp-fb-fig sp-fb-fig--nojs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src(1200)} width={SP_IMG.width} height={SP_IMG.height} alt={SP_IMG.alt} />
          </figure>
        </noscript>
        <Contenido />
      </div>
      {visor}
    </>
  );
}

/* ───────────────────────────────────────────────────────── */

function Etiqueta({ tipo }: { tipo: "doc" | "int" }) {
  return (
    <span className={`sp-tag sp-tag--${tipo}`}>
      {tipo === "doc" ? "Documentado" : "Interpretación de MANIFESTO"}
    </span>
  );
}

function Contenido() {
  return (
    <>
      {/* Acto I — El encuentro a oscuras */}
      <section className="sp-beat sp-beat--hero" data-beat aria-labelledby="sp-h1">
        <div className="sp-bloque">
          <p className="sp-ojo">{ACTOS.i}</p>
          <h1 id="sp-h1" className="sp-titulo">
            {FICHA.titulo}
          </h1>
          <p className="sp-autor">
            {FICHA.autor} · {FICHA.fecha}
          </p>
          <p className="sp-baja" aria-hidden="true">
            Desplaza para encender la luz
          </p>
        </div>
      </section>

      <section className="sp-beat" data-beat aria-labelledby="sp-doc-h">
        <div className="sp-bloque sp-rev">
          <h2 id="sp-doc-h" className="sp-h2">
            La escena
          </h2>
          <Etiqueta tipo="doc" />
          {DOCUMENTADO.map((p, i) => (
            <p key={i} className="sp-p">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* Acto II — Las tres negaciones */}
      {NEGACIONES.map((n, i) => (
        <section
          key={n.numero}
          className="sp-beat"
          data-beat
          aria-labelledby={`sp-neg-${n.numero}`}
        >
          <div className="sp-bloque sp-rev">
            <p className="sp-ojo">
              {i === 0 ? `${ACTOS.ii} · ` : ""}
              {["Primera", "Segunda", "Tercera"][i]} negación
            </p>
            <h2 id={`sp-neg-${n.numero}`} className="sr-only">
              {["Primera", "Segunda", "Tercera"][i]} negación
            </h2>
            <blockquote className="sp-cita">
              <p>«{n.cita}»</p>
              <cite>{n.fuente}</cite>
            </blockquote>
            <p className="sp-p">{n.contexto}</p>
            <Etiqueta tipo="doc" />
            {i === 2 && (
              <blockquote className="sp-cita sp-cita--gallo">
                <p>«{GALLO.cita}»</p>
                <cite>{GALLO.fuente}</cite>
              </blockquote>
            )}
          </div>
        </section>
      ))}

      {/* Acto III — El silencio */}
      <section
        className="sp-beat sp-beat--silencio"
        data-beat
        aria-labelledby="sp-sil-h"
      >
        <div className="sp-bloque sp-bloque--silencio">
          <p className="sp-ojo">{ACTOS.iii}</p>
          <h2 id="sp-sil-h" className="sp-silencio">
            {SILENCIO.texto}
          </h2>
          <Etiqueta tipo="int" />
          <p className="sp-nota">{SILENCIO.nota}</p>
        </div>
      </section>

      <section className="sp-beat" data-beat aria-label="La luz reaparece">
        <div className="sp-bloque sp-rev">
          <blockquote className="sp-cita sp-cita--suave">
            <p>«{REAPARICION.intro}»</p>
            <cite>{REAPARICION.introFuente}</cite>
          </blockquote>
          <blockquote className="sp-cita">
            <p>«{REAPARICION.cita}»</p>
            <cite>{REAPARICION.fuente}</cite>
          </blockquote>
          <Etiqueta tipo="doc" />
        </div>
      </section>

      {/* Silencio luminoso: la contraparte del silencio oscuro. Solo la luz y la pintura, sin texto. */}
      <div className="sp-beat sp-beat--contemplar" data-beat aria-hidden="true" />

      {/* Acto IV — Lo que permanece */}
      <section
        className="sp-beat sp-beat--fin"
        data-beat
        aria-labelledby="sp-fin-h"
      >
        <div className="sp-bloque sp-rev">
          <p className="sp-ojo">{ACTOS.iv}</p>
          <h2 id="sp-fin-h" className="sp-h2">
            Lo que permanece
          </h2>
          <div className="sp-grupo">
            <Etiqueta tipo="doc" />
            {DOCUMENTADO_FINAL.map((p, i) => (
              <p key={i} className="sp-p">
                {p}
              </p>
            ))}
            <dl className="sp-ficha">
              <dt>Obra</dt>
              <dd>
                {FICHA.titulo} ({FICHA.tituloOriginal}), {FICHA.autor}
              </dd>
              <dt>Técnica</dt>
              <dd>
                {FICHA.tecnica}, {FICHA.dimensiones}
              </dd>
              <dt>Procedencia</dt>
              <dd>{FICHA.procedencia}</dd>
            </dl>
          </div>
          <div className="sp-grupo">
            <Etiqueta tipo="int" />
            {INTERPRETACION.map((p, i) => (
              <p key={i} className="sp-p">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
