/**
 * Composición propia de MANIFESTO para Glenn (Basquiat): una hoja apaisada con una
 * retícula de copias, una elipse vacía donde iría la máscara y las tres lecturas de la
 * experiencia. No reproduce ni imita la pintura, ni la escritura ni los signos de Basquiat.
 * Usa Archivo (global) y, si la página la carga, IBM Plex Mono.
 */
export function GlennGrafico({ className }: { className?: string }) {
  return (
    <div className={`glg ${className ?? ""}`} aria-hidden="true">
      <div className="glg__hoja">
        <span className="glg__mascara" />
        <span className="glg__lectura" data-l="retrato">
          Retrato
        </span>
        <span className="glg__lectura" data-l="mascara">
          Máscara
        </span>
        <span className="glg__lectura" data-l="archivo">
          Archivo
        </span>
        <span className="glg__luz" />
      </div>
    </div>
  );
}
