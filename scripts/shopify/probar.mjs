// Prueba la web empaquetada ANTES de subirla a Shopify: la sirve en local como lo haría el tema y abre las 14 páginas en
// Chrome. Falla (código 1) si alguna no se «hidrata» (React no toma el control: se vería igual pero nada respondería), si
// da errores de JavaScript o si un archivo de assets no carga.
// Uso:  npm run shopify:probar            (necesita haber ejecutado shopify:empaquetar)
//       CHROME="ruta/a/chrome" npm run shopify:probar      si Chrome no está en un sitio habitual
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "../..");
const tema = process.env.TEMA ?? join(raiz, "shopify-tema"); // TEMA=otra carpeta: para probar la propia prueba
const PUERTO = 8197;
const CDP = 9397;
const HANDLES = [
  "obras", "obras-catalogo", "obra-medusa", "obra-noche-estrellada", "obra-los-elefantes", "obra-basquiat-untitled", "obra-glenn",
  "obra-ascension-al-empireo", "obra-el-descendimiento-de-la-cruz", "obra-la-loca-meg", "obra-los-siete-pecados-capitales",
  "obra-cristo-de-san-juan-de-la-cruz", "obras-aviso-legal", "obras-privacidad",
];
if (!existsSync(join(tema, "templates", "page.obras.liquid"))) {
  console.error("✗ No hay shopify-tema/: ejecuta antes npm run shopify:empaquetar");
  process.exit(1);
}

const CANDIDATOS = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const chromePath = CANDIDATOS.find((c) => existsSync(c));
if (!chromePath) {
  console.error("✗ No encuentro Chrome para la prueba. Indica su ruta con CHROME=… (o usa --sin-probar en shopify:publicar bajo tu responsabilidad).");
  process.exit(1);
}

// ── Servidor que imita lo mínimo de Shopify: el Liquid que usamos y la carpeta de assets ──
const BASE = `//localhost:${PUERTO}/assets/`;
const TIPOS = { ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg" };
const liquid = (t) =>
  t
    .replace(/\{% layout none %\}/g, "")
    .replace(/\{% assign b = [^%]*%\}/g, "")
    .replace(/\{% (end)?raw %\}/g, "")
    .replace(/\{\{ b \| json \}\}/g, JSON.stringify(BASE))
    .replace(/\{\{ b \}\}/g, BASE)
    .replace(/\{\{ '([^']+)' \| asset_url \}\}/g, (_, n) => `${BASE}${n}?v=1`);
const servidor = createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname.startsWith("/assets/")) {
    const f = join(tema, "assets", decodeURIComponent(url.pathname.slice(8)));
    if (!existsSync(f)) return (res.writeHead(404), res.end("no"));
    res.writeHead(200, { "content-type": TIPOS[extname(f)] ?? "application/octet-stream" });
    return res.end(readFileSync(f));
  }
  const m = url.pathname.match(/^\/p\/([\w-]+)$/);
  const f = m && join(tema, "templates", `page.${m[1]}.liquid`);
  if (!f || !existsSync(f)) return (res.writeHead(404), res.end("no"));
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(liquid(readFileSync(f, "utf8")));
});
await new Promise((r) => servidor.listen(PUERTO, r));

// ── Chrome por CDP ──
const perfil = mkdtempSync(join(tmpdir(), "msto-probar-"));
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${CDP}`, "--window-size=1400,900", `--user-data-dir=${perfil}`, "about:blank"], { stdio: "ignore" });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let objetivos;
for (let i = 0; i < 60; i++) {
  try {
    objetivos = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json();
    if (objetivos.length) break;
  } catch {}
  await esperar(250);
}
const ws = new WebSocket(objetivos.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
let problemas = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) pend.get(m.id)(m);
  if (m.method === "Runtime.exceptionThrown") problemas.push("excepción: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 200));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") problemas.push("console.error: " + m.params.args.map((x) => x.value ?? x.description ?? "").join(" ").slice(0, 200));
  if (m.method === "Network.responseReceived" && m.params.response.status >= 400 && m.params.response.url.includes("/assets/")) problemas.push(`${m.params.response.status} ${m.params.response.url.split("/").pop()}`);
};
const cmd = (method, params = {}) => new Promise((r) => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });
await cmd("Runtime.enable");
await cmd("Network.enable");
await cmd("Page.enable");

const COMPRUEBA = `(() => {
  let controladores = 0;
  for (const e of document.querySelectorAll("*")) {
    const k = Object.keys(e).find((x) => x.startsWith("__reactProps"));
    if (k) controladores += Object.keys(e[k]).filter((x) => /^on[A-Z]/.test(x)).length;
  }
  return { controladores, raiz: Object.keys(document).some((k) => k.startsWith("__reactContainer")), nextfPendiente: self.__next_f ? self.__next_f.length : -1 };
})()`;

let fallos = 0;
console.log("Probando las 14 páginas empaquetadas (como las serviría Shopify)…\n");
for (const h of HANDLES) {
  problemas = [];
  await cmd("Page.navigate", { url: `http://localhost:${PUERTO}/p/${h}?view=${h}` });
  await esperar(4500);
  const r = await cmd("Runtime.evaluate", { expression: COMPRUEBA, returnByValue: true });
  const v = r.result?.result?.value ?? {};
  const ok = v.raiz && v.controladores > 0 && v.nextfPendiente === 0 && problemas.length === 0;
  if (!ok) fallos++;
  console.log(`${ok ? "✓" : "✗"} ${h.padEnd(36)} controladores: ${String(v.controladores ?? "?").padStart(3)}  ${v.raiz ? "" : "(React no arrancó) "}${problemas.slice(0, 2).join(" | ")}`);
}

ws.close();
chrome.kill();
servidor.close();
await esperar(300);
rmSync(perfil, { recursive: true, force: true });
if (fallos) {
  console.error(`\n✗ ${fallos} página(s) no pasan la prueba: NO se debe subir a Shopify.`);
  process.exit(1);
}
console.log("\n✓ Las 14 páginas se hidratan y no dan errores");
process.exit(0);
