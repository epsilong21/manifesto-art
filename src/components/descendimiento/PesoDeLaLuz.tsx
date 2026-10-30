"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DESC_IMG as I, DIAGONAL, LUZ, MANOS, MEDIDAS } from "@/content/descendimiento";
import { rutaPublica } from "@/lib/rutaPublica";

const SRC = `${rutaPublica(I.base)}-${I.anchos[1]}.webp`;
const ACTOS = ["La diagonal", "Las manos", "El claroscuro"] as const;
const ROMANOS = ["I", "II", "III"];
const N = DIAGONAL.length - 1;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Lecturas del tercer momento: la luz sin filtro y las tres lecturas tonales. */
const LECTURAS = [{ id: "natural", titulo: "Luz", filtro: "none" }, ...LUZ];

/** El recorrido en el espacio del SVG (100 × 136): la misma curva Catmull-Rom que sigue la luz. */
const VB_H = I.ratio * 100;
const RUTA = (() => {
  const q = DIAGONAL.map((p) => [p.x * 100, p.y * VB_H]);
  let d = `M${q[0][0].toFixed(2)},${q[0][1].toFixed(2)}`;
  for (let k = 0; k < q.length - 1; k++) {
    const a = q[Math.max(0, k - 1)], b = q[k], c = q[k + 1], e = q[Math.min(q.length - 1, k + 2)];
    d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(2)},${(b[1] + (c[1] - a[1]) / 6).toFixed(2)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(2)},${(c[1] - (e[1] - b[1]) / 6).toFixed(2)} ${c[0].toFixed(2)},${c[1].toFixed(2)}`;
  }
  return d;
})();

/** Punto de la diagonal (fracciones de la imagen) para s ∈ [0, 1]. */
function curva(s: number): [number, number] {
  const u = Math.min(N - 1e-6, Math.max(0, s * N));
  const k = Math.floor(u), f = u - k;
  const P = (j: number) => DIAGONAL[Math.min(N, Math.max(0, j))];
  const a = P(k - 1), b = P(k), c = P(k + 1), d = P(k + 2);
  const cr = (p0: number, p1: number, p2: number, p3: number) =>
    0.5 * (2 * p1 + (p2 - p0) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (3 * p1 - p0 - 3 * p2 + p3) * f * f * f);
  return [cr(a.x, b.x, c.x, d.x), cr(a.y, b.y, c.y, d.y)];
}

/** Fracción de longitud de la curva recorrida en s: el trazo del SVG avanza a la par que la luz. */
const ARCO = (() => {
  const n = 200, acc = [0];
  let prev = curva(0);
  for (let k = 1; k <= n; k++) {
    const q = curva(k / n);
    acc.push(acc[k - 1] + Math.hypot(q[0] - prev[0], (q[1] - prev[1]) * I.ratio));
    prev = q;
  }
  return acc.map((v) => v / acc[n]);
})();
const arco = (s: number) => {
  const u = clamp(s, 0, 1) * (ARCO.length - 1), k = Math.floor(u);
  return k >= ARCO.length - 1 ? 1 : ARCO[k] + (ARCO[k + 1] - ARCO[k]) * (u - k);
};

type Cam = { x: number; y: number; z: number };
/** En la diagonal la cámara se acerca a media bajada y se aleja al llegar a tierra. */
function camDiagonal(t: number): Cam {
  const [x, y] = curva(t);
  const g = Math.pow(Math.sin(Math.PI * t), 0.8);
  return { x: 0.5 + (x - 0.5) * g, y: 0.5 + (y - 0.5) * g, z: 1 + 0.75 * g };
}
const TODO: Cam = { x: 0.5, y: 0.5, z: 1 };

/**
 * «El peso de la luz»: el panel en penumbra y una luz dirigida que lo recorre en tres momentos.
 * La cámara son transformaciones CSS sobre una copia de la reproducción; la penumbra es un canvas
 * 2D a media resolución encima (negro con huecos de luz), y la lente del claroscuro, otra copia
 * con filtro recortada en círculo. Nada pinta sobre la reproducción: «Sin efectos» lo retira todo.
 * Solo hay bucle mientras algo se mueve; con movimiento reducido, cada cambio es un corte.
 */
export function PesoDeLaLuz() {
  const [acto, setActo] = useState(0);
  const [estacion, setEstacion] = useState(0);
  const [mano, setMano] = useState<number | null>(null);
  const [lectura, setLectura] = useState(0);
  const [limpio, setLimpio] = useState(false);

  const vista = useRef<HTMLDivElement>(null);
  const encuadre = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const velo = useRef<HTMLCanvasElement>(null);
  const lente = useRef<HTMLDivElement>(null);
  const lenteImg = useRef<HTMLImageElement>(null);
  const viva = useRef<SVGPathElement>(null);
  const asa = useRef<HTMLSpanElement>(null);
  const lleno = useRef<HTMLSpanElement>(null);
  const arrastre = useRef(false);
  const motor = useRef<{ sincronizar: () => void; despertar: () => void } | null>(null);
  const m = useRef({
    w: 0, h: 0, ex: 0, ey: 0, bw: 0, bh: 0, ox: 0, oy: 0, zw: 0, zh: 0,
    cam: { ...TODO }, camM: { ...TODO },
    t: 0, tM: 0,
    osc: 1, oscM: 0.88,
    foco: { x: 0.55, y: 0.42, r: 0 }, focoM: { x: 0.55, y: 0.42, r: 0 },
    cortina: 0, acto: 0, actoVis: 0, mano: null as number | null, lectura: 0, lecturaFoco: 0, limpio: false,
    quieto: false, visible: false, raf: 0, ultimo: 0,
  });

  useEffect(() => {
    const s = m.current;
    const cv = velo.current!, vi = vista.current!, en = encuadre.current!;
    const ctx = cv.getContext("2d");
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    s.quieto = mq.matches;
    const RES = 0.5;

    const objetivos = () => {
      if (s.acto === 0) {
        s.oscM = 0.84;
        s.camM = camDiagonal(s.tM);
      } else if (s.acto === 1) {
        const p = s.mano === null ? null : MANOS[s.mano];
        s.camM = p ? { x: p.x, y: p.y, z: p.zoom } : { ...TODO };
        s.oscM = p ? 0.84 : 0.5;
        s.focoM = p ? { x: p.x, y: p.y, r: 0.18 } : { ...s.focoM, r: 0 };
      } else {
        s.camM = { ...TODO };
        s.oscM = 0.9;
        const l = LUZ[s.lectura - 1];
        if (l && s.lectura !== s.lecturaFoco) s.focoM = { x: l.x, y: l.y, r: 1 };
        else s.focoM.r = 1;
        s.lecturaFoco = s.lectura;
      }
      if (s.limpio) s.camM = { ...TODO };
    };

    const pintar = () => {
      const zw = s.bw * s.cam.z, zh = s.bh * s.cam.z;
      let ox = s.ex - s.cam.x * zw, oy = s.ey - s.cam.y * zh;
      ox = zw >= s.w ? clamp(ox, s.w - zw, 0) : clamp(ox, 0, s.w - zw);
      oy = zh >= s.h ? clamp(oy, s.h - zh, 0) : clamp(oy, 0, s.h - zh);
      Object.assign(s, { ox, oy, zw, zh });
      const tr = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) scale(${s.cam.z.toFixed(4)})`;
      lienzo.current!.style.transform = tr;
      capa.current!.style.transform = tr;
      capa.current!.style.setProperty("--z", s.cam.z.toFixed(3));
      viva.current?.style.setProperty("stroke-dashoffset", String(1 - arco(s.t)));
      if (asa.current) asa.current.style.left = `${s.t * 100}%`;
      if (lleno.current) lleno.current.style.transform = `scaleX(${s.t})`;

      // Linterna: radio en píxeles de pantalla, ni diminuto en móvil ni enorme en escritorio
      const R = clamp(s.bw * 0.2, 70, 150);
      const fx = ox + s.foco.x * zw, fy = oy + s.foco.y * zh;
      const lt = lente.current!, li = lenteImg.current!;
      const conLente = s.actoVis === 2 && s.lectura > 0 && !s.limpio;
      lt.style.opacity = conLente ? String(1 - s.cortina) : "0";
      if (conLente) {
        lt.style.width = lt.style.height = `${2 * R}px`;
        lt.style.transform = `translate3d(${(fx - R).toFixed(1)}px, ${(fy - R).toFixed(1)}px, 0)`;
        li.style.width = `${zw}px`;
        li.style.height = `${zh}px`;
        li.style.transform = `translate3d(${(ox - fx + R).toFixed(1)}px, ${(oy - fy + R).toFixed(1)}px, 0)`;
      }

      if (!ctx) return;
      ctx.setTransform(RES, 0, 0, RES, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, s.w, s.h);
      if (s.limpio) return;
      const a = Math.min(1, s.osc + s.cortina * (1 - s.osc));
      ctx.fillStyle = `rgba(7, 4, 3, ${a.toFixed(3)})`;
      ctx.fillRect(0, 0, s.w, s.h);
      const vis = 1 - s.cortina;
      if (vis < 0.01) return;
      ctx.globalCompositeOperation = "destination-out";
      const luz = (x: number, y: number, r: number, al: number) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(0,0,0,${al})`);
        g.addColorStop(0.3, `rgba(0,0,0,${al * 0.85})`);
        g.addColorStop(0.65, `rgba(0,0,0,${al * 0.35})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      };
      if (s.actoVis === 0) {
        // La estela: la diagonal recorrida queda en media luz; la cabeza, en luz plena
        for (let u = 0; u < s.t; u += 0.04) {
          const [x, y] = curva(u);
          luz(ox + x * zw, oy + y * zh, 0.13 * zw, 0.36 * vis);
        }
        const [x, y] = curva(s.t);
        luz(ox + x * zw, oy + y * zh, 0.23 * zw, vis);
      } else if (s.actoVis === 1) {
        if (s.foco.r > 0.002) luz(fx, fy, s.foco.r * zw, vis);
      } else {
        luz(fx, fy, R * s.foco.r * 1.45, vis);
      }
    };

    const paso = (ahora: number) => {
      s.raf = 0;
      const dt = s.ultimo ? Math.min(0.1, (ahora - s.ultimo) / 1000) : 1 / 60;
      s.ultimo = ahora;
      const k = s.quieto ? 1 : 1 - Math.exp(-dt * 3);
      const kf = s.quieto ? 1 : 1 - Math.exp(-dt * 16);
      let mov = 0;
      const ir = (a: number, b: number, kk: number) => {
        const d = b - a;
        if (Math.abs(d) < 1e-4) return b;
        mov = Math.max(mov, Math.abs(d));
        return a + d * kk;
      };

      // Cambio de momento: fundido a negro, corte de cámara y fundido de vuelta
      if (s.actoVis !== s.acto) {
        s.cortina = s.quieto ? 1 : ir(s.cortina, 1, 1 - Math.exp(-dt * 9));
        if (s.cortina > 0.97) {
          s.actoVis = s.acto;
          s.cam = { ...s.camM };
          s.foco = { ...s.focoM };
          if (s.quieto) s.cortina = 0;
        }
        mov = Math.max(mov, 1);
      } else {
        s.cortina = ir(s.cortina, 0, 1 - Math.exp(-dt * 2.4));
      }

      s.t = ir(s.t, s.tM, s.quieto ? 1 : 1 - Math.exp(-dt * 4));
      if (s.acto === 0 && !s.limpio) s.camM = camDiagonal(s.t);
      s.cam.x = ir(s.cam.x, s.camM.x, k);
      s.cam.y = ir(s.cam.y, s.camM.y, k);
      s.cam.z = ir(s.cam.z, s.camM.z, k);
      s.osc = ir(s.osc, s.oscM, s.quieto ? 1 : 1 - Math.exp(-dt * 1.6));
      const kp = s.acto === 2 ? kf : k;
      s.foco.x = ir(s.foco.x, s.focoM.x, kp);
      s.foco.y = ir(s.foco.y, s.focoM.y, kp);
      s.foco.r = ir(s.foco.r, s.focoM.r, k);
      pintar();
      if (mov > 0 && s.visible) s.raf = requestAnimationFrame(paso);
    };

    const despertar = () => {
      if (s.raf || !s.visible) return;
      s.ultimo = 0;
      s.raf = requestAnimationFrame(paso);
    };

    const medir = () => {
      const rv = vi.getBoundingClientRect(), re = en.getBoundingClientRect();
      s.w = rv.width;
      s.h = rv.height;
      s.bw = Math.min(re.width, re.height / I.ratio);
      s.bh = s.bw * I.ratio;
      s.ex = re.left - rv.left + re.width / 2;
      s.ey = re.top - rv.top + re.height / 2;
      for (const el of [lienzo.current!, capa.current!]) {
        el.style.width = `${s.bw}px`;
        el.style.height = `${s.bh}px`;
      }
      cv.width = Math.max(1, Math.round(s.w * RES));
      cv.height = Math.max(1, Math.round(s.h * RES));
      pintar();
    };

    motor.current = {
      sincronizar: () => {
        objetivos();
        despertar();
      },
      despertar,
    };
    objetivos();
    s.cam = { ...s.camM };
    medir();

    const ro = new ResizeObserver(medir);
    ro.observe(vi);
    ro.observe(en);
    const io = new IntersectionObserver(([e]) => {
      s.visible = e.isIntersecting;
      if (s.visible) despertar();
    });
    io.observe(vi);
    const cambio = () => {
      s.quieto = mq.matches;
      despertar();
    };
    mq.addEventListener("change", cambio);
    return () => {
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener("change", cambio);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    const s = m.current;
    Object.assign(s, { acto, mano, lectura, limpio });
    motor.current?.sincronizar();
  }, [acto, mano, lectura, limpio]);

  const cambiarActo = (k: number) => {
    if (k === acto) return;
    if (k === 1) setMano(null);
    setActo(k);
  };

  // ── I · La diagonal: el hilo ──
  const irEstacion = (e: number) => {
    const k = clamp(e, 0, N);
    m.current.tM = k / N;
    setEstacion(k);
    motor.current?.sincronizar();
  };
  const tirar = (ev: PointerEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const t = clamp((ev.clientX - r.left) / r.width, 0, 1);
    m.current.tM = t;
    setEstacion(Math.round(t * N));
    motor.current?.sincronizar();
  };
  const hiloTeclas = (ev: KeyboardEvent) => {
    const d = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[ev.key];
    if (d) irEstacion(estacion + d);
    else if (ev.key === "Home") irEstacion(0);
    else if (ev.key === "End") irEstacion(N);
    else return;
    ev.preventDefault();
  };

  // ── III · El claroscuro: la linterna ──
  const llevarLuz = (ev: PointerEvent<HTMLDivElement>) => {
    const s = m.current;
    const r = ev.currentTarget.getBoundingClientRect();
    // Con el dedo, la luz va por encima de la yema para no taparla
    const dy = ev.pointerType === "touch" ? 72 : ev.pointerType === "pen" ? 24 : 0;
    s.focoM.x = clamp((ev.clientX - r.left - s.ox) / s.zw, 0, 1);
    s.focoM.y = clamp((ev.clientY - r.top - dy - s.oy) / s.zh, 0, 1);
    motor.current?.despertar();
  };
  const vistaTeclas = (ev: KeyboardEvent) => {
    if (acto !== 2) return;
    const d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[ev.key];
    if (!d) return;
    ev.preventDefault();
    const s = m.current;
    s.focoM.x = clamp(s.focoM.x + d[0] * 0.04, 0, 1);
    s.focoM.y = clamp(s.focoM.y + d[1] * 0.03, 0, 1);
    motor.current?.despertar();
  };

  const salaTeclas = (ev: KeyboardEvent) => {
    if (ev.key === "Escape" && acto === 1 && mano !== null) {
      setMano(null);
      ev.preventDefault();
    }
  };

  const pie = (() => {
    if (acto === 0) {
      const p = DIAGONAL[estacion];
      return { n: `${estacion + 1} / ${DIAGONAL.length}`, titulo: p.titulo, texto: p.texto };
    }
    if (acto === 1) {
      if (mano === null)
        return { n: `${MANOS.length} manos`, titulo: "¿Quién sostiene el peso?", texto: "Unas manos agarran, otras reciben y una ya no sostiene nada. Elige una sobre el cuadro." };
      const p = MANOS[mano];
      return { n: `${mano + 1} / ${MANOS.length}`, titulo: p.titulo, texto: p.texto };
    }
    if (lectura === 0)
      return { n: "Luz", titulo: "La luz natural", texto: "Lleva la luz por la tabla y deja que el resto vuelva a la sombra." };
    const l = LUZ[lectura - 1];
    return { n: `Lectura ${lectura} / ${LUZ.length}`, titulo: l.titulo, texto: l.texto };
  })();

  return (
    <section id="peso-de-la-luz" className="pz-sala" data-acto={acto} data-limpio={limpio} aria-labelledby="pz-titulo" aria-roledescription="instalación" onKeyDown={salaTeclas}>
      <header className="pz-cabeza">
        <p className="pz-ante">Instalación de MANIFESTO</p>
        <h2 id="pz-titulo">El peso de la luz</h2>
        <button type="button" className="pz-limpio" aria-pressed={limpio} onClick={() => setLimpio(!limpio)}>
          <span aria-hidden="true">◐</span> Sin efectos
        </button>
        <div className="pz-actos" role="group" aria-label="Momento">
          {ACTOS.map((nombre, k) => (
            <button key={nombre} type="button" aria-pressed={acto === k} onClick={() => cambiarActo(k)}>
              <span aria-hidden="true">{ROMANOS[k]}</span> {nombre}
            </button>
          ))}
        </div>
      </header>

      <div ref={encuadre} className="pz-encuadre" aria-hidden="true" />
      <div
        ref={vista}
        className="pz-vista"
        role="group"
        aria-label={acto === 2 ? "La tabla en penumbra. Mueve la luz con las flechas." : "La tabla de Rubens"}
        tabIndex={acto === 2 ? 0 : -1}
        onKeyDown={vistaTeclas}
        onPointerDown={(ev) => {
          if (acto !== 2) return;
          arrastre.current = true;
          try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
          llevarLuz(ev);
        }}
        onPointerMove={(ev) => {
          if (acto === 2 && (ev.pointerType === "mouse" || arrastre.current)) llevarLuz(ev);
        }}
        onPointerUp={() => (arrastre.current = false)}
        onPointerCancel={() => (arrastre.current = false)}
      >
        <div ref={lienzo} className="pz-lienzo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SRC} width={I.width} height={I.height} alt="" loading="lazy" decoding="async" draggable={false} />
          <svg viewBox={`0 0 100 ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
            <path ref={viva} d={RUTA} pathLength={1} />
          </svg>
        </div>
        <canvas ref={velo} className="pz-velo" aria-hidden="true" />
        <div ref={lente} className="pz-lente" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={lenteImg} src={SRC} width={I.width} height={I.height} alt="" loading="lazy" decoding="async" draggable={false} style={{ filter: LECTURAS[lectura].filtro }} />
        </div>
        <div ref={capa} className="pz-capa">
          {acto === 0
            ? DIAGONAL.map((p, k) => (
                <button
                  key={p.id}
                  type="button"
                  className="pz-hito"
                  data-on={k === estacion}
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                  onClick={() => irEstacion(k)}
                />
              ))
            : null}
          {acto === 1
            ? MANOS.map((p, k) => (
                <button
                  key={p.id}
                  type="button"
                  className="pz-mano"
                  aria-pressed={mano === k}
                  aria-label={p.titulo}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                  onClick={() => setMano(mano === k ? null : k)}
                />
              ))
            : null}
        </div>
      </div>

      <div className="pz-pie">
        <div className="pz-texto" aria-live="polite">
          <p className="pz-texto__n">
            <span aria-hidden="true">{ROMANOS[acto]} · </span>
            {pie.n}
          </p>
          <h3>{pie.titulo}</h3>
          <p>{pie.texto}</p>
          {acto === 2 ? (
            <p className="pz-dato">
              En la reproducción, {MEDIDAS.oscuro}{" "}% de la superficie es casi negra y solo {MEDIDAS.claro}{" "}% es clara.
            </p>
          ) : null}
        </div>

        <div className="pz-accion">
          {acto === 0 ? (
            <>
              <div
                className="pz-hilo"
                role="slider"
                tabIndex={0}
                aria-label="Bajar el cuerpo por la diagonal"
                aria-valuemin={1}
                aria-valuemax={DIAGONAL.length}
                aria-valuenow={estacion + 1}
                aria-valuetext={`${estacion + 1} de ${DIAGONAL.length}: ${DIAGONAL[estacion].titulo}`}
                onKeyDown={hiloTeclas}
                onPointerDown={(ev) => {
                  arrastre.current = true;
                  try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
                  tirar(ev);
                }}
                onPointerMove={(ev) => arrastre.current && tirar(ev)}
                onPointerUp={() => {
                  arrastre.current = false;
                  irEstacion(Math.round(m.current.tM * N));
                }}
                onPointerCancel={() => (arrastre.current = false)}
              >
                <span className="pz-hilo__via">
                  <span ref={lleno} className="pz-hilo__lleno" />
                </span>
                {DIAGONAL.map((p, k) => (
                  <span key={p.id} className="pz-hilo__marca" data-on={k <= estacion} style={{ left: `${(k / N) * 100}%` }} />
                ))}
                <span ref={asa} className="pz-hilo__asa" />
              </div>
              <p className="pz-pista" aria-hidden="true">
                <span>Arriba</span> Arrastra para bajar el cuerpo <span>Tierra</span>
              </p>
            </>
          ) : null}

          {acto === 1 ? (
            mano === null ? (
              <p className="pz-pista">Toca uno de los seis círculos sobre la tabla.</p>
            ) : (
              <div className="pz-pasos">
                <button type="button" onClick={() => setMano((mano + MANOS.length - 1) % MANOS.length)} aria-label="Mano anterior">←</button>
                <button type="button" onClick={() => setMano((mano + 1) % MANOS.length)} aria-label="Mano siguiente">→</button>
                <button type="button" className="pz-todo" onClick={() => setMano(null)}>Todo el cuadro</button>
              </div>
            )
          ) : null}

          {acto === 2 ? (
            <>
              <div className="pz-lecturas" role="group" aria-label="Lectura de la luz">
                {LECTURAS.map((l, k) => (
                  <button key={l.id} type="button" aria-pressed={lectura === k} onClick={() => setLectura(k)}>
                    {l.titulo}
                  </button>
                ))}
              </div>
              <p className="pz-pista" aria-hidden="true">Arrastra sobre la tabla para llevar la luz.</p>
            </>
          ) : null}
        </div>

        <p className="pz-nota">La penumbra, la luz y los filtros son una capa de esta página sobre la reproducción; «Sin efectos» la retira.</p>
      </div>

      <div className="pz-nojs">
        {[
          { titulo: ACTOS[0], items: DIAGONAL },
          { titulo: ACTOS[1], items: MANOS },
          { titulo: ACTOS[2], items: LUZ },
        ].map((g, k) => (
          <div key={g.titulo}>
            <h3>{ROMANOS[k]} · {g.titulo}</h3>
            <ol>
              {g.items.map((p) => (
                <li key={p.id}>
                  <strong>{p.titulo}.</strong> {p.texto}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
