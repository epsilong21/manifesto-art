import { ConceptFooter } from "@/components/concepts/ConceptChrome";
import { DERECHOS_GLENN, FUENTES_GLENN, OBRA_GLENN } from "@/content/glenn";

/** Pie de Glenn: el común de las obras («Siguiente obra», fuentes, derechos) con su texto de derechos. */
export function GlennFooter({ conImagen }: { conImagen: boolean }) {
  const { credito } = OBRA_GLENN;
  return (
    <ConceptFooter
      current="glenn"
      sources={FUENTES_GLENN}
      rights={
        <>
          <p>
            {credito.obra} {DERECHOS_GLENN.credito} Obra protegida por derechos de autor hasta el {DERECHOS_GLENN.hasta}.
          </p>
          <p>
            {conImagen
              ? `${credito.imagen} ${credito.autorizacion} ${credito.pie}`
              : "La reproducción de la pintura está pendiente de autorización y no se muestra. El esquema de la lámina es de MANIFESTO."}
          </p>
          <p>
            La tipografía, la lámina, las cotas, los puntos, las capas y el filtro de fotocopia son de MANIFESTO. No
            reproducen ni imitan la escritura ni los signos de Basquiat.
          </p>
        </>
      }
    />
  );
}
