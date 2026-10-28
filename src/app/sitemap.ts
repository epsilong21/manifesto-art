import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const RUTAS = ["", "/conceptos", "/conceptos/medusa", "/conceptos/noche-estrellada", "/conceptos/los-elefantes", "/conceptos/basquiat-untitled", "/conceptos/glenn", "/conceptos/ascension-al-empireo", "/conceptos/el-descendimiento-de-la-cruz", "/conceptos/la-loca-meg", "/conceptos/los-siete-pecados-capitales", "/aviso-legal", "/politica-de-privacidad"];

export default function sitemap(): MetadataRoute.Sitemap {
  return RUTAS.map((r) => ({ url: `${SITE_URL}${r}`, changeFrequency: "monthly", priority: r ? 0.8 : 1 }));
}
