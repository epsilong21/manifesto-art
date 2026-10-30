// Actualiza src/content/tienda.ts con el catálogo público de la tienda de MANIFESTO (nombre e imagen de cada prenda).
// Uso: npm run tienda:actualizar
//
// La relación obra → prenda (el handle de cada producto) se lee del propio tienda.ts: para cambiar de prenda una obra,
// cambia su `handle` ahí y vuelve a ejecutar esto. Si un producto ya no existe en la tienda, se avisa y se deja como está.
// Sin precios a propósito: cambian en la tienda y aquí quedarían desfasados. Solo lee el catálogo público (products.json).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "../..");
const archivo = join(raiz, "src/content/tienda.ts");
// Git en Windows puede guardar el archivo con CRLF: se normaliza al leer y se respeta al escribir
const original = readFileSync(archivo, "utf8");
const crlf = original.includes("\r\n");
const fuente = original.replaceAll("\r\n", "\n");
const TIENDA = fuente.match(/TIENDA_URL = "([^"]+)"/)?.[1];
if (!TIENDA) throw new Error("No encuentro TIENDA_URL en src/content/tienda.ts");

// slug → handle, tal como están ahora
const actuales = [...fuente.matchAll(/^ {2}"([\w-]+)": \{\n {4}handle: "([^"]+)",\n {4}titulo: "([^"]*)",\n {4}imagen: "([^"]*)",/gm)].map((m) => ({
  slug: m[1],
  handle: m[2],
  titulo: m[3],
  imagen: m[4],
}));
if (actuales.length === 0) throw new Error("No pude leer las prendas de src/content/tienda.ts (¿cambió su formato?)");

const catalogo = new Map();
for (let pagina = 1; pagina <= 20; pagina++) {
  const r = await fetch(`${TIENDA}/products.json?limit=250&page=${pagina}`, { headers: { "User-Agent": "Mozilla/5.0 (actualizar-tienda)" } });
  if (!r.ok) throw new Error(`La tienda respondió ${r.status} en la página ${pagina}`);
  const { products } = await r.json();
  if (!products?.length) break;
  for (const p of products) catalogo.set(p.handle, p);
}
if (catalogo.size === 0) throw new Error("El catálogo vino vacío: no toco nada");

let cambios = 0;
let salida = fuente;
for (const a of actuales) {
  const p = catalogo.get(a.handle);
  if (!p) {
    console.warn(`⚠ ${a.slug}: el producto «${a.handle}» ya no está en la tienda; se deja como estaba`);
    continue;
  }
  const imagen = p.images?.[0]?.src ?? a.imagen;
  if (p.title !== a.titulo || imagen !== a.imagen) {
    cambios++;
    console.log(`· ${a.slug}: ${a.titulo !== p.title ? `«${a.titulo}» → «${p.title}»` : "imagen nueva"}`);
    // Solo se reemplaza dentro del bloque de esa obra
    const bloque = new RegExp(`(^ {2}"${a.slug}": \\{\\n {4}handle: "[^"]+",\\n {4}titulo: ")[^"]*(",\\n {4}imagen: ")[^"]*(",)`, "m");
    salida = salida.replace(bloque, (_, a1, a2, a3) => `${a1}${p.title.replaceAll('"', '\\"')}${a2}${imagen}${a3}`);
  }
}

if (cambios === 0) {
  console.log(`✓ tienda.ts ya está al día (${actuales.length} prendas, ${catalogo.size} productos en la tienda)`);
} else {
  writeFileSync(archivo, crlf ? salida.replaceAll("\n", "\r\n") : salida);
  console.log(`✓ tienda.ts actualizado: ${cambios} prenda(s) con cambios. Revisa el diff y publica con un commit.`);
}
