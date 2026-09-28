import type { MetadataRoute } from "next";
import { CITIES_92 } from "@/content/localSeo92";
import siteRoutes from "../../public/site/routes.json";

const BASE_URL = "https://gp-finances.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  // Date de dernière mise à jour réelle du contenu (à modifier quand le contenu change), et non « maintenant ».
  const now = new Date("2026-09-24");

  // Conseils : uniquement les pages réellement construites (articles publiés).
  const blog = Object.values(siteRoutes as Record<string, string>).filter((route) => route.startsWith("/conseils"));

  return [
    ...blog.map((route) => ({ url: `${BASE_URL}${route}`, lastModified: now, changeFrequency: "monthly" as const, priority: route === "/conseils" ? 0.8 : 0.7 })),
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/assurance-emprunteur`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${BASE_URL}/per-retraite`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/assurance-vie`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/prevoyance`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/mutuelle`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/regroupement-credits`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/webinaire-per`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/nous-trouver`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/politique-de-confidentialite`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${BASE_URL}/assurance-de-pret/hauts-de-seine`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...CITIES_92.map((city) => ({
      url: `${BASE_URL}/assurance-de-pret/hauts-de-seine/${city.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
