import type { Metadata } from "next";
import Link from "next/link";
import { ConceptHeader, SiteFooter } from "@/components/concepts/ConceptChrome";
import { ACTUALIZACION, CONTACTO_LEGAL, CREDITOS_URL, DATOS_PENDIENTES, RESPONSABLE, SECCIONES_AVISO } from "@/content/aviso-legal";
import { BASQUIAT, DERECHOS_BASQUIAT, OBRA_BASQUIAT } from "@/content/basquiat";
import { DERECHOS_DALI, ELEFANTES, OBRA_ELEFANTES } from "@/content/elefantes";
import { DERECHOS_GLENN, GLENN, OBRA_GLENN } from "@/content/glenn";
import { MEDUSA } from "@/content/medusa";
import { NOCHE } from "@/content/noche";
import { hayImagenBasquiat } from "@/lib/obraBasquiat";
import { hayImagenElefantes } from "@/lib/obraElefantes";
import { hayImagenGlenn } from "@/lib/obraGlenn";
import "../conceptos/conceptos.css";
import "./aviso-legal.css";

export const metadata: Metadata = {
  title: "Aviso legal y derechos de reproducción — MANIFESTO",
  description:
    "Naturaleza del proyecto, titularidad de las obras, uso editorial de las reproducciones, contenidos propios de MANIFESTO, créditos y cómo enviar una consulta o reclamación de derechos.",
  alternates: { canonical: "/aviso-legal" },
};

/** Publicación simplificada: el catálogo es la entrada (como en ConceptFooter) */
const ENTRADA_SELECTOR = process.env.NEXT_PUBLIC_MANIFESTO_ENTRADA === "selector";

/** Un dato del responsable: su valor confirmado o, si falta, el aviso de que está pendiente */
function Dato({ d }: { d: { valor: string | null; pendiente: string } }) {
  if (d.valor === null) return <mark className="al-pendiente">[Pendiente de confirmar: {d.pendiente}]</mark>;
  return <>{d.valor}</>;
}

/** El correo de contacto legal (CONTACTO_LEGAL), con su enlace mailto */
function Correo() {
  return <a href={`mailto:${CONTACTO_LEGAL.correo}`}>{CONTACTO_LEGAL.correo}</a>;
}

type Obra = { slug: string; titulo: string; autor: string; fecha: string; coleccion: string; imagen: string; derechos: string; situacion: string };

/**
 * Página permanente del aviso legal: el texto aprobado (secciones 1 a 8) y un anexo con
 * los créditos y la situación de cada obra. El anexo se calcula con la misma condición
 * de compilación que las páginas de las obras, así que describe lo que muestra esta
 * versión del sitio (local completa o publicada).
 */
export default function AvisoLegalPage() {
  const basquiat = hayImagenBasquiat();
  const glenn = hayImagenGlenn();
  const elefantes = hayImagenElefantes();
  const catalogo = ENTRADA_SELECTOR ? "/" : "/conceptos";

  const obras: Obra[] = [
    {
      slug: "medusa",
      titulo: MEDUSA.titulo,
      autor: MEDUSA.autor,
      fecha: MEDUSA.fecha,
      coleccion: MEDUSA.museo,
      imagen: "Google Arts & Culture vía Wikimedia Commons (PD-Art). En «El reflejo», la Cabeza de Medusa de Franz von Stuck (h. 1892), también de Wikimedia Commons y en dominio público.",
      derechos: "Obra en dominio público.",
      situacion:
        "Difusión acogida al art. 108.3-bis del Codice dei beni culturali e del paesaggio (D.Lgs. 42/2004), que solo ampara usos sin ánimo de lucro. No es una autorización de las Gallerie degli Uffizi ni se ha solicitado ninguna.",
    },
    {
      slug: "noche-estrellada",
      titulo: NOCHE.titulo,
      autor: NOCHE.autor,
      fecha: "1889",
      coleccion: `${NOCHE.museo} (${NOCHE.inventario})`,
      imagen: "Google Arts & Culture vía Wikimedia Commons (Public Domain Mark 1.0).",
      derechos: "Obra en dominio público.",
      situacion: "Reproducción fiel de una obra bidimensional en dominio público.",
    },
    {
      slug: "los-elefantes",
      titulo: ELEFANTES.titulo,
      autor: ELEFANTES.autor,
      fecha: ELEFANTES.fecha,
      coleccion: "Colección particular",
      imagen: elefantes ? OBRA_ELEFANTES.credito.imagen || "Reproducción de referencia (historia-arte.com)." : "La pintura no se muestra; la página usa una composición propia de MANIFESTO.",
      derechos: `${OBRA_ELEFANTES.credito.derechos} Protegida hasta el ${DERECHOS_DALI.hasta}.`,
      situacion: elefantes
        ? `${OBRA_ELEFANTES.credito.autorizacion} Se muestra por decisión del titular del sitio y se retirará si lo pide el titular de los derechos.`
        : "Sin reproducción: no hay licencia.",
    },
    {
      slug: "basquiat-untitled",
      titulo: BASQUIAT.titulo,
      autor: BASQUIAT.autor,
      fecha: BASQUIAT.fecha,
      coleccion: `${BASQUIAT.ubicacion} (${BASQUIAT.inventario})`,
      imagen: basquiat
        ? `${OBRA_BASQUIAT.credito.imagen} ${OBRA_BASQUIAT.credito.pie}`
        : "La pintura no se muestra. En su lugar, una pila de acetatos de MANIFESTO rotulada como tal, y un enlace a la ficha de The Broad.",
      derechos: `${DERECHOS_BASQUIAT.credito} Protegida hasta el ${DERECHOS_BASQUIAT.hasta}.`,
      situacion: basquiat ? `${OBRA_BASQUIAT.credito.autorizacion} Solo en esta versión local; no se publica.` : "Sin reproducción: no hay licencia.",
    },
    {
      slug: "glenn",
      titulo: GLENN.titulo,
      autor: GLENN.autor,
      fecha: GLENN.fecha,
      coleccion: GLENN.ubicacion,
      imagen: glenn
        ? `${OBRA_GLENN.credito.imagen} ${OBRA_GLENN.credito.pie}`
        : "La pintura no se muestra. En su lugar, un muro de hojas de MANIFESTO rotulado como tal.",
      derechos: `${DERECHOS_GLENN.credito} Protegida hasta el ${DERECHOS_GLENN.hasta}.`,
      situacion: glenn ? `${OBRA_GLENN.credito.autorizacion} Solo en esta versión local; no se publica.` : "Sin reproducción: no hay licencia.",
    },
  ];

  return (
    <div className="mf-theme theme-selector">
      <ConceptHeader />
      <main className="al">
        <header className="al-cab">
          <p className="al-k">MANIFESTO · Enciclopedia digital de arte</p>
          <h1 className="al-t">Aviso legal y derechos de reproducción</h1>
          <p className="al-fecha">Última actualización: {ACTUALIZACION}</p>
          {DATOS_PENDIENTES ? (
            <p className="al-aviso" role="note">
              Faltan {DATOS_PENDIENTES} datos del responsable editorial, marcados como pendientes de confirmar.
            </p>
          ) : null}
        </header>

        <div className="al-cuerpo">
          <nav className="al-indice" aria-labelledby="al-indice-t">
            <h2 id="al-indice-t" className="al-indice__t">
              Índice
            </h2>
            <ol>
              {SECCIONES_AVISO.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="al-indice__n">{s.n}</span> {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="al-texto">
            <section id="naturaleza" aria-labelledby="naturaleza-t">
              <h2 id="naturaleza-t">
                <span className="al-n">1</span> Naturaleza y finalidad del proyecto
              </h2>
              <p>
                MANIFESTO es un proyecto editorial y cultural de acceso gratuito, dedicado a la divulgación,
                contextualización, análisis e interpretación de obras de arte.
              </p>
              <p>
                Su finalidad es informativa, educativa y enciclopédica. El acceso al contenido no requiere pagos ni
                suscripciones, y el proyecto no incorpora publicidad ni comercializa reproducciones de las obras presentadas.
              </p>
            </section>

            <section id="titularidad" aria-labelledby="titularidad-t">
              <h2 id="titularidad-t">
                <span className="al-n">2</span> Obras de arte y titularidad de derechos
              </h2>
              <p>Las obras artísticas presentadas en MANIFESTO pertenecen a sus respectivos autores o titulares de derechos.</p>
              <p>
                La inclusión de una obra, su fotografía o su reproducción digital no implica que MANIFESTO sea propietario de
                ella, que represente a su autor o que mantenga una relación oficial con sus titulares.
              </p>
              <p>
                Cada ficha artística identifica, en la medida de la información documental disponible, el autor, el título,
                la fecha, la técnica, la colección, la procedencia de la imagen y los créditos pertinentes.
              </p>
            </section>

            <section id="reproducciones" aria-labelledby="reproducciones-t">
              <h2 id="reproducciones-t">
                <span className="al-n">3</span> Uso editorial y educativo de las reproducciones
              </h2>
              <p>
                Las imágenes se utilizan como apoyo al estudio de la historia del arte, la composición, la técnica y las
                interpretaciones de cada obra.
              </p>
              <p>
                MANIFESTO distingue entre reproducciones documentales, materiales empleados bajo licencia o autorización,
                obras de dominio público y recursos cuyo uso pueda fundamentarse en una excepción legal aplicable.
              </p>
              <p>
                Cuando una reproducción se utilice sin licencia expresa, ello no debe interpretarse como una autorización
                concedida por el titular. La eventual aplicación de una excepción legal requiere un análisis específico de
                las circunstancias de uso.
              </p>
            </section>

            <section id="experiencias" aria-labelledby="experiencias-t">
              <h2 id="experiencias-t">
                <span className="al-n">4</span> Experiencias interactivas de MANIFESTO
              </h2>
              <p>
                Las ilustraciones, modelos tridimensionales, animaciones, diagramas y experiencias digitales creadas por
                MANIFESTO son recursos editoriales y didácticos propios, salvo indicación expresa en contrario.
              </p>
              <p>Estos elementos deben distinguirse de las obras auténticas y no atribuirse a sus autores originales.</p>
            </section>

            <section id="creditos" aria-labelledby="creditos-t">
              <h2 id="creditos-t">
                <span className="al-n">5</span> Créditos y fuentes
              </h2>
              <p>
                MANIFESTO procura identificar de manera clara los autores, las colecciones, los titulares de derechos
                conocidos y las fuentes documentales utilizadas.
              </p>
              <p>
                La mención de un museo, colección, agencia de licencias o institución no implica patrocinio, aprobación,
                colaboración ni autorización de reproducción.
              </p>
              <p>
                Los créditos de cada obra están en el <a href="#obras">anexo</a> y en el pie de su página; las fuentes,
                procedencia y condiciones de cada imagen, en el{" "}
                <a href={CREDITOS_URL} target="_blank" rel="noopener noreferrer">
                  registro de créditos del sitio
                </a>
                .
              </p>
            </section>

            <section id="reclamaciones" aria-labelledby="reclamaciones-t">
              <h2 id="reclamaciones-t">
                <span className="al-n">6</span> Consultas y reclamaciones de derechos
              </h2>
              <p>
                Los titulares de derechos o sus representantes pueden contactar al responsable editorial de MANIFESTO, en{" "}
                <Correo />, para comunicar errores de atribución, solicitar información sobre la utilización de materiales o
                presentar reclamaciones relacionadas con derechos de autor.
              </p>
              <p>Las comunicaciones deberán identificar, cuando sea posible:</p>
              <ul>
                <li>la obra o material afectado;</li>
                <li>la URL correspondiente;</li>
                <li>los derechos invocados;</li>
                <li>los datos de contacto del solicitante.</li>
              </ul>
              <p>
                MANIFESTO revisará las comunicaciones recibidas, comprobará la información disponible y adoptará las medidas
                que correspondan, incluida la corrección de créditos, la sustitución de materiales o su retirada cuando
                proceda.
              </p>
            </section>

            <section id="responsable" aria-labelledby="responsable-t">
              <h2 id="responsable-t">
                <span className="al-n">7</span> Responsable editorial
              </h2>
              <dl className="al-datos">
                <div>
                  <dt>Proyecto</dt>
                  <dd>MANIFESTO</dd>
                </div>
                <div>
                  <dt>Razón social</dt>
                  <dd>
                    <Dato d={RESPONSABLE.razonSocial} />
                  </dd>
                </div>
                <div>
                  <dt>NIT</dt>
                  <dd>
                    <Dato d={RESPONSABLE.nit} />
                  </dd>
                </div>
                <div>
                  <dt>País</dt>
                  <dd>
                    <Dato d={RESPONSABLE.pais} />
                  </dd>
                </div>
                <div>
                  <dt>Correo de contacto</dt>
                  <dd>
                    <Correo />
                  </dd>
                </div>
              </dl>
            </section>

            <section id="actualizacion" aria-labelledby="actualizacion-t">
              <h2 id="actualizacion-t">
                <span className="al-n">8</span> Actualización
              </h2>
              <p>
                Este aviso podrá actualizarse para reflejar cambios editoriales, normativos, técnicos o relativos a los
                derechos de los materiales utilizados.
              </p>
              <p>
                <strong>Última actualización:</strong> {ACTUALIZACION}.
              </p>
            </section>

            <section id="obras" aria-labelledby="obras-t" className="al-obras">
              <h2 id="obras-t">
                <span className="al-n">Anexo</span> Las cinco obras: créditos y situación
              </h2>
              <p>
                Cómo se presenta cada obra en esta versión del sitio. Un crédito identifica al autor y al titular de los
                derechos; no indica que MANIFESTO tenga una licencia.
              </p>
              {obras.map((o) => (
                <article key={o.slug} className="al-obra" aria-labelledby={`obra-${o.slug}`}>
                  <h3 id={`obra-${o.slug}`}>
                    <cite>{o.titulo}</cite>, {o.autor}, {o.fecha}
                  </h3>
                  <dl>
                    <div>
                      <dt>Colección</dt>
                      <dd>{o.coleccion}</dd>
                    </div>
                    <div>
                      <dt>Imagen en el sitio</dt>
                      <dd>{o.imagen}</dd>
                    </div>
                    <div>
                      <dt>Derechos</dt>
                      <dd>{o.derechos}</dd>
                    </div>
                    <div>
                      <dt>Situación</dt>
                      <dd>{o.situacion}</dd>
                    </div>
                  </dl>
                  <p className="al-obra__ir">
                    <Link href={`/conceptos/${o.slug}`}>
                      Ir a la obra y sus fuentes<span className="sr-only">: {o.titulo}</span>
                    </Link>
                  </p>
                </article>
              ))}
            </section>

            <p className="al-volver">
              <Link href={catalogo}>Volver a las cinco obras</Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
