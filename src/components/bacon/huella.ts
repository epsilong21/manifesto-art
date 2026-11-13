/**
 * La última imagen completa de la Instalación I, copiada a un lienzo 2D para el umbral («lo que desaparece»).
 * Se copia justo después de dibujar (el búfer de WebGL no se conserva entre fotogramas).
 */
let imagen: HTMLCanvasElement | null = null;
let ultima = 0;
const avisos = new Set<() => void>();

export function guardarHuella(src: HTMLCanvasElement): void {
  const ahora = performance.now();
  if (ahora - ultima < 1200 || !src.width || !src.height) return;
  ultima = ahora;
  try {
    const w = Math.min(src.width, 720);
    const h = Math.round((src.height * w) / src.width);
    const c = imagen && imagen.width === w && imagen.height === h ? imagen : document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")?.drawImage(src, 0, 0, w, h);
    imagen = c;
    avisos.forEach((f) => f());
  } catch {
    /* sin copia: el umbral se queda solo con la huella */
  }
}

export function huella(): HTMLCanvasElement | null {
  return imagen;
}

export function alCambiarHuella(f: () => void): () => void {
  avisos.add(f);
  return () => avisos.delete(f);
}
