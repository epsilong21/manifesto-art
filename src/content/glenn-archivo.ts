import { LECTURAS_GLENN, PROCEDENCIA_GLENN, type Lectura, type Tipo } from "./glenn";

/**
 * «Archivo vivo» (sección 03 de Glenn): los documentos de la instalación.
 *
 * Los seleccionables solo llevan contenido ya verificado: los apoyos y el límite de
 * cada lectura (LECTURAS_GLENN) y la procedencia de la lista de la Barbican. Nada
 * nuevo se afirma aquí; los rótulos son títulos editoriales de MANIFESTO.
 * Las piezas gráficas (letras, pestañas, sellos, índices…) son originales de MANIFESTO
 * y no contienen datos: no copian ni reconstruyen la obra.
 */

export type LecturaId = Lectura["id"];
/** Clase del archivo: el grado de certeza de cada documento. */
export type Clase = Tipo | "limite";

export const CLASES: { id: Clase; nombre: string; corto: string }[] = [
  { id: "hecho", nombre: "Documentado", corto: "DOC" },
  { id: "observacion", nombre: "Observación", corto: "OBS" },
  { id: "lectura", nombre: "Interpretación", corto: "INT" },
  { id: "limite", nombre: "Lo que no prueba", corto: "LÍM" },
];

export type Forma = "ficha" | "hoja" | "tira" | "recorte";

export type DocArchivo = {
  id: string;
  lectura: LecturaId;
  clase: Clase;
  codigo: string;
  rotulo: string;
  texto: string;
  fuente: string;
  forma: Forma;
};

const lectura = (id: LecturaId) => LECTURAS_GLENN.find((l) => l.id === id)!;
const LETRA: Record<LecturaId, string> = { retrato: "A", mascara: "B", archivo: "C" };

/** Rótulos editoriales (cortos) y forma de cada documento, en el orden de los apoyos */
const ROTULOS: Record<LecturaId, { rotulo: string; forma: Forma }[]> = {
  retrato: [
    { rotulo: "Un nombre propio", forma: "ficha" },
    { rotulo: "O'Brien y Basquiat", forma: "hoja" },
    { rotulo: "«Probablemente» O'Brien", forma: "recorte" },
  ],
  mascara: [
    { rotulo: "Negra, frontal, con dientes", forma: "hoja" },
    { rotulo: "Una comparación", forma: "recorte" },
  ],
  archivo: [
    { rotulo: "Collage de fotocopias", forma: "hoja" },
    { rotulo: "Dibujos propios, copiados", forma: "ficha" },
    { rotulo: "«New Art, New Money»", forma: "tira" },
  ],
};
const LIMITES: Record<LecturaId, string> = {
  retrato: "Sin rasgos individuales",
  mascara: "Un tópico posible",
  archivo: "Ninguna declaración",
};

export const DOCUMENTOS: DocArchivo[] = (["retrato", "mascara", "archivo"] as const).flatMap((id) => {
  const l = lectura(id);
  const apoyos: DocArchivo[] = l.apoyos.map((a, i) => ({
    id: `${id}-${i + 1}`,
    lectura: id,
    clase: a.tipo,
    codigo: `${LETRA[id]}·0${i + 1}`,
    rotulo: ROTULOS[id][i].rotulo,
    texto: a.texto,
    fuente: a.fuente,
    forma: ROTULOS[id][i].forma,
  }));
  const extra: DocArchivo[] =
    id === "archivo"
      ? [
          {
            id: "archivo-procedencia",
            lectura: id,
            clase: "hecho",
            codigo: `C·0${apoyos.length + 1}`,
            rotulo: "De mano en mano",
            texto: `Procedencia: ${PROCEDENCIA_GLENN.join("; ")}.`,
            fuente: "Barbican, lista de préstamos de «Basquiat: Boom for Real» (2017)",
            forma: "tira",
          },
        ]
      : [];
  const limite: DocArchivo = {
    id: `${id}-limite`,
    lectura: id,
    clase: "limite",
    codigo: `${LETRA[id]}·0${apoyos.length + extra.length + 1}`,
    rotulo: LIMITES[id],
    texto: l.limite,
    fuente: "Valoración de MANIFESTO a partir de las fuentes citadas",
    forma: "ficha",
  };
  return [...apoyos, ...extra, limite];
});

/** Piezas gráficas de MANIFESTO: sin datos, solo materia de archivo */
export type Pieza =
  | { id: string; tipo: "letra"; letra: string; n: number }
  | { id: string; tipo: "pestana"; clase: Clase }
  | { id: string; tipo: "sello" | "contacto" | "indice" | "calco" | "ticket" | "marcas" };

export const PIEZAS: Pieza[] = [
  ..."GLENN".split("").map((letra, n) => ({ id: `letra-${n}`, tipo: "letra" as const, letra, n })),
  ...CLASES.map((c) => ({ id: `pestana-${c.id}`, tipo: "pestana" as const, clase: c.id })),
  { id: "sello", tipo: "sello" },
  { id: "contacto", tipo: "contacto" },
  { id: "indice", tipo: "indice" },
  { id: "calco", tipo: "calco" },
  { id: "ticket", tipo: "ticket" },
  { id: "marcas", tipo: "marcas" },
];

/** Lo que muestra cada lectura en la instalación (pie honesto de la escena) */
export const PIES_ARCHIVO: Record<LecturaId, string> = {
  retrato: "Las hojas componen un nombre que todavía se está armando. Arrastra para girar la composición y toca un documento con marca verde para acercarlo.",
  mascara: "Las hojas se cierran en un escudo. Arrastra sobre él para apartarlas: detrás quedan tres documentos ocultos.",
  archivo: "Los doce documentos, clasificados por su grado de certeza. Arrastra para girar el fichero y toca uno para sacarlo.",
};
