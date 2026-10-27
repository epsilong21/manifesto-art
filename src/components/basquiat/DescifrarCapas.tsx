import { OBRA_BASQUIAT } from "@/content/basquiat";
import { CapasObra } from "./CapasObra";
import { CapasTexto } from "./CapasTexto";
import { LaboratorioAcetatos } from "./LaboratorioAcetatos";
import { ModosCapas } from "./ModosCapas";

/** El mismo `sizes` que la lámina del hero: el navegador reutiliza la variante ya descargada. */
const SIZES = "(min-width: 64rem) 50vw, (orientation: landscape) 70vh, 100vw";

/**
 * Sección 01 · Descifrar capas. El laboratorio de acetatos (modelo original de
 * MANIFESTO) está siempre: la reproducción no decide si existe. Con reproducción
 * se suma, en otra pestaña (ModosCapas), la herramienta documental: las capas e
 * inspector sobre la pintura (CapasObra). Sin JavaScript, la versión de texto.
 */
export function DescifrarCapas({ conImagen }: { conImagen: boolean }) {
  const { imagen, alt } = OBRA_BASQUIAT;
  return (
    <section id="capas" className="bq-capas" aria-labelledby="bq-capas-t">
      <header className="bq-capas__head">
        <p className="bq-capas__k" aria-hidden="true">
          01 · Descifrar capas
        </p>
        <h2 id="bq-capas-t" className="bq-capas__t">
          Dentro de la cabeza
        </h2>
        <p className="bq-capas__intro">
          Cuatro capas, cuatro maneras de mirar la misma cabeza. Enciéndelas en cualquier orden y combínalas: cada una
          señala lo que sostiene su lectura.
        </p>
      </header>
      {conImagen ? (
        <ModosCapas
          modelo={<LaboratorioAcetatos />}
          pintura={<CapasObra src={imagen.src} width={imagen.width} height={imagen.height} alt={alt} sizes={SIZES} />}
        />
      ) : (
        <LaboratorioAcetatos />
      )}
      {/* Sin JavaScript ni las capas ni las pestañas responden: se leen como texto */}
      <noscript>
        <style>{".bq-lab__mandos,.bq-modos__tabs{display:none}"}</style>
        <CapasTexto sinObra={!conImagen} />
      </noscript>
    </section>
  );
}
