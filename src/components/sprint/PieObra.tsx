import Link from "next/link";
import { CONCEPTOS, type Concepto } from "@/content/conceptos";

type Fuente = { label: string; href: string };

/** Créditos, procedencia de la reproducción, fuentes y paso a la obra siguiente. Común a las páginas 06–10. */
export function PieObra({ actual, imagen, nota, fuentes }: { actual: Concepto["slug"]; imagen: string; nota: string; fuentes: Fuente[] }) {
  const i = CONCEPTOS.findIndex((c) => c.slug === actual);
  const next = CONCEPTOS[(i + 1) % CONCEPTOS.length];
  return (
    <footer className="mf-footer">
      <Link href={`/conceptos/${next.slug}`} className="mf-footer__next">
        <span className="mf-footer__label">
          Siguiente obra · {next.numero} / {String(CONCEPTOS.length).padStart(2, "0")}
        </span>
        <span className="mf-footer__title">{next.titulo}</span>
        <span className="mf-footer__meta">
          {next.autor}, {next.anio}
        </span>
      </Link>
      <div className="mf-footer__cols">
        <div>
          <h2 className="mf-footer__h">Procedencia de la imagen</h2>
          <div className="mf-footer__rights">
            <p>{imagen}</p>
            <p>{nota}</p>
          </div>
        </div>
        <div>
          <h2 className="mf-footer__h">Fuentes</h2>
          <ul>
            {fuentes.map((f) => (
              <li key={f.href}>
                <a href={f.href} target="_blank" rel="noopener noreferrer">{f.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mf-footer__h">MANIFESTO</h2>
          <ul>
            <li><Link href="/conceptos">Todas las obras</Link></li>
            <li><Link href="/aviso-legal">Aviso legal</Link></li>
            <li><Link href="/politica-de-privacidad">Política de privacidad</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
