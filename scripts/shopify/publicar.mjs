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
const sinPaginas = args.includes("--sin-paginas"); // las páginas se crean a mano en Shopify (ver LEEME.md)
const ensayo = args.includes("--ensayo"); // solo empaqueta; muestra lo que haría después, sin tocar la tienda
// En Windows `shopify` es un .cmd y necesita shell; Node no (su ruta suele llevar espacios y el shell la rompería)
const necesitaShell = (comando) => process.platform === "win32" && comando === "shopify";

function paso(titulo, comando, argumentos, cwd = raiz) {
  console.log(`\n▶ ${titulo}`);
  const r = spawnSync(comando, argumentos, { cwd, stdio: "inherit", shell: necesitaShell(comando) });
  if (r.status !== 0) {
    console.error(`\n✗ Se detuvo en: ${titulo}`);
    process.exit(r.status ?? 1);
  }
}

paso("1/3 Empaquetar la web para Shopify", process.execPath, [join(raiz, "scripts/shopify/empaquetar.mjs")]);
if (ensayo) {
  console.log(String.fromCharCode(10) + "(ensayo) No se sube nada ni se crean páginas. Con `npm run shopify:publicar` se haría:");
  console.log(`  · shopify theme push --theme ${tema} --allow-live  (assets/*, templates/page.obra*, snippets/obra-manifesto)`);
  console.log("  · crear o corregir las 14 páginas (npm run shopify:crear-paginas -- --mostrar las lista)");
  process.exit(0);
}
paso(
  `2/3 Subir los archivos al tema ${tema}`,
  "shopify",
  ["theme", "push", "--store", TIENDA, "--theme", tema, "--allow-live", "--only", '"assets/*"', "--only", '"templates/page.obra*.liquid"', "--only", '"snippets/obra-manifesto.liquid"', "--path", "."],
  join(raiz, "shopify-tema"),
);
if (sinPaginas) {
  console.log(String.fromCharCode(10) + "3/3 Páginas: no se crean desde aquí. Créalas en Shopify (Páginas → Agregar página), cada una con su plantilla de tema:");
  paso("    (lista)", process.execPath, [join(raiz, "scripts/shopify/crear-paginas.mjs"), "--mostrar"]);
} else {
  paso("3/3 Crear o actualizar las páginas", process.execPath, [join(raiz, "scripts/shopify/crear-paginas.mjs")]);
}

console.log("\n✓ Publicado: https://manifestocol.com/pages/obras");
