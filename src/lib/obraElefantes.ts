import { existsSync } from "node:fs";
import { join } from "node:path";
import { OBRA_ELEFANTES } from "@/content/elefantes";

/**
 * ¿Hay reproducción de Los elefantes que mostrar? Se decide en el servidor, al
 * generar la página (en el build de producción), nunca en el navegador:
 *
 * - `MANIFESTO_ELEFANTES_IMAGEN=off` fuerza la versión sin pintura (útil para
 *   un despliegue público mientras la autorización siga pendiente).
 * - Si no, la pintura se muestra solo si el archivo de `OBRA_ELEFANTES.imagen`
 *   existe en `public/`. En una instalación limpia (el archivo está fuera de
 *   Git) no existe y la página usa la alternativa, sin referencias rotas.
 */
export function hayImagenElefantes(): boolean {
  if (process.env.MANIFESTO_ELEFANTES_IMAGEN === "off") return false;
  return existsSync(join(process.cwd(), "public", OBRA_ELEFANTES.imagen.src));
}
