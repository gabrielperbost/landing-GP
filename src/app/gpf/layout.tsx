import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import "./gpf.css";

// Applique le thème mémorisé (système / clair / sombre) avant le premier
// affichage, pour éviter un flash de la mauvaise couleur.
const THEME_SCRIPT = `try{var t=localStorage.getItem("gpf-theme");if(t==="light"||t==="dark"||t==="system")document.currentScript.parentElement.setAttribute("data-theme",t)}catch(e){}`;

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
  return (
    <div id="gpf-root" data-theme="system" className={`gpf-root min-h-dvh ${fraunces.variable}`} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {children}
    </div>
  );
}
