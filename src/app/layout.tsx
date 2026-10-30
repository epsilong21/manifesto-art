import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Outfit } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  // Solo la usa el prototipo de La barca de Dante (fuera de las rutas): sin precarga para no penalizar el resto de
  // rutas. Con el CSS en línea, el navegador la descubre igualmente al instante.
  preload: false,
});

// Tipografía de la marca MANIFESTO (la misma de la tienda): Outfit, geométrica y sin serifas.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MANIFESTO — El arte no se contempla solamente. Se explora.",
  description:
    "MANIFESTO es una plataforma cultural para descubrir obras de arte, sus símbolos y sus historias mediante experiencias interactivas: Medusa de Caravaggio, La noche estrellada de Van Gogh, Los elefantes de Dalí, y Untitled y Glenn de Basquiat, y cinco más: El Bosco, Rubens, Bruegel y Dalí otra vez.",
  alternates: { canonical: "/" },
  // Vista previa para el cliente en GitHub Pages: fuera de los buscadores
  ...(process.env.MANIFESTO_DESTINO === "pages" ? { robots: { index: false, follow: false } } : {}),
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "MANIFESTO",
    title: "El arte no se contempla solamente. Se explora.",
    description: "Diez obras, diez experiencias interactivas para descubrir la historia del arte.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

// Marca el documento como "con JS" antes del primer pintado: con JS, el
// explorador muestra una ficha cada vez; sin JS, todas las fichas quedan visibles.
const bootScript = `document.documentElement.classList.add('js');`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${bodoni.variable} ${outfit.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
