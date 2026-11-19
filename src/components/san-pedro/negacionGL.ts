/**
 * negacionGL — motor WebGL2 de «El peso de la negación».
 *
 * Un solo canvas fijo. La pintura se dibuja en un rectángulo con su proporción
 * original (u_rect, en píxeles del canvas); fuera de él solo hay oscuridad y la
 * brasa. No hay mapa de alturas: la profundidad viene de la luz rasante, del
 * ruido de las sombras y del grano, nunca de deformar la pintura.
 */

import type { Estado } from "./linea";

const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 o;

uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec4 u_rect;      // x, y, w, h de la pintura en píxeles del canvas (origen arriba-izquierda)
uniform vec4 u_ref;       // mismo rectángulo a escala 1: ancla los haces y la brasa mientras la pintura crece
uniform float u_t;
uniform float u_luz, u_sat, u_sombra, u_radio, u_brasa, u_calido, u_amb, u_tono;
uniform float u_cargada, u_reducido;
uniform vec2 u_foco;
uniform vec2 u_pun;

float h(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; }
  return s;
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 p = (fc - u_rect.xy) / u_rect.zw;
  float asp = u_rect.z / u_rect.w;
  float t = u_reducido > 0.5 ? 0.0 : u_t;
  vec3 col = vec3(0.0);
  float visP = 0.0;   // cuánto de la pintura se ve en este punto (para no cubrirla con el ambiente)

  // ── Pintura ────────────────────────────────────────────
  float borde = smoothstep(0.0, 0.035, p.x) * smoothstep(0.0, 0.035, 1.0 - p.x)
              * smoothstep(0.0, 0.025, p.y) * smoothstep(0.0, 0.025, 1.0 - p.y);
  if (borde > 0.0 && u_luz > 0.001) {
    vec3 tex = texture(u_tex, clamp(p, 0.0, 1.0)).rgb;
    float lum = dot(tex, vec3(0.2126, 0.7152, 0.0722));

    vec2 foco = u_foco + u_pun * 0.035;
    vec2 d = (p - foco) * vec2(asp, 1.0);
    float dist = length(d * vec2(1.0, 0.9));
    float n = fbm(p * 2.6 + vec2(0.0, t * 0.04));

    // haz con borde irregular, algo más fuerte por la izquierda (luz rasante)
    float r = max(u_radio, 0.001) * (0.85 + 0.3 * n);
    float haz = 1.0 - smoothstep(r * 0.12, r, dist);
    haz *= haz;
    float lado = mix(1.0, 0.62 + 0.38 * (1.0 - p.x), 0.7);

    // sombras que devoran, con ruido, empezando por los bordes
    float umbral = 1.25 - u_sombra * 1.35;
    float cre = smoothstep(umbral, umbral + 0.35, dist * 1.2 + (n - 0.5) * 0.55);

    float vis = haz * lado * u_luz * (1.0 - cre);
    visP = vis;

    vec3 c = mix(vec3(lum), tex, u_sat);
    vec3 calida = vec3(1.10, 0.96, 0.80);
    vec3 fria = vec3(0.92, 0.98, 1.06);
    c *= mix(vec3(1.0), calida, clamp(u_calido, 0.0, 1.0));
    c *= mix(vec3(1.0), fria, clamp(-u_calido, 0.0, 1.0));
    c = pow(max(c, 0.0), vec3(1.0 + u_sombra * 0.45));
    c *= vis * 1.12;
    c += c * c * vis * 0.35;          // los claros respiran un poco
    col += c * borde * u_cargada;
  }

  // ── Ambiente: haces de luz en el aire oscuro ───────────
  // Unidades: altura de la pintura, origen en su centro. Tres haces divergen
  // desde una fuente fuera de plano (arriba a la izquierda) y viajan hacia la
  // pintura. Cada negación apaga uno; el principal, el que alcanza el rostro,
  // resiste hasta la tercera. La luz es aditiva y continua a través del borde
  // (sin máscara rectangular) y se apaga al acercarse al cuadro, que es quien
  // la recibe.
  float A = u_amb * u_cargada;
  if (A > 0.002) {
    // los haces viven en el espacio de referencia (estable); el borde es el de la pintura real
    vec2 pr = (fc - u_ref.xy) / u_ref.zw;
    float asR = u_ref.z / u_ref.w;
    vec2 qq = vec2((pr.x - 0.5) * asR, pr.y - 0.5);
    vec2 qd = abs(vec2((p.x - 0.5) * asp, p.y - 0.5)) - vec2(asp * 0.5, 0.5);
    float dBorde = (length(max(qd, 0.0)) + min(max(qd.x, qd.y), 0.0)) * (u_rect.w / u_ref.w);   // <0 dentro

    // apaisado: la fuente queda a la izquierda y los haces cruzan el espacio vacío;
    // vertical: más empinada, y los haces atraviesan la zona oscura de la pintura
    bool vert = u_res.x < u_res.y * 1.2;
    vec2 fuente = vert ? vec2(-0.9, -1.35) : vec2(-2.1, -0.95);
    vec2 rostro = vec2(0.14 * asR, -0.26);
    vec2 eje = normalize(rostro - fuente);
    vec2 v = qq - fuente;
    float along = length(v);
    float ang = atan(v.y, v.x) - atan(eje.y, eje.x);      // 0 = eje hacia el rostro

    float polvo = fbm(vec2(ang * 22.0 + t * 0.004, along * 1.6 - t * 0.012) + 11.0);
    float vida = 0.55 + 0.9 * polvo;
    float caida = exp(-along * 0.30) * smoothstep(0.4, 1.4, along);

    float a1 = (ang + 0.17) / 0.045;
    float a2 = ang / 0.07;
    float a3 = (ang - 0.15) / 0.04;
    float haces = 0.85 * exp(-a1 * a1) * smoothstep(0.7, 0.95, A)
                + 1.00 * exp(-a2 * a2) * smoothstep(0.02, 0.32, A)
                + 0.70 * exp(-a3 * a3) * smoothstep(0.35, 0.7, A);

    float dC = dot(-fuente, eje);                           // distancia al centro de la pintura
    float entra = mix(vert ? 0.55 : 0.0, 1.0, smoothstep(-0.15, 0.10, dBorde))
                * (1.0 - smoothstep(dC - 0.3, dC + 0.4, dot(v, eje)));

    // atmósfera de fondo: una balsa de luz muy baja que crece con el ambiente
    vec2 qc = qq - vec2(-0.12, -0.18);
    float radioA = 0.45 + 0.55 * A;
    float lenta = vn(qq * 0.8 + vec2(3.1, 1.7) + t * vec2(0.006, 0.004));
    float balsa = exp(-dot(qc, qc) / (radioA * radioA)) * (0.8 + 0.4 * lenta);

    float amb = 0.34 * (0.55 + 0.45 * A) * haces * vida * caida * entra + 0.03 * balsa * A;

    vec3 calida = vec3(1.0, 0.80, 0.55);
    vec3 neutra = vec3(0.88, 0.86, 0.80);
    vec3 fria = vec3(0.58, 0.72, 0.95);
    vec3 tinte = u_tono >= 0.0 ? mix(neutra, calida, u_tono) : mix(neutra, fria, -u_tono);

    col += tinte * amb;
  }

  // ── Brasa: el fuego del patio (Lucas 22:55) ────────────
  if (u_brasa > 0.001) {
    vec2 ep = u_ref.xy + u_ref.zw * vec2(0.1, 0.9);
    float ed = length(fc - ep) / u_ref.w;
    float pul = u_reducido > 0.5 ? 0.85 : 0.82 + 0.18 * sin(u_t * 1.3) + 0.1 * (vn(vec2(u_t * 2.3, 3.0)) - 0.5);
    float nucleo = exp(-ed * ed * 9000.0);
    float halo = exp(-ed * ed * 260.0) * 0.22;
    col += vec3(1.0, 0.5, 0.18) * (nucleo * 0.95 + halo) * u_brasa * pul;

    // el fuego también toca el suelo: un reflejo muy bajo que se abre hacia los lados
    vec2 ds = (fc - ep) / u_ref.w;
    float suelo = exp(-ds.x * ds.x / 0.9 - (ds.y - 0.1) * (ds.y - 0.1) / 0.18);
    col += vec3(1.0, 0.42, 0.14) * suelo * 0.045 * u_brasa * pul;
  }

  // grano fino: evita bandas en los negros (más suave donde solo hay ambiente)
  float amp = 0.008 + 0.006 * borde * step(0.001, visP);
  col += (h(fc + fract(t) * 91.7) - 0.5) * amp * step(0.001, dot(col, vec3(1.0)));
  o = vec4(max(col, 0.0), 1.0);
}`;

/* ── Estado ───────────────────────────────────────────── */

const UNIFORMS = [
  "u_tex", "u_res", "u_rect", "u_ref", "u_t", "u_luz", "u_sat", "u_sombra", "u_radio",
  "u_brasa", "u_calido", "u_amb", "u_tono", "u_cargada", "u_reducido", "u_foco", "u_pun",
] as const;

export type NegacionState = {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  tex: WebGLTexture;
  buf: WebGLBuffer;
  loc: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  cargada: number; // 0–1, fundido de entrada de la pintura
  tieneImagen: boolean;
  reducido: boolean;
  destruido: boolean;
};

function compilar(gl: WebGL2RenderingContext, tipo: number, src: string) {
  const s = gl.createShader(tipo);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("[san-pedro] shader:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function iniciar(canvas: HTMLCanvasElement): NegacionState | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;
  const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
  const fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("[san-pedro] programa:", gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  // textura vacía (negra) hasta que llegue la pintura real
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

  const loc = {} as NegacionState["loc"];
  for (const n of UNIFORMS) loc[n] = gl.getUniformLocation(prog, n);

  return {
    gl, prog, tex, buf, loc,
    cargada: 0,
    tieneImagen: false,
    reducido: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    destruido: false,
  };
}

export function cargarImagen(s: NegacionState, img: HTMLImageElement) {
  const { gl } = s;
  gl.bindTexture(gl.TEXTURE_2D, s.tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  s.tieneImagen = true;
}

export function redimensionar(s: NegacionState, cw: number, ch: number) {
  const c = s.gl.canvas as HTMLCanvasElement;
  if (c.width !== cw) c.width = cw;
  if (c.height !== ch) c.height = ch;
  s.gl.viewport(0, 0, cw, ch);
}

export type Rect = { x: number; y: number; w: number; h: number };

export function pintar(
  s: NegacionState,
  e: Estado,
  t: number,
  rect: Rect,
  ref: Rect,
  puntero: [number, number],
) {
  if (s.destruido) return;
  const { gl, loc } = s;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, s.tex);
  gl.uniform1i(loc.u_tex, 0);
  gl.uniform2f(loc.u_res, gl.canvas.width, gl.canvas.height);
  gl.uniform4f(loc.u_rect, rect.x, rect.y, rect.w, rect.h);
  gl.uniform4f(loc.u_ref, ref.x, ref.y, ref.w, ref.h);
  gl.uniform1f(loc.u_t, t);
  gl.uniform1f(loc.u_luz, e.luz);
  gl.uniform1f(loc.u_sat, e.sat);
  gl.uniform1f(loc.u_sombra, e.sombra);
  gl.uniform1f(loc.u_radio, e.radio);
  gl.uniform1f(loc.u_brasa, e.brasa);
  gl.uniform1f(loc.u_calido, e.calido);
  gl.uniform1f(loc.u_amb, e.ambiente);
  gl.uniform1f(loc.u_tono, e.tono);
  gl.uniform1f(loc.u_cargada, s.tieneImagen ? s.cargada : 0);
  gl.uniform1f(loc.u_reducido, s.reducido ? 1 : 0);
  gl.uniform2f(loc.u_foco, e.fx, e.fy);
  gl.uniform2f(loc.u_pun, puntero[0], puntero[1]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export function destruir(s: NegacionState) {
  s.destruido = true;
  const { gl } = s;
  gl.deleteTexture(s.tex);
  gl.deleteBuffer(s.buf);
  gl.deleteProgram(s.prog);
}
