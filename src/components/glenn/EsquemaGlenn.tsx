import { LIENZO_GLENN, ZONAS_GLENN } from "@/content/glenn";

const { w: W, h: H } = LIENZO_GLENN;

/**
 * Esquema propio de MANIFESTO para Glenn, sin la pintura: el lienzo a su proporción,
 * una retícula orientativa de hojas y la zona aproximada de la máscara. Solo geometría
 * rotulada; no reproduce ni imita la pintura, la escritura ni los signos de Basquiat.
 * Se usa cuando no hay reproducción (ni autorizada ni de referencia local).
 */
export function EsquemaGlenn() {
  const { columnas, filas } = ZONAS_GLENN.hojas;
  const m = ZONAS_GLENN.mascara;
  const hw = W / columnas;
  const hh = H / filas;
  const hojas = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      // Desfase fijo y pequeño: hojas pegadas a mano, no una cuadrícula perfecta
      const dx = (((c * 7 + f * 3) % 5) - 2) * 9;
      const dy = (((c * 3 + f * 5) % 5) - 2) * 9;
      hojas.push(<rect key={`${f}-${c}`} x={c * hw + 14 + dx} y={f * hh + 14 + dy} width={hw - 28} height={hh - 28} />);
    }
  }
  return (
    <svg className="gl-esquema" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Esquema de MANIFESTO, no la pintura: el lienzo apaisado de Glenn, una retícula de hojas y la zona aproximada de la máscara en el centro.">
      <rect width={W} height={H} className="gl-esquema__fondo" />
      <g className="gl-esquema__hojas">{hojas}</g>
      <ellipse cx={m.cx * W} cy={m.cy * H} rx={m.rx * W} ry={m.ry * H} className="gl-esquema__mascara" />
      <text x={m.cx * W} y={m.cy * H} className="gl-esquema__rotulo" textAnchor="middle">
        MÁSCARA · ZONA APROX.
      </text>
      <text x={60} y={H - 60} className="gl-esquema__aviso">
        ESQUEMA DE MANIFESTO — NO ES LA PINTURA
      </text>
    </svg>
  );
}
