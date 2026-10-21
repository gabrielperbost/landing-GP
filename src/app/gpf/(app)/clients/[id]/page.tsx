"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GPF_PRODUIT_LABEL, GPF_PRODUITS, GPF_STATUT_LABEL, GPF_STATUTS, type GpfClient, type GpfDossier } from "@/lib/gpf/types";

export default function GpfClientPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [client, setClient] = useState<GpfClient | null>(null);
  const [dossiers, setDossiers] = useState<GpfDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDossier, setShowNewDossier] = useState(false);

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

  if (loading) return <p style={{ color: "#64717d" }}>Chargement...</p>;
  if (!client) return <p>Client introuvable.</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/gpf/clients" style={{ fontSize: 13, color: "#64717d" }}>
          ← Clients
        </Link>
        <button onClick={deleteClient} style={{ background: "transparent", border: 0, color: "#c0392b", fontSize: 12, cursor: "pointer" }}>
          Supprimer ce client
        </button>
      </div>

      <h1 style={{ fontSize: 22, margin: "10px 0 4px" }}>
        {client.civilite ? `${client.civilite} ` : ""}{client.prenom} {client.nom}
      </h1>
      <p style={{ color: "#64717d", fontSize: 14, margin: "0 0 20px" }}>
        {[client.email, client.telephone, [client.ville, client.code_postal].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || "Aucune coordonnée"}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 10px" }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>Ce que ce client a chez GP Finances</h2>
        <button onClick={() => setShowNewDossier((v) => !v)} style={buttonStyle}>
          {showNewDossier ? "Annuler" : "+ Nouveau dossier"}
        </button>
      </div>

      {showNewDossier ? (
        <NewDossierForm clientId={id} onCreated={() => { setShowNewDossier(false); load(); }} />
      ) : null}

      {dossiers.length === 0 ? (
        <p style={{ color: "#64717d" }}>Aucun dossier pour l&apos;instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dossiers.map((d) => (
            <DossierCard key={d.id} dossier={d} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

const euro = (v: number | null) => (v == null ? null : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v));
const frDate = (v: string | null) => (v ? new Date(v + "T00:00:00").toLocaleDateString("fr-FR") : null);

function DossierCard({ dossier, onChanged }: { dossier: GpfDossier; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

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

  // Tous les champs qui ont une valeur, prêts à afficher : rien n'est caché une
  // fois le dossier ouvert (vous avez demandé « toutes les infos sur les
  // produits »). Les champs vides sont simplement omis.
  const details: [string, string | null][] = [
    ["Assureur", dossier.assureur_nom],
    ["Référence contrat", dossier.reference_contrat],
    ["Date d'effet", frDate(dossier.date_effet)],
    ["Montant du prêt", euro(dossier.montant_pret)],
    ["Taux", dossier.taux != null ? `${dossier.taux} %` : null],
    ["Durée", dossier.duree_mois != null ? `${dossier.duree_mois} mois` : null],
    ["Frais de dossier", euro(dossier.frais_dossier)],
    ["Précompte / Linéaire 1ère année", euro(dossier.precompte_lineaire_1ere_annee)],
    ["Linéaire N+1", euro(dossier.lineaire_n1)],
    ["Placement initial", euro(dossier.placement_initial)],
    ["Placement mensuel", euro(dossier.placement_mensuel)],
    ["Frais d'entrée", euro(dossier.frais_entree)],
    ["Frais de gestion", dossier.frais_gestion_pct != null ? `${dossier.frais_gestion_pct} %` : null],
    ["Rémunération apporteur", dossier.remuneration_apporteur_pct != null ? `${dossier.remuneration_apporteur_pct} %` : null],
    ["Date de dépôt", frDate(dossier.date_depot)],
    ["Relances envoyées", dossier.relances_envoyees > 0 ? String(dossier.relances_envoyees) : null],
    ["Lien du dossier", dossier.lien_dossier]
  ].filter(([, v]) => v);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e5e9", borderRadius: 10, padding: 14 }}>
      <div
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", width: "100%", cursor: "pointer" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#9aa3ab" }}>{expanded ? "▾" : "▸"}</span>
          <strong>{GPF_PRODUIT_LABEL[dossier.produit]}</strong>
          {dossier.assureur_nom ? <span style={{ fontSize: 12, color: "#64717d" }}>· {dossier.assureur_nom}</span> : null}
        </span>
        <select
          value={dossier.statut}
          disabled={saving}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => changeStatut(e.target.value)}
          style={{ ...inputStyle, width: "auto", fontSize: 13, padding: "6px 10px" }}
        >
          {GPF_STATUTS.map((s) => (
            <option key={s} value={s}>
              {GPF_STATUT_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      {dossier.source ? <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64717d" }}>Source : {dossier.source}</p> : null}

      {expanded ? (
        details.length === 0 ? (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9aa3ab" }}>Aucune autre information sur ce dossier.</p>
        ) : (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eef0f2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
            {details.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.03em", color: "#9aa3ab" }}>{label}</div>
                <div style={{ fontSize: 13, color: "#0d1f3c", marginTop: 1 }}>
                  {label === "Lien du dossier" ? (
                    <a href={value!} target="_blank" rel="noopener" style={{ color: "#0d1f3c" }}>
                      Ouvrir
                    </a>
                  ) : (
                    value
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}
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
    <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e2e5e9", borderRadius: 10, padding: 14, marginBottom: 12, display: "grid", gap: 10 }}>
      <select value={produit} onChange={(e) => setProduit(e.target.value)} style={inputStyle}>
        {GPF_PRODUITS.map((p) => (
          <option key={p} value={p}>
            {GPF_PRODUIT_LABEL[p]}
          </option>
        ))}
      </select>
      <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (optionnel)" style={inputStyle} />
      <button type="submit" disabled={saving} style={{ ...buttonStyle, justifySelf: "start" }}>
        {saving ? "..." : "Ajouter le dossier"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 14, boxSizing: "border-box" };
const buttonStyle: React.CSSProperties = { padding: "9px 16px", borderRadius: 100, border: 0, background: "#0d1f3c", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
