// Publica la web de las obras en la tienda en vivo: empaqueta, sube los archivos al tema y crea/actualiza las páginas.
// Uso:  npm run shopify:publicar
//       npm run shopify:publicar -- --tema 182672720169     (otro tema; por defecto, el publicado hoy)
//
// Requisito (una sola vez): shopify store auth --store manifestocol.myshopify.com --scopes read_content,write_content
// Solo AÑADE o reemplaza archivos de la web (assets/*, las plantillas page.obra* y el snippet obra-manifesto); no toca el
// resto del tema. Procedimiento completo: scripts/shopify/LEEME.md
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const TIENDA = "manifestocol.myshopify.com";
const tema = args.includes("--tema") ? args[args.indexOf("--tema") + 1] : "182672720169";
const shell = process.platform === "win32";

function paso(titulo, comando, argumentos, cwd = raiz) {
  console.log(`\n▶ ${titulo}`);
  const r = spawnSync(comando, argumentos, { cwd, stdio: "inherit", shell });
  if (r.status !== 0) {
    console.error(`\n✗ Se detuvo en: ${titulo}`);
    process.exit(r.status ?? 1);
  }
}

paso("1/3 Empaquetar la web para Shopify", process.execPath, [join(raiz, "scripts/shopify/empaquetar.mjs")]);
paso(
  `2/3 Subir los archivos al tema ${tema}`,
  "shopify",
  ["theme", "push", "--store", TIENDA, "--theme", tema, "--allow-live", "--only", '"assets/*"', "--only", '"templates/page.obra*.liquid"', "--only", '"snippets/obra-manifesto.liquid"', "--path", "."],
  join(raiz, "shopify-tema"),
);
paso("3/3 Crear o actualizar las páginas", process.execPath, [join(raiz, "scripts/shopify/crear-paginas.mjs")]);

console.log("\n✓ Publicado: https://manifestocol.com/pages/obras");
