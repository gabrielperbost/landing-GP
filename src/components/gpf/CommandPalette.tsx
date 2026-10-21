"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GPF_NAV } from "@/components/gpf/GpfSidebar";

type Item = { id: string; groupe: string; label: string; detail?: string; action: () => void };
type SearchHit = { type: "contact" | "contrat" | "affaire"; id: string; label: string; detail: string; href: string };

export function CommandPalette({ onClose, onAssistant }: { onClose: () => void; onAssistant: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const res = await fetch(`/api/gpf/recherche?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (data?.ok) setHits(data.resultats);
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const ficheContact = pathname?.match(/^\/gpf\/contacts\/([0-9a-f-]{36})/)?.[1];

  const items = useMemo<Item[]>(() => {
    const needle = q.trim().toLowerCase();
    const actions: Item[] = [
      { id: "lead", groupe: "Actions", label: "Nouveau lead", action: () => go("/gpf/contacts?nouveau=lead") },
      { id: "client", groupe: "Actions", label: "Nouveau client", action: () => go("/gpf/contacts?nouveau=client") },
      { id: "tache", groupe: "Actions", label: "Nouvelle tâche", action: () => go(ficheContact ? `/gpf/contacts/${ficheContact}?tache=1` : "/gpf/taches?nouvelle=1") },
      {
        id: "note",
        groupe: "Actions",
        label: "Nouvelle note",
        detail: ficheContact ? "sur ce contact" : "choisir un contact",
        action: () => go(ficheContact ? `/gpf/contacts/${ficheContact}?note=1` : "/gpf/contacts?note=1")
      },
      { id: "bordereau", groupe: "Actions", label: "Importer un bordereau", action: () => go("/gpf/commissions?onglet=bordereaux") },
      {
        id: "assistant",
        groupe: "Actions",
        label: "Demander à l'assistant",
        action: () => {
          onClose();
          onAssistant();
        }
      }
    ];
    const pages: Item[] = GPF_NAV.flatMap((s) => s.links).map((l) => ({ id: l.href, groupe: "Aller à", label: l.label, action: () => go(l.href) }));
    const results: Item[] = hits.map((h) => ({
      id: `${h.type}-${h.id}`,
      groupe: h.type === "contact" ? "Contacts" : h.type === "contrat" ? "Contrats" : "Affaires",
      label: h.label,
      detail: h.detail,
      action: () => go(h.href)
    }));
    const match = (i: Item) => !needle || i.label.toLowerCase().includes(needle);
    return [...results, ...actions.filter(match), ...pages.filter(match)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, hits, ficheContact]);

  useEffect(() => setIndex(0), [q, hits]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(items.length - 1, i + 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    }
    if (e.key === "Enter") items[index]?.action();
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center p-4 pt-[12vh]" onClick={onClose}>
      <div className="w-full max-w-xl bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="Rechercher un contact, un contrat, ou une action…"
          className="w-full px-4 py-3.5 text-sm border-0 border-b border-[var(--gpf-border-soft)] outline-none"
        />
        <div className="max-h-[55vh] overflow-y-auto py-1">
          {items.length === 0 ? <p className="px-4 py-6 text-sm text-center text-[var(--gpf-subtle)]">Aucun résultat.</p> : null}
          {items.map((it, i) => {
            const header = it.groupe !== lastGroup ? it.groupe : null;
            lastGroup = it.groupe;
            return (
              <div key={it.id}>
                {header ? <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-[var(--gpf-subtle)]">{header}</div> : null}
                <button
                  onMouseEnter={() => setIndex(i)}
                  onClick={it.action}
                  className={`w-full text-left px-4 py-2 flex items-center gap-3 text-sm ${i === index ? "bg-[var(--gpf-surface-alt)]" : ""}`}
                >
                  <span className="text-[var(--gpf-ink)] truncate">{it.label}</span>
                  {it.detail ? <span className="ml-auto text-xs text-[var(--gpf-subtle)] truncate">{it.detail}</span> : null}
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-[var(--gpf-border-soft)] text-[11px] text-[var(--gpf-subtle)] flex gap-4">
          <span>↑↓ pour naviguer</span>
          <span>Entrée pour ouvrir</span>
          <span>Échap pour fermer</span>
        </div>
      </div>
    </div>
  );
}
