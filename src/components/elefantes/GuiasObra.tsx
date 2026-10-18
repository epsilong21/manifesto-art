import type { CSSProperties, ReactNode } from "react";
import type { Descubrimiento } from "@/content/elefantes";

/**
 * Guías editoriales de MANIFESTO sobre la pintura: un tratamiento distinto por
 * capítulo. Se dibujan encima de la reproducción y nunca la alteran (velos,
 * trazos y rótulos; nada se deforma ni se borra).
 *
 * Coordenadas en píxeles de la reproducción de referencia (1596 × 1270), medidas
 * sobre la imagen. Si cambia el archivo, recalibrar junto a las zonas de
 * DESCUBRIMIENTOS. Las medidas de los rótulos salen de estas mismas cotas.
 */
export const LIENZO = { w: 1596, h: 1270 };

type Id = Descubrimiento["id"];
/** Dónde queda el rótulo respecto a su punto: arriba, abajo, izquierda o derecha. */
type Lado = "n" | "s" | "o" | "e";

function Nota({ x, y, lado, sec, children }: { x: number; y: number; lado: Lado; sec?: boolean; children: ReactNode }) {
  const style = { left: `${(x / LIENZO.w) * 100}%`, top: `${(y / LIENZO.h) * 100}%` } as CSSProperties;
  return (
    <span className="ol-nota" data-lado={lado} data-sec={sec || undefined} style={style}>
      <span>{children}</span>
    </span>
  );
}

/** Pierna izquierda del elefante de la izquierda a la derecha: cadera → rodilla → … */
const PATAS_IZQ = [
  [95, 330, 60, 455, 45, 655, 22, 860],
  [130, 340, 105, 485, 120, 960, 200, 1210],
  [225, 340, 210, 480, 200, 815, 285, 1215],
  [250, 340, 262, 510, 345, 890, 565, 1215],
];
const pts = (p: number[]) => p.join(" ");

/** Velos: atenúan la obra salvo lo que importa en cada capítulo (bordes difusos). */
const VELOS: Partial<Record<Id, ReactNode>> = {
  colosos: <rect x="430" y="-200" width="775" height="1670" opacity="0.42" />,
  patas: <path fillRule="evenodd" opacity="0.58" d="M-200 -200H1796V1470H-200Z M-40 325 L330 325 L640 1240 L-40 1240Z" />,
  obeliscos: (
    <path
      fillRule="evenodd"
      opacity="0.7"
      d="M-200 -200H1796V1470H-200Z M1248 -10H1380V208H1248Z M1404 68a97 62 0 1 0 194 0a97 62 0 1 0 -194 0Z"
    />
  ),
  peso: <path fillRule="evenodd" opacity="0.38" d="M-200 -200H1796V1470H-200Z M80 -10H404V342H80Z" />,
};

const SVG: Record<Id, ReactNode> = {
  // 1 · Dos colosos: el vacío entre ambos y su misma escala
  colosos: (
    <>
      <line data-a="alto" className="ol-trazo ol-trazo--fino" x1="420" y1="6" x2="420" y2="1215" />
      <line data-a="alto" className="ol-trazo ol-trazo--fino" x1="1215" y1="6" x2="1215" y2="1215" />
      <line data-a="alto" className="ol-trazo" x1="404" y1="1215" x2="436" y2="1215" />
      <line data-a="alto" className="ol-trazo" x1="1199" y1="1215" x2="1231" y2="1215" />
      <line data-a="izq" className="ol-trazo ol-trazo--acento" x1="398" y1="258" x2="815" y2="247" />
      <line data-a="der" className="ol-trazo ol-trazo--acento" x1="815" y1="247" x2="1232" y2="236" />
      <circle data-a="punto" className="ol-punto" cx="398" cy="258" r="7" />
      <circle data-a="punto" className="ol-punto" cx="1232" cy="236" r="7" />
    </>
  ),
  // 2 · Patas del deseo: verticalidad (regla), proporción y articulaciones
  patas: (
    <>
      <line data-a="regla-cuerpo" className="ol-trazo ol-trazo--punteado" x1="660" y1="0" x2="660" y2="335" />
      <line data-a="regla" className="ol-trazo ol-trazo--acento" x1="660" y1="335" x2="660" y2="1215" />
      <line data-a="tope" className="ol-trazo" x1="644" y1="335" x2="676" y2="335" />
      <line data-a="tope" className="ol-trazo" x1="644" y1="1215" x2="676" y2="1215" />
      {[
        [60, 455],
        [105, 485],
        [210, 480],
        [262, 510],
        [45, 655],
        [200, 815],
        [345, 890],
        [120, 960],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} data-a="junta" className="ol-anillo" cx={cx} cy={cy} r="15" />
      ))}
    </>
  ),
  // 3 · El obelisco: la mirada sube por su eje y salta a «Roma 1948»
  obeliscos: (
    <>
      {/* Cota junto al obelisco, sin taparlo: de la base a la punta */}
      <line data-a="eje" className="ol-trazo ol-trazo--acento" x1="1236" y1="196" x2="1236" y2="4" />
      <line data-a="eje" className="ol-trazo" x1="1222" y1="196" x2="1250" y2="196" />
      <line data-a="eje" className="ol-trazo" x1="1222" y1="4" x2="1250" y2="4" />
      <path data-a="puente" className="ol-trazo ol-trazo--punteado" d="M1376 150 Q1396 140 1410 112" />
      <ellipse data-a="firma" className="ol-trazo ol-trazo--acento" cx="1501" cy="68" rx="93" ry="58" />
    </>
  ),
  // 4 · El peso que no pesa: masa compacta frente a soportes de un trazo
  peso: (
    <>
      <rect data-a="masa" className="ol-trazo ol-trazo--masa" x="82" y="2" width="320" height="338" />
      {PATAS_IZQ.map((p) => (
        <polyline key={p[0]} data-a="soporte" className="ol-trazo ol-trazo--fino ol-trazo--acento" points={pts(p.slice(0, 6))} />
      ))}
      <line data-a="aire" className="ol-trazo" x1="150" y1="215" x2="205" y2="215" />
      <line data-a="aire" className="ol-trazo" x1="150" y1="229" x2="205" y2="229" />
    </>
  ),
  // 5 · El desierto: horizonte, espacio negativo y figuras diminutas
  desierto: (
    <>
      <rect data-a="vacio" className="ol-trazo ol-trazo--punteado" x="410" y="10" width="805" height="1135" />
      <line data-a="horizonte" className="ol-trazo ol-trazo--acento" x1="0" y1="1190" x2="1596" y2="1190" />
      <ellipse data-a="figura" className="ol-anillo" cx="754" cy="1180" rx="42" ry="42" />
      <ellipse data-a="figura" className="ol-anillo" cx="640" cy="1225" rx="24" ry="42" />
      <ellipse data-a="figura" className="ol-anillo" cx="960" cy="1222" rx="36" ry="46" />
    </>
  ),
};

/** Rótulos: HTML sobre la obra, a tamaño constante con cualquier acercamiento. */
const NOTAS: Record<Id, ReactNode> = {
  colosos: (
    <>
      <Nota x={815} y={226} lado="n">
        Frente a frente
      </Nota>
      <Nota x={815} y={272} lado="s">
        52 % del ancho, vacío
      </Nota>
      <Nota x={436} y={720} lado="e" sec>
        96 % del alto
      </Nota>
      <Nota x={1199} y={720} lado="o" sec>
        96 % del alto
      </Nota>
    </>
  ),
  patas: (
    <>
      <Nota x={680} y={335} lado="e">
        Cuerpo y carga · 28 %
      </Nota>
      <Nota x={680} y={775} lado="e">
        Patas · 72 % del alto
      </Nota>
      <Nota x={372} y={890} lado="e" sec>
        Articulaciones
      </Nota>
    </>
  ),
  obeliscos: (
    <>
      <Nota x={1218} y={80} lado="o">
        Obelisco
      </Nota>
      <Nota x={1218} y={128} lado="o" sec>
        Cita de Bernini, Roma, 1667
      </Nota>
      <Nota x={1501} y={134} lado="s">
        «Roma 1948»
      </Nota>
    </>
  ),
  peso: (
    <>
      <Nota x={410} y={320} lado="e">
        Masa: cuerpo y obelisco
      </Nota>
      <Nota x={300} y={470} lado="e">
        Soporte: más de 20 veces más estrecho
      </Nota>
      <Nota x={146} y={222} lado="o">
        Aire
      </Nota>
    </>
  ),
  desierto: (
    <>
      <Nota x={812} y={560} lado="n">
        Cielo vacío · 47 % del lienzo
      </Nota>
      <Nota x={754} y={1130} lado="n" sec>
        Templo
      </Nota>
      <Nota x={1040} y={1166} lado="n">
        Figura: 1/20 de un elefante
      </Nota>
    </>
  ),
};

export const IDS = Object.keys(SVG) as Id[];

const VIEWBOX = `0 0 ${LIENZO.w} ${LIENZO.h}`;

/**
 * Velos en su propia capa: el desenfoque se pinta una vez y la cámara solo
 * desplaza la capa en el compositor.
 */
export function VelosObra() {
  return (
    <svg className="ol-guias" viewBox={VIEWBOX} preserveAspectRatio="none" focusable="false">
      <defs>
        <filter id="ol-difuso" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      {IDS.map((id) => (
        <g key={id} className="ol-g ol-velo" data-g={id} filter="url(#ol-difuso)">
          {VELOS[id]}
        </g>
      ))}
    </svg>
  );
}

/** Trazos y rótulos: todos los tratamientos montados; se activa uno cada vez. */
export function GuiasObra() {
  return (
    <>
      <svg className="ol-guias" viewBox={VIEWBOX} preserveAspectRatio="none" focusable="false">
        {IDS.map((id) => (
          <g key={id} className="ol-g" data-g={id}>
            {SVG[id]}
          </g>
        ))}
      </svg>
      {IDS.map((id) => (
        <div key={id} className="ol-notas" data-g={id}>
          {NOTAS[id]}
        </div>
      ))}
    </>
  );
}

type Q = (sel: string) => Element[];

/**
 * Revelación de cada capítulo, a partir del instante `t` (cuando la cámara
 * llega). Cada una cuenta su idea con su propio movimiento.
 */
export const REVELAR: Record<Id, (tl: gsap.core.Timeline, q: Q, t: number) => void> = {
  // Las alturas se levantan a la vez y la distancia se tiende desde cada elefante hasta el centro
  colosos: (tl, q, t) => {
    const g = '[data-g="colosos"]';
    tl.from(q(`${g} [data-a=alto]`), { scaleY: 0, transformOrigin: "50% 100%", duration: 1, ease: "power2.out" }, t - 0.4)
      .from(q(`${g} [data-a=punto]`), { scale: 0, transformOrigin: "50% 50%", duration: 0.4, ease: "back.out(2)" }, t + 0.2)
      .from(q(`${g} [data-a=izq]`), { scaleX: 0, transformOrigin: "0% 50%", duration: 0.9, ease: "power2.inOut" }, t + 0.35)
      .from(q(`${g} [data-a=der]`), { scaleX: 0, transformOrigin: "100% 50%", duration: 0.9, ease: "power2.inOut" }, t + 0.35)
      .from(q(`${g} .ol-nota > span`), { autoAlpha: 0, duration: 0.5, stagger: 0.12 }, t + 1);
  },
  // La regla baja del cuerpo al suelo y las articulaciones se encienden de arriba abajo
  patas: (tl, q, t) => {
    const g = '[data-g="patas"]';
    const juntas = q(`${g} [data-a=junta]`).sort((a, b) => +a.getAttribute("cy")! - +b.getAttribute("cy")!);
    tl.from(q(`${g} [data-a=tope]`), { autoAlpha: 0, duration: 0.3 }, t - 0.2)
      .from(q(`${g} [data-a=regla-cuerpo]`), { autoAlpha: 0, duration: 0.4 }, t - 0.2)
      .from(q(`${g} [data-a=regla]`), { scaleY: 0, transformOrigin: "50% 0%", duration: 1.3, ease: "power1.inOut" }, t)
      .from(juntas, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.35, stagger: 0.12, ease: "back.out(2)" }, t + 0.15)
      .from(q(`${g} .ol-nota > span`), { autoAlpha: 0, duration: 0.5, stagger: 0.25 }, t + 0.6);
  },
  // El eje sube por el obelisco y la mirada salta a la firma
  obeliscos: (tl, q, t) => {
    const g = '[data-g="obeliscos"]';
    tl.from(q(`${g} [data-a=eje]`), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.9, ease: "power2.out" }, t - 0.2)
      .from(q(`${g} [data-a=puente]`), { autoAlpha: 0, duration: 0.4 }, t + 0.6)
      .from(q(`${g} [data-a=firma]`), { scale: 0.7, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.6, ease: "power2.out" }, t + 0.8)
      .from(q(`${g} .ol-nota > span`), { autoAlpha: 0, duration: 0.5, stagger: 0.35 }, t + 0.3);
  },
  // La masa cae y se asienta; después, los soportes, de un solo trazo
  peso: (tl, q, t) => {
    const g = '[data-g="peso"]';
    tl.from(q(`${g} [data-a=masa]`), { y: -90, autoAlpha: 0, duration: 0.7, ease: "power4.in" }, t - 0.3)
      .to(q(`${g} [data-a=masa]`), { y: 8, duration: 0.12, ease: "power1.out", yoyo: true, repeat: 1 }, t + 0.4)
      .from(q(`${g} [data-a=soporte]`), { scaleY: 0, transformOrigin: "50% 0%", duration: 0.8, stagger: 0.08, ease: "power2.out" }, t + 0.6)
      .from(q(`${g} [data-a=aire]`), { autoAlpha: 0, duration: 0.25, repeat: 2, yoyo: true }, t + 1.3)
      .from(q(`${g} .ol-nota > span`), { autoAlpha: 0, duration: 0.5, stagger: 0.2 }, t + 0.9);
  },
  // Las figuras primero; al retroceder la cámara, el horizonte y el vacío
  desierto: (tl, q, t) => {
    const g = '[data-g="desierto"]';
    tl.from(q(`${g} [data-a=figura]`), { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%", duration: 0.4, stagger: 0.15, ease: "back.out(2)" }, 0.5)
      .from(q(`${g} [data-a=horizonte]`), { scaleX: 0, transformOrigin: "0% 50%", duration: 1.6, ease: "power1.inOut" }, t - 1.6)
      .from(q(`${g} [data-a=vacio]`), { autoAlpha: 0, duration: 0.8 }, t - 0.3)
      .from(q(`${g} .ol-nota > span`), { autoAlpha: 0, duration: 0.5, stagger: 0.2 }, t);
  },
};
