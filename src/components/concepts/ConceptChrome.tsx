import Link from "next/link";
import { ObrasMenu } from "@/components/concepts/ObrasMenu";
import { CONCEPTOS, type Concepto } from "@/content/conceptos";

/** Publicación simplificada: el selector es la entrada, no hay otra portada. */
const ENTRADA_SELECTOR = process.env.NEXT_PUBLIC_MANIFESTO_ENTRADA === "selector";

/** Logotipo de la identidad madre: grotesca ancha frente a la tipografía de cada universo. */
export function ManifestoMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="mf-mark">
      <span className="mf-mark__word">MANIFESTO</span>
      <span className="mf-mark__sub">Experimental Art Journal</span>
      <span className="sr-only">, ir a la portada</span>
    </Link>
  );
}

/** Cabecera común: marca (a la portada) y selector de obras con la obra actual. */
export function ConceptHeader({ actual }: { actual?: Concepto["slug"] }) {
  return (
    <header className="mf-header">
      <ManifestoMark />
      <ObrasMenu actual={actual} />
    </header>
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
          Siguiente obra · {next.numero} / 0{CONCEPTOS.length}
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
            Obra relacionada · {relacionada.numero} / 0{CONCEPTOS.length}
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
          <Link href="/aviso-legal">Aviso legal y derechos de reproducción</Link>
        </div>
        <div>
          <h2 className="mf-footer__h">MANIFESTO</h2>
          <ul>
            <li>
              <Link href={ENTRADA_SELECTOR ? "/" : "/conceptos"}>Cinco obras, cinco universos</Link>
            </li>
            {ENTRADA_SELECTOR ? null : (
              <li>
                <Link href="/">Portada</Link>
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

/** Pie breve de la portada, del catálogo y del aviso legal. */
export function SiteFooter() {
  return (
    <footer className="mf-sitefoot">
      <p>
        <span className="mf-mark__word">MANIFESTO</span> Plataforma cultural y educativa sobre historia del
        arte. No es una tienda.
      </p>
      <p>
        Las reproducciones de Caravaggio y Van Gogh son de obras en dominio público.{" "}
        {PUBLICACION
          ? "Las imágenes de Los elefantes, Untitled y Glenn son composiciones gráficas de MANIFESTO, no las pinturas de Dalí y Basquiat."
          : "En esta versión local, las imágenes de Los elefantes, Untitled y Glenn son reproducciones de referencia sin licencia; en la versión publicada son composiciones gráficas de MANIFESTO."}
      </p>
      <p className="mf-sitefoot__legal">
        <Link href="/aviso-legal">Aviso legal y derechos de reproducción</Link>
      </p>
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
