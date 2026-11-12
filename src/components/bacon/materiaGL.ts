/**
 * «La materia del sacrificio» (V2): una masa suspendida modelada en volumen (campo de distancias 3D con raymarching),
 * un muro y un suelo reales que reciben su sombra, y una luz cenital que dibuja en el suelo un rectángulo vacío.
 * Todo en un único fragment shader (WebGL2), sin librerías.
 *
 * No hay bucle: se dibuja solo cuando cambia algo. Mientras el visitante mueve la luz o la apertura, los fotogramas
 * se calculan a resolución reducida; al soltar, uno solo a resolución completa (ver `Motor.calidad`).
 */

export type Estado = {
  luzX: number; // -1..1 (posición de la lámpara, delante de la figura)
  luzY: number; // -1..1
  radio: number; // alcance de la luz
  intensidad: number;
  ambiente: number; // luz de base: la presencia se reconoce aunque la lámpara esté lejos
  apertura: number; // 0..1
  tension: number; // 0..1: cuánto tira la cuerda lateral
  altar: number; // 0..1: luz cenital sobre el suelo
  sombra: number; // 0..1: densidad de la sombra proyectada
};

export const VS = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

export const FS = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uUnit;
uniform vec2 uLuz;
uniform float uRadio, uInt, uAmb, uAp, uTen, uAltar, uSom;
out vec4 fragColor;

// ── Escena ──
const vec3 CAM = vec3(0.0, 0.3, 4.3);
const float FOCAL = 3.05;
const float Z_MURO = -0.95;
const float Y_SUELO = -1.08;
const vec3 CENTRO = vec3(-0.06, 0.02, 0.04); // esfera que contiene la figura
const float RADIO_F = 0.98;
const vec3 ANCLA = vec3(0.0, 0.83, 0.0); // punto de suspensión
const vec3 CENIT = vec3(0.04, 2.6, 0.3); // luz cenital del suelo

vec3 LUZ;
int ZERO; // 0 en tiempo de ejecución, desconocido al compilar: los bucles se quedan como bucles y el shader compila mucho más rápido

// ── Ruido ──
float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float h2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

// ── Primitivas ──
float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdRC(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2; vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv);
  float y2 = y * y * l2; float z2 = z * z * l2; float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }

// Punto donde la cuerda lateral engancha la materia y la dirección en que tira. No hay miembro: la superficie se estira
// en una punta (un pellizco de piel) y de ahí salen los pliegues de tensión.
const vec3 P0 = vec3(-0.24, 0.3, 0.0);
const vec3 DIRT = vec3(-0.49, 0.87, -0.08);
float largoT(){ return 0.2 + 0.12 * uTen; }
// Torsión alrededor del eje de suspensión: crece hacia abajo y con la tensión (carne retorcida, no un óvalo)
float torsion(float y){ return (0.4 + 0.5 * uTen) * (0.83 - y); }
// Del espacio del cuerpo (ya descolgado y retorcido) al del mundo
// Inclinación del cuerpo desde el ancla: tira la cuerda lateral y el eje deja de ser vertical
float inclina(){ return 0.17 + 0.11 * uTen; }
vec3 aMundo(vec3 qv){
  float a = torsion(qv.y);
  qv.xz = mat2(cos(a), sin(a), -sin(a), cos(a)) * qv.xz;
  qv.x += 0.025 * sin(max(0.0, 0.83 - qv.y) * 2.4);
  float i = inclina();
  vec2 r = qv.xy - ANCLA.xy;
  qv.xy = ANCLA.xy + mat2(cos(i), -sin(i), sin(i), cos(i)) * r;
  return qv;
}
vec3 puntaLobulo(){ return aMundo(P0 + DIRT * largoT()); }
float gT; // peso del tirón en el último punto evaluado (para el material: tenso = liso y con brillo)

// ── El desgarro: una grieta irregular y asimétrica que se abre en profundidad ──
// Devuelve la distancia al volumen que se retira del cuerpo.
float gSd; // lado de la grieta en el último punto evaluado (0 izquierdo, 1 derecho)
float gG; // distancia a la grieta en el último punto evaluado
float grieta(vec3 pw){
  // La abertura sigue al cuerpo inclinado (no al mundo): se mide en el espacio del cuerpo sin torsión
  float i = inclina();
  vec3 p = pw;
  p.xy = ANCLA.xy + mat2(cos(i), sin(i), -sin(i), cos(i)) * (pw.xy - ANCLA.xy);
  vec3 q = p - vec3(-0.02, -0.02, 0.0);
  float y = q.y;
  float env = smoothstep(-0.42, -0.2, y) * (1.0 - smoothstep(0.18, 0.36, y));
  // Oblicua: nace arriba a la izquierda y se desvía hacia el costado pesado; no es una lente vertical
  float c = 0.06 * sin(y * 5.5 + 1.2) + 0.07 * (vn(vec3(y * 6.0, 1.7, 0.3)) - 0.5) + 0.2 * y + 0.03;
  float dx = q.x - c;
  // Labios distintos a cada lado: el derecho cede más que el izquierdo
  // (transición continua entre lados: un salto en el campo hace que el rayo atraviese la superficie)
  float sd = smoothstep(-0.03, 0.03, dx);
  gSd = sd;
  float lado = mix(0.55, 1.0 + 0.6 * uAp, sd);
  float irr = 0.45 + 1.1 * mix(vn(vec3(y * 11.0, 8.0, 0.0)), vn(vec3(y * 11.0, 3.0, 0.0)), sd);
  // Puentes de tejido: en algunos tramos la materia no llega a separarse y la abertura se parte en bolsas desiguales
  float puente = smoothstep(-0.2, 0.55, sin(y * 9.0 + 0.8 * sd + 1.7 * sin(y * 3.9 + 1.0)));
  float ancho = (0.006 + 0.12 * uAp) * env * irr * lado * mix(puente * 0.9 + 0.1, 1.0, 0.18 * uAp);
  // Profundidad: con poca apertura es una fisura somera; abierta, entra hasta el interior
  // (el fondo es irregular: un plano liso al fondo se leía como un recorte con el muro detrás)
  // (nunca llega al otro lado: queda siempre una pared trasera. Con un fondo más hondo, en las zonas
  // delgadas del cuerpo el corte lo atravesaba y por la grieta se veía el muro: se leía como un recorte)
  float fondo = 0.14 - 0.11 * uAp - 0.04 * vn(vec3(q.x * 7.0, y * 7.0, 4.0));
  return max(max(abs(dx) - ancho, fondo - q.z), abs(y + 0.03) - 0.4);
}

// Cuerpo sin detalle (masas). Devuelve distancia y marca si el punto es hueso.
float masas(vec3 p, out float hueso){
  // Peso: lo que cuelga se descuelga más cuanto más lejos del ancla
  vec3 q = p;
  float i = inclina();
  q.xy = ANCLA.xy + mat2(cos(i), sin(i), -sin(i), cos(i)) * (p.xy - ANCLA.xy);
  float caida = max(0.0, 0.83 - q.y);
  q.x -= 0.025 * sin(caida * 2.4);
  // Torsión leve alrededor del eje de suspensión
  float a = torsion(q.y);
  q.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * q.xz;

  gT = exp(-length(q - (P0 + DIRT * largoT() * 0.4)) * 3.4);

  // Cuello reunido en el punto de sujeción: la materia se comprime donde la sostiene el cable
  float d = sdRC(q, vec3(0.0, 0.8, 0.0), vec3(0.03, 0.43, 0.02), 0.035, 0.2);
  // Masa principal, pesada abajo y descentrada: dos masas desiguales
  d = smin(d, sdEll(q - vec3(0.03, 0.08, 0.0), vec3(0.36, 0.44, 0.19)), 0.14);
  d = smin(d, sdEll(q - vec3(0.1, -0.25, 0.04), vec3(0.38, 0.3, 0.2)), 0.16);
  // Lo vencido: una masa que cede por su peso en el costado opuesto al tirón, ancha y aplastada abajo (no un cono)
  float ced = 0.07 * (1.0 - uTen);
  vec3 qs = q - vec3(0.24, -0.16 - ced, -0.05);
  qs.xy = mat2(0.96, 0.28, -0.28, 0.96) * qs.xy;
  d = smin(d, sdEll(qs, vec3(0.19, 0.3 + ced, 0.15)), 0.17);
  // Lo que cede por abajo: una sola masa pesada, ladeada y desigual (dos remates simétricos se leían como muslos de ave)
  // El extremo es ancho y se funde con la masa (con punta fina y cuello se leía como una gota o un pezón; demasiado ancho, como una bolsa)
  d = smin(d, sdRC(q, vec3(0.08, -0.4, 0.02), vec3(0.2, -0.68, 0.0), 0.23, 0.14), 0.26);
  // Silueta quebrada: lóbulos anchos de baja frecuencia que rompen la curva de las elipses (no en el cuello, que es fino)
  d += (vn(q * 1.9 + vec3(2.0, 5.0, 1.0)) - 0.5) * 0.25 * smoothstep(0.6, 0.28, q.y);
  // Pellizco: la cuerda estira la materia en una punta fina; la base es ancha y se funde con el cuerpo (piel tirada por un gancho)
  d = smin(d, sdRC(q, P0 - DIRT * 0.12, P0 + DIRT * largoT(), 0.15, 0.03), 0.14); // punta roma: afilada se leía como la esquina de una tela
  // Cresta ósea que rompe la piel por el costado (una arista larga y medio enterrada)
  vec3 qb = q - vec3(0.27, -0.34, 0.1);
  qb.xy = mat2(0.92, 0.39, -0.39, 0.92) * qb.xy;
  float hb = sdEll(qb, vec3(0.03, 0.16, 0.035)) + 0.006 * sin(qb.y * 60.0);
  hueso = step(hb, d + 0.004);
  return smin(d, hb, 0.025);
}

// Detalle: pliegues que nacen en el ancla, surcos de caída y rugosidad desigual (más quebrada en unas zonas que en otras)
float pliegues(vec3 p, out float rugo){
  float ang = atan(p.z, p.x - 0.02);
  // Sin singularidad en el eje: cerca del eje el ángulo no tiene sentido y los pliegues se apagan
  float cerca = smoothstep(0.1, 0.62, p.y) * smoothstep(0.03, 0.14, length(vec2(p.x - 0.02, p.z)));
  // Pliegues radiales suaves bajo el ancla. (Un fruncido más profundo abría bajo la luz cenital un valle que se leía
  // como un hueco; el estrangulamiento lo hace la geometría del cuello.) Fase: cresta de frente a la cámara.
  float radial = sin(ang * 7.0 + 3.1416 + 1.3 * sin(ang * 2.0)) * 0.011 * cerca;
  float caida = sin(p.x * 13.0 + 2.4 * sin(p.y * 3.1) + p.z * 6.0) * 0.012 * (1.0 - cerca);
  float zona = smoothstep(0.35, 0.75, vn(p * 2.2 + 3.0)); // dónde la superficie se quiebra
  // Relieve grueso alargado en vertical: descolgamientos, no hoyuelos (los hoyuelos se leían como ojos)
  float grueso = (vn(vec3(p.x * 6.0, p.y * 2.2, p.z * 6.0)) - 0.5) * 0.04;
  float fino = (vn(p * 17.0) - 0.5) * 0.013 * zona;
  // Pliegues de tensión: nacen en el punto de tirón y se abren hacia el cuerpo (más marcados cuanto más tira la cuerda)
  vec3 pt = puntaLobulo();
  vec2 rr = p.xy - pt.xy;
  float dt = length(rr);
  float abanico = smoothstep(0.15, 0.7, dot(rr / max(dt, 1e-3), -normalize(DIRT.xy)));
  float pliegueT = sin(atan(rr.y, rr.x) * 11.0 + 2.0 * sin(p.y * 9.0)) * (0.007 + 0.011 * uTen)
                   * exp(-dt * 2.6) * smoothstep(0.04, 0.2, dt) * abanico;
  // Espiral de la torsión: pliegues anchos que recorren el cuerpo (tres brazos, giran con la altura)
  float espiral = sin(ang * 3.0 + p.y * 7.0 + 1.3 * sin(p.y * 4.3 + p.x * 3.0)) * 0.02 * smoothstep(0.3, 0.0, p.y) * smoothstep(-0.6, -0.2, p.y + 0.3);
  // Fisuras de la materia seca: líneas finas y profundas solo donde la superficie se quiebra (contornos de un ruido)
  float cresta = 1.0 - abs(2.0 * vn(p * vec3(8.0, 6.0, 8.0) + 5.0) - 1.0);
  float fis = pow(cresta, 7.0) * 0.02 * smoothstep(0.45, 0.75, zona + 0.15) * (1.0 - gT);
  rugo = zona * (1.0 - gT);
  return radial + caida + grueso + fino + pliegueT + espiral + fis;
}

// Mapa completo. mat: 0 carne, 1 hueso, 2 interior. prof: profundidad bajo la piel (interior)
float mapa(vec3 p, out float mat, out float prof, out float rugo){
  float hueso;
  float d = masas(p, hueso);
  rugo = 0.0;
  if (d < 0.12) d += pliegues(p, rugo) * (1.0 - hueso * 0.85);
  // Grieta: los labios se hinchan alrededor y la materia se retira
  float g = grieta(p);
  gG = g;
  // Labios de distinto espesor: el derecho se enrolla hacia fuera, grueso y seco; el izquierdo queda fino
  // y, alrededor, la piel se arruga perpendicular a la abertura (tirantez)
  float cerca = exp(-max(g, 0.0) * 28.0);
  float labio = (0.04 * (0.25 + uAp) * mix(0.35, 1.7, gSd) * cerca
                 + 0.009 * (0.3 + uAp) * sin(p.y * 38.0 + 2.6 * sin(p.x * 17.0 + p.y * 5.0)) * exp(-max(g, 0.0) * 11.0)) * step(0.0, p.z);
  float piel = d - labio * (1.0 - hueso);
  float dd = smax(piel, -g, 0.02 + 0.03 * uAp);
  prof = max(0.0, -piel);
  mat = hueso > 0.5 ? 1.0 : (g < 0.01 && piel < -0.004 ? 2.0 : 0.0);
  return dd;
}
// Versión barata para sombras: sin rugosidad fina
float mapaSombra(vec3 p){ float h; float d = masas(p, h); return smax(d, -grieta(p), 0.02); }

// ¿Cruza el segmento ro→ro+rd*tmax la esfera de la figura? Devuelve el tramo (o -1)
vec2 esfera(vec3 ro, vec3 rd, float tmax, float R){
  vec3 oc = ro - CENTRO; float b = dot(oc, rd); float c = dot(oc, oc) - R * R; float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  vec2 t = vec2(max(-b - h, 0.0), min(-b + h, tmax));
  return t.x < t.y ? t : vec2(-1.0);
}

// Cuerdas: líneas analíticas (con suavizado), más finas que un píxel si hace falta
float cuerda(vec3 ro, vec3 rd, vec3 a, vec3 b, float r, float px, inout float tHit){
  vec3 ba = b - a, oa = ro - a;
  float baba = dot(ba, ba), bard = dot(ba, rd), baoa = dot(ba, oa), rdoa = dot(rd, oa);
  float den = baba - bard * bard;
  float t = (baba * -rdoa + bard * baoa) / den;
  float s = clamp((baoa + t * bard) / baba, 0.0, 1.0);
  t = max(dot(a + ba * s - ro, rd), 0.0);
  float d = length(ro + rd * t - (a + ba * s));
  float w = max(r, px * t);
  float cov = (1.0 - smoothstep(w * 0.5, w * 1.5, d)) * (r / w);
  if (cov > 0.0) tHit = t;
  return cov;
}

// Luz que la lámpara deja en el aire (bruma): integral analítica de una luz puntual
float bruma(vec3 ro, vec3 rd, float t){
  vec3 q = ro - LUZ; float b = dot(rd, q); float c = dot(q, q);
  float s = 1.0 / sqrt(max(c - b * b, 1e-4));
  return s * (atan((t + b) * s) - atan(b * s));
}

const vec3 HUESO = vec3(0.5, 0.43, 0.33);
const vec3 CARNE = vec3(0.21, 0.13, 0.11);
const vec3 SEBO = vec3(0.4, 0.32, 0.25);
const vec3 SECO = vec3(0.2, 0.045, 0.035); // carmesí seco
const vec3 CALIDA = vec3(1.0, 0.74, 0.5);

vec3 luzLampara(vec3 p, out vec3 l, out float aten){
  vec3 lv = LUZ - p; float dist = length(lv); l = lv / dist;
  aten = uInt / (1.0 + pow(dist / uRadio, 2.0));
  return CALIDA * aten;
}

void main(){
  ZERO = min(int(uRes.x), 0);
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uUnit;
  float px = 1.5 / (uUnit * FOCAL);
  LUZ = vec3(uLuz.x * 1.75, uLuz.y * 1.2 + 0.05, 1.25);

  vec3 ro = CAM;
  vec3 fw = normalize(vec3(0.0, -0.13, 0.0) - CAM);
  vec3 ri = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(ri, fw);
  vec3 rd = normalize(fw * FOCAL + ri * uv.x + up * uv.y);

  // Planos: muro y suelo
  float tM = (Z_MURO - ro.z) / rd.z;
  float tS = rd.y < 0.0 ? (Y_SUELO - ro.y) / rd.y : 1e5;
  float tFondo = min(tM, tS);
  bool esSuelo = tS < tM;

  // Figura
  float tF = -1.0; float mat = 0.0, prof = 0.0, rugo = 0.0;
  float tenso = 0.0, lado = 0.0, gHit = 0.0, aoV = 1.0;
  vec3 nF = vec3(0.0);
  vec2 tr = esfera(ro, rd, tFondo, RADIO_F);
  if (tr.x >= 0.0){
    // Una sola copia del mapa completo en el shader. Fase 0: el rayo (hasta 91 evaluaciones; la última no avanza: un rayo que agota
    // los pasos dentro de la rendija está rozando sus paredes, es materia y no un hueco). Fase 1: en el impacto, 4 tomas para la
    // normal y 4 para la oclusión.
    float t = tr.x;
    vec3 pH = vec3(0.0), nn = vec3(0.0);
    float oo = 0.0, ss = 1.0;
    int fase = 0, paso = 0, k = 0;
    for (int i = ZERO; i < 99; i++){
      vec3 e = 0.5773 * (2.0 * vec3(float(((k + 3) >> 1) & 1), float((k >> 1) & 1), float(k & 1)) - 1.0);
      float h = 0.035 * float(k - 3);
      vec3 q = fase == 0 ? ro + rd * t : (k < 4 ? pH + 0.0031 * e : pH + nn * h);
      float m_, pr_, r_;
      float d = mapa(q, m_, pr_, r_);
      if (fase == 0){
        mat = m_; prof = pr_; rugo = r_;
        if (paso == 90 || d < 0.0012 * t){
          tF = t; pH = q; fase = 1;
          tenso = smoothstep(0.08, 0.55, gT); // zona estirada por la cuerda
          lado = gSd;
          gHit = gG;
          continue;
        }
        paso++;
        t += d * 0.7;
        if (t > tr.y) break;
      } else {
        if (k < 4) nn += e * d;
        else { oo += (h - d) * ss; ss *= 0.62; }
        k++;
        if (k == 4) nn = normalize(nn);
        if (k == 8) break;
      }
    }
    nF = nn;
    aoV = clamp(1.0 - 2.6 * oo, 0.0, 1.0);
  }

  vec3 col;
  float tFin;
  // Punto y normal de lo que se ve (figura o plano), y su luz y sombras: una sola copia de cada cálculo, para compilar menos código
  bool golpe = tF > 0.0;
  vec3 pV = ro + rd * (golpe ? tF : tFondo);
  vec3 nV = esSuelo ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  if (golpe){
    nV = nF;
  }
  vec3 lV; float atenV;
  vec3 LcV = luzLampara(pV, lV, atenV);
  // Rectángulo de la luz cenital en el suelo (antes de las sombras, para saber si hace falta la suya)
  vec2 rA = pV.xz - vec2(0.04, 0.32);
  float mA = 0.0;
  if (!golpe && esSuelo && uAltar > 0.0){
    float bx = abs(rA.x) - 0.46, bz = abs(rA.y) - 0.24;
    float suave = 0.012 + 0.05 * smoothstep(-0.2, 0.3, rA.x) + 0.02 * vn(vec3(pV.xz * 6.0, 2.0));
    mA = 1.0 - smoothstep(-suave, suave, max(bx, bz));
  }
  float arr = 0.002;
  float shV = 1.0, shc = 1.0;
  // Autosombra blanda en la figura (con borde duro y sin relleno, una sombra sobre la piel se leía como un agujero)
  // El rayo de sombra usa el cuerpo sin pliegues: en un valle de la piel (hasta ~0,03 por dentro de ese volumen) arrancaría
  // dentro de la masa y saldría negro, con cualquier luz (dos bolsas oscuras emparejadas en el hombro que se leían como ojos).
  // Se arranca fuera del volumen suave, lo justo (pasada 0: la sonda que mide cuánto).
  // Una sola copia del mapa de sombras en el shader. Pasada 0: sonda del arranque (solo en la figura); 1: lámpara; 2: cenital (solo donde cae el rectángulo)
  for (int s = ZERO; s < 3; s++){
    if (s == 0 ? !golpe : (s == 2 && !(mA > 0.002))) continue;
    vec3 so = s == 0 ? pV : pV + nV * (s == 2 ? 0.002 : arr);
    vec3 sd = s == 2 ? normalize(CENIT - pV) : lV;
    float tm = length((s == 2 ? CENIT : LUZ) - pV);
    float k = s == 2 ? 14.0 : (golpe ? 2.0 : 16.0);
    vec2 tr2 = s == 0 ? vec2(0.0, 1.0) : esfera(so, sd, tm, RADIO_F + 0.35);
    if (tr2.x < 0.0) continue;
    float res = 1.0;
    float t = s == 0 ? 0.0 : max(tr2.x, 0.01);
    for (int i = ZERO; i < 26; i++){
      float h = mapaSombra(so + sd * t);
      if (s == 0){ arr = 0.01 + max(0.0, -h); break; }
      res = min(res, k * h / t);
      t += clamp(h, 0.012, 0.09);
      if (res < 0.02 || t > tr2.y) break;
    }
    if (s == 1) shV = clamp(res, 0.0, 1.0);
    if (s == 2) shc = clamp(res, 0.0, 1.0);
  }
  if (golpe){
    vec3 p = pV;
    vec3 n = nV;
    float ao = aoV;
    // Relieve fino (solo en la normal): grano de tejido que sigue la caída, más marcado donde la superficie se quiebra
    if (mat < 0.5 || mat > 1.5){
      vec3 bq = vec3(p.x * 30.0, p.y * 11.0, p.z * 30.0);
      float b0 = vn(bq);
      vec3 bg = vec3(vn(bq + vec3(0.6, 0.0, 0.0)) - b0, vn(bq + vec3(0.0, 0.6, 0.0)) - b0, vn(bq + vec3(0.0, 0.0, 0.6)) - b0);
      n = normalize(n - bg * (mat > 1.5 ? 1.5 : 0.4 + 1.9 * rugo)); // en el interior: fibra desgarrada
    }
    vec3 l = lV; float aten = atenV; vec3 Lc = LcV;
    float sh = shV;
    float ndl = dot(n, l);
    // Materia: el tono sigue la estructura (cavidades más oscuras y rojizas, crestas más claras)
    float var = vn(p * 3.3 + 7.0);
    vec3 base = mix(CARNE, SEBO, 0.7 * smoothstep(0.4, 0.85, var));
    // Regueros de tono que caen con la gravedad
    float reguero = vn(vec3(p.x * 7.0, p.y * 1.4, p.z * 7.0));
    base *= 0.66 + 0.5 * reguero;
    base = mix(base, SECO * 1.4, clamp((1.0 - ao) * 0.36 + 0.3 * smoothstep(0.6, 0.85, reguero), 0.0, 0.5));
    base *= 0.7 + 0.45 * vn(p * 9.0);
    // Materia seca y quebrada: opaca, grisácea y sin brillo, solo donde la superficie se rompe
    base = mix(base, vec3(0.2, 0.17, 0.15), 0.6 * rugo);
    base = mix(base, vec3(0.22, 0.2, 0.18), 0.3 * smoothstep(0.55, 0.9, vn(p * 1.7 + 11.0)));
    // Zonas vencidas por el peso (abajo, en el lado cedido): más oscuras y amoratadas
    base = mix(base, vec3(0.2, 0.1, 0.09), 0.35 * smoothstep(0.0, -0.45, p.y));
    // Zona tensa: la piel estirada se aclara y se adelgaza (poco: más clara y brillante se leía como cera)
    base = mix(base, vec3(0.44, 0.3, 0.25), 0.28 * tenso);
    // Ligadura: la cuerda aprieta la materia en su punto de enganche
    base = mix(base, vec3(0.045, 0.028, 0.022), 0.85 * exp(-length(p - puntaLobulo()) * 16.0));
    float wrap = 0.1, brillo = 0.0, rug = 0.55 + 0.45 * rugo, cav = 1.0;
    vec3 interior = vec3(0.0); // el interior de la materia no es un vacío: devuelve algo de la luz
    if (mat > 1.5){
      // Interior: capas según la profundidad bajo la piel, con límites irregulares
      float pr = prof + 0.02 * (vn(p * 18.0) - 0.5);
      // Borde de sebo pálido, luego carne carmesí, luego un fondo que no se ve
      vec3 capa = mix(vec3(0.3, 0.22, 0.17), vec3(0.22, 0.055, 0.045), smoothstep(0.01, 0.05 + 0.05 * vn(p * 14.0), pr));
      capa = mix(capa, vec3(0.13, 0.03, 0.026), smoothstep(0.06, 0.12, pr));
      capa = mix(capa, vec3(0.15, 0.04, 0.032), smoothstep(0.13, 0.22, pr));
      // Fibras irregulares y jaspeado (no listones): tejido desgarrado, más oscuro cuanto más hondo
      float fib = vn(vec3(p.x * 16.0, p.y * 3.0, p.z * 16.0));
      float jaspe = vn(p * 7.0 + 4.0);
      base = capa * (0.55 + 0.7 * smoothstep(0.35, 0.8, fib)) * (0.75 + 0.5 * jaspe);
      base = mix(base, vec3(0.3, 0.2, 0.15), 0.25 * smoothstep(0.6, 0.9, jaspe) * (1.0 - smoothstep(0.02, 0.1, pr)));
      wrap = 0.25; brillo = 0.1;
      // Hondura: la luz apenas entra y la translucidez solo se nota junto al labio
      // (un brillo propio uniforme aplanaba el fondo y lo convertía en una incrustación)
      cav = mix(1.0, 0.3, smoothstep(0.015, 0.12, pr));
      interior = vec3(0.05, 0.011, 0.008) * mix(1.0, 0.32, smoothstep(0.02, 0.14, pr));
    } else if (mat > 0.5){
      base = HUESO * (0.9 + 0.15 * vn(p * 12.0)); wrap = 0.15; brillo = 0.15; rug = 0.35;
    } else {
      // Costra seca en el borde de la abertura, más gruesa en el labio derecho
      float costra = exp(-max(gHit, 0.0) * 40.0) * (0.3 + 0.7 * lado) * smoothstep(0.0, 0.12, uAp + 0.1);
      base = mix(base, SECO * 0.9, 0.75 * costra);
      brillo = 0.03 + 0.13 * tenso * (1.0 - rugo);
    }
    float dif = max((ndl + wrap) / (1.0 + wrap), 0.0) * mix(0.48, 1.0, sh);
    vec3 h = normalize(l - rd);
    float spec = pow(max(dot(n, h), 0.0), mix(46.0, 12.0, rug)) * brillo * sh;
    // Luz de base: un relleno muy bajo desde arriba y el rebote cálido del muro por detrás (contornos)
    float relleno = uAmb * (0.5 + 0.5 * n.y) * ao;
    float rebote = uAmb * 0.9 * pow(clamp(1.0 + dot(n, rd), 0.0, 1.0), 3.0) * ao;
    // Cenital (Acto III): roza los hombros
    vec3 lc = normalize(CENIT - p);
    float cen = uAltar * 0.35 * max(dot(n, lc), 0.0) * ao;
    col = base * cav * (Lc * dif * ao + vec3(0.2, 0.19, 0.2) * relleno + vec3(0.3, 0.17, 0.1) * cen) + CALIDA * spec * aten + vec3(0.25, 0.14, 0.08) * rebote + interior;
    tFin = tF;
  } else {
    vec3 p = pV;
    vec3 n = nV;
    vec3 l = lV; float aten = atenV; vec3 Lc = LcV;
    float sh = mix(1.0, shV, uSom);
    float dif = max(dot(n, l), 0.0);
    vec3 base;
    if (esSuelo){
      // Suelo de piedra gastada
      base = vec3(0.11, 0.085, 0.068) * (0.7 + 0.45 * vn(vec3(p.xz * 2.2, 0.0))) * (0.85 + 0.25 * vn(vec3(p.xz * 11.0, 3.0)));
    } else {
      // Muro: yeso con manchas grandes y regueros verticales
      float mancha = vn(vec3(p.xy * 1.4, 1.0));
      float reguero = vn(vec3(p.x * 9.0, p.y * 0.7, 5.0));
      base = vec3(0.13, 0.095, 0.075) * (0.65 + 0.5 * mancha) * (0.88 + 0.22 * reguero);
      // Huella en el muro: una marca pálida y borrosa donde antes colgó algo (segundo plano tenue)
      vec2 hq = (p.xy - vec2(0.42, 0.12)) / vec2(0.36, 0.62);
      base *= 1.0 + 0.16 * (1.0 - smoothstep(0.4, 1.0, length(hq) + 0.25 * vn(vec3(p.xy * 3.0, 9.0))));
    }
    col = base * Lc * dif * sh;
    col += base * vec3(0.3, 0.23, 0.17) * uAmb * 0.55;
    // Luz cenital: un rectángulo en el suelo, con bordes que se definen en un lado y se pierden en el otro
    if (esSuelo && uAltar > 0.0){
      col += vec3(0.6, 0.5, 0.38) * base * 4.2 * mA * uAltar * mix(0.12, 1.0, shc);
      // Halo de la luz cenital en el suelo
      col += vec3(0.05, 0.035, 0.025) * uAltar * exp(-dot(rA, rA) * 3.0);
    }
    tFin = tFondo;
  }

  // Cuerdas: el cable de suspensión y la cuerda que tensa el lóbulo
  float tC = 1e5;
  vec3 pl = puntaLobulo();
  float c1 = cuerda(ro, rd, ANCLA, vec3(0.0, 3.0, 0.0), 0.006, px, tC);
  float tC2 = 1e5;
  float c2 = cuerda(ro, rd, pl, vec3(-1.55, 2.6, -0.2), 0.0045, px, tC2);
  float luzC = 0.06 + 0.5 * uInt / (1.0 + pow(length(LUZ - ANCLA) / uRadio, 2.0));
  vec3 colC = vec3(0.18, 0.14, 0.1) * luzC;
  if (tC < tFin) col = mix(col, colC, c1);
  if (tC2 < tFin) col = mix(col, colC, c2);

  // Aire: bruma en el haz de la lámpara
  col += CALIDA * 0.0045 * uInt * min(bruma(ro, rd, tFin), 2.2) * (0.7 + 0.6 * vn(vec3(uv * 3.0, 1.0)));
  // Viñeta, tono y grano fijo
  col *= 1.0 - 0.5 * smoothstep(0.7, 1.9, length(uv * vec2(0.85, 1.0)));
  col = col / (1.0 + col * 0.9);
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  col = mix(col, col * col * (3.0 - 2.0 * col), 0.55);
  col += (h2(gl_FragCoord.xy) - 0.5) * 0.022;
  fragColor = vec4(col, 1.0);
}`;

const EXT_PARALELA = "KHR_parallel_shader_compile";
const SONDEO_MS = 100;

/** Marca de rendimiento (visible en la Performance API); nunca debe romper la escena. */
export function marca(nombre: string): void {
  try { performance.mark(`bacon:${nombre}`); } catch { /* sin Performance API */ }
}

/**
 * Preparación del programa WebGL2. En Chrome sobre Windows (ANGLE/D3D11) compilar este shader en frío puede tardar
 * decenas de segundos, y consultar `LINK_STATUS` antes de que termine bloquea el hilo principal todo ese tiempo.
 * Con `KHR_parallel_shader_compile` se pregunta `COMPLETION_STATUS_KHR` (que no bloquea) cada pocos
 * milisegundos, cediendo el control al navegador, y `LINK_STATUS` solo se consulta cuando ya ha terminado.
 * Sin la extensión no hay forma de esperar sin bloquear: `paralelo` es false y quien llama decide si compilar
 * (la página se detendrá durante la compilación).
 */
export class Arranque {
  /** ¿El navegador permite esperar la compilación sin bloquear el hilo principal? */
  readonly paralelo: boolean;
  private pendiente: Promise<Motor> | null = null;
  private motor: Motor | null = null;
  private descartar = false;

  private constructor(
    private canvas: HTMLCanvasElement,
    private gl: WebGL2RenderingContext,
    private ext: { COMPLETION_STATUS_KHR: number } | null,
  ) {
    this.paralelo = !!ext;
  }

  /** Abre (o reutiliza) el contexto del lienzo. null si no hay WebGL2. */
  static abrir(canvas: HTMLCanvasElement): Arranque | null {
    const previo = ARRANQUES.get(canvas);
    if (previo) return previo;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "default", preserveDrawingBuffer: false });
    if (!gl) return null;
    const a = new Arranque(canvas, gl, gl.getExtension(EXT_PARALELA));
    ARRANQUES.set(canvas, a);
    return a;
  }

  /**
   * Compila y enlaza una sola vez, aunque se llame varias veces (re-montajes de React): comparte la misma promesa.
   * Rechaza si el contexto se pierde o el programa no compila.
   */
  compilar(): Promise<Motor> {
    this.descartar = false;
    if (this.motor) return Promise.resolve(this.motor);
    this.pendiente ??= this.construir().then(
      (m) => {
        this.pendiente = null;
        if (this.descartar) { m.destruir(); throw new Error("descartado"); }
        this.motor = m;
        return m;
      },
      (e) => { this.pendiente = null; throw e; },
    );
    return this.pendiente;
  }

  /** Quien usaba el motor se va (desmontaje). Si aún se compila, se descarta al terminar; si no, se libera ya. */
  soltar(): void {
    this.descartar = true;
    if (this.motor) { this.motor.destruir(); this.motor = null; }
  }

  /** Tras perder y recuperar el contexto, los recursos anteriores ya no existen. */
  reiniciar(): void {
    this.pendiente = null;
    this.motor = null;
    this.ext = this.gl.getExtension(EXT_PARALELA); // las extensiones se piden de nuevo tras restaurar
  }

  private async construir(): Promise<Motor> {
    const { gl, ext } = this;
    marca("compilacion-inicio");
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(vs, VS);
    gl.shaderSource(fs, FS);
    // Sin consultar COMPILE_STATUS: también es una espera síncrona. Los errores se ven en LINK_STATUS y en los registros.
    gl.compileShader(vs);
    gl.compileShader(fs);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    const liberar = () => { gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs); };
    try {
      if (ext) {
        await new Promise<void>((ok, ko) => {
          const sondear = () => {
            if (gl.isContextLost()) { ko(new Error("contexto perdido")); return; }
            if (gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR)) ok();
            else setTimeout(sondear, SONDEO_MS);
          };
          sondear();
        });
      } else {
        // Sin extensión la consulta siguiente bloquea: antes se deja un fotograma para que se pinte el aviso
        await new Promise<void>((ok) => requestAnimationFrame(() => setTimeout(ok, 0)));
      }
      if (gl.isContextLost()) throw new Error("contexto perdido");
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs), gl.getProgramInfoLog(prog));
        throw new Error("el programa no compila");
      }
    } catch (e) {
      liberar();
      throw e;
    }
    marca("enlace-listo");
    gl.useProgram(prog);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const loc = {
      res: u("uRes"), luz: u("uLuz"), radio: u("uRadio"), int: u("uInt"), amb: u("uAmb"), ap: u("uAp"), ten: u("uTen"),
      altar: u("uAltar"), som: u("uSom"), unit: u("uUnit"),
    };
    return new Motor(this.canvas, gl, loc, vs, fs, prog);
  }
}
const ARRANQUES = new WeakMap<HTMLCanvasElement, Arranque>();

type Locs = Record<"res" | "luz" | "radio" | "int" | "amb" | "ap" | "ten" | "altar" | "som" | "unit", WebGLUniformLocation | null>;

export class Motor {
  private anchoCss = 0;
  private altoCss = 0;
  private dpr = 1;
  private escala = 1;
  constructor(
    private canvas: HTMLCanvasElement,
    private gl: WebGL2RenderingContext,
    private loc: Locs,
    private vs: WebGLShader,
    private fs: WebGLShader,
    private prog: WebGLProgram,
  ) {}

  /** Mide el lienzo y fija la densidad: dpr limitado y presupuesto de píxeles para que el móvil no sufra. */
  ajustar(): void {
    const r = this.canvas.getBoundingClientRect();
    const movil = Math.min(innerWidth, innerHeight) < 700;
    const presupuesto = movil ? 420_000 : 1_300_000;
    let dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.25 : 1.5);
    const px = r.width * r.height * dpr * dpr;
    if (px > presupuesto) dpr *= Math.sqrt(presupuesto / px);
    this.anchoCss = r.width;
    this.altoCss = r.height;
    this.dpr = dpr;
    this.aplicar();
  }

  /** «interactiva»: fotogramas a media resolución mientras algo se mueve; «final»: uno a resolución completa. */
  calidad(c: "interactiva" | "final"): void {
    const e = c === "interactiva" ? 0.5 : 1;
    if (e === this.escala) return;
    this.escala = e;
    this.aplicar();
  }

  private aplicar(): void {
    const w = Math.max(1, Math.round(this.anchoCss * this.dpr * this.escala));
    const h = Math.max(1, Math.round(this.altoCss * this.dpr * this.escala));
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  dibujar(e: Estado): void {
    const { gl, loc } = this;
    const w = this.canvas.width, h = this.canvas.height;
    gl.viewport(0, 0, w, h);
    // Unidad: en horizontal, media altura; en vertical, el 80 % del ancho
    const unit = Math.min(0.5 * h, 0.8 * w);
    gl.uniform2f(loc.res, w, h);
    gl.uniform2f(loc.luz, e.luzX, e.luzY);
    gl.uniform1f(loc.radio, e.radio);
    gl.uniform1f(loc.int, e.intensidad);
    gl.uniform1f(loc.amb, e.ambiente);
    gl.uniform1f(loc.ap, e.apertura);
    gl.uniform1f(loc.ten, e.tension);
    gl.uniform1f(loc.altar, e.altar);
    gl.uniform1f(loc.som, e.sombra);
    gl.uniform1f(loc.unit, unit);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destruir(): void {
    const { gl } = this;
    gl.deleteProgram(this.prog);
    gl.deleteShader(this.vs);
    gl.deleteShader(this.fs);
  }
}
