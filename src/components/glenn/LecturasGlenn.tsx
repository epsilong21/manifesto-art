"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { LECTURAS_GLENN, type Lectura } from "@/content/glenn";
import { CLASES, DOCUMENTOS, type Clase, type DocArchivo } from "@/content/glenn-archivo";
import { ArchivoVivo } from "./ArchivoVivo";
import { ACTIVOS } from "./archivoPoses";

/** Pestañas con flechas, Inicio y Fin (lecturas y cajones) */
function flechas<T extends string>(ids: readonly T[], actual: T, ir: (id: T) => void, idDe: (id: T) => string) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    const i = ids.indexOf(actual);
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: ids.length - 1 }[e.key];
    if (j === undefined) return;
    e.preventDefault();
    const n = ids[(j + ids.length) % ids.length];
    ir(n);
    document.getElementById(idDe(n))?.focus();
  };
}

const LECTURAS = LECTURAS_GLENN.map((l) => l.id);
const CAJONES = CLASES.map((c) => c.id);

/**
 * Tres lecturas de Glenn: retrato, máscara y archivo. A la izquierda, la instalación
 * «Archivo vivo» (ArchivoVivo), que se recompone con cada lectura; a la derecha, la
 * tesis, los documentos que la sostienen (mandos equivalentes a tocar las piezas) y el
 * voto, que se anuncia (aria-live) y recuerda que ninguna lectura está demostrada.
 * En el archivo, los doce documentos van en cuatro cajones (pestañas): se ve uno y
 * elegir una ficha en la instalación abre el suyo; cambiar de cajón no pierde la elegida.
 *
 * Los paneles se apilan en la misma celda y solo cambia su visibilidad (glenn-archivo.css):
 * cambiar de lectura no recoloca la página. Sin JavaScript se leen las tres lecturas y
 * los cuatro cajones seguidos con el texto completo de cada documento; la instalación
 * queda quieta en el retrato.
 */
export function LecturasGlenn() {
  const base = useId();
  const [actual, setActual] = useState<Lectura["id"]>("retrato");
  const [voto, setVoto] = useState<Lectura["id"] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [cajon, setCajon] = useState<Clase>("hecho");
  const [resalta, setResalta] = useState<string | null>(null);

  const cambiar = (id: Lectura["id"]) => {
    setActual(id);
    // Un documento de otra lectura vuelve a su sitio; en el archivo caben todos
    if (sel && !ACTIVOS[id].includes(sel)) setSel(null);
    if (id === "archivo" && sel) setCajon(DOCUMENTOS.find((d) => d.id === sel)!.clase);
  };

  // Elegir (en la instalación o en el panel) abre el cajón del documento en el archivo
  const elegir = (id: string | null) => {
    setSel(id);
    if (id && actual === "archivo") setCajon(DOCUMENTOS.find((d) => d.id === id)!.clase);
  };

  const idTab = (id: Lectura["id"]) => `${base}-tab-${id}`;
  const idCajon = (id: Clase) => `${base}-cajon-tab-${id}`;
  const elegida = LECTURAS_GLENN.find((l) => l.id === voto);

  const boton = (panel: Lectura["id"], d: DocArchivo) => (
    <li key={d.id} data-repetido={d.lectura !== panel ? "" : undefined}>
      <button
        type="button"
        className="gl-av__doc"
        aria-pressed={sel === d.id}
        onClick={() => elegir(sel === d.id ? null : d.id)}
        onPointerEnter={() => setResalta(d.id)}
        onPointerLeave={() => setResalta(null)}
        onFocus={() => setResalta(d.id)}
        onBlur={() => setResalta(null)}
      >
        <span className="gl-av__doc-cod" aria-hidden="true">
          {d.codigo}
        </span>
        <span className="gl-av__doc-rot">{d.rotulo}</span>
        {d.clase === "limite" ? <span className="gl-av__limite">Lo que no prueba</span> : <KindTag tipo={d.clase} />}
      </button>
      {/* Sin JavaScript, el texto completo; con él, la ficha de la instalación */}
      <p className="gl-av__sinjs">
        {d.texto} <span className="gl-meta">Fuente: {d.fuente}</span>
      </p>
    </li>
  );

  return (
    <section className="gl-seccion gl-lecturas" aria-labelledby="gl-lec-t">
      <header className="gl-seccion__cab">
        <p className="gl-seccion__n">03</p>
        <h2 id="gl-lec-t" className="gl-h2">
          Tres lecturas
        </h2>
        <p className="gl-seccion__intro">
          ¿A quién mira esta cabeza? Tres maneras de leer Glenn. Las tres son interpretaciones: cada una se apoya en
          datos, y ninguna los agota.
        </p>
      </header>

      <div className="gl-av">
        <ArchivoVivo lectura={actual} sel={sel} resalta={resalta} cajon={cajon} onSel={elegir} />

        <div className="gl-av__panel">
          <div role="tablist" aria-label="Lecturas" className="gl-tabs gl-tabs--lecturas" onKeyDown={flechas(LECTURAS, actual, cambiar, idTab)}>
            {LECTURAS_GLENN.map((l, i) => (
              <button
                key={l.id}
                id={idTab(l.id)}
                type="button"
                role="tab"
                aria-selected={actual === l.id}
                aria-controls={`${base}-panel-${l.id}`}
                tabIndex={actual === l.id ? 0 : -1}
                onClick={() => cambiar(l.id)}
              >
                <span className="gl-tabs__n" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                {l.nombre}
                {voto === l.id ? <span className="gl-tabs__voto"> · tu lectura</span> : null}
              </button>
            ))}
          </div>

          <div className="gl-av__paneles">
            {LECTURAS_GLENN.map((l) => (
              <div
                key={l.id}
                id={`${base}-panel-${l.id}`}
                role="tabpanel"
                aria-labelledby={idTab(l.id)}
                className="gl-lectura"
                data-lectura={l.id}
                data-activa={actual === l.id ? "" : undefined}
              >
                <p className="gl-lectura__tesis">{l.tesis}</p>
                {l.id === "archivo" ? (
                  <div className="gl-av__archivo">
                    <h3 className="gl-av__grupo-t">Cuatro cajones, por grado de certeza</h3>
                    <div role="tablist" aria-label="Cajones del archivo" className="gl-av__cajones" onKeyDown={flechas(CAJONES, cajon, setCajon, idCajon)}>
                      {CLASES.map((c) => (
                        <button
                          key={c.id}
                          id={idCajon(c.id)}
                          type="button"
                          role="tab"
                          aria-selected={cajon === c.id}
                          aria-controls={`${base}-cajon-${c.id}`}
                          tabIndex={cajon === c.id ? 0 : -1}
                          data-clase={c.id}
                          onClick={() => setCajon(c.id)}
                        >
                          <span>{c.nombre}</span>
                          <span className="gl-av__cajon-n">{DOCUMENTOS.filter((d) => d.clase === c.id).length}</span>
                        </button>
                      ))}
                    </div>
                    <div className="gl-av__cajon-paneles">
                      {CLASES.map((c) => (
                        <div
                          key={c.id}
                          id={`${base}-cajon-${c.id}`}
                          role="tabpanel"
                          aria-labelledby={idCajon(c.id)}
                          className="gl-av__cajon"
                          data-activa={cajon === c.id ? "" : undefined}
                        >
                          {/* Sin JavaScript, el nombre del cajón hace de título */}
                          <h4 className="gl-av__grupo-t gl-av__cajon-t">{c.nombre}</h4>
                          <ul className="gl-av__docs">{DOCUMENTOS.filter((d) => d.clase === c.id).map((d) => boton(l.id, d))}</ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="gl-av__grupo-t">Documentos de esta lectura</h3>
                    <ul className="gl-av__docs">{DOCUMENTOS.filter((d) => d.lectura === l.id).map((d) => boton(l.id, d))}</ul>
                  </>
                )}
                <button type="button" className="gl-btn gl-btn--solido gl-av__voto" aria-pressed={voto === l.id} onClick={() => setVoto(voto === l.id ? null : l.id)}>
                  {voto === l.id ? "Es tu lectura · quitar" : "Esta me convence"}
                </button>
                {/* Junto a su botón; solo se anuncia el de la lectura visible (los demás están ocultos) */}
                <p className="gl-veredicto" aria-live="polite">
                  {elegida
                    ? `Te convence «${elegida.nombre}». Las otras dos siguen abiertas: ninguna está demostrada.`
                    : "Todavía no has elegido ninguna lectura."}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
