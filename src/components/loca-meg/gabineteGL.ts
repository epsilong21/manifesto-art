import { ALTO_HIERRO, ALTO_RECIPIENTE, MESA_Y, RUEDA_Y, X_ENSAMBLE, X_HIERRO, X_RECIPIENTE, proyectar, type Camara, type Geometria, type V3 } from "./gabineteEstado";

const VS = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const F = (n: number) => n.toFixed(4);
const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform vec3 uRo, uF, uR, uU;
uniform vec2 uTan;
uniform int uSteps;
uniform vec3 uPosI; uniform mat3 uInvI;
uniform vec3 uPosB; uniform mat3 uInvB; uniform vec3 uArriba;
uniform vec4 uOrb[5];
uniform vec3 uColOrb;
uniform vec3 uPosC;
uniform vec3 uP[7];
uniform mat3 uQ[7];
uniform float uYI, uYB;
out vec4 fragColor;

float gOrb;

float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ return 0.55 * vnoise(p) + 0.3 * vnoise(p * 2.1) + 0.15 * vnoise(p * 4.3); }

float sdRB(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float sdCyl(vec3 p, float r, float h){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float sdOcta(vec3 p, float s){ p = abs(p); return (p.x + p.y + p.z - s) * 0.57735027; }
float sdCone(vec3 p, float h, float r1, float r2){
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h), k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
vec2 un(vec2 a, vec2 b){ return a.x < b.x ? a : b; }

// Materiales: 1 mesa, 2 hierro, 3 recipiente, 4 orbes, 5.x piezas, 6 laton, 7 muro
vec2 map(vec3 p){
  vec2 res = vec2(p.z + 3.4, 7.0);
  // Mesa: tablero, faldon y pedestal
  float mesa = sdRB(p - vec3(0.0, -1.62, 0.0), vec3(3.9, 0.12, 1.75), 0.05);
  mesa = min(mesa, sdRB(p - vec3(0.0, -2.35, 0.0), vec3(3.5, 0.6, 1.45), 0.04));
  mesa = min(mesa, sdRB(p - vec3(0.0, -3.4, 0.0), vec3(3.9, 0.5, 1.7), 0.05));
  res = un(res, vec2(mesa, 1.0));

  // Viga, ruedas y cuerdas
  float lat = sdRB(p - vec3(0.0, 3.2, 0.0), vec3(4.3, 0.08, 0.13), 0.02);
  vec3 w1 = vec3(${F(X_HIERRO + 0.11)}, ${F(RUEDA_Y)}, 0.0), w2 = vec3(${F(X_RECIPIENTE - 0.11)}, ${F(RUEDA_Y)}, 0.0);
  lat = min(lat, sdTorus((p - w1).xzy, vec2(0.11, 0.022)));
  lat = min(lat, sdTorus((p - w2).xzy, vec2(0.11, 0.022)));
  lat = min(lat, sdCap(p, w1, vec3(w1.x, 3.13, 0.0), 0.014));
  lat = min(lat, sdCap(p, w2, vec3(w2.x, 3.13, 0.0), 0.014));
  float cuerda = sdCap(p, vec3(${F(X_HIERRO)}, ${F(RUEDA_Y)}, 0.0), vec3(${F(X_HIERRO)}, uYI + ${F(ALTO_HIERRO)}, 0.0), 0.011);
  cuerda = min(cuerda, sdCap(p, vec3(w1.x, ${F(RUEDA_Y + 0.11)}, 0.0), vec3(w2.x, ${F(RUEDA_Y + 0.11)}, 0.0), 0.011));
  vec3 apex = vec3(${F(X_RECIPIENTE)}, uYB + ${F(ALTO_RECIPIENTE)}, 0.0);
  cuerda = min(cuerda, sdCap(p, vec3(${F(X_RECIPIENTE)}, ${F(RUEDA_Y)}, 0.0), apex, 0.011));
  vec3 colg = vec3(${F(X_ENSAMBLE)}, 3.13, 0.0);
  cuerda = min(cuerda, sdCap(p, colg, uPosC, 0.011));
  res = un(res, vec2(min(lat, cuerda), 6.0));

  // I - El peso que flota: hierro forjado con flejes
  float bI = length(p - uPosI) - 1.0;
  if (bI > 0.25) res = un(res, vec2(bI + 0.2, 2.0));
  else {
    vec3 q = uInvI * (p - uPosI);
    float d = sdRB(q, vec3(0.5, 0.4, 0.46), 0.13);
    d = min(d, sdRB(q - vec3(0.0, 0.12, 0.0), vec3(0.56, 0.045, 0.52), 0.02));
    d = min(d, sdRB(q + vec3(0.0, 0.2, 0.0), vec3(0.56, 0.04, 0.52), 0.02));
    d = min(d, sdTorus((q - vec3(0.0, 0.5, 0.0)), vec2(0.06, 0.018)));
    if (d < 0.12) d += (fbm(q * 7.0) - 0.5) * 0.018;
    res = un(res, vec2(d, 2.0));
  }

  // II - El recipiente: casco de bronce abierto, borde y pie
  float bB = length(p - uPosB) - 1.0;
  if (bB > 0.25) res = un(res, vec2(bB + 0.2, 3.0));
  else {
    vec3 q = uInvB * (p - uPosB);
    float casco = max(abs(length(q) - 0.62) - 0.032, q.y - 0.16);
    float borde = sdTorus(q - vec3(0.0, 0.16, 0.0), vec2(0.6, 0.042));
    float pie = sdCyl(q - vec3(0.0, -0.66, 0.0), 0.11, 0.035);
    float d = smin(smin(casco, borde, 0.03), pie, 0.06);
    // Tres cables del borde al punto de suspension
    for (int k = 0; k < 3; k++) {
      float a = 1.5708 + float(k) * 2.0944;
      vec3 rim = uPosB + vec3(0.6 * cos(a), 0.16, 0.6 * sin(a)) * uInvB;
      d = min(d, sdCap(p, rim, apex, 0.008));
    }
    res = un(res, vec2(d, 3.0));
  }
  // Formas suspendidas
  float o = 1e5;
  for (int k = 0; k < 5; k++) o = min(o, length(p - uOrb[k].xyz) - uOrb[k].w);
  gOrb = min(gOrb, o);
  res = un(res, vec2(o, 4.0));

  // III - La estructura del caos
  float bC = length(p - uPosC) - 1.6;
  if (bC > 0.25) res = un(res, vec2(bC + 0.2, 5.0));
  else {
    float d = 1e5, id = 5.0;
    for (int i = 0; i < 7; i++) {
      vec3 q = uQ[i] * (p - uP[i]);
      float s;
      if (i == 0) s = sdTorus(q, vec2(0.4, 0.05));
      else if (i == 1) s = length(q) - 0.2;
      else if (i == 2) s = sdRB(q, vec3(0.13), 0.025);
      else if (i == 3) s = sdCone(q, 0.2, 0.17, 0.02);
      else if (i == 4) s = sdCyl(q, 0.24, 0.025) - 0.005;
      else if (i == 5) s = sdRB(q, vec3(0.3, 0.03, 0.03), 0.012);
      else s = sdOcta(q, 0.22);
      if (s < d) { d = s; id = 5.0 + float(i) * 0.1; }
    }
    res = un(res, vec2(d, id));
  }
  return res;
}

vec3 normalAt(vec3 p){
  const vec2 k = vec2(1.0, -1.0); const float e = 0.0012;
  return normalize(k.xyy * map(p + k.xyy * e).x + k.yyx * map(p + k.yyx * e).x + k.yxy * map(p + k.yxy * e).x + k.xxx * map(p + k.xxx * e).x);
}
float shadow(vec3 ro, vec3 rd, float tmax){
  float res = 1.0, t = 0.05;
  for (int i = 0; i < 26; i++) {
    float h = map(ro + rd * t).x;
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.04, 0.45);
    if (res < 0.003 || t > tmax) break;
  }
  return clamp(res, 0.0, 1.0);
}
float ao(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 1; i <= 4; i++) { float h = 0.04 + 0.11 * float(i); o += (h - map(p + n * h).x) * s; s *= 0.62; }
  return clamp(1.0 - 1.6 * o, 0.0, 1.0);
}

vec3 pieceColor(float i){
  if (i < 0.5) return vec3(0.5, 0.34, 0.14);
  if (i < 1.5) return vec3(0.62, 0.57, 0.46);
  if (i < 2.5) return vec3(0.1, 0.075, 0.07);
  if (i < 3.5) return vec3(0.13, 0.3, 0.25);
  if (i < 4.5) return vec3(0.52, 0.2, 0.1);
  if (i < 5.5) return vec3(0.6, 0.55, 0.45);
  return vec3(0.09, 0.09, 0.1);
}

void main(){
  vec2 uv = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  vec3 ro = uRo;
  vec3 rd = normalize(uF + uR * uv.x * uTan.x * uTan.y + uU * uv.y * uTan.x);
  gOrb = 1e5;
  float t = 0.5; vec2 h = vec2(1e5, 0.0);
  for (int i = 0; i < 80; i++) {
    if (i >= uSteps) break;
    h = map(ro + rd * t);
    if (h.x < 0.0007 * t) break;
    t += h.x * 0.92;
    if (t > 26.0) break;
  }
  float glow = exp(-gOrb * 7.0);
  vec3 col = vec3(0.0);
  if (t < 26.0 && h.x < 0.004 * t) {
    vec3 p = ro + rd * t;
    vec3 n = normalAt(p);
    float id = h.y;
    vec3 alb = vec3(0.5); float rough = 0.5, met = 0.0; vec3 emi = vec3(0.0);
    if (id < 1.5) {
      float g = sin(p.z * 26.0 + 6.0 * fbm(vec3(p.x * 0.7, p.y * 3.0, p.z * 5.0)));
      alb = vec3(0.12, 0.072, 0.042) * (0.7 + 0.3 * g) * (0.8 + 0.4 * fbm(p * 9.0)); rough = 0.5;
      if (n.y < 0.5) alb *= 0.6;
    } else if (id < 2.5) {
      vec3 q = uInvI * (p - uPosI);
      float rust = smoothstep(0.55, 0.78, fbm(q * 4.0 + 3.0));
      alb = mix(vec3(0.045, 0.05, 0.058), vec3(0.24, 0.09, 0.04), rust); rough = mix(0.28, 0.8, rust); met = 1.0 - rust * 0.6;
    } else if (id < 3.5) {
      vec3 q = uInvB * (p - uPosB);
      float pat = smoothstep(0.35, 0.7, fbm(q * 5.0));
      bool dentro = length(q) < 0.62 && q.y > -0.55 && dot(n, normalize(-q)) > 0.0;
      alb = mix(vec3(0.34, 0.2, 0.09), vec3(0.1, 0.25, 0.2), pat); rough = 0.4; met = 0.8;
      if (dentro) { alb = vec3(0.06, 0.05, 0.04); emi = uColOrb * (0.25 + 0.5 * smoothstep(0.1, -0.5, q.y)); }
    } else if (id < 4.5) {
      alb = uColOrb * 0.2; emi = uColOrb * 0.95;
    } else if (id < 5.95) {
      alb = pieceColor(floor((id - 5.0) * 10.0 + 0.5)); rough = 0.45; met = (id > 5.95 || id < 5.05) ? 0.8 : 0.1;
      alb *= 0.85 + 0.3 * fbm(p * 11.0);
    } else if (id < 6.5) {
      alb = vec3(0.4, 0.28, 0.13); rough = 0.4; met = 0.9;
    } else {
      alb = vec3(0.022, 0.04, 0.038) * (0.8 + 0.4 * fbm(p * vec3(2.0, 2.0, 0.3)));
    }
    vec3 v = -rd;
    // Foco principal, calido y recortado: deja el resto de la sala en sombra
    vec3 lp = vec3(4.6, 6.4, 6.2);
    vec3 L = normalize(lp - p);
    vec3 axis = normalize(vec3(0.0, 0.4, 0.0) - lp);
    float cone = smoothstep(0.86, 0.985, dot(-L, axis));
    float sh = shadow(p + n * 0.02, L, 14.0);
    float dif = max(dot(n, L), 0.0) * sh * cone;
    vec3 H = normalize(L + v);
    float spe = pow(max(dot(n, H), 0.0), mix(90.0, 14.0, rough)) * dif * (1.0 - rough * 0.6);
    vec3 keyC = vec3(1.0, 0.76, 0.5) * 3.4;
    // Contraluz frio desde la izquierda
    vec3 L2 = normalize(vec3(-6.0, 2.0, 1.5) - p);
    float dif2 = max(dot(n, L2), 0.0);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    float occ = ao(p, n);
    // Luz de las formas suspendidas
    vec3 mouth = uPosB + uArriba * 0.5;
    vec3 Lo = mouth - p; float dO = length(Lo);
    float difO = max(dot(n, Lo / dO), 0.0) / (1.0 + dO * dO * 2.2);
    vec3 refl = reflect(rd, n);
    vec3 env = mix(vec3(0.01, 0.02, 0.02), vec3(0.5, 0.34, 0.2), pow(clamp(refl.y * 0.5 + 0.5, 0.0, 1.0), 3.0) * cone);
    float pared = id > 6.5 ? 0.3 : 1.0;
    vec3 diff = alb * (keyC * dif + vec3(0.2, 0.55, 0.5) * 0.5 * dif2 * occ * pared + vec3(0.02, 0.03, 0.03) * occ * pared + uColOrb * difO * 1.2 * occ);
    vec3 sp = mix(vec3(1.0), alb, met) * keyC * spe * (0.3 + 0.7 * met);
    col = diff * (1.0 - 0.45 * met) + sp + env * alb * met * fres * 1.4 * occ + emi;
    col += vec3(0.25, 0.7, 0.62) * fres * 0.18 * occ * (1.0 - cone * 0.5);
    col = mix(col, vec3(0.01, 0.018, 0.018), 1.0 - exp(-max(t - 9.0, 0.0) * 0.045));
  }
  col += uColOrb * glow * 0.13;
  col = col / (1.0 + col * 0.55);
  col = pow(col, vec3(0.4545));
  vec2 q = gl_FragCoord.xy / uRes;
  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.3);
  col += (hash(vec3(gl_FragCoord.xy, 1.0)) - 0.5) / 160.0;
  fragColor = vec4(col, 1.0);
}`;

export type Pintor = {
  /** Dibuja la geometría; `calidad` 1 = completa, menos = menos resolución mientras algo se mueve. */
  pintar(g: Geometria, cam: Camara, calidad: number): void;
  medir(ancho: number, alto: number): void;
  liberar(): void;
};

const AMBAR: V3 = [1, 0.5, 0.16];
const TURQUESA: V3 = [0.3, 0.92, 0.8];
const mezcla = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Pintor WebGL2 (un solo triángulo y un sombreador). Devuelve null si no hay WebGL2 o el sombreador falla. */
export function crearPintorGL(cv: HTMLCanvasElement, movil: boolean): Pintor | null {
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) return null;
  const compilar = (tipo: number, src: string) => {
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("[gabinete]", e);
    return null;
  }
  gl.useProgram(prog);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const loc = new Map<string, WebGLUniformLocation | null>();
  const U = (n: string) => {
    if (!loc.has(n)) loc.set(n, gl.getUniformLocation(prog, n));
    return loc.get(n)!;
  };
  const dprMax = movil ? 1.25 : 1.5;
  let w = 1, h = 1, ultima = 0;
  const plano = (a: number[][]) => Float32Array.from(a.flat());

  return {
    medir(ancho, alto) {
      w = Math.max(1, ancho);
      h = Math.max(1, alto);
      ultima = 0;
    },
    pintar(g, cam, calidad) {
      const k = Math.min(window.devicePixelRatio || 1, dprMax) * calidad;
      if (ultima !== k) {
        cv.width = Math.max(1, Math.round(w * k));
        cv.height = Math.max(1, Math.round(h * k));
        ultima = k;
      }
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(U("uRes"), cv.width, cv.height);
      gl.uniform3fv(U("uRo"), cam.ro);
      gl.uniform3fv(U("uF"), cam.f);
      gl.uniform3fv(U("uR"), cam.r);
      gl.uniform3fv(U("uU"), cam.u);
      gl.uniform2f(U("uTan"), cam.tanY, cam.asp);
      gl.uniform1i(U("uSteps"), movil ? 56 : 72);
      gl.uniform3fv(U("uPosI"), g.hierro.pos);
      gl.uniformMatrix3fv(U("uInvI"), false, g.hierro.inv);
      gl.uniform3fv(U("uPosB"), g.recipiente.pos);
      gl.uniformMatrix3fv(U("uInvB"), false, g.recipiente.inv);
      gl.uniform3fv(U("uArriba"), g.recipiente.arriba);
      gl.uniform4fv(U("uOrb"), plano(g.orbes));
      gl.uniform3fv(U("uColOrb"), mezcla(AMBAR, TURQUESA, g.mezcla));
      gl.uniform3fv(U("uPosC"), g.ensamble.centro);
      gl.uniform3fv(U("uP"), plano(g.ensamble.piezas.map((p) => p.pos)));
      gl.uniformMatrix3fv(U("uQ"), false, plano(g.ensamble.piezas.map((p) => p.inv)));
      gl.uniform1f(U("uYI"), g.yH);
      gl.uniform1f(U("uYB"), g.yR);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    liberar() {
      gl.deleteProgram(prog);
      gl.deleteVertexArray(vao);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/** Alternativa sin WebGL: la misma escena dibujada en 2D con la misma cámara. */
export function crearPintor2D(cv: HTMLCanvasElement): Pintor | null {
  const c = cv.getContext("2d");
  if (!c) return null;
  let w = 1, h = 1;
  return {
    medir(ancho, alto) {
      w = Math.max(1, ancho);
      h = Math.max(1, alto);
      const k = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * k);
      cv.height = Math.round(h * k);
      c.setTransform(k, 0, 0, k, 0, 0);
    },
    pintar(g, cam) {
      const P = (p: V3): [number, number] => {
        const [x, y] = proyectar(cam, p);
        return [x * w, y * h];
      };
      const esc = h / (2 * cam.tanY * 10);
      c.clearRect(0, 0, w, h);
      const fondo = c.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.7);
      fondo.addColorStop(0, "#14231f");
      fondo.addColorStop(1, "#050908");
      c.fillStyle = fondo;
      c.fillRect(0, 0, w, h);
      // Mesa
      const [m0x, m0y] = P([-3.9, MESA_Y, 1.75]);
      const [m1x, m1y] = P([3.9, MESA_Y, 1.75]);
      const [m2x, m2y] = P([3.9, MESA_Y, -1.75]);
      c.fillStyle = "#2a1a10";
      c.fillRect(m0x, m0y, m1x - m0x, h - m0y);
      c.fillStyle = "#3a2516";
      c.beginPath();
      c.moveTo(m0x, m0y);
      c.lineTo(m1x, m1y);
      c.lineTo(m2x, m2y);
      c.lineTo(w - m2x, m2y);
      c.closePath();
      c.fill();
      // Viga y cuerdas
      const lat = "#8a6a3a";
      c.strokeStyle = lat;
      c.fillStyle = lat;
      const [bx0, by] = P([-4.3, 3.2, 0]);
      const [bx1] = P([4.3, 3.2, 0]);
      c.fillRect(bx0, by - 3, bx1 - bx0, 6);
      c.lineWidth = 1.3;
      const lin = (a: V3, b: V3) => {
        const [x0, y0] = P(a), [x1, y1] = P(b);
        c.beginPath();
        c.moveTo(x0, y0);
        c.lineTo(x1, y1);
        c.stroke();
      };
      lin([X_HIERRO, RUEDA_Y + 0.11, 0], [X_RECIPIENTE, RUEDA_Y + 0.11, 0]);
      lin([X_HIERRO, RUEDA_Y + 0.11, 0], [X_HIERRO, g.yH + ALTO_HIERRO, 0]);
      lin([X_RECIPIENTE, RUEDA_Y + 0.11, 0], [X_RECIPIENTE, g.yR + ALTO_RECIPIENTE, 0]);
      lin([X_ENSAMBLE, 3.13, 0], g.ensamble.centro);
      // I - hierro
      const [hx, hy] = P(g.hierro.pos);
      c.save();
      c.translate(hx, hy);
      c.rotate(g.recipiente.phi * -0.3);
      const hw = 0.56 * esc, hh = 0.44 * esc;
      const gr = c.createLinearGradient(-hw, -hh, hw, hh);
      gr.addColorStop(0, "#4a403c");
      gr.addColorStop(0.5, "#241f1e");
      gr.addColorStop(1, "#5a2c14");
      c.fillStyle = gr;
      c.beginPath();
      c.roundRect(-hw, -hh, hw * 2, hh * 2, 12);
      c.fill();
      c.fillStyle = "#17120f";
      c.fillRect(-hw - 3, -hh * 0.2, hw * 2 + 6, hh * 0.22);
      c.restore();
      // II - recipiente
      const [rx, ry] = P(g.recipiente.pos);
      const r = 0.62 * esc;
      c.save();
      c.translate(rx, ry);
      c.rotate(g.recipiente.phi);
      c.fillStyle = "#6b4a22";
      c.beginPath();
      c.arc(0, 0, r, 0.03 * Math.PI, 0.97 * Math.PI);
      c.closePath();
      c.fill();
      c.beginPath();
      c.ellipse(0, r * 0.26, r * 0.98, r * 0.16, 0, 0, Math.PI * 2);
      c.fillStyle = `rgb(${Math.round(30 + 40 * g.mezcla)} ${Math.round(40 + 90 * g.mezcla)} ${Math.round(30 + 80 * g.mezcla)})`;
      c.fill();
      c.restore();
      // Formas suspendidas
      const col = mezcla(AMBAR, TURQUESA, g.mezcla).map((x) => Math.round(x * 255));
      for (const o of g.orbes) {
        const [ox, oy] = P([o[0], o[1], o[2]]);
        const rr = o[3] * esc * 1.4;
        const gd = c.createRadialGradient(ox, oy, 0, ox, oy, rr * 3);
        gd.addColorStop(0, `rgba(${col.join(",")},0.9)`);
        gd.addColorStop(0.3, `rgba(${col.join(",")},0.35)`);
        gd.addColorStop(1, `rgba(${col.join(",")},0)`);
        c.fillStyle = gd;
        c.beginPath();
        c.arc(ox, oy, rr * 3, 0, Math.PI * 2);
        c.fill();
      }
      // III - piezas (las mas lejanas primero)
      const tonos = ["#8a5a24", "#a09274", "#1a1311", "#2a6a58", "#8a3a1a", "#a09274", "#171719"];
      const orden = g.ensamble.piezas.map((p, i) => ({ p, i })).sort((a, b) => a.p.pos[2] - b.p.pos[2]);
      for (const { p, i } of orden) {
        const [px, py] = P(p.pos);
        c.save();
        c.translate(px, py);
        c.fillStyle = tonos[i];
        c.strokeStyle = tonos[i];
        const s = esc;
        if (i === 0) {
          c.lineWidth = 0.1 * s;
          c.beginPath();
          c.ellipse(0, 0, 0.4 * s, 0.14 * s, 0, 0, Math.PI * 2);
          c.stroke();
        } else if (i === 1) {
          c.beginPath();
          c.arc(0, 0, 0.2 * s, 0, Math.PI * 2);
          c.fill();
        } else if (i === 2) {
          c.fillRect(-0.13 * s, -0.13 * s, 0.26 * s, 0.26 * s);
        } else if (i === 3) {
          c.beginPath();
          c.moveTo(0, -0.2 * s);
          c.lineTo(0.17 * s, 0.2 * s);
          c.lineTo(-0.17 * s, 0.2 * s);
          c.fill();
        } else if (i === 4) {
          c.beginPath();
          c.ellipse(0, 0, 0.05 * s, 0.24 * s, 0, 0, Math.PI * 2);
          c.fill();
        } else if (i === 5) {
          c.fillRect(-0.3 * s, -0.03 * s, 0.6 * s, 0.06 * s);
        } else {
          c.beginPath();
          c.moveTo(0, -0.22 * s);
          c.lineTo(0.22 * s, 0);
          c.lineTo(0, 0.22 * s);
          c.lineTo(-0.22 * s, 0);
          c.fill();
        }
        c.restore();
      }
    },
    liberar() {},
  };
}
