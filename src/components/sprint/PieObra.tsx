import Link from "next/link";

type Fuente = { label: string; href: string };

/** Créditos, procedencia de la reproducción y fuentes. Común a las páginas 06–09. */
export function PieObra({ imagen, nota, fuentes }: { imagen: string; nota: string; fuentes: Fuente[] }) {
  return (
    <footer className="mf-footer">
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
          </ul>
        </div>
      </div>
    </footer>
  );
}
