"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ESTADOS, NOTA_GRAVEDAD, type EstadoGravedad } from "@/content/descendimiento-gravedad";
import { APOYOS, Escultura, NX, NZ, PASO, RANGO, type V3 } from "./gravedadFisica";
import { crearLienzo, matrizCamara, proyectar, type Lienzo, type Vista } from "./gravedadGL";
import { crearPlano } from "./gravedadPlano";

const ROMANOS = ["I", "II", "III", "IV", "V", "VI"];
/** La cámara mira 30 cm por debajo del centro de la escultura. */
const BAJO = 0.3;
const GIRO = 0.75;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const pct = (x: number) => `${Math.round(x * 100)} %`;
const cm = (m: number) => `${Math.round(Math.abs(m) * 100)} cm`;

/** Encuadre: en vertical la cámara se va hacia el lado corto para que la tela quepa a lo ancho. */
function encuadre(asp: number) {
  const vertical = asp < 0.9;
  return { az: vertical ? 1.02 : 0.52, el: vertical ? 0.58 : 0.5, fov: ((vertical ? 38 : 29) * Math.PI) / 180 };
}
function vistaPara(az: number, asp: number, OBJ: V3): Vista {
  const { el, fov } = encuadre(asp);
  const fx = 2 * Math.atan(Math.tan(fov / 2) * asp);
  const dist = Math.max(2.35 / Math.tan(fov / 2), 2.2 / Math.tan(fx / 2));
  return {
    ojo: [OBJ[0] + dist * Math.sin(az) * Math.cos(el), OBJ[1] + dist * Math.sin(el), OBJ[2] + dist * Math.cos(az) * Math.cos(el)],
    obj: OBJ,
    fov,
  };
}

type Resumen = { estado: EstadoGravedad; dato: string };

/** Lo que ha pasado, en una frase: la cuerda más cargada y adónde se ha ido la carga. */
function describir(e: Escultura, inicio: [number, number]): string {
  const r = e.reparto();
  let k = 0;
  r.forEach((x, i) => x > r[k] && (k = i));
  const [cx, cz] = e.lugarCarga();
  const dx = cx - inicio[0], dz = cz - inicio[1], d = Math.hypot(dx, dz);
  let frase = `La cuerda ${ROMANOS[k]} es la más cargada: sostiene el ${pct(r[k])} del peso.`;
  if (d > 0.08) {
    // El apoyo hacia el que se ha ido la carga
    let mejor = 0, hacia = 0;
    APOYOS.forEach(([i, j], a) => {
      const x = (i - (NX - 1) / 2) * PASO, z = (j - (NZ - 1) / 2) * PASO;
      const c = (x * dx + z * dz) / (Math.hypot(x, z) * d);
      if (c > mejor) [mejor, hacia] = [c, a];
    });
    frase += ` Sobre la tela, la carga se ha desplazado ${cm(d)} hacia el apoyo ${ROMANOS[hacia]}.`;
  } else frase += " La carga sigue en el centro de la tela.";
  const sueltas = e.cuerdas.filter((c) => c.suelta).length;
  if (sueltas) frase += sueltas === 1 ? " Una cuerda está suelta." : " Dos cuerdas están sueltas.";
  return frase;
}

/**
 * «La gravedad invisible»: una tela marfil, una carga de bronce y seis cuerdas que bajan de la
 * oscuridad. Cada anillo es un apoyo: se arrastra hacia arriba o hacia abajo, o se suelta, y la
 * tela, la carga y el reparto del peso responden. La simulación solo corre mientras algo se mueve;
 * con movimiento reducido, se calcula sin dibujar y se muestra el resultado de una vez.
 */
export function Gravedad() {
  const [gl, setGl] = useState<boolean | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [alturas, setAlturas] = useState<number[]>(() => APOYOS.map(() => 0));
  const [sueltas, setSueltas] = useState<boolean[]>(() => APOYOS.map(() => false));
  const [resumen, setResumen] = useState<Resumen>({ estado: "equilibrio", dato: "" });
  const [listo, setListo] = useState(false);

  const lienzo = useRef<HTMLCanvasElement>(null);
  const anillos = useRef<(HTMLDivElement | null)[]>([]);
  const barras = useRef<(HTMLSpanElement | null)[]>([]);
  const cifras = useRef<(HTMLSpanElement | null)[]>([]);
  const motor = useRef<{ despertar: (accion?: boolean) => void; resumir: (final: boolean) => void; vista: () => Vista; tam: () => [number, number] } | null>(null);
  const s = useRef({
    e: null as Escultura | null,
    inicio: [0, 0] as [number, number],
    alt: APOYOS.map(() => 0),
    obj: [0, -0.9, 0] as V3,
    az: 0, azMeta: 0, raf: 0, visible: false, quieto: false, escala: 1, lentos: 0, ultimo: 0,
    restaurando: false, accion: 0,
    arrastre: null as null | { k: number; y0: number; d0: number; mpp: number; movido: boolean },
    giro: null as null | { x0: number; az0: number },
    ultimoReparto: "",
  });

  useEffect(() => {
    const st = s.current;
    const cv = lienzo.current!;
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    st.quieto = mq.matches;
    let dibujo: Lienzo | null = crearLienzo(cv);
    setGl(!!dibujo);
    if (!dibujo) dibujo = crearPlano(cv);
    const asp = () => cv.clientWidth / Math.max(1, cv.clientHeight);
    st.az = st.azMeta = encuadre(asp()).az;
    // Presupuesto de píxeles: unos 700 000 como mucho, sin pasar de la densidad de la pantalla
    const escalaBase = () => Math.min(Math.min(devicePixelRatio || 1, 2), Math.sqrt(700000 / Math.max(1, cv.clientWidth * cv.clientHeight)));
    st.escala = escalaBase();
    const vista = () => vistaPara(st.az, asp(), st.obj);

    const colocar = () => {
      const e = st.e;
      if (!e) return;
      const w = cv.clientWidth, h = cv.clientHeight;
      const { vp } = matrizCamara(vista(), w / Math.max(1, h));
      e.cuerdas.forEach((c, k) => {
        const el = anillos.current[k];
        if (!el) return;
        const [x, y, z] = proyectar(vp, e.punto(c.idx), w, h);
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.visibility = z > 1 || x < -20 || x > w + 20 || y < -20 || y > h + 20 ? "hidden" : "visible";
      });
      const r = e.reparto();
      const clave = r.map((x) => Math.round(x * 100)).join();
      if (clave !== st.ultimoReparto) {
        st.ultimoReparto = clave;
        r.forEach((x, k) => {
          const b = barras.current[k], c = cifras.current[k];
          if (b) b.style.transform = `scaleY(${Math.min(1, x / 0.4).toFixed(3)})`;
          if (c) c.textContent = pct(x);
        });
      }
    };
    const pintar = () => {
      if (!st.e || !dibujo) return;
      st.e.derivar();
      dibujo.pintar(st.e, vista());
      colocar();
    };

    /** Estado al instante; la frase con el reparto, solo cuando la escultura reposa. */
    const resumir = (final: boolean) => {
      const e = st.e;
      if (!e) return;
      const estado: EstadoGravedad = e.cuerdas.some((c) => c.suelta)
        ? "desequilibrio"
        : st.alt.some((a) => Math.abs(a) > 0.01)
          ? "tension"
          : st.restaurando
            ? "restaurado"
            : "equilibrio";
      setResumen({ estado, dato: final ? describir(e, st.inicio) : "La tela todavía se mueve: el peso se está repartiendo." });
      setSueltas(e.cuerdas.map((c) => c.suelta && !c.volviendo));
    };

    const paso = (ahora: number) => {
      st.raf = 0;
      const e = st.e;
      if (!e) return;
      const dt = st.ultimo ? Math.min(0.1, (ahora - st.ultimo) / 1000) : 1 / 60;
      st.ultimo = ahora;
      if (st.quieto && !st.arrastre) {
        // Movimiento reducido: se calcula en trozos sin dibujar y se muestra el final
        for (let k = 0; k < 12 && e.quietud < 30; k++) e.avanzar();
      } else {
        // Un paso de 1/60 s por fotograma: si el equipo va lento, la escultura va más despacio,
        // pero nunca acumula trabajo
        e.avanzar();
      }
      st.az += (st.azMeta - st.az) * (st.quieto ? 1 : 1 - Math.exp(-dt * 6));
      // Reencuadre lento: la cámara sigue a la escultura cuando el conjunto se desplaza
      const c = e.centro(), kc = st.quieto ? 1 : 1 - Math.exp(-dt * 1.6);
      let reencuadre = 0;
      for (let i = 0; i < 3; i++) {
        const d = c[i] - (i === 1 ? BAJO : 0) - st.obj[i];
        st.obj[i] += d * kc;
        reencuadre = Math.max(reencuadre, Math.abs(d));
      }
      const girando = Math.abs(st.azMeta - st.az) > 1e-4 || reencuadre > 0.004;
      // La deriva que queda tras 14 s sin tocar nada es de milímetros: se da por quieta
      const sigue = (e.quietud < 30 && ahora - st.accion < 14000) || girando || !!st.arrastre;

      // Resolución adaptativa
      if (dt > 0.03 && !st.quieto) {
        if (++st.lentos > 10 && st.escala > 0.55) {
          st.escala *= 0.85;
          st.lentos = 0;
          dibujo?.medir(st.escala);
        }
      } else st.lentos = Math.max(0, st.lentos - 1);

      if (!st.quieto || !sigue || st.arrastre) pintar();
      if (sigue && st.visible) st.raf = requestAnimationFrame(paso);
      else if (!sigue) resumir(true);
    };
    const despertar = (accion = true) => {
      if (accion) st.accion = performance.now();
      if (st.raf || !st.visible || !st.e) return;
      st.ultimo = 0;
      st.raf = requestAnimationFrame(paso);
    };
    motor.current = { despertar, resumir, vista, tam: () => [cv.clientWidth, cv.clientHeight] };

    // El equilibrio inicial se calcula por trozos cuando la sala se acerca, sin bloquear la página
    let cancelado = false;
    const preparar = () => {
      if (st.e || cancelado) return;
      const e = new Escultura();
      let hechos = 0;
      const trozo = () => {
        if (cancelado) return;
        // Trozos de 3 fotogramas: ninguna tarea larga, ni con la CPU lenta
        e.asentar(3);
        hechos += 3;
        if (hechos < 240) return void setTimeout(trozo, 0);
        e.fijarInicial();
        st.inicio = e.lugarCarga();
        const c = e.centro();
        st.obj = [c[0], c[1] - BAJO, c[2]];
        st.e = e;
        setListo(true);
        pintar();
        resumir(true);
      };
      trozo();
    };

    const medir = () => {
      st.escala = escalaBase();
      dibujo?.medir(st.escala);
      pintar();
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(cv);
    const cerca = new IntersectionObserver(([en]) => en.isIntersecting && preparar(), { rootMargin: "120% 0px" });
    cerca.observe(cv);
    const io = new IntersectionObserver(([en]) => {
      st.visible = en.isIntersecting;
      if (st.visible) despertar(false);
    });
    io.observe(cv);
    const cambio = () => {
      st.quieto = mq.matches;
      despertar();
    };
    mq.addEventListener("change", cambio);
    const perdido = (ev: Event) => {
      ev.preventDefault();
      setGl(false);
    };
    cv.addEventListener("webglcontextlost", perdido);
    return () => {
      cancelado = true;
      ro.disconnect();
      cerca.disconnect();
      io.disconnect();
      mq.removeEventListener("change", cambio);
      cv.removeEventListener("webglcontextlost", perdido);
      cancelAnimationFrame(st.raf);
      st.raf = 0;
      motor.current = null;
      dibujo?.liberar();
    };
  }, []);

  /** Cambia la altura de un apoyo, en metros (positivo: sube). */
  const mover = (k: number, d: number) => {
    const st = s.current;
    if (!st.e || st.e.cuerdas[k].suelta) return;
    const v = clamp(Math.round(d * 100) / 100, RANGO[0], RANGO[1]);
    st.alt[k] = v;
    st.restaurando = false;
    st.e.altura(k, v);
    motor.current?.despertar();
  };
  const fijarAlturas = () => {
    setAlturas([...s.current.alt]);
    motor.current?.resumir(false);
  };

  const alternar = (k: number) => {
    const e = s.current.e;
    if (!e) return;
    s.current.restaurando = false;
    if (e.cuerdas[k].suelta) e.atar(k);
    else if (e.puedeSoltar(k)) e.soltar(k);
    else return;
    motor.current?.resumir(false);
    motor.current?.despertar();
  };

  const restaurar = () => {
    const st = s.current;
    if (!st.e) return;
    st.alt = APOYOS.map(() => 0);
    st.restaurando = true;
    st.azMeta = encuadre(motor.current ? motor.current.tam()[0] / Math.max(1, motor.current.tam()[1]) : 1.6).az;
    st.e.restaurar();
    setAlturas([...st.alt]);
    setSel(null);
    motor.current?.resumir(false);
    motor.current?.despertar();
  };

  const teclas = (k: number) => (ev: KeyboardEvent<HTMLDivElement>) => {
    const a = s.current.alt[k];
    const paso = ev.key === "PageUp" || ev.key === "PageDown" ? 0.3 : 0.1;
    let d: number | null = null;
    if (ev.key === "ArrowUp" || ev.key === "ArrowRight" || ev.key === "PageUp") d = a + paso;
    else if (ev.key === "ArrowDown" || ev.key === "ArrowLeft" || ev.key === "PageDown") d = a - paso;
    else if (ev.key === "Home") d = 0;
    else if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      alternar(k);
      return;
    } else return;
    ev.preventDefault();
    setSel(k);
    mover(k, d);
    fijarAlturas();
  };

  const agarrar = (k: number) => (ev: PointerEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    const st = s.current;
    setSel(k);
    if (!st.e || !motor.current) return;
    try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
    // Metros por píxel a la altura de este anillo
    const [w, h] = motor.current.tam();
    const { vp } = matrizCamara(motor.current.vista(), w / Math.max(1, h));
    const p = st.e.punto(st.e.cuerdas[k].idx);
    const a = proyectar(vp, p, w, h), b = proyectar(vp, [p[0], p[1] + 1, p[2]], w, h);
    st.arrastre = { k, y0: ev.clientY, d0: st.alt[k], mpp: 1 / Math.max(40, Math.abs(a[1] - b[1])), movido: false };
  };
  const arrastrar = (ev: PointerEvent<HTMLDivElement>) => {
    const ar = s.current.arrastre;
    if (!ar) return;
    const dy = ev.clientY - ar.y0;
    if (Math.abs(dy) > 4) ar.movido = true;
    if (ar.movido) mover(ar.k, ar.d0 - dy * ar.mpp);
  };
  const soltarPuntero = () => {
    if (!s.current.arrastre) return;
    s.current.arrastre = null;
    fijarAlturas();
    motor.current?.despertar();
  };

  const girar = {
    onPointerDown: (ev: PointerEvent<HTMLDivElement>) => {
      if (ev.pointerType === "touch") return girarTactil(ev);
      s.current.giro = { x0: ev.clientX, az0: s.current.azMeta };
      try { ev.currentTarget.setPointerCapture(ev.pointerId); } catch {}
    },
    onPointerMove: (ev: PointerEvent<HTMLDivElement>) => {
      const g = s.current.giro;
      if (!g || !motor.current) return;
      const [w, h] = motor.current.tam();
      const base = encuadre(w / Math.max(1, h)).az;
      s.current.azMeta = clamp(g.az0 - (ev.clientX - g.x0) * 0.006, base - GIRO, base + GIRO);
      motor.current.despertar();
    },
    onPointerUp: () => (s.current.giro = null),
    onPointerCancel: () => (s.current.giro = null),
  };
  // En táctil el arrastre horizontal gira y el vertical desplaza la página (touch-action: pan-y)
  const girarTactil = (ev: PointerEvent<HTMLDivElement>) => {
    s.current.giro = { x0: ev.clientX, az0: s.current.azMeta };
  };
  const escenaTeclas = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (ev.target !== ev.currentTarget || !motor.current) return;
    const [w, h] = motor.current.tam();
    const base = encuadre(w / Math.max(1, h)).az;
    const st = s.current;
    if (ev.key === "ArrowLeft") st.azMeta = clamp(st.azMeta + 0.15, base - GIRO, base + GIRO);
    else if (ev.key === "ArrowRight") st.azMeta = clamp(st.azMeta - 0.15, base - GIRO, base + GIRO);
    else if (ev.key === "Home") st.azMeta = base;
    else return;
    ev.preventDefault();
    motor.current.despertar();
  };

  const nSueltas = sueltas.filter(Boolean).length;
  // Por qué no se puede soltar la cuerda elegida (o null si se puede)
  const veto =
    sel === null || sueltas[sel]
      ? null
      : sueltas[(sel + 1) % 6] || sueltas[(sel + 5) % 6]
        ? "No se pueden soltar dos cuerdas vecinas: un lado entero de la tela quedaría colgando."
        : nSueltas >= 2
          ? "Ya hay dos cuerdas sueltas: ata una antes de soltar otra."
          : null;
  const est = ESTADOS[resumen.estado];

  return (
    <section id="gravedad-invisible" className="gv-sala" data-gl={gl === false ? "no" : "si"} data-listo={listo} aria-labelledby="gv-titulo" aria-roledescription="instalación">
      <header className="gv-cabeza">
        <p className="gv-ante">Instalación de MANIFESTO</p>
        <h2 id="gv-titulo">La gravedad invisible</h2>
      </header>

      <div
        className="gv-escena"
        role="group"
        tabIndex={0}
        aria-label="La escultura: una tela sostenida por seis cuerdas, con una carga de bronce encima. Flechas izquierda y derecha para girar alrededor."
        onKeyDown={escenaTeclas}
        {...girar}
      >
        <canvas ref={lienzo} className="gv-lienzo" aria-hidden="true" />
        <div className="gv-capa">
          {APOYOS.map((_, k) => (
            <div
              key={k}
              ref={(el) => {
                anillos.current[k] = el;
              }}
              className="gv-apoyo"
              role="slider"
              tabIndex={listo ? 0 : -1}
              data-sel={sel === k}
              data-suelta={sueltas[k]}
              aria-label={`Apoyo ${ROMANOS[k]}`}
              aria-orientation="vertical"
              aria-valuemin={Math.round(RANGO[0] * 100)}
              aria-valuemax={Math.round(RANGO[1] * 100)}
              aria-valuenow={Math.round(alturas[k] * 100)}
              aria-valuetext={
                sueltas[k]
                  ? "Cuerda suelta. Intro para volver a atarla."
                  : alturas[k] === 0
                    ? "A su altura inicial"
                    : `${alturas[k] > 0 ? "Sube" : "Baja"} ${cm(alturas[k])}`
              }
              onKeyDown={teclas(k)}
              onFocus={() => setSel(k)}
              onPointerDown={agarrar(k)}
              onPointerMove={arrastrar}
              onPointerUp={soltarPuntero}
              onPointerCancel={soltarPuntero}
            >
              <span aria-hidden="true">{ROMANOS[k]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="gv-pie">
        <div className="gv-texto" aria-live="polite">
          <h3>{est.titulo}</h3>
          <p>{est.texto}</p>
          {resumen.dato ? <p className="gv-dato">{resumen.dato}</p> : null}
        </div>

        <div className="gv-reparto" aria-hidden="true">
          <p>El peso, cuerda a cuerda</p>
          <div>
            {APOYOS.map((_, k) => (
              <span key={k} data-suelta={sueltas[k]} data-sel={sel === k}>
                <span className="gv-reparto__via">
                  <span
                    ref={(el) => {
                      barras.current[k] = el;
                    }}
                  />
                </span>
                <b>{ROMANOS[k]}</b>
                <span
                  ref={(el) => {
                    cifras.current[k] = el;
                  }}
                />
              </span>
            ))}
          </div>
        </div>

        <div className="gv-acciones">
          {sel !== null ? (
            <button
              type="button"
              onClick={() => alternar(sel)}
              disabled={!!veto}
            >
              {sueltas[sel] ? `Atar la cuerda ${ROMANOS[sel]}` : `Soltar la cuerda ${ROMANOS[sel]}`}
            </button>
          ) : null}
          <button type="button" className="gv-restaurar" onClick={restaurar}>
            <span aria-hidden="true">↺</span> Restaurar el equilibrio
          </button>
        </div>
        <p className="gv-pista">
          {veto ?? "Arrastra un anillo hacia arriba o hacia abajo para mover su apoyo. Tócalo para poder soltar su cuerda."}
        </p>
        <p className="gv-nota">{NOTA_GRAVEDAD}</p>
      </div>

      <div className="gv-nojs">
        {(Object.keys(ESTADOS) as EstadoGravedad[]).map((k) => (
          <p key={k}>
            <strong>{ESTADOS[k].titulo}.</strong> {ESTADOS[k].texto}
          </p>
        ))}
      </div>
    </section>
  );
}
