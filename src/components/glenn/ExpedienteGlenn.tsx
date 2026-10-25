import { Etiqueta } from "@/components/concepts/ConceptChrome";
import { EXPOSICION_GLENN, FICHA_GLENN, PROCEDENCIA_GLENN } from "@/content/glenn";

/** Ficha técnica, procedencia y la nota sobre la fecha. Las fuentes completas van en el pie. */
export function ExpedienteGlenn() {
  return (
    <section className="gl-seccion gl-expediente" aria-labelledby="gl-exp-t">
      <header className="gl-seccion__cab">
        <p className="gl-seccion__n">05</p>
        <h2 id="gl-exp-t" className="gl-h2">
          Ficha y procedencia
        </h2>
      </header>
      <div className="gl-expediente__cols">
        <Etiqueta rows={FICHA_GLENN} label="Ficha técnica de Glenn" />
        <div className="gl-expediente__texto">
          <h3 className="gl-h3">Procedencia</h3>
          <ol className="gl-procedencia">
            {PROCEDENCIA_GLENN.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <h3 className="gl-h3">Exposición</h3>
          <p>{EXPOSICION_GLENN}.</p>
          <h3 className="gl-h3">Sobre la fecha</h3>
          <p>
            Las fuentes no coinciden. La lista de préstamos de la Barbican la data en 1984 y, en la procedencia, anota
            «Created in 1985»; los créditos de esa misma exposición usan una u otra fecha. MANIFESTO indica 1984–1985
            hasta poder cotejar el catálogo razonado o la inscripción del reverso.
          </p>
        </div>
      </div>
    </section>
  );
}
