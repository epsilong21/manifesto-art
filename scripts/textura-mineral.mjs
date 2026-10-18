// Genera public/texturas/mineral.png: textura pétrea repetible (gris + alfa).
// Píxeles claros y oscuros con alfa variable: se pinta encima del degradado sin modos de fusión.
// Uso: node scripts/textura-mineral.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const N = 160;
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Ruido de valor periódico (se repite sin costuras cada N píxeles)
function capa(celdas) {
  const g = Array.from({ length: celdas * celdas }, rnd);
  const at = (x, y) => g[((y + celdas) % celdas) * celdas + ((x + celdas) % celdas)];
  const s = (t) => t * t * (3 - 2 * t);
  return (px, py) => {
    const x = (px / N) * celdas, y = (py / N) * celdas;
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = s(x - x0), fy = s(y - y0);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
    return a + (b - a) * fy;
  };
}
const manchas = capa(5), poro = capa(20), grano = capa(80);

const raw = Buffer.alloc(N * (1 + N * 2));
for (let y = 0; y < N; y++) {
  raw[y * (1 + N * 2)] = 0;
  for (let x = 0; x < N; x++) {
    // Estratos casi horizontales + manchas + poro + grano fino
    const estrato = Math.sin((y / N) * Math.PI * 2 * 6 + manchas(x, y) * 3.2) * 0.22;
    let v = (manchas(x, y) - 0.5) * 0.5 + (poro(x, y) - 0.5) * 0.55 + (grano(x, y) - 0.5) * 0.7 + estrato;
    v += (rnd() - 0.5) * 0.35;
    const o = y * (1 + N * 2) + 1 + x * 2;
    raw[o] = v > 0 ? 255 : 0;
    raw[o + 1] = Math.min(255, Math.round(Math.abs(v) * 150));
  }
}
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 4; // gris + alfa
mkdirSync("public/texturas", { recursive: true });
writeFileSync("public/texturas/mineral.png", Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0)),
]));
console.log("ok");
