import Link from "next/link";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { CONTEXTO_GLENN, OBRIEN, RELACION_GLENN } from "@/content/glenn";
import { CronologiaArrastrable } from "./CronologiaArrastrable";

/**
 * «1985»: los hitos documentados alrededor de Glenn, quién era Glenn O'Brien y la
 * relación con la otra cabeza de Basquiat en MANIFESTO (Untitled, 1981). Los hitos son
 * una tira de fotocopias que se arrastra (CronologiaArrastrable).
 */
export function ContextoGlenn() {
  return (
    <section className="gl-seccion gl-contexto" aria-labelledby="gl-ctx-t">
      <header className="gl-seccion__cab">
        <p className="gl-seccion__n">04</p>
        <h2 id="gl-ctx-t" className="gl-h2">
          Nueva York, 1984–1985
        </h2>
        <p className="gl-seccion__intro">
          Cuando pinta Glenn, Basquiat tiene veinticuatro años, expone en Mary Boone y la prensa ya habla de él como de
          un fenómeno de mercado.
        </p>
      </header>

      <CronologiaArrastrable etiqueta="Cronología 1984–1985: desliza o arrastra las hojas">
        <ol className="gl-hitos gl-hitos--tira">
          {CONTEXTO_GLENN.map((h, i) => (
            <li key={h.id} className="gl-hito" data-n={String(i + 1).padStart(2, "0")}>
              <p className="gl-hito__fecha">{h.fecha}</p>
              <p>{h.texto}</p>
              <p className="gl-meta">
                <KindTag tipo="hecho" /> <span>Fuente: {h.fuente}</span>
              </p>
            </li>
          ))}
        </ol>
      </CronologiaArrastrable>

      <div className="gl-contexto__pie">
        <div className="gl-obrien">
          <h3 className="gl-h3">¿Quién es Glenn?</h3>
          <p>{OBRIEN.texto}</p>
          <p className="gl-meta">
            <KindTag tipo="hecho" /> <span>Fuente: {OBRIEN.fuente}</span>
          </p>
          <p>Que el cuadro lleve su nombre no está documentado por el artista: es la identificación más probable.</p>
          <p className="gl-meta">
            <KindTag tipo="lectura" />
          </p>
        </div>

        <Link href={`/conceptos/${RELACION_GLENN.slug}`} className="gl-relacion">
          <span className="gl-relacion__k">Obra relacionada · 04 / 05</span>
          <span className="gl-relacion__t">
            {RELACION_GLENN.titulo}, {RELACION_GLENN.fecha}
          </span>
          <span className="gl-relacion__texto">{RELACION_GLENN.texto}</span>
          <span className="gl-relacion__pregunta">{RELACION_GLENN.pregunta}</span>
          <span className="gl-meta">
            <KindTag tipo="lectura" />
          </span>
          <span className="gl-relacion__ir">
            Entrar en Untitled
            <svg aria-hidden="true" width="16" height="10" viewBox="0 0 16 10" fill="none">
              <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
        </Link>
      </div>
    </section>
  );
}
