import Image from "next/image";
import Link from "next/link";
import { FijarCabecera } from "@/components/concepts/FijarCabecera";
import { ObrasMenu } from "@/components/concepts/ObrasMenu";
import type { Concepto } from "@/content/conceptos";

/** Logotipo oficial de MANIFESTO (blanco, el mismo de la tienda): va sobre la cabecera negra. */
export function ManifestoMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} prefetch={false} className="mf-mark">
      <Image
        src="/marca/logo-manifesto-blanco.png"
        alt="MANIFESTO"
        width={1297}
        height={228}
        sizes="(min-width: 64rem) 205px, 160px"
        priority
        className="mf-mark__logo"
      />
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
  tienda: "https://manifestocol.com",
  whatsapp: "https://wa.me/573173086100",
};

/** Anuncio negro con marquesina, como el de la tienda. */
export function BarraAnuncio() {
  const anuncio = (
    <span>
      Envíos <b>Gratis</b> a Colombia | Pago Contraentrega
    </span>
  );
  return (
    <div className="mf-aviso">
      <div className="mf-aviso__pista">
        <div className="mf-aviso__tanda">{anuncio}{anuncio}{anuncio}{anuncio}</div>
        <div className="mf-aviso__tanda" aria-hidden="true">{anuncio}{anuncio}{anuncio}{anuncio}</div>
      </div>
    </div>
  );
}

/** Icono de Instagram de la marca (enlace a su perfil). */
function InstagramIcono({ className }: { className?: string }) {
  return (
    <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer" className={className} aria-label="Instagram de MANIFESTO">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
    </a>
  );
}

/** Botón flotante de WhatsApp de la tienda. Solo en las páginas propias de la marca, nunca sobre una obra. */
export function WhatsAppFlotante() {
  return (
    <a href={CONTACTO.whatsapp} target="_blank" rel="noopener noreferrer" className="mf-wa" aria-label="Escribir a MANIFESTO por WhatsApp">
      <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.9L2 22l5.25-1.37A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.2 8.2 0 1 1 6.95 3.84Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.53.06a6.7 6.7 0 0 1-3.33-2.9c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.76-1.85-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.3-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.16 1.73 2.64 4.2 3.7 1.56.67 2.17.73 2.95.62.48-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.47-.28Z" />
      </svg>
    </a>
  );
}

/**
 * Cabecera común de la marca: anuncio negro y cabecera blanca con el menú de la tienda a la izquierda, el logotipo
 * al centro y el selector de obras a la derecha. Va encima de cada página, fuera del universo de la obra.
 * Con `superpuesta` (portada) es transparente sobre el hero y se vuelve blanca y fija al bajar.
 */
export function ConceptHeader({ actual, superpuesta = false }: { actual?: Concepto["slug"]; superpuesta?: boolean }) {
  return (
    <>
      <BarraAnuncio />
      {superpuesta ? <FijarCabecera /> : null}
      <header className={superpuesta ? "mf-header mf-header--marca mf-header--superpuesta" : "mf-header mf-header--marca"}>
        <nav className="mf-nav" aria-label="Principal">
          <Link href="/" prefetch={false}>Inicio</Link>
          <Link href="/conceptos" prefetch={false}>Exposición</Link>
          <a href={CONTACTO.tienda} target="_blank" rel="noopener noreferrer">Tienda</a>
        </nav>
        <ManifestoMark />
        <div className="mf-acciones">
          <ObrasMenu actual={actual} />
          <InstagramIcono className="mf-ig" />
        </div>
      </header>
    </>
  );
}

type Source = { label: string; href: string };

/**
 * Fuentes y derechos de una obra, con el estilo de la marca (fondo blanco). El paso a la obra siguiente y a la
 * relacionada no va aquí: lo pinta `SiguienteObra` desde el layout de /conceptos, igual en las diez obras.
 */
export function ConceptFooter({ sources, rights }: { sources: Source[]; rights: React.ReactNode }) {
  return (
    <footer className="mf-footer">
      <h2 className="mf-footer__t">
        <span>Fuentes y derechos</span>
      </h2>
      <div className="mf-footer__cols">
        <div>
          <h3 className="mf-footer__h">Imagen y derechos</h3>
          <div className="mf-footer__rights">{rights}</div>
        </div>
        <div>
          <h3 className="mf-footer__h">Fuentes</h3>
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
      </div>
    </footer>
  );
}

/** Fuera de una publicación, el catálogo y la portada muestran la reproducción de referencia de las obras protegidas (src/lib/miniaturas.ts) */
const PUBLICACION = process.env.MANIFESTO_PUBLICACION === "1";

/** Pie de la portada, del catálogo y de las obras (igual que el de la tienda): contacto, políticas y la marca. */
export function SiteFooter() {
  return (
    <footer className="mf-sitefoot">
      <div className="mf-sitefoot__cols">
        <address>
          <p><span>Dirección :</span> {CONTACTO.direccion}</p>
          <p><span>Tel:</span> <a href={`tel:${CONTACTO.tel}`}>{CONTACTO.telefono}</a></p>
          <p><span>Email:</span> <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a></p>
          <p><span>Instagram:</span> <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer">{CONTACTO.instagramUsuario}</a></p>
        </address>
        <ul>
          <li><Link href="/aviso-legal">Aviso legal y derechos de reproducción</Link></li>
          <li><Link href="/politica-de-privacidad">Política de tratamiento de datos personales</Link></li>
          <li><a href={CONTACTO.tienda} target="_blank" rel="noopener noreferrer">Tienda MANIFESTO</a></li>
        </ul>
        <div>
          <h2 className="mf-sitefoot__h">MANIFESTO</h2>
          <p>Plataforma cultural y educativa sobre historia del arte. No es una tienda.</p>
          <div className="mf-sitefoot__social">
            <InstagramIcono />
          </div>
        </div>
      </div>
      <div className="mf-sitefoot__base">
        <div>
          <p className="mf-sitefoot__copy">Copyright © 2026 MANIFESTO. Todos los derechos reservados.</p>
          <p className="mf-sitefoot__img">
            Las reproducciones de Medusa y La noche estrellada son de obras en dominio público; las de las obras 06 a 09, de pinturas
            antiguas cuyas condiciones de imagen figuran en cada página.{" "}
            {PUBLICACION
              ? "La imagen de Los elefantes es una composición gráfica de MANIFESTO, no la pintura de Dalí. Las de Untitled, Glenn y Cristo de San Juan de la Cruz reproducen obras protegidas sin licencia de reproducción."
              : "En esta versión local, las imágenes de Los elefantes, Untitled y Glenn son reproducciones sin licencia; en la versión publicada, la de Los elefantes es una composición gráfica de MANIFESTO."}
          </p>
        </div>
        <Image
          src="/marca/logo-manifesto-blanco.png"
          alt="MANIFESTO"
          width={1297}
          height={228}
          sizes="200px"
          className="mf-sitefoot__logo"
        />
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
