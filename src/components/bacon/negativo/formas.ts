/**
 * «El negativo del cuerpo»: geometría de la figura y de sus fragmentos.
 *
 * La figura no existe en ningún plano. Se define en el espacio del MURO (unidades de figura: x en -0,5..0,5, y hacia abajo
 * de 0 a ~1,05) como la unión de tres grupos de fragmentos; cada grupo se cuelga en un plano distinto, a otra distancia de la
 * lámpara. Solo cuando los tres planos están en su sitio sus sombras se superponen y el muro muestra el cuerpo entero.
 * Formas originales de MANIFESTO: no reproducen la composición de Bacon.
 */

export type P = [number, number];
/** Un contorno cerrado. `hueco`: se resta (relleno par-impar) del fragmento al que acompaña. */
export type Contorno = { pts: P[]; hueco?: boolean };

/** Generador pseudoaleatorio con semilla (mulberry32): la figura es la misma en cada visita. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ruido periódico 1D (suma de senos con fases al azar) para bordes orgánicos. */
function ondas(r: () => number, n = 5): (t: number) => number {
  const c = Array.from({ length: n }, (_, i) => ({ k: i + 2, a: r() / (i + 1.4), f: r() * Math.PI * 2 }));
  return (t) => c.reduce((s, o) => s + o.a * Math.sin(o.k * t + o.f), 0);
}

/** Masa blanda: una elipse deformada con bordes irregulares. */
export function mancha(cx: number, cy: number, rx: number, ry: number, rot: number, aspereza: number, seed: number, n = 64): P[] {
  const r = rng(seed);
  const f = ondas(r);
  const g = ondas(r, 3);
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + aspereza * (0.9 * f(t) + 0.35 * g(t * 3.1));
    const x = Math.cos(t) * rx * k, y = Math.sin(t) * ry * k;
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return pts;
}

/** Trazo de materia a lo largo de una curva (a → b, control c), con grosor variable, bordes irregulares y extremos romos. */
export function trazo(a: P, c: P, b: P, w0: number, w1: number, aspereza: number, seed: number, n = 44): P[] {
  const r = rng(seed);
  const f1 = ondas(r), f2 = ondas(r);
  const izq: P[] = [], der: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0];
    const y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
    const dx = 2 * u * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
    const dy = 2 * u * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    const rom = Math.sqrt(Math.min(1, Math.min(t, 1 - t) * 9)) * 0.85 + 0.15;
    const w = ((w0 + (w1 - w0) * t) / 2) * rom;
    const e1 = 1 + aspereza * f1(t * 7), e2 = 1 + aspereza * f2(t * 7);
    izq.push([x + nx * w * e1, y + ny * w * e1]);
    der.push([x - nx * w * e2, y - ny * w * e2]);
  }
  return [...izq, ...der.reverse()];
}

/** Un fragmento: un contorno exterior y, opcionalmente, huecos dentro de él. */
export type Fragmento = Contorno[];

/**
 * Los tres grupos de fragmentos, del plano delantero (0) al trasero (2).
 * Delantero: el travesaño, los hombros y lo que cuelga de los extremos.
 * Medio: el torso con su desgarro y la cuerda.
 * Trasero: el madero vertical y la masa que se descuelga abajo.
 * Cada plano lleva además un señuelo: un trozo que, alineado, cae dentro de la figura y, desalineado, la enturbia.
 */
export function figura(): Fragmento[][] {
  // Delantero: un travesaño ROTO. El tramo izquierdo sube, el derecho se vence por el peso y se deshilacha;
  // un solo hombro, cargado; una cuerda tensa sale del extremo derecho hacia arriba (como la cuerda lateral de la Instalación I).
  const delantero: Fragmento[] = [
    [{ pts: trazo([-0.5, 0.2], [-0.33, 0.215], [-0.13, 0.245], 0.05, 0.068, 0.26, 11) }],
    [{ pts: trazo([-0.07, 0.235], [0.22, 0.2], [0.46, 0.36], 0.078, 0.044, 0.24, 12) }],
    [{ pts: mancha(0.15, 0.232, 0.11, 0.07, 0.45, 0.32, 13) }],
    [{ pts: trazo([0.44, 0.34], [0.47, 0.42], [0.43, 0.5], 0.026, 0.008, 0.45, 14) }],
    [{ pts: trazo([0.4, 0.33], [0.39, 0.39], [0.405, 0.46], 0.018, 0.006, 0.45, 16) }],
    [{ pts: trazo([0.455, 0.33], [0.53, 0.15], [0.62, -0.06], 0.009, 0.006, 0.05, 17) }],
    [{ pts: mancha(0.03, 0.47, 0.045, 0.07, 0.2, 0.3, 15) }],
  ];
  // Medio: el torso, retorcido y desplazado, con un vacío en el centro (la luz pasa por donde debería estar el cuerpo)
  const medio: Fragmento[] = [
    [
      { pts: mancha(0.035, 0.42, 0.16, 0.25, 0.22, 0.24, 21) },
      { pts: mancha(0.05, 0.43, 0.05, 0.13, 0.32, 0.45, 23), hueco: true },
      { pts: trazo([-0.09, 0.3], [-0.06, 0.315], [-0.03, 0.34], 0.016, 0.008, 0.3, 26), hueco: true },
      { pts: trazo([-0.1, 0.37], [-0.07, 0.385], [-0.04, 0.41], 0.014, 0.007, 0.3, 27), hueco: true },
    ],
    [{ pts: mancha(-0.045, 0.26, 0.12, 0.085, -0.35, 0.3, 22) }],
    [{ pts: trazo([0.01, -0.04], [-0.01, 0.07], [0.02, 0.17], 0.011, 0.02, 0.15, 24) }],
    [{ pts: mancha(0.02, 0.165, 0.032, 0.022, 0.5, 0.4, 29) }],
    [{ pts: mancha(-0.36, 0.21, 0.05, 0.03, 0.1, 0.3, 25) }],
  ];
  // Trasero: un madero partido (no llega a tocarse) y una masa que se descuelga hacia un lado, con un hilo que cae
  const trasero: Fragmento[] = [
    [{ pts: trazo([-0.005, -0.08], [0.01, 0.2], [0.012, 0.47], 0.034, 0.03, 0.14, 31) }],
    [{ pts: trazo([0.03, 0.55], [0.035, 0.8], [0.02, 1.05], 0.03, 0.026, 0.14, 36) }],
    [{ pts: mancha(0.09, 0.72, 0.19, 0.14, 0.42, 0.28, 32) }],
    [{ pts: mancha(0.16, 0.87, 0.07, 0.1, 0.25, 0.35, 33) }],
    [{ pts: trazo([0.17, 0.94], [0.15, 1.0], [0.18, 1.06], 0.012, 0.005, 0.3, 37) }],
    [{ pts: mancha(0.31, 0.23, 0.05, 0.03, 0.2, 0.3, 34) }],
    [{ pts: mancha(-0.03, 0.6, 0.04, 0.05, 0.4, 0.3, 35) }],
  ];
  return [delantero, medio, trasero];
}

/** La figura completa como trazados SVG (unidades de figura), para el epílogo. */
export function figuraSvg(): string[] {
  const d = (pts: P[]) => "M" + pts.map(([x, y]) => `${x.toFixed(4)} ${y.toFixed(4)}`).join("L") + "Z";
  return figura().flat().map((frag) => frag.map((c) => d(c.pts)).join(""));
}
