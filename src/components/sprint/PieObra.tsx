import { ConceptFooter } from "@/components/concepts/ConceptChrome";

type Fuente = { label: string; href: string };

/** Créditos, procedencia de la reproducción y fuentes. Común a las páginas 06–10; el paso a otra obra lo pone el layout. */
export function PieObra({ imagen, nota, fuentes }: { imagen: string; nota: string; fuentes: Fuente[] }) {
  return (
    <ConceptFooter
      sources={fuentes}
      rights={
        <>
          <p>{imagen}</p>
          <p>{nota}</p>
        </>
      }
    />
  );
}
