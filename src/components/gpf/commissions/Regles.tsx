"use client";
import { useEffect, useState } from "react";
import { api, BoutonOr, Field, inputCls, Panneau, Vide } from "@/components/gpf/fiche/shared";
import { Carte } from "@/components/gpf/PageHeader";
import { eur, Tableau, tdCls, tdNum } from "./commun";
import { GPF_PRODUIT_LABEL, GPF_PRODUITS, type GpfProduit } from "@/lib/gpf/types";

type Regle = {
  id?: string;
  insurer_id: string | null;
  produit: string;
  mode: "precompte" | "lineaire";
  taux_annee1: number | null;
  taux_suivantes: number | null;
  frais_dossier: number | null;
  reprise_mois: number | null;
  notes: string | null;
};
const VIDE: Regle = { insurer_id: null, produit: "assurance_emprunteur", mode: "precompte", taux_annee1: null, taux_suivantes: null, frais_dossier: null, reprise_mois: null, notes: null };
const taux = (v: number | null) => (v == null ? "—" : `${Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`);

/** Règles de commission : taux 1re année / années suivantes par compagnie et produit (en %). */
export function Regles({ insurers }: { insurers: { id: string; nom: string }[] }) {
  const [regles, setRegles] = useState<Regle[] | null>(null);
  const [edit, setEdit] = useState<Regle | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const nom = new Map(insurers.map((i) => [i.id, i.nom]));

  const charger = async () => {
    const r = await api("/api/gpf/commissions/regles", "GET");
    setRegles(r.ok ? r.data.regles : []);
  };
  useEffect(() => {
    charger();
  }, []);

  const enregistrer = async () => {
    if (!edit) return;
    const r = await api("/api/gpf/commissions/regles", "POST", edit);
    if (!r.ok) return setErreur(r.data?.error === "regle_existante" ? "Une règle existe déjà pour cette compagnie et ce produit." : "Enregistrement impossible.");
    setEdit(null);
    charger();
  };
  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cette règle de commission ?")) return;
    await api(`/api/gpf/commissions/regles?id=${id}`, "DELETE");
    charger();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <p className="text-sm text-[var(--gpf-muted)]">
          Les taux servent à calculer le montant attendu de chaque ligne de bordereau (prime × taux) et à repérer les écarts. Taux exprimés en % de la prime.
        </p>
        <BoutonOr
          onClick={() => {
            setErreur(null);
            setEdit({ ...VIDE });
          }}
        >
          Nouvelle règle
        </BoutonOr>
      </div>
      <Carte>
        {regles === null ? (
          <Vide>Chargement…</Vide>
        ) : regles.length === 0 ? (
          <Vide>Aucune règle. Ajoutez vos taux par compagnie pour activer le contrôle des montants reçus.</Vide>
        ) : (
          <Tableau entetes={["Compagnie", "Produit", "Mode", "1re année", "Années suivantes", "Frais de dossier", "Reprise", ""]} alignDroite={[3, 4, 5]}>
            {regles.map((r) => (
              <tr key={r.id}>
                <td className={tdCls}>{r.insurer_id ? nom.get(r.insurer_id) ?? "—" : "Toutes compagnies"}</td>
                <td className={tdCls}>{GPF_PRODUIT_LABEL[r.produit as GpfProduit] ?? r.produit}</td>
                <td className={tdCls}>{r.mode === "lineaire" ? "Linéaire" : "Précompte"}</td>
                <td className={tdNum}>{taux(r.taux_annee1)}</td>
                <td className={tdNum}>{taux(r.taux_suivantes)}</td>
                <td className={tdNum}>{eur(r.frais_dossier, 0)}</td>
                <td className={tdCls}>{r.reprise_mois ? `${r.reprise_mois} mois` : "—"}</td>
                <td className={`${tdCls} text-right text-xs`}>
                  <button
                    className="text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)] mr-3"
                    onClick={() => {
                      setErreur(null);
                      setEdit(r);
                    }}
                  >
                    Modifier
                  </button>
                  <button className="text-[var(--gpf-subtle)] hover:text-[#b3463f]" onClick={() => supprimer(r.id!)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </Tableau>
        )}
      </Carte>

      {edit ? (
        <Panneau titre={edit.id ? "Modifier la règle" : "Nouvelle règle"} onClose={() => setEdit(null)}>
          <div className="flex flex-col gap-3">
            <Field label="Compagnie">
              <select className={inputCls} value={edit.insurer_id ?? ""} onChange={(e) => setEdit({ ...edit, insurer_id: e.target.value || null })}>
                <option value="">Toutes compagnies (règle par défaut)</option>
                {insurers.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nom}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Produit">
              <select className={inputCls} value={edit.produit} onChange={(e) => setEdit({ ...edit, produit: e.target.value })}>
                {GPF_PRODUITS.map((p) => (
                  <option key={p} value={p}>
                    {GPF_PRODUIT_LABEL[p]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mode de commissionnement">
              <select className={inputCls} value={edit.mode} onChange={(e) => setEdit({ ...edit, mode: e.target.value as Regle["mode"] })}>
                <option value="precompte">Précompte (1re année majorée)</option>
                <option value="lineaire">Linéaire (même taux chaque année)</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Taux 1re année (%)">
                <input className={inputCls} inputMode="decimal" value={edit.taux_annee1 ?? ""} onChange={(e) => setEdit({ ...edit, taux_annee1: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) })} />
              </Field>
              <Field label="Taux suivantes (%)">
                <input className={inputCls} inputMode="decimal" value={edit.taux_suivantes ?? ""} onChange={(e) => setEdit({ ...edit, taux_suivantes: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) })} />
              </Field>
              <Field label="Frais de dossier (€)">
                <input className={inputCls} inputMode="decimal" value={edit.frais_dossier ?? ""} onChange={(e) => setEdit({ ...edit, frais_dossier: e.target.value === "" ? null : Number(e.target.value.replace(",", ".")) })} />
              </Field>
              <Field label="Reprise si résiliation (mois)">
                <input className={inputCls} inputMode="numeric" value={edit.reprise_mois ?? ""} onChange={(e) => setEdit({ ...edit, reprise_mois: e.target.value === "" ? null : Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea className={inputCls} rows={3} value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
            </Field>
            {erreur ? <p className="text-sm text-[#b3463f]">{erreur}</p> : null}
            <BoutonOr onClick={enregistrer}>Enregistrer</BoutonOr>
          </div>
        </Panneau>
      ) : null}
    </div>
  );
}
