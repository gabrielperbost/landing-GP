import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "GPF",
  manifest: "/gpf/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GPF" }
};

export const viewport: Viewport = {
  themeColor: "#0d1f3c"
};

// Layout racine de /gpf : pas de <html>/<body> ici (déjà définis par le layout
// racine du site, src/app/layout.tsx). La vérification d'accès se fait dans
// (app)/layout.tsx, pas ici, pour que /gpf/login reste accessible sans boucle.
export default function GpfRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
