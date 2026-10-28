/**
 * Aviso legal y derechos de reproducción de MANIFESTO.
 *
 * Texto aprobado el 27/10/2026 (secciones 1 a 8). No es una licencia ni declara
 * ninguna excepción legal.
 *
 * Los datos del responsable NO se inventan: solo figuran los confirmados por el responsable
 * (27/10/2026). Un dato que valga `null` se muestra como pendiente de confirmar.
 */

/**
 * Correo oficial (consultas, derechos de autor y reclamaciones). Cambiarlo aquí lo cambia
 * en el aviso legal y en los enlaces que lo usan; `CREDITOS.md` lo repite a mano.
 */
export const CONTACTO_LEGAL = {
  correo: "manifesto.msto@gmail.com",
};

type Dato = { valor: string | null; pendiente: string };

export const RESPONSABLE: Record<"razonSocial" | "nit" | "pais", Dato> = {
  razonSocial: { valor: "MANIFESTO S.A.S.", pendiente: "razón social" },
  nit: { valor: "901.853.982", pendiente: "NIT" },
  pais: { valor: "República de Colombia", pendiente: "país" },
};

export const ACTUALIZACION = "27 de octubre de 2026";

/** Créditos completos, fuentes y procedencia de cada imagen (copia pública del repositorio) */
export const CREDITOS_URL = "https://github.com/epsilong21/manifesto-art/blob/main/CREDITOS.md";

export const DATOS_PENDIENTES = Object.values(RESPONSABLE).filter((d) => d.valor === null).length;

export const SECCIONES_AVISO = [
  { id: "naturaleza", n: "1", titulo: "Naturaleza y finalidad del proyecto" },
  { id: "titularidad", n: "2", titulo: "Obras de arte y titularidad de derechos" },
  { id: "reproducciones", n: "3", titulo: "Uso editorial y educativo de las reproducciones" },
  { id: "experiencias", n: "4", titulo: "Experiencias interactivas de MANIFESTO" },
  { id: "creditos", n: "5", titulo: "Créditos y fuentes" },
  { id: "reclamaciones", n: "6", titulo: "Consultas y reclamaciones de derechos" },
  { id: "responsable", n: "7", titulo: "Responsable editorial" },
  { id: "actualizacion", n: "8", titulo: "Actualización" },
  { id: "obras", n: "Anexo", titulo: "Las cinco obras: créditos y situación" },
] as const;
