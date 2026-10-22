import { NextResponse } from "next/server";

export const dynamic = "force-static";

// Fichier d'installation de GPF sur l'écran d'accueil (application web, sans App Store).
// Servi par une route : un manifest.ts n'est pris en compte par Next qu'à la racine de l'app.
export function GET() {
  return NextResponse.json(
    {
      name: "GPF — GP Finances",
      short_name: "GPF",
      description: "CRM interne de GP Finances",
      id: "/gpf",
      start_url: "/gpf",
      scope: "/gpf",
      display: "standalone",
      orientation: "any",
      background_color: "#071C2C",
      theme_color: "#071C2C",
      lang: "fr",
      icons: [
        { src: "/gpf/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/gpf/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/gpf/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
      ]
    },
    { headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" } }
  );
}
