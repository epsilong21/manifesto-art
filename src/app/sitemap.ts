import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const RUTAS = ["", "/conceptos", "/conceptos/medusa", "/conceptos/noche-estrellada", "/conceptos/los-elefantes"];

export default function sitemap(): MetadataRoute.Sitemap {
  return RUTAS.map((r) => ({ url: `${SITE_URL}${r}`, changeFrequency: "monthly", priority: r ? 0.8 : 1 }));
}
