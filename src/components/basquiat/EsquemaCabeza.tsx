import type { CapaId } from "@/content/basquiat-capas";

/**
 * Esquema de MANIFESTO para Untitled, sin la pintura: una cabeza de lámina de
 * anatomía, dibujada con geometría propia (óvalos, cotas, retículas) en cuatro
 * acetatos, uno por capa. No calca la pintura ni sus coordenadas: los elementos
 * solo se sitúan donde están en cualquier cabeza (los dientes en la boca, los ojos
 * en las órbitas). En «Marcas», MANIFESTO no dibuja signos: solo señala con zonas
 * vacías dónde los describen los textos, sin transcribirlos ni imitarlos.
 */

export const ESQUEMA = { w: 600, h: 700 };

/** Dónde va el número de cada elemento (n de basquiat-capas.ts) en el esquema. */
export const MARCAS_ESQUEMA: Record<number, [number, number]> = {
  1: [300, 506],
  2: [128, 520],
  3: [372, 150],
  4: [300, 250],
  5: [172, 258],
  6: [444, 274],
  7: [342, 352],
  8: [474, 474],
  9: [112, 300],
  10: [488, 318],
  11: [300, 62],
  12: [470, 600],
  13: [548, 400],
  14: [56, 470],
};

/** Contorno de la cabeza común a los cuatro acetatos (registro entre capas). */
const CABEZA = "M300 96 C412 96 470 186 470 300 C470 370 452 420 430 452 C410 540 360 600 300 604 C240 600 190 540 170 452 C148 420 130 370 130 300 C130 186 188 96 300 96Z";

function Anatomia() {
  // Dientes: rectángulos sobre un arco, de la comisura izquierda a la derecha
  const dientes = Array.from({ length: 12 }, (_, i) => {
    const t = (i + 0.5) / 12;
    const x = 214 + t * 172;
    const y = 446 + Math.sin(t * Math.PI) * 14;
    return <rect key={i} x={x - 6} y={y - 11} width={12} height={22} rx={2} />;
  });
  return (
    <>
      <g data-n="4" className="bq-esq__el">
        <path d="M168 300 C168 170 230 116 300 116 C370 116 432 170 432 300" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${196 + i * 6} ${300 - i * 34} C${236 + i * 6} ${190 - i * 10} ${364 - i * 6} ${190 - i * 10} ${404 - i * 6} ${300 - i * 34}`} className="bq-esq__fino" />
        ))}
      </g>
      <g data-n="3" className="bq-esq__el">
        <path d="M232 196 l14 -16 l14 16 l14 -16 l14 16 l14 -16 l14 16 l14 -16 l14 16 l14 -16 l14 16" />
      </g>
      <circle cx={232} cy={318} r={42} className="bq-esq__orbita" />
      <circle cx={368} cy={318} r={42} className="bq-esq__orbita" />
      <path d="M300 340 L280 404 L320 404Z" className="bq-esq__orbita" />
      <g data-n="1" className="bq-esq__el bq-esq__dientes">
        {dientes}
      </g>
      <g data-n="2" className="bq-esq__el">
        <path d="M156 430 C162 520 220 600 300 612 C380 600 438 520 444 430" />
        <path d="M156 430 L140 470 L176 560" className="bq-esq__fino" />
      </g>
    </>
  );
}

function Rostro() {
  return (
    <>
      <path d={CABEZA} className="bq-esq__contorno" />
      <g data-n="5" className="bq-esq__el">
        <circle cx={240} cy={312} r={38} />
        <circle cx={240} cy={312} r={13} className="bq-esq__lleno" />
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI + (i / 8) * Math.PI;
          return <line key={i} x1={240 + Math.cos(a) * 42} y1={312 + Math.sin(a) * 42} x2={240 + Math.cos(a) * 56} y2={312 + Math.sin(a) * 56} />;
        })}
      </g>
      <g data-n="6" className="bq-esq__el">
        <ellipse cx={392} cy={316} rx={30} ry={18} />
        <line x1={362} y1={316} x2={422} y2={316} />
      </g>
      <g data-n="7" className="bq-esq__el">
        <path d="M300 300 L300 380 L276 404 L324 404 L300 380" />
      </g>
      <g data-n="8" className="bq-esq__el">
        <path d="M356 380 L452 372 L436 452 L360 446Z" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={362 + i * 18} y1={448} x2={378 + i * 18} y2={378} className="bq-esq__fino" />
        ))}
      </g>
      <path d="M248 486 C280 500 320 500 352 486" className="bq-esq__fino" />
    </>
  );
}

function Mascara() {
  return (
    <>
      <g data-n="9" className="bq-esq__el">
        <path d="M150 220 L300 112 L450 220 L462 470 L300 616 L138 470Z" />
      </g>
      <g data-n="10" className="bq-esq__el">
        <rect x={150} y={282} width={300} height={64} />
        <path d="M196 314 L268 306 L268 322Z M404 314 L332 306 L332 322Z" className="bq-esq__lleno" />
      </g>
      <path d="M300 112 L300 616" className="bq-esq__fino" />
      <path d="M150 220 L450 220 M138 470 L462 470" className="bq-esq__fino" />
    </>
  );
}

function Marcas() {
  // Zonas vacías y rotuladas: dónde dicen los textos que hay signos, nunca los signos
  const zona = (n: number, x: number, y: number, w: number, h: number) => (
    <g data-n={n} className="bq-esq__el bq-esq__zona">
      <rect x={x} y={y} width={w} height={h} />
      <line x1={x} y1={y} x2={x + w} y2={y + h} className="bq-esq__fino" />
    </g>
  );
  return (
    <>
      <path d={CABEZA} className="bq-esq__contorno bq-esq__contorno--tenue" />
      {zona(11, 168, 36, 264, 48)}
      {zona(12, 404, 566, 156, 76)}
      {zona(13, 492, 356, 92, 88)}
      {zona(14, 24, 380, 56, 200)}
      {/* Retícula de registro: la lámina como superficie medible */}
      {Array.from({ length: 13 }, (_, i) => (
        <line key={i} x1={20} y1={40 + i * 50} x2={i % 2 ? 30 : 38} y2={40 + i * 50} className="bq-esq__regla" />
      ))}
    </>
  );
}

const PLANOS: Record<CapaId, () => React.JSX.Element> = { anatomia: Anatomia, rostro: Rostro, mascara: Mascara, marcas: Marcas };

/** Cruz de registro: alinea los cuatro acetatos al apilarlos. */
function Registro({ x, y }: { x: number; y: number }) {
  return (
    <g className="bq-esq__registro">
      <circle cx={x} cy={y} r={9} />
      <path d={`M${x - 15} ${y}H${x + 15}M${x} ${y - 15}V${y + 15}`} />
    </g>
  );
}

/**
 * Un acetato del esquema: el dibujo de su capa, las cruces de registro y los números
 * de sus elementos. `activo` resalta un elemento; el resto queda atenuado.
 */
export function PlanoCabeza({ capa, numeros, activo = null }: { capa: CapaId; numeros: number[]; activo?: number | null }) {
  const Plano = PLANOS[capa];
  return (
    <svg className="bq-esq" viewBox={`0 0 ${ESQUEMA.w} ${ESQUEMA.h}`} data-capa={capa} data-activo={activo ?? undefined} aria-hidden="true">
      <Registro x={36} y={24} />
      <Registro x={564} y={676} />
      <g className="bq-esq__dibujo">
        <Plano />
      </g>
      {numeros.map((n) => {
        const [x, y] = MARCAS_ESQUEMA[n];
        return (
          <g key={n} className="bq-esq__num" data-n={n} data-on={activo === n ? "" : undefined}>
            <circle cx={x} cy={y} r={15} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="central">
              {n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
