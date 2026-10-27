import { KindTag } from "@/components/concepts/ConceptChrome";
import { CAPAS, HALLAZGOS } from "@/content/basquiat-capas";

/**
 * «Descifrar capas» como texto: sin JavaScript (dentro de <noscript>) y en la
 * exportación sin reproducción autorizada, donde no hay obra sobre la que
 * dibujar. Las cuatro capas y los cinco hallazgos, con sus fuentes.
 * `partes` deja solo las capas o solo los hallazgos (junto al laboratorio de acetatos).
 */
export function CapasTexto({ sinObra = false, partes = "todo" }: { sinObra?: boolean; partes?: "todo" | "capas" | "hallazgos" }) {
  const capas = partes !== "hallazgos";
  const hallazgos = partes !== "capas";
  return (
    <div className="bq-texto">
      {capas && sinObra ? (
        <p className="bq-texto__aviso">
          Sin una reproducción autorizada, las capas no se pueden dibujar sobre la pintura. Esto es lo que cada una señala.
        </p>
      ) : null}
      {capas ? (
        <div className="bq-texto__capas">
          {CAPAS.map((c) => (
            <section key={c.id} className="bq-texto__capa" aria-labelledby={`bq-tc-${c.id}`}>
              <h3 id={`bq-tc-${c.id}`}>{c.nombre}</h3>
              <p>{c.intro.texto}</p>
              <p className="bq-meta">
                <KindTag tipo={c.intro.tipo} /> <span>Fuente: {c.intro.fuente}</span>
              </p>
              <ul>
                {c.elementos.map((e) => (
                  <li key={e.n}>
                    <strong>{e.nombre}.</strong> {e.nota} <KindTag tipo={e.tipo} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
      {hallazgos ? (
        <>
          <h3 className="bq-texto__h">Cinco hallazgos</h3>
          <ol className="bq-texto__hallazgos">
            {HALLAZGOS.map((h) => (
              <li key={h.n}>
                <details>
                  <summary>
                    <span className="bq-texto__pregunta">{h.pregunta}</span> {h.titulo}
                  </summary>
                  <p>{h.texto}</p>
                  {h.entradas.map((en) => (
                    <div key={en.texto} className="bq-texto__entrada">
                      <p>{en.texto}</p>
                      <p className="bq-meta">
                        <KindTag tipo={en.tipo} /> <span>Fuente: {en.fuente}</span>
                      </p>
                    </div>
                  ))}
                </details>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </div>
  );
}
