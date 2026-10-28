import { MEG_IMG as I, RESTAURACION as R } from "@/content/loca-meg";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Estación de restauración. Solo hay una reproducción posterior a la restauración, así que
 * no se compara: se muestra el cielo del centro ampliado y los hitos documentados.
 */
export function Restauracion() {
  const z = R.cielo.zoom;
  /** Contenedor 16:9; la imagen se coloca sin dejar ver los bordes. */
  const caja = 9 / 16;
  const left = clamp(50 - R.cielo.x * z * 100, (1 - z) * 100, 0);
  const top = clamp(50 - R.cielo.y * ((z * I.ratio) / caja) * 100, (1 - (z * I.ratio) / caja) * 100, 0);
  return (
    <section className="meg-resta" aria-labelledby="meg-resta-h">
      <div className="meg-resta__cab">
        <h2 id="meg-resta-h" className="sp-h2">Un cielo recuperado</h2>
        <p>Bajo el barniz y los repintes, el cielo era azul verdoso. Y la fecha del cuadro cambió.</p>
      </div>
      <div className="meg-resta__cuerpo">
        <figure className="meg-resta__fig">
          <div className="meg-resta__caja">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE}${I.base}-${I.anchos[1]}.webp`}
              width={I.width}
              height={I.height}
              alt="Detalle del cielo del centro del cuadro, entre el rojo del incendio, con tonos verdosos."
              loading="lazy"
              decoding="async"
              style={{ width: `${z * 100}%`, left: `${left}%`, top: `${top}%` }}
            />
          </div>
          <figcaption>
            Detalle del cielo central en la reproducción posterior a la restauración. No hay aquí una imagen «antes» documentada, así que no se compara.
          </figcaption>
        </figure>
        <div className="meg-resta__texto">
          <p className="meg-resta__fecha" aria-label="1563">1563</p>
          <p className="meg-resta__fecha-p">
            La obra se fechaba en 1561. Al limpiarla, el KIK-IRPA encontró en la tabla la fecha 1563, el año en que Bruegel se casó.
          </p>
          <ol className="meg-resta__hitos">
            {R.hitos.map((h) => (
              <li key={h.fecha}>
                <strong>{h.fecha}</strong>
                <span>{h.texto}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
