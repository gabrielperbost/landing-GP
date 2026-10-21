"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GPF_PRODUIT_COLOR,
  GPF_PRODUIT_LABEL,
  GPF_PRODUITS,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  GPF_STATUTS,
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
    const res = await fetch(`/api/gpf/clients/${id}`);
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
    if (!confirm(`Supprimer ${client?.prenom} ${client?.nom} ? Impossible s'il a encore des dossiers.`)) return;
    const res = await fetch(`/api/gpf/clients/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      alert(data.error?.includes("foreign key") ? "Impossible : ce client a encore des dossiers." : "Échec de la suppression.");
      return;
    }
    router.replace("/gpf/clients");
  };

  const stats = useMemo(() => {
    const enCours = dossiers.filter((d) => EN_COURS.has(d.statut)).length;
    const effectifs = dossiers.filter((d) => d.statut === "effectif").length;
    const parProduit = new Map<string, number>();
    for (const d of dossiers) parProduit.set(d.produit, (parProduit.get(d.produit) ?? 0) + 1);
    return { enCours, effectifs, parProduit };
  }, [dossiers]);

  const selectedDossier = dossiers.find((d) => d.id === selectedDossierId) ?? null;

  if (loading) return <p className="text-sm text-[#64717d]">Chargement...</p>;
  if (!client) return <p className="text-sm text-[#64717d]">Client introuvable.</p>;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/gpf/clients" className="text-xs text-[#64717d] hover:text-[#071C2C] w-fit">
        ← Clients
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl text-[#071C2C]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
              {client.civilite ? `${client.civilite} ` : ""}
              {client.prenom} {client.nom}
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#64717d] bg-[#eff3f7] rounded-full px-2 py-0.5">Client</span>
          </div>
          <p className="text-sm text-[#64717d] mt-1">
            {[client.email, client.telephone, [client.ville, client.code_postal].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || "Aucune coordonnée"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-[#9aa3ab]">Dossiers actifs</div>
            <div className="text-xl font-semibold tabular-nums text-[#071C2C]">{stats.enCours + stats.effectifs}</div>
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

      <div className="flex gap-1 border-b border-[#e2e5e9]">
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
              tab === key ? "border-[#071C2C] text-[#071C2C] font-semibold" : "border-transparent text-[#64717d] hover:text-[#071C2C]"
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
  stats: { enCours: number; effectifs: number; parProduit: Map<string, number> };
  onOpenDossier: (id: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <KpiTile label="En cours" value={stats.enCours} accent="#579bfc" />
        <KpiTile label="Effectifs" value={stats.effectifs} accent="#00c875" />
        <KpiTile label="Total" value={dossiers.length} />
      </div>

      {stats.parProduit.size > 0 ? (
        <div className="bg-white border border-[#e2e5e9] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-[#071C2C] mb-3">Répartition par produit</h2>
          <div className="flex flex-col gap-2">
            {[...stats.parProduit.entries()].map(([produit, count]) => (
              <div key={produit} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: GPF_PRODUIT_COLOR[produit as keyof typeof GPF_PRODUIT_COLOR] }} />
                <span className="text-xs text-[#64717d] flex-1">{GPF_PRODUIT_LABEL[produit as keyof typeof GPF_PRODUIT_LABEL]}</span>
                <span className="text-xs text-[#9aa3ab]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-white border border-[#e2e5e9] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e5e9]">
          <h2 className="text-sm font-semibold text-[#071C2C]">Dossiers</h2>
          <button onClick={onSeeAll} className="text-xs text-[#64717d] hover:text-[#071C2C]">
            Voir tout →
          </button>
        </div>
        {dossiers.length === 0 ? (
          <p className="text-sm text-[#9aa3ab] px-4 py-6 text-center">Aucun dossier pour l&apos;instant.</p>
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
        <button onClick={() => setShowForm((v) => !v)} className="rounded-full bg-[#CDAA5A] text-[#071C2C] text-xs font-semibold px-4 py-2">
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
      <div className="bg-white border border-[#e2e5e9] rounded-xl overflow-hidden">
        {dossiers.length === 0 ? (
          <p className="text-sm text-[#9aa3ab] px-4 py-6 text-center">Aucun dossier pour l&apos;instant.</p>
        ) : (
          dossiers.map((d) => <DossierRow key={d.id} dossier={d} onClick={() => onOpenDossier(d.id)} />)
        )}
      </div>
    </div>
  );
}

function DossierRow({ dossier, onClick }: { dossier: GpfDossier; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#f1f2f4] last:border-0 hover:bg-[#fafbfc] text-left">
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ background: GPF_PRODUIT_COLOR[dossier.produit] }}
      >
        {GPF_PRODUIT_LABEL[dossier.produit].charAt(0)}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-[#071C2C] truncate">{GPF_PRODUIT_LABEL[dossier.produit]}</span>
        <span className="block text-xs text-[#9aa3ab] truncate">{dossier.assureur_nom ?? "Assureur non renseigné"}</span>
      </span>
      <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5 shrink-0" style={{ background: GPF_STATUT_COLOR[dossier.statut] }}>
        {GPF_STATUT_LABEL[dossier.statut]}
      </span>
      <span className="text-[#9aa3ab] text-sm shrink-0">›</span>
    </button>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white border border-[#e2e5e9] border-t-2 rounded-xl p-4" style={{ borderTopColor: "#CDAA5A" }}>
      <div className="text-xs text-[#64717d] mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums" style={{ color: accent ?? "#071C2C" }}>
        {value}
      </div>
    </div>
  );
}

function DossierModal({ dossier, onClose, onChanged }: { dossier: GpfDossier; onClose: () => void; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);

  const changeStatut = async (statut: string) => {
    setSaving(true);
    await fetch(`/api/gpf/dossiers/${dossier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut })
    });
    setSaving(false);
    onChanged();
  };

  const deleteDossier = async () => {
    if (!confirm(`Supprimer ce dossier (${GPF_PRODUIT_LABEL[dossier.produit]}) ? Cette action est définitive.`)) return;
    await fetch(`/api/gpf/dossiers/${dossier.id}`, { method: "DELETE" });
    onChanged();
    onClose();
  };

  const montantPrincipal =
    dossier.produit === "per" || dossier.produit === "assurance_vie" ? euro(dossier.placement_initial) : euro(dossier.montant_pret);

  const kpis: [string, string | null][] = [
    ["Montant", montantPrincipal],
    ["Frais de dossier", euro(dossier.frais_dossier)],
    ["Précompte / Linéaire 1ère année", euro(dossier.precompte_lineaire_1ere_annee)],
    ["Linéaire N+1", euro(dossier.lineaire_n1)]
  ].filter(([, v]) => v) as [string, string | null][];

  const details = (
    [
      ["Assureur", dossier.assureur_nom],
      ["Référence contrat", dossier.reference_contrat],
      ["Date d'effet", frDate(dossier.date_effet)],
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
      <div className="bg-white rounded-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#eef0f2]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#071C2C]">{GPF_PRODUIT_LABEL[dossier.produit]}</h3>
              <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5" style={{ background: GPF_STATUT_COLOR[dossier.statut] }}>
                {GPF_STATUT_LABEL[dossier.statut]}
              </span>
            </div>
            {dossier.assureur_nom ? <p className="text-xs text-[#64717d] mt-0.5">{dossier.assureur_nom}</p> : null}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={deleteDossier} title="Supprimer" className="text-[#c0392b] hover:bg-[#fdecea] rounded-lg w-8 h-8 flex items-center justify-center text-sm">
              🗑
            </button>
            <button onClick={onClose} className="text-[#64717d] hover:bg-[#f1f2f4] rounded-lg w-8 h-8 flex items-center justify-center text-sm">
              ✕
            </button>
          </div>
        </div>

        {kpis.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#eef0f2] border-b border-[#eef0f2]">
            {kpis.map(([label, value]) => (
              <div key={label} className="bg-white p-3">
                <div className="text-[10px] uppercase tracking-wide text-[#9aa3ab]">{label}</div>
                <div className="text-sm font-semibold text-[#071C2C] mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa3ab]">Statut</span>
            <select
              value={dossier.statut}
              disabled={saving}
              onChange={(e) => changeStatut(e.target.value)}
              className="text-xs font-semibold text-white rounded-full px-3 py-1.5 border-0 cursor-pointer"
              style={{ background: GPF_STATUT_COLOR[dossier.statut] }}
            >
              {GPF_STATUTS.map((s) => (
                <option key={s} value={s} style={{ color: "#000", background: "#fff" }}>
                  {GPF_STATUT_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          {details.length === 0 ? (
            <p className="text-xs text-[#9aa3ab]">Aucune autre information sur ce dossier.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {details.map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] uppercase tracking-wide text-[#9aa3ab]">{label}</div>
                  <div className="text-sm text-[#071C2C] mt-0.5">
                    {label === "Lien du dossier" ? (
                      <a href={value!} target="_blank" rel="noopener" className="text-[#071C2C] underline">
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
    const res = await fetch(`/api/gpf/dossiers/${dossierId}/documents`);
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
    await fetch(`/api/gpf/dossiers/${dossierId}/documents`, { method: "POST", body: form });
    setUploading(false);
    load();
  };

  const openDocument = async (docId: string) => {
    const res = await fetch(`/api/gpf/documents/${docId}`);
    const data = await res.json();
    if (data.ok) window.open(data.url, "_blank");
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await fetch(`/api/gpf/documents/${docId}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="mt-5 pt-4 border-t border-[#eef0f2]">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[#9aa3ab] mb-2">Documents</h4>

      <div className="flex items-center gap-2 mb-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-[#e2e5e9] px-2 py-1.5 text-xs">
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="rounded-full bg-[#CDAA5A] text-[#071C2C] text-xs font-semibold px-3 py-1.5 cursor-pointer">
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

      {loading ? (
        <p className="text-xs text-[#9aa3ab]">Chargement...</p>
      ) : documents.length === 0 ? (
        <p className="text-xs text-[#9aa3ab]">Aucun document pour ce dossier.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2 bg-[#fafbfc] rounded-lg px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#64717d] bg-white border border-[#e2e5e9] rounded px-1.5 py-0.5 shrink-0">
                {doc.type}
              </span>
              <button onClick={() => openDocument(doc.id)} className="text-xs text-[#071C2C] underline truncate flex-1 text-left">
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
    await fetch(`/api/gpf/clients/${clientId}/dossiers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit, source: source || undefined })
    });
    setSaving(false);
    onCreated();
  };

  return (
    <form onSubmit={submit} className="bg-white border border-[#e2e5e9] rounded-xl p-4 grid gap-3">
      <select value={produit} onChange={(e) => setProduit(e.target.value)} className="rounded-lg border border-[#e2e5e9] px-3 py-2 text-sm">
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
        className="rounded-lg border border-[#e2e5e9] px-3 py-2 text-sm"
      />
      <button type="submit" disabled={saving} className="rounded-full bg-[#CDAA5A] text-[#071C2C] text-xs font-semibold px-4 py-2 w-fit">
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
    await fetch(`/api/gpf/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSaving(false);
    setSaved(true);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="bg-white border border-[#e2e5e9] rounded-xl p-5 grid gap-4 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="text-xs text-[#64717d] flex flex-col gap-1">
            {f.label}
            <input
              type={f.type ?? "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="rounded-lg border border-[#e2e5e9] px-3 py-2 text-sm text-[#071C2C]"
            />
          </label>
        ))}
      </div>
      <label className="text-xs text-[#64717d] flex flex-col gap-1">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-lg border border-[#e2e5e9] px-3 py-2 text-sm text-[#071C2C]"
        />
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="rounded-full bg-[#CDAA5A] text-[#071C2C] text-xs font-semibold px-4 py-2 w-fit">
          {saving ? "..." : "Enregistrer"}
        </button>
        {saved ? <span className="text-xs text-[#00c875]">Enregistré ✓</span> : null}
      </div>
    </form>
  );
}
