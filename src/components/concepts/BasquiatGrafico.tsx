/**
 * Composición tipográfica propia de MANIFESTO para Untitled (Basquiat), la misma de
 * su imagen Open Graph: una lámina vacía con marcas de registro y las tres lecturas
 * de la experiencia, cada una con su trazo. No reproduce ni imita la pintura, ni la
 * escritura ni los signos de Basquiat. Necesita la variable de Bricolage en la página.
 */
export function BasquiatGrafico({ className }: { className?: string }) {
  return (
    <div className={`bqg ${className ?? ""}`} aria-hidden="true">
      <div className="bqg__lamina">
        <span className="bqg__lectura" data-l="craneo">
          Cráneo
        </span>
        <span className="bqg__lectura" data-l="rostro">
          Rostro
        </span>
        <span className="bqg__lectura" data-l="mascara">
          Máscara
        </span>
      </div>
    </div>
  );
}
