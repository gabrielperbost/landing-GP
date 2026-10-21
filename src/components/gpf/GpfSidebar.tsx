"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavLink = { href: string; label: string; exact?: boolean };

const SECTIONS: { titre?: string; links: NavLink[] }[] = [
  {
    links: [
      { href: "/gpf", label: "Tableau de bord", exact: true },
      { href: "/gpf/dossiers", label: "Dossiers" },
      { href: "/gpf/clients", label: "Clients" }
    ]
  },
  {
    titre: "Qualité des données",
    links: [
      { href: "/gpf/donnees-incompletes", label: "Données incomplètes" },
      { href: "/gpf/doublons", label: "Doublons" },
      { href: "/gpf/noms-a-corriger", label: "Noms à corriger" }
    ]
  },
  {
    titre: "Cabinet",
    links: [
      { href: "/gpf/corbeille", label: "Corbeille" },
      { href: "/gpf/activite", label: "Journal d'activité" }
    ]
  }
];

const ALL_LINKS = SECTIONS.flatMap((s) => s.links);

function isActive(pathname: string | null, link: NavLink) {
  if (!pathname) return false;
  return link.exact ? pathname === link.href : pathname.startsWith(link.href);
}

export function GpfSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/gpf/auth", { method: "DELETE" });
    router.replace("/gpf/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop : sidebar fixe à gauche */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:h-dvh md:sticky md:top-0 bg-[#071C2C] text-white">
        <div className="px-5 py-6">
          <span className="text-lg tracking-tight" style={{ fontFamily: "var(--font-gpf-serif)" }}>
            GP Finances
          </span>
          <div className="h-px w-8 bg-[#CDAA5A] mt-2" />
        </div>
        <nav className="flex-1 flex flex-col gap-4 px-3 overflow-y-auto">
          {SECTIONS.map((section, i) => (
            <div key={section.titre ?? i} className="flex flex-col gap-1">
              {section.titre ? <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-white/35">{section.titre}</div> : null}
              {section.links.map((link) => {
                const active = isActive(pathname, link);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-2 text-sm transition-colors border-l-2 ${
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
        <div className="p-3">
          <button
            onClick={logout}
            className="w-full rounded-lg border border-white/15 px-3 py-2 text-xs text-white/80 hover:bg-white/5 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile : barre horizontale en haut, défilable */}
      <header className="md:hidden sticky top-0 z-10 bg-[#071C2C] text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="tracking-tight" style={{ fontFamily: "var(--font-gpf-serif)" }}>
            GP Finances
          </span>
          <button onClick={logout} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80">
            Déconnexion
          </button>
        </div>
        <nav className="flex gap-4 mt-3 overflow-x-auto -mx-4 px-4 pb-1">
          {ALL_LINKS.map((link) => {
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm whitespace-nowrap ${active ? "text-[#CDAA5A] font-semibold" : "text-[#9aa7b4]"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
