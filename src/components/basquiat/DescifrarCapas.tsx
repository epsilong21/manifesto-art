import { OBRA_BASQUIAT } from "@/content/basquiat";
import { CapasObra } from "./CapasObra";
import { CapasTexto } from "./CapasTexto";
import { LaboratorioAcetatos } from "./LaboratorioAcetatos";

/** El mismo `sizes` que la lámina del hero: el navegador reutiliza la variante ya descargada. */
const SIZES = "(min-width: 64rem) 50vw, (orientation: landscape) 70vh, 100vw";

/**
 * Sección 01 · Descifrar capas. Con reproducción, las capas sobre la pintura (CapasObra);
 * sin ella, el laboratorio de acetatos sobre el esquema propio de MANIFESTO.
 * Sin JavaScript, en los dos casos, la versión de texto.
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
        <>
          <CapasObra src={imagen.src} width={imagen.width} height={imagen.height} alt={alt} sizes={SIZES} />
          {/* Sin JavaScript las capas no se pueden encender: se leen como texto */}
          <noscript>
            <style>{".bq-mesa{display:none}"}</style>
            <CapasTexto />
          </noscript>
        </>
      ) : (
        <>
          <LaboratorioAcetatos />
          <noscript>
            <style>{".bq-lab__mandos{display:none}"}</style>
            <CapasTexto sinObra />
          </noscript>
        </>
      )}
    </section>
  );
}
