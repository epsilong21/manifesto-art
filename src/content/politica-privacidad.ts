/**
 * Política de tratamiento de datos personales de MANIFESTO S.A.S.
 *
 * Marco: Ley 1581 de 2012 y Decreto 1074 de 2015 (compila el Decreto 1377 de 2013; el
 * contenido mínimo de la política está en su art. 2.2.2.25.3.1). Describe solo lo que el
 * sitio hace realmente: sin cookies, analítica, formularios ni almacenamiento en el
 * navegador; los datos personales llegan por correo electrónico.
 *
 * La razón social, el NIT, la dirección de contacto, el teléfono, el país y el correo vienen
 * del aviso legal (una sola fuente). La dirección es la de contacto: no se afirma que sea el
 * domicilio social inscrito.
 */

/**
 * Fecha real de publicación de la política. Si se publica otro día, corregirla antes del
 * despliegue: nunca una fecha anterior a la publicación.
 */
export const ENTRADA_EN_VIGENCIA = "28 de octubre de 2026";

/** Área que atiende las consultas y reclamos (a través del correo oficial, CONTACTO_LEGAL) */
export const AREA_ATENCION = "Atención de consultas y reclamos de MANIFESTO S.A.S.";

/** Fuentes verificadas de lo que se dice sobre los proveedores externos */
export const PROVEEDORES = {
  githubPages: "https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection",
  githubPrivacidad: "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
  shopifyPrivacidad: "https://www.shopify.com/legal/privacy",
  googlePrivacidad: "https://policies.google.com/privacy?hl=es",
};

export const SECCIONES_POLITICA = [
  { id: "responsable", n: "1", titulo: "Responsable del tratamiento" },
  { id: "marco", n: "2", titulo: "Alcance y marco normativo" },
  { id: "datos", n: "3", titulo: "Qué datos trata MANIFESTO" },
  { id: "finalidades", n: "4", titulo: "Finalidades del tratamiento" },
  { id: "autorizacion", n: "5", titulo: "Autorización" },
  { id: "gestion", n: "6", titulo: "Cómo se gestionan y conservan" },
  { id: "proveedores", n: "7", titulo: "Proveedores externos" },
  { id: "derechos", n: "8", titulo: "Derechos de los titulares" },
  { id: "atencion", n: "9", titulo: "Área responsable de la atención" },
  { id: "procedimiento", n: "10", titulo: "Consultas y reclamos: procedimiento y plazos" },
  { id: "vigencia", n: "11", titulo: "Vigencia y cambios" },
] as const;
