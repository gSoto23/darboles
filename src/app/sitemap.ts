import type { MetadataRoute } from "next";

const PUBLIC_PATHS = ["", "regalos", "empresas", "nosotros", "mapa", "contacto"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `https://darboles.com/${path}`,
  }));
}
