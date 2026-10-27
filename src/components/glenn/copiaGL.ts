/**
 * Una pasada de la fotocopiadora en WebGL2, sin dependencias: un cuadrilátero y
 * un shader de fragmentos que hace en la GPU lo mismo que `generar` en Canvas 2D
 * (Fotocopiadora.tsx): el original torcido en el cristal (escala, giro y
 * desplazamiento), el tóner que se corre, la curva de contraste que se come los
 * grises, motas, la sombra de la tapa y la raya del tambor.
 *
 * Los parámetros de la pasada (giro, desplazamiento, semilla) llegan del mismo
 * generador que usa la versión en Canvas 2D, que sigue siendo la alternativa si
 * no hay WebGL2. El resultado vuelve a la CPU (readPixels) para medir los grises
 * y hacer la miniatura.
 */

export type Pasada = { s: number; a: number; ox: number; oy: number; semilla: number };

const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 color;
uniform sampler2D uPrev;
uniform vec2 uTam;
uniform float uS, uA, uSemilla;
uniform vec2 uDesp;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423) + uSemilla);
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

float muestra(vec2 px) {
  if (px.x < 0.0 || px.y < 0.0 || px.x > uTam.x - 1.0 || px.y > uTam.y - 1.0) return 1.0;
  return texture(uPrev, (px + 0.5) / uTam).r;
}

void main() {
  // Píxel de destino (y hacia abajo, como en Canvas 2D)
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uTam - 0.5;
  vec2 c = uTam * 0.5;
  vec2 d = p - c;
  float co = cos(uA), si = sin(uA);
  vec2 q = vec2(co * d.x + si * d.y, -si * d.x + co * d.y) / uS + c - uDesp;
  // Tóner que se corre: desenfoque 1-2-1 en los dos ejes
  float v = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      float w = (i == 0 ? 2.0 : 1.0) * (j == 0 ? 2.0 : 1.0);
      v += muestra(q + vec2(i, j)) * w;
    }
  }
  v /= 16.0;
  // Contraste: los grises se van al negro o al blanco
  float g = 5.2;
  float f0 = 1.0 / (1.0 + exp(g * 0.53));
  float f1 = 1.0 / (1.0 + exp(-g * 0.47));
  v = (1.0 / (1.0 + exp(-g * (v - 0.53))) - f0) / (f1 - f0);
  // Grano, motas de tóner y huecos sin tóner
  v += (hash(p) - 0.5) * 0.06;
  float m = hash(p + 17.3);
  if (m < 0.0016) v *= 0.15;
  else if (m > 0.9988) v = min(1.0, v + 0.55);
  // Sombra de la tapa y raya del tambor
  v *= 1.0 - 0.32 * exp(-p.x / 9.0);
  float raya = floor(uTam.x * 0.31);
  if (floor(p.x + 0.5) == raya || floor(p.x + 0.5) == raya + 1.0) v *= 0.82;
  v = clamp(v, 0.0, 1.0);
  color = vec4(v, v, v, 1.0);
}`;

type Estado = {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  salida: WebGLTexture;
  w: number;
  h: number;
};

let estado: Estado | null | undefined;

function compilar(gl: WebGL2RenderingContext, tipo: number, src: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

function textura(gl: WebGL2RenderingContext, w: number, h: number) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  return t;
}

/** Prepara WebGL2 una sola vez; `null` si no hay (la copia se hace en Canvas 2D). */
function preparar(w: number, h: number): Estado | null {
  if (estado !== undefined && (!estado || (estado.w === w && estado.h === h))) return estado;
  estado = null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const tex = textura(gl, w, h);
    const salida = textura(gl, w, h);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, salida, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
    estado = { gl, prog, tex, fbo, salida, w, h };
  } catch {
    estado = null;
  }
  return estado;
}

/** La copia siguiente en la GPU, o `null` si no hay WebGL2. */
export function generarGL(prev: Float32Array, w: number, h: number, pasada: Pasada): Float32Array | null {
  const e = preparar(w, h);
  if (!e) return null;
  const { gl, prog } = e;
  // El original sube como textura de 8 bits (sobra precisión para una fotocopia)
  const px = new Uint8Array(w * h * 4);
  for (let i = 0; i < prev.length; i++) {
    const v = Math.round(prev[i] * 255);
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
    px[i * 4 + 3] = 255;
  }
  gl.bindTexture(gl.TEXTURE_2D, e.tex);
  // Fila 0 del array = arriba de la imagen; el shader ya mide y hacia abajo
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.bindFramebuffer(gl.FRAMEBUFFER, e.fbo);
  gl.viewport(0, 0, w, h);
  gl.useProgram(prog);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, e.tex);
  gl.uniform1i(gl.getUniformLocation(prog, "uPrev"), 0);
  gl.uniform2f(gl.getUniformLocation(prog, "uTam"), w, h);
  gl.uniform1f(gl.getUniformLocation(prog, "uS"), pasada.s);
  gl.uniform1f(gl.getUniformLocation(prog, "uA"), pasada.a);
  gl.uniform1f(gl.getUniformLocation(prog, "uSemilla"), pasada.semilla);
  gl.uniform2f(gl.getUniformLocation(prog, "uDesp"), pasada.ox, pasada.oy);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  if (gl.getError() !== gl.NO_ERROR) return null;
  // readPixels devuelve la fila de abajo primero: se le da la vuelta
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * w;
    const dst = y * w;
    for (let x = 0; x < w; x++) out[dst + x] = px[(src + x) * 4] / 255;
  }
  return out;
}
