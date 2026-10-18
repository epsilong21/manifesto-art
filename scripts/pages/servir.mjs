// Servidor estático que imita GitHub Pages: out/ montado en el basePath. Uso: npm run preview:pages
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
const [raiz, base = "/manifesto-art", port = 4010] = process.argv.slice(2);
const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const envia = (res, f, estado = 200) => { res.writeHead(estado, { "Content-Type": tipos[extname(f)] ?? "application/octet-stream" }); createReadStream(f).pipe(res); };
createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (!url.pathname.startsWith(base + "/") && url.pathname !== base) return envia(res, join(raiz, "404.html"), 404);
  const rel = decodeURIComponent(url.pathname.slice(base.length)) || "/";
  const f = normalize(join(raiz, rel));
  if (!f.startsWith(normalize(raiz))) { res.writeHead(403); return res.end(); }
  if (existsSync(f) && statSync(f).isDirectory()) {
    if (!url.pathname.endsWith("/")) { res.writeHead(301, { Location: url.pathname + "/" + url.search }); return res.end(); }
    if (existsSync(join(f, "index.html"))) return envia(res, join(f, "index.html"));
  }
  if (existsSync(f) && statSync(f).isFile()) return envia(res, f);
  if (existsSync(f + ".html")) return envia(res, f + ".html");
  envia(res, join(raiz, "404.html"), 404);
}).listen(Number(port), () => console.log(`Pages local: http://localhost:${port}${base}/`));
