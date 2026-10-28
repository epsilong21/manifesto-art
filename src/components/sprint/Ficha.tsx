/** Separa siempre «Documentado» de «Interpretación». Común a las páginas 06–09. */
export function Ficha({ documentado, interpretacion }: { documentado: string[]; interpretacion: string[] }) {
  return (
    <section className="sp-ficha" aria-labelledby="sp-ficha-h">
      <h2 id="sp-ficha-h" className="sp-h2">La ficha</h2>
      <div className="sp-ficha__cols">
        <div>
          <h3 className="sp-tag sp-tag--doc">Documentado</h3>
          <ul>{documentado.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
        <div>
          <h3 className="sp-tag sp-tag--int">Interpretación</h3>
          <ul>{interpretacion.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}
