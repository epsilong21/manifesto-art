import Link from "next/link";
import { ObrasMenu } from "@/components/concepts/ObrasMenu";
import { CONCEPTOS, type Concepto } from "@/content/conceptos";

/** Publicación simplificada: el selector es la entrada, no hay otra portada. */
const ENTRADA_SELECTOR = process.env.NEXT_PUBLIC_MANIFESTO_ENTRADA === "selector";

/** Logotipo de la identidad madre: grotesca ancha frente a la tipografía de cada universo. */
export function ManifestoMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} prefetch={false} className="mf-mark">
      <span className="mf-mark__word">MANIFESTO</span>
      <span className="mf-mark__sub">Experimental Art Journal</span>
      <span className="sr-only">, ir a la portada</span>
    </Link>
  );
}

/** Datos de contacto de la marca (los mismos de la tienda). */
const CONTACTO = {
  direccion: "Cl. 20 #101A-37, Cañasgordas, Cali, Valle del Cauca",
  telefono: "+57 317 308 6100",
  tel: "+573173086100",
  email: "manifesto.msto@gmail.com",
  instagram: "https://www.instagram.com/manifesto_msto",
  instagramUsuario: "@manifesto_msto",
};

/** Barra de anuncio con marquesina y barra de contacto, como en la cabecera de la tienda. */
export function MarcaBarras() {
  const anuncio = (
    <>
      <span>
        Envíos <b>Gratis</b> a Colombia
      </span>
      <span aria-hidden="true">|</span>
      <span>Pago Contraentrega</span>
      <span aria-hidden="true">|</span>
    </>
  );
  return (
    <>
      <div className="mf-aviso">
        <div className="mf-aviso__pista">
          <div className="mf-aviso__tanda">{anuncio}{anuncio}{anuncio}</div>
          <div className="mf-aviso__tanda" aria-hidden="true">{anuncio}{anuncio}{anuncio}</div>
        </div>
      </div>
      <div className="mf-topbar">
        <a href={`tel:${CONTACTO.tel}`}>{CONTACTO.telefono}</a>
        <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>
      </div>
    </>
  );
}

/**
 * Cabecera común de la marca: barras superiores, logotipo, menú de la tienda y selector de obras con la
 * obra actual. Va encima de cada página, fuera del universo de la obra.
 */
export function ConceptHeader({ actual }: { actual?: Concepto["slug"] }) {
  return (
    <>
      <MarcaBarras />
      <header className="mf-header mf-header--marca">
        <ManifestoMark />
        <nav className="mf-nav" aria-label="Principal">
          <Link href="/" prefetch={false}>Inicio</Link>
          <Link href="/conceptos" prefetch={false}>Exposición</Link>
          <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
        </nav>
        <ObrasMenu actual={actual} />
      </header>
    </>
  );
}

type Source = { label: string; href: string };

export function ConceptFooter({
  current,
  sources,
  rights,
}: {
  current: Concepto["slug"];
  sources: Source[];
  rights: React.ReactNode;
}) {
  const i = CONCEPTOS.findIndex((c) => c.slug === current);
  const next = CONCEPTOS[(i + 1) % CONCEPTOS.length];
  const relacionada = CONCEPTOS.find((c) => c.slug === CONCEPTOS[i].relacionada);
  return (
    <footer className="mf-footer">
      <Link href={`/conceptos/${next.slug}`} className="mf-footer__next">
        <span className="mf-footer__label">
          Siguiente obra · {next.numero} / {String(CONCEPTOS.length).padStart(2, "0")}
        </span>
        <span className="mf-footer__title">{next.titulo}</span>
        <span className="mf-footer__meta">
          {next.autor}, {next.anio}
          {relacionada?.slug === next.slug ? " · obra relacionada" : null}
        </span>
      </Link>
      {relacionada && relacionada.slug !== next.slug ? (
        <p className="mf-footer__rel">
          <span className="mf-footer__label">
            Obra relacionada · {relacionada.numero} / {String(CONCEPTOS.length).padStart(2, "0")}
          </span>{" "}
          <Link href={`/conceptos/${relacionada.slug}`}>
            {relacionada.titulo}, {relacionada.autor}, {relacionada.anio}
          </Link>
        </p>
      ) : null}

      <div className="mf-footer__cols">
        <div>
          <h2 className="mf-footer__h">Fuentes</h2>
          <ul>
            {sources.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mf-footer__h">Imagen y derechos</h2>
          <div className="mf-footer__rights">{rights}</div>
          <ul>
            <li>
              <Link href="/aviso-legal">Aviso legal y derechos de reproducción</Link>
            </li>
            <li>
              <Link href="/politica-de-privacidad">Política de tratamiento de datos personales</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mf-footer__h">MANIFESTO</h2>
          <ul>
            <li>
              <Link href={ENTRADA_SELECTOR ? "/" : "/conceptos"} prefetch={false}>Diez obras, diez universos</Link>
            </li>
            {ENTRADA_SELECTOR ? null : (
              <li>
                <Link href="/" prefetch={false}>Portada</Link>
              </li>
            )}
          </ul>
          <p className="mf-footer__note">Plataforma cultural y educativa. No es una tienda.</p>
        </div>
      </div>
    </footer>
  );
}

/** Fuera de una publicación, el catálogo y la portada muestran la reproducción de referencia de las obras protegidas (src/lib/miniaturas.ts) */
const PUBLICACION = process.env.MANIFESTO_PUBLICACION === "1";

/** Pie de la portada, del catálogo y de las páginas legales: tres columnas y franja inferior, como el de la tienda. */
export function SiteFooter() {
  return (
    <footer className="mf-sitefoot">
      <div className="mf-sitefoot__cols">
        <div>
          <h2 className="mf-sitefoot__h">Contacto</h2>
          <address>
            <p><span>Dirección:</span> {CONTACTO.direccion}</p>
            <p><span>Tel:</span> <a href={`tel:${CONTACTO.tel}`}>{CONTACTO.telefono}</a></p>
            <p><span>Email:</span> <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a></p>
            <p><span>Instagram:</span> <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer">{CONTACTO.instagramUsuario}</a></p>
          </address>
        </div>
        <div>
          <h2 className="mf-sitefoot__h">Políticas</h2>
          <ul>
            <li><Link href="/aviso-legal">Aviso legal y derechos de reproducción</Link></li>
            <li><Link href="/politica-de-privacidad">Política de tratamiento de datos personales</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mf-sitefoot__h">
            <span className="mf-mark__word">MANIFESTO</span>
          </h2>
          <p>Plataforma cultural y educativa sobre historia del arte. No es una tienda.</p>
        </div>
      </div>
      <div className="mf-sitefoot__base">
        <p className="mf-sitefoot__copy">Copyright © 2026 MANIFESTO. Todos los derechos reservados.</p>
        <p className="mf-sitefoot__img">
          Las reproducciones de Medusa y La noche estrellada son de obras en dominio público; las de las obras 06 a 09, de pinturas
          antiguas cuyas condiciones de imagen figuran en cada página.{" "}
          {PUBLICACION
            ? "La imagen de Los elefantes es una composición gráfica de MANIFESTO, no la pintura de Dalí. Las de Untitled, Glenn y Cristo de San Juan de la Cruz reproducen obras protegidas sin licencia de reproducción."
            : "En esta versión local, las imágenes de Los elefantes, Untitled y Glenn son reproducciones sin licencia; en la versión publicada, la de Los elefantes es una composición gráfica de MANIFESTO."}
        </p>
      </div>
    </footer>
  );
}

/**
 * Etiqueta MANIFESTO: mezcla la cartela de museo y la etiqueta interior de una
 * prenda. Datos de la obra en pares clave/valor.
 */
export function Etiqueta({ rows, label = "Ficha de la obra" }: { rows: [string, string][]; label?: string }) {
  return (
    <dl className="mf-label" aria-label={label}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function KindTag({ tipo }: { tipo: "hecho" | "lectura" | "observacion" | "imaginacion" }) {
  const label = { hecho: "Documentado", lectura: "Interpretación", observacion: "Observación", imaginacion: "Imaginación" }[tipo];
  return (
    <span className="mf-kind" data-kind={tipo}>
      {label}
    </span>
  );
}
