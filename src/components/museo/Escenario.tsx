"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

export type ObraEscena = {
  slug: string;
  numero: string;
  titulo: string;
  autor: string;
  anio: string;
  acento: string;
  gesto: string;
  pregunta: string;
  /** false: la imagen es una composición de MANIFESTO, no la pintura. */
  pintura: boolean;
};

const PERIODO = 6500;

/**
 * Escenario de la portada: la pintura de cada obra, entera, sobre un halo de su color; debajo, el
 * friso de las diez. Avanza solo (si el sistema no pide menos movimiento), se detiene al apuntar,
 * enfocar, ocultar la pestaña o salir de la pantalla, y tiene un botón de pausa. Todo el recorrido
 * es por enlaces nativos: sin JavaScript queda la primera obra y el friso navegable.
 */
export function Escenario({ obras, laminas, tiras }: { obras: ObraEscena[]; laminas: ReactNode[]; tiras: ReactNode[] }) {
  const [i, setI] = useState(0);
  const [pausaUsuario, setPausaUsuario] = useState(false);
  const [dentro, setDentro] = useState(false);
  const [encima, setEncima] = useState(false);
  const [visible, setVisible] = useState(true);
  const [oculta, setOculta] = useState(false);
  const [quieto, setQuieto] = useState(true);
  const raiz = useRef<HTMLElement>(null);
  const friso = useRef<HTMLOListElement>(null);
  const n = obras.length;
  const a = obras[i];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setQuieto(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const alOcultar = () => setOculta(document.hidden);
    document.addEventListener("visibilitychange", alOcultar);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    if (raiz.current) io.observe(raiz.current);
    return () => {
      mq.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", alOcultar);
      io.disconnect();
    };
  }, []);

  const corre = !quieto && !pausaUsuario && !dentro && !encima && visible && !oculta;
  useEffect(() => {
    if (!corre) return;
    const t = window.setInterval(() => setI((k) => (k + 1) % n), PERIODO);
    return () => window.clearInterval(t);
  }, [corre, n, i]);

  // El friso sigue a la obra activa sin mover la página
  useEffect(() => {
    const f = friso.current;
    const el = f?.children[i] as HTMLElement | undefined;
    if (!f || !el || f.scrollWidth <= f.clientWidth) return;
    f.scrollTo({ left: el.offsetLeft - (f.clientWidth - el.offsetWidth) / 2, behavior: quieto ? "auto" : "smooth" });
  }, [i, quieto]);

  const seguir = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || quieto) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5).toFixed(3)));
    e.currentTarget.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5).toFixed(3)));
  };

  return (
    <section
      ref={raiz}
      className="hm-escena"
      aria-roledescription="carrusel"
      aria-label="Las diez obras"
      style={{ "--a": a.acento } as CSSProperties}
      onPointerMove={seguir}
      onPointerEnter={(e) => e.pointerType === "mouse" && setEncima(true)}
      onPointerLeave={() => setEncima(false)}
      onFocusCapture={() => setDentro(true)}
      onBlurCapture={() => setDentro(false)}
    >
      <span className="hm-halo" aria-hidden="true" />
      <span className="hm-numeral" aria-hidden="true" key={a.numero}>{a.numero}</span>

      <div className="hm-escenario" role="group" aria-label={`Obra ${a.numero} de ${n}: ${a.titulo}`}>
        <div className="hm-marco">
          {obras.map((o, k) => (
            <Link
              key={o.slug}
              href={`/conceptos/${o.slug}`}
              prefetch={false}
              className="hm-lamina"
              data-obra={o.slug}
              data-activa={k === i}
              aria-hidden={k !== i}
              tabIndex={k === i ? 0 : -1}
              aria-label={`Entrar en ${o.titulo}, ${o.autor}`}
            >
              {laminas[k]}
            </Link>
          ))}
        </div>
        <div className="hm-rotulo" aria-live={corre ? "off" : "polite"}>
          <p className="hm-rotulo__n">
            <span>{a.numero}</span> / {n}
          </p>
          <p className="hm-rotulo__t">{a.titulo}</p>
          <p className="hm-rotulo__a">
            {a.autor}, {a.anio}
          </p>
          <p className="hm-rotulo__g">
            <b>{a.gesto}.</b> {a.pregunta}
          </p>
          {!a.pintura ? <p className="hm-rotulo__nota">Composición de MANIFESTO, no la pintura.</p> : null}
        </div>
        <div className="hm-mandos">
          <button type="button" className="hm-flecha" onClick={() => setI((i + n - 1) % n)} aria-label="Obra anterior">
            <svg aria-hidden="true" width="18" height="10" viewBox="0 0 18 10" fill="none"><path d="M18 5H2M6 1 2 5l4 4" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
          <button type="button" className="hm-flecha" onClick={() => setI((i + 1) % n)} aria-label="Obra siguiente">
            <svg aria-hidden="true" width="18" height="10" viewBox="0 0 18 10" fill="none"><path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
          {quieto ? null : (
            <button type="button" className="hm-pausa" aria-pressed={pausaUsuario} onClick={() => setPausaUsuario(!pausaUsuario)}>
              {pausaUsuario ? "Reanudar" : "Pausar"}
            </button>
          )}
        </div>
      </div>

      <nav className="hm-friso" aria-label="Entrar directamente en una obra">
        <ol ref={friso}>
          {obras.map((o, k) => (
            <li key={o.slug} style={{ "--ta": o.acento } as CSSProperties}>
              <Link
                href={`/conceptos/${o.slug}`}
                prefetch={false}
                data-activa={k === i}
                onPointerEnter={(e) => e.pointerType === "mouse" && setI(k)}
                onFocus={() => setI(k)}
              >
                <span className="hm-tira__img" aria-hidden="true">{tiras[k]}</span>
                <span className="hm-tira__n" aria-hidden="true">{o.numero}</span>
                <span className="sr-only">{o.titulo}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}
