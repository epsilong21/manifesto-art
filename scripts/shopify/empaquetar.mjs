// Empaqueta la web de las obras como archivos de un tema de Shopify.
// Uso:  npm run shopify:empaquetar                      → páginas definitivas (/pages/obras, /pages/obra-medusa…)
//       npm run shopify:empaquetar -- --prueba colecciones → para probar sin crear páginas: cada plantilla se abre con
//                                                             /pages/colecciones?view=obra-medusa (una página que ya exista)
//       --sin-build  reutiliza el out/ de la última exportación para Shopify
//
// Salida: shopify-tema/assets/*   (JS, CSS, fuentes e imágenes, en la carpeta plana de assets del tema)
//         shopify-tema/templates/page.<sufijo>.liquid   (una plantilla por página, sin el diseño del tema: `layout none`)
//
// Cómo funciona (ver también src/lib/rutaPublica.ts):
// - La web se exporta como siempre (Next, exportación estática) pero con MANIFESTO_SHOPIFY=1: rutas de /public con
//   nombres planos y CSS en archivos aparte.
// - Cada página exportada pasa a ser una plantilla de Liquid: los archivos (`/_next/…`, imágenes) se enlazan con
//   `{{ 'nombre' | asset_url }}`, así funciona en cualquier copia del tema, y los enlaces entre obras apuntan a las
//   páginas de Shopify.
// - El cargador de trozos de Next pide `static/chunks/x.js`; los assets de un tema son planos (`static__chunks__x.js`),
//   así que se ajustan las dos líneas del cargador que componen y deshacen esa ruta (falla en voz alta si no las encuentra).
// - Una cabecera común fija la carpeta de assets, evita el router de Next (cada enlace es una navegación normal) y
//   bloquea sus precargas.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "../..");
const out = join(raiz, "out");
const destino = join(raiz, "shopify-tema");
const args = process.argv.slice(2);
const sinBuild = args.includes("--sin-build");
const prueba = args.includes("--prueba") ? args[args.indexOf("--prueba") + 1] : null;
const DOMINIO = "https://manifestocol.com";

// ── Rutas de la web → página de Shopify ──
const SLUGS = [
  "medusa", "noche-estrellada", "los-elefantes", "basquiat-untitled", "glenn", "ascension-al-empireo",
  "el-descendimiento-de-la-cruz", "la-loca-meg", "los-siete-pecados-capitales", "cristo-de-san-juan-de-la-cruz",
];
/** ruta de la web (sin barra final) → handle de la página de Shopify (que es también el sufijo de la plantilla) */
const PAGINAS = new Map([
  ["/", "obras"],
  ["/conceptos", "obras-catalogo"],
  ...SLUGS.map((s) => [`/conceptos/${s}`, `obra-${s}`]),
  ["/aviso-legal", "obras-aviso-legal"],
  ["/politica-de-privacidad", "obras-privacidad"],
]);
const urlDePagina = (handle) => (prueba ? `/pages/${prueba}?view=${handle}` : `/pages/${handle}`);
const normaliza = (ruta) => (ruta.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/");

// ── 1. Exportación ──
if (!sinBuild) {
  console.log("· Exportando la web para Shopify…");
  const r = spawnSync(process.execPath, [join(raiz, "scripts/pages/exportar.mjs")], {
    stdio: "inherit",
    env: { ...process.env, MANIFESTO_SHOPIFY: "1", MANIFESTO_BASE_PATH: "", NEXT_PUBLIC_SITE_URL: DOMINIO },
  });
  if (r.status !== 0) {
    console.error("✗ La exportación falló");
    process.exit(1);
  }
}
if (!existsSync(join(out, "index.html"))) {
  console.error("✗ No hay out/: ejecuta sin --sin-build");
  process.exit(1);
}

// ── 2. Assets (carpeta plana) ──
rmSync(destino, { recursive: true, force: true });
mkdirSync(join(destino, "assets"), { recursive: true });
mkdirSync(join(destino, "templates"), { recursive: true });

const EXT_ASSET = new Set([".js", ".css", ".woff2", ".webp", ".png", ".jpg", ".jpeg", ".svg", ".ico"]);
/** ruta dentro de out/ (con /) → nombre del asset */
const assets = new Map();
const nombreAsset = (rel) => (rel.startsWith("_next/") ? rel.slice("_next/".length).replaceAll("/", "__") : rel.replaceAll("/", "--"));

function recorre(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (n === "_not-found" || n === "404") continue;
      recorre(p);
      continue;
    }
    const rel = relative(out, p).replaceAll("\\", "/");
    const ext = n.slice(n.lastIndexOf(".")).toLowerCase();
    if (!EXT_ASSET.has(ext)) continue;
    assets.set(rel, nombreAsset(rel));
  }
}
recorre(out);

// El cargador de trozos de Next: composición y deshecho de la ruta plana
function parcheaCargador(js, archivo) {
  let t = js;
  const compone = /(function \w+\((\w+),(\w+)=\w+\)\{let (\w+)=)(\w+\.test\(\2\)\?\2\.split\("\/"\)\.map\(encodeURIComponent\)\.join\("\/"\):\2)(;return`\$\{\3\}\$\{\4\}\$\{\w+\}`\})/;
  if (!compone.test(t)) throw new Error(`${archivo}: no encuentro dónde el cargador de Next compone la URL de un trozo (¿cambió Next?)`);
  t = t.replace(compone, '$1($5).replaceAll("/","__")$6');
  const deshace = /(\w+)\.startsWith\((\w+)\)\?\1\.slice\(\2\.length\):\1/;
  if (!deshace.test(t)) throw new Error(`${archivo}: no encuentro dónde el cargador de Next deduce la ruta de un trozo (¿cambió Next?)`);
  t = t.replace(deshace, '$1.startsWith($2)?$1.slice($2.length).replaceAll("__","/"):$1');
  // Al cargarse, cada trozo se registra con su `script.src` completo. Con la versión de Shopify (?v=…) esa clave no coincide
  // con la que espera el cargador (la URL sin consulta): el entorno nunca se completa y React no llega a arrancar.
  const registra = /(\w+)\("string"==typeof (?<v>\w+)\?(\w+)\(\k<v>\):\k<v>\.src\)\.resolve\(\)/;
  if (!registra.test(t)) throw new Error(`${archivo}: no encuentro dónde el cargador de Next registra un trozo cargado (¿cambió Next?)`);
  t = t.replace(registra, (_, fn, _v, aRuta, ...resto) => {
    const v = resto.at(-1).v; // variable del trozo (nombre minificado)
    return `${fn}("string"==typeof ${v}?${aRuta}(${v}):${v}.src.replace(/[?#].*$/,"")).resolve()`;
  });
  return t;
}

// getAssetPrefix() de Next saca el prefijo de assets de la URL de su propio script y falla si no contiene «/_next/».
// En un tema no existe esa carpeta (la ruta es …/assets/static__chunks__x.js): el prefijo es vacío.
const PREFIJO_NEXT = /if\(-1===(\w+)\)throw new \w+\.InvariantError\(`Expected document\.currentScript src to contain '\/_next\/'[^`]*`\);/;
let prefijosParcheados = 0;

let cargadores = 0;
for (const [rel, nombre] of assets) {
  const origen = join(out, rel);
  const salida = join(destino, "assets", nombre);
  if (/^_next\/static\/chunks\/turbopack-.*\.js$/.test(rel)) {
    writeFileSync(salida, parcheaCargador(readFileSync(origen, "utf8"), rel));
    cargadores++;
  } else if (rel.endsWith(".js") && readFileSync(origen, "utf8").includes("to contain '/_next/'")) {
    const js = readFileSync(origen, "utf8");
    if (!PREFIJO_NEXT.test(js)) throw new Error(`${rel}: no encuentro la comprobación de «/_next/» de Next (¿cambió Next?)`);
    writeFileSync(salida, js.replace(PREFIJO_NEXT, 'if(-1===$1)return"";'));
    prefijosParcheados++;
  } else if (rel.endsWith(".css")) {
    // Las fuentes se pedían como ../media/x.woff2; en la carpeta plana de assets están al lado, con la ruta aplanada
    writeFileSync(salida, readFileSync(origen, "utf8").replace(/url\(\.\.\/media\/([^)]+)\)/g, "url(static__media__$1)"));
  } else {
    copyFileSync(origen, salida);
  }
}
if (cargadores !== 1) throw new Error(`Esperaba 1 cargador de Next (turbopack-*.js) y hay ${cargadores}`);
if (prefijosParcheados !== 1) throw new Error(`Esperaba 1 comprobación de «/_next/» de Next y encontré ${prefijosParcheados}`);
// Archivo ancla: su asset_url da la carpeta de assets del tema
writeFileSync(join(destino, "assets", "msto-base.css"), "/* Ancla: la carpeta de assets de este archivo es la de las obras. */\n");

// Piezas del tema que se mantienen a mano (scripts/shopify/tema/): p. ej. el bloque «Esta prenda es una obra»
function copiaDir(origen, salida) {
  mkdirSync(salida, { recursive: true });
  for (const n of readdirSync(origen)) {
    const o = join(origen, n);
    if (statSync(o).isDirectory()) copiaDir(o, join(salida, n));
    else copyFileSync(o, join(salida, n));
  }
}
if (existsSync(join(raiz, "scripts/shopify/tema"))) copiaDir(join(raiz, "scripts/shopify/tema"), destino);

// ── 3. Cabecera común ──
const rutasParaCliente = {};
for (const [ruta, handle] of PAGINAS) rutasParaCliente[ruta] = urlDePagina(handle);
const CABECERA = `<script>
(function () {
  var B = {{ b | json }};
  window.__MSTO_ASSETS = B;
  // El cargador compara el texto del atributo src de cada <script> (//host/…, tal como lo escribe asset_url) con esta base:
  // debe ir escrita igual, no como URL absoluta.
  window.TURBOPACK_CHUNK_BASE_PATH = B;
  // El cargador copia el ?v=… de su propio script a cada trozo que pide; cada asset de Shopify tiene su versión, así que no
  // coincidiría con el registro del trozo. Sin sufijo, las URL de los trozos son siempre «carpeta + nombre».
  window.TURBOPACK_ASSET_SUFFIX = "";
  var R = ${JSON.stringify(rutasParaCliente)};
  // Cada enlace interno es una navegación normal (sin el router de Next, que aquí no tiene dónde pedir las páginas)
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    var h = a.getAttribute("href");
    if (!h || h.charAt(0) === "#") return;
    var u = new URL(h, location.href);
    if (u.origin !== location.origin) return;
    var dest = R[u.pathname.replace(/\\/+$/, "") || "/"];
    e.stopImmediatePropagation();
    if (dest) { e.preventDefault(); location.assign(dest + u.hash); }
  }, true);
  // Sin precargas del router: no hay un servidor de Next que las responda
  var f = window.fetch;
  window.fetch = function (i) {
    var url = typeof i === "string" ? i : i && i.url ? i.url : String(i);
    if (/[?&]_rsc=|\\/__next[^/]*\\.txt|\\/index\\.txt/.test(url)) return Promise.resolve(new Response("", { status: 404 }));
    return f.apply(this, arguments);
  };
})();
</script>`;

// ── 4. Páginas → plantillas de Liquid ──
// Cada referencia lleva el `asset_url` completo (con su ?v=…): así, al actualizar un archivo, la CDN de Shopify no sirve
// el anterior. Una URL puede venir partida entre dos <script> del payload de Next (p. ej. «…-100» y «0.webp»): esas
// no son un archivo todavía y se escriben como carpeta de assets (`b`, definida al inicio de cada plantilla) + nombre.
const nombresUsados = new Set();
const existentes = new Set(assets.values());
const liquidAsset = (nombre) => (existentes.has(nombre) ? `{{ '${nombre}' | asset_url }}` : `{{ b }}${nombre}`);
const sinResolver = new Set();
const sustituciones = (t, ruta) => {
  // La URL canónica y og:url de cada página son su página de Shopify
  const propia = `${DOMINIO}/pages/${PAGINAS.get(ruta)}`;
  t = t.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${propia}$2`).replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${propia}$2`);
  // Next pide los trozos de cliente por la URL exacta que trae el payload (`self.__next_f.push(…)`), y el trozo, al cargarse,
  // se registra con su src SIN consulta. Si en el payload la URL llevara el ?v=… de Shopify, nunca coincidirían y la
  // hidratación se quedaría esperando: allí los .js van como carpeta + nombre; en las etiquetas, con asset_url completo.
  const rangosPayload = [...t.matchAll(/<script>self\.__next_f\.push[\s\S]*?<\/script>/g)].map((m) => [m.index, m.index + m[0].length]);
  const enPayload = (pos) => rangosPayload.some(([a, b]) => pos >= a && pos < b);
  const piezas = []; // [{texto, liquid}]
  let ultimo = 0;
  const RX = new RegExp(
    [
      "https://msto-asset\\.invalid/([A-Za-z0-9._-]+)", // 1: marcador de rutaPublica
      "https://manifestocol\\.com(/[^\"'\\s\\\\<>)]*)?", // 2: URL absoluta del sitio
      "/_next/(static/[^\"'\\s\\\\)?]+)", //                  3: archivos de Next
      "(?<=\")/icon\\.png[^\"'\\s\\\\]*", //                    (icono, en etiquetas y en el payload)
      '(?<=href=")/[^"]*(?=")', //                            (enlaces internos)
    ].join("|"),
    "g",
  );
  t.replace(RX, (m, marcador, absoluta, next, offset) => {
    let liquid = null;
    if (marcador !== undefined) {
      nombresUsados.add(marcador);
      liquid = liquidAsset(marcador);
    } else if (next !== undefined) {
      const rel = `_next/${next}`;
      if (!assets.has(rel) && !/\.[a-z0-9]+$/.test(rel)) {
        liquid = liquidAsset(nombreAsset(`_next/${next}`)); // trozo de URL partido entre dos <script>
      } else {
        if (!assets.has(rel)) throw new Error(`${ruta}: falta el archivo ${rel}`);
        liquid = rel.endsWith(".js") && enPayload(offset) ? `{{ b }}${assets.get(rel)}` : liquidAsset(assets.get(rel));
      }
    } else if (m.startsWith("https://manifestocol.com")) {
      const resto = absoluta ?? "";
      const limpia = resto.replace(/[?#].*$/, "");
      const rel = limpia.replace(/^\//, "");
      if (!rel || rel.startsWith("products/") || limpia.startsWith("/pages/")) liquid = null; // la tienda (o ya resuelta): se deja
      else if (assets.has(rel)) liquid = `https:${liquidAsset(assets.get(rel))}`; // og:image y similares
      else if (PAGINAS.has(normaliza(limpia))) liquid = `${DOMINIO}/pages/${PAGINAS.get(normaliza(limpia))}`;
      else sinResolver.add(`${ruta}: ${m}`);
    } else if (m === "/icon.png" || m.startsWith("/icon.png?")) {
      liquid = liquidAsset("icon.png");
    } else {
      // enlace interno
      const h = normaliza(m);
      if (PAGINAS.has(h)) liquid = urlDePagina(PAGINAS.get(h)) + (m.includes("#") ? m.slice(m.indexOf("#")) : "");
      else sinResolver.add(`${ruta}: href="${m}"`);
    }
    if (liquid !== null) {
      piezas.push({ texto: t.slice(ultimo, offset), liquid: false });
      piezas.push({ texto: liquid, liquid: true });
      ultimo = offset + m.length;
    }
    return m;
  });
  piezas.push({ texto: t.slice(ultimo), liquid: false });
  return piezas;
};

const aLiquid = (piezas) =>
  piezas
    .map((p) => {
      if (p.liquid) return p.texto;
      if (p.texto.includes("{% endraw")) throw new Error("El HTML contiene un {% endraw %} literal");
      return /\{\{|\{%|\{#/.test(p.texto) ? `{% raw %}${p.texto}{% endraw %}` : p.texto;
    })
    .join("");

const resumen = [];
for (const [ruta, handle] of PAGINAS) {
  const archivo = ruta === "/" ? "index.html" : `${ruta.slice(1)}/index.html`;
  const html = readFileSync(join(out, archivo), "utf8");
  const cabeza = html.match(/<head[^>]*>/);
  if (!cabeza) throw new Error(`${archivo}: no tiene <head>`);
  const corte = cabeza.index + cabeza[0].length;
  // Lo de antes de <head> no lleva archivos; la cabecera común va justo después, ya como Liquid (fuera de `raw`)
  const liquid =
    "{% layout none %}{% assign b = 'msto-base.css' | asset_url | split: 'msto-base.css' | first %}" + aLiquid([{ texto: html.slice(0, corte), liquid: false }]) + CABECERA + aLiquid(sustituciones(html.slice(corte), ruta));
  writeFileSync(join(destino, "templates", `page.${handle}.liquid`), liquid);
  resumen.push([`page.${handle}.liquid`, Math.round(Buffer.byteLength(liquid) / 1024)]);
}

// ── 5. Comprobaciones ──
const errores = [];
for (const n of nombresUsados) if (/\.[a-z0-9]+$/.test(n) && !existentes.has(n)) errores.push(`la plantilla enlaza ${n}, que no está en out/`);
for (const [nombre] of resumen) {
  const t = readFileSync(join(destino, "templates", nombre), "utf8");
  for (const mala of ["msto-asset", "/_next/", "github.io", "manifesto-art", 'href="/conceptos', 'href="/aviso-legal']) {
    if (t.includes(mala)) errores.push(`${nombre} todavía contiene «${mala}»`);
  }
}
for (const s of sinResolver) errores.push(`sin resolver: ${s}`);
for (const [nombre, kb] of resumen) if (kb > 250) errores.push(`${nombre} pesa ${kb} KB (límite de una plantilla de Liquid: ~256 KB)`);
if (errores.length) {
  console.error("✗ Problemas al empaquetar:\n  " + errores.join("\n  "));
  process.exit(1);
}

const nAssets = readdirSync(join(destino, "assets")).length;
console.log(`\n✓ shopify-tema/: ${nAssets} assets y ${resumen.length} plantillas${prueba ? ` (modo prueba sobre /pages/${prueba})` : ""}`);
for (const [n, kb] of resumen) console.log(`    ${String(kb).padStart(4)} KB  ${n}`);
