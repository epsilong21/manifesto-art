/**
 * «La perspectiva imposible»: una escena 3D original de MANIFESTO dibujada con un único fragment
 * shader de WebGL2 (raymarching de campos de distancia, sin texturas ni modelos externos).
 *
 * Una estructura suspendida (dos vigas de bronce, el triángulo y la esfera del boceto de Dalí, en
 * metal frío) flota sobre una capa de nubes y una bahía al atardecer. Sombras suaves, oclusión,
 * reflejos en el agua, niebla atmosférica y la sombra de la estructura proyectada sobre las nubes.
 *
 * Dos cámaras: A mira la estructura; B, la bahía casi de frente. Con `dual` la parte baja del encuadre
 * se dibuja con B, como en el cuadro: es la perspectiva imposible. No hay ningún cuerpo humano.
 */

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 aPos, aFwd, aRight, aUp;
uniform vec3 bPos, bFwd, bRight, bUp;
uniform float uDual;
uniform float uCostura;
uniform float uMundo;
uniform vec4 uGeo;
uniform float uFoco;
out vec4 color;

// Luz clave cenital y fría; contraluz ámbar desde el horizonte, al fondo de la bahía
const vec3 L = normalize(vec3(-0.22, 1.0, 0.18));
const vec3 RIM = normalize(vec3(0.12, 0.1, -1.0));
const vec3 FRIO = vec3(0.86, 0.92, 1.0);
const vec3 AMBAR = vec3(1.0, 0.6, 0.28);
const vec3 NOCHE = vec3(0.012, 0.018, 0.04);
const float NUBES = -9.0;
const float VELOS = -5.2;
const float MAR = -16.0;
const vec3 MA = vec3(-2.2, 1.0, 0.24);
const vec3 MB = vec3(2.2, 1.0, 0.24);
const vec3 MC = vec3(0.0, -3.0, 0.24);
const vec3 S = vec3(0.0, 0.48, 0.34);
const mat2 GIRO = mat2(0.8, 0.6, -0.6, 0.8);

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
// fbm con giro entre octavas: sin rejilla visible
float fbm(vec2 p, int n) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= n) break;
    v += a * ruido(p);
    p = GIRO * p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

float sdCaja(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdCapsula(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }

// x: distancia, y: material (1 bronce, 3 esfera pulida). Las varillas del triángulo (2) se dibujan aparte

vec2 mapa(vec3 p) {
  // Vigas biseladas y un nudo en el cruce
  float dv = sdCaja(p - vec3(0.0, -1.0, 0.0), vec3(0.075, 2.75, 0.075), 0.032);
  float dh = sdCaja(p - vec3(0.0, 1.0, 0.0), vec3(2.38, 0.065, 0.065), 0.032);
  float dn = sdCaja(p - vec3(0.0, 1.0, 0.0), vec3(0.125, 0.125, 0.125), 0.025);
  vec2 r = vec2(min(min(dv, dh), dn), 1.0);
  float ds = length(p - S) - 0.27;
  if (ds < r.x) r = vec2(ds, 3.0);
  return r;
}

vec3 normal(vec3 p) {
  const vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * mapa(p + e.xyy).x + e.yyx * mapa(p + e.yyx).x + e.yxy * mapa(p + e.yxy).x + e.xxx * mapa(p + e.xxx).x);
}

bool toca(vec3 ro, vec3 rd, out float t0, out float t1) {
  vec3 oc = ro - vec3(0.0, -0.9, 0.0);
  float b = dot(oc, rd), c = dot(oc, oc) - 19.0;
  float h = b * b - c;
  if (h < 0.0) return false;
  h = sqrt(h);
  t0 = max(0.0, -b - h);
  t1 = -b + h;
  return t1 > 0.0;
}

float sombra(vec3 ro, vec3 rd, float k) {
  float t0, t1;
  if (!toca(ro, rd, t0, t1)) return 1.0;
  float res = 1.0, t = max(t0, 0.02);
  for (int i = 0; i < 26; i++) {
    float h = mapa(ro + rd * t).x;
    res = min(res, k * h / t);
    t += clamp(h, 0.02, 0.45);
    if (res < 0.003 || t > t1) break;
  }
  return clamp(res, 0.0, 1.0);
}

float oclusion(vec3 p, vec3 n) {
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 4; i++) {
    float h = 0.05 * float(i);
    o += (h - mapa(p + n * h).x) * s;
    s *= 0.6;
  }
  return clamp(1.0 - 3.2 * o, 0.0, 1.0);
}

// Cielo: vacío profundo arriba, con variación tonal lenta, y un ocaso suave en el horizonte
vec3 cielo(vec3 rd) {
  float y = rd.y;
  vec3 c = mix(NOCHE * 0.5, NOCHE * 1.5, smoothstep(-0.2, 0.6, y));
  c *= 0.75 + 0.5 * fbm(rd.xz / (abs(y) + 0.25) * 1.3, 3);
  float cerca = exp(-abs(y + 0.006) * 34.0);
  float lejos = exp(-abs(y + 0.01) * (7.0 - 2.5 * uMundo));
  c += AMBAR * (cerca * (0.32 + 0.38 * uMundo) + lejos * (0.06 + 0.14 * uMundo));
  c += vec3(0.04, 0.06, 0.14) * exp(-abs(y - 0.1) * 5.0) * (0.25 + 0.35 * uMundo);
  vec2 q = rd.xz / max(0.05, rd.y + 0.3) * 60.0;
  float estrella = step(0.996, hash(floor(q))) * smoothstep(0.12, 0.0, length(fract(q) - 0.5));
  c += estrella * smoothstep(0.3, 0.75, y) * 0.5;
  return c;
}

// Cielo sin estrellas ni ruido, para los reflejos de los metales (evita puntos sobre las varillas)
vec3 cieloLiso(vec3 rd) {
  float y = rd.y;
  vec3 c = mix(NOCHE * 0.5, NOCHE * 1.5, smoothstep(-0.2, 0.6, y));
  c += AMBAR * (exp(-abs(y + 0.006) * 34.0) * (0.32 + 0.38 * uMundo) + exp(-abs(y + 0.01) * 7.0) * (0.06 + 0.14 * uMundo));
  return c + FRIO * 0.05 * smoothstep(0.6, 1.0, dot(rd, L));
}

// Sierra al fondo de la bahía: siluetas lejanas con bruma y borde ámbar
vec3 fondo(vec3 rd) {
  vec3 c = cielo(rd);
  float az = atan(rd.x, -rd.z);
  float cresta = 0.004 + 0.022 * fbm(vec2(az * 7.0, 3.1), 3) * smoothstep(0.9, 0.2, abs(az + 0.35));
  if (rd.y > -0.004 && rd.y < cresta) {
    float b = smoothstep(cresta, cresta - 0.003, rd.y);
    vec3 roca = mix(vec3(0.03, 0.03, 0.05), AMBAR * 0.18, 0.35 + 0.3 * uMundo);
    roca += AMBAR * 0.35 * exp(-(cresta - rd.y) * 600.0);
    c = mix(c, roca, b);
  }
  return c;
}

// Niebla por alturas: más densa cerca del mar, casi nula en el vacío
float nieblaAltura(vec3 ro, vec3 rd, float t) {
  const float k = 0.16, d = 0.05;
  float h0 = ro.y - MAR, h1 = ro.y + rd.y * t - MAR;
  float dy = rd.y * t;
  float f = abs(dy) < 1e-3 ? exp(-k * h0) * t : (exp(-k * h0) - exp(-k * h1)) / (k * rd.y);
  return 1.0 - exp(-d * max(0.0, f));
}

// Agua: oscura, con el reflejo del ocaso en un camino estrecho; costa y barcas
vec3 agua(vec3 ro, vec3 rd, float t) {
  vec3 p = ro + rd * t;
  vec2 w = p.xz * 0.5;
  vec3 n = normalize(vec3((ruido(w * 3.0) - 0.5) * 0.1, 1.0, (ruido(w * 3.0 + 7.0) - 0.5) * 0.1));
  vec3 r = reflect(rd, n);
  float fres = 0.03 + 0.97 * pow(1.0 - max(0.0, dot(-rd, n)), 5.0);
  vec3 c = vec3(0.004, 0.011, 0.026) * (1.0 + 1.2 * uMundo) + cielo(r) * fres * 0.5;
  vec3 sol = normalize(vec3(0.08, 0.012, -1.0));
  float g = max(0.0, dot(r, sol));
  c += AMBAR * (pow(g, 900.0) * 2.6 + pow(g, 50.0) * 0.08) * (0.55 + 0.6 * uMundo);
  // Costa a la izquierda: roca oscura con una línea de espuma
  // Solo se lee desde cerca del agua; desde el vacío queda fundida en la bruma
  float cerca = smoothstep(-4.0, -11.0, ro.y);
  float tierra = fbm(p.xz * 0.045 + vec2(4.0, 2.0), 4) + smoothstep(6.0, -22.0, p.x) * 0.35 - 0.62;
  if (tierra > 0.0) c = mix(c, mix(vec3(0.016, 0.014, 0.018), vec3(0.05, 0.035, 0.03), fbm(p.xz * 0.6, 2)) * (0.7 + 0.6 * uMundo), cerca);
  c += vec3(0.5, 0.45, 0.4) * exp(-abs(tierra) * 60.0) * 0.08 * (0.5 + uMundo) * cerca;
  // Barcas: cascos oscuros
  return c;
}

// Una barca: silueta en el plano que la contiene (casco bajo y una vela triangular)
float barca(vec3 ro, vec3 rd, vec2 c, float k, float tMar) {
  float t = (c.y - ro.z) / rd.z;
  if (t <= 0.0 || t > tMar + 0.5) return 0.0;
  vec3 q = ro + rd * t;
  float x = q.x - c.x, y = q.y - MAR;
  float aa = 0.0015 * t;
  float casco = smoothstep(aa, -aa, abs(x) - (0.75 - max(0.0, -y) * 2.0) * k) * smoothstep(-0.04 * k - aa, -0.04 * k, y) * smoothstep(0.12 * k + aa, 0.12 * k, y);
  float h = (y - 0.12 * k) / (0.95 * k);
  float vela = step(0.0, h) * step(h, 1.0) * smoothstep(aa, -aa, x - 0.55 * k * (1.0 - h)) * smoothstep(-aa, aa, x + 0.04 * k);
  return max(casco, vela);
}

vec4 nubes(vec3 ro, vec3 rd, float t, float altura, float escala, int oct, float fuerza) {
  vec3 p = ro + rd * t;
  float d = fbm(p.xz * escala + vec2(3.0, 1.0) * altura, oct);
  float a = smoothstep(0.42, 0.78, d) * fuerza;
  // Se disuelven a lo lejos: sin bandas en el horizonte
  a *= exp(-t * 0.011);
  if (a < 0.01) return vec4(0.0);
  float s = altura < -7.0 ? sombra(p + vec3(0.0, 0.05, 0.0), L, 22.0) : 1.0;
  vec3 c = mix(vec3(0.006, 0.009, 0.018), vec3(0.07, 0.078, 0.1), smoothstep(0.45, 0.9, d) * s * (0.5 + 0.5 * uMundo));
  if (rd.y > 0.0) c = mix(vec3(0.012, 0.016, 0.03), AMBAR * 0.18, (0.1 + 0.55 * uMundo) * (1.0 - d));
  return vec4(c, a);
}

float aSegmento(vec3 ro, vec3 rd, vec3 a, vec3 b, out float tr) {
  vec3 d = b - a, w = ro - a;
  float rdd = dot(rd, d), dd = dot(d, d), den = max(1e-5, dd - rdd * rdd);
  float s = clamp((dot(d, w) - dot(rd, w) * rdd) / den, 0.0, 1.0);
  vec3 q = a + d * s;
  tr = max(0.0, dot(q - ro, rd));
  return length(ro + rd * tr - q);
}
float linea(vec3 ro, vec3 rd, vec3 a, vec3 b, float tHit) {
  float tr;
  float d = aSegmento(ro, rd, a, b, tr);
  float w = 0.0016 * tr + 0.0015;
  float g = exp(-d * d / (w * w)) + 0.18 * exp(-d * d / (36.0 * w * w));
  return g * (tr < tHit ? 1.0 : 0.25);
}

// Bronce, metal frío y esfera pulida: metales con reflejo tintado, rugosidad y contraluz
vec3 material(vec3 p, vec3 n, vec3 rd, float id, float t) {
  float sh = sombra(p + n * 0.012, L, 10.0);
  float ao = oclusion(p, n);
  float nv = max(0.0, dot(n, -rd));
  vec3 hv = normalize(L - rd), hr = normalize(RIM - rd);
  float dif = max(0.0, dot(n, L));
  vec3 f0;
  float rug, kd;
  if (id < 1.5) {
    // Pátina: zonas mates y oscuras sobre el bronce
    float pat = smoothstep(0.45, 0.8, fbm(p.xy * 2.6 + p.z * 4.0, 3));
    f0 = mix(vec3(0.62, 0.42, 0.22), vec3(0.16, 0.14, 0.1), pat * 0.75);
    rug = mix(0.32, 0.7, pat);
    kd = 0.12 + 0.2 * pat;
  } else if (id < 2.5) {
    f0 = vec3(0.78, 0.8, 0.84); rug = 0.22; kd = 0.08;
  } else {
    f0 = vec3(0.86, 0.88, 0.92); rug = 0.06; kd = 0.18;
  }
  vec3 F = f0 + (1.0 - f0) * pow(1.0 - nv, 5.0);
  float e = mix(220.0, 14.0, rug);
  float sKey = pow(max(0.0, dot(n, hv)), e) * (e + 8.0) / 40.0;
  float sRim = pow(max(0.0, dot(n, hr)), e * 0.6) * (e + 8.0) / 60.0;
  vec3 r = reflect(rd, n);
  vec3 env = mix(cieloLiso(r), NOCHE * 2.0, rug * 0.6);
  // Rebote ámbar desde abajo, cielo nocturno desde arriba
  vec3 amb = mix(AMBAR * (0.05 + 0.1 * uMundo), NOCHE * 2.2, n.y * 0.5 + 0.5) * ao;
  vec3 c = f0 * kd * (FRIO * dif * sh * 2.0 + amb * 2.0);
  c += F * FRIO * sKey * sh * 2.4;
  c += F * AMBAR * sRim * (0.9 + 0.6 * uMundo);
  c += F * env * (1.0 - rug * 0.7) * ao;
  // Contorno: el borde que mira al horizonte se enciende
  float contorno = pow(1.0 - nv, 3.0) * max(0.0, dot(n, RIM) + 0.35);
  c += AMBAR * contorno * 0.22 * ao;
  return c;
}

vec3 escena(vec3 ro, vec3 rd) {
  vec3 col = fondo(rd);
  float tMar = rd.y < 0.0 ? (MAR - ro.y) / rd.y : -1.0;
  if (tMar > 0.0) {
    vec3 a = agua(ro, rd, tMar);
    vec3 bruma = vec3(0.02, 0.03, 0.06) + AMBAR * (0.03 + 0.07 * uMundo) * smoothstep(-0.25, 0.0, rd.y);
    col = mix(a, bruma, nieblaAltura(ro, rd, tMar));
  }
  // Dos capas: el manto de nubes y velos altos más tenues
  float tN = (NUBES - ro.y) / rd.y;
  if (tN > 0.0 && (tMar < 0.0 || tN < tMar)) {
    vec4 n = nubes(ro, rd, tN, NUBES, 0.075, 4, 0.92);
    col = mix(col, n.rgb, n.a);
  }
  float tV = (VELOS - ro.y) / rd.y;
  if (tV > 0.0 && (tMar < 0.0 || tV < tMar)) {
    vec4 n = nubes(ro, rd, tV, VELOS, 0.05, 3, 0.22);
    col = mix(col, n.rgb, n.a);
  }
  // Barcas: casco y vela recortados a contraluz sobre el camino de luz
  // Solo desde cerca del agua: desde el vacío quedan bajo la bruma y las nubes
  float cercaMar = smoothstep(-4.0, -11.0, ro.y);
  if (tMar > 0.0 && cercaMar > 0.0) {
    col = mix(col, vec3(0.012, 0.01, 0.01), barca(ro, rd, vec2(3.3, -24.0), 1.0, tMar) * cercaMar);
    col = mix(col, vec3(0.012, 0.01, 0.01), barca(ro, rd, vec2(-6.5, -46.0), 1.25, tMar) * 0.85 * cercaMar);
  }

  // El haz cenital: luz fría que cae sobre la estructura atravesando el vacío
  float tr;
  // Se desvanece hacia los dos extremos: sin bordes circulares
  vec3 ha = S + L * 7.0, hb = S - L * 4.0, hd = hb - ha, hw = ro - ha;
  float hrd = dot(rd, hd), hs = clamp((dot(hd, hw) - dot(rd, hw) * hrd) / max(1e-5, dot(hd, hd) - hrd * hrd), 0.0, 1.0);
  vec3 hq = ha + hd * hs;
  tr = max(0.0, dot(hq - ro, rd));
  float dh = length(ro + rd * tr - hq);
  float haz = (exp(-dh * dh / 1.4) * 0.05 + exp(-dh * dh / 0.25) * 0.035) * pow(sin(3.14159 * hs), 2.0) * smoothstep(2.5, 6.0, tr);

  float tHit = 1e5, t0, t1;
  if (toca(ro, rd, t0, t1)) {
    float t = t0;
    vec2 h = vec2(1.0, 0.0);
    for (int i = 0; i < 90; i++) {
      h = mapa(ro + rd * t);
      if (h.x < 0.00035 * t || t > t1) break;
      t += h.x;
    }
    // Solo cuenta como superficie si la marcha ha convergido de verdad
    if (t < t1 && h.x < 0.002 * t) {
      tHit = t;
      vec3 p = ro + rd * t, n = normal(p);
      vec3 c = material(p, n, rd, h.y, t);
      col = mix(c, NOCHE, 1.0 - exp(-t * 0.012));
    }
  }
  // Varillas del triángulo: cobertura analítica según el tamaño del píxel (sin dientes de sierra)
  for (int i = 0; i < 3; i++) {
    vec3 va = i == 0 ? MA : (i == 1 ? MB : MC);
    vec3 vb = i == 0 ? MB : (i == 1 ? MC : MA);
    float tv;
    float dv = aSegmento(ro, rd, va, vb, tv);
    const float RV = 0.021;
    float pix = 1.2 * tv / (uRes.y * uFoco);
    float cov = smoothstep(RV + pix, RV - pix, dv);
    if (cov > 0.002 && tv < tHit) {
      vec3 q = ro + rd * tv;
      vec3 ab = vb - va;
      vec3 cq = va + ab * clamp(dot(q - va, ab) / dot(ab, ab), 0.0, 1.0);
      vec3 nv = normalize(q - cq + rd * -0.0001);
      vec3 cr = material(cq + nv * RV, nv, rd, 2.0, tv);
      col = mix(col, mix(cr, NOCHE, 1.0 - exp(-tv * 0.012)), cov);
    }
  }
  col += FRIO * haz * (tr < tHit ? 1.0 : 0.5) * (1.0 - 0.6 * uMundo);

  if (uGeo.x + uGeo.y + uGeo.z + uGeo.w > 0.001) {
    vec3 oro = vec3(1.0, 0.82, 0.48);
    float g = 0.0;
    g += uGeo.x * (linea(ro, rd, vec3(0.0, 4.2, 0.0), vec3(0.0, -5.6, 0.0), tHit) + linea(ro, rd, vec3(-3.6, 1.0, 0.0), vec3(3.6, 1.0, 0.0), tHit));
    g += uGeo.y * (linea(ro, rd, MA, MB, tHit) + linea(ro, rd, MB, MC, tHit) + linea(ro, rd, MC, MA, tHit));
    float tz = (S.z + 0.02 - ro.z) / rd.z;
    if (tz > 0.0) {
      vec3 q = ro + rd * tz;
      float d = abs(length(q.xy - S.xy) - 0.5);
      float w = 0.0016 * tz + 0.0015;
      g += uGeo.z * (exp(-d * d / (w * w)) + 0.18 * exp(-d * d / (36.0 * w * w))) * (tz < tHit ? 1.0 : 0.25);
    }
    g += uGeo.w * (linea(ro, rd, MA, S, tHit) + linea(ro, rd, MB, S, tHit) + linea(ro, rd, MC, S, tHit));
    float dn = aSegmento(ro, rd, S, S, tr);
    g += uGeo.w * exp(-dn * dn / 0.03) * 0.7;
    col += oro * g * 1.3;
  }
  return col;
}

vec3 rayo(vec3 f, vec3 r, vec3 u, vec2 uv) { return normalize(f * uFoco + r * uv.x + u * uv.y); }

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float v = gl_FragCoord.y / uRes.y;
  float banda = 0.1;
  float wA = mix(1.0, smoothstep(uCostura - banda, uCostura + banda, v), uDual);
  vec3 col = vec3(0.0);
  if (wA > 0.001) col += wA * escena(aPos, rayo(aFwd, aRight, aUp, uv));
  if (wA < 0.999) col += (1.0 - wA) * escena(bPos, rayo(bFwd, bRight, bUp, uv));
  col *= 1.0 - 0.42 * dot(uv * vec2(0.75, 0.9), uv * vec2(0.75, 0.9));
  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.01;
  color = vec4(col, 1.0);
}`;

export type Camara = { pos: [number, number, number]; fwd: [number, number, number]; right: [number, number, number]; up: [number, number, number] };
export type EstadoEscena = { a: Camara; b: Camara; dual: number; costura: number; mundo: number; geo: [number, number, number, number]; foco: number };
export type Escena = { pintar: (e: EstadoEscena) => void; medir: (escala: number) => void; liberar: () => void };

type V3 = [number, number, number];
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** Cámara que mira de `pos` a `obj`, con el cielo arriba. */
export function mirar(pos: V3, obj: V3): Camara {
  const fwd = norm([obj[0] - pos[0], obj[1] - pos[1], obj[2] - pos[2]]);
  const right = norm(cruz(fwd, [0, 1, 0]));
  const up = cruz(right, fwd);
  return { pos, fwd, right, up };
}

function compilar(gl: WebGL2RenderingContext, tipo: number, src: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

/** Devuelve null si no hay WebGL2 o el shader no compila: la sala muestra entonces su alternativa. */
export function crearEscena(canvas: HTMLCanvasElement): Escena | null {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
  if (!gl) return null;
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    res: u("uRes"), dual: u("uDual"), costura: u("uCostura"), mundo: u("uMundo"), geo: u("uGeo"), foco: u("uFoco"),
    aPos: u("aPos"), aFwd: u("aFwd"), aRight: u("aRight"), aUp: u("aUp"),
    bPos: u("bPos"), bFwd: u("bFwd"), bRight: u("bRight"), bUp: u("bUp"),
  };

  return {
    medir(escala) {
      const w = Math.max(1, Math.round(canvas.clientWidth * escala));
      const h = Math.max(1, Math.round(canvas.clientHeight * escala));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    },
    pintar(e) {
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform3fv(U.aPos, e.a.pos);
      gl.uniform3fv(U.aFwd, e.a.fwd);
      gl.uniform3fv(U.aRight, e.a.right);
      gl.uniform3fv(U.aUp, e.a.up);
      gl.uniform3fv(U.bPos, e.b.pos);
      gl.uniform3fv(U.bFwd, e.b.fwd);
      gl.uniform3fv(U.bRight, e.b.right);
      gl.uniform3fv(U.bUp, e.b.up);
      gl.uniform1f(U.dual, e.dual);
      gl.uniform1f(U.costura, e.costura);
      gl.uniform1f(U.mundo, e.mundo);
      gl.uniform4fv(U.geo, e.geo);
      gl.uniform1f(U.foco, e.foco);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    liberar() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
