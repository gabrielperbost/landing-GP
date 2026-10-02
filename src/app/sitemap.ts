import type { MetadataRoute } from "next";
import { CITIES_92 } from "@/content/localSeo92";
import { VILLES } from "@/content/villes";
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
      // Ancienne adresse du hub : /assurance-de-pret/hauts-de-seine (301 vers la nouvelle,
      // voir next.config.mjs). Mise à jour le 2026-10-01 lors de la migration des pages villes.
      url: `${BASE_URL}/assurance-emprunteur/hauts-de-seine`,
      lastModified: new Date("2026-10-01"),
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      // Hub des 20 arrondissements de Paris, ajouté le 2026-10-02 (voir scripts/build-site.cjs).
      url: `${BASE_URL}/assurance-emprunteur/paris`,
      lastModified: new Date("2026-10-02"),
      changeFrequency: "weekly",
      priority: 0.9
    },
    ...CITIES_92.map((city) => ({
      url: `${BASE_URL}/assurance-emprunteur/${city.slug}`,
      lastModified: new Date("2026-10-01"),
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    // Les 20 arrondissements de Paris (VILLES contient aussi les communes du 92, déjà listées
    // ci-dessus via CITIES_92 : on ne garde ici que departement === "75").
    ...VILLES.filter((v) => v.departement === "75").map((v) => ({
      url: `${BASE_URL}/assurance-emprunteur/${v.slug}`,
      lastModified: new Date("2026-10-02"),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
