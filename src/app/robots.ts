import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/espace-client/", "/depot/", "/previews/", "/tarificateur-gp/", "/site/pages/", "/estimation-assurance-pret", "/webinaire-per/desinscription"]
    },
    sitemap: "https://gp-finances.fr/sitemap.xml",
    host: "https://gp-finances.fr"
  };
}
