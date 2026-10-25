import { REPRODUCCION_GLENN } from "@/content/glenn";

/**
 * ¿Hay reproducción de Glenn (Basquiat) que mostrar? Se decide al compilar, nunca en el
 * navegador: next.config.ts la elige con scripts/glenn/reproduccion.mjs.
 *
 * - `MANIFESTO_GLENN_IMAGEN=off` fuerza la versión sin pintura.
 * - Si no, se usa la reproducción autorizada o, solo fuera de una publicación, la de
 *   referencia (public/obras/glenn-referencia.jpg, registrada con `npm run glenn:registrar`).
 * - Sin ningún archivo válido, la página usa el esquema propio, sin referencias rotas.
 *
 * Como la decide next.config.ts, añadir o quitar el archivo requiere reiniciar
 * `next dev` o volver a compilar.
 */
export function hayImagenGlenn(): boolean {
  return REPRODUCCION_GLENN !== null;
}
