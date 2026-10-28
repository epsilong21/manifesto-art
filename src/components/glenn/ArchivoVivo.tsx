"use client";

import { memo, useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { CLASES, DOCUMENTOS, PIES_ARCHIVO, PIEZAS, type Clase, type DocArchivo, type LecturaId, type Pieza } from "@/content/glenn-archivo";
import { ACTIVOS, COMPOSICIONES, apartar, descubiertos, type Pose } from "./archivoPoses";

type Props = {
  lectura: LecturaId;
  sel: string | null;
  resalta: string | null;
  /** Cajón abierto en el panel del archivo: su pestaña se ilumina y los demás se atenúan */
  cajon: Clase;
  onSel: (id: string | null) => void;
};

const GIRO_MAX = { x: 16, y: 32 };
const limitar = (v: number, m: number) => Math.max(-m, Math.min(m, v));

/** Medidas de cada forma (cqmin): ancho y alto */
const TAMANOS: Record<string, [number, number]> = {
  ficha: [22, 14],
  hoja: [17, 23],
  tira: [26, 9],
  recorte: [16, 16],
  letra: [12, 16],
  pestana: [15, 5.5],
  sello: [14, 14],
  contacto: [17, 20],
  indice: [15, 20],
  calco: [28, 6],
  ticket: [11, 7],
  marcas: [17, 17],
};

const vars = (pose: Pose, i: number, forma: string) =>
  ({
    "--w": TAMANOS[forma][0],
    "--h": TAMANOS[forma][1],
    "--x": pose.x.toFixed(2),
    "--y": pose.y.toFixed(2),
    "--z": pose.z.toFixed(2),
    "--rx": `${pose.rx.toFixed(2)}deg`,
    "--ry": `${pose.ry.toFixed(2)}deg`,
    "--rz": `${pose.rz.toFixed(2)}deg`,
    "--s": pose.s.toFixed(3),
    "--d": `${(i % 9) * 22}ms`,
  }) as CSSProperties;

/**
 * «Archivo vivo»: instalación de documentos en CSS 3D que se recompone con cada
 * lectura. Retrato: un nombre que se arma entre documentos. Máscara: un escudo de
 * hojas solapadas que se aparta con la lente (arrastrar). Archivo: un fichero con
 * los doce documentos clasificados por su grado de certeza.
 *
 * Las piezas son decorativas para la accesibilidad (aria-hidden): los mandos
 * equivalentes son la lista del panel (LecturasGlenn) y, aquí, las flechas sobre el
 * escenario. Sin animación continua: solo se mueve al interactuar. Con movimiento
 * reducido las poses cambian de golpe (glenn-archivo.css).
 */
export function ArchivoVivo({ lectura, sel, resalta, cajon, onSel }: Props) {
  const escenario = useRef<HTMLDivElement>(null);
  const escena = useRef<HTMLDivElement>(null);
  const hojas = useRef(new Map<string, HTMLElement>());
  const giro = useRef({ x: -6, y: 0 });
  const inclinacion = useRef({ x: 0, y: 0 });
  const gesto = useRef<{ id: number; x: number; y: number; giro: { x: number; y: number }; movido: boolean } | null>(null);
  const marco = useRef(0);
  // La lente recuerda qué documento estaba elegido al moverla (para no volver sola a él)
  const [lente, setLente] = useState<{ x: number; y: number; sel: string | null } | null>(null);
  const [aspecto, setAspecto] = useState(1.42);

  const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // El giro va directo al estilo de la escena: arrastrar no vuelve a pintar las piezas
  const pintarGiro = useCallback(() => {
    cancelAnimationFrame(marco.current);
    marco.current = requestAnimationFrame(() => {
      const e = escena.current;
      if (!e) return;
      e.style.setProperty("--gx", `${(giro.current.x + inclinacion.current.x).toFixed(2)}deg`);
      e.style.setProperty("--gy", `${(giro.current.y + inclinacion.current.y).toFixed(2)}deg`);
    });
  }, []);

  /**
   * Lente efectiva: solo en la máscara. Si se elige desde el panel un documento oculto
   * que la lente no deja ver, el escudo se abre delante de él.
   */
  const oculto = lectura === "mascara" && sel ? COMPOSICIONES.mascara[sel] : null;
  const abreSel = oculto && !oculto.escudo && !oculto.fondo && lente?.sel !== sel && !(lente && descubiertos(lente, aspecto).includes(sel!));
  const lenteVista = lectura !== "mascara" ? null : abreSel ? { x: oculto.pose.x, y: oculto.pose.y } : lente;
  const vistos = descubiertos(lenteVista, aspecto);

  // La lente aparta las hojas del escudo: se escribe en cada hoja, sin volver a renderizar
  useEffect(() => {
    for (const [id, v] of Object.entries(apartar(lenteVista, aspecto))) {
      const h = hojas.current.get(id);
      if (!h) continue;
      h.style.setProperty("--ax", v.ax.toFixed(2));
      h.style.setProperty("--ay", v.ay.toFixed(2));
      h.style.setProperty("--ag", `${v.ag.toFixed(2)}deg`);
    }
  }, [lenteVista?.x, lenteVista?.y, aspecto]); // eslint-disable-line react-hooks/exhaustive-deps

  const moverLente = (l: { x: number; y: number } | null) => setLente(l ? { ...l, sel } : null);

  useEffect(() => {
    const el = escenario.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAspecto(e.contentRect.width / Math.max(1, e.contentRect.height)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Al cambiar de lectura la vista vuelve de frente
  useEffect(() => {
    giro.current = { x: -6, y: 0 };
    pintarGiro();
  }, [lectura, pintarGiro]);

  useEffect(() => () => cancelAnimationFrame(marco.current), []);

  const punto = (e: PointerEvent<HTMLDivElement>) => {
    const r = escenario.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const abajo = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    gesto.current = { id: e.pointerId, x: e.clientX, y: e.clientY, giro: { ...giro.current }, movido: false };
    escenario.current?.setAttribute("data-arrastrando", "");
  };

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesto.current;
    if (g && g.id === e.pointerId) {
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (!g.movido && Math.hypot(dx, dy) > 6) {
        g.movido = true;
        // Puede fallar si el puntero ya no está activo: el arrastre sigue sin captura
        try {
          escenario.current?.setPointerCapture(e.pointerId);
        } catch {
          /* sin captura */
        }
      }
      if (!g.movido) return;
      if (lectura === "mascara") moverLente(punto(e));
      else {
        giro.current = { x: limitar(g.giro.x - dy * 0.12, GIRO_MAX.x), y: limitar(g.giro.y + dx * 0.18, GIRO_MAX.y) };
        pintarGiro();
      }
      return;
    }
    // Con ratón, sin pulsar: la instalación se inclina un poco hacia el puntero
    if (e.pointerType === "mouse" && !reducido()) {
      const q = punto(e);
      inclinacion.current = { x: (50 - q.y) * 0.06, y: (q.x - 50) * 0.08 };
      pintarGiro();
    }
  };

  const arriba = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesto.current;
    escenario.current?.removeAttribute("data-arrastrando");
    gesto.current = null;
    if (!g || g.id !== e.pointerId || g.movido) return;
    // Un toque: elige el documento tocado; en la máscara, sobre el escudo, mueve la lente
    const doc = (e.target as HTMLElement).closest<HTMLElement>("[data-doc]");
    const id = doc?.dataset.doc;
    if (id && ACTIVOS[lectura].includes(id) && !(lectura === "mascara" && doc?.closest("[data-escudo]"))) {
      onSel(sel === id ? null : id);
      return;
    }
    if (lectura === "mascara") moverLente(punto(e));
    else if (sel) onSel(null);
  };

  const fuera = () => {
    inclinacion.current = { x: 0, y: 0 };
    pintarGiro();
  };

  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (d) {
      e.preventDefault();
      if (lectura === "mascara") {
        const l = lenteVista ?? { x: 50, y: 50 };
        moverLente({ x: Math.max(0, Math.min(100, l.x + d[0] * 6)), y: Math.max(0, Math.min(100, l.y + d[1] * 6)) });
      } else {
        giro.current = { x: limitar(giro.current.x - d[1] * 4, GIRO_MAX.x), y: limitar(giro.current.y + d[0] * 6, GIRO_MAX.y) };
        pintarGiro();
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      giro.current = { x: -6, y: 0 };
      pintarGiro();
      if (lectura === "mascara") moverLente(null);
    } else if (e.key === "Escape" && sel) {
      e.preventDefault();
      onSel(null);
    }
  };

  const comp = COMPOSICIONES[lectura];
  const activos = ACTIVOS[lectura];
  const doc = DOCUMENTOS.find((d) => d.id === sel) ?? null;
  const ocultosMascara = ACTIVOS.mascara.length;

  const registrar = (id: string) => (el: HTMLElement | null) => {
    if (el) hojas.current.set(id, el);
    else hojas.current.delete(id);
  };

  return (
    <div className="gl-av__obra">
      <div
        ref={escenario}
        className="gl-av__escenario"
        data-lectura={lectura}
        data-con-sel={sel ? "" : undefined}
        tabIndex={0}
        role="group"
        aria-label="Instalación «Archivo vivo»"
        aria-describedby="gl-av-ayuda"
        onPointerDown={abajo}
        onPointerMove={mover}
        onPointerUp={arriba}
        onPointerCancel={arriba}
        onPointerLeave={fuera}
        onKeyDown={teclas}
      >
        <div className="gl-av__camara">
          <div ref={escena} className="gl-av__escena" aria-hidden="true">
            {DOCUMENTOS.map((d, i) => {
              const papel = comp[d.id];
              return (
                <div
                  key={d.id}
                  className="gl-av__pieza"
                  style={vars(papel.pose, i, d.forma)}
                  data-doc={d.id}
                  data-activo={activos.includes(d.id) ? "" : undefined}
                  data-fondo={papel.fondo ? "" : undefined}
                  data-escudo={papel.escudo ? "" : undefined}
                  data-sel={sel === d.id ? "" : undefined}
                  data-resalta={resalta === d.id ? "" : undefined}
                  data-visto={vistos.includes(d.id) ? "" : undefined}
                  data-otro-cajon={lectura === "archivo" && d.clase !== cajon ? "" : undefined}
                >
                  <div ref={registrar(d.id)} className="gl-av__hoja" data-forma={d.forma} data-clase={d.clase}>
                    <CaraDocumento d={d} />
                  </div>
                </div>
              );
            })}
            {PIEZAS.map((q, i) => {
              const papel = comp[q.id];
              return (
                <div
                  key={q.id}
                  className="gl-av__pieza"
                  style={vars(papel.pose, i + DOCUMENTOS.length, q.tipo)}
                  data-fondo={papel.fondo ? "" : undefined}
                  data-escudo={papel.escudo ? "" : undefined}
                  data-tipo={q.tipo}
                  data-cajon={lectura === "archivo" && q.tipo === "pestana" && q.clase === cajon ? "" : undefined}
                >
                  <div ref={registrar(q.id)} className="gl-av__hoja" data-pieza={q.tipo}>
                    <CaraPieza q={q} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {lenteVista ? (
          <span className="gl-av__lente" aria-hidden="true" style={{ "--lx": lenteVista.x.toFixed(2), "--ly": lenteVista.y.toFixed(2) } as CSSProperties} />
        ) : null}
        <p className="gl-av__rotulo" aria-hidden="true">
          {lectura === "retrato" ? "A · Retrato" : lectura === "mascara" ? "B · Máscara" : "C · Archivo"}
        </p>
        <p className="gl-av__aviso" aria-hidden="true">
          Instalación de MANIFESTO · no reproduce la obra
        </p>
      </div>

      <div className="gl-av__ficha" aria-live="polite">
        {doc ? (
          <article key={doc.id}>
            <p className="gl-av__ficha-cab">
              <span className="gl-av__ficha-cod">{doc.codigo}</span>
              {doc.clase === "limite" ? <span className="gl-av__limite">Lo que no prueba</span> : <KindTag tipo={doc.clase} />}
            </p>
            <h3 className="gl-av__ficha-t">{doc.rotulo}</h3>
            <p className="gl-av__ficha-txt">{doc.texto}</p>
            <p className="gl-av__ficha-fuente">Fuente: {doc.fuente}</p>
            <button type="button" className="gl-btn gl-btn--linea gl-av__cerrar" onClick={() => onSel(null)}>
              Devolver al archivo
            </button>
          </article>
        ) : lectura === "mascara" ? (
          <p className="gl-av__estado">
            {vistos.length
              ? `La lente deja ver ${vistos.length} de ${ocultosMascara} documentos ocultos. Tócalos para leerlos.`
              : `Detrás del escudo hay ${ocultosMascara} documentos ocultos.`}
          </p>
        ) : (
          <p className="gl-av__estado">Elige un documento para acercarlo y leer su ficha.</p>
        )}
      </div>

      <p id="gl-av-ayuda" className="gl-av__pie">
        {PIES_ARCHIVO[lectura]} <span className="gl-av__teclas">Con teclado: flechas para {lectura === "mascara" ? "mover la lente" : "girar"}, Inicio para volver y Esc para cerrar la ficha.</span>
      </p>
    </div>
  );
}

const CLASE_CORTA = Object.fromEntries(CLASES.map((c) => [c.id, c.corto]));

/** Cara de un documento: código, clase, rótulo y renglones de máquina (no cambia: memorizada) */
const CaraDocumento = memo(function CaraDocumento({ d }: { d: DocArchivo }) {
  return (
    <>
      <span className="gl-av__cab">
        <span>{d.codigo}</span>
        <span>{CLASE_CORTA[d.clase]}</span>
      </span>
      <strong className="gl-av__rot">{d.rotulo}</strong>
      <span className="gl-av__renglones" />
      {d.clase === "limite" ? <span className="gl-av__sello-no">No prueba</span> : null}
    </>
  );
});

/** Piezas gráficas de MANIFESTO: tipografía, sellos ficticios, índices y marcas (memorizadas) */
const CaraPieza = memo(function CaraPieza({ q }: { q: Pieza }) {
  switch (q.tipo) {
    case "letra":
      return (
        <>
          <span className="gl-av__letra">{q.letra}</span>
          <span className="gl-av__pie-hoja">Índice {q.n + 1}/5</span>
        </>
      );
    case "pestana":
      return <span className="gl-av__pestana">{CLASES.find((c) => c.id === q.clase)!.nombre}</span>;
    case "sello":
      return (
        <span className="gl-av__sello">
          <span>Copia</span>
          <span>de copia</span>
        </span>
      );
    case "contacto":
      return (
        <>
          <span className="gl-av__contacto">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} />
            ))}
          </span>
          <span className="gl-av__pie-hoja">Hoja de contactos · 12</span>
        </>
      );
    case "indice":
      return (
        <span className="gl-av__indice">
          {["Retrato", "Máscara", "Archivo", "Copias", "Fechas", "Fuentes"].map((t, i) => (
            <span key={t}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <span>{t}</span>
            </span>
          ))}
        </span>
      );
    case "calco":
      return <span className="gl-av__calco">⊕ Registro · calco · ⊕</span>;
    case "ticket":
      return (
        <span className="gl-av__ticket">
          <span>Nº</span>
          <span>0085</span>
        </span>
      );
    case "marcas":
      return <span className="gl-av__marcas" />;
  }
});
