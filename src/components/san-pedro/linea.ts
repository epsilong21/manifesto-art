/**
 * Línea de tiempo de la luz de «El peso de la negación».
 *
 * `u` es la posición narrativa: cada tramo de contenido (beat) ocupa una unidad.
 *   0–1  Acto I   · de la brasa a la luz rasante
 *   1–2  Acto I   · contemplación (Documentado)
 *   2–3  Acto II  · primera negación
 *   3–4  Acto II  · segunda negación
 *   4–5  Acto II  · tercera negación y gallo
 *   5–6  Acto III · el silencio (solo la brasa)
 *   6–7  Acto III · la luz reaparece, transformada
 *   7–8  Acto III · el silencio luminoso (sin texto): la luz termina de reconstruir el espacio
 *   8–9  Acto IV  · lo que permanece
 */

export type Estado = {
  /** Intensidad global de la luz sobre la pintura (0–1). */
  luz: number;
  /** Saturación conservada (1 = color original, 0 = grises). */
  sat: number;
  /** Avance de las sombras que devoran la pintura (0–1). */
  sombra: number;
  /** Radio del haz, en alturas de pintura. */
  radio: number;
  /** Centro del haz, en coordenadas de la pintura (0–1). */
  fx: number;
  fy: number;
  /** Intensidad de la brasa (el fuego del patio). */
  brasa: number;
  /** Temperatura: >0 cálida, <0 fría. */
  calido: number;
  /** Presencia del espacio alrededor de la pintura: haz, atmósfera y sombra (0–1). */
  ambiente: number;
  /** Temperatura del espacio: >0 ámbar, <0 pizarra fría. */
  tono: number;
  /** Tamaño de la pintura respecto al máximo (1 = completo): entra algo menor y gana presencia al revelarse. */
  escala: number;
};

/** Cara del santo, en coordenadas de la pintura (medida sobre la imagen real). */
export const CARA = { x: 0.64, y: 0.24 };

const K: [number, Estado][] = [
  [0.0, { luz: 0.0, sat: 1.0, sombra: 0.0, radio: 0.08, fx: 0.2, fy: 0.78, brasa: 1.0, calido: 1.0, ambiente: 0.0, tono: 0.9, escala: 0.86 }],
  [0.25, { luz: 0.0, sat: 1.0, sombra: 0.0, radio: 0.08, fx: 0.2, fy: 0.78, brasa: 1.0, calido: 1.0, ambiente: 0.0, tono: 0.9, escala: 0.86 }],
  [0.62, { luz: 0.55, sat: 1.0, sombra: 0.0, radio: 0.5, fx: 0.42, fy: 0.5, brasa: 0.8, calido: 1.0, ambiente: 0.5, tono: 0.9, escala: 0.94 }],
  [1.0, { luz: 1.0, sat: 1.0, sombra: 0.0, radio: 1.4, fx: 0.55, fy: 0.36, brasa: 0.0, calido: 0.5, ambiente: 1.0, tono: 0.85, escala: 1.00 }],
  [2.0, { luz: 1.0, sat: 1.0, sombra: 0.0, radio: 1.45, fx: 0.56, fy: 0.38, brasa: 0.0, calido: 0.5, ambiente: 1.0, tono: 0.8, escala: 1.00 }],
  [3.0, { luz: 0.85, sat: 0.62, sombra: 0.2, radio: 1.2, fx: 0.58, fy: 0.34, brasa: 0.0, calido: 0.3, ambiente: 0.62, tono: 0.2, escala: 1.00 }],
  [4.0, { luz: 0.6, sat: 0.3, sombra: 0.5, radio: 0.8, fx: 0.61, fy: 0.3, brasa: 0.0, calido: 0.1, ambiente: 0.28, tono: -0.25, escala: 1.00 }],
  [4.85, { luz: 0.3, sat: 0.05, sombra: 0.85, radio: 0.4, fx: CARA.x, fy: CARA.y, brasa: 0.0, calido: 0.0, ambiente: 0.05, tono: -0.45, escala: 1.00 }],
  [5.25, { luz: 0.0, sat: 0.0, sombra: 1.0, radio: 0.1, fx: CARA.x, fy: CARA.y, brasa: 0.5, calido: 0.0, ambiente: 0.0, tono: -0.45, escala: 1.00 }],
  [5.6, { luz: 0.0, sat: 0.0, sombra: 1.0, radio: 0.08, fx: 0.2, fy: 0.78, brasa: 1.0, calido: 1.0, ambiente: 0.0, tono: -0.45, escala: 0.93 }],
  [6.25, { luz: 0.0, sat: 0.0, sombra: 1.0, radio: 0.08, fx: 0.2, fy: 0.78, brasa: 1.0, calido: 1.0, ambiente: 0.0, tono: -0.45, escala: 0.93 }],
  [6.65, { luz: 0.35, sat: 0.2, sombra: 0.55, radio: 0.3, fx: CARA.x, fy: CARA.y, brasa: 0.5, calido: -0.2, ambiente: 0.2, tono: -0.55, escala: 0.95 }],
  [7.0, { luz: 1.0, sat: 0.9, sombra: 0.15, radio: 1.3, fx: CARA.x, fy: 0.2, brasa: 0.0, calido: -0.15, ambiente: 0.7, tono: -0.15, escala: 1.00 }],
  [7.65, { luz: 1.0, sat: 1.0, sombra: 0.05, radio: 1.65, fx: 0.58, fy: 0.34, brasa: 0.0, calido: 0.3, ambiente: 0.8, tono: 0.3, escala: 1.00 }],
];

const CLAVES = Object.keys(K[0][1]) as (keyof Estado)[];

const suave = (t: number) => t * t * (3 - 2 * t);

export function estadoEn(u: number): Estado {
  if (u <= K[0][0]) return { ...K[0][1] };
  const ult = K[K.length - 1];
  if (u >= ult[0]) return { ...ult[1] };
  let i = 0;
  while (i < K.length - 2 && u > K[i + 1][0]) i++;
  const [u0, a] = K[i];
  const [u1, b] = K[i + 1];
  const t = suave((u - u0) / (u1 - u0));
  const out = { ...a };
  for (const k of CLAVES) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

/** Acerca `act` a `obj` con constante de tiempo `tau` (s). Devuelve true si aún se mueve. */
export function acercar(act: Estado, obj: Estado, dt: number, tau: number): boolean {
  const f = 1 - Math.exp(-dt / tau);
  let mueve = false;
  for (const k of CLAVES) {
    const d = obj[k] - act[k];
    if (Math.abs(d) > 0.0005) {
      act[k] += d * f;
      mueve = true;
    } else act[k] = obj[k];
  }
  return mueve;
}
