"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GPF_PRODUIT_LABEL, GPF_PRODUITS, GPF_STATUT_LABEL, type GpfClientListItem } from "@/lib/gpf/types";

export default function GpfClientsPage() {
  const [clients, setClients] = useState<GpfClientListItem[]>([]);
  const [q, setQ] = useState("");
  const [produit, setProduit] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async (query = "", produitFilter = "") => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (produitFilter) params.set("produit", produitFilter);
    const res = await fetch(`/api/gpf/clients${params.toString() ? `?${params}` : ""}`);
    const data = await res.json();
    if (data.ok) setClients(data.clients);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q, produit), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, produit]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0, color: "#071C2C", fontFamily: "var(--font-gpf-serif)" }}>Clients</h1>
        <button onClick={() => setShowForm((v) => !v)} style={buttonStyle}>
          {showForm ? "Annuler" : "+ Nouveau client"}
        </button>
      </div>

      {showForm ? <NewClientForm onCreated={() => { setShowForm(false); load(q); }} /> : null}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un client (nom, prénom, e-mail)..."
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 15, boxSizing: "border-box" }}
        />
        <select
          value={produit}
          onChange={(e) => setProduit(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 14, background: "#fff" }}
        >
          <option value="">Tous les produits</option>
          {GPF_PRODUITS.map((p) => (
            <option key={p} value={p}>
              {GPF_PRODUIT_LABEL[p]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#64717d" }}>Chargement...</p>
      ) : clients.length === 0 ? (
        <p style={{ color: "#64717d" }}>Aucun client{produit ? ` pour « ${GPF_PRODUIT_LABEL[produit as keyof typeof GPF_PRODUIT_LABEL]} »` : ""}.</p>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "#64717d", margin: "0 0 10px" }}>{clients.length} client{clients.length > 1 ? "s" : ""}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/gpf/clients/${c.id}`}
                  style={{
                    display: "block",
                    padding: "14px 16px",
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #e2e5e9",
                    textDecoration: "none",
                    color: "#071C2C"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <strong>{c.prenom} {c.nom}</strong>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {c.produits.length === 0 ? (
                        <span style={{ fontSize: 10, color: "#9aa3ab" }}>Aucun dossier</span>
                      ) : (
                        c.produits.map((p) => (
                          <span
                            key={p}
                            style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: "#eff3f7", color: "#071C2C" }}
                          >
                            {GPF_PRODUIT_LABEL[p]}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#64717d", marginTop: 4 }}>
                    {[c.email, c.telephone, c.ville].filter(Boolean).join(" · ") || "Pas d'information de contact"}
                  </div>
                  {c.statuts.length > 0 ? (
                    <div style={{ fontSize: 11, color: "#9aa3ab", marginTop: 4 }}>
                      {c.statuts.map((s) => GPF_STATUT_LABEL[s]).join(" · ")}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function NewClientForm({ onCreated }: { onCreated: () => void }) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/gpf/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenom, nom, email: email || undefined, telephone: telephone || undefined })
    });
    setSaving(false);
    if (!res.ok) {
      setError("Impossible de créer le client.");
      return;
    }
    onCreated();
  };

  return (
    <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e2e5e9", borderRadius: 10, padding: 16, marginBottom: 16, display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input required value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" style={inputStyle} />
        <input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" style={inputStyle} />
      </div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" style={inputStyle} />
      <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" style={inputStyle} />
      {error ? <p style={{ color: "#c0392b", fontSize: 13, margin: 0 }}>{error}</p> : null}
      <button type="submit" disabled={saving} style={{ ...buttonStyle, justifySelf: "start" }}>
        {saving ? "..." : "Créer le client"}
      </button>
    </form>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 14, boxSizing: "border-box" };
const buttonStyle: React.CSSProperties = { padding: "9px 16px", borderRadius: 100, border: 0, background: "#CDAA5A", color: "#071C2C", fontWeight: 600, fontSize: 13, cursor: "pointer" };
