import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], display: "swap", variable: "--font-portail-serif", weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "Mon espace — GP Finances",
  robots: { index: false, follow: false }
};
export const viewport: Viewport = { themeColor: "#071c2c" };

// Espace client GP Finances (lien magique) : distinct du CRM et de l'ancien espace client du site.
export default function PortailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-dvh bg-[#F7F6F2] text-[#071C2C] ${fraunces.variable}`}>
      <header className="bg-[#071C2C] text-white">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="tracking-[0.2em] text-sm" style={{ fontFamily: "var(--font-portail-serif)" }}>
            GP <span className="text-[#CDAA5A]">FINANCES</span>
          </span>
          <span className="text-xs text-white/60">Espace client</span>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="max-w-3xl mx-auto px-4 pb-8 text-[11px] text-[#071C2C]/50">
        GP Finances — courtier en assurance, ORIAS n° 23003789 — SIREN 899 363 907 — RCS Nanterre.
      </footer>
    </div>
  );
}
