import { Playfair_Display, DM_Sans } from "next/font/google";

// Polices exactes du site en ligne (voir --serif / --sans dans
// maquettes/gp-finances-2026-09-22/styles.css). Chargées ici uniquement,
// appliquées via className sur le wrapper des pages locales — n'affecte
// aucune autre page du site React (qui utilise Manrope, voir src/app/layout.tsx).
export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-local-serif",
  display: "swap"
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-local-sans",
  display: "swap"
});
