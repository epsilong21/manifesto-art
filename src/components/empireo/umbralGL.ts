/**
 * «Umbral de luz»: un túnel de anillos que converge en un núcleo blanco, dibujado en un solo
 * fragment shader de WebGL2 (un triángulo a pantalla completa, sin texturas). Es una instalación
 * original de MANIFESTO: no reproduce la pintura. Su brillo lo da la luz medida en cada tramo de
 * la reproducción (uLuz) y su avance, el recorrido del visitante (uViaje).
 */

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTiempo;
uniform float uViaje;
uniform float uLuz;
uniform float uFinal;
uniform vec3 uTinte;
uniform vec3 uNucleo;
uniform vec2 uPar;
out vec4 color;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// Ruido periódico en x (periodo entero P): el ángulo da la vuelta sin costura
float ruido(vec2 p, float P) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, P), x1 = mod(i.x + 1.0, P);
  return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), f.x), mix(hash(vec2(x0, i.y + 1.0)), hash(vec2(x1, i.y + 1.0)), f.x), f.y);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  // Punto de fuga por encima del centro; el puntero lo desplaza un poco (profundidad)
  vec2 c = vec2(uPar.x * 0.07, 0.17 - uPar.y * 0.05);
  vec2 d = uv - c;
  d.y *= 1.1;
  float r = length(d);
  float a = atan(d.y, d.x) / 6.2831853 + 0.5;

  float viaje = uViaje * 1.35 + uTiempo * 0.035;
  float z = 0.38 / (r + 0.03) + viaje;

  // Anillos: bandas finas que se suceden hacia el fondo
  float banda = fract(z * 0.85);
  float anillo = smoothstep(0.0, 0.05, banda) * smoothstep(0.2, 0.05, banda);
  // Vetas de la pared, estiradas por la profundidad
  float vetas = ruido(vec2(a * 46.0, z * 1.4), 46.0) * 0.65 + ruido(vec2(a * 140.0, z * 3.0), 140.0) * 0.35;
  float profundo = smoothstep(1.35, 0.02, r);
  float pared = (anillo * 0.7 + pow(vetas, 2.2) * 0.55) * profundo * profundo;

  // Núcleo y halo
  float radio = mix(0.03, 0.075, uLuz) + uFinal * 0.09;
  float nucleo = exp(-pow(r / radio, 2.0));
  float halo = 0.012 / (r * r + 0.012);

  // Haces volumétricos que salen del núcleo
  float haz = ruido(vec2(a * 18.0, uTiempo * 0.05), 18.0) * ruido(vec2(a * 7.0, uTiempo * 0.03 + 3.1), 7.0);
  float haces = pow(haz, 2.0) * smoothstep(1.2, 0.04, r) * (0.25 + uLuz * 0.9 + uFinal);

  // Motas que vienen hacia quien mira
  vec2 q = vec2(a * 64.0, z * 1.6);
  vec2 celda = floor(q);
  vec2 f = fract(q) - 0.5;
  float h = hash(celda);
  float mota = step(0.9, h) * smoothstep(0.18, 0.0, length(f * vec2(1.0, 0.5))) * smoothstep(0.04, 0.4, r) * profundo;

  vec3 col = uTinte * pared * (0.45 + uLuz * 1.3)
    + uNucleo * (nucleo * 2.6 + halo * (0.15 + uLuz * 0.75 + uFinal * 0.8))
    + uNucleo * haces * 0.28
    + vec3(1.0, 0.95, 0.85) * mota * (0.35 + uLuz);

  // Penumbra en los bordes del encuadre
  col *= smoothstep(1.35, 0.2, length(uv * vec2(0.85, 1.0)));
  col = 1.0 - exp(-col * (1.25 + uFinal * 0.35));
  col += (hash(gl_FragCoord.xy + fract(uTiempo) * 91.0) - 0.5) * 0.03;
  color = vec4(col, 1.0);
}`;

export type EstadoUmbral = {
  tiempo: number;
  viaje: number;
  luz: number;
  final: number;
  tinte: [number, number, number];
  nucleo: [number, number, number];
  par: [number, number];
};

export type Umbral = { pintar: (e: EstadoUmbral) => void; medir: (escala: number) => void; liberar: () => void };

function compilar(gl: WebGL2RenderingContext, tipo: number, src: string) {
  const s = gl.createShader(tipo)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

/** Devuelve null si no hay WebGL2 o el shader no compila: la escena usa entonces su fondo estático. */
export function crearUmbral(canvas: HTMLCanvasElement): Umbral | null {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
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
    res: u("uRes"), tiempo: u("uTiempo"), viaje: u("uViaje"), luz: u("uLuz"), final: u("uFinal"),
    tinte: u("uTinte"), nucleo: u("uNucleo"), par: u("uPar"),
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
      gl.uniform1f(U.tiempo, e.tiempo);
      gl.uniform1f(U.viaje, e.viaje);
      gl.uniform1f(U.luz, e.luz);
      gl.uniform1f(U.final, e.final);
      gl.uniform3fv(U.tinte, e.tinte);
      gl.uniform3fv(U.nucleo, e.nucleo);
      gl.uniform2fv(U.par, e.par);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    liberar() {
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
