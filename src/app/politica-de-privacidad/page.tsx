import type { Metadata } from "next";
import Link from "next/link";
import { ConceptHeader, SiteFooter } from "@/components/concepts/ConceptChrome";
import { CONTACTO_LEGAL, RESPONSABLE, TELEFONO_HREF } from "@/content/aviso-legal";
import { AREA_ATENCION, ENTRADA_EN_VIGENCIA, PROVEEDORES, SECCIONES_POLITICA } from "@/content/politica-privacidad";
import "../conceptos/conceptos.css";
import "../aviso-legal/aviso-legal.css";
import "./politica-privacidad.css";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales — MANIFESTO",
  description:
    "Qué datos personales trata MANIFESTO S.A.S., con qué finalidad, qué proveedores intervienen y cómo ejercer los derechos de conocer, actualizar, rectificar y suprimir los datos.",
  alternates: { canonical: "/politica-de-privacidad" },
};

/** Publicación simplificada: el catálogo es la entrada (como en ConceptFooter) */
const ENTRADA_SELECTOR = process.env.NEXT_PUBLIC_MANIFESTO_ENTRADA === "selector";

/** Un dato del responsable: su valor confirmado o, si falta, el aviso de que está pendiente */
function Dato({ d }: { d: { valor: string | null; pendiente: string } }) {
  if (d.valor === null) return <mark className="al-pendiente">[Pendiente de confirmar: {d.pendiente}]</mark>;
  return <>{d.valor}</>;
}

/** El teléfono del responsable, con su enlace tel (o el aviso de pendiente) */
function Telefono() {
  if (!TELEFONO_HREF) return <Dato d={RESPONSABLE.telefono} />;
  return <a href={TELEFONO_HREF}>{RESPONSABLE.telefono.valor}</a>;
}

/** El correo de contacto legal (CONTACTO_LEGAL), con su enlace mailto */
function Correo() {
  return <a href={`mailto:${CONTACTO_LEGAL.correo}`}>{CONTACTO_LEGAL.correo}</a>;
}

/** Enlace externo a la fuente que respalda lo dicho sobre un proveedor */
function Fuente({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/**
 * Política de tratamiento de datos personales (Ley 1581 de 2012 y Decreto 1074 de 2015).
 * Describe el funcionamiento real del sitio (src/content/politica-privacidad.ts).
 */
export default function PoliticaPrivacidadPage() {
  const catalogo = ENTRADA_SELECTOR ? "/" : "/conceptos";

  return (
    <div className="mf-theme theme-selector">
      <ConceptHeader />
      <main className="al">
        <header className="al-cab">
          <p className="al-k">MANIFESTO · Enciclopedia digital de arte</p>
          <h1 className="al-t">Política de tratamiento de datos personales</h1>
          <p className="al-fecha">Entrada en vigencia: {ENTRADA_EN_VIGENCIA}</p>
        </header>

        <div className="al-cuerpo">
          <nav className="al-indice" aria-labelledby="al-indice-t">
            <h2 id="al-indice-t" className="al-indice__t">
              Índice
            </h2>
            <ol>
              {SECCIONES_POLITICA.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="al-indice__n">{s.n}</span> {s.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="al-texto">
            <section id="responsable" aria-labelledby="responsable-t">
              <h2 id="responsable-t">
                <span className="al-n">1</span> Responsable del tratamiento
              </h2>
              <dl className="al-datos">
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
                  <dt>Dirección de contacto</dt>
                  <dd>
                    <Dato d={RESPONSABLE.direccion} />
                  </dd>
                </div>
                <div>
                  <dt>Teléfono</dt>
                  <dd>
                    <Telefono />
                  </dd>
                </div>
                <div>
                  <dt>Correo electrónico</dt>
                  <dd>
                    <Correo />
                  </dd>
                </div>
              </dl>
            </section>

            <section id="marco" aria-labelledby="marco-t">
              <h2 id="marco-t">
                <span className="al-n">2</span> Alcance y marco normativo
              </h2>
              <p>
                Esta política explica cómo MANIFESTO S.A.S. trata los datos personales que recibe en relación con
                MANIFESTO, enciclopedia digital de arte de acceso gratuito.
              </p>
              <p>
                Se adopta conforme a la Ley Estatutaria 1581 de 2012, de protección de datos personales, y al Decreto 1074
                de 2015, que compila su reglamentación (Decreto 1377 de 2013).
              </p>
            </section>

            <section id="datos" aria-labelledby="datos-t">
              <h2 id="datos-t">
                <span className="al-n">3</span> Qué datos trata MANIFESTO
              </h2>
              <p>Para consultar MANIFESTO no hace falta facilitar ningún dato personal. El sitio:</p>
              <ul>
                <li>no instala cookies propias ni guarda información en el navegador del visitante;</li>
                <li>no usa herramientas de analítica, píxeles de seguimiento ni publicidad;</li>
                <li>no tiene formularios de registro, cuentas de usuario ni suscripciones;</li>
                <li>no incrusta contenidos de terceros que se carguen al visitar sus páginas.</li>
              </ul>
              <p>
                MANIFESTO trata los datos personales que recibe por correo electrónico, cuando una persona le escribe para
                una consulta, para comunicar un error de atribución, para presentar una reclamación de derechos o para
                ejercer sus derechos sobre sus datos personales. Esos datos son, en general:
              </p>
              <ul>
                <li>el nombre y la dirección de correo electrónico del remitente;</li>
                <li>los datos de contacto y la condición en que actúa, cuando los indica;</li>
                <li>el contenido del mensaje y los documentos que adjunte.</li>
              </ul>
              <p>
                MANIFESTO no solicita datos sensibles ni datos de niñas, niños y adolescentes. Se ruega no incluirlos en
                las comunicaciones si no son imprescindibles para la solicitud.
              </p>
            </section>

            <section id="finalidades" aria-labelledby="finalidades-t">
              <h2 id="finalidades-t">
                <span className="al-n">4</span> Finalidades del tratamiento
              </h2>
              <p>Los datos recibidos se tratan únicamente para:</p>
              <ul>
                <li>
                  atender las consultas, las comunicaciones sobre errores de atribución y las reclamaciones de derechos
                  previstas en el <Link href="/aviso-legal">aviso legal</Link>;
                </li>
                <li>
                  revisar la información recibida y adoptar las medidas que correspondan, como la corrección de créditos, la
                  sustitución de materiales o su retirada;
                </li>
                <li>responder al remitente y dejar constancia del trámite y de su resolución;</li>
                <li>tramitar las consultas y reclamos sobre datos personales descritos en esta política;</li>
                <li>cumplir las obligaciones legales y los requerimientos de las autoridades competentes.</li>
              </ul>
              <p>
                MANIFESTO no usa estos datos para enviar comunicaciones comerciales ni los vende, alquila o cede a terceros.
              </p>
            </section>

            <section id="autorizacion" aria-labelledby="autorizacion-t">
              <h2 id="autorizacion-t">
                <span className="al-n">5</span> Autorización
              </h2>
              <p>
                Quien escribe a MANIFESTO facilita voluntariamente sus datos para que se atienda su comunicación. Esa
                conducta permite concluir de forma razonable que autoriza su tratamiento para las finalidades de la sección
                4, conforme al artículo 7 del Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015. En ningún caso el
                silencio se considera una autorización.
              </p>
              <p>
                El titular puede solicitar la supresión de sus datos o revocar la autorización en los términos de la
                sección 8.
              </p>
            </section>

            <section id="gestion" aria-labelledby="gestion-t">
              <h2 id="gestion-t">
                <span className="al-n">6</span> Cómo se gestionan y conservan
              </h2>
              <p>
                Las comunicaciones se reciben en el buzón <Correo />, una cuenta de Gmail: los mensajes y sus adjuntos se
                almacenan en ese servicio de correo (sección 7). Cada solicitud se registra internamente para hacer
                seguimiento del trámite. Las comunicaciones no se publican.
              </p>
              <p>
                MANIFESTO S.A.S. se compromete a tratar la información con las medidas técnicas, humanas y administrativas
                necesarias para evitar su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento, y a
                guardar reserva sobre ella.
              </p>
              <p>
                Las comunicaciones y los datos que contienen se conservan mientras sea necesario para gestionar la solicitud,
                cumplir obligaciones legales o atender reclamaciones relacionadas con ella. Cumplidas esas finalidades, se
                suprimen o, cuando proceda, se anonimizan. No se conservan indefinidamente.
              </p>
            </section>

            <section id="proveedores" aria-labelledby="proveedores-t">
              <h2 id="proveedores-t">
                <span className="al-n">7</span> Proveedores externos
              </h2>
              <p>MANIFESTO se apoya en dos servicios de terceros, cada uno sujeto a su propia política de privacidad:</p>
              <h3>GitHub Pages (GitHub, Inc.): alojamiento del sitio</h3>
              <p>
                Según la documentación de GitHub, cuando se visita un sitio de GitHub Pages la dirección IP del visitante se
                registra y almacena por motivos de seguridad, haya iniciado sesión en GitHub o no. Ese registro lo realiza
                GitHub; MANIFESTO no lo utiliza. Más información en la{" "}
                <Fuente href={PROVEEDORES.githubPages}>documentación de GitHub Pages</Fuente> y en la{" "}
                <Fuente href={PROVEEDORES.githubPrivacidad}>declaración de privacidad de GitHub</Fuente>.
              </p>
              <h3>Gmail (Google): correo electrónico</h3>
              <p>
                El correo <Correo /> es una cuenta de Gmail, el servicio de correo de Google. Los mensajes que se envían a
                MANIFESTO y sus respuestas, con sus adjuntos, se almacenan en ese servicio, y Google trata su contenido
                conforme a su <Fuente href={PROVEEDORES.googlePrivacidad}>política de privacidad</Fuente>.
              </p>
              <p>
                Ambos proveedores son empresas establecidas fuera de Colombia, por lo que los datos pueden tratarse fuera del
                país en los términos de sus políticas.
              </p>
              <p>
                Los enlaces de MANIFESTO a museos, archivos y otras fuentes llevan a sitios de terceros, que aplican sus
                propias políticas. Al visitar MANIFESTO no se carga ningún contenido de esos sitios.
              </p>
            </section>

            <section id="derechos" aria-labelledby="derechos-t">
              <h2 id="derechos-t">
                <span className="al-n">8</span> Derechos de los titulares
              </h2>
              <p>De acuerdo con el artículo 8 de la Ley 1581 de 2012, el titular de los datos personales tiene derecho a:</p>
              <ul>
                <li>conocer, actualizar y rectificar sus datos personales;</li>
                <li>solicitar prueba de la autorización otorgada, salvo cuando la ley no la exija;</li>
                <li>ser informado, previa solicitud, del uso que se ha dado a sus datos;</li>
                <li>
                  presentar ante la Superintendencia de Industria y Comercio quejas por infracciones a la ley, una vez agotado
                  el trámite de consulta o reclamo ante MANIFESTO;
                </li>
                <li>
                  revocar la autorización y solicitar la supresión del dato cuando en el tratamiento no se respeten los
                  principios, derechos y garantías constitucionales y legales;
                </li>
                <li>acceder en forma gratuita a sus datos personales que hayan sido objeto de tratamiento.</li>
              </ul>
            </section>

            <section id="atencion" aria-labelledby="atencion-t">
              <h2 id="atencion-t">
                <span className="al-n">9</span> Área responsable de la atención
              </h2>
              <p>
                Las peticiones, consultas y reclamos para ejercer los derechos de conocer, actualizar, rectificar y suprimir
                los datos y revocar la autorización se dirigen a:
              </p>
              <dl className="al-datos">
                <div>
                  <dt>Responsable de la atención</dt>
                  <dd>
                    {AREA_ATENCION}
                  </dd>
                </div>
                <div>
                  <dt>Canal</dt>
                  <dd>
                    <Correo />
                  </dd>
                </div>
              </dl>
            </section>

            <section id="procedimiento" aria-labelledby="procedimiento-t">
              <h2 id="procedimiento-t">
                <span className="al-n">10</span> Consultas y reclamos: procedimiento y plazos
              </h2>
              <p>
                Pueden presentarlos el titular o sus causahabientes, escribiendo a <Correo />. Los plazos son los de los
                artículos 14 y 15 de la Ley 1581 de 2012.
              </p>
              <h3>Consultas</h3>
              <p>
                Sirven para conocer la información personal del titular que conserve MANIFESTO. Se atienden en un máximo de
                diez (10) días hábiles desde su recepción. Si no es posible, se informará al interesado del motivo y de la
                nueva fecha, que no superará los cinco (5) días hábiles siguientes al vencimiento del primer plazo.
              </p>
              <h3>Reclamos</h3>
              <p>
                Proceden cuando el titular considere que sus datos deben corregirse, actualizarse o suprimirse, o advierta un
                presunto incumplimiento de la ley. El reclamo debe incluir la identificación del titular, la descripción de
                los hechos, la dirección de contacto y los documentos que quiera hacer valer.
              </p>
              <ol>
                <li>
                  Si el reclamo está incompleto, se pedirá al interesado que lo complete dentro de los cinco (5) días
                  siguientes a su recepción. Si pasan dos (2) meses desde ese requerimiento sin que aporte la información, se
                  entenderá que ha desistido.
                </li>
                <li>
                  Recibido el reclamo completo, se anotará como «reclamo en trámite», con su motivo, en un plazo no mayor a
                  dos (2) días hábiles, y la anotación se mantendrá hasta que se decida.
                </li>
                <li>
                  El reclamo se resolverá en un máximo de quince (15) días hábiles desde el día siguiente a su recepción. Si
                  no es posible, se informará al interesado del motivo y de la nueva fecha, que no superará los ocho (8) días
                  hábiles siguientes al vencimiento del primer plazo.
                </li>
              </ol>
              <p>
                Agotado este trámite, el titular puede acudir a la Superintendencia de Industria y Comercio (artículo 16 de
                la Ley 1581 de 2012).
              </p>
            </section>

            <section id="vigencia" aria-labelledby="vigencia-t">
              <h2 id="vigencia-t">
                <span className="al-n">11</span> Vigencia y cambios
              </h2>
              <p>
                Esta política entra en vigencia el {ENTRADA_EN_VIGENCIA}, fecha de su publicación.
              </p>
              <p>
                La base de datos de comunicaciones tendrá vigencia mientras existan finalidades legítimas que justifiquen su
                tratamiento. Esa vigencia no supone conservar indefinidamente cada mensaje: cada comunicación se conserva y
                se suprime según el criterio de la sección 6.
              </p>
              <p>
                Cualquier cambio sustancial en esta política se comunicará oportunamente, publicándolo en esta página antes
                de aplicarlo.
              </p>
              <p>
                Si MANIFESTO incorpora en el futuro cookies no esenciales, analítica u otros medios de recogida de datos,
                actualizará esta política y solicitará la autorización cuando corresponda.
              </p>
            </section>

            <p className="al-volver">
              <Link href={catalogo}>Volver a las obras</Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
