import type { Metadata, Viewport } from "next";
import { Archivo, Bodoni_Moda } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  // Sin uso en las rutas actuales (estilos .display heredados): sin precarga para no penalizar el resto de
  // rutas. Con el CSS en línea, el navegador la descubre igualmente al instante.
  preload: false,
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MANIFESTO — El arte no se contempla solamente. Se explora.",
  description:
    "MANIFESTO es una plataforma cultural para descubrir obras de arte, sus símbolos y sus historias mediante experiencias interactivas: Medusa de Caravaggio, La noche estrellada de Van Gogh y Los elefantes de Dalí.",
  alternates: { canonical: "/" },
  // Vista previa para el cliente en GitHub Pages: fuera de los buscadores
  ...(process.env.MANIFESTO_DESTINO === "pages" ? { robots: { index: false, follow: false } } : {}),
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "El arte no se contempla solamente. Se explora.",
    description: "Tres obras, tres experiencias interactivas para descubrir la historia del arte.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0b0d",
  colorScheme: "dark",
};

// Marca el documento como "con JS" antes del primer pintado: con JS, el
// explorador muestra una ficha cada vez; sin JS, todas las fichas quedan visibles.
const bootScript = `document.documentElement.classList.add('js');`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${bodoni.variable} ${archivo.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
