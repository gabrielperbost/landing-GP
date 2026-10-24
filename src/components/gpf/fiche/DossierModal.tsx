"use client";
import { useEffect, useState } from "react";
import {
  GPF_CONTRAT_STATUTS,
  GPF_CONTRAT_STATUT_LABEL,
  GPF_MOTIFS_REFUS,
  GPF_PRODUIT_LABEL,
  GPF_STATUTS,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  type GpfDocument,
  type GpfDossier
} from "@/lib/gpf/types";
import { encoursGere, estEpargne, lineaireAnnuel, primeAnnuelle, prochaineEcheance, resiliationPossible } from "@/lib/gpf/contrats";
import { api, euro, Field, frDate, inputCls } from "./shared";

const DOCUMENT_TYPES = ["CNI", "Justificatif de domicile", "RIB", "Offre de prêt", "Tableau d'amortissement", "Bulletin de salaire", "Avis d'imposition", "Autre"];

/** Fiche d'une affaire ou d'un contrat : montants, statut, prochaine action, documents. */
export function DossierModal({ dossier, onClose, onChanged }: { dossier: GpfDossier; onClose: () => void; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const [pendingRefus, setPendingRefus] = useState(false);
  const [motifRefus, setMotifRefus] = useState("");
  const [action, setAction] = useState({ texte: dossier.prochaine_action ?? "", date: dossier.prochaine_action_date ?? "" });

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    const r = await api(`/api/gpf/dossiers/${dossier.id}`, "PATCH", body);
    setSaving(false);
    if (r.ok) onChanged();
    else if (r.data?.error === "conformite_incomplete") alert(`Souscription bloquée : il manque ${r.data.manquant.join(" et ")} (onglet Conformité).`);
    return r;
  };

  const changeStatut = async (statut: string, motif?: string) => {
    if (statut === "refuse" && dossier.statut !== "refuse" && !motif) {
      setPendingRefus(true);
      return;
    }
    await patch(motif ? { statut, motif_refus: motif } : { statut });
    setPendingRefus(false);
  };

  const supprimer = async () => {
    if (!confirm(`Supprimer ce dossier (${GPF_PRODUIT_LABEL[dossier.produit]}) ? Déplacé vers la corbeille, restaurable 30 jours.`)) return;
    await api(`/api/gpf/dossiers/${dossier.id}`, "DELETE");
    onChanged();
    onClose();
  };

  const pa = primeAnnuelle(dossier);
  const kpis: [string, string | null][] = (
    [
      estEpargne(dossier)
        ? ["Encours", euro(encoursGere(dossier))]
        : ["Prime", pa != null ? `${euro(pa)}/an` : dossier.placement_initial != null ? euro(dossier.placement_initial) : null],
      estEpargne(dossier) ? ["Linéaire / an", euro(lineaireAnnuel(dossier))] : ["", null],
      ["Frais de dossier", euro(dossier.frais_dossier)],
      ["Précompte / 1ère année", euro(dossier.precompte_lineaire_1ere_annee)],
      ["Linéaire N+1", estEpargne(dossier) ? null : euro(dossier.lineaire_n1)]
    ] as [string, string | null][]
  ).filter(([, v]) => v);

  const details = (
    [
      ["Compagnie", dossier.assureur_nom],
      ["N° de contrat", dossier.reference_contrat],
      ["Date d'effet", frDate(dossier.date_effet)],
      ["Échéance", dossier.contrat_statut ? frDate(prochaineEcheance(dossier)) : null],
      ["Montant emprunté", euro(dossier.montant_pret)],
      ["Banque", dossier.banque],
      ["Taux", dossier.taux != null ? `${dossier.taux} %` : null],
      ["Durée", dossier.duree_mois != null ? `${dossier.duree_mois} mois` : null],
      ["Placement mensuel", estEpargne(dossier) ? null : euro(dossier.placement_mensuel)],
      ["Frais d'entrée", estEpargne(dossier) ? null : euro(dossier.frais_entree)],
      ["Motif de refus", dossier.motif_refus],
      ["Source", dossier.source],
      ["Lien du dossier", dossier.lien_dossier]
    ] as [string, string | null][]
  ).filter(([, v]) => v);

  const resil = dossier.contrat_statut ? resiliationPossible(dossier) : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[var(--gpf-surface)] rounded-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--gpf-border-soft)]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-[var(--gpf-ink)]">{GPF_PRODUIT_LABEL[dossier.produit]}</h3>
              <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ background: GPF_STATUT_COLOR[dossier.statut] }}>
                {GPF_STATUT_LABEL[dossier.statut]}
              </span>
              {dossier.contrat_statut ? (
                <span className="text-xs rounded-full px-2 py-0.5 border border-[var(--gpf-border)] text-[var(--gpf-ink)]">Contrat {GPF_CONTRAT_STATUT_LABEL[dossier.contrat_statut].toLowerCase()}</span>
              ) : null}
            </div>
            {dossier.assureur_nom ? <p className="text-xs text-[var(--gpf-muted)] mt-0.5">{dossier.assureur_nom}</p> : null}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={supprimer} title="Supprimer" className="text-[#b3463f] rounded-lg w-8 h-8 flex items-center justify-center text-sm">
              🗑
            </button>
            <button onClick={onClose} className="text-[var(--gpf-muted)] rounded-lg w-8 h-8 flex items-center justify-center text-sm" aria-label="Fermer">
              ✕
            </button>
          </div>
        </div>

        {kpis.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--gpf-fill)] border-b border-[var(--gpf-border-soft)]">
            {kpis.map(([label, value]) => (
              <div key={label} className="bg-[var(--gpf-surface)] p-3">
                <div className="text-[10px] uppercase tracking-wide text-[var(--gpf-subtle)]">{label}</div>
                <div className="text-sm font-semibold text-[var(--gpf-ink)] mt-0.5 tabular-nums">{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="px-5 py-4 flex flex-col gap-4">
          {resil ? (
            <div className="text-xs rounded-lg px-3 py-2 bg-[var(--gpf-warning-tint)] text-[var(--gpf-ink)]">
              <strong>Résiliation possible : </strong>
              {resil}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Étape du pipeline">
              <select value={dossier.statut} disabled={saving} onChange={(e) => changeStatut(e.target.value)} className={inputCls}>
                {GPF_STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {GPF_STATUT_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            {dossier.contrat_statut ? (
              <Field label="Statut du contrat">
                <select value={dossier.contrat_statut} disabled={saving} onChange={(e) => patch({ contrat_statut: e.target.value })} className={inputCls}>
                  {GPF_CONTRAT_STATUTS.map((s) => (
                    <option key={s} value={s}>
                      {GPF_CONTRAT_STATUT_LABEL[s]}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
          </div>

          {pendingRefus ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--gpf-danger-tint)] flex-wrap">
              <span className="text-xs text-[#b3463f] shrink-0">Motif de la perte :</span>
              <select value={motifRefus} onChange={(e) => setMotifRefus(e.target.value)} className="rounded-lg border px-2 py-1.5 text-xs flex-1">
                <option value="">— Choisir —</option>
                {GPF_MOTIFS_REFUS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <button onClick={() => changeStatut("refuse", motifRefus)} disabled={!motifRefus || saving} className="rounded-full bg-[#b3463f] text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50">
                Valider
              </button>
              <button onClick={() => setPendingRefus(false)} className="text-xs text-[var(--gpf-muted)]">
                Annuler
              </button>
            </div>
          ) : null}

          {!dossier.contrat_statut ? (
            <div className="grid grid-cols-[1fr_140px_auto] gap-2 items-end">
              <Field label="Prochaine action">
                <input value={action.texte} onChange={(e) => setAction((a) => ({ ...a, texte: e.target.value }))} placeholder="Ex. envoyer le devis" className={inputCls} />
              </Field>
              <Field label="Date">
                <input type="date" value={action.date} onChange={(e) => setAction((a) => ({ ...a, date: e.target.value }))} className={inputCls} />
              </Field>
              <button
                onClick={() => patch({ prochaine_action: action.texte.trim() || null, prochaine_action_date: action.date || null })}
                disabled={saving}
                className="rounded-lg border border-[var(--gpf-border)] text-xs px-3 py-2 text-[var(--gpf-ink)]"
              >
                OK
              </button>
              {!dossier.prochaine_action ? <p className="col-span-3 text-[11px] text-[#b3463f] -mt-1">Aucune prochaine action définie : cette affaire apparaît en alerte.</p> : null}
            </div>
          ) : null}

          {estEpargne(dossier) ? <MontantsEpargne dossier={dossier} saving={saving} onSave={patch} /> : null}

          {details.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
              {details.map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--gpf-subtle)]">{label}</div>
                  <div className="text-sm text-[var(--gpf-ink)] mt-0.5 break-words">
                    {label === "Lien du dossier" ? (
                      <a href={value!} target="_blank" rel="noopener noreferrer" className="underline">
                        Ouvrir
                      </a>
                    ) : (
                      value
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <DocumentsDossier dossierId={dossier.id} />
        </div>
      </div>
    </div>
  );
}

const nombre = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\s/g, "").replace(",", ".")));
const texte = (v: number | null | undefined) => (v == null ? "" : String(v));
const arrondi2 = (n: number) => String(Math.round(n * 100) / 100);

/** Assurance-vie / PER : montant placé, frais sur versement, frais de gestion (rémunération linéaire), encours. */
function MontantsEpargne({ dossier, saving, onSave }: { dossier: GpfDossier; saving: boolean; onSave: (body: Record<string, unknown>) => Promise<unknown> }) {
  const [f, setF] = useState({
    placement_initial: texte(dossier.placement_initial),
    placement_mensuel: texte(dossier.placement_mensuel),
    frais_versement_pct: texte(dossier.frais_versement_pct),
    frais_entree: texte(dossier.frais_entree),
    frais_gestion_pct: texte(dossier.frais_gestion_pct),
    lineaire_n1: texte(dossier.lineaire_n1),
    encours: texte(dossier.encours),
    encours_date: dossier.encours_date ?? ""
  });
  const [ok, setOk] = useState(false);
  const base = (g: typeof f) => nombre(g.encours) ?? nombre(g.placement_initial);

  // Saisie d'un taux : le montant correspondant se calcule tout seul (il reste modifiable).
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setOk(false);
    setF((p) => {
      const n = { ...p, [k]: v };
      const placement = nombre(n.placement_initial);
      const pctV = nombre(n.frais_versement_pct);
      if ((k === "frais_versement_pct" || k === "placement_initial") && placement != null && pctV != null) n.frais_entree = arrondi2((placement * pctV) / 100);
      const b = base(n);
      const pctG = nombre(n.frais_gestion_pct);
      if ((k === "frais_gestion_pct" || k === "placement_initial" || k === "encours") && b != null && pctG != null) n.lineaire_n1 = arrondi2((b * pctG) / 100);
      return n;
    });
  };

  const enregistrer = async () => {
    const encoursChange = nombre(f.encours) !== (dossier.encours ?? null);
    const r = (await onSave({
      placement_initial: nombre(f.placement_initial),
      placement_mensuel: nombre(f.placement_mensuel),
      frais_versement_pct: nombre(f.frais_versement_pct),
      frais_entree: nombre(f.frais_entree),
      frais_gestion_pct: nombre(f.frais_gestion_pct),
      lineaire_n1: nombre(f.lineaire_n1),
      encours: nombre(f.encours),
      encours_date: f.encours_date || (encoursChange && nombre(f.encours) != null ? new Date().toISOString().slice(0, 10) : null)
    })) as { ok?: boolean };
    setOk(Boolean(r?.ok));
  };

  return (
    <div className="rounded-xl border border-[var(--gpf-border-soft)] p-3 flex flex-col gap-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gpf-muted)]">Montants du contrat</h4>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Montant placé (€)">
          <input inputMode="decimal" value={f.placement_initial} onChange={set("placement_initial")} className={inputCls} />
        </Field>
        <Field label="Versements programmés (€/mois)">
          <input inputMode="decimal" value={f.placement_mensuel} onChange={set("placement_mensuel")} className={inputCls} />
        </Field>
        <Field label="Frais sur versement (%)">
          <input inputMode="decimal" value={f.frais_versement_pct} onChange={set("frais_versement_pct")} className={inputCls} />
        </Field>
        <Field label="Frais sur versement (€)">
          <input inputMode="decimal" value={f.frais_entree} onChange={set("frais_entree")} className={inputCls} />
        </Field>
        <Field label="Frais de gestion — ma rémunération (% / an)">
          <input inputMode="decimal" value={f.frais_gestion_pct} onChange={set("frais_gestion_pct")} className={inputCls} />
        </Field>
        <Field label="Rémunération linéaire (€ / an)">
          <input inputMode="decimal" value={f.lineaire_n1} onChange={set("lineaire_n1")} className={inputCls} />
        </Field>
        <Field label="Encours actuel (€)">
          <input inputMode="decimal" value={f.encours} onChange={set("encours")} placeholder="Vide = montant placé" className={inputCls} />
        </Field>
        <Field label="Encours au">
          <input type="date" value={f.encours_date} onChange={set("encours_date")} className={inputCls} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={enregistrer} disabled={saving} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2 disabled:opacity-50">
          {saving ? "…" : "Enregistrer"}
        </button>
        {ok ? <span className="text-xs text-[#2f9e6e]">Enregistré ✓</span> : null}
        <span className="text-[11px] text-[var(--gpf-subtle)]">En saisissant un %, le montant en € se calcule seul.</span>
      </div>
    </div>
  );
}

function DocumentsDossier({ dossierId }: { dossierId: string }) {
  const [documents, setDocuments] = useState<GpfDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState(DOCUMENT_TYPES[0]);

  const load = async () => {
    const r = await api(`/api/gpf/dossiers/${dossierId}/documents`, "GET");
    if (r.ok) setDocuments(r.data.documents);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const upload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    await api(`/api/gpf/dossiers/${dossierId}/documents`, "POST", form);
    setUploading(false);
    load();
  };

  const ouvrir = async (id: string) => {
    const r = await api(`/api/gpf/documents/${id}`, "GET");
    if (r.ok) window.open(r.data.url, "_blank");
  };

  return (
    <div className="pt-4 border-t border-[var(--gpf-border-soft)]">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gpf-muted)] mr-auto">Documents du dossier</h4>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border px-2 py-1.5 text-xs">
          {DOCUMENT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <label className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-1.5 cursor-pointer">
          {uploading ? "Envoi…" : "+ Ajouter"}
          <input
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-[10px] text-[var(--gpf-subtle)] mb-2">Ne déposez pas de documents médicaux (questionnaires de santé, diagnostics).</p>
      {documents.length === 0 ? (
        <p className="text-xs text-[var(--gpf-subtle)]">Aucun document pour ce dossier.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center gap-2 bg-[var(--gpf-surface-alt)] rounded-lg px-3 py-2">
              <span className="text-[10px] font-semibold uppercase text-[var(--gpf-muted)] border border-[var(--gpf-border)] rounded px-1.5 py-0.5 shrink-0">{d.type}</span>
              <button onClick={() => ouvrir(d.id)} className="text-xs text-[var(--gpf-ink)] underline truncate flex-1 text-left">
                {d.nom_fichier ?? "Document"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
