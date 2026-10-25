import { Etiqueta, KindTag } from "@/components/concepts/ConceptChrome";
import { CREDITOS_EDITORIALES, CRONOLOGIA, FICHA_EXPEDIENTE, FUENTES_EXPEDIENTE, NOTA_TITULO } from "@/content/basquiat-lecturas";

/** Sección 03 · «El expediente»: ficha, cronología verificada, fuentes por tipo y créditos. */
export function Expediente() {
  return (
    <section id="expediente" className="bq-expediente" aria-labelledby="bq-exp-t">
      <header className="bq-capas__head">
        <p className="bq-capas__k" aria-hidden="true">
          03 · El expediente
        </p>
        <h2 id="bq-exp-t" className="bq-capas__t">
          El expediente
        </h2>
        <p className="bq-capas__intro">Lo que se sabe de la obra, de dónde sale cada dato y lo que falta por comprobar.</p>
      </header>

      <ul className="bq-exp__claves" aria-label="Cómo leer las etiquetas">
        <li>
          <KindTag tipo="hecho" /> Lo dice una fuente identificada.
        </li>
        <li>
          <KindTag tipo="observacion" /> Se ve en la pintura.
        </li>
        <li>
          <KindTag tipo="lectura" /> Es una interpretación, de MANIFESTO o de quien se cita.
        </li>
        <li>
          <span className="bq-cotejo">Pendiente de cotejo</span> La fuente original no se ha consultado directamente.
        </li>
      </ul>

      <div className="bq-exp__grid">
        <div className="bq-exp__ficha">
          <h3 className="bq-exp__h">Ficha</h3>
          <Etiqueta rows={FICHA_EXPEDIENTE} label="Ficha de Untitled (1981)" />
          <p className="bq-exp__nota">
            {NOTA_TITULO.texto}{" "}
            <span className="bq-meta">
              <KindTag tipo={NOTA_TITULO.tipo} /> <span>Fuente: {NOTA_TITULO.fuente}</span>
            </span>
          </p>
          <p className="bq-meta">
            <KindTag tipo="hecho" /> <span>Fuente de la ficha: The Broad, ficha de la obra y biografía del artista</span>
          </p>
        </div>

        {/* Plegada de serie, como las fuentes: los nueve hitos, sin resumir, a un toque (nativo, sin JS) */}
        <details className="bq-exp__crono bq-exp__mas">
          <summary>
            <h3 className="bq-exp__mas-t">Producción, exposición y colección</h3>
            <span className="bq-exp__mas-d">
              {CRONOLOGIA.length} hitos, de {CRONOLOGIA[0].cuando} a {CRONOLOGIA.at(-1)?.cuando}, cada uno con su fuente
            </span>
          </summary>
          <ol className="bq-crono">
            {CRONOLOGIA.map((h) => (
              <li key={h.cuando + h.texto}>
                <span className="bq-crono__cuando">{h.cuando}</span>
                <div>
                  <p>{h.texto}</p>
                  <p className="bq-meta">
                    <KindTag tipo={h.tipo} />
                    {h.pendiente ? <span className="bq-cotejo">Pendiente de cotejo</span> : null}
                    <span>Fuente: {h.fuente}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </details>
      </div>

      {/* Plegado de serie (nativo, sin JavaScript), como la cronología: acorta la página en móvil */}
      <details className="bq-exp__mas">
        <summary>
          <span className="bq-exp__mas-t">Fuentes y créditos</span>
          <span className="bq-exp__mas-d">Qué fuentes sostienen cada dato, cuáles faltan por cotejar y cuáles se descartaron</span>
        </summary>
        <div className="bq-exp__pie">
          <div className="bq-exp__fuentes">
            <h3 className="bq-exp__h">Fuentes</h3>
            {FUENTES_EXPEDIENTE.map((g) => (
              <div key={g.grupo} className="bq-exp__grupo">
                <h4>{g.grupo}</h4>
                <p className="bq-exp__grupo-nota">{g.nota}</p>
                <ul>
                  {g.fuentes.map((f) => (
                    <li key={f.titulo}>
                      {f.href ? (
                        <a href={f.href} target="_blank" rel="noopener noreferrer">
                          {f.titulo}
                          <span className="sr-only"> (se abre en otra pestaña)</span>
                        </a>
                      ) : (
                        <span className="bq-exp__titulo">{f.titulo}</span>
                      )}
                      <span className="bq-exp__detalle">{f.detalle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bq-exp__creditos">
            <h3 className="bq-exp__h">Créditos editoriales</h3>
            <ul>
              {CREDITOS_EDITORIALES.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}
