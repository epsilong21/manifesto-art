/**
 * «La arquitectura de lo imposible» — WebGL2 raymarching SDF
 *
 * Fragmentos arquitectónicos suspendidos en configuración anamórfica:
 * desde un punto de vista preciso se alinean formando la distribución de la
 * pintura de 1949.
 *
 * Interpretación original de MANIFESTO. No reproduce la pintura: todo es
 * procedural (sin texturas ni imágenes) y los colores son una paleta
 * orientativa.
 * Inspirada en «La Madona de Portlligat (primera versión)», Dalí, 1949.
 *
 * V1.3B — geometría y atmósfera:
 *  · Nueve fragmentos: concha (cuenco abierto con estrías) + hilo + huevo,
 *    dos cornisas macizas, cuatro volúmenes huecos y pedestal escalonado.
 *    Medidas y posiciones: composicion.ts (única fuente de verdad).
 *  · Sin plano de suelo: cielo y mar son una función de la dirección del rayo.
 *    El horizonte es recto y queda a nivel de ojo (V1.2 cortaba el suelo en
 *    FAR = 40 y el borde de ese disco se veía como un horizonte curvo y bajo).
 *    Además, ya no se sombrea el mar: la mitad de la pantalla no marcha ni
 *    calcula normales, sombras ni oclusión.
 *  · Materiales lisos (sin FBM), luz diurna fría, AO de 3 muestras.
 *
 * Poda exacta (V1.2): cada fragmento caro se evalúa solo si su cota inferior
 * barata (esfera o caja envolvente, ≤ al SDF por construcción) es menor que la
 * mejor distancia ya hallada; el mínimo no cambia.
 */

import {
  BLOQUE_INF, BLOQUE_SUP, CAJA_ESCENA, CONCHA, CORNISA, FRAGMENTOS, HILO, HUEVO, PEDESTAL,
  base, centrosEn, type V3,
} from "./composicion";

export type Perfil = "desktop" | "movil";

/** Literal GLSL de un float (siempre con punto decimal). */
const gf = (n: number) => n.toFixed(4);
const gv3 = (c: readonly number[]) => `vec3(${gf(c[0])},${gf(c[1])},${gf(c[2])})`;

/** Color sRGB «#rrggbb» → vec3 en 0..1 (sRGB) o lineal. */
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
};
const srgb = (hex: string) => gv3(rgb(hex));
const lin = (hex: string) => gv3(rgb(hex).map((v) => Math.pow(v, 2.2)));

/** Paleta orientativa (medida sobre una reproducción no calibrada; interpretación, no copia). */
const PAL = {
  cornisa: "#8e9cac",
  bloque: "#7f8c9b",
  concha: "#cfd3dc",
  huevo: "#d4d2d8",
  zocalo: "#7f9693",
  rollo: "#7ea0b2",
  friso: "#6c9aae",
  moldura: "#8e94a8",
  tapa: "#9a99ab",
  cieloHor: "#e0e6fa",
  cielo1: "#9ebdf0",
  cielo2: "#5b87e2",
  cielo3: "#073476",
  cieloZen: "#00235b",
  marHor: "#6e8cc7",
  mar1: "#8794cc",
  mar2: "#a6b2e6",
};

export type Silueta = { id: number; n: number; u0: number; u1: number; v0: number; v1: number };

export type Escena = {
  pintar: (t: number) => void;
  /** Ajusta el lienzo a `escala` × tamaño CSS. Devuelve true si cambió (el lienzo queda en blanco). */
  medir: (escala: number) => boolean;
  camara: (pos: V3, tgt: V3) => void;
  /** Distancia focal: rd = normalize(vec3(uv, foco)), con uv.y ∈ [-0.5, 0.5]. */
  encuadre: (foco: number) => void;
  /** Solo QA: id del fragmento bajo cada punto uv (-1 = fondo). Repinta. */
  muestrear: (t: number, uvs: [number, number][]) => number[];
  /** Solo QA: caja en uv y píxeles de cada id visible (una sola lectura del lienzo). Repinta. */
  silueta: (t: number) => Silueta[];
  proximidad: (v: number) => void;
  liberar: () => void;
  perdido: boolean;
};

/* ── Vertex ── */
const VERT = `#version 300 es
in vec2 p;
void main(){gl_Position=vec4(p,0,1);}`;

/* ── Fragment ── */
function fragSrc(perfil: Perfil): string {
  const P = perfil === "desktop" ? 80 : 48;
  const S = perfil === "desktop" ? 20 : 12;

  const hc = (c: { hx: number; hy: number; hz: number }) => gv3([c.hx, c.hy, c.hz]);
  const radio = (c: { hx: number; hy: number; hz: number }) => Math.hypot(c.hx, c.hy, c.hz) + 0.03;

  /* Pedestal: bandas de abajo arriba (zócalo, rollo, friso, moldura, tapa) */
  const bandas = [PEDESTAL.zocalo, PEDESTAL.rollo, PEDESTAL.friso, PEDESTAL.moldura, PEDESTAL.tapa];
  let y0 = -PEDESTAL.h / 2;
  const ped = bandas.map(([fh, fw, fd]) => {
    const yc = y0 + (fh * PEDESTAL.h) / 2;
    y0 += fh * PEDESTAL.h;
    return { yc, half: [PEDESTAL.hw * fw, (fh * PEDESTAL.h) / 2, PEDESTAL.hz * fd] };
  });
  const pedConsts = ped
    .map((b, i) => `const float PY${i}=${gf(b.yc)};const vec3 PH${i}=${gv3(b.half)};`)
    .join("\n");

  const cc = Math.cos(CONCHA.incl), cs = Math.sin(CONCHA.incl);
  const panelX = (CORNISA.marco - CORNISA.marcoInt) / 2;
  const panelHX = (2 * CORNISA.hx - CORNISA.marco - CORNISA.marcoInt) / 2;
  const panelHY = CORNISA.hy - CORNISA.marco;

  return `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCam;
uniform mat3 uBase;
uniform vec3 uC[${FRAGMENTOS.length}];
uniform float uProx;
uniform float uFocal;
uniform int uDbg;
out vec4 C;

#define PASOS ${P}
#define SPASOS ${S}
#define FAR 40.0
#define EPS 0.0015
#define PI 3.14159265

/* ── Medidas (composicion.ts) ── */
const vec3 CORN_H=${hc(CORNISA)};
const float CORN_RB=${gf(CORNISA.rb)},CORN_RN=${gf(CORNISA.rn)},CORN_RP=${gf(CORNISA.rp)},CORN_PROF=${gf(CORNISA.prof)};
const float CORN_PX=${gf(panelX)};
const vec3 CORN_PH=${gv3([panelHX, panelHY, 0])};
const vec3 BS_H=${hc(BLOQUE_SUP)};
const vec3 BI_H=${hc(BLOQUE_INF)};
const float BS_P=${gf(BLOQUE_SUP.pared)},BI_P=${gf(BLOQUE_INF.pared)},BLQ_RB=${gf(BLOQUE_SUP.rb)},BLQ_FONDO=${gf(BLOQUE_SUP.fondo)};
${pedConsts}
const vec3 PED_B=${gv3([PEDESTAL.hw + 0.02, PEDESTAL.h / 2 + 0.02, PEDESTAL.hz + 0.02])};
const float CR=${gf(CONCHA.r)},CHB=${gf(CONCHA.hb)},CT=${gf(CONCHA.grosor)},CW=${gf(CONCHA.onda)},CF=${gf(CONCHA.feston)},CN=${gf(CONCHA.nervios)};
const float CC=${gf(cc)},CS=${gf(cs)};
const vec3 EGG_R=${gv3([HUEVO.rx, HUEVO.ry, HUEVO.rx])};
const vec3 HA=${gv3(HILO.a)},HB=${gv3(HILO.b)};
const float HR=${gf(HILO.r)};

/* Ángulo de un píxel (rad): el hilo nunca baja de ~1 px de ancho, sea cual sea la resolución */
float PXW;

/* ── SDF primitivas ── */
float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float sdRBox(vec3 p,vec3 b,float r){return sdBox(p,b-r)-r;}
float sdEllipsoid(vec3 p,vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/k1;}
float sdCapsule(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}

float hash3(vec3 p){p=fract(p*vec3(443.9,397.3,491.2));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}

/* ════════════════════════════════════════════════════════════
   FRAGMENTOS — todos con espesor real; cada SDF es max(primer término, …),
   así que su valor nunca baja del primer término (cota de la poda).
   Posiciones y flotación: uC[i] (CPU).
   ════════════════════════════════════════════════════════════ */

/* Cornisa (la izquierda; la derecha es su espejo): losa con panel hundido y
   cuarto de círculo recortado en la esquina inferior interior. */
float sdCornisa(vec3 q){
  float d=sdRBox(q,CORN_H,CORN_RB);
  float le=length(q.xy-vec2(CORN_H.x,-CORN_H.y));
  d=max(d,CORN_RN-le);
  float rec=max(sdBox(q-vec3(CORN_PX,0.,CORN_H.z),vec3(CORN_PH.x,CORN_PH.y,CORN_PROF)),CORN_RP-le);
  return max(d,-rec);
}

/* Volumen hueco, abierto por delante (+z) */
float sdHueco(vec3 q,vec3 h,float pared){
  float d=sdRBox(q,h,BLQ_RB);
  float zc=.5*(BLQ_FONDO+1.),hzc=h.z+.5*(1.-BLQ_FONDO);
  return max(d,-sdBox(q-vec3(0.,0.,zc),vec3(h.x-pared,h.y-pared,hzc)));
}

/* Pedestal escalonado: zócalo, rollo, friso hundido, moldura y tapa */
float sdPedestal(vec3 q){
  float d=sdRBox(q-vec3(0.,PY4,0.),PH4,.01);
  d=min(d,sdRBox(q-vec3(0.,PY3,0.),PH3,.006));
  float f=sdRBox(q-vec3(0.,PY2,0.),PH2,.008);
  f=max(f,-sdBox(q-vec3(0.,PY2,PH2.z),vec3(PH2.x-.18,PH2.y-.06,.035)));
  d=min(d,f);
  d=min(d,sdRBox(q-vec3(0.,PY1,0.),PH1,PH1.y*.9));
  return min(d,sdRBox(q-vec3(0.,PY0,0.),PH0,.008));
}

struct Hit{float d;int id;};

/* Mejor distancia entre h y los fragmentos. Cada fragmento caro se evalúa solo
   si su cota inferior (esfera o caja envolvente) es menor que h.d; si no, su SDF
   no puede mejorar el mínimo y el resultado es idéntico al de evaluarlo siempre. */
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
  /* El hilo comparte posición con el huevo pero tiene su propio id (9) para poder medir la silueta del huevo aparte */
  d=sdCapsule(q,HA,HB,max(HR,.6*PXW*length(p-uCam)));
  if(d<h.d) h=Hit(d,9);

  /* 0 — Concha: cuenco abierto inclinado hacia la cámara */
  q=p-uC[0];
  if(length(q)-${gf(CONCHA.r + CONCHA.onda + 0.01)}<h.d){
    vec3 s=vec3(q.x,q.y*CC+q.z*CS,-q.y*CS+q.z*CC);
    /* La aproximación del elipsoide subestima en diagonal; |s|-R también es cota de la distancia real y la corrige */
    float dO=max(sdEllipsoid(s,vec3(CR,CHB,CR)),length(s)-CR);
    if(dO-CW<h.d){
      float on=sin(atan(s.z,s.x)*CN);
      float dI=sdEllipsoid(s,vec3(CR-CT,CHB-CT,CR-CT));
      d=max(max(dO,-dI),s.y+CF*on);
      d+=on*CW*smoothstep(0.,.1,length(s.xz));
      if(d<h.d) h=Hit(d,0);
    }
  }

  /* 2, 3 — Cornisas */
  q=p-uC[2];
  if(length(q)-${gf(radio(CORNISA))}<h.d){
    d=sdCornisa(q);
    if(d<h.d) h=Hit(d,2);
  }
  q=p-uC[3];
  if(length(q)-${gf(radio(CORNISA))}<h.d){
    d=sdCornisa(vec3(-q.x,q.y,q.z));
    if(d<h.d) h=Hit(d,3);
  }

  /* 4, 5 — Volúmenes superiores */
  q=p-uC[4];
  if(length(q)-${gf(radio(BLOQUE_SUP))}<h.d){
    d=sdHueco(q,BS_H,BS_P);
    if(d<h.d) h=Hit(d,4);
  }
  q=p-uC[5];
  if(length(q)-${gf(radio(BLOQUE_SUP))}<h.d){
    d=sdHueco(q,BS_H,BS_P);
    if(d<h.d) h=Hit(d,5);
  }

  /* 6, 7 — Volúmenes inferiores */
  q=p-uC[6];
  if(length(q)-${gf(radio(BLOQUE_INF))}<h.d){
    d=sdHueco(q,BI_H,BI_P);
    if(d<h.d) h=Hit(d,6);
  }
  q=p-uC[7];
  if(length(q)-${gf(radio(BLOQUE_INF))}<h.d){
    d=sdHueco(q,BI_H,BI_P);
    if(d<h.d) h=Hit(d,7);
  }

  return h;
}

float mapD(vec3 p){return objetos(p,Hit(1e3,-1)).d;}

/* ── Normal (diferencias centrales) con un paso del tamaño de un píxel a esa distancia: con un paso
   fijo de .001, menor que el bisel (.006–.01) y que un píxel, la normal saltaba en cada arista y
   dejaba puntos oscuros y destellos del borde dorado en las juntas del pedestal ── */
vec3 nor(vec3 p){
  vec2 e=vec2(max(.001,.5*PXW*length(p-uCam)),0);
  return normalize(vec3(mapD(p+e.xyy)-mapD(p-e.xyy),mapD(p+e.yxy)-mapD(p-e.yxy),mapD(p+e.yyx)-mapD(p-e.yyx)));
}

/* ── Caja del conjunto (composicion.ts: CAJA_ESCENA) ── */
const vec3 BMIN=${gv3(CAJA_ESCENA.min)};
const vec3 BMAX=${gv3(CAJA_ESCENA.max)};
vec2 cajaRayo(vec3 ro,vec3 rd,vec3 bmin,vec3 bmax){
  vec3 r=sign(rd+1e-20)*max(abs(rd),1e-5);
  vec3 inv=1./r;
  vec3 a=(bmin-ro)*inv,b=(bmax-ro)*inv;
  vec3 mn=min(a,b),mx=max(a,b);
  return vec2(max(max(mn.x,mn.y),mn.z),min(min(mx.x,mx.y),mx.z));
}

/* ── Sombra suave ──
   Poda exacta: el rayo de sombra recorre como mucho ~8 unidades (SPASOS × paso
   máx. 0.4). Más allá de la caja del conjunto inflada 1.05, ningún fragmento
   queda a menos de 1.05, así que 10·h/t ≥ 1.2: ni la penumbra ni el paso
   cambian y el resultado es el mismo que siguiendo el bucle entero. Si el rayo
   no cruza la caja inflada, el resultado es 1 sin marchar. */
float sombra(vec3 ro,vec3 rd,float mi,float ma){
  vec2 tb=cajaRayo(ro,rd,BMIN-1.05,BMAX+1.05);
  if(tb.x>=tb.y||tb.y<mi) return 1.;
  float r=1.,t=mi;
  for(int i=0;i<SPASOS;i++){
    float h=mapD(ro+rd*t);
    if(h<.0005) return 0.;
    r=min(r,10.*h/t);
    t+=clamp(h,.02,.4);
    if(t>ma||t>tb.y) break;
  }
  return clamp(r,0.,1.);
}

/* ── AO (3 muestras) ── */
float ao(vec3 p,vec3 n){
  float r=0.,w=1.;
  for(int i=1;i<=3;i++){
    float d=float(i)*.14;
    r+=w*(d-mapD(p+n*d));
    w*=.55;
  }
  return clamp(1.-r*1.7,0.,1.);
}

/* ── Cielo y mar: función de la dirección del rayo (horizonte recto a nivel de ojo) ── */
vec3 fondo(vec3 rd){
  float y=rd.y;
  vec3 c;
  if(y>=0.){
    c=mix(${srgb(PAL.cieloHor)},${srgb(PAL.cielo1)},clamp(y/.06,0.,1.));
    c=mix(c,${srgb(PAL.cielo2)},clamp((y-.06)/.09,0.,1.));
    c=mix(c,${srgb(PAL.cielo3)},clamp((y-.15)/.15,0.,1.));
    c=mix(c,${srgb(PAL.cieloZen)},clamp((y-.30)/.15,0.,1.));
  }else{
    float s=-y;
    c=mix(${srgb(PAL.marHor)},${srgb(PAL.mar1)},clamp(s/.08,0.,1.));
    c=mix(c,${srgb(PAL.mar2)},clamp((s-.08)/.27,0.,1.));
  }
  return pow(c,vec3(2.2));
}

/* ════════════════════════════════════════
   RENDER
   ════════════════════════════════════════ */
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  PXW=1./(uRes.y*uFocal);
  vec3 ro=uCam;
  vec3 rd=uBase*normalize(vec3(uv,uFocal));

  /* — Raymarching — solo dentro de la caja del conjunto */
  float t=0.;
  Hit hit=Hit(100.,-1);
  vec2 tb=cajaRayo(ro,rd,BMIN,BMAX);
  if(tb.x<tb.y&&tb.y>0.){
    t=max(tb.x,0.);
    float tlim=min(tb.y,FAR);
    Hit m=Hit(100.,-1);
    bool agotado=true;
    for(int i=0;i<PASOS;i++){
      m=objetos(ro+rd*t,Hit(1e3,-1));
      if(abs(m.d)<EPS*(1.+t*.05)){hit=m;agotado=false;break;}
      t+=m.d;
      if(t>tlim){agotado=false;break;}
    }
    /* Sin convergencia en PASOS: solo cuenta como impacto si quedó pegado a la superficie */
    if(agotado&&m.d<.02) hit=m;
  }

  /* QA: id del fragmento como color plano (R = (id+1)/16; fondo = 0) */
  if(uDbg==1){C=vec4(float(hit.id+1)/16.,0.,0.,1.);return;}

  vec3 col;
  if(hit.id<0||t>=FAR){
    col=fondo(rd);
  }else{
    vec3 pos=ro+rd*t;
    vec3 n=nor(pos);

    /* Luz principal: desde la izquierda y delante, blanca fría */
    vec3 lig=normalize(vec3(-.55,.5,.65));
    vec3 lc=vec3(1.,.97,.93)*1.15;

    /* Material (albedo lineal) */
    vec3 alb;
    if(hit.id==0){
      alb=${lin(PAL.concha)};
    }else if(hit.id==1||hit.id==9){
      alb=${lin(PAL.huevo)};
    }else if(hit.id<=3){
      alb=${lin(PAL.cornisa)};
    }else if(hit.id<=7){
      alb=${lin(PAL.bloque)};
    }else{
      /* Pedestal por bandas, de abajo arriba */
      float ly=pos.y-uC[8].y;
      alb=${lin(PAL.zocalo)};
      alb=ly>PY0+PH0.y?${lin(PAL.rollo)}:alb;
      alb=ly>PY1+PH1.y?${lin(PAL.friso)}:alb;
      alb=ly>PY2+PH2.y?${lin(PAL.moldura)}:alb;
      alb=ly>PY3+PH3.y?${lin(PAL.tapa)}:alb;
    }

    float dif=max(dot(n,lig),0.);
    /* Luz de cielo: la sombra proyectada nunca apaga del todo la luz directa (sin negros artificiales) */
    float sha=dif>0.?mix(.3,1.,sombra(pos+n*.01,lig,.05,15.)):1.;
    float occ=.62+.38*ao(pos,n);

    /* Ambiente hemisférico: cielo arriba, rebote lila del mar abajo */
    vec3 amb=mix(vec3(.2,.215,.27),vec3(.2,.245,.33),.5+.5*n.y);

    col=alb*(amb+dif*sha*lc)*occ;

    /* Proximidad → borde dorado (realimentación de la alineación) */
    if(uProx>.01){
      float rim=pow(1.-max(dot(n,-rd),0.),3.5);
      col+=rim*vec3(.85,.65,.25)*uProx*.3*occ;
    }
  }

  /* Gamma (la paleta ya está pensada para no necesitar tonemapping) */
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
export function crearEscena(canvas: HTMLCanvasElement, perfil: Perfil): Escena | null {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    powerPreference: perfil === "movil" ? "low-power" : "high-performance",
    preserveDrawingBuffer: false,
  });
  if (!gl || gl.isContextLost()) return null;

  const vs = compilar(gl, gl.VERTEX_SHADER, VERT);
  const fs = compilar(gl, gl.FRAGMENT_SHADER, fragSrc(perfil));
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

  /* Full-screen triangle */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

  /* Uniforms */
  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uCam = gl.getUniformLocation(prog, "uCam");
  const uBase = gl.getUniformLocation(prog, "uBase");
  const uC = gl.getUniformLocation(prog, "uC");
  const uProx = gl.getUniformLocation(prog, "uProx");
  const uFocal = gl.getUniformLocation(prog, "uFocal");
  const uDbg = gl.getUniformLocation(prog, "uDbg");
  gl.uniform1f(uFocal, 1);
  gl.uniform1i(uDbg, 0);
  let tUlt = 0;

  /* Flotación de los fragmentos: se calcula una vez por fotograma en CPU */
  const centros = new Float32Array(FRAGMENTOS.length * 3);
  const subirTiempo = (t: number) => {
    gl.uniform1f(uTime, t);
    gl.uniform3fv(uC, centrosEn(t, centros));
  };
  subirTiempo(0);

  let w = canvas.width, h = canvas.height;
  gl.viewport(0, 0, w, h);
  gl.uniform2f(uRes, w, h);

  let perdido = false;

  const esc: Escena = {
    pintar(t: number) {
      if (perdido) return;
      tUlt = t;
      subirTiempo(t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    encuadre(foco: number) {
      gl.uniform1f(uFocal, foco);
    },
    muestrear(t: number, uvs: [number, number][]) {
      /* Pinta el mapa de identificadores y lo lee en el mismo turno (el
         buffer no se conserva); después restaura el fotograma normal. */
      const ids: number[] = [];
      const px = new Uint8Array(4);
      gl.uniform1i(uDbg, 1);
      subirTiempo(t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const asp = w / h;
      for (const [u, v] of uvs) {
        const x = Math.round((u / asp + 0.5) * w - 0.5);
        const y = Math.round((v + 0.5) * h - 0.5);
        if (x < 0 || y < 0 || x >= w || y >= h) { ids.push(-2); continue; }
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        ids.push(Math.round(px[0] / 16) - 1);
      }
      gl.uniform1i(uDbg, 0);
      subirTiempo(tUlt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return ids;
    },
    silueta(t: number) {
      /* Una sola lectura del mapa de ids; cajas en uv (u: derecha, v: arriba). */
      const data = new Uint8Array(w * h * 4);
      gl.uniform1i(uDbg, 1);
      subirTiempo(t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
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
      subirTiempo(tUlt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
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
      /* Columnas cu, cv, cw: igual que mat3(cu,cv,cw) del shader */
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
    },
  };
  return esc;
}
