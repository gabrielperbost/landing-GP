import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gpf-serif",
  weight: ["500", "600"]
});

export const metadata: Metadata = {
  title: "GPF",
  manifest: "/gpf/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GPF" }
};

export const viewport: Viewport = {
  themeColor: "#071c2c"
};

// Layout racine de /gpf : pas de <html>/<body> ici (déjà définis par le layout
// racine du site, src/app/layout.tsx). La vérification d'accès se fait dans
// (app)/layout.tsx, pas ici, pour que /gpf/login reste accessible sans boucle.
// La police serif (titres, identité GP Finances) est posée ici pour couvrir
// aussi bien le login que l'app : voir --font-gpf-serif.
export default function GpfRootLayout({ children }: { children: React.ReactNode }) {
  return <div className={fraunces.variable}>{children}</div>;
}
