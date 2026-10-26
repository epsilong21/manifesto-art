import type { CSSProperties } from "react";
import type { Lectura } from "@/content/glenn";

const N = 24;

type Pos = { x: number; y: number; giro: number; z: number; tenue?: boolean };

/** Generador determinista: mismas hojas en el servidor y en el cliente. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r = azar(84);
const RUIDO = Array.from({ length: N }, () => [r() - 0.5, r() - 0.5, r() - 0.5] as const);

/**
 * Dónde va cada hoja en cada lectura (centro de la hoja, en % del muro):
 * - Retrato: las hojas forman un marco alrededor de un hueco, como un retrato colgado.
 * - Máscara: el muro entero; el centro se hunde en un hueco oscuro que se traga sus hojas.
 * - Archivo: las hojas se apilan en cuatro montones numerados, como un fichero.
 */
const POSICIONES: Record<Lectura["id"], Pos[]> = {
  retrato: RUIDO.map(([a, b, c], i) => {
    const t = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + Math.cos(t) * 30 + a * 2, y: 50 + Math.sin(t) * 31 + b * 2, giro: c * 8, z: 6 };
  }),
  mascara: RUIDO.map(([a, b, c], i) => {
    const col = i % 6;
    const fila = Math.floor(i / 6);
    const x = 9 + col * 16.4 + a * 2;
    const y = 13 + fila * 25 + b * 2;
    const dentro = ((x - 50) / 22) ** 2 + ((y - 50) / 34) ** 2 < 1;
    return { x, y, giro: c * 5, z: dentro ? -60 : 0, tenue: dentro };
  }),
  archivo: RUIDO.map(([a, , c], i) => {
    const pila = i % 4;
    const nivel = Math.floor(i / 4);
    return { x: 17 + pila * 22 + a * 1.5, y: 64 - nivel * 4.5, giro: c * 3, z: nivel * 4 };
  }),
};

const ROTULOS: Record<Lectura["id"], string> = {
  retrato: "Un nombre propio en el centro",
  mascara: "Un hueco que oculta tanto como muestra",
  archivo: "Copias apiladas y numeradas",
};

/**
 * Muro de las tres lecturas: 24 hojas de MANIFESTO (el mismo papel que MuroHojas)
 * que se reorganizan al cambiar de lectura. Solo CSS: la transición mueve cada
 * hoja a su sitio; con movimiento reducido cambian de golpe. Decorativo (el texto
 * de la lectura dice lo mismo), así que queda fuera del árbol de accesibilidad.
 */
export function MuroLecturas({ lectura }: { lectura: Lectura["id"] }) {
  const pos = POSICIONES[lectura];
  return (
    <div className="gl-mlec" data-lectura={lectura} aria-hidden="true">
      <div className="gl-mlec__plano">
        <div className="gl-mlec__hueco" />
        {pos.map((p, i) => (
          <div
            key={i}
            className="gl-mlec__hoja"
            data-tenue={p.tenue ? "" : undefined}
            style={
              {
                // Redondeado: el servidor y el navegador no dan los mismos últimos decimales
                "--x": `${p.x.toFixed(2)}%`,
                "--y": `${p.y.toFixed(2)}%`,
                "--g": `${p.giro.toFixed(2)}deg`,
                "--z": `${p.z}px`,
                "--d": `${(i % 8) * 25}ms`,
              } as CSSProperties
            }
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
          </div>
        ))}
        <p className="gl-mlec__nombre">GLENN</p>
      </div>
      <p className="gl-mlec__rotulo">{ROTULOS[lectura]}</p>
      <p className="gl-mlec__aviso">Esquema de MANIFESTO</p>
    </div>
  );
}
