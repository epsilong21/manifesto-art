// Exportación estática de MANIFESTO para GitHub Pages.
// Uso: npm run build:pages   (genera out/ y lo verifica)
//
// - Fuerza MANIFESTO_ELEFANTES_IMAGEN=off: la reproducción de Dalí nunca entra en el sitio.
// - Genera las variantes WebP de las obras que usa src/lib/imagenEstatica.ts.
// - Quita de out/ todo /obras (originales, Dante y, si existiera en local, la referencia de Dalí).
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const raiz = process.cwd();
const out = join(raiz, "out");
// Destino por defecto: https://epsilong21.github.io/manifesto-art/
const base = process.env.MANIFESTO_BASE_PATH ?? "/manifesto-art";
const env = {
  ...process.env,
  MANIFESTO_DESTINO: "pages",
  MANIFESTO_BASE_PATH: base,
  MANIFESTO_ELEFANTES_IMAGEN: "off",
  // La entrada es el selector de tres obras (publicación simplificada)
  MANIFESTO_ENTRADA: process.env.MANIFESTO_ENTRADA ?? "selector",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? `https://epsilong21.github.io${base}`,
};

/** Solo las obras que el sitio público puede mostrar. */
const OBRAS = ["medusa.jpg", "noche-estrellada.jpg"];
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

const verificacion = spawnSync(process.execPath, [join(raiz, "scripts/pages/verificar.mjs"), out, base], { stdio: "inherit" });
process.exit(verificacion.status ?? 1);
