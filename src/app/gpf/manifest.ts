import type { MetadataRoute } from "next";

// Permet d'installer GPF sur l'écran d'accueil du téléphone (PWA), sans App Store.
// Icônes reprises du site pour démarrer vite ; à remplacer par une icône GPF dédiée
// quand elle existera.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GPF",
    short_name: "GPF",
    description: "CRM interne de GP Finances",
    start_url: "/gpf/dossiers",
    scope: "/gpf",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#0d1f3c",
    icons: [
      { src: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512x512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
