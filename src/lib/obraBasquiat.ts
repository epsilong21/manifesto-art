import { REPRODUCCION_BASQUIAT } from "@/content/basquiat";

/**
 * ¿Hay reproducción de Untitled (Basquiat) que mostrar? Se decide al compilar, nunca
 * en el navegador: next.config.ts la elige con scripts/basquiat/reproduccion.mjs.
 *
 * - `MANIFESTO_BASQUIAT_IMAGEN=off` fuerza la versión sin pintura.
 * - Si no, se usa la reproducción autorizada o, solo fuera de una publicación, la de
 *   referencia, siempre que su archivo esté en `public/obras` y coincida con el registrado.
 * - Sin ningún archivo válido, la página usa la lámina pendiente, sin referencias rotas.
 *
 * Como la decide next.config.ts, añadir o quitar el archivo requiere reiniciar
 * `next dev` o volver a compilar.
 */
export function hayImagenBasquiat(): boolean {
  return REPRODUCCION_BASQUIAT !== null;
}
