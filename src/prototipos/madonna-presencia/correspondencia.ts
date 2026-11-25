/**
 * V2.4/V2.5 — Correspondencia entre la pintura y la instalación (V2.5: ritmo y sustitución del regreso).
 *
 * La composición 3D se derivó de las medidas de la pintura (`PINTURA` en `composicion.ts`, % de H sobre la reproducción
 * de la Fundació): en la vista alineada cada pieza cae donde cae en la pintura. Este módulo calcula, dado el rectángulo
 * que ocupa la lámina en pantalla, el encuadre de cámara (zoom y desplazamiento) con el que la composición 3D coincide
 * con la composición de la lámina: eje, cornisas, volúmenes y pedestal en las mismas posiciones. Es solo geometría de
 * pantalla: no lee ni toca los píxeles de la lámina.
 */
import { H_UV, focoPara } from "../madonna-retablo/composicion";
import type { Clave, Encuadre } from "./Instalacion";

/**
 * Medidas, en píxeles de la reproducción de referencia local (768 × 986, con marco), de la composición de la pintura:
 * eje de simetría (concha, huevo, hueco entre cornisas y volúmenes), línea de la parte superior de la concha y alto
 * total de la composición (de la concha a la base del pedestal = 100 % de H en `PINTURA`). Hay que repetirlas para
 * cualquier otra reproducción (otra resolución o recorte).
 */
export const REGISTRO = { ancho: 768, alto: 986, ejeX: 397.5, yArriba: 65, hComp: 840 } as const;

export type Rect = { left: number; top: number; width: number; height: number };

/** Encuadre de la cámara alineada que hace coincidir la composición 3D con la de la lámina, colocada en `rect`. */
export function registrar(rect: Rect, vw: number, vh: number): Encuadre {
  const k = rect.width / REGISTRO.ancho;
  const cx = rect.left + REGISTRO.ejeX * k;
  const cy = rect.top + (REGISTRO.yArriba + REGISTRO.hComp / 2) * k;
  const focoNat = focoPara(vw / vh);
  return {
    zoom: (REGISTRO.hComp * k) / (H_UV * focoNat * vh),
    sx: (cx - vw / 2) / vh,
    sy: (vh / 2 - cy) / vh,
  };
}

/**
 * Variantes del regreso (V2.5 / V2.6B.5).
 * B (el largo recorrido por el eje) queda descartada y fuera del código; se conserva en V2.4.
 *  a  · V2.4 original, solo como referencia de comparación: la lámina se funde translúcida sobre la escena.
 *  a1 · sustitución limpia: tras un instante quieto en el encuadre registrado, la escena es sustituida por la lámina en un
 *       solo fotograma (corte); la lámina nunca es translúcida.
 *  a2 · fundido breve del contenedor escénico y, tras un instante oscuro, aparición opaca de la lámina (corte).
 *  r1 · «la respiración»: igual que a1 pero con un fundido breve (200 ms) del contenedor escénico justo antes de que
 *       aparezca la lámina. La atenuación prepara la mirada para el corte; la lámina nunca es translúcida.
 *  r2 · «continuidad espacial»: el contenedor escénico ajusta su exposición y saturación (vía CSS filter) durante 500 ms
 *       mientras la cámara se acerca, y luego se atenúa 300 ms antes del corte. La brecha visual 3D → pintura se reduce.
 */
export type Variante = "a" | "a1" | "a2" | "r1" | "r2";
export const VARIANTE0: Variante = "r1";

type Tiempos = { camara: number; fundido: number; fundidoDur: number; sust: number; sustDur: number; barras: number; barrasDur: number; total: number };

/**
 * Duraciones de cada variante (ms desde «Volver a la pintura»):
 *  camara     llegada al encuadre registrado (a la vez, el entorno se oscurece alrededor de la lámina)
 *  fundido    inicio del fundido del contenedor escénico (solo a2) y su duración
 *  sust       instante en que aparece la lámina y duración de su aparición (0 = corte, opaca desde el primer fotograma)
 *  barras     entrada de los rótulos y controles: la lámina ya está sola desde `sust`
 *  total      fin de la transición y paso al estado final
 * Las mismas cifras se publican como variables CSS en `.pr` (ver `Presencia.tsx`): una sola fuente de verdad.
 */
export const TIEMPOS: Record<Variante, Tiempos> = {
  a: { camara: 1100, fundido: 0, fundidoDur: 0, sust: 1500, sustDur: 1100, barras: 3200, barrasDur: 800, total: 4300 },
  a1: { camara: 1000, fundido: 1300, fundidoDur: 0, sust: 1300, sustDur: 0, barras: 2100, barrasDur: 700, total: 2900 },
  a2: { camara: 1000, fundido: 1300, fundidoDur: 350, sust: 1800, sustDur: 0, barras: 2600, barrasDur: 700, total: 3400 },
  r1: { camara: 1000, fundido: 1300, fundidoDur: 200, sust: 1500, sustDur: 0, barras: 2100, barrasDur: 600, total: 2800 },
  r2: { camara: 1000, fundido: 1200, fundidoDur: 300, sust: 1500, sustDur: 0, barras: 2200, barrasDur: 600, total: 2900 },
};

/** La cámara se aleja hasta el encuadre de la lámina y se queda quieta hasta que esta aparece. */
export function clavesRegreso(reg: Encuadre, v: Variante): Clave[] {
  const t = TIEMPOS[v];
  return [
    { t: 0, zoom: 1, sx: 0, sy: 0 },
    { t: t.camara, ...reg },
    { t: t.sust, ...reg },
  ];
}

/** Vuelta a la instalación desde la lámina: la cámara se acerca de nuevo al encuadre completo. */
export function clavesVuelta(reg: Encuadre): Clave[] {
  return [
    { t: 0, ...reg },
    { t: 700, ...reg },
    { t: 1800, zoom: 1, sx: 0, sy: 0 },
  ];
}
export const DUR_VUELTA = 1900;
