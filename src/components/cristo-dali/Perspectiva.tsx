import { DALI_IMG } from "@/content/cristo-dali";

type V = [number, number, number];
const W = 100;
const H = DALI_IMG.ratio * 100;
/** Mirada fija del paisaje (grados sobre el horizonte): casi de frente. */
const MIRADA_PAISAJE = 3;
const HORIZONTE_Y = 0.878 * H;
const R = 17;
/** Distancia focal: se acerca al subir la mirada. */
const focal = (grados: number) => 112 + (175 - 112) * Math.min(1, grados / 58);
const CX = 50;
const CY = 55;
const OBJETIVO: V = [0, -5.2, 0];
const LUZ: V = norm([-0.5, 0.8, 0.6]);

function norm(v: V): V {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** Un bloque: x, y, z mínimos y máximos. */
type Bloque = { min: V; max: V; color: [number, number, number] };
const CRUZ: Bloque[] = [
  { min: [-0.45, -13, -0.25], max: [0.45, 1.2, 0.25], color: [150, 118, 66] },
  { min: [-3.7, -0.5, -0.25], max: [3.7, 0.55, 0.25], color: [165, 130, 72] },
  { min: [-0.8, 1.2, -0.2], max: [0.8, 2.3, 0.2], color: [135, 108, 62] },
];

const NORMALES: { n: V; v: [number, number, number, number] }[] = [
  { n: [1, 0, 0], v: [1, 3, 7, 5] },
  { n: [-1, 0, 0], v: [0, 4, 6, 2] },
  { n: [0, 1, 0], v: [2, 6, 7, 3] },
  { n: [0, -1, 0], v: [0, 1, 5, 4] },
  { n: [0, 0, 1], v: [4, 5, 7, 6] },
  { n: [0, 0, -1], v: [0, 2, 3, 1] },
];
const vertices = (b: Bloque): V[] => {
  const out: V[] = [];
  for (let i = 0; i < 8; i++) out.push([i & 1 ? b.max[0] : b.min[0], i & 2 ? b.max[1] : b.min[1], i & 4 ? b.max[2] : b.min[2]]);
  return out;
};

function camara(grados: number) {
  const t = (grados * Math.PI) / 180;
  const F = focal(grados);
  const pos: V = [OBJETIVO[0], OBJETIVO[1] + R * Math.sin(t), OBJETIVO[2] + R * Math.cos(t)];
  const fwd: V = [0, -Math.sin(t), -Math.cos(t)];
  const up: V = [0, Math.cos(t), -Math.sin(t)];
  const proyecta = (p: V): [number, number, number] => {
    const d = sub(p, pos);
    const z = dot(d, fwd);
    return [CX + (F * d[0]) / z, CY - (F * dot(d, up)) / z, z];
  };
  return { pos, fwd, up, proyecta, t, F };
}

/**
 * Estado A: dos miradas en un mismo cuadro. La cruz se ve con una cámara cuya altura controla el
 * visitante; el paisaje, con otra casi de frente. Cuando las dos coinciden, la escena es posible;
 * cuando se separan, es la perspectiva del cuadro. Es un modelo geométrico, no una reconstrucción.
 */
export function Perspectiva({ elev }: { elev: number }) {
  const c = camara(elev);
  const F = c.F;
  // Caras visibles, de más lejos a más cerca
  const caras: { d: string; fill: string; z: number }[] = [];
  for (const b of CRUZ) {
    const vs = vertices(b).map((v) => ({ v, p: c.proyecta(v) }));
    for (const { n, v } of NORMALES) {
      const centro: V = [0, 1, 2].map((k) => v.reduce((s, i) => s + vs[i].v[k], 0) / 4) as V;
      if (dot(n, sub(c.pos, centro)) <= 0) continue;
      const l = Math.max(0, dot(n, LUZ));
      const k = 0.22 + 0.78 * l;
      const pts = v.map((i) => vs[i].p);
      caras.push({
        d: `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" L")}Z`,
        fill: `rgb(${Math.round(b.color[0] * k)},${Math.round(b.color[1] * k)},${Math.round(b.color[2] * k)})`,
        z: pts.reduce((s, p) => s + p[2], 0) / 4,
      });
    }
  }
  caras.sort((a, b) => b.z - a.z);

  // Figura abstracta: manos, hombros, cadera, pies y cabeza, colgada ante la cruz
  const fz = 0.45;
  const P = (x: number, y: number) => c.proyecta([x, y, fz]);
  const pts = [P(-3.4, 0.1), P(-0.9, -0.2), P(0, -2.2), P(0.9, -0.2), P(3.4, 0.1)];
  const cuerpo = `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" L")}`;
  const cadera = P(0, -4.6), pies = P(0.05, -6.2), cuello = P(0, -0.6);
  const cab = P(0, -1.7);
  const rCab = (F * 0.55) / cab[2];

  // Punto de fuga del tronco: dirección «hacia abajo»
  const sinT = Math.sin(c.t), cosT = Math.cos(c.t);
  const vpY = sinT > 0.08 ? CY + F * (cosT / sinT) : Infinity;
  const vpVisible = vpY < H - 2;
  const bordeIzq = c.proyecta([-0.45, 1.2, 0.25]), bordeDer = c.proyecta([0.45, 1.2, 0.25]);

  const brecha = Math.abs(elev - MIRADA_PAISAJE);

  return (
    <svg className="vd-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Modelo geométrico de la cruz vista desde ${Math.round(elev)} grados sobre ella, con un paisaje visto de frente`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="vd-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#040405" />
          <stop offset="0.62" stopColor="#0a0907" />
          <stop offset="0.86" stopColor="#3b3626" />
          <stop offset="1" stopColor="#6d6444" />
        </linearGradient>
        <linearGradient id="vd-agua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3a5c" />
          <stop offset="1" stopColor="#0d1424" />
        </linearGradient>
        <radialGradient id="vd-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c9a24a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#c9a24a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#vd-cielo)" />
      {/* Paisaje, visto de frente */}
      <g>
        <path d={`M0,${HORIZONTE_Y} L9,${HORIZONTE_Y - 2.2} L20,${HORIZONTE_Y - 0.8} L34,${HORIZONTE_Y - 1.6} L52,${HORIZONTE_Y - 0.7} L70,${HORIZONTE_Y - 1.9} L88,${HORIZONTE_Y - 0.9} L100,${HORIZONTE_Y - 2.6} L100,${HORIZONTE_Y} Z`} fill="#16140f" />
        <rect x="0" y={HORIZONTE_Y} width={W} height={H - HORIZONTE_Y} fill="url(#vd-agua)" />
        {Array.from({ length: 9 }, (_, i) => {
          const x = -40 + i * 22;
          return <line key={i} x1={x} y1={H} x2={50 + (x - 50) * 0.06} y2={HORIZONTE_Y} stroke="#8aa0cf" strokeOpacity="0.16" strokeWidth="0.25" />;
        })}
        {[0.2, 0.48, 0.8].map((k) => (
          <line key={k} x1="0" x2={W} y1={HORIZONTE_Y + (H - HORIZONTE_Y) * k * k} y2={HORIZONTE_Y + (H - HORIZONTE_Y) * k * k} stroke="#8aa0cf" strokeOpacity="0.14" strokeWidth="0.25" />
        ))}
        <line x1="0" x2={W} y1={HORIZONTE_Y} y2={HORIZONTE_Y} stroke="#9fb6e8" strokeOpacity="0.9" strokeWidth="0.35" strokeDasharray="2 1.6" />
        <text x="2" y={HORIZONTE_Y - 3.4} className="vd-rot vd-rot--agua">Horizonte de la bahía · mirada de frente</text>
      </g>
      <ellipse cx={CX} cy={CY + 14} rx="46" ry="30" fill="url(#vd-halo)" />
      {/* Líneas de fuga del tronco */}
      {vpVisible ? (
        <g stroke="#e0b95a" strokeOpacity="0.55" strokeWidth="0.3" strokeDasharray="1.4 1.2">
          <line x1={bordeIzq[0]} y1={bordeIzq[1]} x2={CX} y2={vpY} />
          <line x1={bordeDer[0]} y1={bordeDer[1]} x2={CX} y2={vpY} />
        </g>
      ) : null}
      {/* La cruz */}
      <g strokeLinejoin="round">
        {caras.map((f, i) => (
          <path key={i} d={f.d} fill={f.fill} stroke="#f1dca0" strokeOpacity="0.28" strokeWidth="0.22" />
        ))}
      </g>
      {/* Figura abstracta */}
      <g fill="none" stroke="#fff3cf" strokeOpacity="0.85" strokeWidth="0.45" strokeLinecap="round" strokeLinejoin="round">
        <path d={cuerpo} />
        <path d={`M${cuello[0]},${cuello[1]} L${cadera[0]},${cadera[1]} L${pies[0]},${pies[1]}`} />
        <circle cx={cab[0]} cy={cab[1]} r={rCab} />
      </g>
      {vpVisible ? (
        <g>
          <circle cx={CX} cy={vpY} r="1.1" fill="#e0b95a" />
          <text x={CX + 2.4} y={vpY + 0.8} className="vd-rot vd-rot--oro">Punto de fuga de la cruz</text>
        </g>
      ) : null}
      {brecha > 10 ? <text x={W - 2} y={6} textAnchor="end" className="vd-rot vd-rot--oro">{`Cruz a ${Math.round(elev)}° · paisaje a ${MIRADA_PAISAJE}°`}</text> : null}
    </svg>
  );
}

export const MIRADA_PAISAJE_GRADOS = MIRADA_PAISAJE;
