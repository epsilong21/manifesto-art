// Verifica una exportación estática antes de publicarla.
// Uso: node scripts/pages/verificar.mjs <out> [basePath] [--elefantes=<nombre>] [--publicacion]
// Con --elefantes, la exportación debe incluir las variantes de esa reproducción
// de la pintura de Dalí; sin él, no puede quedar ningún rastro de ninguna.
// La reproducción de referencia (sin licencia) solo se admite sin --publicacion,
// y con cualquier otra no puede quedar ningún rastro de ella.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { REPRODUCCIONES } from "../elefantes/reproduccion.mjs";

const args = process.argv.slice(2);
const elefantes = args.find((a) => a.startsWith("--elefantes="))?.slice("--elefantes=".length);
const publicacion = args.includes("--publicacion");
const conReferencia = elefantes === "los-elefantes-referencia";
const [out = "out", base = "/manifesto-art"] = args.filter((a) => !a.startsWith("--"));
const errores = [];
const archivos = [];
const recorre = (dir) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) recorre(p);
    else archivos.push(relative(out, p).replaceAll("\\", "/"));
  }
};
recorre(out);

// 1. Las cinco rutas públicas y la página 404
const RUTAS = ["", "conceptos/", "conceptos/medusa/", "conceptos/noche-estrellada/", "conceptos/los-elefantes/"];
for (const r of RUTAS) if (!existsSync(join(out, r, "index.html"))) errores.push(`Falta la ruta /${r}`);
if (!existsSync(join(out, "404.html"))) errores.push("Falta 404.html");

// 2. Nada ajeno al sitio: ni originales (/obras), ni Dante, ni carpetas internas
const PROHIBIDO = /(barca-de-dante|prototipos|presentation-review|assets-source|qa-reports|\.map$|^obras\/)/;
for (const a of archivos) if (PROHIBIDO.test(a)) errores.push(`Archivo no permitido: ${a}`);

// 2b. La pintura de Dalí: variantes presentes si se pidió; la referencia, nunca al publicar
if (publicacion && conReferencia && !REPRODUCCIONES.referencia.publicable) errores.push("La reproducción de referencia de Los elefantes no se puede publicar");
if (elefantes && !archivos.some((a) => new RegExp(`^img/${elefantes}-\\d+\\.webp$`).test(a))) {
  errores.push("Faltan las variantes de la pintura de Los elefantes");
}
const textos = archivos.filter((a) => /\.(html|js|txt|json|css)$/.test(a)).map((a) => [a, readFileSync(join(out, a), "utf8")]);
if (!conReferencia) {
  for (const a of archivos) if (/elefantes-referencia/.test(a)) errores.push(`Archivo no permitido: ${a}`);
  for (const [a, t] of textos) if (/elefantes-referencia|historia-arte\.com\/_\//.test(t)) errores.push(`${a} contiene datos de la reproducción de referencia`);
}
if (!elefantes) {
  for (const a of archivos) if (/^img\/los-elefantes/.test(a)) errores.push(`Archivo no permitido: ${a}`);
  for (const [a, t] of textos) if (/\/obras\/los-elefantes|img\/los-elefantes/.test(t)) errores.push(`${a} referencia una reproducción de Dalí`);
}

// 3. Ninguna página enlaza la reproducción de Dalí ni a Dante
const html = archivos.filter((a) => a.endsWith(".html"));
for (const a of html) {
  const t = readFileSync(join(out, a), "utf8");
  if (/barca-de-dante/i.test(t)) errores.push(`${a} referencia a La barca de Dante`);
  if (t.includes(`${base}${base}/`)) errores.push(`${a} contiene el prefijo ${base} duplicado`);
  // 4. Cada recurso local enlazado existe
  const refs = [...t.matchAll(/(?:src|href|imageSrcSet|srcSet|srcset|imagesrcset)="([^"]+)"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+/)[0]));
  for (const ref of refs) {
    if (!ref.startsWith(`${base}/`)) continue;
    const ruta = decodeURIComponent(ref.slice(base.length + 1).split(/[?#]/)[0]);
    const destino = ruta === "" || ruta.endsWith("/") ? join(ruta, "index.html") : ruta;
    if (!existsSync(join(out, destino))) errores.push(`${a}: no existe ${ref}`);
  }
}

// 5. Datos de precarga con el nombre que pide el cliente (ver exportar.mjs)
for (const a of archivos) {
  const m = a.match(/^(.*?)(__next\.[^/]+)\/(.+)$/);
  if (m && !existsSync(join(out, m[1], `${m[2]}.${m[3].replaceAll("/", ".")}`))) errores.push(`Falta la copia plana de ${a}`);
}

const peso = archivos.reduce((s, a) => s + statSync(join(out, a)).size, 0);
console.log(`\nVerificación de ${out}: ${archivos.length} archivos, ${(peso / 1048576).toFixed(1)} MB, ${html.length} páginas HTML.`);
if (errores.length) {
  console.error([...new Set(errores)].map((e) => `  ✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log("  ✓ Rutas, recursos y exclusiones correctos.");
