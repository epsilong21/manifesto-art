"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { GLENN, ZONAS_GLENN } from "@/content/glenn";

export type TipoHoja = "dato" | "trama" | "registro" | "regla" | "numero";

export type Hoja = {
  i: number;
  /** Posición y tamaño en fracciones del muro. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Giro en grados, altura sobre el muro (px) y tono del papel (0 negro, 1 blanco). */
  giro: number;
  z: number;
  tono: number;
  tipo: TipoHoja;
  texto: string;
  /** Esquina levantada: 0 ninguna, 1–4 en el sentido de las agujas del reloj. */
  esquina: number;
  /** Dentro de la zona de la máscara: el muro está hundido. */
  hueco: boolean;
};

/**
 * Material gráfico propio de MANIFESTO: datos documentados de la obra en tipografía
 * de máquina (medidas, fechas, lugares) y rótulos de archivo. Nada imita la escritura,
 * los dibujos ni los signos de Basquiat.
 */
const FRAGMENTOS = [
  `${GLENN.ancho} × ${GLENN.alto}`,
  "1984",
  "1985",
  "HOJA 05",
  "COPIA",
  "MARY BOONE · NY",
  "BARBICAN · 2017",
  "A MÁQUINA",
  "ACRÍLICO · ÓLEO EN BARRA",
  "COLLAGE",
  "ARCHIVO",
  "XEROX",
];

/** Generador determinista (mulberry32): el muro es el mismo en el servidor y en el cliente. */
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

const TIPOS: TipoHoja[] = ["dato", "trama", "registro", "regla", "numero", "dato", "trama"];

/** Las hojas del muro: la retícula de ZONAS_GLENN, desordenada como hojas pegadas a mano. */
export function hojasMuro(): Hoja[] {
  const { columnas, filas } = ZONAS_GLENN.hojas;
  const m = ZONAS_GLENN.mascara;
  const r = azar(1985);
  const cw = 1 / columnas;
  const ch = 1 / filas;
  const hojas: Hoja[] = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const i = f * columnas + c;
      const x = c * cw + (r() - 0.5) * cw * 0.16 - cw * 0.02;
      const y = f * ch + (r() - 0.5) * ch * 0.16 - ch * 0.02;
      const w = cw * (1.02 + r() * 0.06);
      const h = ch * (1.02 + r() * 0.06);
      const cx = x + w / 2;
      const cy = y + h / 2;
      const hueco = ((cx - m.cx) / m.rx) ** 2 + ((cy - m.cy) / m.ry) ** 2 < 0.78;
      hojas.push({
        i,
        x,
        y,
        w,
        h,
        giro: (r() - 0.5) * 4.5,
        z: Math.round(r() * 6),
        tono: 0.64 + r() * 0.3,
        tipo: TIPOS[Math.floor(r() * TIPOS.length)],
        texto: FRAGMENTOS[Math.floor(r() * FRAGMENTOS.length)],
        esquina: r() < 0.3 ? 1 + Math.floor(r() * 4) : 0,
        hueco,
      });
    }
  }
  // Orden de pegado: unas hojas montan sobre otras
  return hojas.map((h) => ({ h, k: r() })).sort((a, b) => a.k - b.k).map(({ h }) => h);
}

const HOJAS = hojasMuro();

function Contenido({ hoja }: { hoja: Hoja }) {
  switch (hoja.tipo) {
    case "dato":
      return <span className="gl-hoja__txt">{hoja.texto}</span>;
    case "numero":
      return <span className="gl-hoja__num">{String(hoja.i + 1).padStart(2, "0")}</span>;
    case "registro":
      return (
        <svg className="gl-hoja__reg" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="7" />
          <path d="M20 6V34M6 20H34" />
        </svg>
      );
    default:
      // Trama y regla: solo fondo (glenn.css)
      return null;
  }
}

/**
 * Muro de fotocopias de MANIFESTO, sin la pintura: la retícula de hojas de
 * ZONAS_GLENN en profundidad (CSS 3D), con desplazamientos, giros, sombras y
 * esquinas levantadas. En la zona aproximada de la máscara el muro se hunde: un
 * hueco rotulado, no una figura. Las hojas cercanas al puntero se levantan.
 *
 * - `inclinar`: el muro se inclina con el ratón (hero).
 * - Con movimiento reducido, ni inclinación ni hojas que se levantan.
 */
export function MuroHojas({ inclinar = false }: { inclinar?: boolean }) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    // Escucha en el visor o la lámina: las marcas y capas de encima no tapan el gesto
    const zona = el?.closest<HTMLElement>(".gl-visor, .gl-lamina__obra") ?? el;
    if (!el || !zona || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hojas = [...el.querySelectorAll<HTMLElement>(".gl-hoja")];
    let marco = 0;
    let px = -1;
    let py = -1;
    const pintar = () => {
      marco = 0;
      for (const h of hojas) {
        const cx = Number(h.dataset.cx);
        const cy = Number(h.dataset.cy);
        const d = px < 0 ? 9 : Math.hypot((cx - px) * 1.14, cy - py);
        const lift = d < 0.16 ? (1 - d / 0.16) ** 2 * 26 : 0;
        h.style.setProperty("--lift", `${lift.toFixed(1)}px`);
      }
      if (inclinar) {
        const on = px >= 0;
        el.style.setProperty("--tx", on ? `${((0.5 - py) * 8).toFixed(2)}deg` : "0deg");
        el.style.setProperty("--ty", on ? `${((px - 0.5) * 10).toFixed(2)}deg` : "0deg");
      }
    };
    const programar = () => {
      if (!marco) marco = requestAnimationFrame(pintar);
    };
    const mover = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse" && e.buttons === 0) return;
      const r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top) / r.height;
      programar();
    };
    const salir = () => {
      px = py = -1;
      programar();
    };
    // En táctil, la hoja vuelve a su sitio al levantar el dedo
    const soltar = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse") salir();
    };
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerleave", salir);
    zona.addEventListener("pointerup", soltar);
    return () => {
      zona.removeEventListener("pointermove", mover);
      zona.removeEventListener("pointerleave", salir);
      zona.removeEventListener("pointerup", soltar);
      cancelAnimationFrame(marco);
    };
  }, [inclinar]);

  const m = ZONAS_GLENN.mascara;
  return (
    <div
      ref={raiz}
      className="gl-muro"
      data-inclinar={inclinar ? "" : undefined}
      role="img"
      aria-label="Esquema de MANIFESTO, no la pintura: un muro de hojas fotocopiadas con datos de la obra, hundido en la zona aproximada de la máscara."
    >
      <div className="gl-muro__plano">
        <div
          className="gl-muro__hueco"
          style={{ left: `${(m.cx - m.rx) * 100}%`, top: `${(m.cy - m.ry) * 100}%`, width: `${m.rx * 200}%`, height: `${m.ry * 200}%` }}
        />
        {HOJAS.map((h) => (
          <div
            key={h.i}
            className="gl-hoja"
            data-tipo={h.tipo}
            data-hueco={h.hueco ? "" : undefined}
            data-esquina={h.esquina || undefined}
            data-cx={(h.x + h.w / 2).toFixed(3)}
            data-cy={(h.y + h.h / 2).toFixed(3)}
            style={
              {
                left: `${h.x * 100}%`,
                top: `${h.y * 100}%`,
                width: `${h.w * 100}%`,
                height: `${h.h * 100}%`,
                "--giro": `${h.giro.toFixed(2)}deg`,
                "--z": `${h.z}px`,
                "--tono": h.tono.toFixed(3),
              } as CSSProperties
            }
          >
            <Contenido hoja={h} />
          </div>
        ))}
        <p
          className="gl-muro__rotulo"
          style={{ left: `${m.cx * 100}%`, top: `${m.cy * 100}%` }}
        >
          Máscara · zona aprox.
        </p>
      </div>
      <p className="gl-muro__aviso">Esquema de MANIFESTO — no es la pintura</p>
    </div>
  );
}
