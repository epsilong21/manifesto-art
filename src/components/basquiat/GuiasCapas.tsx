import type { CSSProperties } from "react";
import { CAPAS, HALLAZGOS, LIENZO_CAPAS, type CapaId, type Forma } from "@/content/basquiat-capas";

const { w: W, h: H } = LIENZO_CAPAS;

/** Cada contorno se dibuja dos veces: un halo oscuro debajo y el trazo de la capa encima. */
function Contorno({ forma, clase }: { forma: Forma; clase: string }) {
  if ("elipse" in forma) {
    const [cx, cy, rx, ry, giro = 0] = forma.elipse;
    return <ellipse className={clase} cx={cx} cy={cy} rx={rx} ry={ry} transform={giro ? `rotate(${giro} ${cx} ${cy})` : undefined} />;
  }
  return <path className={clase} d={forma.d} />;
}

/** Escuadras en las cuatro esquinas de una zona, como el corte de una lámina. */
function Escuadras({ zona: [x, y, w, h] }: { zona: [number, number, number, number] }) {
  const l = 28;
  return (
    <path
      className="bq-escuadra"
      d={`M${x} ${y + l}V${y}H${x + l} M${x + w - l} ${y}H${x + w}V${y + l} M${x + w} ${y + h - l}V${y + h}H${x + w - l} M${x + l} ${y + h}H${x}V${y + h - l}`}
    />
  );
}

/**
 * Guías de «Descifrar capas» sobre la pintura, en coordenadas de la reproducción.
 * Nunca rellenan ni deforman la obra: solo contornos finos y, al abrir un
 * hallazgo, un velo que oscurece lo que queda fuera de su zona.
 */
export function GuiasCapas({
  activas,
  vista,
  elemento,
  hallazgo,
}: {
  activas: CapaId[];
  /** La capa que se explica: se dibuja la última, encima de las demás. */
  vista: CapaId | null;
  elemento: number | null;
  hallazgo: number | null;
}) {
  const h = HALLAZGOS.find((x) => x.n === hallazgo);
  const capas = [...CAPAS].sort((a, b) => Number(a.id === vista) - Number(b.id === vista));
  return (
    <svg className="bq-guias" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {h ? (
        <>
          <path
            className="bq-velo"
            fillRule="evenodd"
            d={`M-10 -10H${W + 10}V${H + 10}H-10Z ${h.zonas.map(([x, y, w, hh]) => `M${x} ${y}h${w}v${hh}h${-w}Z`).join(" ")}`}
          />
          {h.zonas.map((z) => (
            <Escuadras key={z.join()} zona={z} />
          ))}
        </>
      ) : null}
      {capas.map((c) => (
        <g
          key={c.id}
          className="bq-g"
          data-on={activas.includes(c.id) || undefined}
          data-vista={c.id === vista || undefined}
          style={{ "--c": c.color, "--trazo": c.trazo } as CSSProperties}
        >
          {c.elementos.map((e) => (
            <g key={e.n} data-sel={elemento === e.n || undefined}>
              {e.formas.map((f, i) => (
                <Contorno key={`h${i}`} forma={f} clase="bq-halo" />
              ))}
              {e.formas.map((f, i) => (
                <Contorno key={`t${i}`} forma={f} clase="bq-trazo" />
              ))}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
