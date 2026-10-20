"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { GpfClient } from "@/lib/gpf/types";

export default function GpfClientsPage() {
  const [clients, setClients] = useState<GpfClient[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async (query = "") => {
    setLoading(true);
    const res = await fetch(`/api/gpf/clients${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    if (data.ok) setClients(data.clients);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Clients</h1>
        <button onClick={() => setShowForm((v) => !v)} style={buttonStyle}>
          {showForm ? "Annuler" : "+ Nouveau client"}
        </button>
      </div>

      {showForm ? <NewClientForm onCreated={() => { setShowForm(false); load(q); }} /> : null}

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un client (nom, prénom, e-mail)..."
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 15, boxSizing: "border-box", marginBottom: 16 }}
      />

      {loading ? (
        <p style={{ color: "#64717d" }}>Chargement...</p>
      ) : clients.length === 0 ? (
        <p style={{ color: "#64717d" }}>Aucun client.</p>
      ) : (
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
                  color: "#0d1f3c"
                }}
              >
                <strong>{c.prenom} {c.nom}</strong>
                <div style={{ fontSize: 13, color: "#64717d", marginTop: 2 }}>
                  {[c.email, c.telephone, c.ville].filter(Boolean).join(" · ") || "Pas d'information de contact"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
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
const buttonStyle: React.CSSProperties = { padding: "9px 16px", borderRadius: 100, border: 0, background: "#0d1f3c", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
