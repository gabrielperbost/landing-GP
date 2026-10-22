"use client";
import { useState } from "react";
import Link from "next/link";
import { GPF_PRODUIT_LABEL, GPF_PRODUITS, GPF_PROVENANCES, GPF_SCORE_LABEL, GPF_TYPE_CONTACT_LABEL } from "@/lib/gpf/types";

/** Panneau latéral de création d'un lead ou d'un client, avec contrôle de doublon. */
export function NewContactPanel({ mode, onClose, onCreated }: { mode: "lead" | "client"; onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({
    civilite: "",
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    type_contact: "particulier",
    raison_sociale: "",
    provenance: "",
    score: mode === "lead" ? "tiede" : "",
    produit: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [doublon, setDoublon] = useState<{ id: string; prenom: string; nom: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (forcer = false) => {
    setSaving(true);
    setErreur(null);
    const { produit, ...contact } = form;
    const res = await fetch("/api/gpf/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contact, lead: mode === "lead", forcer })
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409 && data.existant) {
      setDoublon(data.existant);
      setSaving(false);
      return;
    }
    if (!data.ok) {
      setErreur("La création a échoué.");
      setSaving(false);
      return;
    }
    // Produit d'intérêt renseigné : on ouvre directement l'affaire correspondante.
    if (produit) {
      await fetch(`/api/gpf/clients/${data.client.id}/dossiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produit, source: form.provenance || undefined })
      });
    }
    onCreated(data.client.id);
  };

  const field = (label: string, el: React.ReactNode) => (
    <label className="text-xs text-[var(--gpf-muted)] flex flex-col gap-1">
      {label}
      {el}
    </label>
  );
  const input = "rounded-lg border px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="bg-[var(--gpf-surface)] w-full max-w-md h-full overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--gpf-border-soft)] sticky top-0 bg-[var(--gpf-surface)]">
          <h3 className="text-base font-semibold text-[var(--gpf-ink)]">{mode === "lead" ? "Nouveau lead" : "Nouveau client"}</h3>
          <button type="button" onClick={onClose} className="text-[var(--gpf-muted)] w-8 h-8">
            ✕
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="grid grid-cols-[90px_1fr_1fr] gap-2">
            {field(
              "Civilité",
              <select value={form.civilite} onChange={set("civilite")} className={input}>
                <option value="">—</option>
                <option>Madame</option>
                <option>Monsieur</option>
              </select>
            )}
            {field("Prénom", <input required value={form.prenom} onChange={set("prenom")} className={input} />)}
            {field("Nom", <input required value={form.nom} onChange={set("nom")} className={input} />)}
          </div>
          {field("E-mail", <input type="email" value={form.email} onChange={set("email")} className={input} />)}
          {field("Téléphone", <input type="tel" value={form.telephone} onChange={set("telephone")} className={input} />)}
          <div className="grid grid-cols-2 gap-2">
            {field(
              "Type",
              <select value={form.type_contact} onChange={set("type_contact")} className={input}>
                {Object.entries(GPF_TYPE_CONTACT_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            )}
            {field(
              "Provenance",
              <select value={form.provenance} onChange={set("provenance")} className={input}>
                <option value="">—</option>
                {GPF_PROVENANCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            )}
          </div>
          {form.type_contact === "entreprise" ? field("Raison sociale", <input value={form.raison_sociale} onChange={set("raison_sociale")} className={input} />) : null}
          <div className="grid grid-cols-2 gap-2">
            {field(
              "Produit d'intérêt",
              <select value={form.produit} onChange={set("produit")} className={input}>
                <option value="">—</option>
                {GPF_PRODUITS.map((p) => (
                  <option key={p} value={p}>
                    {GPF_PRODUIT_LABEL[p]}
                  </option>
                ))}
              </select>
            )}
            {mode === "lead"
              ? field(
                  "Score",
                  <select value={form.score} onChange={set("score")} className={input}>
                    {Object.entries(GPF_SCORE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                )
              : null}
          </div>
          {field("Notes", <textarea value={form.notes} onChange={set("notes")} rows={3} className={input} />)}
          <p className="text-[11px] text-[var(--gpf-subtle)]">Ne saisissez aucune information médicale dans les notes.</p>

          {doublon ? (
            <div className="rounded-lg px-3 py-2.5 bg-[var(--gpf-warning-tint)] text-sm text-[var(--gpf-ink)]">
              Un contact existe déjà avec cet e-mail ou ce téléphone :{" "}
              <Link href={`/gpf/contacts/${doublon.id}`} className="underline font-medium">
                {doublon.prenom} {doublon.nom.toUpperCase()}
              </Link>
              .
              <div className="mt-2 flex gap-2">
                <Link href={`/gpf/contacts/${doublon.id}`} className="text-xs rounded-full bg-[#CDAA5A] text-[#071c2c] font-semibold px-3 py-1">
                  Ouvrir sa fiche
                </Link>
                <button type="button" onClick={() => submit(true)} className="text-xs rounded-full border border-[var(--gpf-border)] px-3 py-1">
                  Créer quand même
                </button>
              </div>
            </div>
          ) : null}
          {erreur ? <p className="text-sm text-[#b3463f]">{erreur}</p> : null}
          {mode === "lead" ? <p className="text-[11px] text-[var(--gpf-subtle)]">Une tâche « Appeler dans l&apos;heure » sera créée automatiquement.</p> : null}

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2 disabled:opacity-50">
              {saving ? "…" : mode === "lead" ? "Créer le lead" : "Créer le client"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
