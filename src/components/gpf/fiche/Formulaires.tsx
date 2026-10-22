"use client";
import { useEffect, useState } from "react";
import {
  GPF_PRODUIT_LABEL,
  GPF_PROVENANCES,
  GPF_SCORE_LABEL,
  GPF_TYPE_CONTACT_LABEL,
  type GpfBudget,
  type GpfClient,
  type GpfDossier,
  type GpfFiscalite
} from "@/lib/gpf/types";
import { api, Bloc, BoutonOr, euro, Field, inputCls, Vide } from "./shared";

const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\s/g, "").replace(",", ".")));
const str = (v: unknown) => (v == null ? "" : String(v));

function useSave(onSaved: () => void) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const save = async (url: string, body: unknown) => {
    setState("saving");
    const r = await api(url, "PATCH", body);
    setState(r.ok ? "saved" : "error");
    if (r.ok) onSaved();
  };
  const label = state === "saving" ? "…" : "Enregistrer";
  const info = state === "saved" ? <span className="text-xs text-[#2f9e6e]">Enregistré ✓</span> : state === "error" ? <span className="text-xs text-[#b3463f]">Échec de l&apos;enregistrement</span> : null;
  return { save, label, info, saving: state === "saving" };
}

export function Coordonnees({ client, onSaved }: { client: GpfClient; onSaved: () => void }) {
  const keys = [
    "civilite", "prenom", "nom", "email", "telephone", "adresse", "code_postal", "ville", "date_naissance", "profession",
    "situation_familiale", "nb_enfants", "type_contact", "raison_sociale", "provenance", "apporteur_id", "preference_contact", "score",
    "prochaine_action", "prochaine_action_date", "notes"
  ] as const;
  const [f, setF] = useState<Record<string, string>>(() => Object.fromEntries(keys.map((k) => [k, str((client as Record<string, unknown>)[k])])));
  const { save, label, info, saving } = useSave(onSaved);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const [apporteurs, setApporteurs] = useState<{ id: string; nom: string }[]>([]);
  useEffect(() => {
    api("/api/gpf/apporteurs", "GET").then((r) => r.ok && setApporteurs(r.data.apporteurs));
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    for (const k of keys) body[k] = k === "nb_enfants" ? num(f[k]) : f[k].trim() || null;
    if (body.date_naissance) body.annee_naissance = Number(String(body.date_naissance).slice(0, 4));
    save(`/api/gpf/clients/${client.id}`, body);
  };

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-2 gap-4">
      <Bloc titre="Identité">
        <div className="p-4 grid grid-cols-2 gap-3">
          <Field label="Civilité">
            <select value={f.civilite} onChange={set("civilite")} className={inputCls}>
              <option value="">—</option>
              <option>Madame</option>
              <option>Monsieur</option>
            </select>
          </Field>
          <Field label="Type de contact">
            <select value={f.type_contact || "particulier"} onChange={set("type_contact")} className={inputCls}>
              {Object.entries(GPF_TYPE_CONTACT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prénom">
            <input required value={f.prenom} onChange={set("prenom")} className={inputCls} />
          </Field>
          <Field label="Nom">
            <input required value={f.nom} onChange={set("nom")} className={inputCls} />
          </Field>
          {f.type_contact === "entreprise" ? (
            <Field label="Raison sociale" className="col-span-2">
              <input value={f.raison_sociale} onChange={set("raison_sociale")} className={inputCls} />
            </Field>
          ) : null}
          <Field label="Date de naissance">
            <input type="date" value={f.date_naissance} onChange={set("date_naissance")} className={inputCls} />
          </Field>
          <Field label="Profession">
            <input value={f.profession} onChange={set("profession")} className={inputCls} />
          </Field>
          <Field label="Situation familiale">
            <select value={f.situation_familiale} onChange={set("situation_familiale")} className={inputCls}>
              <option value="">—</option>
              {["Célibataire", "Marié(e)", "Pacsé(e)", "Concubinage", "Divorcé(e)", "Veuf(ve)"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Enfants à charge">
            <input inputMode="numeric" value={f.nb_enfants} onChange={set("nb_enfants")} className={inputCls} />
          </Field>
        </div>
      </Bloc>

      <Bloc titre="Coordonnées">
        <div className="p-4 grid grid-cols-2 gap-3">
          <Field label="E-mail" className="col-span-2">
            <input type="email" value={f.email} onChange={set("email")} className={inputCls} />
          </Field>
          <Field label="Téléphone">
            <input type="tel" value={f.telephone} onChange={set("telephone")} className={inputCls} />
          </Field>
          <Field label="Préférence de contact">
            <select value={f.preference_contact} onChange={set("preference_contact")} className={inputCls}>
              <option value="">—</option>
              <option value="appel">Appel</option>
              <option value="sms">SMS</option>
              <option value="email">E-mail</option>
            </select>
          </Field>
          <Field label="Adresse" className="col-span-2">
            <input value={f.adresse} onChange={set("adresse")} className={inputCls} />
          </Field>
          <Field label="Code postal">
            <input value={f.code_postal} onChange={set("code_postal")} className={inputCls} />
          </Field>
          <Field label="Ville">
            <input value={f.ville} onChange={set("ville")} className={inputCls} />
          </Field>
        </div>
      </Bloc>

      <Bloc titre="Suivi commercial">
        <div className="p-4 grid grid-cols-2 gap-3">
          <Field label="Provenance">
            <select value={f.provenance} onChange={set("provenance")} className={inputCls}>
              <option value="">—</option>
              {[...new Set([...GPF_PROVENANCES, f.provenance].filter(Boolean))].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Apporteur">
            <select value={f.apporteur_id} onChange={set("apporteur_id")} className={inputCls}>
              <option value="">—</option>
              {apporteurs.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Score">
            <select value={f.score} onChange={set("score")} className={inputCls}>
              <option value="">—</option>
              {Object.entries(GPF_SCORE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Prochaine action">
            <input value={f.prochaine_action} onChange={set("prochaine_action")} placeholder="Ex. rappeler pour le devis" className={inputCls} />
          </Field>
          <Field label="Date">
            <input type="date" value={f.prochaine_action_date} onChange={set("prochaine_action_date")} className={inputCls} />
          </Field>
        </div>
      </Bloc>

      <Bloc titre="Notes générales">
        <div className="p-4 flex flex-col gap-2">
          <textarea value={f.notes} onChange={set("notes")} rows={5} className={inputCls} />
          <p className="text-[11px] text-[var(--gpf-subtle)]">Aucune donnée médicale dans ce champ.</p>
        </div>
      </Bloc>

      <div className="lg:col-span-2 flex items-center gap-3">
        <BoutonOr type="submit" disabled={saving}>
          {label}
        </BoutonOr>
        {info}
      </div>
    </form>
  );
}

export function Budget({ client, onSaved }: { client: GpfClient; onSaved: () => void }) {
  const b = client.budget ?? {};
  const [f, setF] = useState({
    revenus_annuels: str(b.revenus_annuels),
    charges_annuelles: str(b.charges_annuelles),
    credits_en_cours: str(b.credits_en_cours),
    mensualites_credits: str(b.mensualites_credits),
    patrimoine: str(b.patrimoine),
    notes: str(b.notes)
  });
  const { save, label, info, saving } = useSave(onSaved);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const revenus = num(f.revenus_annuels) ?? 0;
  const charges = (num(f.charges_annuelles) ?? 0) + (num(f.mensualites_credits) ?? 0) * 12;
  const reste = revenus - charges;
  const endettement = revenus > 0 ? ((num(f.mensualites_credits) ?? 0) * 12 * 100) / revenus : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const budget: GpfBudget = {
      revenus_annuels: num(f.revenus_annuels),
      charges_annuelles: num(f.charges_annuelles),
      credits_en_cours: num(f.credits_en_cours),
      mensualites_credits: num(f.mensualites_credits),
      patrimoine: num(f.patrimoine),
      notes: f.notes.trim() || null
    };
    save(`/api/gpf/clients/${client.id}`, { budget });
  };

  const tuile = (labelT: string, valeur: string, couleur?: string) => (
    <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] border-t-2 rounded-xl p-4" style={{ borderTopColor: "#CDAA5A" }}>
      <div className="text-xs text-[var(--gpf-muted)]">{labelT}</div>
      <div className="text-xl font-semibold tabular-nums mt-1" style={{ color: couleur ?? "var(--gpf-ink)" }}>
        {valeur}
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tuile("Revenus annuels", euro(revenus) ?? "—")}
        {tuile("Charges annuelles", euro(charges) ?? "—")}
        {tuile("Reste à vivre / an", euro(reste) ?? "—", reste >= 0 ? "#2f9e6e" : "#b3463f")}
        {tuile("Taux d'endettement", endettement != null ? `${endettement.toFixed(1)} %` : "—", endettement != null && endettement > 35 ? "#b3463f" : undefined)}
      </div>
      <Bloc titre="Budget du foyer">
        <div className="p-4 grid sm:grid-cols-2 gap-3">
          <Field label="Revenus annuels nets (€)">
            <input inputMode="decimal" value={f.revenus_annuels} onChange={set("revenus_annuels")} className={inputCls} />
          </Field>
          <Field label="Charges annuelles hors crédits (€)">
            <input inputMode="decimal" value={f.charges_annuelles} onChange={set("charges_annuelles")} className={inputCls} />
          </Field>
          <Field label="Capital restant dû des crédits (€)">
            <input inputMode="decimal" value={f.credits_en_cours} onChange={set("credits_en_cours")} className={inputCls} />
          </Field>
          <Field label="Mensualités de crédits (€/mois)">
            <input inputMode="decimal" value={f.mensualites_credits} onChange={set("mensualites_credits")} className={inputCls} />
          </Field>
          <Field label="Patrimoine estimé (€)">
            <input inputMode="decimal" value={f.patrimoine} onChange={set("patrimoine")} className={inputCls} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea value={f.notes} onChange={set("notes")} rows={3} className={inputCls} />
          </Field>
        </div>
      </Bloc>
      <p className="text-[11px] text-[var(--gpf-subtle)]">Utile pour l&apos;assurance emprunteur et le regroupement de crédits (taux d&apos;endettement au-delà de 35 % signalé en rouge).</p>
      <div className="flex items-center gap-3">
        <BoutonOr type="submit" disabled={saving}>
          {label}
        </BoutonOr>
        {info}
      </div>
    </form>
  );
}

export function Fiscalite({ client, onSaved }: { client: GpfClient; onSaved: () => void }) {
  const fi = client.fiscalite ?? {};
  const [f, setF] = useState({
    annee: str(fi.annee ?? new Date().getFullYear() - 1),
    tmi: str(fi.tmi),
    impot_paye: str(fi.impot_paye),
    revenu_fiscal_reference: str(fi.revenu_fiscal_reference),
    nb_parts: str(fi.nb_parts),
    plafond_epargne_retraite: str(fi.plafond_epargne_retraite)
  });
  const { save, label, info, saving } = useSave(onSaved);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const economiePer = num(f.plafond_epargne_retraite) != null && num(f.tmi) != null ? ((num(f.plafond_epargne_retraite) ?? 0) * (num(f.tmi) ?? 0)) / 100 : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fiscalite: GpfFiscalite = {
      annee: num(f.annee),
      tmi: num(f.tmi),
      impot_paye: num(f.impot_paye),
      revenu_fiscal_reference: num(f.revenu_fiscal_reference),
      nb_parts: num(f.nb_parts),
      plafond_epargne_retraite: num(f.plafond_epargne_retraite)
    };
    save(`/api/gpf/clients/${client.id}`, { fiscalite });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Bloc titre="Fiscalité (dernier avis d'imposition)">
        <div className="p-4 grid sm:grid-cols-3 gap-3">
          <Field label="Année des revenus">
            <input inputMode="numeric" value={f.annee} onChange={set("annee")} className={inputCls} />
          </Field>
          <Field label="Tranche marginale (TMI)">
            <select value={f.tmi} onChange={set("tmi")} className={inputCls}>
              <option value="">—</option>
              {["0", "11", "30", "41", "45"].map((t) => (
                <option key={t} value={t}>
                  {t} %
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nombre de parts">
            <input inputMode="decimal" value={f.nb_parts} onChange={set("nb_parts")} className={inputCls} />
          </Field>
          <Field label="Revenu fiscal de référence (€)">
            <input inputMode="decimal" value={f.revenu_fiscal_reference} onChange={set("revenu_fiscal_reference")} className={inputCls} />
          </Field>
          <Field label="Impôt net payé (€)">
            <input inputMode="decimal" value={f.impot_paye} onChange={set("impot_paye")} className={inputCls} />
          </Field>
          <Field label="Plafond épargne retraite disponible (€)">
            <input inputMode="decimal" value={f.plafond_epargne_retraite} onChange={set("plafond_epargne_retraite")} className={inputCls} />
          </Field>
        </div>
      </Bloc>
      {economiePer != null && economiePer > 0 ? (
        <div className="rounded-xl px-4 py-3 bg-[var(--gpf-warning-tint)] text-sm text-[var(--gpf-ink)]">
          Économie d&apos;impôt maximale estimée avec un versement PER au plafond : <strong>{euro(economiePer)}</strong> (plafond × TMI).
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <BoutonOr type="submit" disabled={saving}>
          {label}
        </BoutonOr>
        {info}
      </div>
    </form>
  );
}

export function Projet({ dossiers, onSaved }: { dossiers: GpfDossier[]; onSaved: () => void }) {
  const prets = dossiers.filter((d) => d.produit === "assurance_emprunteur" || d.produit === "regroupement_credits");
  if (prets.length === 0) return <Bloc titre="Projet">{<Vide>Aucun dossier d&apos;assurance emprunteur ou de regroupement de crédits.</Vide>}</Bloc>;
  return (
    <div className="flex flex-col gap-4">
      {prets.map((d) => (
        <ProjetPret key={d.id} dossier={d} onSaved={onSaved} />
      ))}
    </div>
  );
}

function ProjetPret({ dossier, onSaved }: { dossier: GpfDossier; onSaved: () => void }) {
  const [f, setF] = useState({
    banque: str(dossier.banque),
    montant_pret: str(dossier.montant_pret),
    duree_mois: str(dossier.duree_mois),
    taux: str(dossier.taux),
    date_offre_pret: str(dossier.date_offre_pret),
    date_signature_notaire: str(dossier.date_signature_notaire),
    cout_assurance_banque: str(dossier.cout_assurance_banque),
    cout_assurance_delegation: str(dossier.cout_assurance_delegation)
  });
  const { save, label, info, saving } = useSave(onSaved);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));
  const economie = num(f.cout_assurance_banque) != null && num(f.cout_assurance_delegation) != null ? (num(f.cout_assurance_banque) ?? 0) - (num(f.cout_assurance_delegation) ?? 0) : null;

  return (
    <Bloc titre={`${GPF_PRODUIT_LABEL[dossier.produit]}${dossier.assureur_nom ? ` — ${dossier.assureur_nom}` : ""}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(`/api/gpf/dossiers/${dossier.id}`, {
            banque: f.banque.trim() || null,
            montant_pret: num(f.montant_pret),
            duree_mois: num(f.duree_mois),
            taux: num(f.taux),
            date_offre_pret: f.date_offre_pret || null,
            date_signature_notaire: f.date_signature_notaire || null,
            cout_assurance_banque: num(f.cout_assurance_banque),
            cout_assurance_delegation: num(f.cout_assurance_delegation)
          });
        }}
        className="p-4 flex flex-col gap-3"
      >
        <div className="grid sm:grid-cols-4 gap-3">
          <Field label="Banque">
            <input value={f.banque} onChange={set("banque")} className={inputCls} />
          </Field>
          <Field label="Montant emprunté (€)">
            <input inputMode="decimal" value={f.montant_pret} onChange={set("montant_pret")} className={inputCls} />
          </Field>
          <Field label="Durée (mois)">
            <input inputMode="numeric" value={f.duree_mois} onChange={set("duree_mois")} className={inputCls} />
          </Field>
          <Field label="Taux (%)">
            <input inputMode="decimal" value={f.taux} onChange={set("taux")} className={inputCls} />
          </Field>
          <Field label="Date de l'offre de prêt">
            <input type="date" value={f.date_offre_pret} onChange={set("date_offre_pret")} className={inputCls} />
          </Field>
          <Field label="Signature chez le notaire">
            <input type="date" value={f.date_signature_notaire} onChange={set("date_signature_notaire")} className={inputCls} />
          </Field>
          <Field label="Coût total assurance banque (€)">
            <input inputMode="decimal" value={f.cout_assurance_banque} onChange={set("cout_assurance_banque")} className={inputCls} />
          </Field>
          <Field label="Coût total délégation (€)">
            <input inputMode="decimal" value={f.cout_assurance_delegation} onChange={set("cout_assurance_delegation")} className={inputCls} />
          </Field>
        </div>
        {economie != null ? (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: economie > 0 ? "rgba(47,158,110,.12)" : "var(--gpf-fill)", color: "var(--gpf-ink)" }}>
            Économie réalisée par rapport au contrat de la banque : <strong>{euro(economie)}</strong>
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <BoutonOr type="submit" disabled={saving}>
            {label}
          </BoutonOr>
          {info}
        </div>
      </form>
    </Bloc>
  );
}
