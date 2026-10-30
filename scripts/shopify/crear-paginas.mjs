// Crea (o actualiza) en Shopify las 14 páginas que muestran la web de las obras, cada una con su plantilla.
// Uso:  npm run shopify:crear-paginas -- --mostrar     → solo lista lo que haría
//       npm run shopify:crear-paginas                   → las crea en la tienda
//
// Requisito (una vez): dar acceso al CLI para gestionar páginas, iniciando sesión con la cuenta dueña de la tienda:
//       shopify store auth --store manifestocol.myshopify.com --scopes read_content,write_content
//
// Cada página es /pages/<handle> y usa la plantilla page.<handle>.liquid del tema (la genera shopify:empaquetar).
// Si la página ya existe solo se corrige su plantilla; nunca se borra ni se cambia su contenido.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TIENDA = "manifestocol.myshopify.com";
const soloMostrar = process.argv.includes("--mostrar");

const PAGINAS = [
  ["obras", "Obras · Portada"],
  ["obras-catalogo", "Obras · Catálogo"],
  ["obra-medusa", "Obra · Medusa"],
  ["obra-noche-estrellada", "Obra · La noche estrellada"],
  ["obra-los-elefantes", "Obra · Los elefantes"],
  ["obra-basquiat-untitled", "Obra · Untitled (Basquiat)"],
  ["obra-glenn", "Obra · Glenn (Basquiat)"],
  ["obra-ascension-al-empireo", "Obra · La ascensión al Empíreo"],
  ["obra-el-descendimiento-de-la-cruz", "Obra · El descendimiento de la cruz"],
  ["obra-la-loca-meg", "Obra · La loca Meg"],
  ["obra-los-siete-pecados-capitales", "Obra · Los siete pecados capitales"],
  ["obra-cristo-de-san-juan-de-la-cruz", "Obra · Cristo de San Juan de la Cruz"],
  ["obras-aviso-legal", "Obras · Aviso legal"],
  ["obras-privacidad", "Obras · Política de privacidad"],
];

if (soloMostrar) {
  console.log(`Páginas que se crearían en ${TIENDA}:`);
  for (const [handle, titulo] of PAGINAS) console.log(`  /pages/${handle}   plantilla page.${handle}   «${titulo}»`);
  process.exit(0);
}

const tmp = mkdtempSync(join(tmpdir(), "msto-paginas-"));
function ejecuta(query, variables, mutacion) {
  const q = join(tmp, "q.graphql");
  const v = join(tmp, "v.json");
  writeFileSync(q, query);
  writeFileSync(v, JSON.stringify(variables ?? {}));
  const args = ["store", "execute", "--store", TIENDA, "--query-file", q, "--variable-file", v, "--json", ...(mutacion ? ["--allow-mutations"] : [])];
  const r = spawnSync("shopify", args, { encoding: "utf8", shell: process.platform === "win32" });
  if (r.status !== 0) throw new Error(`shopify store execute falló:\n${r.stdout}\n${r.stderr}`);
  const t = r.stdout.slice(r.stdout.indexOf("{"));
  return JSON.parse(t);
}
const datos = (r) => r.data ?? r;

const BUSCA = `query($q: String!) { pages(first: 5, query: $q) { nodes { id handle templateSuffix } } }`;
const CREA = `mutation($page: PageCreateInput!) { pageCreate(page: $page) { page { id handle templateSuffix } userErrors { field message } } }`;
const ACTUALIZA = `mutation($id: ID!, $page: PageUpdateInput!) { pageUpdate(id: $id, page: $page) { page { id handle templateSuffix } userErrors { field message } } }`;

let creadas = 0;
let corregidas = 0;
let iguales = 0;
try {
  for (const [handle, titulo] of PAGINAS) {
    const existente = datos(ejecuta(BUSCA, { q: `handle:${handle}` })).pages.nodes.find((p) => p.handle === handle);
    if (!existente) {
      const r = datos(ejecuta(CREA, { page: { title: titulo, handle, templateSuffix: handle, isPublished: true, body: "" } }, true)).pageCreate;
      if (r.userErrors.length) throw new Error(`${handle}: ${r.userErrors.map((e) => e.message).join("; ")}`);
      creadas++;
      console.log(`+ creada   /pages/${handle}`);
    } else if (existente.templateSuffix !== handle) {
      const r = datos(ejecuta(ACTUALIZA, { id: existente.id, page: { templateSuffix: handle } }, true)).pageUpdate;
      if (r.userErrors.length) throw new Error(`${handle}: ${r.userErrors.map((e) => e.message).join("; ")}`);
      corregidas++;
      console.log(`~ plantilla corregida en /pages/${handle}`);
    } else {
      iguales++;
      console.log(`= ya existe /pages/${handle}`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n✓ ${creadas} creadas, ${corregidas} corregidas, ${iguales} ya estaban`);
