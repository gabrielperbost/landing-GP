"use client";
import { SkeletonPage } from "@/components/gpf/Skeleton";
import { usePageTitle } from "@/components/gpf/GpfShell";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GPF_MOTIFS_REFUS,
  GPF_PRODUIT_COLOR,
  GPF_PRODUIT_LABEL,
  GPF_PRODUITS,
  GPF_STATUTS_CLOS,
  compteDansRevenus,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  GPF_STATUTS,
  formatNom,
  type GpfClient,
  type GpfDocument,
  type GpfDossier
} from "@/lib/gpf/types";

const DOCUMENT_TYPES = ["CNI", "Justificatif de domicile", "RIB", "Tableau d'amortissement", "Offre de prêt", "Bulletin de salaire", "Autre"];

const euro = (v: number | null) => (v == null ? null : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v));
const frDate = (v: string | null) => (v ? new Date(v + "T00:00:00").toLocaleDateString("fr-FR") : null);

const EN_COURS: ReadonlySet<string> = new Set([
  "a_traiter", "nrp", "devis_a_realiser", "devis_envoye", "en_cours_souscription",
  "attente_accord_banque", "attente_prise_effet", "attente_reglement", "attente_documents"
]);

type Tab = "accueil" | "dossiers" | "coordonnees";

export default function GpfClientPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [client, setClient] = useState<GpfClient | null>(null);
  const [dossiers, setDossiers] = useState<GpfDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("accueil");
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/gpf/contacts/${id}`);
    const data = await res.json();
    if (data.ok) {
      setClient(data.client);
      setDossiers(data.dossiers);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const deleteClient = async () => {
    if (!confirm(`Déplacer ${client?.prenom} ${client?.nom} vers la corbeille ? Restaurable pendant 30 jours.`)) return;
    const res = await fetch(`/api/gpf/contacts/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      alert(data.error === "dossiers_actifs" ? "Impossible : ce client a encore des dossiers actifs." : "Échec de la suppression.");
      return;
    }
    router.replace("/gpf/contacts");
  };

  const stats = useMemo(() => {
    const enCours = dossiers.filter((d) => EN_COURS.has(d.statut)).length;
    const effectifs = dossiers.filter((d) => d.statut === "effectif").length;
    const parProduit = new Map<string, number>();
    for (const d of dossiers) parProduit.set(d.produit, (parProduit.get(d.produit) ?? 0) + 1);
    const dossiersActifs = dossiers.filter(compteDansRevenus);
    const precompteTotal = dossiersActifs.reduce((sum, d) => sum + (d.precompte_lineaire_1ere_annee ?? 0), 0);
    const lineaireTotal = dossiersActifs.reduce((sum, d) => sum + (d.lineaire_n1 ?? 0), 0);
    return { enCours, effectifs, parProduit, precompteTotal, lineaireTotal, estClient: effectifs > 0 };
  }, [dossiers]);

  const selectedDossier = dossiers.find((d) => d.id === selectedDossierId) ?? null;

  usePageTitle(client ? formatNom(client) : null);

  if (loading) return <SkeletonPage />;
  if (!client) return <p className="text-sm text-[var(--gpf-muted)]">Client introuvable.</p>;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/gpf/contacts" className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)] w-fit">
        ← Clients
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl text-[var(--gpf-ink)]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
              {client.civilite ? `${client.civilite} ` : ""}
              {formatNom(client)}
            </h1>
            <span
              className="text-[10px] font-semibold uppercase tracking-wide text-white rounded-full px-2 py-0.5"
              style={{ background: stats.estClient ? "#2f9e6e" : "#c98a1f" }}
            >
              {stats.estClient ? "Client" : "Prospect"}
            </span>
          </div>
          <p className="text-sm text-[var(--gpf-muted)] mt-1">
            {[client.email, client.telephone, [client.ville, client.code_postal].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || "Aucune coordonnée"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-[var(--gpf-subtle)]">Dossiers actifs</div>
            <div className="text-xl font-semibold tabular-nums text-[var(--gpf-ink)]">{stats.enCours + stats.effectifs}</div>
          </div>
          <button
            onClick={deleteClient}
            title="Supprimer ce client"
            className="text-[#c0392b] hover:bg-[#fdecea] rounded-lg w-9 h-9 flex items-center justify-center"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[var(--gpf-border)]">
        {(
          [
            ["accueil", "Accueil"],
            ["dossiers", `Dossiers (${dossiers.length})`],
            ["coordonnees", "Coordonnées"]
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-2 text-sm -mb-px border-b-2 transition-colors ${
              tab === key ? "border-[#CDAA5A] text-[var(--gpf-ink)] font-semibold" : "border-transparent text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "accueil" ? (
        <AccueilTab dossiers={dossiers} stats={stats} onOpenDossier={(dId) => setSelectedDossierId(dId)} onSeeAll={() => setTab("dossiers")} />
      ) : null}

      {tab === "dossiers" ? (
        <DossiersTab clientId={id} dossiers={dossiers} onChanged={load} onOpenDossier={(dId) => setSelectedDossierId(dId)} />
      ) : null}

      {tab === "coordonnees" ? <CoordonneesTab client={client} onSaved={load} /> : null}

      {selectedDossier ? (
        <DossierModal dossier={selectedDossier} onClose={() => setSelectedDossierId(null)} onChanged={load} />
      ) : null}
    </div>
  );
}

function AccueilTab({
  dossiers,
  stats,
  onOpenDossier,
  onSeeAll
}: {
  dossiers: GpfDossier[];
  stats: { enCours: number; effectifs: number; parProduit: Map<string, number>; precompteTotal: number; lineaireTotal: number };
  onOpenDossier: (id: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiTile label="En cours" value={stats.enCours} accent="#c98a1f" />
        <KpiTile label="Effectifs" value={stats.effectifs} accent="#2f9e6e" />
        <KpiTile label="Total" value={dossiers.length} />
      </div>

      {stats.precompteTotal > 0 || stats.lineaireTotal > 0 ? (
        <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] border-t-2 rounded-xl p-4" style={{ borderTopColor: "#CDAA5A" }}>
          <h2 className="text-sm font-semibold text-[var(--gpf-ink)] mb-3">Revenus (estimation)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--gpf-subtle)]">Précompte / 1ère année</div>
              <div className="text-lg font-semibold tabular-nums text-[var(--gpf-ink)]">{euro(stats.precompteTotal)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[var(--gpf-subtle)]">Linéaire N+1</div>
              <div className="text-lg font-semibold tabular-nums text-[var(--gpf-ink)]">{euro(stats.lineaireTotal)}</div>
            </div>
          </div>
          <p className="text-[11px] text-[var(--gpf-subtle)] mt-3">
            Basé sur les dernières données importées — pas encore de suivi mensuel automatique des bordereaux.
          </p>
        </div>
      ) : null}

      {stats.parProduit.size > 0 ? (
        <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-[var(--gpf-ink)] mb-3">Répartition par produit</h2>
          <div className="flex flex-col gap-2">
            {[...stats.parProduit.entries()].map(([produit, count]) => (
              <div key={produit} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: GPF_PRODUIT_COLOR[produit as keyof typeof GPF_PRODUIT_COLOR] }} />
                <span className="text-xs text-[var(--gpf-muted)] flex-1">{GPF_PRODUIT_LABEL[produit as keyof typeof GPF_PRODUIT_LABEL]}</span>
                <span className="text-xs text-[var(--gpf-subtle)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gpf-border)]">
          <h2 className="text-sm font-semibold text-[var(--gpf-ink)]">Dossiers</h2>
          <button onClick={onSeeAll} className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
            Voir tout →
          </button>
        </div>
        {dossiers.length === 0 ? (
          <p className="text-sm text-[var(--gpf-subtle)] px-4 py-6 text-center">Aucun dossier pour l&apos;instant.</p>
        ) : (
          dossiers.slice(0, 5).map((d) => <DossierRow key={d.id} dossier={d} onClick={() => onOpenDossier(d.id)} />)
        )}
      </div>
    </div>
  );
}

function DossiersTab({
  clientId,
  dossiers,
  onChanged,
  onOpenDossier
}: {
  clientId: string;
  dossiers: GpfDossier[];
  onChanged: () => void;
  onOpenDossier: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2">
          {showForm ? "Annuler" : "+ Nouveau dossier"}
        </button>
      </div>
      {showForm ? (
        <NewDossierForm
          clientId={clientId}
          onCreated={() => {
            setShowForm(false);
            onChanged();
          }}
        />
      ) : null}
      <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-hidden">
        {dossiers.length === 0 ? (
          <p className="text-sm text-[var(--gpf-subtle)] px-4 py-6 text-center">Aucun dossier pour l&apos;instant.</p>
        ) : (
          dossiers.map((d) => <DossierRow key={d.id} dossier={d} onClick={() => onOpenDossier(d.id)} />)
        )}
      </div>
    </div>
  );
}

function DossierRow({ dossier, onClick }: { dossier: GpfDossier; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 border-b border-[var(--gpf-border-soft)] last:border-0 hover:bg-[var(--gpf-surface-alt)] text-left">
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ background: GPF_PRODUIT_COLOR[dossier.produit] }}
      >
        {GPF_PRODUIT_LABEL[dossier.produit].charAt(0)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-[var(--gpf-ink)] truncate">{GPF_PRODUIT_LABEL[dossier.produit]}</span>
        <span className="block text-xs text-[var(--gpf-subtle)] truncate">{dossier.assureur_nom ?? "Assureur non renseigné"}</span>
      </span>
      <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5 shrink-0" style={{ background: GPF_STATUT_COLOR[dossier.statut] }}>
        {GPF_STATUT_LABEL[dossier.statut]}
      </span>
      <span className="text-[var(--gpf-subtle)] text-sm shrink-0">›</span>
    </button>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] border-t-2 rounded-xl p-4" style={{ borderTopColor: "#CDAA5A" }}>
      <div className="text-xs text-[var(--gpf-muted)] mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums" style={{ color: accent ?? "var(--gpf-ink)" }}>
        {value}
      </div>
    </div>
  );
}

function DossierModal({ dossier, onClose, onChanged }: { dossier: GpfDossier; onClose: () => void; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const [pendingRefus, setPendingRefus] = useState(false);
  const [motifRefus, setMotifRefus] = useState("");

  const changeStatut = async (statut: string, motif?: string) => {
    // Passer en Refusé demande d'abord un motif : on ouvre le choix au lieu
    // d'enregistrer tout de suite.
    if (statut === "refuse" && dossier.statut !== "refuse" && !motif) {
      setPendingRefus(true);
      return;
    }
    setSaving(true);
    await fetch(`/api/gpf/commercial/${dossier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(motif ? { statut, motif_refus: motif } : { statut })
    });
    setSaving(false);
    setPendingRefus(false);
    onChanged();
  };

  const deleteDossier = async () => {
    if (!confirm(`Supprimer ce dossier (${GPF_PRODUIT_LABEL[dossier.produit]}) ? Déplacé vers la corbeille, restaurable 30 jours.`)) return;
    await fetch(`/api/gpf/commercial/${dossier.id}`, { method: "DELETE" });
    onChanged();
    onClose();
  };

  const prime =
    dossier.produit === "per" || dossier.produit === "assurance_vie"
      ? euro(dossier.placement_initial)
      : dossier.prime_mensuelle != null
        ? `${euro(dossier.prime_mensuelle)}/mois`
        : dossier.prime_annuelle != null
          ? `${euro(dossier.prime_annuelle)}/an`
          : null;

  const kpis: [string, string | null][] = [
    ["Prime", prime],
    ["Frais de dossier", euro(dossier.frais_dossier)],
    ["Précompte / Linéaire 1ère année", euro(dossier.precompte_lineaire_1ere_annee)],
    ["Linéaire N+1", euro(dossier.lineaire_n1)]
  ].filter(([, v]) => v) as [string, string | null][];

  const details = (
    [
      ["Assureur", dossier.assureur_nom],
      ["Référence contrat", dossier.reference_contrat],
      ["Date d'effet", frDate(dossier.date_effet)],
      ["Montant emprunté", euro(dossier.montant_pret)],
      ["Motif de refus", dossier.motif_refus],
      ["Taux", dossier.taux != null ? `${dossier.taux} %` : null],
      ["Durée", dossier.duree_mois != null ? `${dossier.duree_mois} mois` : null],
      ["Placement mensuel", euro(dossier.placement_mensuel)],
      ["Frais d'entrée", euro(dossier.frais_entree)],
      ["Frais de gestion", dossier.frais_gestion_pct != null ? `${dossier.frais_gestion_pct} %` : null],
      ["Rémunération apporteur", dossier.remuneration_apporteur_pct != null ? `${dossier.remuneration_apporteur_pct} %` : null],
      ["Source", dossier.source],
      ["Date de dépôt", frDate(dossier.date_depot)],
      ["Relances envoyées", dossier.relances_envoyees > 0 ? String(dossier.relances_envoyees) : null],
      ["Lien du dossier", dossier.lien_dossier]
    ] as [string, string | null][]
  ).filter(([, v]) => v);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[var(--gpf-surface)] rounded-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--gpf-border-soft)]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[var(--gpf-ink)]">{GPF_PRODUIT_LABEL[dossier.produit]}</h3>
              <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ background: GPF_STATUT_COLOR[dossier.statut] }}>
                {GPF_STATUT_LABEL[dossier.statut]}
              </span>
            </div>
            {dossier.assureur_nom ? <p className="text-xs text-[var(--gpf-muted)] mt-0.5">{dossier.assureur_nom}</p> : null}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={deleteDossier} title="Supprimer" className="text-[#c0392b] hover:bg-[#fdecea] rounded-lg w-8 h-8 flex items-center justify-center text-sm">
              🗑
            </button>
            <button onClick={onClose} className="text-[var(--gpf-muted)] hover:bg-[var(--gpf-fill)] rounded-lg w-8 h-8 flex items-center justify-center text-sm">
              ✕
            </button>
          </div>
        </div>

        {kpis.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--gpf-fill)] border-b border-[var(--gpf-border-soft)]">
            {kpis.map(([label, value]) => (
              <div key={label} className="bg-[var(--gpf-surface)] p-3">
                <div className="text-[10px] uppercase tracking-wide text-[var(--gpf-subtle)]">{label}</div>
                <div className="text-sm font-semibold text-[var(--gpf-ink)] mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--gpf-subtle)]">Statut</span>
            <select
              value={dossier.statut}
              disabled={saving}
              onChange={(e) => changeStatut(e.target.value)}
              className="text-xs font-semibold text-white rounded-full px-3 py-1.5 border-0 cursor-pointer"
              style={{ background: GPF_STATUT_COLOR[dossier.statut] }}
            >
              {GPF_STATUTS.map((s) => (
                <option key={s} value={s} style={{ color: "#000", background: "var(--gpf-surface)" }}>
                  {GPF_STATUT_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          {pendingRefus ? (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[var(--gpf-danger-tint)] border border-[#f3d4d1]">
              <span className="text-xs text-[#b3463f] shrink-0">Motif du refus :</span>
              <select value={motifRefus} onChange={(e) => setMotifRefus(e.target.value)} className="rounded-lg border border-[var(--gpf-border)] px-2 py-1.5 text-xs flex-1 bg-[var(--gpf-surface)]">
                <option value="">— Choisir —</option>
                {GPF_MOTIFS_REFUS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                onClick={() => changeStatut("refuse", motifRefus)}
                disabled={!motifRefus || saving}
                className="rounded-full bg-[#b3463f] text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50"
              >
                Valider
              </button>
              <button onClick={() => setPendingRefus(false)} className="text-xs text-[var(--gpf-muted)]">
                Annuler
              </button>
            </div>
          ) : null}

          {details.length === 0 ? (
            <p className="text-xs text-[var(--gpf-subtle)]">Aucune autre information sur ce dossier.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {details.map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--gpf-subtle)]">{label}</div>
                  <div className="text-sm text-[var(--gpf-ink)] mt-0.5">
                    {label === "Lien du dossier" ? (
                      <a href={value!} target="_blank" rel="noopener" className="text-[var(--gpf-ink)] underline">
                        Ouvrir
                      </a>
                    ) : (
                      value
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DocumentsSection dossierId={dossier.id} />
        </div>
      </div>
    </div>
  );
}

function DocumentsSection({ dossierId }: { dossierId: string }) {
  const [documents, setDocuments] = useState<GpfDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState(DOCUMENT_TYPES[0]);

  const load = async () => {
    const res = await fetch(`/api/gpf/commercial/${dossierId}/documents`);
    const data = await res.json();
    if (data.ok) setDocuments(data.documents);
    setLoading(false);
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
    await fetch(`/api/gpf/commercial/${dossierId}/documents`, { method: "POST", body: form });
    setUploading(false);
    load();
  };

  const openDocument = async (docId: string) => {
    const res = await fetch(`/api/gpf/documents/${docId}`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank");
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm("Supprimer ce document ? Déplacé vers la corbeille, restaurable 30 jours.")) return;
    await fetch(`/api/gpf/documents/${docId}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="mt-5 pt-4 border-t border-[var(--gpf-border-soft)]">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--gpf-subtle)] mb-2">Documents</h4>

      <div className="flex items-center gap-2 mb-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-[var(--gpf-border)] px-2 py-1.5 text-xs">
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-3 py-1.5 cursor-pointer">
          {uploading ? "Envoi..." : "+ Ajouter un fichier"}
          <input
            type="file"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-[10px] text-[var(--gpf-subtle)] -mt-2 mb-3">Ne déposez pas de documents médicaux (questionnaires de santé, diagnostics).</p>

      {loading ? (
        <p className="text-xs text-[var(--gpf-subtle)]">Chargement...</p>
      ) : documents.length === 0 ? (
        <p className="text-xs text-[var(--gpf-subtle)]">Aucun document pour ce dossier.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 bg-[var(--gpf-surface-alt)] rounded-lg px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--gpf-muted)] bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded px-1.5 py-0.5 shrink-0">
                {doc.type}
              </span>
              <button onClick={() => openDocument(doc.id)} className="text-xs text-[var(--gpf-ink)] underline truncate flex-1 text-left">
                {doc.nom_fichier ?? "Document"}
              </button>
              <button onClick={() => deleteDocument(doc.id)} className="text-[#c0392b] text-xs shrink-0">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewDossierForm({ clientId, onCreated }: { clientId: string; onCreated: () => void }) {
  const [produit, setProduit] = useState<string>(GPF_PRODUITS[0]);
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/gpf/contacts/${clientId}/dossiers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit, source: source || undefined })
    });
    setSaving(false);
    onCreated();
  };

  return (
    <form onSubmit={submit} className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl p-4 grid gap-3">
      <select value={produit} onChange={(e) => setProduit(e.target.value)} className="rounded-lg border border-[var(--gpf-border)] px-3 py-2 text-sm">
        {GPF_PRODUITS.map((p) => (
          <option key={p} value={p}>
            {GPF_PRODUIT_LABEL[p]}
          </option>
        ))}
      </select>
      <input
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="Source (optionnel)"
        className="rounded-lg border border-[var(--gpf-border)] px-3 py-2 text-sm"
      />
      <button type="submit" disabled={saving} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2 w-fit">
        {saving ? "..." : "Ajouter le dossier"}
      </button>
    </form>
  );
}

const FIELDS: { key: keyof GpfClient; label: string; type?: string }[] = [
  { key: "civilite", label: "Civilité" },
  { key: "prenom", label: "Prénom" },
  { key: "nom", label: "Nom" },
  { key: "email", label: "E-mail", type: "email" },
  { key: "telephone", label: "Téléphone" },
  { key: "adresse", label: "Adresse" },
  { key: "ville", label: "Ville" },
  { key: "code_postal", label: "Code postal" },
  { key: "annee_naissance", label: "Année de naissance", type: "number" },
  { key: "profession", label: "Profession" }
];

function CoordonneesTab({ client, onSaved }: { client: GpfClient; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, client[f.key] != null ? String(client[f.key]) : ""]))
  );
  const [notes, setNotes] = useState(client.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const body: Record<string, string | number | null> = { notes: notes || null };
    for (const f of FIELDS) {
      const raw = form[f.key] as string;
      body[f.key] = raw === "" ? null : f.type === "number" ? Number(raw) : raw;
    }
    await fetch(`/api/gpf/contacts/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSaving(false);
    setSaved(true);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl p-5 grid gap-4 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="text-xs text-[var(--gpf-muted)] flex flex-col gap-1">
            {f.label}
            <input
              type={f.type ?? "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="rounded-lg border border-[var(--gpf-border)] px-3 py-2 text-sm text-[var(--gpf-ink)]"
            />
          </label>
        ))}
      </div>
      <label className="text-xs text-[var(--gpf-muted)] flex flex-col gap-1">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-lg border border-[var(--gpf-border)] px-3 py-2 text-sm text-[var(--gpf-ink)]"
        />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2 w-fit">
          {saving ? "..." : "Enregistrer"}
        </button>
        {saved ? <span className="text-xs text-[#00c875]">Enregistré ✓</span> : null}
      </div>
    </form>
  );
}
