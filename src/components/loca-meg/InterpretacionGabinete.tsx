import { TRANSICION as T } from "@/content/loca-meg-gabinete";

/** Umbral entre «Cartografía del caos» y la instalación: qué se ve en la tabla y qué propone MANIFESTO. */
export function InterpretacionGabinete() {
  return (
    <section className="gb-transicion" aria-labelledby="gb-transicion-h">
      <h2 id="gb-transicion-h">{T.titulo}</h2>
      <p className="gb-transicion__entrada">{T.entrada}</p>
      <div className="gb-transicion__cols">
        {[T.tabla, T.sala].map((c, k) => (
          <div key={c.etiqueta} data-tipo={k ? "sala" : "tabla"}>
            <p className="gb-transicion__tipo">{c.tipo}</p>
            <h3>{c.etiqueta}</h3>
            <p>{c.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
