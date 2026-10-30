import { SiteFooter } from "@/components/concepts/ConceptChrome";
import "./conceptos.css";

/**
 * Segmento /conceptos: comparte la identidad madre (MANIFESTO / Experimental Art Journal).
 * El pie de la marca cierra el catálogo y cada obra, fuera del universo de la obra.
 */
export default function ConceptosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
