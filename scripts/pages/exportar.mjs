// Exportación estática de MANIFESTO para GitHub Pages.
// Uso: npm run build:pages   (genera out/ y lo verifica)
//
// - Los elefantes muestra la pintura (V6.1 completa) solo con una reproducción
//   válida (scripts/elefantes/reproduccion.mjs): la autorizada o, si no, la de referencia
//   (sin licencia). Si no hay ninguna, la página usa su alternativa sin imagen.
//   Al publicar (GitHub Actions o MANIFESTO_PUBLICACION=1) la referencia solo entra si
//   su entrada dice `publicable: true` (decisión del titular del sitio, 19/10/2026).
// - Untitled (Basquiat) muestra la pintura solo con una reproducción válida
//   (scripts/basquiat/reproduccion.mjs). Al publicar nunca entra la de referencia,
//   que es solo para desarrollo local; sin ninguna, la página usa su alternativa.
// - Glenn (Basquiat) funciona igual (scripts/glenn/reproduccion.mjs): sin reproducción
//   válida, la página usa el esquema propio de MANIFESTO.
// - Genera las variantes WebP de las obras que usa src/lib/imagenEstatica.ts.
// - Quita de out/ todo /obras (originales y Dante): solo se publican variantes.
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { elegirReproduccion as elegirBasquiat, REPRODUCCIONES as REPRODUCCIONES_BASQUIAT } from "../basquiat/reproduccion.mjs";
import { elegirReproduccion, esPublicacion, REPRODUCCIONES } from "../elefantes/reproduccion.mjs";
import { elegirReproduccion as elegirGlenn, REPRODUCCIONES as REPRODUCCIONES_GLENN } from "../glenn/reproduccion.mjs";

const raiz = process.cwd();
const out = join(raiz, "out");
// Destino por defecto: https://epsilong21.github.io/manifesto-art/
const base = process.env.MANIFESTO_BASE_PATH ?? "/manifesto-art";
const publicacion = esPublicacion();

// Los elefantes: la misma elección que hará next.config.ts dentro del build
const { elegida, descartes, publicaRechazada } = elegirReproduccion();
for (const d of descartes) console.log(`  · ${d}`);
// Un archivo autorizado presente pero inválido es un error de configuración, no una ausencia
if (publicaRechazada) {
  console.error("✗ La reproducción autorizada de Los elefantes está en public/obras pero no es válida (ver arriba).");
  process.exit(1);
}
if (elegida) {
  // Las guías de V6.1 están calibradas para una proporción y un encuadre concretos
  const { width, height } = await sharp(join(raiz, "public/obras", elegida.archivo)).metadata();
  const cal = REPRODUCCIONES.calibracion;
  const desvio = Math.abs(width / height / (cal.width / cal.height) - 1);
  if (width !== elegida.width || height !== elegida.height) {
    console.error(`✗ ${elegida.archivo} mide ${width} × ${height}, no ${elegida.width} × ${elegida.height} como declara elefantes-reproducciones.json.`);
    process.exit(1);
  }
  if (desvio > 0.005) {
    console.error(`✗ ${elegida.archivo} tiene otra proporción que el lienzo calibrado (${cal.width} × ${cal.height}): hay que recalibrar las guías antes de usarlo.`);
    process.exit(1);
  }
}
console.log(`Los elefantes: ${elegida ? `con la pintura (V6.1 completa), reproducción «${elegida.clave}»` : "sin la pintura (alternativa)"}`);

// Basquiat: la misma elección que hará next.config.ts, con las mismas comprobaciones
const basquiat = elegirBasquiat();
for (const d of basquiat.descartes) console.log(`  · ${d}`);
if (basquiat.publicaRechazada) {
  console.error("✗ La reproducción autorizada de Basquiat está en public/obras pero no es válida (ver arriba).");
  process.exit(1);
}
if (basquiat.elegida) {
  const { width, height } = await sharp(join(raiz, "public/obras", basquiat.elegida.archivo)).metadata();
  const cal = REPRODUCCIONES_BASQUIAT.calibracion;
  if (width !== basquiat.elegida.width || height !== basquiat.elegida.height) {
    console.error(`✗ ${basquiat.elegida.archivo} mide ${width} × ${height}, no ${basquiat.elegida.width} × ${basquiat.elegida.height} como declara basquiat-reproducciones.json.`);
    process.exit(1);
  }
  if (Math.abs(width / height / (cal.width / cal.height) - 1) > 0.005) {
    console.error(`✗ ${basquiat.elegida.archivo} tiene otra proporción que el lienzo calibrado (${cal.width} × ${cal.height}).`);
    process.exit(1);
  }
}
console.log(`Basquiat: ${basquiat.elegida ? `con la pintura, reproducción «${basquiat.elegida.clave}»` : "sin la pintura (alternativa)"}`);

// Glenn: la misma elección que hará next.config.ts. Sus zonas son provisionales, así que
// una proporción distinta de la del lienzo solo avisa (ver glenn-reproducciones.json)
const glenn = elegirGlenn();
for (const d of glenn.descartes) console.log(`  · ${d}`);
if (glenn.publicaRechazada) {
  console.error("✗ La reproducción autorizada de Glenn está en public/obras pero no es válida (ver arriba).");
  process.exit(1);
}
if (glenn.elegida) {
  const { width, height } = await sharp(join(raiz, "public/obras", glenn.elegida.archivo)).metadata();
  const cal = REPRODUCCIONES_GLENN.calibracion;
  if (width !== glenn.elegida.width || height !== glenn.elegida.height) {
    console.error(`✗ ${glenn.elegida.archivo} mide ${width} × ${height}, no ${glenn.elegida.width} × ${glenn.elegida.height} como declara glenn-reproducciones.json.`);
    process.exit(1);
  }
  if (Math.abs(width / height / (cal.width / cal.height) - 1) > 0.02) {
    console.warn(`⚠ ${glenn.elegida.archivo} tiene otra proporción que el lienzo (${cal.width} × ${cal.height}): revisar las zonas.`);
  }
}
console.log(`Glenn: ${glenn.elegida ? `con la pintura, reproducción «${glenn.elegida.clave}»` : "sin la pintura (esquema)"}`);
const env = {
  ...process.env,
  MANIFESTO_DESTINO: "pages",
  MANIFESTO_BASE_PATH: base,
  // La entrada es el selector de las cinco obras (publicación simplificada)
  MANIFESTO_ENTRADA: process.env.MANIFESTO_ENTRADA ?? "selector",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? `https://epsilong21.github.io${base}`,
};

const OBRAS = ["medusa.jpg", "medusa-stuck.jpg", "noche-estrellada.jpg", ...(elegida ? [elegida.archivo] : []), ...(basquiat.elegida ? [basquiat.elegida.archivo] : []), ...(glenn.elegida ? [glenn.elegida.archivo] : [])];
const ANCHOS = JSON.parse(readFileSync(join(raiz, "src/lib/imagenAnchos.json"), "utf8"));

rmSync(out, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
const build = spawnSync(process.execPath, [join(raiz, "node_modules/next/dist/bin/next"), "build"], { stdio: "inherit", env });
if (build.status !== 0) process.exit(build.status ?? 1);

mkdirSync(join(out, "img"), { recursive: true });
for (const archivo of OBRAS) {
  const nombre = archivo.replace(/\.\w+$/, "");
  const origen = join(raiz, "public/obras", archivo);
  const { width } = await sharp(origen).metadata();
  for (const ancho of ANCHOS) {
    await sharp(origen)
      .resize({ width: Math.min(ancho, width) })
      .webp({ quality: 78 })
      .toFile(join(out, "img", `${nombre}-${ancho}.webp`));
  }
}
rmSync(join(out, "obras"), { recursive: true, force: true });

// Next 16.4 antepone basePath a las imágenes Open Graph por archivo aunque
// metadataBase ya incluya esa ruta (…/manifesto/manifesto/…). Las canónicas
// se componen bien, así que solo se corrige el prefijo duplicado.
const doble = new RegExp(`(https?://[^/"]+)${base}${base}/`, "g");
const corrige = (dir) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) corrige(p);
    else if (/\.(html|txt)$/.test(n)) {
      const t = readFileSync(p, "utf8");
      if (doble.test(t)) writeFileSync(p, t.replace(doble, `$1${base}/`));
      doble.lastIndex = 0;
    }
  }
};
corrige(out);

// Next 16.4 exporta los datos de precarga de cada segmento en carpetas
// (__next.conceptos/medusa/__PAGE__.txt), pero el cliente los pide con puntos
// (__next.conceptos.medusa.__PAGE__.txt): sin esta copia, cada precarga da 404.
const aplana = (dir) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (!statSync(p).isDirectory()) continue;
    if (!n.startsWith("__next.")) { aplana(p); continue; }
    const copia = (d, prefijo) => {
      for (const m of readdirSync(d)) {
        const q = join(d, m);
        if (statSync(q).isDirectory()) copia(q, `${prefijo}.${m}`);
        else writeFileSync(join(dir, `${prefijo}.${m}`), readFileSync(q));
      }
    };
    copia(p, n);
  }
};
aplana(out);
// Sin Jekyll: GitHub Pages ignoraría las carpetas que empiezan por «_» (_next)
writeFileSync(join(out, ".nojekyll"), "");

const marcas = [
  ...(elegida ? [`--elefantes=${elegida.archivo.replace(/\.\w+$/, "")}`] : []),
  ...(basquiat.elegida ? [`--basquiat=${basquiat.elegida.archivo.replace(/\.\w+$/, "")}`] : []),
  ...(glenn.elegida ? [`--glenn=${glenn.elegida.archivo.replace(/\.\w+$/, "")}`] : []),
  ...(publicacion ? ["--publicacion"] : []),
];
const verificacion = spawnSync(process.execPath, [join(raiz, "scripts/pages/verificar.mjs"), out, base, ...marcas], { stdio: "inherit" });
if (elegida?.clave === "referencia") {
  console.warn(
    REPRODUCCIONES.referencia.publicable
      ? "\n⚠ out/ contiene la reproducción de REFERENCIA de Los elefantes, SIN LICENCIA, publicable por decisión del titular del sitio (ver elefantes-reproducciones.json)."
      : "\n⚠ out/ contiene la reproducción de REFERENCIA de Los elefantes (sin licencia): solo para revisión local. NO publicar.",
  );
}
if (basquiat.elegida?.clave === "referencia") {
  console.warn("\n⚠ out/ contiene la reproducción de REFERENCIA de Basquiat (sin licencia): solo para revisión local. NO publicar.");
}
if (glenn.elegida?.clave === "referencia") {
  console.warn("\n⚠ out/ contiene la reproducción de REFERENCIA de Glenn (sin licencia): solo para revisión local. NO publicar.");
}
process.exit(verificacion.status ?? 1);
