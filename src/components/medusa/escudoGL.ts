/**
 * Material del escudo en WebGL2, sin dependencias: un único cuadrilátero y un
 * shader de fragmentos. Da a la pintura una superficie convexa iluminada por
 * píxel (barniz, marco dorado, borde en sombra) y dibuja la petrificación como
 * un frente orgánico que nace en los ojos: piedra con grano, relieve tallado a
 * partir de la propia pintura y una red de grietas que avanza detrás del frente.
 *
 * Todo es una capa artística de MANIFESTO encima de la obra: con la
 * petrificación a 0, el resultado es la pintura con luz, sin alterar su color.
 */

export type Uniformes = {
  /** Encuadre: escala y desplazamiento (fracción del escenario). */
  s: number;
  tx: number;
  ty: number;
  /** Luz, en coordenadas de pantalla [-1, 1] (y hacia abajo). */
  lx: number;
  ly: number;
  /** Petrificación y grietas, de 0 a 1. */
  p: number;
  c: number;
  /** Segundos, para la escarcha del frente. */
  t: number;
};

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 color;
uniform sampler2D uTex;
uniform vec3 uView;
uniform vec2 uLight;
uniform float uP;
uniform float uC;
uniform float uT;
uniform vec2 uTexel;
uniform float uAA;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}
// Distancia al borde entre celdas de Voronoi: la red de grietas
float borde(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y);
    vec2 r = g + vec2(hash(i + g), hash(i + g + 31.7)) - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  return sqrt(d2) - sqrt(d1);
}
float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
  vec2 uv = (vUv - uView.yz) / uView.x;
  // Silueta del objeto (pantalla) y superficie pintada (imagen)
  vec2 qs = (vUv - 0.5) / 0.493;
  vec2 qi = (uv - 0.5) / 0.493;
  float rs = length(qs), ri = length(qi);
  float mask = (1.0 - smoothstep(1.0 - uAA, 1.0 + uAA, rs)) * (1.0 - smoothstep(1.0 - uAA / uView.x, 1.0 + uAA / uView.x, ri));
  if (mask <= 0.0) discard;

  vec3 col = texture(uTex, uv).rgb;

  // Cúpula: normal de una superficie convexa suave
  vec3 n = normalize(vec3(qs * 0.5, 1.0));
  vec3 L = normalize(vec3(uLight * 0.9, 1.0));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float dif = dot(n, L);
  float canto = smoothstep(0.74, 1.0, rs);
  float marco = smoothstep(0.86, 0.9, ri);
  // En el marco brilla el ornamento dorado (claro), no el fondo: el dibujo nunca se lava
  float oro = marco * smoothstep(0.12, 0.45, lum(col));
  float brillo = pow(max(dot(n, H), 0.0), 70.0) * (0.14 + 0.45 * oro) + pow(max(dot(n, H), 0.0), 12.0) * (0.04 + 0.05 * oro);
  vec3 pintura = col * mix(1.0, 0.55 + 0.6 * dif, 0.4) * (1.0 - 0.3 * canto) + brillo * vec3(1.0, 0.92, 0.78);

  vec3 res = pintura;
  if (uP > 0.0) {
    // Frente: nace en los dos ojos y avanza de forma irregular
    float d = min(distance(uv, vec2(0.488, 0.413)), distance(uv, vec2(0.594, 0.44)));
    float dd = d + (fbm(uv * 5.0) - 0.5) * 0.24 + (fbm(uv * 1.6 + 3.0) - 0.5) * 0.2;
    float F = mix(-0.14, 1.02, uP);
    float m = 1.0 - smoothstep(F - 0.02, F + 0.02, dd);
    float frente = (1.0 - smoothstep(0.0, 0.045, abs(dd - F))) * (1.0 - step(0.999, uP));

    // Piedra: conserva los valores de la pintura (la obra se sigue leyendo)
    float l = lum(col);
    vec2 e = uTexel * 2.0;
    float gx = lum(texture(uTex, uv + vec2(e.x, 0.0)).rgb) - lum(texture(uTex, uv - vec2(e.x, 0.0)).rgb);
    float gy = lum(texture(uTex, uv + vec2(0.0, e.y)).rgb) - lum(texture(uTex, uv - vec2(0.0, e.y)).rgb);
    vec3 nb = normalize(n + vec3(-gx, -gy, 0.0) * 4.0);
    float grano = fbm(uv * 55.0);
    float poro = noise(uv * 260.0);
    vec3 piedra = mix(vec3(0.2, 0.21, 0.22), vec3(0.9, 0.89, 0.86), smoothstep(0.02, 0.85, l));
    piedra *= vec3(0.93, 0.97, 1.03);
    piedra *= 0.8 + 0.3 * grano + 0.1 * (poro - 0.5);
    piedra *= (0.5 + 0.65 * max(dot(nb, L), 0.0)) * (1.0 - 0.38 * canto);
    piedra += pow(max(dot(nb, H), 0.0), 24.0) * 0.06;

    // Grietas: avanzan detrás del frente, gruesas y finas
    float avance = 1.0 - smoothstep(uC * F - 0.06, uC * F, dd);
    // Al acercarse, las grietas apenas engordan (s^0.25 en pantalla) y aflora la red fina
    float ancho = pow(uView.x, -0.75);
    float cerca = smoothstep(1.0, 2.4, uView.x);
    float g1 = (1.0 - smoothstep(0.0, 0.04 * ancho, borde(uv * 7.0 + (fbm(uv * 3.0) - 0.5) * 1.5))) * step(0.5, fbm(uv * 2.2 + 9.0));
    float g2 = (1.0 - smoothstep(0.0, 0.025 * ancho, borde(uv * 19.0 + 4.0))) * (0.45 + 0.25 * cerca) * step(0.6, fbm(uv * 4.0 + 2.0));
    float grieta = max(g1, g2) * avance;
    // Labio de luz a un lado de cada grieta: se lee como un corte, no como una línea
    float labio = (1.0 - smoothstep(0.0, 0.05 * ancho, borde(uv * 7.0 + (fbm(uv * 3.0) - 0.5) * 1.5 + vec2(0.012 * ancho)))) * step(0.5, fbm(uv * 2.2 + 9.0)) * avance;
    // Profundidad irregular: una grieta real no es una línea de tinta uniforme
    float hondo = 0.68 * (0.7 + 0.3 * noise(uv * 40.0));
    piedra = piedra * (1.0 - hondo * grieta) + 0.06 * labio * (1.0 - grieta);

    res = mix(pintura, piedra, m);
    // Escarcha fría en el frente que avanza
    float chispa = noise(uv * 120.0 + uT * 4.0);
    res += frente * (vec3(0.62, 0.74, 0.86) * 0.32 + chispa * 0.14);
  }
  color = vec4(res * mask, mask);
}`;

function shader(gl: WebGL2RenderingContext, tipo: number, src: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

export type EscudoGL = {
  textura: (img: HTMLImageElement) => void;
  pinta: (u: Uniformes) => void;
  libera: () => void;
};

/** Devuelve null si no hay WebGL2 o el shader no compila: la página usa la versión CSS. */
export function crearEscudoGL(canvas: HTMLCanvasElement, dprMax: number): EscudoGL | null {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
  } catch {
    return null;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const loc = (n: string) => gl.getUniformLocation(prog, n);
  const U = { view: loc("uView"), light: loc("uLight"), p: loc("uP"), c: loc("uC"), t: loc("uT"), texel: loc("uTexel"), aa: loc("uAA") };
  gl.uniform1i(loc("uTex"), 0);
  const tex = gl.createTexture();
  let texel: [number, number] = [0, 0];

  return {
    textura(img) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      texel = [1 / img.naturalWidth, 1 / img.naturalHeight];
    },
    pinta(u) {
      const dpr = Math.min(window.devicePixelRatio || 1, dprMax);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform3f(U.view, u.s, u.tx, u.ty);
      gl.uniform2f(U.light, u.lx, u.ly);
      gl.uniform1f(U.p, u.p);
      gl.uniform1f(U.c, u.c);
      gl.uniform1f(U.t, u.t);
      gl.uniform2f(U.texel, texel[0], texel[1]);
      gl.uniform1f(U.aa, 1.5 / (0.493 * w));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    libera() {
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}
