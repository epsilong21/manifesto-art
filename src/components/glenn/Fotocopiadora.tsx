"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { LIENZO_GLENN, ZONAS_GLENN } from "@/content/glenn";
import { generarGL, type Pasada } from "./copiaGL";
import { hojasMuro } from "./MuroHojas";

/**
 * Fotocopiadora de MANIFESTO sin la pintura: copia el muro de hojas propio
 * (MuroHojas), no la obra. Cada pasada parte de la copia anterior y la degrada
 * como una fotocopiadora: un poco de escala y giro, el tóner que se corre, el
 * contraste que se come los grises, motas, la sombra de la tapa y una raya del
 * tambor. Es una simulación en pantalla, calculada en el navegador: en la GPU
 * (copiaGL.ts, WebGL2) y, si no hay WebGL2, en Canvas 2D (`generar`).
 */

const W = 720;
const H = Math.round((W * LIENZO_GLENN.h) / LIENZO_GLENN.w);
/** Generaciones de copia después del original. */
export const MAX_COPIAS = 7;
const DURACION = 1300;
const PAPEL = [234, 230, 219];
const TONER = [17, 17, 16];

type Generacion = { gris: Float32Array; grises: number; mini: string };

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

/** El original (G0): el muro de MuroHojas dibujado en grises, con sus datos en tipografía de máquina. */
function dibujarOriginal(fuente: string): Float32Array {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgb(70 70 66)";
  ctx.fillRect(0, 0, W, H);
  const tinta = "rgb(22 22 21)";
  for (const h of hojasMuro()) {
    const w = h.w * W;
    const hh = h.h * H;
    const tono = Math.round((h.hueco ? h.tono * 0.42 : h.tono) * 255);
    ctx.save();
    ctx.translate((h.x + h.w / 2) * W, (h.y + h.h / 2) * H);
    ctx.rotate((h.giro * Math.PI) / 180);
    ctx.shadowColor = "rgb(0 0 0 / 0.45)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = `rgb(${tono} ${tono} ${tono - 6})`;
    ctx.fillRect(-w / 2, -hh / 2, w, hh);
    ctx.shadowColor = "transparent";
    ctx.fillStyle = tinta;
    ctx.strokeStyle = tinta;
    if (h.tipo === "dato") {
      ctx.font = `600 ${Math.round(hh * 0.15)}px ${fuente}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(h.texto, 0, 0, w * 0.86);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w * 0.38, hh * 0.22);
      ctx.lineTo(w * 0.38, hh * 0.22);
      ctx.stroke();
    } else if (h.tipo === "numero") {
      ctx.font = `700 ${Math.round(hh * 0.55)}px ${fuente}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(h.i + 1).padStart(2, "0"), 0, hh * 0.04);
    } else if (h.tipo === "trama") {
      // Trama de medios tonos en degradado: la reserva de grises que la copia se come
      const paso = 5;
      for (let y = -hh / 2 + paso; y < hh / 2; y += paso) {
        for (let x = -w / 2 + paso; x < w / 2; x += paso) {
          const t = (x + w / 2) / w;
          ctx.beginPath();
          ctx.arc(x, y, paso * 0.5 * (0.15 + 0.8 * t), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (h.tipo === "regla") {
      ctx.lineWidth = 1;
      for (let y = -hh / 2 + hh / 7; y < hh / 2; y += hh / 7) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, y);
        ctx.lineTo(w / 2 - 4, y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -hh / 2);
      ctx.lineTo(-w * 0.3, hh / 2);
      ctx.stroke();
    } else {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, hh * 0.14, 0, Math.PI * 2);
      ctx.moveTo(-hh * 0.32, 0);
      ctx.lineTo(hh * 0.32, 0);
      ctx.moveTo(0, -hh * 0.32);
      ctx.lineTo(0, hh * 0.32);
      ctx.stroke();
    }
    if (h.esquina) {
      // Esquina doblada: un triángulo más claro
      const sx = h.esquina === 1 || h.esquina === 4 ? -1 : 1;
      const sy = h.esquina <= 2 ? -1 : 1;
      const k = Math.min(w, hh) * 0.22;
      ctx.fillStyle = `rgb(${Math.min(255, tono + 24)} ${Math.min(255, tono + 24)} ${Math.min(255, tono + 18)})`;
      ctx.beginPath();
      ctx.moveTo((sx * w) / 2, (sy * hh) / 2 - sy * k);
      ctx.lineTo((sx * w) / 2 - sx * k, (sy * hh) / 2);
      ctx.lineTo((sx * w) / 2 - sx * k, (sy * hh) / 2 - sy * k);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  // Hueco de la máscara: sombra hacia dentro y contorno discontinuo
  const m = ZONAS_GLENN.mascara;
  ctx.save();
  ctx.translate(m.cx * W, m.cy * H);
  ctx.scale(m.rx * W, m.ry * H);
  const g = ctx.createRadialGradient(0, 0, 0.2, 0, 0, 1);
  g.addColorStop(0, "rgb(0 0 0 / 0.15)");
  g.addColorStop(1, "rgb(0 0 0 / 0.55)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = "rgb(235 235 230)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(m.cx * W, m.cy * H, m.rx * W, m.ry * H, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "rgb(240 240 236)";
  ctx.font = `600 15px ${fuente}`;
  ctx.textAlign = "center";
  ctx.fillText("MÁSCARA · ZONA APROX.", m.cx * W, m.cy * H);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgb(20 20 19)";
  ctx.fillRect(10, H - 34, 384, 24);
  ctx.fillStyle = "rgb(240 240 236)";
  ctx.font = `500 13px ${fuente}`;
  ctx.fillText("ESQUEMA DE MANIFESTO — NO ES LA PINTURA", 18, H - 17);

  const d = ctx.getImageData(0, 0, W, H).data;
  const gris = new Float32Array(W * H);
  for (let i = 0; i < gris.length; i++) gris[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
  return gris;
}

/** Cómo queda el original en el cristal en la pasada `k` (igual en la GPU y en Canvas 2D). */
function pasada(k: number): Pasada & { r: () => number } {
  const r = azar(7919 * k + 13);
  // El original nunca queda recto sobre el cristal: escala, giro y desplazamiento
  return { s: 1.005, a: (r() - 0.5) * 0.005, ox: 0.5 + r() * 1.2, oy: (r() - 0.5) * 1.4, semilla: r(), r };
}

/** Una pasada por la fotocopiadora: la copia `k` hecha a partir de `prev`, en la GPU si se puede. */
function fotocopiar(prev: Float32Array, k: number): Float32Array {
  return generarGL(prev, W, H, pasada(k)) ?? generar(prev, k);
}

/** La misma pasada en Canvas 2D (CPU), si no hay WebGL2. */
function generar(prev: Float32Array, k: number): Float32Array {
  const { s, a, ox, oy, r } = pasada(k);
  const out = new Float32Array(W * H);
  // 1. Escala, giro y desplazamiento
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const cx = W / 2;
  const cy = H / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const u = (cos * dx + sin * dy) / s + cx - ox;
      const v = (-sin * dx + cos * dy) / s + cy - oy;
      const x0 = Math.floor(u);
      const y0 = Math.floor(v);
      if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) {
        out[y * W + x] = 1;
        continue;
      }
      const fx = u - x0;
      const fy = v - y0;
      const i = y0 * W + x0;
      out[y * W + x] = (prev[i] * (1 - fx) + prev[i + 1] * fx) * (1 - fy) + (prev[i + W] * (1 - fx) + prev[i + W + 1] * fx) * fy;
    }
  }
  // 2. El tóner se corre: desenfoque 1-2-1 en los dos ejes
  const tmp = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      tmp[i] = (out[i - 1] + 2 * out[i] + out[i + 1]) / 4;
    }
    tmp[y * W] = out[y * W];
    tmp[y * W + W - 1] = out[y * W + W - 1];
  }
  for (let y = 1; y < H - 1; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      out[i] = (tmp[i - W] + 2 * tmp[i] + tmp[i + W]) / 4;
    }
  }
  // 3. Contraste: los grises se van al negro o al blanco; 4. motas, sombra de la tapa y raya del tambor
  const g = 5.2;
  const f = (v: number) => 1 / (1 + Math.exp(-g * (v - 0.53)));
  const f0 = f(0);
  const f1 = f(1);
  const raya = Math.round(W * 0.31);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = (f(out[i]) - f0) / (f1 - f0);
      v += (r() - 0.5) * 0.06;
      const q = r();
      if (q < 0.0016) v *= 0.15;
      else if (q > 0.9988) v = Math.min(1, v + 0.55);
      v *= 1 - 0.32 * Math.exp(-x / 9);
      if (x === raya || x === raya + 1) v *= 0.82;
      out[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  return out;
}

/** Parte de la imagen que todavía es gris (ni papel ni tóner). */
function grisesDe(g: Float32Array) {
  let n = 0;
  for (let i = 0; i < g.length; i++) if (g[i] > 0.14 && g[i] < 0.86) n++;
  return n / g.length;
}

function pintar(c: HTMLCanvasElement | null, g: Float32Array) {
  if (!c) return;
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let i = 0; i < g.length; i++) {
    const v = g[i];
    d[i * 4] = TONER[0] + (PAPEL[0] - TONER[0]) * v;
    d[i * 4 + 1] = TONER[1] + (PAPEL[1] - TONER[1]) * v;
    d[i * 4 + 2] = TONER[2] + (PAPEL[2] - TONER[2]) * v;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function miniatura(g: Float32Array) {
  const c = document.createElement("canvas");
  pintar(c, g);
  const m = document.createElement("canvas");
  m.width = 160;
  m.height = Math.round((160 * H) / W);
  m.getContext("2d")!.drawImage(c, 0, 0, m.width, m.height);
  return m.toDataURL("image/jpeg", 0.72);
}

const generacion = (gris: Float32Array): Generacion => ({ gris, grises: grisesDe(gris), mini: miniatura(gris) });

export type Copiadora = ReturnType<typeof useCopiadora>;

/**
 * Estado de la fotocopiadora. Se reparte entre el visor (CopiaLienzo) y el panel
 * (CopiaMandos) de la mesa de luz. `activa`: solo prepara el original cuando se usa.
 */
export function useCopiadora(activa: boolean) {
  const [gens, setGens] = useState<Generacion[]>([]);
  /** La copia siguiente, ya calculada, que la luz descubre a su paso. */
  const [siguiente, setSiguiente] = useState<Float32Array | null>(null);
  const [vista, setVista] = useState(0);
  const [avance, setAvance] = useState(0);
  const [copiando, setCopiando] = useState(false);
  const anim = useRef(0);

  useEffect(() => {
    if (!activa || gens.length) return;
    let vivo = true;
    document.fonts.ready.then(() => {
      if (!vivo) return;
      const raiz = document.querySelector(".theme-glenn") ?? document.body;
      const fuente = getComputedStyle(raiz).getPropertyValue("--font-plexmono").trim() || "monospace";
      setGens([generacion(dibujarOriginal(fuente))]);
      setVista(0);
    });
    return () => {
      vivo = false;
    };
  }, [activa, gens.length]);

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const lleno = gens.length > MAX_COPIAS;

  /** Calcula la copia siguiente (una vez) y la deja lista bajo la luz. */
  const preparar = useCallback((): Float32Array | null => {
    const ultima = gens.at(-1);
    if (!ultima || gens.length > MAX_COPIAS) return null;
    const g = siguiente ?? fotocopiar(ultima.gris, gens.length);
    setSiguiente(g);
    setVista(gens.length - 1);
    return g;
  }, [gens, siguiente]);

  const confirmar = useCallback((g: Float32Array) => {
    const nueva = generacion(g);
    setGens((prev) => {
      setVista(prev.length);
      return [...prev, nueva];
    });
    setSiguiente(null);
    setAvance(0);
    setCopiando(false);
  }, []);

  /** Lleva la luz de `desde` a `hasta` y, si llega al final, guarda la copia `g`. */
  const animar = useCallback(
    (desde: number, hasta: number, g: Float32Array) => {
      cancelAnimationFrame(anim.current);
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (hasta === 1) confirmar(g);
        else setAvance(0);
        return;
      }
      setCopiando(true);
      const t0 = performance.now();
      const dur = DURACION * Math.abs(hasta - desde);
      const paso = (t: number) => {
        const k = Math.min(1, (t - t0) / Math.max(1, dur));
        const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
        setAvance(desde + (hasta - desde) * e);
        if (k < 1) anim.current = requestAnimationFrame(paso);
        else if (hasta === 1) confirmar(g);
        else setCopiando(false);
      };
      anim.current = requestAnimationFrame(paso);
    },
    [confirmar],
  );

  const copiar = useCallback(() => {
    if (copiando) return;
    const g = preparar();
    if (g) animar(avance, 1, g);
  }, [animar, avance, copiando, preparar]);

  const reiniciar = useCallback(() => {
    cancelAnimationFrame(anim.current);
    setGens((prev) => prev.slice(0, 1));
    setSiguiente(null);
    setVista(0);
    setAvance(0);
    setCopiando(false);
  }, []);

  return { gens, siguiente, vista, setVista, avance, setAvance, copiando, lleno, preparar, animar, copiar, reiniciar };
}

/** El cristal de la fotocopiadora, dentro del visor: la copia actual, la luz y la copia nueva a su paso. */
export function CopiaLienzo({ c }: { c: Copiadora }) {
  const base = useRef<HTMLCanvasElement>(null);
  const nueva = useRef<HTMLCanvasElement>(null);
  const arrastre = useRef<{ id: number; g: Float32Array } | null>(null);
  const actual = c.gens[c.vista];

  useEffect(() => {
    if (actual) pintar(base.current, actual.gris);
  }, [actual]);
  useEffect(() => {
    if (c.siguiente) pintar(nueva.current, c.siguiente);
  }, [c.siguiente]);

  const fraccion = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.parentElement!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  const abajo = (e: PointerEvent<HTMLButtonElement>) => {
    if (c.copiando) return;
    const g = c.preparar();
    if (!g) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { id: e.pointerId, g };
  };
  const mover = (e: PointerEvent<HTMLButtonElement>) => {
    if (arrastre.current?.id !== e.pointerId) return;
    c.setAvance(fraccion(e));
  };
  const arriba = (e: PointerEvent<HTMLButtonElement>) => {
    const a = arrastre.current;
    if (a?.id !== e.pointerId) return;
    arrastre.current = null;
    // Pasada casi completa: se termina la copia; si no, la luz vuelve
    if (c.avance > 0.8) c.animar(c.avance, 1, a.g);
    else if (c.avance > 0.02) c.animar(c.avance, 0, a.g);
  };
  const teclas = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      c.copiar();
    }
  };
  return (
    <div className="gl-copiadora" data-copiando={c.copiando || c.avance > 0 ? "" : undefined}>
      <canvas ref={base} className="gl-copiadora__lienzo" aria-hidden="true" />
      <canvas
        ref={nueva}
        className="gl-copiadora__lienzo"
        style={{ clipPath: `inset(0 ${(1 - c.avance) * 100}% 0 0)`, visibility: c.avance > 0 ? "visible" : "hidden" }}
        aria-hidden="true"
      />
      <div className="gl-copiadora__luz" style={{ left: `${c.avance * 100}%` }} aria-hidden="true" />
      <button
        type="button"
        className="gl-copiadora__asa"
        style={{ left: `${c.avance * 100}%` }}
        disabled={c.lleno || !actual}
        aria-label={c.lleno ? "La fotocopiadora ha llegado a la última generación" : `Hacer la copia G${c.gens.length}: arrastra la luz hasta el final, o pulsa Intro`}
        onPointerDown={abajo}
        onPointerMove={mover}
        onPointerUp={arriba}
        onPointerCancel={arriba}
        onKeyDown={teclas}
      >
        <span aria-hidden="true">⟷</span>
      </button>
      <p className="gl-copiadora__gen" aria-hidden="true">
        {c.vista === 0 ? "Original · G0" : `Copia de copia · G${c.vista}`}
      </p>
    </div>
  );
}

/** Mandos del panel: copiar, volver al original, la tira de generaciones y lo que se ha perdido. */
export function CopiaMandos({ c }: { c: Copiadora }) {
  const { gens } = c;
  const actual = gens[c.vista];
  const original = gens[0];
  return (
    <div className="gl-copiar">
      <div className="gl-botonera">
        <button type="button" className="gl-btn" onClick={c.copiar} disabled={c.lleno || c.copiando || !original}>
          {gens.length <= 1 ? "Hacer una copia" : "Copiar la copia"}
        </button>
        <button type="button" className="gl-btn gl-btn--linea" onClick={c.reiniciar} disabled={gens.length <= 1 || c.copiando}>
          Volver al original
        </button>
      </div>
      {actual && original ? (
        <div className="gl-perdida" aria-live="polite">
          <p className="gl-perdida__cifra">
            <span>{Math.round(actual.grises * 100)} %</span> de grises
          </p>
          <div className="gl-perdida__barra" aria-hidden="true">
            <span style={{ width: `${(actual.grises / original.grises) * 100}%` }} />
          </div>
          <p className="gl-perdida__pie">
            {c.vista === 0
              ? `Original: el ${Math.round(original.grises * 100)} % de la imagen es gris.`
              : `G${c.vista}: queda el ${Math.round((actual.grises / original.grises) * 100)} % de los grises del original.`}
            {c.lleno ? " Última generación." : ""}
          </p>
        </div>
      ) : null}
      {gens.length > 1 ? (
        <ol className="gl-generaciones" aria-label="Generaciones de copia">
          {gens.map((g, i) => (
            <li key={i}>
              <button type="button" aria-pressed={c.vista === i} onClick={() => c.setVista(i)} disabled={c.copiando}>
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatura generada en el navegador (data: URL) */}
                <img src={g.mini} alt={`Generación ${i}`} width={72} height={Math.round((72 * H) / W)} />
                <span aria-hidden="true">G{i}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
