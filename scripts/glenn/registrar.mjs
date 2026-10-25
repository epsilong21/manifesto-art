// Registra la reproducción de referencia de Glenn colocada en public/obras/glenn-referencia.jpg:
// escribe su ancho, alto y SHA-256 en src/content/glenn-reproducciones.json para que
// scripts/glenn/reproduccion.mjs la acepte. Solo toca la entrada «referencia», que nunca
// se publica. Uso: npm run glenn:registrar   (después, reiniciar next dev)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { REPRODUCCIONES, RUTA_REPRODUCCIONES } from "./reproduccion.mjs";

const r = REPRODUCCIONES.referencia;
const ruta = join(process.cwd(), "public/obras", r.archivo);
if (!existsSync(ruta)) {
  console.error(`✗ No existe public/obras/${r.archivo}. Coloca ahí la reproducción (JPEG) y vuelve a ejecutarlo.`);
  process.exit(1);
}
const { width, height, format } = await sharp(ruta).metadata();
if (format !== "jpeg") {
  console.error(`✗ public/obras/${r.archivo} no es un JPEG (formato: ${format}).`);
  process.exit(1);
}
const sha256 = createHash("sha256").update(readFileSync(ruta)).digest("hex");
REPRODUCCIONES.referencia = { ...r, width, height, sha256 };
writeFileSync(RUTA_REPRODUCCIONES, `${JSON.stringify(REPRODUCCIONES, null, 2)}\n`);

const cal = REPRODUCCIONES.calibracion;
const desvio = Math.abs(width / height / (cal.width / cal.height) - 1);
console.log(`✓ Registrada ${r.archivo}: ${width} × ${height} px, SHA-256 ${sha256.slice(0, 12)}…`);
console.log(`  Proporción ${(width / height).toFixed(3)} frente a ${(cal.width / cal.height).toFixed(3)} del lienzo (desvío ${(desvio * 100).toFixed(1)} %).`);
if (desvio > 0.02) console.warn("  ⚠ El encuadre no es el del lienzo completo (¿marco o recorte?): las zonas no coincidirán.");
if (width < 1600) console.warn("  ⚠ Resolución baja para el inspector: por encima de ese ancho la imagen se amplía.");
console.log("  Reinicia next dev y recalibra las zonas en /conceptos/glenn?calibrar.");
