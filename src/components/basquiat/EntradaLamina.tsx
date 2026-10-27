import { BASQUIAT } from "@/content/basquiat";

/**
 * Entrada del hero (F1): una hoja protectora de carbón, con marcas de corte y el
 * rótulo de la lámina, cubre la obra y se levanta una vez (≈1,3 s). A la vez se
 * trazan el filete del rótulo y las cotas (ver basquiat-p5.css).
 *
 * - La pintura no se anima, no se mueve ni se fragmenta: solo se retira lo que tiene encima.
 *   Se pinta debajo desde el primer momento, así que el LCP no espera a la hoja.
 * - Solo CSS y transform: sin JavaScript se ve igual, sin saltos de layout. Con
 *   movimiento reducido no existe. No captura el puntero.
 */
export function EntradaLamina() {
  return (
    <div className="bq-entrada" aria-hidden="true">
      <div className="bq-entrada__hoja">
        <span className="bq-entrada__corte" data-esquina="no" />
        <span className="bq-entrada__corte" data-esquina="ne" />
        <span className="bq-entrada__corte" data-esquina="so" />
        <span className="bq-entrada__corte" data-esquina="se" />
        <p className="bq-entrada__rotulo">
          <span className="bq-entrada__k">Lám. I</span>
          <cite className="bq-entrada__t">{BASQUIAT.titulo}</cite>
          <span className="bq-entrada__k">{BASQUIAT.fecha}</span>
        </p>
      </div>
    </div>
  );
}
