import { DALI_IMG as I, NUCLEO as N, PERFIL_LUZ } from "@/content/cristo-dali";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const VB_H = I.ratio * 100;
const SRC = `${BASE}${I.base}-${I.anchos[1]}.webp`;

/** Centro de la franja iluminada para un recorrido t (0–1). */
export const centroFranja = (t: number) => 0.08 + 0.87 * t;
/** Luminosidad medida (0–100) en la franja que está bajo el centro. */
export const luzEn = (y: number) => PERFIL_LUZ[Math.min(PERFIL_LUZ.length - 1, Math.max(0, Math.floor(y * PERFIL_LUZ.length)))];

const IDX = (id: string) => N.pasos.findIndex((p) => p.id === id);

/**
 * Guías sobre la pintura: triángulo, círculo y ejes sobre la pintura. `fundido` (0–1) lleva la pintura a la penumbra
 * para dejar solo la geometría. Lo que se ve de cada paso depende de `paso`.
 */
export function Nucleo({ paso, fundido }: { paso: number; fundido: number }) {
  const px = (x: number) => (x * 100).toFixed(2);
  const py = (y: number) => (y * VB_H).toFixed(2);
  const cabeza = N.cabeza;
  const tri = `M${px(N.manoIzq.x)},${py(N.manoIzq.y)} L${px(N.manoDer.x)},${py(N.manoDer.y)} L${px(N.pies.x)},${py(N.pies.y)}Z`;
  const cx = cabeza.x * 100, cy = cabeza.y * VB_H, r = cabeza.r * 100;
  const ejes = paso >= IDX("ejes"), triangulo = paso >= IDX("triangulo"), circulo = paso >= IDX("circulo"), nucleo = paso >= IDX("nucleo");
  const brillo = 1 - 0.78 * fundido;
  return (
    <div className="vd-nucleo" role="img" aria-label={paso < 0 ? "La pintura, sin guías" : `La pintura con ${["los ejes", "el triángulo", "el círculo", "el núcleo"][paso]} dibujado encima`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="vd-img" src={SRC} width={I.width} height={I.height} alt="" loading="lazy" decoding="async" draggable={false} style={{ filter: `brightness(${brillo.toFixed(3)}) saturate(${(1 - 0.5 * fundido).toFixed(2)})` }} />
      <svg className="vd-svg vd-svg--geo" viewBox={`0 0 100 ${VB_H}`} aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <radialGradient id="vd-nuc" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff6d8" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#e0b95a" stopOpacity="0.5" />
            <stop offset="1" stopColor="#e0b95a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="vd-geo" data-on={ejes}>
          <line x1={px(N.ejeX)} x2={px(N.ejeX)} y1="0" y2={VB_H} className="vd-eje" />
          <line x1="0" x2="100" y1={py(N.ejeY)} y2={py(N.ejeY)} className="vd-eje" />
        </g>
        <path d={tri} className="vd-geo vd-tri" data-on={triangulo} />
        <circle cx={cx} cy={cy} r={r} className="vd-geo vd-circ" data-on={circulo} />
        <g className="vd-geo" data-on={nucleo}>
          {[N.manoIzq, N.manoDer, N.pies].map((p, i) => (
            <line key={i} x1={px(p.x)} y1={py(p.y)} x2={cx} y2={cy} className="vd-conv" />
          ))}
          <circle cx={cx} cy={cy} r={r * 1.9} fill="url(#vd-nuc)" />
          <circle cx={cx} cy={cy} r="1.3" fill="#fff6d8" />
        </g>
      </svg>
    </div>
  );
}
