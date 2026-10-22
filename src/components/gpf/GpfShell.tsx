"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GPF_NAV, GpfSidebar } from "@/components/gpf/GpfSidebar";
import { CommandPalette } from "@/components/gpf/CommandPalette";
import { AssistantPanel } from "@/components/gpf/AssistantPanel";

type ShellContext = {
  setPageTitle: (title: string | null) => void;
  openAssistant: (contexte?: string) => void;
  openPalette: () => void;
};
const Ctx = createContext<ShellContext | null>(null);

/** Donne le libellé de la page courante au fil d'Ariane (ex. nom du contact). */
export function usePageTitle(title: string | null | undefined) {
  const ctx = useContext(Ctx);
  useEffect(() => {
    ctx?.setPageTitle(title ?? null);
    return () => ctx?.setPageTitle(null);
  }, [ctx, title]);
}

export function useGpfShell() {
  return useContext(Ctx);
}

const LABELS: Record<string, string> = Object.fromEntries(GPF_NAV.flatMap((s) => s.links).map((l) => [l.href.split("/").pop()!, l.label]));
Object.assign(LABELS, {
  "donnees-incompletes": "Données incomplètes",
  doublons: "Doublons",
  "noms-a-corriger": "Noms à corriger"
});

export function GpfShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const [assistant, setAssistant] = useState<{ open: boolean; contexte?: string }>({ open: false });

  const openAssistant = useCallback((contexte?: string) => setAssistant({ open: true, contexte }), []);
  const openPalette = useCallback(() => setPalette(true), []);

  // Raccourci ⌘K / Ctrl+K partout dans le CRM.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  // Fil d'Ariane : GP Finances / Section / Fiche
  const segments = (pathname ?? "").split("/").filter(Boolean).slice(1);
  const crumbs: { label: string; href?: string }[] = [{ label: "GP Finances", href: "/gpf" }];
  if (segments.length === 0) crumbs.push({ label: "Tableau de bord" });
  segments.forEach((seg, i) => {
    const last = i === segments.length - 1;
    crumbs.push({
      label: LABELS[seg] ?? pageTitle ?? "Fiche",
      href: last ? undefined : "/gpf/" + segments.slice(0, i + 1).join("/")
    });
  });

  return (
    <Ctx.Provider value={{ setPageTitle, openAssistant, openPalette }}>
      <div className="min-h-dvh md:flex bg-[var(--gpf-bg)]">
        <aside className="hidden md:block md:w-56 md:shrink-0 md:h-dvh md:sticky md:top-0">
          <GpfSidebar />
        </aside>

        {drawer ? (
          <div className="md:hidden fixed inset-0 z-40 flex" onClick={() => setDrawer(false)}>
            <div className="w-64 h-full" onClick={(e) => e.stopPropagation()}>
              <GpfSidebar onNavigate={() => setDrawer(false)} />
            </div>
            <div className="flex-1 bg-black/40" />
          </div>
        ) : null}

        <div className="flex-1 min-w-0 flex">
          <div className="flex-1 min-w-0">
            <header className="sticky top-0 z-30 bg-[var(--gpf-bg)] border-b border-[var(--gpf-border-soft)]" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
              <div className="flex items-center gap-2 px-4 md:px-8 h-14">
                <button onClick={() => setDrawer(true)} className="md:hidden text-[var(--gpf-ink)] w-9 h-9 -ml-2 flex items-center justify-center" aria-label="Ouvrir le menu">
                  ☰
                </button>
                <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-[var(--gpf-subtle)] min-w-0 flex-1 truncate">
                  {crumbs.map((c, i) => (
                    <span key={i} className="flex items-center gap-1.5 min-w-0">
                      {i > 0 ? <span>/</span> : null}
                      {c.href ? (
                        <Link href={c.href} className="hover:text-[var(--gpf-ink)] truncate">
                          {c.label}
                        </Link>
                      ) : (
                        <span className="text-[var(--gpf-ink)] font-medium truncate">{c.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
                <button
                  onClick={() => setPalette(true)}
                  className="hidden sm:flex items-center gap-2 rounded-lg border border-[var(--gpf-border)] bg-[var(--gpf-surface)] px-3 py-1.5 text-xs text-[var(--gpf-subtle)] w-56"
                >
                  <span>Rechercher…</span>
                  <span className="ml-auto rounded border border-[var(--gpf-border)] px-1">⌘K</span>
                </button>
                <button onClick={() => setPalette(true)} className="sm:hidden w-9 h-9 flex items-center justify-center text-[var(--gpf-ink)]" aria-label="Rechercher">
                  ⌕
                </button>
                <NotificationBell />
                <button
                  onClick={() => openAssistant()}
                  className="hidden sm:block rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-1.5 whitespace-nowrap"
                >
                  Demander à l&apos;assistant
                </button>
                <UserMenu onAssistant={() => openAssistant()} />
              </div>
            </header>
            <main className="p-4 md:p-8 max-w-6xl mx-auto w-full">{children}</main>
          </div>

          {assistant.open ? (
            <AssistantPanel contexte={assistant.contexte} pathname={pathname ?? ""} pageTitle={pageTitle} onClose={() => setAssistant({ open: false })} />
          ) : null}
        </div>

        {palette ? <CommandPalette onClose={() => setPalette(false)} onAssistant={() => openAssistant()} /> : null}
      </div>
    </Ctx.Provider>
  );
}

type Notification = { id: string; type: string; titre: string; message: string | null; lien: string | null; lu: boolean; created_at: string };

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const vues = useRef<Set<string> | null>(null);
  const load = useCallback(async () => {
    const res = await fetch("/api/gpf/notifications").catch(() => null);
    const data = await res?.json().catch(() => null);
    if (data?.ok) {
      setItems(data.items);
      setNonLues(data.nonLues);
      // Notifications du navigateur (option des Paramètres) pour les nouveautés non lues.
      const nouvelles = (data.items as Notification[]).filter((n) => !n.lu && vues.current && !vues.current.has(n.id));
      vues.current = new Set((data.items as Notification[]).map((n) => n.id));
      let actif = false;
      try {
        actif = localStorage.getItem("gpf-notif-navigateur") === "1";
      } catch {
        actif = false;
      }
      if (actif && typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
        for (const n of nouvelles.slice(0, 3)) new window.Notification(n.titre, { body: n.message ?? undefined });
      }
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const markRead = async (id?: string) => {
    await fetch("/api/gpf/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { tout: true }) });
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative w-9 h-9 flex items-center justify-center text-[var(--gpf-ink)]" aria-label="Notifications">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {nonLues > 0 ? (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#b3463f] text-white text-[10px] leading-4 text-center">{nonLues > 99 ? "99+" : nonLues}</span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 w-80 max-h-[70vh] overflow-y-auto bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gpf-border-soft)]">
            <span className="text-sm font-semibold text-[var(--gpf-ink)]">Notifications</span>
            {nonLues > 0 ? (
              <button onClick={() => markRead()} className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
                Tout marquer comme lu
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-[var(--gpf-subtle)]">Aucune notification.</p>
          ) : (
            items.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-[var(--gpf-border-soft)] last:border-0 ${n.lu ? "" : "bg-[var(--gpf-surface-alt)]"}`}>
                <div className="flex items-start gap-2">
                  {!n.lu ? <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#CDAA5A] shrink-0" /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[var(--gpf-ink)]">{n.titre}</div>
                    {n.message ? <div className="text-xs text-[var(--gpf-muted)] mt-0.5">{n.message}</div> : null}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-[var(--gpf-subtle)]">
                        {new Date(n.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {n.lien ? (
                        <button
                          onClick={() => {
                            markRead(n.id);
                            setOpen(false);
                            router.push(n.lien!);
                          }}
                          className="text-[11px] font-medium text-[var(--gpf-ink)] underline"
                        >
                          Voir la fiche
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

const THEMES = [
  ["system", "Système"],
  ["light", "Clair"],
  ["dark", "Sombre"]
] as const;

function UserMenu({ onAssistant }: { onAssistant: () => void }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<string>("system");
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(document.getElementById("gpf-root")?.getAttribute("data-theme") ?? "system");
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const applyTheme = (t: string) => {
    setTheme(t);
    document.getElementById("gpf-root")?.setAttribute("data-theme", t);
    try {
      localStorage.setItem("gpf-theme", t);
    } catch {
      // stockage indisponible : le thème vaudra pour cette visite seulement
    }
  };

  const logout = async () => {
    await fetch("/api/gpf/auth", { method: "DELETE" });
    router.replace("/gpf/login");
    router.refresh();
  };

  const item = "w-full text-left px-4 py-2 text-sm text-[var(--gpf-ink)] hover:bg-[var(--gpf-surface-alt)]";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-[#071C2C] text-[#CDAA5A] text-xs font-semibold flex items-center justify-center ring-1 ring-[#CDAA5A]/40"
        aria-label="Menu utilisateur"
      >
        GP
      </button>
      {open ? (
        <div className="absolute right-0 top-11 w-56 bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl shadow-xl z-50 py-1">
          <div className="px-4 py-2 border-b border-[var(--gpf-border-soft)]">
            <div className="text-sm font-semibold text-[var(--gpf-ink)]">Gabriel PERBOST</div>
            <div className="text-xs text-[var(--gpf-subtle)]">Courtier · GP Finances</div>
          </div>
          <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-[var(--gpf-subtle)]">Thème</div>
          <div className="flex gap-1 px-3 pb-2">
            {THEMES.map(([key, label]) => (
              <button
                key={key}
                onClick={() => applyTheme(key)}
                className={`flex-1 rounded-md px-2 py-1 text-xs ${theme === key ? "bg-[#CDAA5A] text-[#071c2c] font-semibold" : "text-[var(--gpf-muted)] border border-[var(--gpf-border)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onAssistant();
            }}
            className={`${item} sm:hidden`}
          >
            Demander à l&apos;assistant
          </button>
          <Link href="/gpf/parametres" onClick={() => setOpen(false)} className={`block ${item}`}>
            Paramètres
          </Link>
          <Link href="/gpf/aide" onClick={() => setOpen(false)} className={`block ${item}`}>
            Aide
          </Link>
          <button onClick={logout} className={`${item} text-[#b3463f]`}>
            Déconnexion
          </button>
        </div>
      ) : null}
    </div>
  );
}
