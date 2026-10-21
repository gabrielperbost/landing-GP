"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SkeletonLines } from "@/components/gpf/Skeleton";

type Item = {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  raisons: string[];
  suggestion: { prenom: string; nom: string };
};

export default function GpfNomsACorrigerPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/gpf/noms-a-corriger");
    const data = await res.json();
    if (data.ok) setItems(data.clients);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl text-[var(--gpf-ink)]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
          Noms à corriger
        </h1>
        <p className="text-sm text-[var(--gpf-muted)] mt-1">
          Noms mal importés (« ? », caractères parasites, prénom et nom inversés…). Une correction est proposée : vérifiez-la, modifiez-la si
          besoin, puis appliquez. Rien n&apos;est modifié sans votre clic.
        </p>
      </div>

      {loading ? (
        <SkeletonLines rows={8} />
      ) : items.length === 0 ? (
        <p className="text-sm text-[#2f9e6e]">Aucun nom suspect détecté.</p>
      ) : (
        <>
          <p className="text-xs text-[var(--gpf-subtle)]">{items.length} fiche{items.length > 1 ? "s" : ""} à vérifier</p>
          <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-hidden">
            {items.map((item) => (
              <NameRow key={item.id} item={item} onDone={(id) => setItems((prev) => prev.filter((i) => i.id !== id))} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NameRow({ item, onDone }: { item: Item; onDone: (id: string) => void }) {
  const [prenom, setPrenom] = useState(item.suggestion.prenom);
  const [nom, setNom] = useState(item.suggestion.nom);
  const [saving, setSaving] = useState(false);

  const apply = async () => {
    setSaving(true);
    const res = await fetch(`/api/gpf/contacts/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenom: prenom.trim(), nom: nom.trim().toUpperCase() })
    });
    setSaving(false);
    if (res.ok) onDone(item.id);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 border-b border-[var(--gpf-border-soft)] last:border-0">
      <div className="md:w-64 shrink-0">
        <Link href={`/gpf/contacts/${item.id}`} className="text-sm text-[var(--gpf-muted)] hover:underline">
          Actuel : <span className="font-mono text-[var(--gpf-ink)]">«&nbsp;{item.prenom}&nbsp;» «&nbsp;{item.nom}&nbsp;»</span>
        </Link>
        <div className="flex flex-wrap gap-1 mt-1">
          {item.raisons.map((r) => (
            <span key={r} className="text-[10px] font-medium text-[#c98a1f] bg-[var(--gpf-warning-tint)] rounded-full px-2 py-0.5">
              {r}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-1">
        <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" className="rounded-md border border-[var(--gpf-border)] px-2 py-1.5 text-sm flex-1 min-w-0" />
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="NOM" className="rounded-md border border-[var(--gpf-border)] px-2 py-1.5 text-sm flex-1 min-w-0" />
        <button
          onClick={() => {
            setPrenom(nom.charAt(0) + nom.slice(1).toLowerCase());
            setNom(prenom.toUpperCase());
          }}
          title="Inverser prénom et nom"
          className="text-[var(--gpf-muted)] hover:bg-[var(--gpf-fill)] rounded-lg w-8 h-8 flex items-center justify-center shrink-0"
        >
          ⇄
        </button>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onDone(item.id)} className="text-xs text-[var(--gpf-subtle)] hover:text-[var(--gpf-muted)]">
          Ignorer
        </button>
        <button
          onClick={apply}
          disabled={saving || !prenom.trim() || !nom.trim()}
          className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-1.5 disabled:opacity-40"
        >
          {saving ? "..." : "Appliquer"}
        </button>
      </div>
    </div>
  );
}
