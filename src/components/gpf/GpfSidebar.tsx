"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; label: string; exact?: boolean };

export const GPF_NAV: { titre: string; links: NavLink[] }[] = [
  {
    titre: "Activité",
    links: [
      { href: "/gpf", label: "Tableau de bord", exact: true },
      { href: "/gpf/contacts", label: "Contacts" },
      { href: "/gpf/contrats", label: "Contrats" }
    ]
  },
  {
    titre: "Commercial",
    links: [
      { href: "/gpf/commercial", label: "Commercial" },
      { href: "/gpf/leads", label: "Leads" },
      { href: "/gpf/campagnes", label: "Campagnes" },
      { href: "/gpf/taches", label: "Tâches" },
      { href: "/gpf/agenda", label: "Agenda" }
    ]
  },
  {
    titre: "Gestion",
    links: [
      { href: "/gpf/commissions", label: "Commissions" },
      { href: "/gpf/reporting", label: "Reporting" },
      { href: "/gpf/assistant", label: "Assistant IA" }
    ]
  },
  {
    titre: "Cabinet",
    links: [
      { href: "/gpf/conformite", label: "Conformité" },
      { href: "/gpf/courriers", label: "Courriers" },
      { href: "/gpf/coffre-fort", label: "Coffre-fort" },
      { href: "/gpf/apporteurs", label: "Apporteurs" },
      { href: "/gpf/compagnies", label: "Compagnies" },
      { href: "/gpf/qualite", label: "Qualité des données" },
      { href: "/gpf/corbeille", label: "Corbeille" },
      { href: "/gpf/activite", label: "Journal d'activité" },
      { href: "/gpf/parametres", label: "Paramètres" }
    ]
  }
];

const QUALITE = ["/gpf/qualite", "/gpf/donnees-incompletes", "/gpf/doublons", "/gpf/noms-a-corriger"];

export function isNavActive(pathname: string | null, link: NavLink) {
  if (!pathname) return false;
  if (link.href === "/gpf/qualite") return QUALITE.some((p) => pathname.startsWith(p));
  return link.exact ? pathname === link.href : pathname.startsWith(link.href);
}

/** Menu latéral (bleu nuit dans les deux thèmes). */
export function GpfSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col h-full bg-[#071C2C] text-white">
      <div className="px-5 py-6">
        <span className="text-lg tracking-tight" style={{ fontFamily: "var(--font-gpf-serif)" }}>
          GP Finances
        </span>
        <div className="h-px w-8 bg-[#CDAA5A] mt-2" />
      </div>
      <nav className="flex-1 flex flex-col gap-4 px-3 pb-6 overflow-y-auto">
        {GPF_NAV.map((section) => (
          <div key={section.titre} className="flex flex-col gap-0.5">
            <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-white/35">{section.titre}</div>
            {section.links.map((link) => {
              const active = isNavActive(pathname, link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors border-l-2 ${
                    active ? "bg-white/5 text-[#CDAA5A] font-semibold border-[#CDAA5A]" : "text-[#9aa7b4] border-transparent hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
