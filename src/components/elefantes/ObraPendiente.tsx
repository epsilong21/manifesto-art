import { ElefantesGrafico } from "@/components/concepts/ElefantesGrafico";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { CIERRE_LECTURA, DESCUBRIMIENTOS } from "@/content/elefantes";

/**
 * Alternativa a ObraLectura cuando no hay reproducción autorizada de la
 * pintura: una composición propia, declarada como tal, una cartela que explica
 * la ausencia y los cinco capítulos como texto. Sin guías sobre una imagen
 * que no está ni controles que no podrían funcionar. No necesita JavaScript.
 */
export function ObraPendiente() {
  return (
    <section id="la-obra" className="op" aria-labelledby="ol-t">
      <figure className="op-obra">
        <div className="op-escena">
          <ElefantesGrafico id="op-eg" className="op-grafico" />
        </div>
        <figcaption className="op-cartela">
          <p className="op-cartela__t">Reproducción pendiente de autorización</p>
          <p>
            Los elefantes, de Salvador Dalí, está protegida por derechos de autor. La pintura se mostrará
            aquí cuando su reproducción esté autorizada. Lo que ves es una composición gráfica de
            MANIFESTO: no es la obra de Dalí ni la imita. Sus cinco marcas remiten a los cinco capítulos.
          </p>
        </figcaption>
      </figure>

      <div className="op-texto">
        <p className="ol-autor">Salvador Dalí, 1948</p>
        <h1 id="ol-t" className="ol-t">
          Los elefantes
        </h1>
        <p className="ol-sub">
          Toneladas de animal sobre patas de alambre. Mientras llega la imagen, los cinco capítulos se
          pueden leer aquí.
        </p>

        <ol className="op-caps">
          {DESCUBRIMIENTOS.map((d, n) => (
            <li key={d.id} className="op-cap">
              <p className="ol-cap__n">
                Capítulo {n + 1} de {DESCUBRIMIENTOS.length}
              </p>
              <p className="op-cap__pregunta">{d.pregunta}</p>
              <h2 className="op-cap__t">{d.titulo}</h2>
              <p className="op-cap__intro">{d.intro}</p>
              <details className="op-cap__mas">
                <summary>Leer más: {d.entradas.map((e) => e.capa).join(", ").toLowerCase()}</summary>
                {d.entradas.map((e) => (
                  <div key={e.capa} className="op-entrada">
                    <p>
                      <strong>{e.capa}.</strong> {e.texto}
                    </p>
                    <p className="ol-entrada__meta">
                      <KindTag tipo={e.tipo} /> <span>Fuente: {e.fuente}</span>
                    </p>
                  </div>
                ))}
              </details>
              {d.enlace ? (
                <a className="ol-enlace" href={d.enlace.href}>
                  {d.enlace.texto}
                </a>
              ) : null}
            </li>
          ))}
        </ol>

        <a className="mf-btn mf-btn--solid" href="#interpretacion">
          {CIERRE_LECTURA.accion} <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
