import Image from "next/image";
import { KindTag } from "@/components/concepts/ConceptChrome";
import { OBRA_BASQUIAT } from "@/content/basquiat";
import { LECTURAS, SINTESIS, type LecturaId } from "@/content/basquiat-lecturas";

const nombre = (id: LecturaId) => LECTURAS.find((l) => l.id === id)!.nombre;

/**
 * Detalle de la pintura: un encuadre de la reproducción, sin alterarla. Las
 * coordenadas están en px de la reproducción calibrada (921 × 1080); con otra,
 * recalibrar en basquiat-lecturas.ts. Decorativo: el pie dice qué se ve.
 */
function Recorte({ zona: [x, y, w, h], pie }: { zona: [number, number, number, number]; pie: string }) {
  const { imagen } = OBRA_BASQUIAT;
  return (
    <figure className="bq-recorte">
      <div className="bq-recorte__marco" style={{ aspectRatio: `${w} / ${h}` }}>
        <Image
          src={imagen.src}
          width={imagen.width}
          height={imagen.height}
          alt=""
          sizes="921px"
          quality={80}
          style={{ width: `${(imagen.width / w) * 100}%`, height: "auto", left: `${(-x / w) * 100}%`, top: `${(-y / h) * 100}%` }}
        />
      </div>
      <figcaption>{pie}</figcaption>
    </figure>
  );
}

/**
 * Sección 02 · «¿Qué estamos mirando?». Tres lecturas que se eligen con radios
 * nativos y CSS (:has): funciona sin JavaScript y sin otro sistema de marcas sobre
 * la obra. Sin :has, todas las lecturas se muestran seguidas. Sin reproducción
 * autorizada, solo el texto.
 */
export function TresLecturas({ conImagen }: { conImagen: boolean }) {
  return (
    <section id="lecturas" className="bq-lecturas" aria-labelledby="bq-lecturas-t">
      <header className="bq-capas__head">
        <p className="bq-capas__k" aria-hidden="true">
          02 · Tres lecturas
        </p>
        <h2 id="bq-lecturas-t" className="bq-capas__t">
          ¿Qué estamos mirando?
        </h2>
        <p className="bq-capas__intro">
          Un cráneo, un rostro o una máscara. Ninguna respuesta es la correcta: elige una mirada, cámbiala por otra o
          mira las tres a la vez.
        </p>
      </header>

      <fieldset className="bq-mirar">
        <legend className="sr-only">Elige cómo mirar la obra</legend>
        {LECTURAS.map((l) => (
          <div key={l.id} className="bq-mirar__op">
            <input type="radio" name="bq-lectura" id={`bq-l-${l.id}`} value={l.id} className="bq-mirar__input" />
            <label htmlFor={`bq-l-${l.id}`}>
              <span className="bq-mirar__n">{l.nombre}</span>
              <span className="bq-mirar__lema">{l.lema}</span>
            </label>
          </div>
        ))}
        <div className="bq-mirar__op">
          <input type="radio" name="bq-lectura" id="bq-l-tres" value="tres" className="bq-mirar__input" />
          <label htmlFor="bq-l-tres">
            <span className="bq-mirar__n">Las tres a la vez</span>
            <span className="bq-mirar__lema">Dónde se cruzan</span>
          </label>
        </div>
      </fieldset>

      <div className="bq-vistas">
        <p className="bq-vistas__inicio">
          Elige una mirada para empezar. Cada una separa lo que se ve, lo que puede significar y lo que está
          documentado.
        </p>

        {LECTURAS.map((l) => (
          <article key={l.id} className="bq-vista" data-vista={l.id} aria-labelledby={`bq-v-${l.id}`}>
            {conImagen ? <Recorte zona={l.recorte} pie={l.pieRecorte} /> : null}
            <div className="bq-vista__texto">
              <p className="bq-vista__k">{l.pregunta}</p>
              <h3 id={`bq-v-${l.id}`} className="bq-vista__t">
                {l.nombre} <span className="bq-vista__lema">{l.lema}</span>
              </h3>
              <ul className="bq-bloques">
                {l.bloques.map((b) => (
                  <li key={b.texto} data-tipo={b.tipo}>
                    <p>{b.texto}</p>
                    <p className="bq-meta">
                      <KindTag tipo={b.tipo} /> <span>Fuente: {b.fuente}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <p className="bq-limite">
                <span className="bq-limite__k">Lo que esta lectura no explica</span> {l.limite}
              </p>
            </div>
          </article>
        ))}

        <article className="bq-vista bq-sintesis" data-vista="tres" aria-labelledby="bq-v-tres">
          <div className="bq-sintesis__cabeza">
            <p className="bq-vista__k">Las tres a la vez</p>
            <h3 id="bq-v-tres" className="bq-vista__t">
              {SINTESIS.titulo}
            </h3>
            <p className="bq-sintesis__entrada">{SINTESIS.entrada}</p>
          </div>
          <ol className="bq-ciclo">
            {SINTESIS.ciclo.map((c) => {
              const l = LECTURAS.find((x) => x.id === c.de)!;
              return (
                <li key={c.de}>
                  {conImagen ? <Recorte zona={l.recorte} pie={l.pieRecorte} /> : null}
                  <p className="bq-ciclo__k">
                    {l.nombre} · {l.pregunta}
                  </p>
                  <p className="bq-ciclo__tropieza">{c.tropieza}</p>
                  <p className="bq-ciclo__explica">
                    Lo explica: <strong>{nombre(c.explica)}</strong>
                    {c.explica === "craneo" ? <span className="bq-ciclo__vuelta">, y el círculo vuelve a empezar</span> : null}
                  </p>
                </li>
              );
            })}
          </ol>
          <div className="bq-sintesis__cierre">
            <p className="bq-conclusion">{SINTESIS.conclusion}</p>
            <p className="bq-titulo2">{SINTESIS.titulo2}</p>
            <p className="bq-meta">
              <KindTag tipo="lectura" /> <span>Síntesis de MANIFESTO a partir de las tres lecturas</span>
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
