import { ANCHO, FONDO, NX, NZ, RADIO, SEMIEJE, SUELO, type Escultura, type V3 } from "./gravedadFisica";

/**
 * Dibujo WebGL2 de «La gravedad invisible». Geometría rasterizada, no raymarching:
 * - la tela es una malla tres veces más fina que la simulación, interpolada con Catmull-Rom en
 *   el vertex shader a partir de una textura con las posiciones de las partículas;
 * - un foco cenital desde la izquierda proyecta sombras (mapa de profundidad con PCF) sobre la
 *   tela, la carga y el suelo, y se ve en el aire como un haz con las sombras dentro;
 * - la carga y los anillos son bronce con pátina; las cuerdas, cintas orientadas a la cámara
 *   que se pierden en la oscuridad al subir y brillan más cuanto más tensas.
 */

export type Vista = { ojo: V3; obj: V3; fov: number };
export type Lienzo = { pintar: (e: Escultura, v: Vista) => void; medir: (escala: number) => void; liberar: () => void };

type M4 = Float32Array;
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const punto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function perspectiva(fov: number, asp: number, cerca: number, lejos: number): M4 {
  const f = 1 / Math.tan(fov / 2), r = 1 / (cerca - lejos);
  return new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (cerca + lejos) * r, -1, 0, 0, 2 * cerca * lejos * r, 0]);
}
function mirarA(ojo: V3, obj: V3): M4 {
  const z = norm(sub(ojo, obj)), x = norm(cruz([0, 1, 0], z)), y = cruz(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -punto(x, ojo), -punto(y, ojo), -punto(z, ojo), 1]);
}
function mul(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}

/** Matriz de vista y proyección de la cámara: la usa también la página para colocar los anillos. */
export function matrizCamara(v: Vista, aspecto: number) {
  const proj = perspectiva(v.fov, aspecto, 0.1, 60);
  return { vp: mul(proj, mirarA(v.ojo, v.obj)), focal: proj[5] };
}
/** Punto 3D → píxeles CSS del lienzo; z > 1 si queda detrás o fuera. */
export function proyectar(vp: M4, p: V3, w: number, h: number): [number, number, number] {
  const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12];
  const y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13];
  const z = vp[2] * p[0] + vp[6] * p[1] + vp[10] * p[2] + vp[14];
  const q = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
  if (q <= 0) return [0, 0, 2];
  return [((x / q) * 0.5 + 0.5) * w, (0.5 - (y / q) * 0.5) * h, z / q];
}

// ── La luz: un foco alto a la izquierda, por delante ──
export const LUZ_POS: V3 = [-3.6, 7.8, 3.1];
const LUZ_OBJ: V3 = [0.25, -0.9, -0.15];
const LUZ_DIR = norm(sub(LUZ_OBJ, LUZ_POS));
const D0 = Math.hypot(...sub(LUZ_OBJ, LUZ_POS));
const CONO: [number, number] = [Math.cos((17 * Math.PI) / 180), Math.cos((8 * Math.PI) / 180)];
const LUZ_VP = mul(perspectiva((56 * Math.PI) / 180, 1, 4, 18), mirarA(LUZ_POS, LUZ_OBJ));

const f = (x: number) => x.toFixed(4);

const COMUN = `
precision highp float;
precision highp sampler2DShadow;
uniform vec3 uCam;
uniform mat4 uLuzVP;
uniform vec3 uLuzPos, uLuzDir;
uniform vec2 uCono, uRes;
uniform sampler2DShadow uSombra;
uniform float uTexel, uExpo;
uniform int uPasos;
const vec3 LUZ = vec3(1.0, 0.86, 0.69) * 3.0;
const vec3 CONTRA = vec3(0.30, 0.39, 0.55);
const vec3 CONTRA_DIR = vec3(0.57, 0.40, -0.72);
const vec3 NEGRO = vec3(0.0055, 0.0042, 0.0036);
const float D0 = ${f(D0)};
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float ruido(vec2 p) {
  vec2 i = floor(p), q = fract(p);
  q = q * q * (3.0 - 2.0 * q);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), q.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), q.x), q.y);
}
float cono(vec3 p) {
  vec3 d = p - uLuzPos;
  float l = length(d);
  return smoothstep(uCono.x, uCono.y, dot(d, uLuzDir) / l) * (D0 * D0) / (l * l);
}
float sombra(vec3 p, float radio) {
  vec4 q = uLuzVP * vec4(p, 1.0);
  q.xyz = q.xyz / q.w * 0.5 + 0.5;
  if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0 || q.z > 1.0) return 1.0;
  if (radio <= 0.0) return texture(uSombra, q.xyz);
  // Rejilla de 4 × 4 muestras con filtrado bilineal, desplazada al azar por píxel para que la
  // penumbra no forme escalones
  float s = 0.0, paso = radio * 0.5;
  vec2 j0 = vec2(hash(gl_FragCoord.xy), hash(gl_FragCoord.yx + 7.0)) - 0.5;
  for (int j = 0; j < 4; j++)
    for (int i = 0; i < 4; i++) s += texture(uSombra, vec3(q.xy + (vec2(i, j) - 1.5 + j0) * paso * uTexel, q.z));
  return s / 16.0;
}
/** El haz del foco en el aire, entre la cámara y la superficie, con las sombras dentro. */
vec3 haz(vec3 ro, vec3 rd, float tFin) {
  if (uPasos == 0) return vec3(0.0);
  vec3 o = ro - uLuzPos;
  float c2 = uCono.x * uCono.x, dD = dot(rd, uLuzDir), oD = dot(o, uLuzDir);
  float A = dD * dD - c2, B = 2.0 * (dD * oD - c2 * dot(rd, o)), C = oD * oD - c2 * dot(o, o);
  float disc = B * B - 4.0 * A * C;
  vec2 tr = vec2(0.0, -1.0);
  if (disc > 0.0 && abs(A) > 1e-6) {
    float s = sqrt(disc), t1 = (-B - s) / (2.0 * A), t2 = (-B + s) / (2.0 * A);
    if (t1 > t2) { float x = t1; t1 = t2; t2 = x; }
    for (int k = 0; k < 3; k++) {
      vec2 iv = k == 0 ? vec2(0.0, t1) : k == 1 ? vec2(t1, t2) : vec2(t2, tFin);
      iv = vec2(max(iv.x, 0.0), min(iv.y, tFin));
      if (iv.y > iv.x) {
        vec3 m = o + rd * (0.5 * (iv.x + iv.y));
        if (dot(m, uLuzDir) > uCono.x * length(m)) { tr = iv; break; }
      }
    }
  }
  if (tr.y <= tr.x) return vec3(0.0);
  float dt = (tr.y - tr.x) / float(uPasos), t = tr.x + dt * hash(gl_FragCoord.xy + 17.0), acc = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= uPasos) break;
    vec3 p = ro + rd * t;
    // Más denso cerca del suelo, como el polvo de una sala
    acc += cono(p) * sombra(p, 0.0) * (1.0 + 1.2 * smoothstep(1.0, ${f(SUELO)}, p.y));
    t += dt;
  }
  float mu = dot(uLuzDir, -rd), g = 0.5;
  float fase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5) * 0.0796;
  return LUZ * acc * dt * fase * 0.014;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec4 acabar(vec3 col, float dist, vec3 h) {
  col = mix(col, NEGRO, 1.0 - exp(-max(0.0, dist - 11.0) * 0.16)) + h;
  vec2 q = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.45 * smoothstep(0.3, 0.95, length(q * vec2(uRes.x / uRes.y, 1.0) * 0.85));
  col = pow(aces(col * uExpo), vec3(1.0 / 2.2));
  return vec4(col + (hash(gl_FragCoord.xy + 3.1) - 0.5) * 0.012, 1.0);
}
`;

const VS_TELA = `#version 300 es
precision highp float;
uniform highp sampler2D uTela;
uniform mat4 uVP;
layout(location = 0) in vec2 aUV;
out vec3 vPos;
out vec3 vN;
out vec2 vUV;
out float vCav;
const ivec2 REJ = ivec2(${NX - 1}, ${NZ - 1});
vec4 T(ivec2 c) {
  ivec2 k = clamp(c, ivec2(0), REJ);
  vec4 s = texelFetch(uTela, k, 0);
  ivec2 o = c - k;
  // Fuera de la rejilla se extrapola: el borde conserva su pendiente
  if (o != ivec2(0)) s = 2.0 * s - texelFetch(uTela, clamp(k - o, ivec2(0), REJ), 0);
  return s;
}
void pesos(float t, out vec4 w, out vec4 d) {
  float t2 = t * t, t3 = t2 * t;
  w = 0.5 * vec4(-t3 + 2.0 * t2 - t, 3.0 * t3 - 5.0 * t2 + 2.0, -3.0 * t3 + 4.0 * t2 + t, t3 - t2);
  d = 0.5 * vec4(-3.0 * t2 + 4.0 * t - 1.0, 9.0 * t2 - 10.0 * t, -9.0 * t2 + 8.0 * t + 1.0, 3.0 * t2 - 2.0 * t);
}
void main() {
  vec2 g = aUV * vec2(REJ);
  vec2 b = min(floor(g), vec2(REJ) - 1.0);
  vec2 fr = g - b;
  vec4 wu, du, wv, dv;
  pesos(fr.x, wu, du);
  pesos(fr.y, wv, dv);
  vec4 P = vec4(0.0);
  vec3 Pu = vec3(0.0), Pv = vec3(0.0);
  ivec2 ib = ivec2(b);
  for (int j = 0; j < 4; j++)
    for (int i = 0; i < 4; i++) {
      vec4 s = T(ib + ivec2(i - 1, j - 1));
      P += s * wu[i] * wv[j];
      Pu += s.xyz * du[i] * wv[j];
      Pv += s.xyz * wu[i] * dv[j];
    }
  vN = normalize(cross(Pv, Pu));
  vPos = P.xyz;
  vCav = P.w;
  vUV = aUV * vec2(${f(ANCHO)}, ${f(FONDO)});
  gl_Position = uVP * vec4(P.xyz, 1.0);
}`;

const FS_TELA = `#version 300 es
${COMUN}
in vec3 vPos;
in vec3 vN;
in vec2 vUV;
in float vCav;
out vec4 color;
void main() {
  vec3 n = normalize(vN);
  vec3 V = uCam - vPos;
  float dist = length(V);
  V /= dist;
  // La normal suavizada puede invertirse de golpe en los pliegues: se orienta con la normal
  // geométrica del píxel, que siempre mira a la cámara
  vec3 ng = normalize(cross(dFdx(vPos), dFdy(vPos)));
  if (dot(ng, V) < 0.0) ng = -ng;
  vec3 nf = dot(n, ng) >= 0.0 ? n : -n;
  float lado = dot(nf, n);
  // Tejido: urdimbre y trama visibles solo de cerca, y la irregularidad del lino a lo largo
  vec2 hilo = vUV * 150.0;
  vec2 fw = fwidth(hilo);
  float vis = 1.0 - smoothstep(0.2, 0.55, max(fw.x, fw.y));
  float tej = sin(hilo.x * 6.2832) * sin(hilo.y * 6.2832) * vis;
  float slub = ruido(vec2(vUV.x * 2.5, vUV.y * 46.0)) * 0.55 + ruido(vUV * 7.0) * 0.45;
  vec3 alb = vec3(0.80, 0.72, 0.60) * (0.93 + 0.1 * slub) * (1.0 + 0.035 * tej);
  // Dobladillo: una franja doble de 3 cm y su pespunte
  float borde = min(min(vUV.x, ${f(ANCHO)} - vUV.x), min(vUV.y, ${f(FONDO)} - vUV.y));
  float largo = abs(vUV.x - ${f(ANCHO / 2)}) > abs(vUV.y - ${f(FONDO / 2)}) * ${f(ANCHO / FONDO)} ? vUV.y : vUV.x;
  alb *= 1.0 - 0.08 * (1.0 - smoothstep(0.028, 0.034, borde));
  float punt = step(0.45, fract(largo * 55.0)) * (1.0 - smoothstep(0.0015, 0.004, abs(borde - 0.04)));
  alb *= 1.0 - 0.18 * punt * vis;

  vec3 L = normalize(uLuzPos - vPos);
  float ndl = dot(nf, L);
  // La sombra se consulta un poco por delante, a lo largo del rayo de luz: la tela es fina y, rasante
  // al foco, se sombrearía a sí misma a parches. Vista por detrás, la luz llega difundida por el
  // lino y su sombra se ve más borrosa.
  vec3 nl = dot(n, L) > 0.0 ? n : -n;
  float sh = sombra(vPos + L * 0.06 + nl * 0.012, ndl < 0.0 ? 6.0 : 2.2);
  vec3 directa = LUZ * cono(vPos) * sh;
  // La cara iluminada y la luz que atraviesa a la otra tienden a cero juntas en el rasante:
  // así no hay saltos cuando una ondulación cambia de lado respecto al foco
  float difusa = max(0.0, ndl);
  float trans = max(0.0, -ndl);
  vec3 col = alb * directa * (difusa * 0.95 + vec3(1.0, 0.72, 0.46) * trans * 0.4);
  float fres = pow(1.0 - max(dot(nf, V), 0.0), 4.0);
  col += directa * fres * 0.16 * smoothstep(0.0, 0.3, ndl) * vec3(1.0, 0.95, 0.88);
  float nc = dot(nf, CONTRA_DIR);
  col += alb * CONTRA * max(0.0, (nc + 0.3) / 1.3) * 0.22 + CONTRA * fres * 0.2;
  float ao = clamp(1.0 - vCav * lado * 4.0, 0.3, 1.0);
  col += alb * (vec3(0.016, 0.013, 0.011) + vec3(0.05, 0.034, 0.024) * max(0.0, -nf.y)) * ao;
  // Rebote: la tela iluminada se ilumina a sí misma; las sombras de los pliegues no son negras
  col += alb * alb * LUZ * cono(vPos) * 0.1 * ao;
  col *= mix(1.0, ao, 0.65);
  color = acabar(col, dist, haz(uCam, -V, dist));
}`;

const VS_MALLA = `#version 300 es
precision highp float;
uniform mat4 uVP, uModelo;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aN;
out vec3 vPos;
out vec3 vN;
out vec3 vObj;
void main() {
  vec4 w = uModelo * vec4(aPos, 1.0);
  vPos = w.xyz;
  vN = mat3(uModelo) * aN;
  vObj = aPos;
  gl_Position = uVP * w;
}`;

const FS_BRONCE = `#version 300 es
${COMUN}
uniform float uPatina;
in vec3 vPos;
in vec3 vN;
in vec3 vObj;
out vec4 color;
float r3(vec3 p) {
  vec3 i = floor(p), q = fract(p);
  q = q * q * (3.0 - 2.0 * q);
  float n = i.x + i.y * 57.0 + i.z * 113.0;
  #define H(o) fract(sin(n + o) * 43758.5453)
  return mix(mix(mix(H(0.0), H(1.0), q.x), mix(H(57.0), H(58.0), q.x), q.y),
             mix(mix(H(113.0), H(114.0), q.x), mix(H(170.0), H(171.0), q.x), q.y), q.z);
}
float fbm(vec3 p) { return 0.5 * r3(p) + 0.3 * r3(p * 2.1 + 3.7) + 0.2 * r3(p * 4.3 + 9.1); }
void main() {
  vec3 n = normalize(vN);
  vec3 V = uCam - vPos;
  float dist = length(V);
  V /= dist;
  // Martillado: facetas pequeñas en la superficie
  vec3 q = vObj * 9.0;
  float e = 0.05;
  vec3 gr = vec3(r3(q + vec3(e, 0, 0)) - r3(q - vec3(e, 0, 0)), r3(q + vec3(0, e, 0)) - r3(q - vec3(0, e, 0)), r3(q + vec3(0, 0, e)) - r3(q - vec3(0, 0, e))) / (2.0 * e);
  n = normalize(n - (gr - n * dot(gr, n)) * 0.02);
  float pat = smoothstep(0.6, 0.9, fbm(vObj * 5.0) + 0.12 * (1.0 - n.y)) * uPatina;
  vec3 F0 = mix(vec3(0.62, 0.42, 0.23), vec3(0.03), pat);
  vec3 alb = vec3(0.05, 0.055, 0.04) * pat;
  float rug = mix(0.3, 0.7, pat) + 0.08 * r3(vObj * 26.0);

  vec3 L = normalize(uLuzPos - vPos), H = normalize(L + V);
  float ndl = max(dot(n, L), 0.0), ndv = max(dot(n, V), 1e-3), ndh = max(dot(n, H), 0.0), vdh = max(dot(V, H), 0.0);
  float a2 = pow(rug, 4.0), dd = ndh * ndh * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * dd * dd);
  float k = (rug + 1.0) * (rug + 1.0) / 8.0;
  float G = ndv / (ndv * (1.0 - k) + k) * ndl / (ndl * (1.0 - k) + k);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - vdh, 5.0);
  vec3 directa = LUZ * cono(vPos) * sombra(vPos + n * 0.02, 2.0);
  vec3 col = directa * (alb * ndl + D * G * F / (4.0 * ndv + 1e-3));
  // Reflejo: abajo la tela iluminada, arriba la oscuridad, a un lado la contra fría
  vec3 R = reflect(-V, n);
  vec3 env = mix(vec3(0.004, 0.0035, 0.004), vec3(0.42, 0.34, 0.24) * 0.32, smoothstep(0.05, -0.55, R.y));
  env += CONTRA * pow(max(dot(R, CONTRA_DIR), 0.0), 8.0) * 0.5;
  vec3 Fe = F0 + (max(vec3(1.0 - rug), F0) - F0) * pow(1.0 - ndv, 5.0);
  col += env * Fe * (1.0 - 0.55 * rug) + alb * 0.03;
  color = acabar(col, dist, haz(uCam, -V, dist));
}`;

const VS_CUERDA = `#version 300 es
precision highp float;
uniform mat4 uVP;
uniform vec2 uRes;
uniform float uFocal, uGrosor, uMinPx;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aTan;
layout(location = 2) in float aLado;
layout(location = 3) in float aS;
layout(location = 4) in float aTen;
out vec3 vPos;
out vec3 vTan;
out float vLado;
out float vS;
out float vCov;
out float vTen;
out float vAncho;
void main() {
  vec4 c = uVP * vec4(aPos, 1.0), c2 = uVP * vec4(aPos + aTan * 0.05, 1.0);
  vec2 d = (c2.xy / c2.w - c.xy / c.w) * uRes;
  d = length(d) > 1e-5 ? normalize(d) : vec2(1.0, 0.0);
  vec2 perp = vec2(-d.y, d.x);
  float px = 2.0 * uGrosor * uFocal * 0.5 * uRes.y / c.w;
  vCov = clamp(px / uMinPx, 0.0, 1.0);
  px = max(px, uMinPx) + 1.0;
  c.xy += perp * aLado * px / uRes * c.w;
  vPos = aPos;
  vTan = aTan;
  vLado = aLado;
  vS = aS;
  vTen = aTen;
  vAncho = px;
  gl_Position = c;
}`;

const FS_CUERDA = `#version 300 es
${COMUN}
in vec3 vPos;
in vec3 vTan;
in float vLado;
in float vS;
in float vCov;
in float vTen;
in float vAncho;
out vec4 color;
void main() {
  vec3 V = uCam - vPos;
  float dist = length(V);
  V /= dist;
  vec3 T = normalize(vTan);
  vec3 B = normalize(cross(T, V)), Nn = cross(B, T);
  float s = clamp(vLado * vAncho / max(vAncho - 1.0, 1.0), -1.0, 1.0);
  vec3 n = normalize(B * s + Nn * sqrt(max(0.0, 1.0 - s * s)));
  // Cuerda torcida: los cabos dan la vuelta cada 1,8 cm
  float fibra = 0.5 + 0.5 * sin((vS * 55.0 + s * 0.9) * 6.2832);
  vec3 alb = vec3(0.05, 0.04, 0.032) * (0.7 + 0.6 * fibra);
  vec3 L = normalize(uLuzPos - vPos), H = normalize(L + V);
  vec3 directa = LUZ * cono(vPos) * sombra(vPos, 0.0);
  float th = dot(T, H), sth = sqrt(max(0.0, 1.0 - th * th));
  // Cuanto más tensa, más brilla la línea de luz a lo largo de la cuerda
  float esp = pow(sth, 90.0) * (0.12 + 0.88 * vTen) * (0.6 + 0.4 * fibra);
  vec3 col = directa * (alb * max(dot(n, L), 0.0) + vec3(1.0, 0.9, 0.74) * esp * 0.4);
  col += CONTRA * pow(sth, 24.0) * 0.04 + alb * 0.03;
  float a = vCov * (1.0 - smoothstep(1.0 - 1.5 / max(vAncho, 1.5), 1.0, abs(vLado)));
  // Las cuerdas suben hasta perderse en la oscuridad: los apoyos no se ven
  a *= 1.0 - smoothstep(0.9, 2.6, vPos.y);
  vec4 o = acabar(col, dist, haz(uCam, -V, dist));
  color = vec4(o.rgb, a);
}`;

const FS_SUELO = `#version 300 es
${COMUN}
in vec3 vPos;
in vec3 vN;
in vec3 vObj;
out vec4 color;
void main() {
  vec3 V = uCam - vPos;
  float dist = length(V);
  V /= dist;
  float piedra = ruido(vPos.xz * 1.1) * 0.55 + ruido(vPos.xz * 4.7) * 0.3 + ruido(vPos.xz * 19.0) * 0.15;
  vec3 alb = vec3(0.022, 0.019, 0.017) * (0.7 + 0.6 * piedra);
  vec3 L = normalize(uLuzPos - vPos), H = normalize(L + V);
  vec3 directa = LUZ * cono(vPos) * sombra(vPos + vec3(0.0, 0.03, 0.0), 11.0);
  vec3 col = alb * directa * max(L.y, 0.0) + directa * pow(max(H.y, 0.0), 60.0) * 0.03 * (0.6 + 0.8 * piedra);
  col += alb * 0.012;
  color = acabar(col, dist, haz(uCam, -V, dist));
}`;

const VS_FONDO = `#version 300 es
layout(location = 0) in vec2 aQ;
out vec2 vQ;
void main() {
  vQ = aQ;
  gl_Position = vec4(aQ, 1.0, 1.0);
}`;

const FS_FONDO = `#version 300 es
${COMUN}
uniform vec3 uFwd, uDer, uArr;
uniform vec2 uTan;
in vec2 vQ;
out vec4 color;
void main() {
  vec3 rd = normalize(uFwd + vQ.x * uTan.x * uDer + vQ.y * uTan.y * uArr);
  float t = 30.0;
  if (rd.y < 0.0) t = min(t, (${f(SUELO)} - uCam.y) / rd.y);
  vec3 col = NEGRO * (0.8 + 0.6 * smoothstep(-0.2, 0.5, rd.y));
  color = acabar(col, 0.0, haz(uCam, rd, t));
}`;

const FS_VACIO = `#version 300 es
precision mediump float;
void main() {}`;

function compilar(gl: WebGL2RenderingContext, tipo: number, src: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

type Prog = { p: WebGLProgram; u: (n: string) => WebGLUniformLocation | null };
function programa(gl: WebGL2RenderingContext, vs: string, fs: string): Prog {
  const p = gl.createProgram()!;
  gl.attachShader(p, compilar(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compilar(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    p,
    u: (n) => {
      if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n));
      return cache.get(n)!;
    },
  };
}

// ── Mallas ──
const RX = (NX - 1) * 3 + 1, RZ = (NZ - 1) * 3 + 1;
function mallaTela() {
  const uv = new Float32Array(RX * RZ * 2);
  for (let j = 0; j < RZ; j++)
    for (let i = 0; i < RX; i++) {
      uv[(j * RX + i) * 2] = i / (RX - 1);
      uv[(j * RX + i) * 2 + 1] = j / (RZ - 1);
    }
  const ind = new Uint16Array((RX - 1) * (RZ - 1) * 6);
  let k = 0;
  for (let j = 0; j < RZ - 1; j++)
    for (let i = 0; i < RX - 1; i++) {
      const a = j * RX + i, b = a + 1, c = a + RX, d = c + 1;
      ind.set([a, c, b, b, c, d], k);
      k += 6;
    }
  return { uv, ind };
}
/** Torno: una silueta (radio, x) girada alrededor del eje X. */
function torno(perfil: [number, number][], lados: number) {
  const pos: number[] = [], nor: number[] = [], ind: number[] = [];
  for (let k = 0; k < perfil.length; k++) {
    const [r, x] = perfil[k];
    const a = perfil[Math.max(0, k - 1)], b = perfil[Math.min(perfil.length - 1, k + 1)];
    // Normal de la silueta: perpendicular a la tangente (dx, dr)
    const tx = b[1] - a[1], tr = b[0] - a[0], tl = Math.hypot(tx, tr) || 1;
    const nx = -tr / tl, nr = tx / tl;
    for (let s = 0; s <= lados; s++) {
      const t = (s / lados) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
      pos.push(x, r * c, r * sn);
      nor.push(nx, nr * c, nr * sn);
    }
  }
  for (let k = 0; k < perfil.length - 1; k++)
    for (let s = 0; s < lados; s++) {
      const a = k * (lados + 1) + s, b = a + 1, c = a + lados + 1, d = c + 1;
      ind.push(a, b, c, b, d, c);
    }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), ind: new Uint16Array(ind) };
}
/** La carga: un canto alargado de bronce, más lleno que una elipse y de puntas redondeadas. */
function mallaCarga() {
  const L = SEMIEJE + RADIO, perfil: [number, number][] = [];
  for (let k = 0; k <= 40; k++) {
    const u = -1 + (2 * k) / 40;
    const r = RADIO * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.6)), 1 / 2.6) * (1 + 0.04 * u);
    perfil.push([Math.max(r, 1e-4 * (k === 0 || k === 40 ? 0 : 1)), u * L]);
  }
  return torno(perfil, 48);
}
/** El anillo: un toro en el plano XZ. */
function mallaAnillo() {
  const R = 0.05, r = 0.013, M = 28, n = 10;
  const pos: number[] = [], nor: number[] = [], ind: number[] = [];
  for (let i = 0; i <= M; i++) {
    const a = (i / M) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    for (let j = 0; j <= n; j++) {
      const b = (j / n) * Math.PI * 2, cb = Math.cos(b), sb = Math.sin(b);
      pos.push((R + r * cb) * ca, r * sb, (R + r * cb) * sa);
      nor.push(cb * ca, sb, cb * sa);
    }
  }
  for (let i = 0; i < M; i++)
    for (let j = 0; j < n; j++) {
      const a = i * (n + 1) + j, b = a + n + 1;
      ind.push(a, b, a + 1, a + 1, b, b + 1);
    }
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), ind: new Uint16Array(ind) };
}

const SEG = 30;

export function crearLienzo(canvas: HTMLCanvasElement): Lienzo | null {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
  if (!gl) return null;
  let P: Record<string, Prog>;
  try {
    P = {
      tela: programa(gl, VS_TELA, FS_TELA),
      telaS: programa(gl, VS_TELA, FS_VACIO),
      bronce: programa(gl, VS_MALLA, FS_BRONCE),
      bronceS: programa(gl, VS_MALLA, FS_VACIO),
      suelo: programa(gl, VS_MALLA, FS_SUELO),
      cuerda: programa(gl, VS_CUERDA, FS_CUERDA),
      cuerdaS: programa(gl, VS_CUERDA, FS_VACIO),
      fondo: programa(gl, VS_FONDO, FS_FONDO),
    };
  } catch {
    return null;
  }

  const buffers: WebGLBuffer[] = [], vaos: WebGLVertexArrayObject[] = [];
  const vao = (attrs: { data: Float32Array; size: number; loc: number; dinamico?: boolean }[], ind?: Uint16Array) => {
    const v = gl.createVertexArray()!;
    vaos.push(v);
    gl.bindVertexArray(v);
    const bs = attrs.map((a) => {
      const b = gl.createBuffer()!;
      buffers.push(b);
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, a.data, a.dinamico ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      gl.enableVertexAttribArray(a.loc);
      gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, 0, 0);
      return b;
    });
    if (ind) {
      const b = gl.createBuffer()!;
      buffers.push(b);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ind, gl.STATIC_DRAW);
    }
    gl.bindVertexArray(null);
    return { v, bs, n: ind ? ind.length : 0 };
  };

  const mt = mallaTela();
  const vTela = vao([{ data: mt.uv, size: 2, loc: 0 }], mt.ind);
  const mc = mallaCarga();
  const vCarga = vao([{ data: mc.pos, size: 3, loc: 0 }, { data: mc.nor, size: 3, loc: 1 }], mc.ind);
  const ma = mallaAnillo();
  const vAnillo = vao([{ data: ma.pos, size: 3, loc: 0 }, { data: ma.nor, size: 3, loc: 1 }], ma.ind);
  const S = 18;
  const vSuelo = vao(
    [
      { data: new Float32Array([-S, SUELO, -S, S, SUELO, -S, -S, SUELO, S, S, SUELO, S]), size: 3, loc: 0 },
      { data: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), size: 3, loc: 1 },
    ],
    new Uint16Array([0, 2, 1, 1, 2, 3]),
  );
  const vFondo = vao([{ data: new Float32Array([-1, -1, 3, -1, -1, 3]), size: 2, loc: 0 }]);
  // Cuerdas: 6 tiras de SEG+1 pares de vértices; posición, tangente, lado, recorrido y tensión
  const NV = 6 * (SEG + 1) * 2;
  const cPos = new Float32Array(NV * 3), cTan = new Float32Array(NV * 3), cLado = new Float32Array(NV), cS = new Float32Array(NV), cTen = new Float32Array(NV);
  for (let i = 0; i < NV; i++) cLado[i] = i % 2 ? 1 : -1;
  const vCuerda = vao([
    { data: cPos, size: 3, loc: 0, dinamico: true },
    { data: cTan, size: 3, loc: 1, dinamico: true },
    { data: cLado, size: 1, loc: 2 },
    { data: cS, size: 1, loc: 3, dinamico: true },
    { data: cTen, size: 1, loc: 4, dinamico: true },
  ]);

  // Textura con la tela simulada (xyz + cavidad)
  const tTela = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tTela);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, NX, NZ, 0, gl.RGBA, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const datosTela = new Float32Array(NX * NZ * 4);

  // Mapa de sombras del foco
  const TS = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) as number, canvas.clientWidth < 700 ? 1024 : 2048);
  const tSombra = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tSombra);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, TS, TS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  const fbSombra = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbSombra);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tSombra, 0);
  gl.drawBuffers([gl.NONE]);
  gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  let pasos = 10;

  const modeloEjes = (x: V3, y: V3, z: V3, o: V3) => new Float32Array([...x, 0, ...y, 0, ...z, 0, ...o, 1]);

  /** Prepara cuerdas, anillos y carga a partir del estado de la escultura. */
  const preparar = (e: Escultura) => {
    for (let j = 0; j < NX * NZ; j++) {
      datosTela[j * 4] = e.p[j * 3];
      datosTela[j * 4 + 1] = e.p[j * 3 + 1];
      datosTela[j * 4 + 2] = e.p[j * 3 + 2];
      datosTela[j * 4 + 3] = e.cavidad[j];
    }
    const peso = e.pesoTotal();
    e.cuerdas.forEach((c, k) => {
      const E: V3 = c.suelta ? c.e : e.punto(c.idx);
      const A = c.ancla;
      const d = Math.hypot(...sub(A, E));
      const flecha = c.suelta ? 0 : Math.min(1.1, Math.sqrt((3 * d * Math.max(0, c.l - d)) / 8));
      const ten = c.suelta ? 0 : Math.min(1, c.fuerza / (peso * 0.3));
      let s0 = 0;
      for (let i = 0; i <= SEG; i++) {
        // Más muestras cerca de la tela, donde la curva se ve
        const s = Math.pow(i / SEG, 1.6);
        const p: V3 = [E[0] + (A[0] - E[0]) * s, E[1] + (A[1] - E[1]) * s - flecha * 4 * s * (1 - s), E[2] + (A[2] - E[2]) * s];
        const t = norm([A[0] - E[0], A[1] - E[1] - flecha * 4 * (1 - 2 * s), A[2] - E[2]]);
        if (i) s0 = s * d;
        for (let l = 0; l < 2; l++) {
          const v = (k * (SEG + 1) + i) * 2 + l;
          cPos.set(p, v * 3);
          cTan.set(t, v * 3);
          cS[v] = s0;
          cTen[v] = ten;
        }
      }
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, vCuerda.bs[0]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, cPos);
    gl.bindBuffer(gl.ARRAY_BUFFER, vCuerda.bs[1]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, cTan);
    gl.bindBuffer(gl.ARRAY_BUFFER, vCuerda.bs[3]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, cS);
    gl.bindBuffer(gl.ARRAY_BUFFER, vCuerda.bs[4]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, cTen);
    gl.bindTexture(gl.TEXTURE_2D, tTela);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NX, NZ, gl.RGBA, gl.FLOAT, datosTela);

    // La carga, orientada por su eje
    const { centro, eje } = e.carga3();
    const X = norm(eje);
    const Z = norm(cruz(X, Math.abs(X[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]));
    const Y = cruz(Z, X);
    const mCarga = modeloEjes(X, Y, Z, centro);
    // Los anillos, en el plano de la tela; los de las cuerdas sueltas cuelgan de su extremo
    const anillos = e.cuerdas.map((c) => {
      const n: V3 = [e.normal[c.idx * 3], e.normal[c.idx * 3 + 1], e.normal[c.idx * 3 + 2]];
      const ax = norm(cruz(n, [0, 0, 1]));
      return modeloEjes(ax, n, cruz(ax, n), e.punto(c.idx));
    });
    const broches = e.cuerdas.filter((c) => c.suelta).map((c) => {
      const t = norm(sub(c.ancla, c.e));
      const ax = norm(cruz(t, [0, 0, 1]));
      return modeloEjes(t, ax, cruz(t, ax), [c.e[0], c.e[1] - 0.05, c.e[2]]);
    });
    return { mCarga, mallas: [...anillos, ...broches] };
  };

  const dibujarMallas = (pr: Prog, m: { mCarga: Float32Array; mallas: Float32Array[] }) => {
    gl.uniform1f(pr.u("uPatina"), 0.9);
    gl.uniformMatrix4fv(pr.u("uModelo"), false, m.mCarga);
    gl.bindVertexArray(vCarga.v);
    gl.drawElements(gl.TRIANGLES, vCarga.n, gl.UNSIGNED_SHORT, 0);
    gl.uniform1f(pr.u("uPatina"), 0.35);
    gl.bindVertexArray(vAnillo.v);
    for (const mm of m.mallas) {
      gl.uniformMatrix4fv(pr.u("uModelo"), false, mm);
      gl.drawElements(gl.TRIANGLES, vAnillo.n, gl.UNSIGNED_SHORT, 0);
    }
  };
  const dibujarCuerdas = () => {
    gl.bindVertexArray(vCuerda.v);
    for (let k = 0; k < 6; k++) gl.drawArrays(gl.TRIANGLE_STRIP, k * (SEG + 1) * 2, (SEG + 1) * 2);
  };
  const comunes = (pr: Prog, cam: V3) => {
    gl.useProgram(pr.p);
    gl.uniform3fv(pr.u("uCam"), cam);
    gl.uniformMatrix4fv(pr.u("uLuzVP"), false, LUZ_VP);
    gl.uniform3fv(pr.u("uLuzPos"), LUZ_POS);
    gl.uniform3fv(pr.u("uLuzDir"), LUZ_DIR);
    gl.uniform2f(pr.u("uCono"), CONO[0], CONO[1]);
    gl.uniform2f(pr.u("uRes"), canvas.width, canvas.height);
    gl.uniform1i(pr.u("uSombra"), 1);
    gl.uniform1f(pr.u("uTexel"), 1 / TS);
    gl.uniform1f(pr.u("uExpo"), 1);
    gl.uniform1i(pr.u("uPasos"), pasos);
    gl.uniform1i(pr.u("uTela"), 0);
  };

  return {
    medir(escala) {
      const w = Math.max(1, Math.round(canvas.clientWidth * escala));
      const h = Math.max(1, Math.round(canvas.clientHeight * escala));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      // Menos pasos en el haz cuando la resolución baja: suele ser un equipo modesto
      pasos = escala < 0.9 ? 6 : w * h > 900000 ? 8 : 10;
    },
    pintar(e, vista) {
      const m = preparar(e);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tTela);

      // 1 · Sombras
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbSombra);
      gl.viewport(0, 0, TS, TS);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.6, 2.5);
      gl.useProgram(P.telaS.p);
      gl.uniformMatrix4fv(P.telaS.u("uVP"), false, LUZ_VP);
      gl.uniform1i(P.telaS.u("uTela"), 0);
      gl.bindVertexArray(vTela.v);
      gl.drawElements(gl.TRIANGLES, vTela.n, gl.UNSIGNED_SHORT, 0);
      gl.useProgram(P.bronceS.p);
      gl.uniformMatrix4fv(P.bronceS.u("uVP"), false, LUZ_VP);
      dibujarMallas(P.bronceS, m);
      gl.useProgram(P.cuerdaS.p);
      gl.uniformMatrix4fv(P.cuerdaS.u("uVP"), false, LUZ_VP);
      gl.uniform2f(P.cuerdaS.u("uRes"), TS, TS);
      gl.uniform1f(P.cuerdaS.u("uFocal"), LUZ_VP[5] === 0 ? 1 : 1 / Math.tan((28 * Math.PI) / 180));
      gl.uniform1f(P.cuerdaS.u("uGrosor"), 0.011);
      gl.uniform1f(P.cuerdaS.u("uMinPx"), 2.5);
      dibujarCuerdas();
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // 2 · Escena
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.006, 0.0045, 0.004, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, tSombra);
      gl.activeTexture(gl.TEXTURE0);
      const asp = canvas.width / Math.max(1, canvas.height);
      const { vp, focal } = matrizCamara(vista, asp);

      comunes(P.tela, vista.ojo);
      gl.uniformMatrix4fv(P.tela.u("uVP"), false, vp);
      gl.bindVertexArray(vTela.v);
      gl.drawElements(gl.TRIANGLES, vTela.n, gl.UNSIGNED_SHORT, 0);

      comunes(P.bronce, vista.ojo);
      gl.uniformMatrix4fv(P.bronce.u("uVP"), false, vp);
      dibujarMallas(P.bronce, m);

      comunes(P.suelo, vista.ojo);
      gl.uniformMatrix4fv(P.suelo.u("uVP"), false, vp);
      gl.uniformMatrix4fv(P.suelo.u("uModelo"), false, modeloEjes([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]));
      gl.bindVertexArray(vSuelo.v);
      gl.drawElements(gl.TRIANGLES, vSuelo.n, gl.UNSIGNED_SHORT, 0);

      comunes(P.fondo, vista.ojo);
      const fwd = norm(sub(vista.obj, vista.ojo)), der = norm(cruz(fwd, [0, 1, 0])), arr = cruz(der, fwd);
      gl.uniform3fv(P.fondo.u("uFwd"), fwd);
      gl.uniform3fv(P.fondo.u("uDer"), der);
      gl.uniform3fv(P.fondo.u("uArr"), arr);
      gl.uniform2f(P.fondo.u("uTan"), Math.tan(vista.fov / 2) * asp, Math.tan(vista.fov / 2));
      gl.bindVertexArray(vFondo.v);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      comunes(P.cuerda, vista.ojo);
      gl.uniformMatrix4fv(P.cuerda.u("uVP"), false, vp);
      gl.uniform2f(P.cuerda.u("uRes"), canvas.width, canvas.height);
      gl.uniform1f(P.cuerda.u("uFocal"), focal);
      gl.uniform1f(P.cuerda.u("uGrosor"), 0.011);
      gl.uniform1f(P.cuerda.u("uMinPx"), 1.3);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      dibujarCuerdas();
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    },
    liberar() {
      buffers.forEach((b) => gl.deleteBuffer(b));
      vaos.forEach((v) => gl.deleteVertexArray(v));
      gl.deleteTexture(tTela);
      gl.deleteTexture(tSombra);
      gl.deleteFramebuffer(fbSombra);
      Object.values(P).forEach((p) => gl.deleteProgram(p.p));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
