"use client";

import { usePathname } from "next/navigation";
import { CONCEPTOS } from "@/content/conceptos";
import { PRODUCTOS, imagenProducto, urlProducto } from "@/content/tienda";

/**
 * Banda bajo cada obra: la prenda de la tienda de MANIFESTO inspirada en ella. Se decide por la ruta, así queda fuera
 * del universo de la obra y no hay que tocar ninguna de sus páginas. En el catálogo no aparece.
 */
export function ProductoDeLaObra() {
  const ruta = usePathname() ?? "";
  const slug = ruta.split("/").filter(Boolean).pop() ?? "";
  const producto = PRODUCTOS[slug];
  const obra = CONCEPTOS.find((c) => c.slug === slug);
  if (!producto || !obra) return null;

  return (
    <section className="mf-prod" aria-labelledby="mf-prod-t">
      <div className="mf-prod__in">
        <a className="mf-prod__img" href={urlProducto(producto.handle)} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
          {/* Imagen del CDN de la tienda: no pasa por el optimizador de next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagenProducto(producto.imagen, 640)} alt="" width={640} height={960} loading="lazy" decoding="async" />
        </a>
        <div className="mf-prod__txt">
          <p className="mf-prod__k">En la tienda MANIFESTO</p>
          <h2 id="mf-prod-t" className="mf-prod__t">{producto.titulo}</h2>
          <p className="mf-prod__p">
            {obra.titulo}, de {obra.autor}, también vive en una prenda de MANIFESTO.
          </p>
          <a className="mf-prod__btn" href={urlProducto(producto.handle)} target="_blank" rel="noopener noreferrer">
            Ver en la tienda
          </a>
        </div>
      </div>
    </section>
  );
}
