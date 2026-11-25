/**
 * «El retablo que espera» — WebGL2 raymarching SDF (V2.0)
 *
 * Interpretación original de MANIFESTO inspirada en «La Madona de Portlligat (primera versión)»,
 * Dalí, 1949. Todo es procedural: no hay texturas ni imágenes, y no se reproduce ningún fragmento
 * de la pintura. La paleta es una lectura propia (cielo ultramar, mar lila, piedra gris azulada,
 * pedestal turquesa; lo cálido queda reservado al vacío).
 *
 * Qué cambia respecto a V1.3B (`madonna-arquitectura/madonnaGL.ts`)
 *  · Escala y profundidad (composicion.ts): las nueve piezas están entre 36 y 190 unidades de la
 *    cámara alineada; todas las medidas absolutas escalan con su pieza.
 *  · Materiales: sillería con hiladas de altura constante en todas las piezas (pista de escala),
 *    sillares con tono propio, juntas que se funden con la distancia, manchas y vetas de lluvia.
 *  · Atmósfera: perspectiva aérea que depende de la altura y toma el color del cielo en esa
 *    dirección (también su calidez), cabos en el horizonte (siluetas angulares, sin marchar),
 *    mar real con oleaje, Fresnel, reflejo del cielo y de las piezas, y sombra de contacto.
 *  · Luz: clave fría desde la izquierda y delante; cielo y rebote del mar como ambiente; sol justo
 *    bajo el horizonte, detrás de la composición, y una luz cálida diseñada en el vacío
 *    (`uProx` la enciende al alinearse).
 *  · Marcha con umbral de impacto proporcional al píxel (menos pasos a distancia).
 */

import {
  BLOQUE_INF, BLOQUE_SUP, CAJA_ESCENA, CONCHA, CORNISA, ESC, FRAGMENTOS, HILO, HUEVO, LUZ_VACIO,
  PEDESTAL, SOL, base, centrosEn, hiloB, type V3,
} from "./composicion";

export type Perfil = "desktop" | "movil";

const gf = (n: number) => n.toFixed(4);
const gv3 = (c: readonly number[]) => `vec3(${gf(c[0])},${gf(c[1])},${gf(c[2])})`;
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
};
const lin = (hex: string) => gv3(rgb(hex).map((v) => Math.pow(v, 2.2)));

/** Paleta (sRGB; interpretación propia, no una copia de los colores de la pintura). */
const PAL = {
  cornisa: "#72839a",
  bloque: "#687a91",
  concha: "#dcd9e2",
  huevo: "#ebe6e6",
  zocalo: "#6f8f8c",
  rollo: "#6f98aa",
  friso: "#5f93a8",
  moldura: "#8a92a8",
  tapa: "#98a0b4",
  cieloHor: "#e8edf9",
  cielo1: "#bccdf3",
  cielo2: "#5d86e0",
  cielo3: "#1f4cb8",
  cieloZen: "#0a2a78",
};

/**
 * V2.2A — pruebas de dirección visual (solo materiales, aristas, luz, cavidades y atmósfera; la geometría, la
 * cámara y el número de pasos de marcha no cambian). `v21` genera el shader de V2.1 sin una sola línea distinta.
 */
export type Look = "v21" | "a" | "b" | "hybrid";
export type Cavidad = false | "b1" | "b2" | "completa";
export const LOOKS_VALIDOS: readonly Look[] = ["v21", "a", "b", "hybrid"];

/** Paletas de los looks (sRGB; lectura propia). Solo cambian las piedras: cielo y mar son los de V2.1. */
const PAL_A = { ...PAL, cornisa: "#6c7e96", bloque: "#62758d", zocalo: "#6a8786", rollo: "#6a8fa0", friso: "#5a8a9f", moldura: "#838ba1", tapa: "#919aaf" };
const PAL_B = { ...PAL, cornisa: "#7685a0", bloque: "#6d7d9a", zocalo: "#74908f", rollo: "#7499ad", friso: "#6397ad", moldura: "#8f93ad", tapa: "#9ca3bb" };

type Ajustes = {
  /** Multiplica el radio de las aristas redondeadas (geometría: sin coste) y filete de la boca de las cavidades. */
  rb: number; rim: number;
  /** Luz clave (hacia la luz), color + intensidad, envoltura del difuso, suelo de la sombra. */
  lig: readonly number[]; luz: readonly number[]; wrap: number; sombraMin: number;
  /** Ambiente: color bajo / alto y factor. */
  ambA: readonly number[]; ambB: readonly number[]; amb: number;
  /** Densidad de la perspectiva aérea (× V2.1). */
  nieb: number;
  /** Cavidades: oscuridad al fondo y brillo frío de rebote. */
  cavOcc: number; cavGlow: readonly number[];
  /** Sillar: altura de hilada, ancho, probabilidad de junta (base y junto a las aristas). */
  jh: number; jw: number; pj0: number; pj1: number; jancho: number;
  /** Relieve, oscuridad de la junta, deriva cromática, contraste de tono local, suavidad de los lechos, lechos, sillares. */
  relieve: number; jOsc: number; hue: number; macro: number; suave: number; lechos: number; bloques: number;
  /** Desgaste de aristas: ancho (unidades), aclarado, picado, vetas de lluvia, degradado vertical. */
  desgaste: number; claro: number; picado: number; lluvia: number; degrada: number;
  /** V2.2B: modelo de juntas nuevo (lechos irregulares interrumpidos que no llegan a las aristas) en lugar de la rejilla de A/B. */
  hibrido?: true;
};

const LOOKS: Record<"a" | "b" | "hybrid", Ajustes> = {
  /* A — PIEDRA MONUMENTAL: grandes masas, luz rasante, juntas escasas y firmes, desgaste en esquinas y bocas */
  a: {
    rb: 3.0, rim: 0.55,
    lig: [-0.84, 0.36, 0.30], luz: [0.92, 0.96, 1.0, 3.6], wrap: 0, sombraMin: 0.05,
    ambA: [0.075, 0.07, 0.16], ambB: [0.10, 0.17, 0.40], amb: 0.62,
    nieb: 1.0,
    cavOcc: 0.66, cavGlow: [0.018, 0.030, 0.085],
    jh: 3.4, jw: 6.5, pj0: 0.07, pj1: 0.85, jancho: 0.24,
    relieve: 1.0, jOsc: 0.10, hue: 0.035, macro: 0.20, suave: 0.0, lechos: 0.09, bloques: 0.06,
    desgaste: 1.1, claro: 0.42, picado: 0.16, lluvia: 0.20, degrada: 0.0,
  },
  /* B — PIEDRA PICTÓRICA: transiciones cromáticas, bordes suaves, sombras teñidas, atmósfera más integrada */
  b: {
    rb: 3.4, rim: 1.0,
    lig: [-0.62, 0.52, 0.58], luz: [1.0, 0.95, 0.91, 2.7], wrap: 0.35, sombraMin: 0.22,
    ambA: [0.135, 0.095, 0.215], ambB: [0.115, 0.165, 0.390], amb: 0.95,
    nieb: 1.55,
    cavOcc: 0.62, cavGlow: [0.040, 0.034, 0.105],
    jh: 4.2, jw: 8, pj0: 0.03, pj1: 0.50, jancho: 0.30,
    relieve: 0.7, jOsc: 0.07, hue: 0.12, macro: 0.30, suave: 0.85, lechos: 0.16, bloques: 0.03,
    desgaste: 1.7, claro: 0.28, picado: 0.10, lluvia: 0.16, degrada: 0.11,
  },
  /* HYBRID (V2.2B) — masa y cavidades de A; luz envolvente, sombras teñidas y color suave de B; juntas con modelo nuevo */
  hybrid: {
    rb: 3.0, rim: 0.8,
    lig: [-0.80, 0.40, 0.36], luz: [0.93, 0.96, 1.0, 3.3], wrap: 0.18, sombraMin: 0.12,
    ambA: [0.11, 0.085, 0.19], ambB: [0.10, 0.17, 0.40], amb: 0.72,
    nieb: 1.25,
    cavOcc: 0.60, cavGlow: [0.026, 0.030, 0.092],
    jh: 3.8, jw: 7, pj0: 0.6, pj1: 0, jancho: 0.34,
    relieve: 1.5, jOsc: 0.2, hue: 0.07, macro: 0.32, suave: 0.5, lechos: 0.24, bloques: 0,
    desgaste: 1.8, claro: 0.5, picado: 0.12, lluvia: 0.18, degrada: 0.06,
    hibrido: true,
  },
};

/**
 * Textura de ruido propia (256², RGBA8, teselable), generada aquí: ningún archivo ni imagen externa.
 * R: manchas amplias · G: media escala (picado) · B: grano fino · A: estratos (ancho y delgado; girado, vetas verticales).
 * Con mipmaps, a distancia el ruido se funde solo (sin coste extra por píxel y sin parpadeo).
 */
function crearRuido(gl: WebGL2RenderingContext): WebGLTexture | null {
  const N = 256;
  const hash = (x: number, y: number, s: number) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const vn = (u: number, v: number, px: number, py: number, s: number) => {
    const x = u * px, y = v * py;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10), sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    const xa = ((x0 % px) + px) % px, xb = (xa + 1) % px, ya = ((y0 % py) + py) % py, yb = (ya + 1) % py;
    const a = hash(xa, ya, s), b = hash(xb, ya, s), c = hash(xa, yb, s), d = hash(xb, yb, s);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  const fbm = (u: number, v: number, px: number, py: number, oct: number, s: number) => {
    let a = 0.5, t = 0, n = 0;
    for (let o = 0; o < oct; o++) { t += a * vn(u, v, px << o, py << o, s + o * 31); n += a; a *= 0.5; }
    const r = t / n;
    return Math.min(1, Math.max(0, (r - 0.5) * 1.7 + 0.5));
  };
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const u = i / N, v = j / N, k = (j * N + i) * 4;
      data[k] = fbm(u, v, 4, 4, 5, 1) * 255;
      data[k + 1] = fbm(u, v, 8, 8, 4, 101) * 255;
      data[k + 2] = fbm(u, v, 32, 32, 2, 211) * 255;
      data[k + 3] = fbm(u, v, 3, 24, 3, 307) * 255;
    }
  }
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

export type Silueta = { id: number; n: number; u0: number; u1: number; v0: number; v1: number };

export type Escena = {
  pintar: () => void;
  /** Sube el reloj ambiental, los centros (flotación + balanceo) y el hilo. */
  ambiente: (t: number, m: number) => void;
  medir: (escala: number) => boolean;
  camara: (pos: V3, tgt: V3) => void;
  encuadre: (foco: number) => void;
  /** Solo QA: id del fragmento bajo cada punto uv (-1 = fondo). */
  muestrear: (uvs: [number, number][]) => number[];
  /** Solo QA: caja en uv y píxeles de cada id visible. */
  silueta: () => Silueta[];
  proximidad: (v: number) => void;
  liberar: () => void;
  perdido: boolean;
};

const VERT = `#version 300 es
in vec2 p;
void main(){gl_Position=vec4(p,0,1);}`;

function fragSrc(perfil: Perfil, look: Look, cavidad: Cavidad = false): string {
  const K = look === "v21" ? null : LOOKS[look];
  const PL = look === "a" || look === "hybrid" ? PAL_A : look === "b" ? PAL_B : PAL;
  const rbK = K ? K.rb : 1;
  /** Con look «v21» devuelve `v` (el texto de V2.1); con A/B, `n`. */
  const si = (v: string, n: string) => (K ? n : v);
  const P = perfil === "desktop" ? 80 : 48;
  const S = perfil === "desktop" ? 16 : 9;
  const RP = perfil === "desktop" ? 22 : 12;

  type Medida = { hx: number; hy: number; hz: number };
  const hc = (c: Medida) => gv3([c.hx, c.hy, c.hz]);
  const radio = (c: Medida, s: number) => Math.hypot(c.hx, c.hy, c.hz) + 0.03 * s;

  const bandas = [PEDESTAL.zocalo, PEDESTAL.rollo, PEDESTAL.friso, PEDESTAL.moldura, PEDESTAL.tapa];
  let y0 = -PEDESTAL.h / 2;
  const ped = bandas.map(([fh, fw, fd]) => {
    const yc = y0 + (fh * PEDESTAL.h) / 2;
    y0 += fh * PEDESTAL.h;
    return { yc, half: [PEDESTAL.hw * fw, (fh * PEDESTAL.h) / 2, PEDESTAL.hz * fd] };
  });
  const pedConsts = ped.map((b, i) => `const float PY${i}=${gf(b.yc)};const vec3 PH${i}=${gv3(b.half)};`).join("\n");

  const cc = Math.cos(CONCHA.incl), cs = Math.sin(CONCHA.incl);
  const panelX = (CORNISA.marco - CORNISA.marcoInt) / 2;
  const panelHX = (2 * CORNISA.hx - CORNISA.marco - CORNISA.marcoInt) / 2;
  const panelHY = CORNISA.hy - CORNISA.marco;
  const sol = [0, Math.sin(SOL.elevacion), -Math.cos(SOL.elevacion)];

  const PIE = K?.hibrido ? "piedraH" : "piedraE";
  /* ── V2.2A/B: material escultórico (looks A, B y hybrid) ── */
  const matH = K?.hibrido ? `
/* ── V2.2B · modelo híbrido ─────────────────────────────────────────────────────────────────────────
   Tres niveles que no compiten: MACRO (tono, lechos suaves, exposición) siempre; MEDIO (desgaste de aristas y bocas, juntas
   escasas) se funde con la distancia; MICRO (grano) solo en proximidad. Las juntas son lechos de altura irregular que se
   interrumpen con extremos erosionados, nunca llegan a las aristas (allí manda el desgaste) y las cabezas son segmentos
   que mueren en un lecho visible: no hay rejilla ni líneas suspendidas. */
float yLecho(float k,float seed){return (k+.35*(h21(vec2(k,seed+31.))*2.-1.))*JH;}

void capaH(vec2 uv,float seed,float fp,float fd,float ed,float ws,out float hg,out float junta,out float lecho,out vec4 m){
  m=nz(uv+seed*13.7,1./90.,fp);
  float wob=m.a-.5;
  float s1=uv.y/BED1+wob*.45;
  float i1=floor(s1),f1=s1-i1;
  float t1=h21(vec2(i1,seed+1.)),t1n=h21(vec2(i1+1.,seed+1.));
  lecho=mix(t1,t1n,f1*f1*(3.-2.*f1))-.5;
  float y=uv.y+wob*.5;
  float k0=floor(y/JH);
  float k=y<yLecho(k0,seed)?k0-1.:(y>=yLecho(k0+1.,seed)?k0+1.:k0);
  float yb=yLecho(k,seed),yt=yLecho(k+1.,seed);
  float zona=smoothstep(.5,1.7,ed/(DESG*ws));
  float vb=step(h21(vec2(k,seed+21.)),PJ0)*(.5+.5*smoothstep(.25,.7,nz(vec2(uv.x,k*29.7+seed*3.),1./60.,fp).g))*zona;
  float vt=step(h21(vec2(k+1.,seed+21.)),PJ0)*(.5+.5*smoothstep(.25,.7,nz(vec2(uv.x,(k+1.)*29.7+seed*3.),1./60.,fp).g))*zona;
  float jw=JANCHO*(.7+.9*m.b)+.45*fp;
  float g=max(vb*(1.-smoothstep(jw*.6,jw*3.5,y-yb)),vt*(1.-smoothstep(jw*.6,jw*3.5,yt-y)));
  /* Juntas de cabeza: a lo sumo una cada JW, solo entre dos lechos visibles */
  float xc=floor(uv.x/JW);
  float xa=(xc+(h21(vec2(k,xc+seed))-.5)*.6)*JW,xb=(xc+1.+(h21(vec2(k,xc+1.+seed))-.5)*.6)*JW;
  float ea=step(h21(vec2(k*1.7,xc+seed+5.)),.30),eb=step(h21(vec2(k*1.7,xc+1.+seed+5.)),.30);
  float dh=min(mix(1e3,abs(uv.x-xa),ea),mix(1e3,abs(uv.x-xb),eb));
  g=max(g,min(vb,vt)*(1.-smoothstep(jw*.8,jw*2.4,dh)));
  junta=g;
  hg=RELIEVE*(1.8*(m.r-.5)+.4*(m.g-.5))+fd*RELIEVE*(-.38*junta+.30*lecho);
}

vec3 piedraH(vec3 q,inout vec3 n,vec3 alb,float seed,float fp,vec3 bd,float ws){
  vec3 an=abs(n);
  bool pz=an.z>=an.x&&an.z>=an.y,px=!pz&&an.x>=an.y;
  vec2 uv=pz?q.xy:(px?q.zy:q.xz);
  seed+=(pz?0.:(px?1.:2.))*3.+((pz?n.z:(px?n.x:n.y))>0.?17.:0.);
  float ed=bd.x;
  float fd=1.-smoothstep(.10,.9,fp);
  float h0,jn,lc;vec4 m;
  capaH(uv,seed,fp,fd,ed,ws,h0,jn,lc,m);
  if(fp<1.5){
    float e=max(.06,.8*fp);
    float hu,hv,a1,a2;vec4 m1;
    capaH(uv+vec2(e,0.),seed,fp,fd,ed,ws,hu,a1,a2,m1);
    capaH(uv+vec2(0.,e),seed,fp,fd,ed,ws,hv,a1,a2,m1);
    vec3 tu=pz?vec3(1,0,0):(px?vec3(0,0,1):vec3(1,0,0));
    vec3 tv=pz||px?vec3(0,1,0):vec3(0,0,1);
    n=normalize(n-((hu-h0)*tu+(hv-h0)*tv)/e);
  }
  vec4 m2=nz(uv+seed*5.7,1./10.,fp);
  float wd=DESG*ws;
  float we=1.-smoothstep(0.,wd,ed+(m2.g-.5)*wd*1.2);
  float chip=we*smoothstep(.62,.9,m2.b);
  vec3 c=alb;
  /* macro */
  c*=1.+MACRO*(m.r-.5)*2.;
  c*=mix(vec3(1.-HUE,1.,1.+HUE),vec3(1.+HUE,1.-.3*HUE,1.-1.2*HUE),smoothstep(.2,.8,m.g));
  c*=1.+LECHOS*lc*2.;
  c*=1.+.13*(nz(uv+seed*2.3,1./30.,fp).g-.5);
  float st=nz(uv.yx+seed*3.1,1./64.,fp).a;
  c*=1.-LLUVIA*smoothstep(.56,.86,st)*(1.-an.y);
  c*=1.+DEGR*bd.z;
  /* medio */
  c*=1.-JOSC*jn*fd*vec3(1.,.92,.78);
  c=mix(c,c*(1.+CLARO)+.01,we*.55*fd+we*.2*(1.-fd));
  c*=1.-.16*chip*fd;
  c*=1.-PICADO*smoothstep(.36,.16,m2.g)*we*fd;
  /* micro */
  c*=1.+.14*(1.-smoothstep(.03,.25,fp))*(m2.b-.5);
  return c;
}
` : "";
  const mat = K ? `
/* ════════ V2.2A · material escultórico (look ${look}) ════════
   Detalle en el sombreado, no en la geometría: el SDF y los pasos de marcha son los de V2.1. El patrón vive en
   coordenadas LOCALES de cada pieza (no se desliza cuando la pieza flota). Ruido: textura propia con mipmaps. */
#define JH ${gf(K.jh)}
#define JW ${gf(K.jw)}
#define PJ0 ${gf(K.pj0)}
#define PJ1 ${gf(K.pj1)}
#define JANCHO ${gf(K.jancho)}
#define RELIEVE ${gf(K.relieve)}
#define JOSC ${gf(K.jOsc)}
#define HUE ${gf(K.hue)}
#define MACRO ${gf(K.macro)}
#define SUAVE ${gf(K.suave)}
#define LECHOS ${gf(K.lechos)}
#define BLOQ ${gf(K.bloques)}
#define DESG ${gf(K.desgaste)}
#define CLARO ${gf(K.claro)}
#define PICADO ${gf(K.picado)}
#define LLUVIA ${gf(K.lluvia)}
#define DEGR ${gf(K.degrada)}
#define BED1 5.7
#define BED2 2.2

/* Ruido propio con el LOD que corresponde al tamaño del píxel en esa escala (fp = unidades por píxel) */
vec4 nz(vec2 uv,float sc,float fp){return textureLod(uN,uv*sc,max(log2(fp*sc*256.),0.));}

float bordeCaja(vec3 q,vec3 h,vec3 sel){
  vec3 m=h-abs(q)+1e3*sel;
  return min(m.x,min(m.y,m.z));
}

/* Distancia (unidades) a la arista o boca más cercana · profundidad de cavidad 0…1 (0 fuera) · altura relativa en la pieza */
vec3 bordes(int id,vec3 q,vec3 n){
  if(id<2||id==9) return vec3(1e3,0.,0.);
  vec3 an=abs(n);
  float fx=an.x>=an.y&&an.x>=an.z?1.:0.;
  float fy=fx<.5&&an.y>=an.z?1.:0.;
  vec3 sel=vec3(fx,fy,(1.-fx)*(1.-fy));
  float ed=1e3,dep=0.,hy=1.;
  if(id>=4&&id<=7){
    vec3 h=id<=5?BS_H:BI_H;
    float pa=id<=5?BS_P:BI_P,fo=id<=5?BS_F:BI_F;
    hy=h.y;
    vec2 cv=h.xy-pa;
    bool dentro=abs(q.x)<cv.x+.08&&abs(q.y)<cv.y+.08&&q.z<h.z-.04;
    if(dentro){
      dep=clamp((h.z-q.z)/(2.*h.z-fo),0.,1.);
      ed=h.z-q.z;
    }else{
      ed=bordeCaja(q,h,sel);
      if(sel.z>.5&&q.z>0.) ed=min(ed,abs(max(abs(q.x)-cv.x,abs(q.y)-cv.y)));
    }
  }else if(id<=3){
    if(id==3) q.x=-q.x;
    vec3 h=CORN_H;
    hy=h.y;
    ed=bordeCaja(q,h,sel);
    if(sel.z>.5&&q.z>0.) ed=min(ed,abs(max(abs(q.x-CORN_PX)-CORN_PH.x,abs(q.y)-CORN_PH.y)));
  }else{
    float ly=q.y;
    int b=ly>PY3+PH3.y?4:(ly>PY2+PH2.y?3:(ly>PY1+PH1.y?2:(ly>PY0+PH0.y?1:0)));
    vec3 h=b==0?PH0:(b==1?PH1:(b==2?PH2:(b==3?PH3:PH4)));
    float yc=b==0?PY0:(b==1?PY1:(b==2?PY2:(b==3?PY3:PY4)));
    hy=h.y;
    ed=bordeCaja(q-vec3(0.,yc,0.),h,sel);
    q.y-=yc;
  }
  return vec3(ed,dep,clamp(q.y/hy,-1.,1.));
}

/* Capa de piedra en el plano de una cara: relieve, junta (selectiva), tono de sillar y de lecho */
void capa(vec2 uv,float seed,float fp,float fd,float pj,out float hg,out float junta,out float lip,out float tono,out float lecho,out vec4 m){
  m=nz(uv+seed*13.7,1./90.,fp);
  float wob=m.a-.5;
  /* Lechos de estratificación: escalonados (A) o continuos (B) */
  float s1=uv.y/BED1+wob*.45;
  float i1=floor(s1),f1=s1-i1;
  float t1=h21(vec2(i1,seed+1.));
  float t1n=h21(vec2(i1+1.,seed+1.));
  float lineaL=step(.78,h21(vec2(i1*1.7,seed+4.)))*(1.-smoothstep(0.,.22+.5*fp/BED1,f1));
  lecho=mix(t1-.5,mix(t1,t1n,f1*f1*(3.-2.*f1))-.5,SUAVE);
  float i2=floor(uv.y/BED2+wob*.7+7.);
  lecho+=.5*(h21(vec2(i2,seed+11.))-.5)*(1.-SUAVE);
  /* Sillería grande y selectiva: la hilada y el sillar existen, pero solo algunas juntas se marcan */
  float cyc=JH*3.1;
  float gi=floor(uv.y/cyc);
  float f=(uv.y/cyc-gi)*3.1;
  float r0=step(1.,f),r1=step(1.8,f);
  float row=gi*3.+r0+r1;
  float y0=mix(0.,mix(1.,1.8,r1),r0);
  float hh=mix(1.,mix(.8,1.3,r1),r0);
  float fy=(f-y0)/hh;
  float rowH=hh*JH;
  float bl=JW*(.75+.5*h21(vec2(row,seed)));
  float uu=uv.x/bl+h21(vec2(row*1.7,seed+3.));
  float bi=floor(uu),fx=uu-bi;
  vec2 cell=vec2(bi,row)+seed*7.;
  tono=h21(cell)-.5;
  float vB=step(h21(vec2(row*2.3,seed+21.)),pj);
  float vT=step(h21(vec2(row*2.3+2.3,seed+21.)),pj);
  float vL=step(h21(cell*1.31+5.),pj*.8);
  float vR=step(h21((cell+vec2(1,0))*1.31+5.),pj*.8);
  float dh=min(mix(1e3,fy*rowH,vB),mix(1e3,(1.-fy)*rowH,vT));
  float dv=min(mix(1e3,fx*bl,vL),mix(1e3,(1.-fx)*bl,vR));
  float dj=min(dh,dv);
  float jw=JANCHO+.45*fp;
  float rot=.3+.7*smoothstep(.22,.66,.55*m.b+.45*m.g);
  junta=(1.-smoothstep(jw,jw*3.2,dj))*rot;
  lip=smoothstep(jw*3.2,jw*7.,dj)*(1.-smoothstep(jw*7.,jw*16.,dj))*rot;
  hg=RELIEVE*(1.8*(m.r-.5)+.4*(m.g-.5))+fd*RELIEVE*(-.42*junta+.07*lip-.07*lineaL+.22*(t1-.5)+.10*tono);
}

vec3 piedraE(vec3 q,inout vec3 n,vec3 alb,float seed,float fp,vec3 bd,float ws){
  vec3 an=abs(n);
  bool pz=an.z>=an.x&&an.z>=an.y,px=!pz&&an.x>=an.y;
  vec2 uv=pz?q.xy:(px?q.zy:q.xz);
  seed+=(pz?0.:(px?1.:2.))*3.+((pz?n.z:(px?n.x:n.y))>0.?17.:0.);
  float ed=bd.x;
  float fd=1.-smoothstep(.10,.9,fp);
  float pj=mix(PJ1,PJ0,smoothstep(0.,3.4*ws,ed));
  float h0,jn,lp,tn,lc;vec4 m;
  capa(uv,seed,fp,fd,pj,h0,jn,lp,tn,lc,m);
  if(fp<1.5){
    float e=max(.06,.8*fp);
    float hu,hv,a1,a2,a3,a4;vec4 m1;
    capa(uv+vec2(e,0.),seed,fp,fd,pj,hu,a1,a2,a3,a4,m1);
    capa(uv+vec2(0.,e),seed,fp,fd,pj,hv,a1,a2,a3,a4,m1);
    vec3 tu=pz?vec3(1,0,0):(px?vec3(0,0,1):vec3(1,0,0));
    vec3 tv=pz||px?vec3(0,1,0):vec3(0,0,1);
    n=normalize(n-((hu-h0)*tu+(hv-h0)*tv)/e);
  }
  vec4 m2=nz(uv+seed*5.7,1./10.,fp);
  float wd=DESG*ws;
  float we=1.-smoothstep(0.,wd,ed+(m2.g-.5)*wd*1.4);
  float chip=we*smoothstep(.66,.92,.5*m.b+.5*m2.b);
  vec3 c=alb;
  c*=1.+MACRO*(m.r-.5)*2.;
  c*=mix(vec3(1.-HUE,1.,1.+HUE),vec3(1.+HUE,1.-.3*HUE,1.-1.2*HUE),smoothstep(.3,.7,m.g));
  c*=1.+LECHOS*lc*2.+BLOQ*tn*2.;
  float st=nz(uv.yx+seed*3.1,1./64.,fp).a;
  c*=1.-LLUVIA*smoothstep(.56,.86,st)*(1.-an.y);
  c*=.94+.12*m2.b;
  c*=1.-PICADO*smoothstep(.36,.16,m2.g)*fd;
  c*=1.-JOSC*jn*fd;
  c*=1.+.10*lp*fd;
  c*=1.+DEGR*bd.z;
  c=mix(c,c*(1.+CLARO)+.012,we*.6);
  c*=1.-.38*chip;
  return c;
}

${matH}
vec3 detalleE(int id,vec3 q,inout vec3 n,vec3 alb,float t,vec3 bd){
  float fp=PXW*t;
  if(id>=2&&id<=7) return ${PIE}(q,n,alb,float(id),fp,bd,id<=3?1.3:1.);
  if(id==8){
    float ly=q.y;
    if(ly<=PY0+PH0.y||ly>PY3+PH3.y) return ${PIE}(q,n,alb,8.,fp,bd,2.4);
    vec4 m=nz(q.xy+8.,1./90.,fp);
    if(ly>PY1+PH1.y&&ly<=PY2+PH2.y) return alb*(.88+.24*m.g);
    return alb*(.92+.14*m.r);
  }
  return alb;
}
` : "";

  return `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCam;
uniform mat3 uBase;
uniform vec3 uC[${FRAGMENTOS.length}];
uniform vec3 uHB;
uniform float uProx;
uniform float uFocal;
uniform int uDbg;
${si("", "uniform sampler2D uN;")}
out vec4 C;

#define PASOS ${P}
#define SPASOS ${S}
#define RPASOS ${RP}
#define EPS 0.002
#define PI 3.14159265

/* ── Medidas (composicion.ts) ── */
const vec3 CORN_H=${hc(CORNISA)};
const float CORN_RB=${gf(CORNISA.rb * rbK)},CORN_RN=${gf(CORNISA.rn)},CORN_RP=${gf(CORNISA.rp)},CORN_PROF=${gf(CORNISA.prof)};
const float CORN_PX=${gf(panelX)};
const vec3 CORN_PH=${gv3([panelHX, panelHY, 0])};
const vec3 BS_H=${hc(BLOQUE_SUP)};
const vec3 BI_H=${hc(BLOQUE_INF)};
const float BS_P=${gf(BLOQUE_SUP.pared)},BI_P=${gf(BLOQUE_INF.pared)};
const float BS_RB=${gf(BLOQUE_SUP.rb * rbK)},BI_RB=${gf(BLOQUE_INF.rb * rbK)},BS_F=${gf(BLOQUE_SUP.fondo)},BI_F=${gf(BLOQUE_INF.fondo)};
${pedConsts}
const float PS=${gf(PEDESTAL.s)};
const vec3 PED_B=${gv3([PEDESTAL.hw + 0.02 * PEDESTAL.s, PEDESTAL.h / 2 + 0.02 * PEDESTAL.s, PEDESTAL.hz + 0.02 * PEDESTAL.s])};
const vec2 PED_FOOT=vec2(${gf(PEDESTAL.hw)},${gf(PEDESTAL.hz)});
const float CR=${gf(CONCHA.r)},CHB=${gf(CONCHA.hb)},CT=${gf(CONCHA.grosor)},CW=${gf(CONCHA.onda)},CF=${gf(CONCHA.feston)},CN=${gf(CONCHA.nervios)};
const float CC=${gf(cc)},CS=${gf(cs)};
const vec3 EGG_R=${gv3([HUEVO.rx, HUEVO.ry, HUEVO.rx])};
const vec3 HA=${gv3(HILO.a)};
const float HR=${gf(HILO.r)};
const vec3 BMIN=${gv3(CAJA_ESCENA.min)};
const vec3 BMAX=${gv3(CAJA_ESCENA.max)};
const vec3 LP=${gv3(LUZ_VACIO.pos)};
const float LR=${gf(LUZ_VACIO.radio)};
const vec3 SUN=${gv3(sol)};
const float CH=1.5; /* altura de hilada, igual en todas las piezas: da la escala */

float PXW; /* ángulo de un píxel (rad) */

/* ── SDF primitivas ── */
float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float sdRBox(vec3 p,vec3 b,float r){return sdBox(p,b-r)-r;}
float sdEllipsoid(vec3 p,vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/k1;}
float sdCapsule(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}

float h21(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float hash3(vec3 p){p=fract(p*vec3(443.9,397.3,491.2));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<2;i++){s+=a*vn(p);p=p*2.03+17.1;a*=.5;}return s;}

/* ════════════════════════════════════════════════════════════
   FRAGMENTOS — cada SDF es max(primer término, …), así que su valor nunca baja del
   primer término (cota de la poda). Posiciones: uC[i] (CPU).
   ════════════════════════════════════════════════════════════ */
float sdCornisa(vec3 q){
  float d=sdRBox(q,CORN_H,CORN_RB);
  float le=length(q.xy-vec2(CORN_H.x,-CORN_H.y));
  d=max(d,CORN_RN-le);
  float rec=max(sdBox(q-vec3(CORN_PX,0.,CORN_H.z),vec3(CORN_PH.x,CORN_PH.y,CORN_PROF)),CORN_RP-le);
  return max(d,-rec);
}

/* Volumen hueco, abierto por delante (+z); el fondo deja una pared de espesor «fondo» */
float sdHueco(vec3 q,vec3 h,float pared,float rb,float fondo){
  float d=sdRBox(q,h,rb);
  float hzc=h.z*1.9;
  float zc=-h.z+fondo+hzc;
  ${si(
    "return max(d,-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc)));",
    `/* Boca con filete (máximo suave: nunca baja del máximo duro, la cota de la poda se conserva) */
  float c=-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc));
  float k=${gf(K ? K.rim : 1)}*max(rb,.1);
  float hh=max(k-abs(d-c),0.);
  return max(d,c)+hh*hh*.25/k;`)}
}
${cavidad === 'b1' ? `
/* B1 — Ruina sobria: abertura amplia (unión de dos brechas) + pilar macizo */
float sdHuecoCavB1(vec3 q,vec3 h,float pared,float rb,float fondo){
  float d=sdRBox(q,h,rb);
  float hzc=h.z*1.9;
  float zc=-h.z+fondo+hzc;
  ${si(
    "d=max(d,-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc)));",
    `float c=-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc));
  float k=${gf(K ? K.rim : 1)}*max(rb,.1);
  float hh=max(k-abs(d-c),0.);
  d=max(d,c)+hh*hh*.25/k;`)}
  d=max(d,-min(
    sdRBox(q-vec3(-.6,1.2,-h.z),vec3(2.6,4.,fondo*2.),.5),
    sdRBox(q-vec3(.8,-3.,-h.z),vec3(2.2,2.5,fondo*2.),.35)));
  float pb=-(h.y-pared)+.3,pt=-(h.y-pared)+(h.y-pared)*2.*.42;
  d=min(d,sdRBox(q-vec3(-(h.x-pared)*.5,(pb+pt)*.5,-h.z+fondo+2.8),vec3(.65,(pt-pb)*.5,2.5),.15));
  return d;
}` : ''}
${cavidad === 'b2' ? `
/* B2 — Ruina estratificada: doble brecha + cornisa a nivel del dintel + estante inferior */
float sdHuecoCavB2(vec3 q,vec3 h,float pared,float rb,float fondo){
  float d=sdRBox(q,h,rb);
  float hzc=h.z*1.9;
  float zc=-h.z+fondo+hzc;
  ${si(
    "d=max(d,-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc)));",
    `float c=-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc));
  float k=${gf(K ? K.rim : 1)}*max(rb,.1);
  float hh=max(k-abs(d-c),0.);
  d=max(d,c)+hh*hh*.25/k;`)}
  d=max(d,-min(
    sdRBox(q-vec3(.2,3.5,-h.z),vec3(2.5,2.8,fondo*2.),.35),
    sdRBox(q-vec3(-.3,-3.5,-h.z),vec3(2.8,2.5,fondo*2.),.3)));
  float cy1=-(h.y-pared)+(h.y-pared)*2.*.49;
  d=min(d,sdRBox(q-vec3(-(h.x-pared)*.15,cy1,-h.z+fondo+3.),vec3((h.x-pared)*.55,.4,2.8),.1));
  float cy2=-(h.y-pared)+(h.y-pared)*2.*.2;
  d=min(d,sdRBox(q-vec3((h.x-pared)*.3,cy2,-h.z+fondo+2.),vec3((h.x-pared)*.4,.28,1.6),.06));
  return d;
}` : ''}
${cavidad === 'completa' ? `
/* ═══ COMPOSICIÓN INTEGRAL — cuatro cavidades diferenciadas ═══ */

/* Bloq 4 — La brecha: abertura amplia asimétrica + contrafuerte anclado a esquina inferior derecha */
float sdHuecoBloq4(vec3 q,vec3 h,float pared,float rb,float fondo){
  float d=sdRBox(q,h,rb);
  float hzc=h.z*1.9;
  float zc=-h.z+fondo+hzc;
  ${si(
    "d=max(d,-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc)));",
    `float c=-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc));
  float k=${gf(K ? K.rim : 1)}*max(rb,.1);
  float hh=max(k-abs(d-c),0.);
  d=max(d,c)+hh*hh*.25/k;`)}
  /* Brecha: unión de dos recortes descentrados, desplazada arriba */
  d=max(d,-min(
    sdRBox(q-vec3(-.5,1.8,-h.z),vec3(2.8,4.2,fondo*2.),.45),
    sdRBox(q-vec3(.9,-2.0,-h.z),vec3(2.4,3.2,fondo*2.),.3)));
  /* Contrafuerte: masa anclada a esquina inferior derecha de la cavidad */
  float cbx=h.x-pared-.3;
  float cby=-(h.y-pared)+.2;
  d=min(d,sdRBox(q-vec3(cbx*.5,cby+1.8,-h.z+fondo+2.5),vec3(1.1,2.2,2.5),.2));
  return d;
}

/* Bloq 5 — La masa: cavidad profunda y cerrada + plano horizontal interior parcialmente colapsado */
float sdHuecoBloq5(vec3 q,vec3 h,float pared,float rb,float fondo){
  float d=sdRBox(q,h,rb);
  /* Muro posterior más grueso: fondo × 1.4 */
  float fondoG=fondo*1.4;
  float hzc=h.z*1.9;
  float zc=-h.z+fondoG+hzc;
  ${si(
    "d=max(d,-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc)));",
    `float c=-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc));
  float k=${gf(K ? K.rim : 1)}*max(rb,.1);
  float hh=max(k-abs(d-c),0.);
  d=max(d,c)+hh*hh*.25/k;`)}
  /* Plano horizontal interior: losa colapsada a 40% de la altura, apoyada a la izquierda */
  float py=-(h.y-pared)+(h.y-pared)*2.*.4;
  d=min(d,sdRBox(q-vec3(-(h.x-pared)*.25,py,-h.z+fondoG+2.2),vec3((h.x-pared)*.65,.35,2.0),.08));
  return d;
}

/* Bloq 6 — El derrumbe: colapso asimétrico en cuadrante superior izquierdo del muro posterior */
float sdHuecoBloq6(vec3 q,vec3 h,float pared,float rb,float fondo){
  float d=sdRBox(q,h,rb);
  float hzc=h.z*1.9;
  float zc=-h.z+fondo+hzc;
  ${si(
    "d=max(d,-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc)));",
    `float c=-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc));
  float k=${gf(K ? K.rim : 1)}*max(rb,.1);
  float hh=max(k-abs(d-c),0.);
  d=max(d,c)+hh*hh*.25/k;`)}
  /* Derrumbe: abertura en cuadrante superior izquierdo (dos recortes descentrados formando L invertida) */
  float bx=h.x-pared;
  float by=h.y-pared;
  d=max(d,-min(
    sdRBox(q-vec3(-bx*.45,by*.55,-h.z),vec3(bx*.65,by*.55,fondo*2.),.25),
    sdRBox(q-vec3(-bx*.15,by*.35,-h.z),vec3(bx*.35,by*.75,fondo*2.),.2)));
  return d;
}
` : ''}

float sdPedestal(vec3 q){
  float d=sdRBox(q-vec3(0.,PY4,0.),PH4,.01*PS);
  d=min(d,sdRBox(q-vec3(0.,PY3,0.),PH3,.006*PS));
  float f=sdRBox(q-vec3(0.,PY2,0.),PH2,.008*PS);
  f=max(f,-sdBox(q-vec3(0.,PY2,PH2.z),vec3(PH2.x-.18*PS,PH2.y-.06*PS,.035*PS)));
  d=min(d,f);
  d=min(d,sdRBox(q-vec3(0.,PY1,0.),PH1,PH1.y*.9));
  return min(d,sdRBox(q-vec3(0.,PY0,0.),PH0,.008*PS));
}

struct Hit{float d;int id;};

Hit objetos(vec3 p,Hit h){
  vec3 q;float d;

  /* 8 — Pedestal */
  q=p-uC[8];
  if(sdBox(q,PED_B)<h.d){
    d=sdPedestal(q);
    if(d<h.d) h=Hit(d,8);
  }

  /* 1 — Huevo y hilo (baratos: siempre) */
  q=p-uC[1];
  d=sdEllipsoid(q,EGG_R);
  if(d<h.d) h=Hit(d,1);
  d=sdCapsule(q,HA,uHB,max(HR,.6*PXW*length(p-uCam)));
  if(d<h.d) h=Hit(d,9);

  /* 0 — Concha: cuenco abierto inclinado hacia la cámara */
  q=p-uC[0];
  if(length(q)-${gf(CONCHA.r + CONCHA.onda + CONCHA.margen)}<h.d){
    vec3 s=vec3(q.x,q.y*CC+q.z*CS,-q.y*CS+q.z*CC);
    float dO=max(sdEllipsoid(s,vec3(CR,CHB,CR)),length(s)-CR);
    if(dO-CW<h.d){
      float on=sin(atan(s.z,s.x)*CN);
      float dI=sdEllipsoid(s,vec3(CR-CT,CHB-CT,CR-CT));
      d=max(max(dO,-dI),s.y+CF*on);
      d+=on*CW*smoothstep(0.,.1*CR,length(s.xz));
      if(d<h.d) h=Hit(d,0);
    }
  }

  /* 2, 3 — Cornisas */
  q=p-uC[2];
  if(length(q)-${gf(radio(CORNISA, ESC.cornisa))}<h.d){
    d=sdCornisa(q);
    if(d<h.d) h=Hit(d,2);
  }
  q=p-uC[3];
  if(length(q)-${gf(radio(CORNISA, ESC.cornisa))}<h.d){
    d=sdCornisa(vec3(-q.x,q.y,q.z));
    if(d<h.d) h=Hit(d,3);
  }

  /* 4, 5 — Volúmenes superiores */
  q=p-uC[4];
  if(length(q)-${gf(radio(BLOQUE_SUP, ESC.sup))}<h.d){
    d=${cavidad === 'completa' ? 'sdHuecoBloq4' : cavidad === 'b1' ? 'sdHuecoCavB1' : cavidad === 'b2' ? 'sdHuecoCavB2' : 'sdHueco'}(q,BS_H,BS_P,BS_RB,BS_F);
    if(d<h.d) h=Hit(d,4);
  }
  q=p-uC[5];
  if(length(q)-${gf(radio(BLOQUE_SUP, ESC.sup))}<h.d){
    d=${cavidad === 'completa' ? 'sdHuecoBloq5' : 'sdHueco'}(q,BS_H,BS_P,BS_RB,BS_F);
    if(d<h.d) h=Hit(d,5);
  }

  /* 6, 7 — Volúmenes inferiores */
  q=p-uC[6];
  if(length(q)-${gf(radio(BLOQUE_INF, ESC.inf))}<h.d){
    d=${cavidad === 'completa' ? 'sdHuecoBloq6' : 'sdHueco'}(q,BI_H,BI_P,BI_RB,BI_F);
    if(d<h.d) h=Hit(d,6);
  }
  q=p-uC[7];
  if(length(q)-${gf(radio(BLOQUE_INF, ESC.inf))}<h.d){
    d=sdHueco(q,BI_H,BI_P,BI_RB,BI_F);
    if(d<h.d) h=Hit(d,7);
  }
  return h;
}

float mapD(vec3 p){return objetos(p,Hit(1e4,-1)).d;}

/* Normal con un paso del tamaño de medio píxel a esa distancia */
vec3 nor(vec3 p,float t){
  float e=.6*max(.002,.5*PXW*t);
  vec2 k=vec2(1,-1);
  return normalize(k.xyy*mapD(p+k.xyy*e)+k.yyx*mapD(p+k.yyx*e)+k.yxy*mapD(p+k.yxy*e)+k.xxx*mapD(p+k.xxx*e));
}

vec2 cajaRayo(vec3 ro,vec3 rd,vec3 bmin,vec3 bmax){
  vec3 r=sign(rd+1e-20)*max(abs(rd),1e-5);
  vec3 inv=1./r;
  vec3 a=(bmin-ro)*inv,b=(bmax-ro)*inv;
  vec3 mn=min(a,b),mx=max(a,b);
  return vec2(max(max(mn.x,mn.y),mn.z),min(min(mx.x,mx.y),mx.z));
}

/* Sombra suave de la luz clave. Si el rayo no cruza la caja del conjunto inflada, no hay nada que marchar. */
float sombra(vec3 ro,vec3 rd,float mi,float ma){
  vec2 tb=cajaRayo(ro,rd,BMIN-12.,BMAX+12.);
  if(tb.x>=tb.y||tb.y<mi) return 1.;
  float r=1.,t=mi;
  for(int i=0;i<SPASOS;i++){
    float h=mapD(ro+rd*t);
    if(h<.003*t) return 0.;
    r=min(r,15.*h/t);
    if(r<.02) return 0.;
    t+=clamp(h,.08+.02*t,18.);
    if(t>ma||t>tb.y) break;
  }
  return clamp(r,0.,1.);
}

/* AO de dos muestras con radios proporcionales a la distancia (tamaño de píxel) */
float ao(vec3 p,vec3 n,float t){
  float r=0.,w=1.;
  for(int i=1;i<=2;i++){
    float d=float(i)*(.7+.011*t);
    r+=w*(d-mapD(p+n*d))/d;
    w*=.55;
  }
  return clamp(1.-r*1.1,0.,1.);
}

/* ════════ Cielo, cabos, niebla ════════ */
vec3 cielo(vec3 rd){
  float y=max(rd.y,0.);
  vec3 c=mix(${lin(PL.cieloHor)},${lin(PL.cielo1)},smoothstep(0.,.07,y));
  c=mix(c,${lin(PL.cielo2)},smoothstep(.05,.26,y));
  c=mix(c,${lin(PL.cielo3)},smoothstep(.2,.55,y));
  c=mix(c,${lin(PL.cieloZen)},smoothstep(.5,1.,y));
  /* Calidez rosada/dorada cerca del horizonte en todo el acimut */
  vec3 warmHor=vec3(.52,.26,.14);
  c+=warmHor*smoothstep(.06,0.,y)*.18;
  /* Variación lateral: ligeramente más cálido hacia la derecha (cabo dorado) */
  vec3 sd=normalize(vec3(rd.x,0.,rd.z));
  float lateral=sd.x*.5+.5;
  c=mix(c,c*vec3(1.03,1.0,.96),lateral*smoothstep(.08,0.,y)*.35);
  /* Bruma baja: neblina translúcida pegada al horizonte */
  float bruma=smoothstep(.025,0.,y)*smoothstep(-.005,0.,rd.y);
  c=mix(c,${lin(PL.cieloHor)}*vec3(1.04,1.01,.97),.35*bruma);
  /* Al alinearse, el mundo frío se aquieta */
  c*=1.-.42*uProx*smoothstep(.0,.40,y);
  /* Resplandor del sol */
  float azc=max(dot(sd,vec3(0.,0.,-1.)),0.);
  float yy=rd.y-SUN.y;
  float bw=.15+.10*uProx;float banda=exp(-yy*yy/(bw*bw));
  float g=(pow(azc,30.)*.90+pow(azc,12.)*.32*uProx+pow(azc,5.)*(.06+.24*uProx))*banda*(.40+.85*uProx);
  return mix(c,vec3(.95,.60,.33),clamp(g,0.,.92));
}

/* Siluetas angulares de los cabos del horizonte: devuelve el color y la opacidad. Asimétricos y con forma
   propia (un cabo largo y bajo a la izquierda, otro más alto y macizo a la derecha, con estratos horizontales);
   el sol, detrás, los perfila con un borde cálido. V2.6B.3A: cabos más prominentes, estratos irregulares,
   color con identidad propia (izquierdo frío/oscuro, derecho cálido/dorado). */
vec4 costas(vec3 rd){
  float az=atan(rd.x,-rd.z);
  float e=rd.y;
  float aa=PXW*1.5;
  vec3 hz=cielo(normalize(vec3(rd.x,.0,rd.z)));
  vec3 calido=vec3(.95,.62,.36);

  /* Cadena lejana (ambos lados): variación de altura asimétrica */
  float h0=.016+.013*sin(az*5.+.7)+.008*sin(az*11.+1.5)+.005*sin(az*23.+3.1)+.003*sin(az*37.);
  h0*=smoothstep(.42,.95,abs(az));
  float a0=(1.-smoothstep(h0-aa,h0,e))*step(0.,e);
  vec3 c0=mix(hz,vec3(.28,.30,.50),.45);
  c0*=.90+.15*sin(az*7.+2.);
  vec4 o=vec4(c0,a0);

  /* Cabo izquierdo: bajo, oscuro, frío — masa orgánica con perfiles irregulares */
  float u1=(az+.66)/.26;
  float u1b=(az+1.0)/.12;
  float u1c=(az+.48)/.08;
  float b1=exp(-u1*u1);
  float b1b=exp(-u1b*u1b);
  float b1c=exp(-u1c*u1c);
  float rug1=fbm(vec2(az*45.,1.))-.5;
  float h1=max(.044*b1+.009*b1*rug1*2.+.015*b1b+.012*b1c+.004*b1*sin(az*60.+3.),1e-4);
  float a1=(1.-smoothstep(h1-aa,h1,e))*step(0.,e);
  float k1=clamp(e/h1,0.,1.);
  vec3 c1=mix(hz,vec3(.24,.22,.30),.78);
  float st1=floor(k1*4.);
  c1*=.82+.22*h21(vec2(st1,7.));
  c1=mix(c1*.82,c1*1.06+calido*.06,k1*k1*k1);
  o=vec4(mix(o.rgb,c1,a1),max(o.a,a1));

  /* Cabo derecho: alto, macizo, cálido — formación estratificada con escalones y una cresta luminosa */
  float x2=(az-.52)/.38;
  float in2=step(abs(x2),1.);
  float xc=clamp(x2,-1.,1.);
  float prof2=(1.-smoothstep(-.15,.85,xc))*smoothstep(-1.,-.30,xc);
  float rug2=fbm(vec2(az*26.,4.))-.5;
  float escal=.015*sin(az*18.+1.)*.5*(1.+smoothstep(.0,.5,prof2));
  float h2=max(in2*prof2*(.105+.035*rug2)+escal,1e-4);
  float a2=(1.-smoothstep(h2-aa,h2,e))*step(0.,e)*in2;
  float k2=clamp(e/h2,0.,1.);
  float st2=floor(k2*8.);
  vec3 base2=mix(hz,vec3(.56,.40,.24),.74);
  base2*=.80+.30*h21(vec2(st2,3.));
  float crs=smoothstep(.85,.98,k2);
  base2=mix(base2,base2*1.25+vec3(.10,.06,.02),crs);
  base2=mix(base2*.84,base2*1.08+calido*.14,k2*k2);
  o=vec4(mix(o.rgb,base2,a2),max(o.a,a2));
  return o;
}

vec3 fondoCielo(vec3 rd){
  vec3 c=cielo(rd);
  if(rd.y<.16){
    vec4 k=costas(rd);
    c=mix(c,k.rgb,k.a);
  }
  return c;
}

/* Perspectiva aérea: depende de la altura (más densa junto al mar) y toma el color del cielo cercano al
   horizonte en esa dirección, con su calidez hacia el sol. V2.6B.3A: más densa cerca del mar y entre los
   planos más lejanos; el factor de altura separa los fragmentos próximos de la costa. */
vec3 niebla(vec3 col,vec3 dir,float dist,float ymid){
  float hf=exp(-max(ymid,0.)*.014);
  float dens=${si(".00105", (0.00105 * (K?.nieb ?? 1)).toFixed(5))}*(0.7+0.3*hf);
  float f=1.-exp(-dist*dens);
  vec3 fc=cielo(normalize(vec3(dir.x,.035,dir.z)));
  return mix(col,fc,f);
}

/* ════════ Materiales ════════ */
vec3 albedoDe(int id,vec3 pos){
  if(id==0) return ${lin(PL.concha)};
  if(id==1||id==9) return ${lin(PL.huevo)};
  if(id<=3) return ${lin(PL.cornisa)};
  if(id<=7) return ${lin(PL.bloque)};
  float ly=pos.y-uC[8].y;
  vec3 a=${lin(PL.zocalo)};
  a=ly>PY0+PH0.y?${lin(PL.rollo)}:a;
  a=ly>PY1+PH1.y?${lin(PL.friso)}:a;
  a=ly>PY2+PH2.y?${lin(PL.moldura)}:a;
  a=ly>PY3+PH3.y?${lin(PL.tapa)}:a;
  return a;
}

/* Sillería: hiladas de altura constante en todas las piezas (ciclo de tres alturas), sillares con tono propio, juntas
   que se funden con la distancia, manchas amplias y vetas de lluvia. sillar() da la celda, su tono, la distancia a la
   junta más cercana y la altura de la hilada; el color y el relieve (normal) salen de él. */
void sillar(vec2 uv,float seed,out vec2 cell,out float tone,out float dj,out float rowH,out vec2 fxy){
  float cyc=CH*3.1;
  float gi=floor(uv.y/cyc);
  float f=(uv.y/cyc-gi)*3.1;
  float r0=step(1.,f),r1=step(1.8,f);
  float row=gi*3.+r0+r1;
  float y0=mix(0.,mix(1.,1.8,r1),r0);
  float hh=mix(1.,mix(.8,1.3,r1),r0);
  float fy=(f-y0)/hh;
  rowH=hh*CH;
  float bl=2.5+1.7*h21(vec2(row,seed));
  float uu=uv.x/bl+h21(vec2(row*1.7,seed+3.));
  float bi=floor(uu);
  float fx=uu-bi;
  cell=vec2(bi,row)+seed*7.;
  tone=h21(cell);
  dj=min(min(fx,1.-fx)*bl,min(fy,1.-fy)*rowH);
  fxy=vec2(min(fx,1.-fx)*bl/rowH,min(fy,1.-fy));
}

/* Altura del relieve en uv (0 en la junta, 1 en la cara, algo abombada) */
float alturaSillar(vec2 uv,float seed){
  vec2 cell,fxy;float tone,dj,rowH;
  sillar(uv,seed,cell,tone,dj,rowH,fxy);
  /* Junta hundida y suave, cara ondulada y con desnivel propio: sillería desgastada, no azulejo */
  return smoothstep(0.,.6,dj)*.8+.55*vn(uv*1.15+seed*9.)+.35*(tone-.5);
}

vec3 piedra(vec3 pos,inout vec3 n,vec3 alb,float seed,float fp){
  vec3 an=abs(n);
  bool pz=an.z>=an.x&&an.z>=an.y,px=!pz&&an.x>=an.y;
  vec2 uv=pz?pos.xy:(px?pos.zy:pos.xz);
  vec2 cell,fxy;float tone,dj,rowH;
  sillar(uv,seed,cell,tone,dj,rowH,fxy);
  float jw=.035+.5*fp;
  float joint=1.-smoothstep(jw,jw*2.6,dj);
  float fade=1.-smoothstep(.22,.65,fp/CH);
  /* Relieve: la normal sigue el gradiente de la altura del sillar (juntas hundidas, caras abombadas) */
  float amt=.06*(1.-smoothstep(.15,.5,fp/CH));
  if(amt>.001){
    float e=max(.05,.8*fp);
    float h0=alturaSillar(uv,seed);
    float gu=(alturaSillar(uv+vec2(e,0.),seed)-h0)/e;
    float gv=(alturaSillar(uv+vec2(0.,e),seed)-h0)/e;
    vec3 tu=pz?vec3(1,0,0):(px?vec3(0,0,1):vec3(1,0,0));
    vec3 tv=pz||px?vec3(0,1,0):vec3(0,0,1);
    n=normalize(n-amt*(gu*tu+gv*tv));
  }
  vec3 c=alb*(.80+.34*tone);
  c*=mix(vec3(1.),vec3(.95,.98,1.06),h21(cell+9.));
  float centro=smoothstep(0.,.5,min(fxy.x,fxy.y));
  c*=.90+.14*centro;
  /* Erosión: manchas amplias, picado fino y vetas de lluvia en las caras verticales */
  float w1=fbm(uv*.028+seed*3.);
  float w2=fbm(vec2(uv.x*.5,uv.y*.025)+seed*5.);
  float w3=vn(uv*.7+seed);
  c*=.70+.52*w1;
  c*=1.-.34*smoothstep(.42,.9,w2)*(1.-an.y);
  c*=.93+.14*w3;
  float lip=smoothstep(jw*2.6,jw*6.,dj)*(1.-smoothstep(jw*6.,jw*15.,dj));
  c*=1.+.10*lip*fade;
  c*=1.-.40*joint*fade;
  return mix(c,alb*.9,(1.-fade)*.45);
}

/* Detalle propio de cada pieza (sobre el albedo plano) */
vec3 detalle(int id,vec3 pos,inout vec3 n,vec3 alb,float t){
  float fp=PXW*t;
  if(id>=2&&id<=7) return piedra(pos,n,alb,float(id),fp);
  if(id==8){
    float ly=pos.y-uC[8].y;
    if(ly<=PY0+PH0.y||ly>PY3+PH3.y) return piedra(pos,n,alb,8.,fp);
    if(ly>PY1+PH1.y&&ly<=PY2+PH2.y){
      /* friso: veta suave de mármol */
      float v=fbm(vec2(pos.x*.11+pos.y*.3,pos.y*.5));
      return alb*(.88+.26*v);
    }
    return alb*(.94+.1*fbm(pos.xy*.4));
  }
  return alb;
}

${mat}
/* Distancia en planta de un punto del mar a la huella del pedestal (sombra de contacto y espuma) */
float contactoPedestal(vec3 p){
  vec2 q=abs(p.xz-uC[8].xz)-PED_FOOT;
  float d=length(max(q,0.))+min(max(q.x,q.y),0.);
  return d;
}

/* ════════ Reflejo del conjunto en el mar (marcha corta y color plano) ════════ */
vec4 reflejo(vec3 o,vec3 d,float td){
  vec2 tb=cajaRayo(o,d,BMIN,BMAX);
  if(tb.x>=tb.y||tb.y<=0.) return vec4(0.);
  float t=max(tb.x,0.);
  for(int i=0;i<RPASOS;i++){
    Hit m=objetos(o+d*t,Hit(1e4,-1));
    if(m.d<max(.01,.6*PXW*(t+td))){
      vec3 p=o+d*t;
      vec3 a=albedoDe(m.id,p);
      float lum=.30+.55*smoothstep(0.,115.,p.y);
      vec3 c=a*lum*1.7;
      c=niebla(c,d,t+td,.5*p.y);
      return vec4(c,1.);
    }
    t+=m.d;
    if(t>tb.y) break;
  }
  return vec4(0.);
}

/* ════════ Mar ════════ */
vec3 mar(vec3 ro,vec3 rd,float ts){
  vec3 p=ro+rd*ts;
  float T=uTime;
  float att=1./(1.+ts*.012);
  vec2 g=vec2(0.);
  { vec2 d=vec2(.20,-.98); float k=.045; g+=d*k*.90*cos(dot(p.xz,d)*k+T*.55); }
  { vec2 d=vec2(-.50,-.86); float k=.110; g+=d*k*.35*cos(dot(p.xz,d)*k+T*.80+1.3); }
  { vec2 d=vec2(.80,-.60); float k=.270; g+=d*k*.12*cos(dot(p.xz,d)*k+T*1.10+2.6); }
  { vec2 d=vec2(-.20,-.98); float k=.630; g+=d*k*.04*cos(dot(p.xz,d)*k+T*1.50+.4); }
  g*=.40*att;
  vec3 n=normalize(vec3(-g.x,1.,-g.y));
  float cs=clamp(-dot(rd,n),0.,1.);
  float F=.02+.98*pow(1.-cs,5.);
  vec3 rr=reflect(rd,n);
  vec3 refl=fondoCielo(rr);
  if(F>.035){
    vec4 rg=reflejo(p+n*.05,rr,ts);
    refl=mix(refl,rg.rgb,rg.a);
  }
  /* Color propio del agua: variación cromática según distancia y dirección lateral */
  vec3 bodyNear=vec3(.035,.045,.180);
  vec3 bodyFar=vec3(.105,.135,.360);
  float dfact=smoothstep(0.,.5,1.-cs);
  vec3 body=mix(bodyNear,bodyFar,dfact);
  /* Variación lateral: lila hacia la izquierda (cabo frío), azul verdoso hacia la derecha (cabo cálido) */
  vec3 flatDir=normalize(vec3(rd.x,0.,rd.z));
  float lr=flatDir.x*.5+.5;
  body=mix(body*vec3(1.02,.98,1.06),body*vec3(.97,1.02,.96),lr*.3);
  /* Variación de distancia: más luminoso y pálido lejos */
  float distFade=1.-exp(-ts*.0045);
  body=mix(body,body*1.4+vec3(.02,.025,.04),distFade*.35);
  float dp=contactoPedestal(p);
  float cont=exp(-max(dp,0.)/6.);
  body*=1.-.50*cont;
  vec3 c=mix(body,refl,F);
  c=mix(c,vec3(.78,.84,.92)*.5,.10*exp(-max(dp,0.)/1.4));
  return niebla(c,rd,ts*.55,.0);
}

/* ════════ Render ════════ */
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  PXW=1./(uRes.y*uFocal);
  vec3 ro=uCam;
  vec3 rd=uBase*normalize(vec3(uv,uFocal));
  float tSea=rd.y<-1e-4?-ro.y/rd.y:1e9;

  float t=0.;
  Hit hit=Hit(100.,-1);
  vec2 tb=cajaRayo(ro,rd,BMIN,BMAX);
  if(tb.x<tb.y&&tb.y>0.&&tb.x<tSea){
    t=max(tb.x,0.);
    float tlim=min(tb.y,tSea);
    Hit m=Hit(100.,-1);
    bool agotado=true;
    for(int i=0;i<PASOS;i++){
      m=objetos(ro+rd*t,Hit(1e4,-1));
      if(abs(m.d)<max(EPS,.4*PXW*t)){hit=m;agotado=false;break;}
      t+=m.d;
      if(t>tlim){agotado=false;break;}
    }
    if(agotado&&m.d<.05*(1.+t*.02)) hit=m;
  }

  /* QA: id del fragmento como color plano (R = (id+1)/16; fondo = 0) */
  if(uDbg==1){C=vec4(float(hit.id+1)/16.,0.,0.,1.);return;}

  vec3 col;
  if(hit.id<0){
    if(rd.y<-1e-4){
      col=mar(ro,rd,tSea);
    }else if(rd.y<.003){
      /* Transición suave horizonte-mar: bruma de 0,3° que funde los dos planos */
      float hm=smoothstep(-.001,.003,rd.y);
      vec3 csky=fondoCielo(rd);
      vec3 csea=mar(ro,rd,tSea);
      col=mix(csea,csky,hm);
    }else{
      col=fondoCielo(rd);
    }
  }else{
    vec3 pos=ro+rd*t;
    vec3 n=nor(pos,t);

${si(`    /* Luz clave: fría, desde la izquierda y delante (la misma dirección que la pintura) */
    vec3 lig=normalize(vec3(-.55,.52,.66));
    vec3 lc=vec3(.88,.94,1.)*2.7*(1.-.42*uProx);

    vec3 alb=detalle(hit.id,pos,n,albedoDe(hit.id,pos),t);

    float dif=max(dot(n,lig),0.);
    float sha=dif>.02?mix(.08,1.,sombra(pos+n*(.02+.002*t),lig,.1+.004*t,260.)):1.;
    float occ=.42+.58*ao(pos,n,t);

    /* Ambiente hemisférico: cielo arriba, rebote lila del mar abajo */
    vec3 amb=mix(vec3(.08,.075,.17),vec3(.10,.17,.40),.5+.5*n.y)*(1.-.34*uProx);
    vec3 luz=amb+dif*sha*lc;`, K ? `    /* V2.2A — la luz clave llega más rasante para dar volumen; el patrón y el desgaste usan coordenadas locales */
    vec3 lig=normalize(${gv3(K.lig)});
    vec3 lc=${gv3(K.luz.slice(0, 3))}*${gf(K.luz[3])}*(1.-.42*uProx);

    vec3 q=pos-uC[hit.id==9?1:hit.id];
    vec3 bd=bordes(hit.id,q,n);
    vec3 alb=detalleE(hit.id,q,n,albedoDe(hit.id,pos),t,bd);

    float dif=max((dot(n,lig)+${gf(K.wrap)})/(1.+${gf(K.wrap)}),0.);
    float sha=dif>.02?mix(${gf(K.sombraMin)},1.,sombra(pos+n*(.02+.002*t),lig,.1+.004*t,260.)):1.;
    float occ=.42+.58*ao(pos,n,t);
    /* Cavidades: oscuridad progresiva hacia el fondo y un rebote frío mínimo, para que se lean como volumen hueco */
    float cav=smoothstep(0.,.55,bd.y);
    occ*=1.-${gf(K.cavOcc)}*cav;

    vec3 amb=mix(${gv3(K.ambA)},${gv3(K.ambB)},.5+.5*n.y)*${gf(K.amb)}*(1.-.34*uProx);
    vec3 luz=amb+dif*sha*lc+${gv3(K.cavGlow)}*cav/max(occ,.12);` : "")}

    /* Luz cálida del vacío: diseñada; la enciende la alineación */
    vec3 lv=LP-pos;
    float dd=length(lv);
    float wl=max(dot(n,lv/dd)*.85+.15,0.);
    float att=1./(1.+dd*dd/(LR*LR));
    luz+=vec3(1.,.56,.25)*(.06+.94*uProx)*13.*wl*att*att;

    col=alb*luz*occ;
    col=1.-exp(-col*1.15); /* hombro suave: los claros no se queman */

    /* Huevo y concha: algo de brillo especular */
    if(hit.id<=1||hit.id==9){
      float sp=pow(max(dot(reflect(-lig,n),-rd),0.),30.);
      col+=sp*.35*sha;
    }
    col=niebla(col,rd,t,.5*(ro.y+pos.y));
  }

  /* Gamma */
  col=pow(clamp(col,0.,1.),vec3(.4545));

  /* Viñeta suave */
  vec2 q=gl_FragCoord.xy/uRes;
  col*=.88+.12*pow(16.*q.x*q.y*(1.-q.x)*(1.-q.y),.12);

  /* Dithering */
  col+=(hash3(vec3(gl_FragCoord.xy,uTime*.1))-.5)/255.;

  C=vec4(col,1);
}`;
}

/* ── Compilación ── */
function compilar(gl: WebGL2RenderingContext, t: number, s: string): WebGLShader | null {
  const sh = gl.createShader(t);
  if (!sh) return null;
  gl.shaderSource(sh, s);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("Shader:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/* ── API pública ── */
export function crearEscena(canvas: HTMLCanvasElement, perfil: Perfil, look: Look = "v21", cavidad: Cavidad = false): Escena | null {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    powerPreference: perfil === "movil" ? "low-power" : "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl || gl.isContextLost()) return null;

  const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
  const fs = compilar(gl, gl.FRAGMENT_SHADER, fragSrc(perfil, look, cavidad));
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Link:", gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uCam = gl.getUniformLocation(prog, "uCam");
  const uBase = gl.getUniformLocation(prog, "uBase");
  const uC = gl.getUniformLocation(prog, "uC");
  const uHB = gl.getUniformLocation(prog, "uHB");
  const uProx = gl.getUniformLocation(prog, "uProx");
  const uFocal = gl.getUniformLocation(prog, "uFocal");
  const uDbg = gl.getUniformLocation(prog, "uDbg");
  gl.uniform1f(uFocal, 1);
  gl.uniform1i(uDbg, 0);
  /* Ruido propio de los looks A/B (unidad 0); V2.1 no lo usa */
  const ruido = look === "v21" ? null : crearRuido(gl);
  if (look !== "v21") {
    if (!ruido) return null;
    gl.uniform1i(gl.getUniformLocation(prog, "uN"), 0);
  }

  const centros = new Float32Array(FRAGMENTOS.length * 3);
  const subirAmbiente = (t: number, m: number) => {
    gl.uniform1f(uTime, t);
    gl.uniform3fv(uC, centrosEn(t, m, centros));
    const b = hiloB(t, m);
    gl.uniform3f(uHB, b[0], b[1], b[2]);
  };
  subirAmbiente(0, 0);

  let w = canvas.width, h = canvas.height;
  gl.viewport(0, 0, w, h);
  gl.uniform2f(uRes, w, h);

  let perdido = false;
  const dibujar = () => gl.drawArrays(gl.TRIANGLES, 0, 3);

  const esc: Escena = {
    pintar() {
      if (perdido) return;
      dibujar();
    },
    ambiente(t, m) {
      subirAmbiente(t, m);
    },
    encuadre(foco: number) {
      gl.uniform1f(uFocal, foco);
    },
    muestrear(uvs: [number, number][]) {
      const ids: number[] = [];
      const px = new Uint8Array(4);
      gl.uniform1i(uDbg, 1);
      dibujar();
      const asp = w / h;
      for (const [u, v] of uvs) {
        const x = Math.round((u / asp + 0.5) * w - 0.5);
        const y = Math.round((v + 0.5) * h - 0.5);
        if (x < 0 || y < 0 || x >= w || y >= h) { ids.push(-2); continue; }
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        ids.push(Math.round(px[0] / 16) - 1);
      }
      gl.uniform1i(uDbg, 0);
      dibujar();
      return ids;
    },
    silueta() {
      const data = new Uint8Array(w * h * 4);
      gl.uniform1i(uDbg, 1);
      dibujar();
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, data);
      const cajas = new Map<number, Silueta>();
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const id = Math.round(data[(y * w + x) * 4] / 16) - 1;
          if (id < 0) continue;
          const u = (x + 0.5 - w / 2) / h, v = (y + 0.5) / h - 0.5;
          const c = cajas.get(id);
          if (!c) cajas.set(id, { id, n: 1, u0: u, u1: u, v0: v, v1: v });
          else { c.n++; c.u0 = Math.min(c.u0, u); c.u1 = Math.max(c.u1, u); c.v0 = Math.min(c.v0, v); c.v1 = Math.max(c.v1, v); }
        }
      }
      gl.uniform1i(uDbg, 0);
      dibujar();
      return [...cajas.values()].sort((a, b) => a.id - b.id);
    },
    medir(escala: number) {
      const nw = Math.max(1, Math.round(canvas.clientWidth * escala));
      const nh = Math.max(1, Math.round(canvas.clientHeight * escala));
      if (nw === w && nh === h) return false;
      w = nw; h = nh;
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      return true;
    },
    camara(pos, tgt) {
      const b = base(pos, tgt);
      gl.uniform3f(uCam, pos[0], pos[1], pos[2]);
      gl.uniformMatrix3fv(uBase, false, [...b.cu, ...b.cv, ...b.cw]);
    },
    proximidad(v: number) {
      gl.uniform1f(uProx, v);
    },
    get perdido() { return perdido; },
    set perdido(v) { perdido = v; },
    liberar() {
      if (gl.isContextLost()) return;
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      if (ruido) gl.deleteTexture(ruido);
    },
  };
  return esc;
}
