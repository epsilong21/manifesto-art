/**
 * Relevo entre lienzos animados de la página (hero, explorador, laboratorio y
 * La ventana): si varios están a la vista, solo anima el que más se ve. Nunca
 * hay dos bucles a la vez. Cada lienzo publica aquí su fracción visible.
 */
export const visibles = new Map<symbol, number>();
export const esPrincipal = (id: symbol) => {
  const mio = visibles.get(id) ?? 0;
  if (mio <= 0) return false;
  for (const [otro, r] of visibles) if (otro !== id && r > mio) return false;
  return true;
};
