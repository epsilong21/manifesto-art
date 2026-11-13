/**
 * «El negativo del cuerpo»: geometría de la sala y texturas de los planos (Canvas 2D, se generan una vez por tamaño).
 *
 * Una lámpara baja, delante y por debajo del encuadre, proyecta los tres planos sobre el muro. La sombra de cada plano es su
 * silueta escalada desde la lámpara (factor s: más grande cuanto más cerca de la lámpara). Los fragmentos de cada plano se
 * calculan a la inversa desde la figura del muro, así que solo en la posición «objetivo» las tres sombras la componen.
 */
import { figura, mancha, rng, type P } from "./formas";

export type Geometria = {
  W: number; H: number; U: number; cx: number; Y0: number;
  /** Lámpara (px de la escena). */
  L: P;
  /** Escala de la sombra de cada plano (delantero → trasero). */
  s: number[];
  /** Posición horizontal de cada plano (en U) en la que las sombras componen la figura. */
  objetivo: number[];
  /** Píxeles de textura por píxel CSS. */
  q: number;
};

export type Plano = {
  tex: HTMLCanvasElement;
  sombra: HTMLCanvasElement;
  sombraSuave: HTMLCanvasElement;
  /** La silueta difusa en luz cálida (separa el plano del muro). */
  halo: HTMLCanvasElement;
  /** Los dos enganches de los cables (local). */
  enganches: [P, P];
  /** Rectángulo de la textura en coordenadas locales (px CSS, con el plano en su posición objetivo). */
  ox: number; oy: number; w: number; h: number;
  /** Punto de suspensión (local). */
  ancla: P;
  /** Máscara para saber si el puntero toca el plano (1 byte cada 4 px CSS). */
  hit: Uint8Array; hw: number; hh: number;
  /** Rectángulo de la membrana (local): el puntero la agarra aunque toque una zona casi transparente. */
  mem: [number, number, number, number];
};

export const OBJETIVO = [0.03, -0.02, 0.012];
/** La lámpara está en el suelo, muy cerca de los planos: sus sombras crecen dos o tres veces y suben por el muro. */
export const ESCALAS = [3.0, 2.55, 2.15];

export function geometria(W: number, H: number, q: number): Geometria {
  const U = Math.min(W / 1.0, H / 1.3);
  const Y0 = Math.max(0.04 * H, (H - 1.3 * U) / 2 + 0.09 * U);
  const cx = W / 2;
  return { W, H, U, cx, Y0, L: [cx + 0.02 * U, Y0 + 1.22 * U], s: ESCALAS, objetivo: OBJETIVO, q };
}

/** Línea del suelo (unión del muro con el suelo), por detrás de los planos. */
export const sueloY = (g: Geometria) => g.Y0 + 1.1 * g.U;

/** Del muro (unidades de figura) a la vista del plano i (px), con el plano en su posición objetivo. */
export function muroAPlano(g: Geometria, i: number, p: P): P {
  const wx = g.cx + p[0] * g.U, wy = g.Y0 + p[1] * g.U;
  const s = g.s[i];
  return [g.L[0] + (wx - g.L[0]) / s - g.objetivo[i] * g.U, g.L[1] + (wy - g.L[1]) / s];
}

// ── Ruido de valor periódico (una baldosa de 128×128 para todo) ──
export type Ruido = (x: number, y: number) => number;
export function crearRuido(seed: number): Ruido {
  const N = 128, M = N - 1;
  const r = rng(seed);
  const g = new Float32Array(N * N);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const vn = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    let fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const x0 = xi & M, y0 = yi & M, x1 = (xi + 1) & M, y1 = (yi + 1) & M;
    const a = g[y0 * N + x0], b = g[y0 * N + x1], c = g[y1 * N + x0], d = g[y1 * N + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  return (x, y) => 0.55 * vn(x, y) + 0.3 * vn(2.03 * x + 17.1, 2.03 * y + 5.3) + 0.15 * vn(4.1 * x + 3.7, 4.1 * y + 29.9);
}

function lienzo(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Desenfoque de caja separable sobre un canal (dos pasadas ≈ gaussiano). */
function desenfocar(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const rr = Math.max(1, Math.round(r));
  let a = src, b = new Float32Array(src.length);
  for (let pase = 0; pase < 2; pase++) {
    for (let y = 0; y < h; y++) {
      let s = 0;
      const o = y * w;
      for (let x = -rr; x <= rr; x++) s += a[o + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        b[o + x] = s / (2 * rr + 1);
        s += a[o + Math.min(w - 1, x + rr + 1)] - a[o + Math.max(0, x - rr)];
      }
    }
    const c = new Float32Array(src.length);
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -rr; y <= rr; y++) s += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        c[y * w + x] = s / (2 * rr + 1);
        s += b[Math.min(h - 1, y + rr + 1) * w + x] - b[Math.max(0, y - rr) * w + x];
      }
    }
    a = c; b = new Float32Array(src.length);
  }
  return a;
}

function alfa(ctx: CanvasRenderingContext2D, w: number, h: number): Float32Array {
  const d = ctx.getImageData(0, 0, w, h).data;
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] / 255;
  return out;
}

function trazar(ctx: CanvasRenderingContext2D, pts: P[]) {
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
  ctx.closePath();
}

/** Contorno de membrana: un rectángulo vertical con bordes vivos, desgarros abajo y un borde superior cosido al cable. */
function membrana(x0: number, y0: number, x1: number, y1: number, U: number, seed: number): P[] {
  const r = rng(seed);
  const pts: P[] = [];
  const lado = (ax: number, ay: number, bx: number, by: number, n: number, amp: number, desgarro: number) => {
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny) || 1;
      let d = (r() - 0.5) * amp + Math.sin(t * 9 + seed) * amp * 0.6;
      d += Math.sin(t * 3.1 + seed * 0.7) * amp * 1.4; // el borde se comba, no es recto
      if (desgarro && r() < desgarro) d -= r() * amp * 4; // muesca: el borde se rasga hacia dentro
      pts.push([ax + (bx - ax) * t + (nx / l) * d, ay + (by - ay) * t + (ny / l) * d]);
    }
  };
  const a = 0.022 * U;
  lado(x0, y0, x1, y0, 16, a * 0.5, 0);
  lado(x1, y0, x1, y1, 34, a * 1.2, 0.08);
  lado(x1, y1, x0, y1, 26, a * 1.8, 0.3);
  lado(x0, y1, x0, y0, 34, a * 1.2, 0.08);
  return pts;
}

/** Cede el hilo principal cada ~10 ms: la preparación no produce tareas largas. */
export function cronometro(respiro: () => Promise<void>): () => Promise<void> {
  let t = performance.now();
  return async () => {
    if (performance.now() - t < 10) return;
    await respiro();
    t = performance.now();
  };
}

/**
 * Genera la textura, las sombras, el halo y la máscara de un plano (0 delantero, 1 medio, 2 trasero).
 * La membrana es una piel tensada entre dos enganches: el borde superior se comba entre ellos, la tensión abre pliegues en
 * abanico hacia abajo, el borde es grueso y seco, y una luz lateral (desde la izquierda) dibuja el canto que mira hacia ella.
 */
export async function generarPlano(i: number, g: Geometria, ruido: Ruido, respiro: () => Promise<void>): Promise<Plano> {
  const { U, q } = g;
  const pausa = cronometro(respiro);
  const frags = figura()[i].map((f) => f.map((c) => ({ hueco: !!c.hueco, pts: c.pts.map((p) => muroAPlano(g, i, p)) })));
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (const f of frags) for (const c of f) if (!c.hueco) for (const [x, y] of c.pts) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
  // Membrana: vertical, apenas más ancha que sus fragmentos, colgada un poco por encima
  let mx0 = bx0 - 0.035 * U, mx1 = bx1 + 0.035 * U;
  const minAncho = 0.17 * U;
  if (mx1 - mx0 < minAncho) { const c = (mx0 + mx1) / 2; mx0 = c - minAncho / 2; mx1 = c + minAncho / 2; }
  const my0 = Math.max(0.03 * g.H, by0 - 0.05 * U);
  const my1 = Math.min(g.H - 0.02 * U, Math.max(by1 + 0.05 * U, my0 + (mx1 - mx0) * 1.25));
  const comba = 0.028 * U;
  // margen transparente amplio: las sombras difusas (reducidas y ampliadas) se apagan antes del borde de la textura
  const m = Math.max(28, 0.07 * U);
  const ox = Math.min(mx0, bx0) - m, oy = Math.min(my0, by0) - m;
  const w = Math.max(mx1, bx1) + m - ox, h = Math.max(my1, by1) + m - oy;
  const tw = Math.max(2, Math.ceil(w * q)), th = Math.max(2, Math.ceil(h * q));
  const anchoM = mx1 - mx0, altoM = my1 - my0;
  // Los dos enganches de los cables
  const e0: P = [mx0 + 0.1 * anchoM, my0 + 0.004 * U], e1: P = [mx1 - 0.1 * anchoM, my0 + 0.004 * U];

  const c = lienzo(tw, th);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const local = () => { ctx.setTransform(q, 0, 0, q, -ox * q, -oy * q); };
  // a) fragmentos
  local();
  ctx.fillStyle = "#fff";
  for (const f of frags) { ctx.beginPath(); for (const k of f) trazar(ctx, k.pts); ctx.fill("evenodd"); }
  const Ff = alfa(ctx, tw, th);
  await pausa();
  // b) membrana con sus huecos (el borde superior se comba entre los enganches)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, tw, th);
  local();
  const contorno = membrana(mx0, my0, mx1, my1, U, 101 + i * 17).map(([x, y]): P => {
    if (y > my0 + 0.02 * U) return [x, y];
    const t = Math.min(1, Math.max(0, (x - e0[0]) / (e1[0] - e0[0])));
    return [x, y + comba * Math.sin(Math.PI * t)];
  });
  ctx.beginPath(); trazar(ctx, contorno); ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  const r = rng(300 + i * 31);
  const nh = 3 + Math.floor(r() * 3);
  for (let k = 0; k < nh; k++) {
    const hx = mx0 + (0.15 + 0.7 * r()) * anchoM, hy = my0 + (0.2 + 0.72 * r()) * altoM;
    const alargado = r() < 0.6;
    ctx.beginPath();
    trazar(ctx, mancha(hx, hy, (alargado ? 0.008 : 0.02 + 0.02 * r()) * U, (alargado ? 0.04 + 0.05 * r() : 0.018 + 0.02 * r()) * U, (r() - 0.5) * 0.5, 0.35, 400 + k + i * 13, 40));
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  const Fm = alfa(ctx, tw, th);
  await pausa();
  // c) relieve de los fragmentos y grosor del borde de la membrana
  const Hb = desenfocar(Ff, tw, th, 3 * q);
  await pausa();
  const Mb = desenfocar(Fm, tw, th, 4 * q);
  await pausa();

  const img = ctx.createImageData(tw, th);
  const sim = ctx.createImageData(tw, th);
  const D = img.data, S = sim.data;
  const dk = [1, 0.86, 0.72][i];
  const kU = 1 / U;
  const nPl = 5 + i;
  for (let y = 0; y < th; y++) {
    const ly = oy + y / q;
    const vy = Math.min(1, Math.max(0, (ly - my0) / altoM));
    const luz = (0.68 + 0.9 * Math.pow(vy, 1.2)) * dk;
    // pliegues de tensión: nacen arriba, entre los enganches, y se abren y se suavizan hacia abajo
    const ampP = 0.18 + 0.82 * Math.pow(1 - vy, 1.6);
    for (let x = 0; x < tw; x++) {
      const j = y * tw + x;
      const fm = Fm[j], ff = Ff[j];
      if (fm < 0.004 && ff < 0.004) continue;
      const lx = ox + x / q;
      const u = (lx - mx0) / anchoM;
      const n1 = ruido(lx * kU * 9, ly * kU * 9);
      const fib = ruido(lx * kU * 55 + 37, ly * kU * 4);
      const n2 = ruido(lx * kU * 33 + 11, ly * kU * 33 + 5);
      const fase = ((u - 0.5) * Math.PI * nPl) / (0.3 + 0.9 * vy) + 1.4 * Math.sin(vy * 5 + i * 1.7) + (n1 - 0.5) * 2;
      const pl = ampP * Math.sin(fase);
      const plL = ampP * Math.cos(fase); // pendiente: el lado del pliegue que mira a la luz lateral
      // Borde: grueso y seco; la cara que mira a la izquierda recibe la luz lateral
      const borde = Math.min(1, Math.max(0, (0.86 - Mb[j]) * 2.3)) * fm;
      const gxM = Mb[y * tw + Math.min(tw - 1, x + 1)] - Mb[y * tw + Math.max(0, x - 1)];
      const canto = Math.min(1, Math.max(0, 0.45 + 7 * gxM));
      // Transparencia variable: más espesa en los valles de los pliegues y en las vetas
      let am = fm * Math.min(0.62, Math.max(0.1, 0.21 + 0.28 * (n1 - 0.3) + 0.24 * (fib - 0.5) + 0.07 * (n2 - 0.5) + 0.13 * Math.max(0, -pl)));
      am = Math.min(0.9, Math.max(am, 0.62 * borde));
      const t = Math.min(1, Math.max(0, (n1 - 0.35) / 0.4));
      const v = 0.5 + 0.5 * fib;
      let mr = (185 + (96 - 185) * t) * v, mg = (166 + (52 - 166) * t) * v, mb = (136 + (40 - 136) * t) * v;
      // la luz de abajo atraviesa la piel fina: se calienta
      mr += 70 * (1 - am) * vy; mg += 22 * (1 - am) * vy; mb += 8 * (1 - am) * vy;
      const lateral = (0.82 + 0.34 * (1 - u)) * (1 + 0.3 * plL);
      mr *= luz * lateral; mg *= luz * lateral; mb *= luz * lateral;
      // canto: hueso iluminado en el lado de la luz, seco y oscuro en el otro
      const cr = 92 + (238 - 92) * canto, cg = 40 + (206 - 40) * canto, cb = 30 + (166 - 30) * canto;
      const kb = 0.75 * borde;
      mr += (cr * luz - mr) * kb; mg += (cg * luz - mg) * kb; mb += (cb * luz - mb) * kb;
      // Fragmento: materia densa con relieve; la lámpara de abajo ilumina las caras que miran hacia abajo
      let fr = 0, fg = 0, fb = 0;
      if (ff > 0.004) {
        const gy = Hb[Math.min(th - 1, y + 1) * tw + x] - Hb[Math.max(0, y - 1) * tw + x];
        const gx = Hb[y * tw + Math.min(tw - 1, x + 1)] - Hb[y * tw + Math.max(0, x - 1)];
        const lit = Math.min(1.6, Math.max(0.22, 0.55 - 3.6 * gy + 1.2 * gx));
        const uu = Math.min(1, 0.8 * n2 + 0.2 * n1);
        const grosor = 1 - 0.28 * Hb[j];
        const k = lit * grosor * (0.75 + 0.5 * vy) * dk;
        fr = (120 + (205 - 120) * uu) * k; fg = (44 + (172 - 44) * uu) * k; fb = (32 + (138 - 32) * uu) * k;
      }
      const af = ff * 0.98;
      const A = Math.max(am, af);
      const o = j * 4;
      const mez = A > 0 ? af / A : 0;
      D[o] = mr + (fr - mr) * mez; D[o + 1] = mg + (fg - mg) * mez; D[o + 2] = mb + (fb - mb) * mez; D[o + 3] = A * 255;
      // sombra: los fragmentos, casi opacos; la piel, un velo con sus pliegues y su borde
      const as = Math.max(fm * (0.05 + 0.1 * n1 + 0.08 * Math.max(0, -pl) + 0.42 * borde), ff * 0.97);
      S[o] = 9; S[o + 1] = 4; S[o + 2] = 3; S[o + 3] = as * 255;
    }
    if ((y & 7) === 7) await pausa();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.putImageData(img, 0, 0);
  await pausa();
  // Sombra a dos nitideces: al reducir y volver a ampliar, el muestreo bilineal hace de penumbra
  const sf = lienzo(tw, th);
  sf.getContext("2d")!.putImageData(sim, 0, 0);
  const sombra = lienzo(tw * 0.5, th * 0.5);
  sombra.getContext("2d")!.drawImage(sf, 0, 0, sombra.width, sombra.height);
  const medio = lienzo(tw * 0.25, th * 0.25);
  medio.getContext("2d")!.drawImage(sombra, 0, 0, medio.width, medio.height);
  const sombraSuave = lienzo(tw * 0.1, th * 0.1);
  sombraSuave.getContext("2d")!.drawImage(medio, 0, 0, sombraSuave.width, sombraSuave.height);
  // Halo: la silueta difusa en luz cálida, para separar el plano del muro (y marcarlo al tocarlo)
  const halo = lienzo(sombraSuave.width, sombraSuave.height);
  const hc = halo.getContext("2d")!;
  hc.drawImage(sombraSuave, 0, 0);
  hc.globalCompositeOperation = "source-in";
  hc.fillStyle = "rgb(255,196,132)";
  hc.fillRect(0, 0, halo.width, halo.height);
  // Máscara de contacto (1 cada 4 px CSS)
  const hw = Math.max(1, Math.ceil(w / 4)), hh = Math.max(1, Math.ceil(h / 4));
  const hit = new Uint8Array(hw * hh);
  for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) {
    const sx = Math.min(tw - 1, Math.floor(x * 4 * q)), sy = Math.min(th - 1, Math.floor(y * 4 * q));
    hit[y * hw + x] = D[(sy * tw + sx) * 4 + 3];
  }
  return { tex: c, sombra, sombraSuave, halo, ox, oy, w, h, ancla: [(mx0 + mx1) / 2, my0], enganches: [e0, e1], hit, hw, hh, mem: [mx0, my0, mx1, my1] };
}

/** El muro: yeso sucio iluminado desde abajo por la lámpara (a media resolución; se amplía al dibujar). */
export async function generarMuro(g: Geometria, ruido: Ruido, respiro: () => Promise<void>): Promise<HTMLCanvasElement> {
  const pausa = cronometro(respiro);
  const f = 0.5;
  const w = Math.max(2, Math.ceil(g.W * f)), h = Math.max(2, Math.ceil(g.H * f));
  const c = lienzo(w, h);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const D = img.data;
  const kU = 1 / g.U;
  const ys = sueloY(g);
  for (let y = 0; y < h; y++) {
    const ly = y / f;
    const suelo = ly > ys;
    if ((y & 7) === 7) await pausa();
    for (let x = 0; x < w; x++) {
      const lx = x / f;
      const o = (y * w + x) * 4;
      if (suelo) {
        // Suelo de piedra: un charco de luz alrededor de la lámpara
        const n = ruido(lx * kU * 7 + 41, ly * kU * 22 + 3);
        const d = Math.hypot((lx - g.L[0]) * 0.55, (ly - g.L[1]) * 1.6) * kU;
        const I = 1 / (1 + Math.pow(d / 0.32, 2.4));
        const k = (0.75 + 0.35 * n) * (0.1 + 1.3 * I) * (1 - 0.25 * Math.exp(-(ly - ys) * kU * 40));
        D[o] = 30 * k + 30 * I; D[o + 1] = 23 * k + 15 * I; D[o + 2] = 18 * k + 6 * I; D[o + 3] = 255;
        continue;
      }
      const n = ruido(lx * kU * 12 + 3, ly * kU * 12 + 7);
      const veta = ruido(lx * kU * 50 + 13, ly * kU * 1.6 + 2);
      const d = Math.hypot(lx - g.L[0], ly - g.L[1]) * kU;
      const I = 1 / (1 + Math.pow(d / 1.25, 2));
      // el muro recibe la luz rasante de abajo; junto al suelo, una franja más oscura (el rincón)
      const rincon = (1 - 0.45 * Math.exp(-(ys - ly) * kU * 30)) * (1 - 0.42 * Math.exp(-(ys - ly) * kU * 4.5));
      const k = (0.74 + 0.36 * n) * (0.9 + 0.14 * veta) * (0.14 + 1.5 * I) * rincon;
      D[o] = 62 * k + 40 * I; D[o + 1] = 50 * k + 20 * I; D[o + 2] = 41 * k + 8 * I; D[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
