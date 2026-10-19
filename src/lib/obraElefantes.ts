import { REPRODUCCION_ELEFANTES } from "@/content/elefantes";

/**
 * ¿Hay reproducción de Los elefantes que mostrar? Se decide al compilar, nunca
 * en el navegador: next.config.ts la elige con scripts/elefantes/reproduccion.mjs.
 *
 * - `MANIFESTO_ELEFANTES_IMAGEN=off` fuerza la versión sin pintura.
 * - Si no, se usa la reproducción autorizada o, si no, la de referencia (sin licencia),
 *   siempre que su archivo esté en `public/obras` y coincida con el registrado.
 * - Sin ningún archivo válido, la página usa la alternativa, sin referencias rotas.
 *
 * Como la decide next.config.ts, añadir o quitar el archivo requiere reiniciar
 * `next dev` o volver a compilar.
 */
export function hayImagenElefantes(): boolean {
  return REPRODUCCION_ELEFANTES !== null;
}
