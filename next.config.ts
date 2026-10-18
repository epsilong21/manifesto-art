import type { NextConfig } from "next";

/**
 * Dos destinos:
 * - Servidor Node (por defecto): `next dev` y `next start`, con optimizador de
 *   imágenes y cabeceras de seguridad.
 * - GitHub Pages (`MANIFESTO_DESTINO=pages`, ver scripts/pages/): exportación
 *   estática bajo un subdirectorio, con las imágenes pregeneradas.
 */
const pages = process.env.MANIFESTO_DESTINO === "pages";
const basePath = pages ? (process.env.MANIFESTO_BASE_PATH ?? "/manifesto-art") : "";

const nextConfig: NextConfig = {
  // Next 16 no admite Cache Components (PPR) en una exportación estática
  cacheComponents: !pages,
  partialPrefetching: !pages,
  experimental: {
    // CSS en el <head>: elimina 3-4 peticiones bloqueantes en cada primera visita.
    // El CSS total es pequeño (Tailwind + estilos propios), así que compensa.
    inlineCss: true,
  },
  // Rutas a /public escritas a mano (p. ej. texturas en SVG) necesitan el prefijo
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    // «selector»: la entrada es el selector de tres obras y la navegación no ofrece otra portada
    NEXT_PUBLIC_MANIFESTO_ENTRADA: process.env.MANIFESTO_ENTRADA ?? "portada",
  },
  ...(pages
    ? {
        output: "export",
        basePath,
        // Fuera robots.ts y sitemap.ts (las únicas rutas .ts): bajo un subdirectorio no
        // sirven y la vista previa no se indexa
        pageExtensions: ["tsx"],
        // /conceptos/ → conceptos/index.html: GitHub Pages lo sirve al abrir o recargar
        trailingSlash: true,
        images: { loader: "custom", loaderFile: "./src/lib/imagenEstatica.ts", qualities: [70, 80] },
      }
    : {
        images: {
          formats: ["image/avif", "image/webp"],
          qualities: [70, 80],
        },
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
              ],
            },
          ];
        },
      }),
  turbopack: {
    // Exportación sin la pintura de Dalí: el visor ObraLectura no se usa y se sustituye
    // por un componente vacío, para que el sitio no lleve su código ni los datos del archivo.
    // Con la pintura (MANIFESTO_ELEFANTES_IMAGEN=on, ver scripts/pages/exportar.mjs) se incluye completo.
    ...(pages && process.env.MANIFESTO_ELEFANTES_IMAGEN !== "on"
      ? { resolveAlias: { "@/components/elefantes/ObraLectura": "./src/components/elefantes/ObraLecturaExcluida.tsx" } }
      : {}),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
