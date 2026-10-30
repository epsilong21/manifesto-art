/** Textos de «El gabinete de lo imposible» (V7.2) y del umbral que lo separa de «Cartografía del caos». */
import { GIRO, INCLINACION, type Estado } from "@/components/loca-meg/gabineteEstado";

export const TRANSICION = {
  titulo: "Una interpretación de MANIFESTO",
  entrada: "Hasta aquí, la tabla de Bruegel y lo que se puede ver en ella. Lo que sigue no está en el cuadro.",
  tabla: {
    etiqueta: "En la tabla",
    tipo: "Lo que se ve",
    texto: "Una mujer armada avanza hacia la boca del infierno entre criaturas, objetos y bocas. Lo cotidiano y lo monstruoso comparten el mismo espacio.",
  },
  sala: {
    etiqueta: "En esta sala",
    tipo: "Interpretación de MANIFESTO",
    texto: "Tres objetos suspendidos que se tiran unos de otros: un hierro que flota, un recipiente que hace subir lo que contiene y un ensamblaje que se desordena. Los objetos, los materiales y sus comportamientos son una creación original de MANIFESTO; ninguno procede de Bruegel.",
  },
};

export const OBJETOS = [
  { n: "I", nombre: "El peso que flota", mando: "Altura del hierro" },
  { n: "II", nombre: "El recipiente imposible", mando: "Inclinación del recipiente" },
  { n: "III", nombre: "La estructura del caos", mando: "Giro del ensamblaje" },
] as const;

export const CALMA = {
  titulo: "El gabinete en calma",
  texto: "Un hierro que no cae, un recipiente cuyo contenido sube y un ensamblaje en orden. Los tres cuelgan de la misma viga. Toca uno y mira qué hacen los otros.",
};
export const RESTAURADO = {
  titulo: "Composición restaurada",
  texto: "Los tres objetos han vuelto a su posición de partida: el hierro en el centro de su recorrido, el recipiente recto y el ensamblaje en orden.",
};

export const PISTA =
  "Arrastra el hierro arriba o abajo, inclina el recipiente a un lado o gira el ensamblaje. Con teclado: foco en un objeto y flechas.";

export const NOTA_GABINETE =
  "Instalación imaginada por MANIFESTO, no una obra de Bruegel. Las relaciones entre los objetos son una regla matemática sencilla que se calcula en esta página.";

export type Toque = 0 | 1 | 2 | null;

const pct = (v: number) => `${Math.round(Math.abs(v) * 100)} %`;

/** Lo que ha pasado, en frases: cada objeto cuenta qué le ha hecho el otro. */
export function describir(e: Estado, toque: Toque, desorden: number): { titulo: string; texto: string } {
  const dh = (e.h - 0.5) * 2;
  const grados = Math.round(e.t * INCLINACION * (180 / Math.PI));
  const quieto = Math.abs(dh) < 0.04 && Math.abs(e.t) < 0.04 && Math.abs(e.g) < 0.04;
  if (quieto) return CALMA;
  const partes: string[] = [];
  if (Math.abs(dh) >= 0.04) {
    partes.push(
      `El hierro ${dh > 0 ? "sube" : "baja"} ${pct(dh)} de su recorrido y, por la cuerda que corre sobre la viga, el recipiente ${dh > 0 ? "baja" : "sube"}.`,
    );
  }
  if (Math.abs(grados) >= 2) {
    partes.push(
      `El recipiente se inclina ${Math.abs(grados)}° a la ${grados > 0 ? "derecha" : "izquierda"}: las formas suspendidas fluyen hacia ese lado, contra la gravedad, y su luz cambia de ámbar a turquesa.`,
    );
  }
  const orden = desorden < 0.12 ? "conserva su orden" : desorden < 0.45 ? "empieza a abrirse" : "se ha deshecho en piezas sueltas";
  partes.push(`El ensamblaje ${orden}${Math.abs(e.g) >= 0.04 ? ` y está girado ${Math.round(Math.abs(e.g) * GIRO * (180 / Math.PI))}°` : ""}.`);
  const titulo = toque === 0 ? "El peso que flota" : toque === 1 ? "El recipiente imposible" : toque === 2 ? "La estructura del caos" : "El gabinete se mueve";
  return { titulo, texto: partes.join(" ") };
}
