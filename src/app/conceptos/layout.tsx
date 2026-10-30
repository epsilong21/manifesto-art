import { SiteFooter } from "@/components/concepts/ConceptChrome";
import { ProductoDeLaObra } from "@/components/concepts/ProductoDeLaObra";
import "./conceptos.css";

/**
 * Segmento /conceptos: comparte la identidad madre (MANIFESTO / Experimental Art Journal).
 * Bajo cada obra va la prenda de la tienda inspirada en ella y, al final, el pie de la marca, fuera del universo de la obra.
 */
export default function ConceptosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProductoDeLaObra />
      <SiteFooter />
    </>
  );
}
