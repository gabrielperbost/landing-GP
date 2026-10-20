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

function DossierCard({ dossier, onChanged }: { dossier: GpfDossier; onChanged: () => void }) {
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

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e5e9", borderRadius: 10, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <strong>{GPF_PRODUIT_LABEL[dossier.produit]}</strong>
        <select
          value={dossier.statut}
          disabled={saving}
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
