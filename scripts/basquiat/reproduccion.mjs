// Elige la reproducción de Untitled (Basquiat, 1981) que usa el build. La comparten
// next.config.ts (qué ve la página) y scripts/pages/exportar.mjs (variantes y
// verificación), para que las dos decisiones no puedan divergir.
//
// Orden: la reproducción «publica» (con licencia) y, si no, la «referencia»
// (sin licencia, solo para desarrollo local). Cada una se usa únicamente si su archivo
// está en public/obras y su SHA-256 coincide con el registrado en
// src/content/basquiat-reproducciones.json. Al publicar (GitHub Actions o
// MANIFESTO_PUBLICACION=1) solo se usan las entradas con `publicable: true`: la
// referencia no lo está.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const raiz = process.cwd();
export const REPRODUCCIONES = JSON.parse(readFileSync(join(raiz, "src/content/basquiat-reproducciones.json"), "utf8"));

export const esPublicacion = () => process.env.GITHUB_ACTIONS === "true" || process.env.MANIFESTO_PUBLICACION === "1";

const CAMPOS = ["width", "height", "sha256", "imagen", "autorizacion", "pie"];

/**
 * @returns {{ elegida: null | { clave: string, archivo: string, width: number, height: number, imagen: string, autorizacion: string, pie: string }, descartes: string[], publicaRechazada: boolean }}
 */
export function elegirReproduccion() {
  const descartes = [];
  let publicaRechazada = false;
  if (process.env.MANIFESTO_BASQUIAT_IMAGEN === "off") return { elegida: null, descartes: ["MANIFESTO_BASQUIAT_IMAGEN=off"], publicaRechazada };
  for (const clave of ["publica", "referencia"]) {
    const r = REPRODUCCIONES[clave];
    const ruta = join(raiz, "public/obras", r.archivo);
    if (!existsSync(ruta)) {
      descartes.push(`${clave}: no existe public/obras/${r.archivo}`);
      continue;
    }
    const motivo =
      !r.publicable && esPublicacion() ? "no tiene autorización de publicación"
      : CAMPOS.some((c) => !r[c]) ? `faltan datos en basquiat-reproducciones.json (${CAMPOS.filter((c) => !r[c]).join(", ")})`
      : createHash("sha256").update(readFileSync(ruta)).digest("hex") !== r.sha256 ? "el archivo no coincide con el SHA-256 registrado"
      : null;
    if (motivo) {
      descartes.push(`${clave}: ${motivo}`);
      if (clave === "publica") publicaRechazada = true;
      continue;
    }
    const { archivo, width, height, imagen, autorizacion, pie } = r;
    return { elegida: { clave, archivo, width, height, imagen, autorizacion, pie }, descartes, publicaRechazada };
  }
  return { elegida: null, descartes, publicaRechazada };
}
