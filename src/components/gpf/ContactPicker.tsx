"use client";
import { useEffect, useState } from "react";

type Hit = { type: string; id: string; label: string; detail: string };

/** Recherche et sélection d'un contact (pour rattacher une tâche ou un rendez-vous). */
export function ContactPicker({ value, onChange }: { value: { id: string; label: string } | null; onChange: (v: { id: string; label: string } | null) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/gpf/recherche?q=${encodeURIComponent(q.trim())}`).then((x) => x.json()).catch(() => null);
      setHits((r?.resultats ?? []).filter((h: Hit) => h.type === "contact"));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
        <span className="text-[var(--gpf-ink)]">{value.label}</span>
        <button type="button" onClick={() => onChange(null)} className="text-xs text-[var(--gpf-muted)]">
          Changer
        </button>
      </div>
    );
  }
  return (
    <div className="relative">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un contact (facultatif)…" className="rounded-lg border px-3 py-2 text-sm w-full" />
      {hits.length ? (
        <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {hits.map((h) => (
            <button
              type="button"
              key={h.id}
              onClick={() => {
                onChange({ id: h.id, label: h.label });
                setQ("");
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--gpf-surface-alt)]"
            >
              <span className="text-[var(--gpf-ink)]">{h.label}</span>
              {h.detail ? <span className="text-xs text-[var(--gpf-subtle)] ml-2">{h.detail}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
