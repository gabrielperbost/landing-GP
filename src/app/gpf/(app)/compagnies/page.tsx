"use client";
import { useEffect, useState } from "react";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { api, BoutonOr, Field, inputCls, Panneau, Vide, frDate } from "@/components/gpf/fiche/shared";
import { eur, Tableau, tdCls, tdNum } from "@/components/gpf/commissions/commun";

type Compagnie = {
  id: string;
  nom: string;
  actif: boolean;
  contact: string | null;
  telephone: string | null;
  notes: string | null;
  mappingMemorise: boolean;
  nbRegles: number;
  nbContrats: number;
  primes: number;
  commissions12: number;
  nbBordereaux: number;
  aVerifier: number;
  dernierBordereau: string | null;
};

export default function CompagniesPage() {
  const [liste, setListe] = useState<Compagnie[] | null>(null);
  const [edit, setEdit] = useState<Compagnie | null>(null);
  const [nouveau, setNouveau] = useState<string | null>(null);

  const charger = async () => {
    const r = await api("/api/gpf/compagnies", "GET");
    setListe(r.ok ? r.data.compagnies : []);
  };
  useEffect(() => {
    charger();
  }, []);

  const enregistrer = async () => {
    if (!edit) return;
    await api("/api/gpf/compagnies", "PATCH", { id: edit.id, contact: edit.contact, telephone: edit.telephone, notes: edit.notes, actif: edit.actif });
    setEdit(null);
    charger();
  };
  const oublierMapping = async () => {
    if (!edit || !confirm("Oublier la correspondance de colonnes mémorisée ? Elle sera reproposée au prochain import.")) return;
    await api("/api/gpf/compagnies", "PATCH", { id: edit.id, oublierMapping: true });
    setEdit(null);
    charger();
  };
  const creer = async () => {
    if (!nouveau?.trim()) return;
    const r = await api("/api/gpf/compagnies", "POST", { nom: nouveau.trim() });
    if (!r.ok) return alert(r.data?.error === "compagnie_existante" ? "Cette compagnie existe déjà." : "Création impossible.");
    setNouveau(null);
    charger();
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Compagnies" sousTitre="Partenaires, portefeuille et suivi des bordereaux" actions={<BoutonOr onClick={() => setNouveau("")}>Ajouter une compagnie</BoutonOr>} />
      {!liste ? (
        <SkeletonLines />
      ) : (
        <Carte>
          {liste.length === 0 ? (
            <Vide>Aucune compagnie.</Vide>
          ) : (
            <Tableau entetes={["Compagnie", "Contrats", "Primes annualisées", "Commissions 12 mois", "Règles", "Bordereaux", "Dernier import", ""]} alignDroite={[1, 2, 3, 4, 5]}>
              {liste.map((c) => (
                <tr key={c.id} className={c.actif ? "" : "opacity-50"}>
                  <td className={tdCls}>
                    <p className="font-medium">{c.nom}</p>
                    {c.contact || c.telephone ? <p className="text-[11px] text-[var(--gpf-subtle)]">{[c.contact, c.telephone].filter(Boolean).join(" · ")}</p> : null}
                  </td>
                  <td className={tdNum}>{c.nbContrats}</td>
                  <td className={tdNum}>{eur(c.primes, 0)}</td>
                  <td className={tdNum}>{eur(c.commissions12, 0)}</td>
                  <td className={tdNum}>{c.nbRegles || "—"}</td>
                  <td className={tdNum}>
                    {c.nbBordereaux}
                    {c.aVerifier ? <span className="ml-1 text-[11px] text-[#c98a1f]">({c.aVerifier} à vérifier)</span> : null}
                  </td>
                  <td className={tdCls}>{frDate(c.dernierBordereau) ?? "—"}</td>
                  <td className={`${tdCls} text-right`}>
                    <button className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]" onClick={() => setEdit(c)}>
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </Tableau>
          )}
        </Carte>
      )}

      {edit ? (
        <Panneau titre={edit.nom} onClose={() => setEdit(null)}>
          <div className="flex flex-col gap-3">
            <Field label="Contact (inspecteur, service courtage…)">
              <input className={inputCls} value={edit.contact ?? ""} onChange={(e) => setEdit({ ...edit, contact: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <input className={inputCls} value={edit.telephone ?? ""} onChange={(e) => setEdit({ ...edit, telephone: e.target.value })} />
            </Field>
            <Field label="Notes (codes courtier, extranet, délais de paiement…)">
              <textarea className={inputCls} rows={4} value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-[var(--gpf-ink)]">
              <input type="checkbox" checked={edit.actif} onChange={(e) => setEdit({ ...edit, actif: e.target.checked })} />
              Partenaire actif
            </label>
            {edit.mappingMemorise ? (
              <button onClick={oublierMapping} className="text-left text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
                Oublier la correspondance de colonnes mémorisée pour les bordereaux
              </button>
            ) : null}
            <BoutonOr onClick={enregistrer}>Enregistrer</BoutonOr>
          </div>
        </Panneau>
      ) : null}

      {nouveau !== null ? (
        <Panneau titre="Ajouter une compagnie" onClose={() => setNouveau(null)}>
          <div className="flex flex-col gap-3">
            <Field label="Nom">
              <input className={inputCls} value={nouveau} onChange={(e) => setNouveau(e.target.value)} autoFocus />
            </Field>
            <BoutonOr onClick={creer}>Ajouter</BoutonOr>
          </div>
        </Panneau>
      ) : null}
    </div>
  );
}
