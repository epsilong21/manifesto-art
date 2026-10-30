import { SiteFooter } from "@/components/concepts/ConceptChrome";
import { ProductoDeLaObra } from "@/components/concepts/ProductoDeLaObra";
import { SiguienteObra } from "@/components/concepts/SiguienteObra";
import { ImagenObra } from "@/components/museo/ImagenObra";
import { CONCEPTOS } from "@/content/conceptos";
import "./conceptos.css";

/** Una lámina por obra, ya pintada en el servidor: `SiguienteObra` elige cuáles mostrar según la ruta. */
const LAMINAS = Object.fromEntries(
  CONCEPTOS.map((c) => [c.slug, <ImagenObra key={c.slug} slug={c.slug} uid={`sg-${c.slug}`} sizes="(min-width: 48rem) 20rem, 90vw" />]),
);

/**
 * Segmento /conceptos: comparte la identidad madre (MANIFESTO / Experimental Art Journal).
 * Bajo cada obra van la prenda de la tienda inspirada en ella, la obra siguiente y, al final, el pie de la marca,
 * fuera del universo de la obra.
 */
export default function ConceptosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProductoDeLaObra />
      <SiguienteObra laminas={LAMINAS} />
      <SiteFooter />
    </>
  );
}
