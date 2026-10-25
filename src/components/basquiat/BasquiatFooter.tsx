import { ConceptFooter } from "@/components/concepts/ConceptChrome";
import { DERECHOS_BASQUIAT, FUENTES_BASQUIAT, OBRA_BASQUIAT } from "@/content/basquiat";

/** Pie de Basquiat: el común de las obras («Siguiente obra», fuentes, derechos) con su texto de derechos. */
export function BasquiatFooter({ conImagen }: { conImagen: boolean }) {
  const { credito } = OBRA_BASQUIAT;
  return (
    <ConceptFooter
      current="basquiat-untitled"
      sources={FUENTES_BASQUIAT}
      rights={
        <>
          <p>
            {credito.obra} {DERECHOS_BASQUIAT.credito} Obra protegida por derechos de autor hasta el{" "}
            {DERECHOS_BASQUIAT.hasta}.
          </p>
          <p>
            {conImagen
              ? `${credito.imagen} ${credito.autorizacion} ${credito.pie}`
              : "La reproducción de la pintura está pendiente de autorización y no se muestra."}
          </p>
          <p>
            La tipografía, la lámina, las cotas y los rótulos son de MANIFESTO. No reproducen ni imitan la
            escritura ni los signos de Basquiat.
          </p>
        </>
      }
    />
  );
}
