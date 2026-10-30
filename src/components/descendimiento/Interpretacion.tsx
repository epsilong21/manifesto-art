import { TRANSICION as T } from "@/content/descendimiento-gravedad";

/** Umbral entre el análisis de la tabla y la instalación: qué se ve en el cuadro y qué propone MANIFESTO. */
export function Interpretacion() {
  return (
    <section className="gv-transicion" aria-labelledby="gv-transicion-h">
      <h2 id="gv-transicion-h">{T.titulo}</h2>
      <p className="gv-transicion__entrada">{T.entrada}</p>
      <div className="gv-transicion__cols">
        {[T.tabla, T.sala].map((c, k) => (
          <div key={c.etiqueta} data-tipo={k ? "sala" : "tabla"}>
            <p className="gv-transicion__tipo">{c.tipo}</p>
            <h3>{c.etiqueta}</h3>
            <p>{c.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
