const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Cualquier punto de interés: posición y aumento en % de la obra. */
export type FocusPoint = { x: number; y: number; zoom: number };

export type FocusView = {
  scale: number;
  /** Desplazamiento del lienzo en % de su propio tamaño. */
  tx: number;
  ty: number;
  /** Centro de la linterna, en % del escenario. */
  spotX: number;
  spotY: number;
  /** Radio de la linterna, en % del ancho del escenario. */
  spotR: number;
};

export const OVERVIEW: FocusView = { scale: 1, tx: 0, ty: 0, spotX: 50, spotY: 45, spotR: 140 };

/**
 * Calcula el encuadre que centra un hotspot sin dejar ver los bordes del lienzo.
 * Todo está en porcentajes, así que el resultado no depende del tamaño en pantalla.
 */
export function focusOn(h: FocusPoint): FocusView {
  const s = h.zoom;
  const tx = clamp(50 - s * h.x, (1 - s) * 100, 0);
  const ty = clamp(50 - s * h.y, (1 - s) * 100, 0);
  return { scale: s, tx, ty, spotX: tx + s * h.x, spotY: ty + s * h.y, spotR: 30 };
}
