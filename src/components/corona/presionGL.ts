/**
 * Acto III · «El peso»: corona de espinas en WebGL2 (geometría rasterizada).
 *
 * Tres ramas gruesas retorcidas en haz, dos ramas finas que las envuelven en
 * sentido contrario, ramas sueltas que rompen la silueta, tocones y espinas
 * curvas. El anillo no es un toro: ondula, se ovala y se estrecha donde las
 * ramas se aprietan. El parámetro `presion` (0–1) lo aplasta en un óvalo,
 * lo retuerce, lo hace pandear y cierra las espinas hacia el centro.
 */

type V3 = [number, number, number];

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function v3add(a: V3, b: V3): V3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function v3sub(a: V3, b: V3): V3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function v3scale(v: V3, s: number): V3 { return [v[0] * s, v[1] * s, v[2] * s]; }
function v3dot(a: V3, b: V3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function v3cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function v3len(v: V3): number { return Math.sqrt(v3dot(v, v)); }
function v3norm(v: V3): V3 {
  const l = v3len(v);
  return l > 1e-6 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 1, 0];
}

function mat4Persp(fov: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fov * 0.5);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function mat4Look(eye: V3, at: V3, up: V3): Float32Array {
  const z = v3norm(v3sub(eye, at));
  const x = v3norm(v3cross(up, z));
  const y = v3cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -v3dot(x, eye), -v3dot(y, eye), -v3dot(z, eye), 1,
  ]);
}

function mat4Mul(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[i + k * 4] * b[k + j * 4];
      o[i + j * 4] = s;
    }
  return o;
}

// ── Configuración de la corona ──────────────────────────────

const R0 = 0.56;
const SEGS = 150;
const PERFIL = 12;
const DT = 0.0008;

function hash(n: number): number { return ((Math.sin(n * 12.9898) * 43758.5453) % 1 + 1) % 1; }

interface Hebra {
  frec: number;
  fase: number;
  a: number;
  r: number;
  sem: number;
  start: number;
  len: number;
  espinas: number;
  nudos: number[];
}

const HEBRAS: Hebra[] = [
  { frec: 3, fase: 0.0, a: 0.062, r: 0.052, sem: 1.3, start: 0, len: 1, espinas: 8, nudos: [0.9, 2.7, 4.6] },
  { frec: 3, fase: 2.09, a: 0.064, r: 0.047, sem: 2.9, start: 0, len: 1, espinas: 9, nudos: [1.6, 3.8, 5.5] },
  { frec: 3, fase: 4.19, a: 0.06, r: 0.05, sem: 4.1, start: 0, len: 1, espinas: 8, nudos: [0.3, 3.2, 5.0] },
  { frec: 5, fase: 0.9, a: 0.1, r: 0.026, sem: 5.7, start: 0, len: 1, espinas: 7, nudos: [2.1, 4.2] },
  { frec: -4, fase: 2.2, a: 0.105, r: 0.024, sem: 7.2, start: 0, len: 1, espinas: 7, nudos: [1.0, 5.2] },
  { frec: 2, fase: 0.4, a: 0.16, r: 0.022, sem: 8.8, start: 0.5, len: 0.9, espinas: 5, nudos: [] },
  { frec: 2, fase: 3.1, a: 0.19, r: 0.02, sem: 9.9, start: 3.4, len: 1.0, espinas: 5, nudos: [] },
  { frec: 1, fase: 5.0, a: 0.15, r: 0.02, sem: 11.3, start: 5.0, len: 0.8, espinas: 4, nudos: [] },
];

function eje(th: number): V3 {
  const R = R0 * (1 + 0.075 * Math.sin(2 * th + 0.6) + 0.045 * Math.sin(3 * th + 2.1) + 0.02 * Math.sin(5 * th + 1.0));
  return [
    R * Math.cos(th),
    0.075 * Math.sin(2 * th + 0.3) + 0.04 * Math.sin(3 * th + 1.7),
    0.9 * R * Math.sin(th),
  ];
}

interface Marco { P: V3; T: V3; Nr: V3; B: V3 }

function marco(th: number): Marco {
  const P = eje(th);
  const T = v3norm(v3sub(eje(th + DT), eje(th - DT)));
  let Nr = v3norm(v3cross([0, 1, 0], T));
  if (v3dot(Nr, [P[0], 0, P[2]]) < 0) Nr = v3scale(Nr, -1);
  const B = v3norm(v3cross(T, Nr));
  return { P, T, Nr, B };
}

function centroHebra(th: number, h: Hebra, M: Marco): V3 {
  const phi = h.frec * th + h.fase + 0.55 * Math.sin(2 * th + h.sem);
  const a = h.a * (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(3 * th + h.sem * 1.7)));
  return v3add(M.P, v3add(v3scale(M.Nr, Math.cos(phi) * a), v3scale(M.B, Math.sin(phi) * a)));
}

function angDiff(a: number, b: number): number {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function radioHebra(th: number, h: Hebra): number {
  let r = h.r * (1 + 0.18 * Math.sin(th * 11 + h.sem * 3) + 0.07 * Math.sin(th * 23 + h.sem * 5));
  for (const k of h.nudos) {
    const d = angDiff(th, k) / 0.13;
    r *= 1 + 0.55 * Math.exp(-d * d);
  }
  if (h.len < 1) {
    const s = Math.min(1, Math.max(0, (th - h.start) / (h.len * TAU)));
    r *= 0.18 + 0.82 * Math.pow(Math.sin(Math.PI * s), 0.55);
  }
  return r;
}

// ── Generación de la malla ──────────────────────────────────

function generarCorona() {
  const pos: number[] = [];
  const cen: number[] = [];
  const meta: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];

  function addV(p: V3, c: V3, ao: number, thorn: number, seed: number, u: number, v: number): number {
    pos.push(p[0], p[1], p[2]);
    cen.push(c[0], c[1], c[2]);
    meta.push(ao, thorn, seed);
    uv.push(u, v);
    return pos.length / 3 - 1;
  }

  function espina(
    root: V3, dir: V3, bendTo: V3, len: number, base: number, tipR: number,
    seed: number, thRoot: number,
  ) {
    const RINGS = 6;
    const SIDES = 6;
    const bendV = v3norm(v3sub(bendTo, v3scale(dir, v3dot(bendTo, dir))));
    const first = pos.length / 3;
    for (let k = 0; k <= RINGS; k++) {
      const t = k / RINGS;
      const Q = v3add(v3add(root, v3scale(dir, len * t)), v3scale(bendV, len * 0.3 * t * t));
      const q = v3norm(v3add(v3scale(dir, len), v3scale(bendV, len * 0.6 * t)));
      const ref: V3 = Math.abs(q[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const e1 = v3norm(v3cross(q, ref));
      const e2 = v3cross(q, e1);
      const rad = base * Math.pow(1 - t, 0.9) + tipR * t;
      for (let j = 0; j < SIDES; j++) {
        const a = (j / SIDES) * TAU;
        const d = v3add(v3scale(e1, Math.cos(a)), v3scale(e2, Math.sin(a)));
        addV(v3add(Q, v3scale(d, rad)), Q, 0.5 + 0.5 * t, 0.05 + 0.95 * t, seed, thRoot + t * 0.02, a);
      }
    }
    for (let k = 0; k < RINGS; k++) {
      const p0 = first + k * SIDES;
      const p1 = p0 + SIDES;
      for (let j = 0; j < SIDES; j++) {
        const j2 = (j + 1) % SIDES;
        idx.push(p0 + j, p0 + j2, p1 + j, p1 + j, p0 + j2, p1 + j2);
      }
    }
  }

  for (const h of HEBRAS) {
    const seed = hash(h.sem);
    const b0 = pos.length / 3;
    const frames: { M: Marco; C: V3; T: V3; rr: number; th: number }[] = [];

    for (let s = 0; s <= SEGS; s++) {
      const th = h.start + h.len * TAU * (s / SEGS);
      const M = marco(th);
      const C = centroHebra(th, h, M);
      const T = v3norm(v3sub(
        centroHebra(th + DT, h, marco(th + DT)),
        centroHebra(th - DT, h, marco(th - DT)),
      ));
      const rr = radioHebra(th, h);
      frames.push({ M, C, T, rr, th });

      const N = v3norm(v3cross(T, M.Nr));
      const B = v3norm(v3cross(T, N));
      const dOff = v3norm(v3sub(C, M.P));

      for (let p = 0; p < PERFIL; p++) {
        const al = (p / PERFIL) * TAU;
        const dir = v3add(v3scale(N, Math.cos(al)), v3scale(B, Math.sin(al)));
        const r = rr * (1 + 0.16 * Math.sin(3 * al + th * 2.3 + h.sem) + 0.09 * Math.sin(5 * al - th * 3.7 + h.sem * 2));
        const ao = 0.4 + 0.6 * (0.5 + 0.5 * v3dot(dir, dOff));
        addV(v3add(C, v3scale(dir, r)), C, ao, 0, seed, th, al);
      }

      if (s > 0) {
        const prev = b0 + (s - 1) * PERFIL;
        const curr = b0 + s * PERFIL;
        for (let p = 0; p < PERFIL; p++) {
          const p2 = (p + 1) % PERFIL;
          idx.push(prev + p, prev + p2, curr + p, curr + p, prev + p2, curr + p2);
        }
      }
    }

    // Espinas distribuidas con jitter; algunas largas que rompen la silueta
    for (let i = 0; i < h.espinas; i++) {
      const f = (i + 0.15 + 0.7 * hash(i * 7.7 + h.sem * 3)) / h.espinas;
      const fi = Math.min(SEGS, Math.max(0, Math.round(f * SEGS)));
      const fr = frames[fi];
      const dOff = v3norm(v3sub(fr.C, fr.M.P));
      const sgn = hash(i * 3.1 + h.sem) > 0.5 ? 1 : -1;
      const vy = (hash(i * 5.3 + h.sem * 2) - 0.5) * 0.9;
      const dir = v3norm(v3add(
        v3add(v3scale(dOff, 0.55 + 0.3 * hash(i + h.sem)), v3scale(fr.M.Nr, 0.45)),
        v3add(v3scale(fr.T, sgn * (0.25 + 0.9 * hash(i * 1.7 + h.sem * 4))), [0, vy, 0]),
      ));
      const largo = hash(i * 9.1 + h.sem * 6) > 0.88 ? 0.3 : 0.11 + 0.17 * Math.pow(hash(i * 11.1 + h.sem * 20), 1.3);
      const base = fr.rr * (0.42 + 0.18 * hash(i * 2.9 + h.sem));
      const root = v3sub(fr.C, v3scale(dir, fr.rr * -0.3));
      espina(root, dir, v3scale(fr.T, sgn), largo, base, 0, seed, fr.th);
    }
  }

  // Tocones: ramas rotas de punta roma que salen del haz
  const tocones: { th: number; h: number; len: number }[] = [
    { th: 1.2, h: 0, len: 0.2 },
    { th: 3.9, h: 1, len: 0.24 },
    { th: 5.6, h: 2, len: 0.18 },
  ];
  for (const t of tocones) {
    const hb = HEBRAS[t.h];
    const M = marco(t.th);
    const C = centroHebra(t.th, hb, M);
    const dOff = v3norm(v3sub(C, M.P));
    const dir = v3norm(v3add(v3add(v3scale(dOff, 0.7), v3scale(M.Nr, 0.5)), [0, 0.35, 0]));
    espina(v3sub(C, v3scale(dir, 0.01)), dir, M.T, t.len, 0.026, 0.011, hash(t.th), t.th);
  }

  const nVert = pos.length / 3;

  // Normales suavizadas por acumulación de caras, orientadas hacia fuera
  const nrm = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i], b = idx[i + 1], c = idx[i + 2];
    const pa: V3 = [pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]];
    const pb: V3 = [pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]];
    const pc: V3 = [pos[c * 3], pos[c * 3 + 1], pos[c * 3 + 2]];
    const fn = v3cross(v3sub(pb, pa), v3sub(pc, pa));
    for (const v of [a, b, c]) {
      nrm[v * 3] += fn[0];
      nrm[v * 3 + 1] += fn[1];
      nrm[v * 3 + 2] += fn[2];
    }
  }

  // Costura de las hebras completas: promediar primer y último anillo
  let off = 0;
  for (const h of HEBRAS) {
    if (h.len >= 1) {
      const first = off;
      const last = off + SEGS * PERFIL;
      for (let p = 0; p < PERFIL; p++) {
        for (let k = 0; k < 3; k++) {
          const s = nrm[(first + p) * 3 + k] + nrm[(last + p) * 3 + k];
          nrm[(first + p) * 3 + k] = s;
          nrm[(last + p) * 3 + k] = s;
        }
      }
    }
    off += (SEGS + 1) * PERFIL;
    // Salta los vértices de las espinas de esta hebra
    off += h.espinas * 7 * 6;
  }

  for (let i = 0; i < nVert; i++) {
    let n = v3norm([nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]]);
    const out: V3 = [pos[i * 3] - cen[i * 3], pos[i * 3 + 1] - cen[i * 3 + 1], pos[i * 3 + 2] - cen[i * 3 + 2]];
    if (v3dot(n, out) < 0) n = v3scale(n, -1);
    nrm[i * 3] = n[0];
    nrm[i * 3 + 1] = n[1];
    nrm[i * 3 + 2] = n[2];
  }

  return {
    pos: new Float32Array(pos),
    nrm,
    cen: new Float32Array(cen),
    meta: new Float32Array(meta),
    uv: new Float32Array(uv),
    idx: nVert <= 65535 ? new Uint16Array(idx) : new Uint32Array(idx),
    count: idx.length,
    is32: nVert > 65535,
  };
}

// ── Shaders ─────────────────────────────────────────────────

const VERT = `#version 300 es
precision highp float;
in vec3 aPos;
in vec3 aNrm;
in vec3 aCen;
in vec3 aMeta;
in vec2 aUv;

uniform mat4 uMVP;
uniform float uPresion;
uniform float uTime;
uniform float uYaw;

out vec3 vPos;
out vec3 vNrm;
out vec3 vMeta;
out vec2 vUv;

void main(){
  float pr = uPresion;
  vec3 n = aNrm;

  // Se comprime solo el eje de cada rama; su grosor se conserva (y crece un poco)
  vec3 c = aCen;
  float th = atan(c.z, c.x);
  vec2 dir = c.xz / max(length(c.xz), 0.0001);

  float buck = pr * (0.055 * sin(3.0 * th + 1.0) + 0.03 * sin(5.0 * th + 2.0) + 0.02 * sin(2.0 * th));
  c.xz += dir * buck;

  float sw = pr * 0.3 * sin(2.0 * th + 0.8);
  float cs = cos(sw), sn = sin(sw);
  c.xz = vec2(cs * c.x - sn * c.z, sn * c.x + cs * c.z);

  c.xz *= vec2(mix(1.0, 0.52, pr), mix(1.0, 0.74, pr));
  c.y = c.y * mix(1.0, 1.25, pr) + pr * (0.05 * sin(2.0 * th + 0.5) - 0.02);

  float tt = aMeta.y;
  if (tt > 0.0) {
    vec2 toC = -normalize(c.xz + vec2(0.0001));
    c.xz += toC * pr * 0.09 * tt;
    c.y -= pr * 0.05 * tt;
  }

  vec3 p = c + (aPos - aCen) * mix(1.0, 1.12, pr);


  float cy = cos(uYaw), sy2 = sin(uYaw);
  p.xz = vec2(cy * p.x + sy2 * p.z, -sy2 * p.x + cy * p.z);
  n.xz = vec2(cy * n.x + sy2 * n.z, -sy2 * n.x + cy * n.z);

  vPos = p;
  vNrm = n;
  vMeta = aMeta;
  vUv = aUv;
  gl_Position = uMVP * vec4(p, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec3 vPos;
in vec3 vNrm;
in vec3 vMeta;
in vec2 vUv;

uniform vec3 uCam;
uniform float uPresion;
uniform float uAtm;

out vec4 fragColor;

float hash13(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

vec3 embed(vec2 uv, float seed){
  float k = 1.4 + 1.0 * cos(uv.y);
  return vec3(k * cos(uv.x), k * sin(uv.x), 1.0 * sin(uv.y)) + seed * 17.0;
}

void main(){
  float pr = uPresion;
  vec3 N = normalize(vNrm);
  vec3 V = normalize(uCam - vPos);
  float isThorn = step(0.001, vMeta.y);
  float tt = clamp((vMeta.y - 0.05) / 0.95, 0.0, 1.0);

  vec3 q = embed(vUv, vMeta.z);
  float h = 0.55 * vnoise(q) + 0.3 * vnoise(q * 2.7) + 0.15 * vnoise(q * 7.3);
  float c = abs(vnoise(q * 4.1 + 3.3) - 0.5);
  float crack = 1.0 - smoothstep(0.0, 0.035 + 0.03 * pr, c);

  vec3 dpdx = dFdx(vPos), dpdy = dFdy(vPos);
  vec3 r1 = cross(dpdy, N), r2 = cross(N, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  N = normalize(abs(det) * N - 0.0045 * grad);

  vec3 cDark = vec3(0.05, 0.032, 0.02);
  vec3 cMid  = vec3(0.2, 0.135, 0.08);
  vec3 cPale = vec3(0.4, 0.31, 0.22);
  vec3 body = mix(cDark, cMid, smoothstep(0.25, 0.65, h));
  body = mix(body, cPale, smoothstep(0.62, 0.85, h) * 0.55);
  body = mix(body, vec3(dot(body, vec3(0.33))) * vec3(1.0, 0.97, 0.92), 0.45);
  body *= 1.0 - 0.8 * crack;

  vec3 thornCol = mix(body * vec3(0.62, 0.55, 0.5), vec3(0.46, 0.34, 0.21) * (0.7 + 0.5 * h), smoothstep(0.25, 0.95, tt));
  body = mix(body, thornCol, isThorn);

  vec3 L1 = normalize(vec3(-0.55, 0.8, 0.5));
  vec3 L2 = normalize(vec3(0.75, 0.25, -0.7));
  vec3 L3 = normalize(vec3(0.5, -0.4, 0.6));
  vec3 key = vec3(1.0, 0.76, 0.5) * 1.25 * (1.0 - 0.1 * uAtm);
  vec3 rimL = vec3(0.9, 0.5, 0.24) * 0.9;
  vec3 fill = vec3(0.18, 0.2, 0.28) * 0.25;

  float ao = vMeta.x;
  float d1 = max(dot(N, L1), 0.0);
  float d2 = max(dot(N, L2), 0.0);
  float d3 = max(dot(N, L3), 0.0);

  vec3 col = body * (vec3(0.035, 0.027, 0.02) * ao + key * d1 * ao + rimL * d2 * ao * 0.8 + fill * d3);

  vec3 H = normalize(L1 + V);
  col += pow(max(dot(N, H), 0.0), 22.0) * 0.12 * (0.4 + h) * key * ao;
  col += pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.18 * vec3(0.9, 0.55, 0.28) * ao;

  col *= 1.0 - 0.08 * uAtm;
  col = mix(col, col * vec3(1.1, 0.8, 0.7), uAtm * 0.3);

  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));
  fragColor = vec4(col, 1.0);
}`;

const BG_VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const BG_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uAspect;
uniform float uPresion;
out vec4 fragColor;
void main(){
  float pr = uPresion;
  vec2 q = vUv * 2.0 - 1.0;
  q.x *= uAspect * 0.75;
  float r = length(q * vec2(0.9, 1.0));
  vec3 base = vec3(0.03, 0.024, 0.017);
  vec3 warm = mix(vec3(0.17, 0.1, 0.045), vec3(0.2, 0.06, 0.03), pr * 0.5);
  float halo = exp(-r * r * 2.2);
  vec3 col = base + warm * halo * (0.6 - 0.2 * pr);
  float d = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (d - 0.5) / 255.0;
  fragColor = vec4(col, 1.0);
}`;

// ── WebGL helpers ───────────────────────────────────────────

function crearShader(gl: WebGL2RenderingContext, tipo: number, src: string): WebGLShader {
  const s = gl.createShader(tipo);
  if (!s) throw new Error("createShader null");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s) ?? "";
    gl.deleteShader(s);
    throw new Error(`Shader: ${log}`);
  }
  return s;
}

function crearPrograma(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
  let vs: WebGLShader, fs: WebGLShader;
  try {
    vs = crearShader(gl, gl.VERTEX_SHADER, vsSrc);
    fs = crearShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  } catch (e) {
    console.error(e);
    return null;
  }
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

// ── Estado y API ────────────────────────────────────────────

export type PresionState = {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  progBg: WebGLProgram;
  vao: WebGLVertexArrayObject;
  bufs: WebGLBuffer[];
  numIdx: number;
  is32: boolean;
  raf: number;
  t0: number;
  /** Presión objetivo (la que fija el usuario). */
  presion: number;
  /** Presión dibujada: sigue a `presion` con inercia. */
  presionVis: number;
  reducido: boolean;
  destruido: boolean;
  proj: Float32Array;
  view: Float32Array;
  camPos: V3;
  aspect: number;
  u: Record<string, WebGLUniformLocation | null>;
  ub: Record<string, WebGLUniformLocation | null>;
};

function camara(aspect: number): { eye: V3; fov: number } {
  const fov = 38 * DEG;
  const t = Math.tan(fov / 2);
  const el = (aspect >= 1.2 ? 30 : aspect >= 0.8 ? 34 : 40) * DEG;
  const d = Math.max(1.02 / (t * aspect), 0.74 / t);
  return { eye: [0, Math.sin(el) * d, Math.cos(el) * d], fov };
}

export function iniciar(canvas: HTMLCanvasElement): PresionState | null {
  const ctx = canvas.getContext("webgl2", {
    alpha: false, antialias: true, powerPreference: "default",
  });
  if (!ctx) return null;
  const gl: WebGL2RenderingContext = ctx;

  const prog = crearPrograma(gl, VERT, FRAG);
  const progBg = crearPrograma(gl, BG_VERT, BG_FRAG);
  if (!prog || !progBg) return null;

  const mesh = generarCorona();

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const bufs: WebGLBuffer[] = [];
  function attr(name: string, data: Float32Array, size: number) {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog!, name);
    if (loc >= 0) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); }
    bufs.push(b);
  }
  attr("aPos", mesh.pos, 3);
  attr("aNrm", mesh.nrm, 3);
  attr("aCen", mesh.cen, 3);
  attr("aMeta", mesh.meta, 3);
  attr("aUv", mesh.uv, 2);

  const ib = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);
  bufs.push(ib);

  gl.bindVertexArray(null);

  gl.depthFunc(gl.LEQUAL);

  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loc = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);

  return {
    gl, prog, progBg, vao, bufs,
    numIdx: mesh.count, is32: mesh.is32,
    raf: 0, t0: performance.now(),
    presion: 0, presionVis: 0, reducido, destruido: false,
    proj: new Float32Array(16), view: new Float32Array(16),
    camPos: [0, 0.9, 1.9], aspect: 1.33,
    u: {
      uMVP: loc(prog, "uMVP"), uPresion: loc(prog, "uPresion"), uCam: loc(prog, "uCam"),
      uTime: loc(prog, "uTime"), uYaw: loc(prog, "uYaw"), uAtm: loc(prog, "uAtm"),
    },
    ub: { uAspect: loc(progBg, "uAspect"), uPresion: loc(progBg, "uPresion") },
  };
}

export function redimensionar(state: PresionState, ancho: number, alto: number, dpr: number) {
  const { gl } = state;
  const w = Math.round(ancho * dpr);
  const h = Math.round(alto * dpr);
  (gl.canvas as HTMLCanvasElement).width = w;
  (gl.canvas as HTMLCanvasElement).height = h;
  gl.viewport(0, 0, w, h);

  const aspect = w / h;
  const cam = camara(aspect);
  state.aspect = aspect;
  state.camPos = cam.eye;
  state.proj = mat4Persp(cam.fov, aspect, 0.05, 30.0);
  state.view = mat4Look(cam.eye, [0, 0, 0], [0, 1, 0]);
}

export function pintar(state: PresionState) {
  if (state.destruido) return;
  const { gl, prog, progBg, vao } = state;
  const pr = state.reducido ? state.presion : state.presionVis;
  const t = state.reducido ? 0 : (performance.now() - state.t0) * 0.001;
  // Atmósfera: curva suave y contenida, independiente de la deformación
  const atm = pr * pr * (3 - 2 * pr);
  // El vaivén se amortigua al comprimir: en presión alta la pieza queda asentada
  const asentado = 1 - Math.min(1, Math.max(0, (pr - 0.35) / 0.4));
  const yaw = 0.28 + (state.reducido ? 0 : Math.sin(t * 0.22) * 0.3 * asentado);

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.useProgram(progBg);
  gl.uniform1f(state.ub.uAspect, state.aspect);
  gl.uniform1f(state.ub.uPresion, atm);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(prog);
  gl.bindVertexArray(vao);
  gl.uniformMatrix4fv(state.u.uMVP, false, mat4Mul(state.proj, state.view));
  gl.uniform1f(state.u.uPresion, pr);
  gl.uniform1f(state.u.uAtm, atm);
  gl.uniform3fv(state.u.uCam, state.camPos);
  gl.uniform1f(state.u.uTime, t);
  gl.uniform1f(state.u.uYaw, yaw);

  gl.drawElements(gl.TRIANGLES, state.numIdx,
    state.is32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);

  gl.bindVertexArray(null);
}

export function destruir(state: PresionState) {
  state.destruido = true;
  if (state.raf) cancelAnimationFrame(state.raf);
  const { gl, prog, progBg, vao, bufs } = state;
  for (const b of bufs) gl.deleteBuffer(b);
  gl.deleteVertexArray(vao);
  gl.deleteProgram(prog);
  gl.deleteProgram(progBg);
}
