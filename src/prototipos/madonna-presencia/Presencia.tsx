"use client";
/**
 * La Madona de Portlligat (1949) · V2.5 — «El cierre de la correspondencia» (prototipo del regreso a la pintura).
 *
 * Mismos tres estados que V2.3/V2.4 (encuentro · instalación · regreso). El regreso conserva la referencia espacial de V2.4:
 * la composición 3D está medida sobre la pintura, así que la cámara retrocede hasta el encuadre exacto en que coincide con
 * la lámina (`correspondencia.ts`), el entorno se oscurece alrededor de ese rectángulo y la escena se sustituye por la
 * lámina íntegra, en la misma posición y escala. La lámina nunca se anima, recorta ni deforma y nada se dibuja sobre sus
 * píxeles.
 *
 * V2.5 pule el ritmo y el cierre del regreso A (B queda descartada). Tres variantes (`?regreso=a|a1|a2`):
 *  a  · V2.4 original (referencia): la lámina se funde translúcida sobre la escena.
 *  a1 · sustitución limpia: un instante quieto en el encuadre registrado y corte de la escena a la lámina opaca.
 *  a2 · fundido breve del contenedor escénico y aparición opaca de la lámina.
 * Tras la sustitución la lámina queda sola un instante; después llegan, discretos, los rótulos y los controles.
 *
 * V2.6B.1 rediseña solo la sala del encuentro (atmósfera, jerarquía editorial, aparición escalonada, invitación «Cruzar el umbral»).
 * La instalación, la transición de entrada, el regreso A1 y el sistema de reproducción no cambian.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Instalacion, VISTA_INST0, ENCUADRE0, type InstalacionApi, type VistaInst, type Encuadre } from "./Instalacion";
import type { Cavidad } from "../madonna-retablo/retabloGL";
import { ESTACIONES } from "../madonna-retablo/composicion";
import { FICHAS, OBRA, resolverReproduccion, candidata, type Reproduccion } from "./reproduccion";
import { REGISTRO, TIEMPOS, VARIANTE0, DUR_VUELTA, registrar, clavesRegreso, clavesVuelta, type Variante } from "./correspondencia";
import { cormorant } from "@/lib/fonts/cormorant";
import { DERECHOS_DALI } from "@/content/elefantes";
import { CONTACTO_LEGAL } from "@/content/aviso-legal";

type Fase = "encuentro" | "entrando" | "instalacion" | "volviendo" | "regreso";
/** De dónde se entra en la instalación: la sala del encuentro, el regreso (reanudar en el encuadre) o el regreso (reiniciar). */
type Desde = "sala" | "reanuda" | "reinicia";
type Alt = Variante;

/** Duración total de la entrada desde la sala (ms). Con reduced motion no hay transición: el cambio es inmediato. */
const DUR = { entrando: 2300 };

const ANUNCIO = [
  "La aparición lejana: una arquitectura fragmentada suspendida sobre el mar.",
  "Entre los fragmentos: la cámara atraviesa la arquitectura y el paisaje se ve entre las piezas.",
  "La revelación: las piezas se recomponen y el movimiento se detiene.",
];
const NOMBRES = ["I", "II", "III"];

function suscribirReducido(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const leerReducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Resumen documentado de la etiqueta del museo (Haggerty): se repite en la sala y en la ficha del regreso. */
const DOC_RESUMEN = (
  <>
    Gala aparece como la Virgen ante la bahía de Portlligat; la concha y el huevo remiten al <i>Retablo de Montefeltro</i> de
    Piero della Francesca, y las figuras y la arquitectura se fragmentan.
  </>
);

/** El título se compone en dos niveles (nombre y edición); el texto completo sigue siendo `OBRA.titulo`. */
const TITULO = /^(.*?)\s*(\(.+\))$/.exec(OBRA.titulo);
const TITULO_BASE = TITULO?.[1] ?? OBRA.titulo;
const TITULO_EDICION = TITULO?.[2];

/** Duración de la aparición de la sala (ms): pasado ese tiempo, o ante cualquier gesto del visitante, queda todo asentado. */
const DUR_LLEGADA = 3600;

export function Presencia() {
  const [fase, setFase] = useState<Fase>("encuentro");
  const [llegada, setLlegada] = useState<"en-curso" | "asentada">("en-curso");
  const [desde, setDesde] = useState<Desde>("sala");
  const [alt, setAlt] = useState<Alt>(VARIANTE0);
  const [detener, setDetener] = useState(false);
  const [montada, setMontada] = useState(false);
  const [vista, setVista] = useState<VistaInst>(VISTA_INST0);
  const [glOk, setGlOk] = useState(true);
  const reducido = useSyncExternalStore(suscribirReducido, leerReducido, () => false);
  const [corte, setCorte] = useState(false);
  /** Ficha del regreso desplegada: se pliega al salir del regreso para que la pintura vuelva a su tamaño al regresar. */
  const [ficha, setFicha] = useState(false);
  const [repro, setRepro] = useState<Reproduccion>(() => ({ estado: "sin" }));
  const [anuncio, setAnuncio] = useState("");
  /** Panel de opciones del recorrido (reiniciar, pausa, exploración libre, deslizador y estaciones): cerrado por defecto. */
  const [opciones, setOpciones] = useState(false);
  const [ventana, setVentana] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [arq, setArq] = useState<Cavidad>(false);

  const apiRef = useRef<InstalacionApi>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const opcionesBtnRef = useRef<HTMLButtonElement>(null);
  const lienzoRef = useRef<HTMLDivElement>(null);
  const capaRef = useRef<HTMLElement>(null);
  const marcoRef = useRef<(HTMLImageElement & SVGSVGElement) | null>(null);
  const principalRef = useRef<HTMLButtonElement>(null);
  const regRef = useRef<Encuadre>(ENCUADRE0);
  const vpRef = useRef({ w: 1, h: 1 });
  const timer = useRef(0);
  const desdeRef = useRef<Desde>("sala");
  const faseRef = useRef<Fase>("encuentro");
  const reducidoRef = useRef(false);
  const altRef = useRef<Alt>(VARIANTE0);
  const detenerRef = useRef(false);
  const opcionesRef = useRef(false);
  useEffect(() => {
    faseRef.current = fase; reducidoRef.current = reducido; altRef.current = alt; detenerRef.current = detener; opcionesRef.current = opciones;
  });

  /* ── Aparición de la sala: nunca obliga a esperar; cualquier gesto la deja asentada al instante ── */
  const asentar = useCallback(() => setLlegada("asentada"), []);
  useEffect(() => {
    const t = window.setTimeout(asentar, DUR_LLEGADA);
    return () => window.clearTimeout(t);
  }, [asentar]);

  /* ── Reproducción (estado de derechos) ── */
  useEffect(() => {
    let vivo = true;
    resolverReproduccion().then((r) => { if (vivo) setRepro(r); });
    return () => { vivo = false; };
  }, []);

  /* ── Parámetros de revisión: ?regreso=a|a1|a2 · ?inicio=instalacion|revelacion|regreso · ?detener=ventana ── */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    /** La instalación se monta tras el cambio de fase: se espera a que exista su API (solo revisión). */
    const cuandoApi = (f: () => unknown, n = 0) => { if (apiRef.current) f(); else if (n < 60) window.setTimeout(() => cuandoApi(f, n + 1), 50); };
    const t = window.setTimeout(() => {
      const reg = q.get("regreso");
      if (reg === "a" || reg === "a1" || reg === "a2" || reg === "r1" || reg === "r2") setAlt(reg);
      if (q.get("detener") === "ventana") setDetener(true);
      if (q.get("arq") === "integral") setArq("completa");
      const ini = q.get("inicio");
      if (ini === "instalacion" || ini === "revelacion") {
        setMontada(true);
        setFase("instalacion");
        if (ini === "revelacion") cuandoApi(() => apiRef.current?.fijar(1));
      } else if (ini === "regreso") {
        setMontada(true);
        setFase("regreso");
        cuandoApi(() => apiRef.current?.fijar(1));
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  /* ── Bloqueo de scroll solo mientras la instalación cubre la pantalla (siempre se puede salir) ── */
  useEffect(() => {
    const cubre = fase === "entrando" || fase === "instalacion" || fase === "volviendo";
    const el = document.documentElement;
    if (cubre) el.style.overflow = "hidden";
    return () => { el.style.overflow = ""; };
  }, [fase]);

  /* ── Registro: dónde cae la lámina en pantalla ↔ qué encuadre de cámara hace coincidir la composición 3D ── */
  const medir = useCallback(() => {
    const el = marcoRef.current;
    const capa = capaRef.current;
    if (!el || !capa) return;
    const r = el.getBoundingClientRect();
    const v = capa.getBoundingClientRect();
    if (r.width < 2 || v.height < 2) return;
    vpRef.current = { w: v.width, h: v.height };
    regRef.current = registrar({ left: r.left - v.left, top: r.top - v.top, width: r.width, height: r.height }, v.width, v.height);
    setVentana((o) => (Math.abs(o.x - r.left) + Math.abs(o.y - r.top) + Math.abs(o.w - r.width) + Math.abs(o.h - r.height) < 0.5 ? o : { x: r.left, y: r.top, w: r.width, h: r.height }));
    if (faseRef.current === "regreso") apiRef.current?.encuadre(regRef.current);
  }, []);
  useEffect(() => {
    const el = marcoRef.current;
    if (!el) return;
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    window.addEventListener("resize", medir);
    return () => { ro.disconnect(); window.removeEventListener("resize", medir); };
  }, [medir, repro.estado, montada]);
  useEffect(() => { if (fase === "regreso" || fase === "instalacion") medir(); }, [fase, medir]);

  const cortar = () => { setCorte(true); requestAnimationFrame(() => requestAnimationFrame(() => setCorte(false))); };
  const limpiar = () => { window.clearTimeout(timer.current); timer.current = 0; };

  /* ── Transiciones ── */
  const entrar = useCallback((modo: Desde) => {
    if (faseRef.current !== "encuentro" && faseRef.current !== "regreso") return;
    limpiar();
    setFicha(false);
    setLlegada("asentada");
    setMontada(true);
    desdeRef.current = modo;
    setDesde(modo);
    setAnuncio(modo === "reanuda" ? "La cámara vuelve al centro vacío." : "La sala se oscurece y aparece la instalación.");
    const fin = () => { timer.current = 0; setFase("instalacion"); };
    if (modo === "reinicia") apiRef.current?.reiniciar();
    if (reducidoRef.current) {
      if (modo === "reanuda") apiRef.current?.encuadre(ENCUADRE0);
      fin();
      return;
    }
    if (modo === "reanuda") {
      medir();
      apiRef.current?.coreografia(clavesVuelta(regRef.current));
      setFase("entrando");
      timer.current = window.setTimeout(fin, DUR_VUELTA);
    } else {
      setFase("entrando");
      timer.current = window.setTimeout(fin, DUR.entrando);
    }
  }, [medir]);

  const salir = useCallback(() => {
    if (faseRef.current !== "instalacion") return;
    limpiar();
    setOpciones(false);
    medir();
    const reg = regRef.current;
    const variante = altRef.current;
    setAnuncio("Regresas a la pintura: la cámara retrocede hasta que la composición coincide con la lámina.");
    if (reducidoRef.current) {
      apiRef.current?.encuadre(reg);
      setFase("regreso");
      return;
    }
    apiRef.current?.coreografia(clavesRegreso(reg, variante));
    setFase("volviendo");
    if (!detenerRef.current) timer.current = window.setTimeout(() => { timer.current = 0; setFase("regreso"); }, TIEMPOS[variante].total);
  }, [medir]);

  const omitir = useCallback(() => {
    const f = faseRef.current;
    if (f !== "entrando" && f !== "volviendo") return;
    limpiar();
    cortar();
    if (f === "entrando") {
      if (desdeRef.current === "reanuda") apiRef.current?.encuadre(ENCUADRE0);
      setFase("instalacion");
    } else {
      apiRef.current?.encuadre(regRef.current);
      setFase("regreso");
    }
  }, []);

  useEffect(() => () => limpiar(), []);

  /** Cierra las opciones; si el foco estaba dentro, vuelve al botón que las abrió (nunca se pierde en un elemento oculto). */
  const cerrarOpciones = useCallback(() => {
    if (panelRef.current?.contains(document.activeElement)) opcionesBtnRef.current?.focus({ preventScroll: true });
    setOpciones(false);
  }, []);

  /* ── Teclado global: Esc cierra las opciones, omite una transición o sale de la instalación ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const f = faseRef.current;
      if (f === "entrando" || f === "volviendo") omitir();
      else if (f === "instalacion") { if (opcionesRef.current) cerrarOpciones(); else salir(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [omitir, salir, cerrarOpciones]);

  /* Al abrir las opciones el foco pasa a su primer control (el orden visual y el del teclado coinciden) */
  useEffect(() => {
    if (opciones) panelRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [opciones]);

  /* ── Foco: al entrar, el lienzo; al volver, la acción principal de la lámina ── */
  useEffect(() => {
    if (fase === "instalacion") lienzoRef.current?.querySelector("canvas")?.focus({ preventScroll: true });
    else if (fase === "regreso") principalRef.current?.focus({ preventScroll: true });
  }, [fase]);

  const onVista = useCallback((v: VistaInst) => {
    setVista(v);
    // La revelación se vive sin controles: las opciones se pliegan al llegar (se pueden reabrir con el teclado)
    if (v.alineado) setOpciones(false);
  }, []);
  const precalentar = () => setMontada(true);

  const irA = (p: number) => apiRef.current?.irA(p);
  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => apiRef.current?.fijar(Number(e.target.value) / 1000);
  const anterior = () => { const p = apiRef.current?.anterior(); if (p !== null && p !== undefined) irA(p); };
  const siguiente = () => { const p = apiRef.current?.siguiente(); if (p !== null && p !== undefined) irA(p); };

  const activa = fase === "entrando" || fase === "instalacion" || fase === "volviendo";
  const enSala = fase === "encuentro";
  const enRegreso = fase === "regreso";
  const cand = candidata();
  const est = ESTACIONES[vista.estacion];
  const revela = fase === "instalacion" && vista.alineado;
  const noHayInst = !glOk;
  const textoEstado = fase === "instalacion" ? ANUNCIO[vista.estacion] + (vista.alineado ? " El centro está vacío." : "") : anuncio;
  const local = repro.estado === "integra" && repro.origen === "local-pendiente";

  const t = TIEMPOS[alt];
  const tiempos = {
    "--pr-t-camara": t.camara,
    "--pr-t-fundido": t.fundido,
    "--pr-t-fundido-dur": t.fundidoDur,
    "--pr-t-sust": t.sust,
    "--pr-t-sust-dur": t.sustDur,
    "--pr-t-barras": t.barras,
    "--pr-t-barras-dur": t.barrasDur,
  } as React.CSSProperties;

  const marco = repro.estado === "integra" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={marcoRef as React.Ref<HTMLImageElement>}
      className="pr-placa__marco"
      src={repro.src}
      width={REGISTRO.ancho}
      height={REGISTRO.alto}
      alt={`${OBRA.titulo}, ${OBRA.artista}, ${OBRA.fecha}. Reproducción íntegra de la obra original, sin alteraciones.`}
      draggable={false}
    />
  ) : (
    <svg
      ref={marcoRef as React.Ref<SVGSVGElement>}
      className="pr-placa__marco pr-placa__vacia"
      width={REGISTRO.ancho}
      height={REGISTRO.alto}
      viewBox={`0 0 ${REGISTRO.ancho} ${REGISTRO.alto}`}
      role="img"
      aria-label="Lámina vacía: la reproducción de la obra no está disponible en esta edición"
    >
      <rect x="0.5" y="0.5" width={REGISTRO.ancho - 1} height={REGISTRO.alto - 1} fill="rgb(238 242 251 / 0.03)" stroke="rgb(238 242 251 / 0.24)" />
      <text x={REGISTRO.ancho / 2} y={REGISTRO.alto / 2 - 10} textAnchor="middle" fontSize="34" fill="#eef2fb" fontFamily="Instrument Serif, Georgia, serif">Reproducción no disponible</text>
      <text x={REGISTRO.ancho / 2} y={REGISTRO.alto / 2 + 34} textAnchor="middle" fontSize="22" fill="#b4bfd4" fontFamily="system-ui, sans-serif">en esta edición</text>
    </svg>
  );

  return (
    <div
      className={`pr ${cormorant.variable}`}
      data-fase={fase}
      data-llegada={fase === "encuentro" ? llegada : "asentada"}
      data-desde={desde}
      data-alt={alt}
      data-detener={detener ? "si" : "no"}
      data-corte={corte ? "si" : "no"}
      data-reducido={reducido ? "si" : "no"}
      data-alineado={revela ? "si" : "no"}
      data-opciones={opciones ? "si" : "no"}
      data-est={vista.cerca ? vista.estacion : "x"}
      data-repro={repro.estado === "sin" ? "sin" : repro.origen}
      style={tiempos}
    >
      {/* ═══ La sala: contemplación de la pintura (A) ═══ */}
      <main
        className="pr-sala"
        inert={enSala || (fase === "entrando" && desde === "sala") ? undefined : true}
        onPointerDownCapture={asentar}
        onKeyDownCapture={asentar}
        onFocusCapture={asentar}
      >
        <header className="pr-sala__cab pr-cromo">
          <p className="pr-ante">MANIFESTO</p>
          {local && <p className="pr-aviso pr-aviso--corto" role="note">Local · pendiente de autorización · no se publica</p>}
        </header>

        <div className="pr-centro">
          <figure className="pr-lamina-fig">
            <div className="pr-lamina" data-estado={repro.estado}>
              {repro.estado === "integra" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="pr-lamina__img"
                  src={repro.src}
                  width={REGISTRO.ancho}
                  height={REGISTRO.alto}
                  alt={`${OBRA.titulo}, ${OBRA.artista}, ${OBRA.fecha}. Reproducción íntegra de la obra original, sin alteraciones.`}
                  draggable={false}
                />
              ) : (
                <div className="pr-lamina__vacia" role="img" aria-label="Lámina vacía: la reproducción de la obra no está disponible en esta edición">
                  <p className="pr-lamina__vacia-t">Reproducción no disponible</p>
                  <p className="pr-lamina__vacia-s">
                    La obra está protegida y MANIFESTO solo la muestra con autorización. Puedes verla en la ficha oficial.
                  </p>
                </div>
              )}
            </div>
            <figcaption className="pr-ficha">
              <div className="pr-ficha__cabeza pr-cromo">
                <h1 className="pr-ficha__titulo">
                  <cite>
                    {TITULO_BASE}
                    {TITULO_EDICION && <span className="pr-ficha__ed"> {TITULO_EDICION}</span>}
                  </cite>
                </h1>
                <p className="pr-ficha__linea">{OBRA.artista}, {OBRA.fecha}</p>
              </div>
              <div className="pr-ficha__datos pr-cromo">
                <p>{OBRA.tecnica} · {OBRA.medidas}</p>
                <p>{OBRA.coleccion}. {OBRA.credito}. Cat. {OBRA.catalogo}.</p>
                {repro.estado === "integra" && <p>{OBRA.derechos}. {repro.credito}</p>}
              </div>
            </figcaption>
          </figure>

          <div className="pr-texto">
            <p className="pr-doc pr-cromo">
              <span className="pr-rotulo">Documentado</span> {DOC_RESUMEN}
            </p>
            <div className="pr-invita pr-cromo">
              <button
                type="button"
                className="pr-btn pr-btn--principal pr-btn--umbral"
                onClick={() => entrar("sala")}
                onPointerEnter={precalentar}
                onFocus={precalentar}
                onTouchStart={precalentar}
                disabled={!enSala}
              >
                <span className="pr-umbral__t">Cruzar el umbral</span>
                <span className="pr-umbral__s">Recorrido interactivo en 3D</span>
              </button>
            </div>
            <p className="pr-pista pr-interp pr-cromo">
              <span className="pr-rotulo pr-rotulo--int">Interpretación</span> Una instalación original de MANIFESTO, a tu
              ritmo. Puedes quedarte con la pintura.
            </p>
            <div className="pr-fuentes pr-cromo">
              <p className="pr-fichas">
                <a href={FICHAS.catalogo.url} target="_blank" rel="noopener noreferrer">{FICHAS.catalogo.nombre}</a>
                <a href={FICHAS.museo.url} target="_blank" rel="noopener noreferrer">{FICHAS.museo.nombre}</a>
              </p>
              {cand.estado === "sin" && (
                <p className="pr-derechos">
                  {OBRA.derechos}. Protegida por derechos de autor hasta el {DERECHOS_DALI.hasta} ({DERECHOS_DALI.gestion});
                  reproducirla requiere su autorización, que no consta en esta edición. Esta página es un proyecto editorial
                  de divulgación e interpretación: la pintura original y la instalación de MANIFESTO que sigue son cosas
                  distintas y se presentan por separado. MANIFESTO no está afiliado a la Fundació Gala-Salvador Dalí ni a
                  VEGAP. Consultas o reclamaciones de derechos:{" "}
                  <a href={`mailto:${CONTACTO_LEGAL.correo}`}>{CONTACTO_LEGAL.correo}</a> · <Link href="/aviso-legal">Aviso legal</Link>.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ═══ La instalación 3D (B) ═══ */}
      <section ref={capaRef} className="pr-inst" aria-label="Instalación: El retablo que espera" inert={fase === "instalacion" ? undefined : true}>
        <div className="pr-inst__capa" ref={lienzoRef} onPointerDownCapture={() => setOpciones(false)}>
          {montada && (
            <Instalacion
              key={arq || "std"}
              activa={activa}
              cavidad={arq}
              onVista={onVista}
              onGl={setGlOk}
              apiRef={apiRef}
              sliderRef={sliderRef}
            />
          )}
        </div>
        <div className="pr-vela pr-vela--borde" aria-hidden="true" />
        <div className="pr-vela pr-vela--total" aria-hidden="true" />

        <div className="pr-hud">
          <header className="pr-hud__cabeza">
            <p className="pr-ante">MANIFESTO · Interpretación artística</p>
            <h2 className="pr-hud__titulo">El retablo que espera</h2>
          </header>

          <div className="pr-hud__arriba">
            <button type="button" className="pr-btn pr-btn--sec pr-btn--salir" onClick={salir}>
              Salir<span className="pr-sr"> a la pintura</span>
            </button>
          </div>

          <nav className="pr-mando" aria-label="Recorrido de la cámara">
            <p className="pr-hud__pista" aria-hidden="true">Arrastra, desplaza o pulsa › para avanzar</p>

            {/* Opciones bajo demanda: ocultas con `hidden` (no reciben foco) y visibles solo cuando se abren */}
            <div id="pr-opciones" ref={panelRef} className="pr-opciones" role="group" aria-label="Opciones del recorrido" hidden={!opciones}>
              <div className="pr-opciones__est" role="group" aria-label="Ir a una posición">
                {ESTACIONES.map((e, i) => (
                  <button
                    key={e.id}
                    type="button"
                    className="pr-btn"
                    aria-pressed={!vista.libre && vista.cerca && vista.estacion === i}
                    onClick={() => irA(e.p)}
                  >
                    <span className="pr-est__n" aria-hidden="true">{NOMBRES[i]}</span>
                    <span className="pr-est__t">{e.nombre}</span>
                  </button>
                ))}
              </div>
              <label className="pr-deslizador">
                <span className="pr-etiqueta">Recorrido</span>
                <input
                  ref={sliderRef}
                  type="range"
                  min={0}
                  max={1000}
                  step={1}
                  defaultValue={0}
                  onChange={onSlider}
                  aria-label="Recorrido"
                  aria-valuetext={est.nombre}
                />
              </label>
              <div className="pr-opciones__acc">
                <button type="button" className="pr-btn pr-btn--sec" aria-pressed={vista.pausa} onClick={() => apiRef.current?.pausar(!vista.pausa)}>
                  {vista.pausa ? "Reanudar" : "Pausar"}
                </button>
                <button type="button" className="pr-btn pr-btn--sec" aria-pressed={vista.libre} onClick={() => apiRef.current?.alternarLibre()}>
                  Explorar libremente
                </button>
                <button type="button" className="pr-btn pr-btn--sec" onClick={() => apiRef.current?.reiniciar()} disabled={noHayInst}>
                  Reiniciar
                </button>
                <button type="button" className="pr-btn pr-btn--sec" aria-pressed={arq === "completa"} onClick={() => setArq((a) => a === "completa" ? false : "completa")}>
                  {arq === "completa" ? "Arquitectura integral" : "Arquitectura anterior"}
                </button>
              </div>
            </div>

            <div className="pr-recorre">
              <button type="button" className="pr-btn pr-btn--flecha" onClick={anterior} aria-label="Posición anterior" disabled={noHayInst}>‹</button>
              <div className="pr-indica">
                <p className="pr-indica__nombre">
                  <span className="pr-sr">Posición {vista.estacion + 1} de {ESTACIONES.length}. </span>
                  <span className="pr-indica__num" aria-hidden="true">{NOMBRES[vista.estacion]}</span>
                  {est.nombre}
                </p>
                <span className="pr-indica__tramos" aria-hidden="true">
                  {ESTACIONES.map((e, i) => (
                    <i key={e.id} data-estado={i === vista.estacion ? "actual" : i < vista.estacion ? "pasada" : "futura"} />
                  ))}
                </span>
              </div>
              <button type="button" className="pr-btn pr-btn--flecha" onClick={siguiente} aria-label="Posición siguiente" disabled={noHayInst}>›</button>
              <button
                ref={opcionesBtnRef}
                type="button"
                className="pr-btn pr-btn--opciones"
                aria-expanded={opciones}
                aria-controls="pr-opciones"
                aria-label="Opciones del recorrido"
                onClick={() => (opciones ? cerrarOpciones() : setOpciones(true))}
              >
                <svg className="pr-opc__ico" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
                  <circle cx="4" cy="10" r="1.7" /><circle cx="10" cy="10" r="1.7" /><circle cx="16" cy="10" r="1.7" />
                </svg>
                <span className="pr-opc__t" aria-hidden="true">Opciones</span>
              </button>
            </div>
          </nav>

          {/* La revelación: en silencio, una sola frase y dos acciones */}
          <div className="pr-revela" aria-hidden={!revela}>
            <p className="pr-revela__linea">El centro está vacío.</p>
            <div className="pr-revela__acciones">
              <button type="button" className="pr-btn" onClick={anterior} tabIndex={revela ? 0 : -1}>
                ‹ Atrás
              </button>
              <button type="button" className="pr-btn pr-btn--principal" onClick={salir} tabIndex={revela ? 0 : -1}>
                Volver a la pintura
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ El regreso: la lámina íntegra, en el encuadre exacto de la composición 3D (C) ═══ */}
      <section className="pr-regreso" aria-label="La pintura, de vuelta" inert={enRegreso ? undefined : true}>
        <div
          className="pr-ventana"
          aria-hidden="true"
          style={{ left: ventana.x, top: ventana.y, width: ventana.w, height: ventana.h }}
        />
        <div className="pr-regreso__rejilla">
          <header className="pr-barra pr-regreso__arriba">
            <p className="pr-regreso__titulo">
              <cite>{TITULO_BASE}</cite>
              {TITULO_EDICION && <span className="pr-regreso__edicion">{TITULO_EDICION}</span>}
              <span className="pr-regreso__autor">{OBRA.artista}, {OBRA.fecha}</span>
            </p>
          </header>
          <div className="pr-regreso__ranura">
            <figure className="pr-placa">{marco}</figure>
          </div>
          <footer className="pr-barra pr-regreso__abajo">
            <p className="pr-regreso__cierre pr-barra">
              El vacío que has recorrido ya no está vacío.
            </p>
            <div className="pr-acciones pr-acciones--quietas">
              <button ref={principalRef} type="button" className="pr-btn pr-btn--quieto pr-btn--quieto-principal" onClick={() => entrar("reanuda")} disabled={!enRegreso}>
                <span>Volver al centro<span className="pr-solo-ancho"> vacío</span></span>
              </button>
              <button type="button" className="pr-btn pr-btn--quieto" onClick={() => entrar("reinicia")} disabled={!enRegreso}>
                Recorrer de nuevo
              </button>
            </div>
            <details className="pr-mas" open={ficha} onToggle={(e) => setFicha(e.currentTarget.open)}>
              <summary>Ficha e interpretación</summary>
              <div className="pr-mas__cuerpo">
                <section className="pr-mas__bloque" aria-labelledby="pr-mas-doc">
                  <h3 id="pr-mas-doc" className="pr-rotulo">Documentado</h3>
                  <p className="pr-doc">{DOC_RESUMEN}</p>
                  <p className="pr-doc pr-doc--datos">
                    {OBRA.tecnica} · {OBRA.medidas} · {OBRA.coleccion}. {OBRA.credito}. Cat. {OBRA.catalogo}.
                  </p>
                  <p className="pr-fichas">
                    <a href={FICHAS.catalogo.url} target="_blank" rel="noopener noreferrer">{FICHAS.catalogo.nombre}</a>
                    <a href={FICHAS.museo.url} target="_blank" rel="noopener noreferrer">{FICHAS.museo.nombre}</a>
                  </p>
                  {repro.estado === "integra" ? (
                    <p className="pr-derechos">{OBRA.derechos}. {repro.credito}</p>
                  ) : (
                    <p className="pr-pista">
                      En esta edición la reproducción no está disponible (obra protegida hasta el {DERECHOS_DALI.hasta},{" "}
                      {DERECHOS_DALI.gestion}; no consta autorización): la ficha oficial permite verla. MANIFESTO no está
                      afiliado a su titular. Esta versión no tiene el mismo efecto que una edición con la pintura. Consultas
                      o reclamaciones de derechos: <Link href="/aviso-legal">aviso legal</Link>.
                    </p>
                  )}
                </section>
                <section className="pr-mas__bloque" aria-labelledby="pr-mas-int">
                  <h3 id="pr-mas-int" className="pr-rotulo pr-rotulo--int">Interpretación</h3>
                  <p className="pr-doc">
                    En el centro que has recorrido vacío, la pintura sitúa a la Virgen y al Niño, bajo la concha y el huevo.
                    Que la instalación deje ese lugar vacío es una lectura de MANIFESTO.
                  </p>
                </section>
                {local && <p className="pr-derechos">Local · pendiente de autorización · no se publica</p>}
              </div>
            </details>
          </footer>
        </div>
      </section>

      {/* Omitir transición (siempre disponible mientras dura) */}
      <button
        type="button"
        className="pr-btn pr-omitir"
        onClick={omitir}
        hidden={fase !== "entrando" && fase !== "volviendo"}
      >
        Omitir transición
      </button>

      <p className="pr-estado" role="status" aria-live="polite">{textoEstado}</p>
    </div>
  );
}
