"use client";
import { useEffect, useMemo, useState } from "react";
import { GPF_COMPLIANCE_ITEMS, GPF_PRODUIT_LABEL, type GpfCompliance, type GpfComplianceType, type GpfDocument, type GpfDossier, type GpfProduit } from "@/lib/gpf/types";
import { STATUT_CONFORMITE_COLOR } from "./Accueil";
import { api, Bloc, Field, frDate, frDateHeure, inputCls, Vide } from "./shared";

// ---------------- Conformité ----------------

export function Conformite({ clientId, items, onChanged }: { clientId: string; items: GpfCompliance[]; onChanged: () => void }) {
  const by = new Map(items.map((i) => [i.type, i]));
  const collecte = by.get("collecte");
  const ilYa12Mois = new Date();
  ilYa12Mois.setFullYear(ilYa12Mois.getFullYear() - 1);
  const collecteAncienne = collecte?.statut === "fait" && collecte.date_signature && new Date(collecte.date_signature) < ilYa12Mois;
  const faits = GPF_COMPLIANCE_ITEMS.filter((i) => by.get(i.type)?.statut === "fait").length;

  return (
    <div className="flex flex-col gap-4">
      {collecteAncienne ? (
        <div className="rounded-xl px-4 py-3 bg-[var(--gpf-danger-tint)] text-sm text-[var(--gpf-ink)]">
          Le recueil des besoins date de plus de 12 mois ({frDate(collecte?.date_signature)}) : il doit être mis à jour.
        </div>
      ) : null}
      <Bloc titre={`Réglementation — ${faits}/${GPF_COMPLIANCE_ITEMS.length} faits`}>
        {GPF_COMPLIANCE_ITEMS.map((item) => (
          <LigneConformite key={item.type} clientId={clientId} type={item.type} label={item.label} item={by.get(item.type)} onChanged={onChanged} />
        ))}
      </Bloc>
      <DocumentsCabinet clientId={clientId} items={items} onChanged={onChanged} />
    </div>
  );
}

const A_GENERER: { type: "der" | "lettre_mission" | "recueil" | "rapport_adequation"; conformite: GpfComplianceType; label: string; texte?: "besoins" | "motivation" }[] = [
  { type: "der", conformite: "der", label: "DER" },
  { type: "lettre_mission", conformite: "lettre_mission", label: "Lettre de mission" },
  { type: "recueil", conformite: "collecte", label: "Recueil des besoins", texte: "besoins" },
  { type: "rapport_adequation", conformite: "rapport_adequation", label: "Rapport d'adéquation", texte: "motivation" }
];

/** Génération des documents réglementaires (PDF rangés dans le coffre-fort), signature, export ACPR. */
function DocumentsCabinet({ clientId, items, onChanged }: { clientId: string; items: GpfCompliance[]; onChanged: () => void }) {
  const by = new Map(items.map((i) => [i.type, i]));
  const [occupe, setOccupe] = useState<string | null>(null);
  const [texte, setTexte] = useState<{ type: (typeof A_GENERER)[number]["type"]; valeur: string } | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const generer = async (type: (typeof A_GENERER)[number]["type"], extra: Record<string, string> = {}) => {
    setOccupe(type);
    const r = await api(`/api/gpf/clients/${clientId}/generer`, "POST", { type, ...extra });
    setOccupe(null);
    setTexte(null);
    if (!r.ok) return alert("Génération impossible.");
    onChanged();
    ouvrir(r.data.document.id);
  };
  const ouvrir = async (documentId: string) => {
    const r = await api(`/api/gpf/documents/${documentId}`, "GET");
    if (r.ok) window.open(r.data.url, "_blank");
  };

  return (
    <Bloc
      titre="Documents du cabinet"
      action={
        <a href={`/api/gpf/clients/${clientId}/export-acpr`} className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
          Export dossier ACPR (ZIP)
        </a>
      }
    >
      {A_GENERER.map((g) => {
        const item = by.get(g.conformite);
        return (
          <div key={g.type} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--gpf-border-soft)] last:border-0 flex-wrap">
            <span className="text-sm text-[var(--gpf-ink)] flex-1 min-w-[160px]">{g.label}</span>
            {item?.document_id ? (
              <button onClick={() => ouvrir(item.document_id!)} className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
                Ouvrir le dernier
              </button>
            ) : null}
            {item?.document_id && item.statut !== "fait" ? (
              <button
                onClick={() =>
                  setInfo(
                    "La signature électronique n'est pas encore branchée (service payant). Imprimez le document ou envoyez-le par e-mail, faites-le signer, puis déposez la version signée dans Documents et cochez « Fait » avec la date de signature."
                  )
                }
                className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]"
              >
                Envoyer pour signature
              </button>
            ) : null}
            <button
              disabled={occupe !== null}
              onClick={() => (g.texte ? setTexte({ type: g.type, valeur: "" }) : generer(g.type))}
              className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-[11px] font-semibold px-3 py-1 disabled:opacity-40"
            >
              {occupe === g.type ? "Génération…" : item?.document_id ? "Régénérer" : "Générer"}
            </button>
          </div>
        );
      })}
      {texte ? (
        <div className="px-4 py-3 flex flex-col gap-2 bg-[var(--gpf-surface-alt)]">
          <Field label={texte.type === "recueil" ? "Besoins et exigences exprimés (facultatif, aucune donnée de santé)" : "Motivation du conseil (facultatif)"}>
            <textarea className={inputCls} rows={4} value={texte.valeur} onChange={(e) => setTexte({ ...texte, valeur: e.target.value })} />
          </Field>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setTexte(null)} className="text-xs text-[var(--gpf-muted)] px-3">
              Annuler
            </button>
            <button
              disabled={occupe !== null}
              onClick={() => generer(texte.type, texte.type === "recueil" ? { besoins: texte.valeur } : { motivation: texte.valeur })}
              className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-[11px] font-semibold px-3 py-1 disabled:opacity-40"
            >
              Générer le PDF
            </button>
          </div>
        </div>
      ) : null}
      {info ? (
        <div className="px-4 py-3 text-xs text-[var(--gpf-ink)] bg-[var(--gpf-warning-tint)] flex gap-3 items-start">
          <span className="flex-1">{info}</span>
          <button onClick={() => setInfo(null)} className="text-[var(--gpf-muted)]" aria-label="Fermer">
            ✕
          </button>
        </div>
      ) : null}
      <p className="px-4 py-2.5 text-[11px] text-[var(--gpf-subtle)]">
        Les documents sont générés avec les informations du cabinet (ORIAS 23003789) et rangés dans le coffre-fort. Le passage en « En cours de souscription » est bloqué tant que le DER signé et la pièce d&apos;identité manquent.
      </p>
    </Bloc>
  );
}

function LigneConformite({ clientId, type, label, item, onChanged }: { clientId: string; type: GpfComplianceType; label: string; item?: GpfCompliance; onChanged: () => void }) {
  const [statut, setStatut] = useState(item?.statut ?? "manquant");
  const [pct, setPct] = useState(String(item?.pourcentage ?? 50));
  const [signature, setSignature] = useState(item?.date_signature ?? "");
  const [expiration, setExpiration] = useState(item?.date_expiration ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = statut !== (item?.statut ?? "manquant") || signature !== (item?.date_signature ?? "") || expiration !== (item?.date_expiration ?? "") || (statut === "en_cours" && pct !== String(item?.pourcentage ?? 50));
  const expire = expiration && expiration < new Date().toISOString().slice(0, 10);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--gpf-border-soft)] last:border-0 flex-wrap">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: expire ? "#b3463f" : STATUT_CONFORMITE_COLOR[statut] }} />
      <span className="text-sm text-[var(--gpf-ink)] flex-1 min-w-[180px]">
        {label}
        {expire ? <span className="ml-2 text-xs text-[#b3463f]">expirée</span> : null}
      </span>
      <select value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)} className="rounded-lg border px-2 py-1.5 text-xs">
        <option value="manquant">Manquant</option>
        <option value="en_cours">En cours</option>
        <option value="fait">Fait</option>
      </select>
      {statut === "en_cours" ? (
        <input inputMode="numeric" value={pct} onChange={(e) => setPct(e.target.value)} className="rounded-lg border px-2 py-1.5 text-xs w-16" aria-label="Avancement en %" />
      ) : null}
      <label className="text-[11px] text-[var(--gpf-subtle)] flex items-center gap-1">
        Signé le <input type="date" value={signature} onChange={(e) => setSignature(e.target.value)} className="rounded-lg border px-2 py-1 text-xs" />
      </label>
      {type === "piece_identite" ? (
        <label className="text-[11px] text-[var(--gpf-subtle)] flex items-center gap-1">
          Expire le <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} className="rounded-lg border px-2 py-1 text-xs" />
        </label>
      ) : null}
      <button
        disabled={!dirty || saving}
        onClick={async () => {
          setSaving(true);
          await api(`/api/gpf/clients/${clientId}/conformite`, "PUT", { type, statut, pourcentage: Number(pct), date_signature: signature || null, date_expiration: expiration || null });
          setSaving(false);
          onChanged();
        }}
        className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-[11px] font-semibold px-3 py-1 disabled:opacity-30"
      >
        OK
      </button>
    </div>
  );
}

// ---------------- Documents ----------------

// Pièces attendues selon le produit.
const PIECES: Record<GpfProduit, string[]> = {
  assurance_emprunteur: ["CNI", "Justificatif de domicile", "RIB", "Offre de prêt", "Tableau d'amortissement", "Bulletin de salaire"],
  regroupement_credits: ["CNI", "Justificatif de domicile", "RIB", "Bulletin de salaire", "Avis d'imposition", "Tableau d'amortissement"],
  per: ["CNI", "Justificatif de domicile", "RIB", "Avis d'imposition"],
  assurance_vie: ["CNI", "Justificatif de domicile", "RIB"],
  mutuelle: ["CNI", "RIB", "Attestation de droits (carte Vitale)"],
  prevoyance: ["CNI", "RIB"]
};
const TYPES_DOCS = ["CNI", "Passeport", "Titre de séjour", "Justificatif de domicile", "RIB", "Offre de prêt", "Tableau d'amortissement", "Bulletin de salaire", "Avis d'imposition", "Attestation de droits (carte Vitale)", "Autre"];
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const correspond = (piece: string, docType: string) => {
  const p = norm(piece);
  const t = norm(docType);
  if (p === "cni") return /^(cni|passeport|titre de sejour|piece d.identite)/.test(t);
  return t.startsWith(p.split(" (")[0]);
};

export function Documents({ clientId, documents, dossiers, onChanged }: { clientId: string; documents: GpfDocument[]; dossiers: GpfDossier[]; onChanged: () => void }) {
  const [type, setType] = useState(TYPES_DOCS[0]);
  const [dossierId, setDossierId] = useState("");
  const [expiration, setExpiration] = useState("");
  const [uploading, setUploading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const produits = [...new Set(dossiers.filter((d) => d.statut !== "refuse" && d.statut !== "sans_suite").map((d) => d.produit))];
  const attendues = [...new Set(produits.flatMap((p) => PIECES[p]))];
  const pieceIdentiteExpiree = documents.find((d) => correspond("CNI", d.type) && d.date_expiration && d.date_expiration < today);

  const upload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    if (dossierId) form.append("dossier_id", dossierId);
    if (expiration) form.append("date_expiration", expiration);
    await api(`/api/gpf/clients/${clientId}/documents`, "POST", form);
    setUploading(false);
    setExpiration("");
    onChanged();
  };
  const ouvrir = async (id: string) => {
    const r = await api(`/api/gpf/documents/${id}`, "GET");
    if (r.ok) window.open(r.data.url, "_blank");
  };
  const supprimer = async (id: string) => {
    if (!confirm("Supprimer ce document ? Déplacé vers la corbeille, restaurable 30 jours.")) return;
    await api(`/api/gpf/documents/${id}`, "DELETE");
    onChanged();
  };

  return (
    <div className="flex flex-col gap-4">
      {pieceIdentiteExpiree ? (
        <div className="rounded-xl px-4 py-3 bg-[var(--gpf-danger-tint)] text-sm text-[var(--gpf-ink)]">
          Pièce d&apos;identité expirée depuis le {frDate(pieceIdentiteExpiree.date_expiration)} : demandez-en une nouvelle.
        </div>
      ) : null}

      <Bloc titre="Pièces attendues">
        {attendues.length === 0 ? (
          <Vide>Aucun dossier en cours : pas de pièce attendue.</Vide>
        ) : (
          <div className="p-4 flex flex-wrap gap-2">
            {attendues.map((p) => {
              const doc = documents.find((d) => correspond(p, d.type));
              const expiree = doc?.date_expiration && doc.date_expiration < today;
              const ok = doc && !expiree;
              return (
                <span
                  key={p}
                  className="text-xs rounded-full px-3 py-1.5 border"
                  style={{ color: ok ? "#2f9e6e" : "#b3463f", borderColor: ok ? "#2f9e6e" : "#b3463f", background: ok ? "transparent" : "var(--gpf-danger-tint)" }}
                >
                  {ok ? "✓" : "✕"} {p}
                  {expiree ? " (expirée)" : ""}
                </span>
              );
            })}
          </div>
        )}
        {produits.length ? <p className="px-4 pb-3 text-[11px] text-[var(--gpf-subtle)]">Selon les produits : {produits.map((p) => GPF_PRODUIT_LABEL[p]).join(", ")}.</p> : null}
      </Bloc>

      <Bloc titre="Ajouter un document">
        <div className="p-4 grid sm:grid-cols-4 gap-3 items-end">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {TYPES_DOCS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Dossier (facultatif)">
            <select value={dossierId} onChange={(e) => setDossierId(e.target.value)} className={inputCls}>
              <option value="">— Fiche du contact —</option>
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {GPF_PRODUIT_LABEL[d.produit]}
                  {d.assureur_nom ? ` — ${d.assureur_nom}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date d'expiration">
            <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} className={inputCls} />
          </Field>
          <label className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2.5 cursor-pointer text-center">
            {uploading ? "Envoi…" : "Choisir le fichier"}
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
        <p className="px-4 pb-3 text-[11px] text-[var(--gpf-subtle)]">Ne déposez aucun document médical (questionnaire de santé, diagnostic).</p>
      </Bloc>

      <Bloc titre={`Documents (${documents.length})`}>
        {documents.length === 0 ? (
          <Vide>Aucun document.</Vide>
        ) : (
          documents.map((d) => {
            const expiree = d.date_expiration && d.date_expiration < today;
            return (
              <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0">
                <span className="text-[10px] font-semibold uppercase text-[var(--gpf-muted)] border border-[var(--gpf-border)] rounded px-1.5 py-0.5 shrink-0">{d.type}</span>
                <button onClick={() => ouvrir(d.id)} className="text-sm text-[var(--gpf-ink)] underline truncate flex-1 text-left">
                  {d.nom_fichier ?? "Document"}
                </button>
                {d.date_expiration ? <span className={`text-[11px] ${expiree ? "text-[#b3463f]" : "text-[var(--gpf-subtle)]"}`}>exp. {frDate(d.date_expiration)}</span> : null}
                <span className="text-[11px] text-[var(--gpf-subtle)] hidden sm:block">{frDate(d.created_at)}</span>
                <button onClick={() => supprimer(d.id)} className="text-[#b3463f] text-xs" aria-label="Supprimer">
                  ✕
                </button>
              </div>
            );
          })
        )}
      </Bloc>
    </div>
  );
}

// ---------------- Historique ----------------

type Evenement = { id: string; type: string; date: string; titre: string; detail?: string | null };
const FILTRES: [string, string][] = [
  ["tous", "Tout"],
  ["appel", "Appels"],
  ["note", "Notes"],
  ["statut", "Statuts"],
  ["document", "Documents"],
  ["rdv", "Rendez-vous"],
  ["tache", "Tâches"]
];
const ICONES: Record<string, string> = { appel: "☎", note: "✎", statut: "↻", document: "▤", rdv: "◷", tache: "✓", activite: "•" };

export function Historique({ clientId, version }: { clientId: string; version: number }) {
  const [evenements, setEvenements] = useState<Evenement[] | null>(null);
  const [filtre, setFiltre] = useState("tous");

  useEffect(() => {
    api(`/api/gpf/clients/${clientId}/historique`, "GET").then((r) => setEvenements(r.ok ? r.data.evenements : []));
  }, [clientId, version]);

  const liste = useMemo(() => (evenements ?? []).filter((e) => filtre === "tous" || e.type === filtre), [evenements, filtre]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        {FILTRES.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFiltre(k)}
            className={`rounded-full px-3 py-1 text-xs border ${filtre === k ? "bg-[#CDAA5A] text-[#071c2c] border-transparent" : "text-[var(--gpf-muted)] border-[var(--gpf-border)] bg-[var(--gpf-surface)]"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <Bloc titre="Historique">
        {evenements === null ? (
          <Vide>Chargement…</Vide>
        ) : liste.length === 0 ? (
          <Vide>Aucun événement.</Vide>
        ) : (
          <ol className="px-4 py-3">
            {liste.map((e) => (
              <li key={e.id} className="flex gap-3 pb-4 last:pb-0 relative">
                <span className="w-7 h-7 rounded-full bg-[var(--gpf-chip)] text-[var(--gpf-ink)] text-xs flex items-center justify-center shrink-0">{ICONES[e.type] ?? "•"}</span>
                <div className="min-w-0">
                  <div className="text-sm text-[var(--gpf-ink)]">{e.titre}</div>
                  {e.detail ? <div className="text-xs text-[var(--gpf-muted)] whitespace-pre-wrap mt-0.5">{e.detail}</div> : null}
                  <div className="text-[11px] text-[var(--gpf-subtle)] mt-0.5">{frDateHeure(e.date)}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Bloc>
    </div>
  );
}
