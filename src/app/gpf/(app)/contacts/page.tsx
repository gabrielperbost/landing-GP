"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GPF_PRODUIT_LABEL, GPF_PRODUITS, GPF_STATUT_LABEL, formatNom, type GpfClientListItem } from "@/lib/gpf/types";
import { SkeletonLines } from "@/components/gpf/Skeleton";

type Segment = "tous" | "client" | "prospect";
const PAGE_SIZE = 50;

export default function GpfClientsPage() {
  const [clients, setClients] = useState<GpfClientListItem[]>([]);
  const [counts, setCounts] = useState<{ tous: number; client: number; prospect: number } | null>(null);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [produit, setProduit] = useState("");
  const [segment, setSegment] = useState<Segment>("tous");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    if (produit) params.set("produit", produit);
    if (segment !== "tous") params.set("segment", segment);
    const res = await fetch(`/api/gpf/contacts?${params}`);
    const data = await res.json();
    if (data.ok) {
      setClients(data.clients);
      setCounts(data.counts);
      setTotal(data.total);
    }
    setLoading(false);
  };

  // Recherche tapée : on attend une courte pause avant d'interroger le serveur.
  useEffect(() => {
    const t = setTimeout(() => load(), q ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, produit, segment, page]);

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const tabLabel = (label: string, n: number | undefined) => (counts ? `${label} (${n})` : label);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0, color: "var(--gpf-ink)", fontFamily: "var(--font-gpf-serif)" }}>Clients</h1>
        <button onClick={() => setShowForm((v) => !v)} style={buttonStyle}>
          {showForm ? "Annuler" : "+ Nouveau client"}
        </button>
      </div>

      {showForm ? <NewClientForm onCreated={() => { setShowForm(false); load(); }} /> : null}

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <SegmentTab active={segment === "tous"} label={tabLabel("Tous", counts?.tous)} onClick={() => changeFilter(() => setSegment("tous"))} />
        <SegmentTab active={segment === "client"} label={tabLabel("Clients", counts?.client)} color="#2f9e6e" onClick={() => changeFilter(() => setSegment("client"))} />
        <SegmentTab active={segment === "prospect"} label={tabLabel("Prospects", counts?.prospect)} color="#c98a1f" onClick={() => changeFilter(() => setSegment("prospect"))} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => changeFilter(() => setQ(e.target.value))}
          placeholder="Rechercher un client (nom, prénom, e-mail)..."
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--gpf-border)", fontSize: 15, boxSizing: "border-box" }}
        />
        <select
          value={produit}
          onChange={(e) => changeFilter(() => setProduit(e.target.value))}
          style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--gpf-border)", fontSize: 14, background: "var(--gpf-surface)" }}
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
        <SkeletonLines rows={8} />
      ) : clients.length === 0 ? (
        <p style={{ color: "var(--gpf-muted)" }}>Aucun client{produit ? ` pour « ${GPF_PRODUIT_LABEL[produit as keyof typeof GPF_PRODUIT_LABEL]} »` : ""}.</p>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "var(--gpf-muted)", margin: "0 0 10px" }}>
            {total} résultat{total > 1 ? "s" : ""}
            {totalPages > 1 ? ` · page ${page} / ${totalPages}` : ""}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/gpf/contacts/${c.id}`}
                  style={{
                    display: "block",
                    padding: "14px 16px",
                    background: "var(--gpf-surface)",
                    borderRadius: 10,
                    border: "1px solid var(--gpf-border)",
                    textDecoration: "none",
                    color: "var(--gpf-ink)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong>{formatNom(c)}</strong>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                          padding: "2px 7px",
                          borderRadius: 100,
                          color: "var(--gpf-surface)",
                          background: c.est_client ? "#2f9e6e" : "#c98a1f"
                        }}
                      >
                        {c.est_client ? "Client" : "Prospect"}
                      </span>
                    </span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {c.produits.length === 0 ? (
                        <span style={{ fontSize: 10, color: "var(--gpf-subtle)" }}>Aucun dossier</span>
                      ) : (
                        c.produits.map((p) => (
                          <span
                            key={p}
                            style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: "var(--gpf-chip)", color: "var(--gpf-ink)" }}
                          >
                            {GPF_PRODUIT_LABEL[p]}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--gpf-muted)", marginTop: 4 }}>
                    {[c.email, c.telephone, c.ville].filter(Boolean).join(" · ") || "Pas d'information de contact"}
                  </div>
                  {c.statuts.length > 0 ? (
                    <div style={{ fontSize: 11, color: "var(--gpf-subtle)", marginTop: 4 }}>
                      {c.statuts.map((s) => GPF_STATUT_LABEL[s]).join(" · ")}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="text-xs text-[var(--gpf-muted)] disabled:opacity-30 rounded-full border border-[var(--gpf-border)] px-3 py-1.5 bg-[var(--gpf-surface)]"
              >
                ← Précédent
              </button>
              <span className="text-xs text-[var(--gpf-subtle)]">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="text-xs text-[var(--gpf-muted)] disabled:opacity-30 rounded-full border border-[var(--gpf-border)] px-3 py-1.5 bg-[var(--gpf-surface)]"
              >
                Suivant →
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function SegmentTab({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 100,
        border: active ? "1px solid transparent" : "1px solid var(--gpf-border)",
        background: active ? color ?? "#071c2c" : "var(--gpf-surface)",
        color: active ? "var(--gpf-surface)" : "var(--gpf-muted)",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer"
      }}
    >
      {label}
    </button>
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
    const res = await fetch("/api/gpf/contacts", {
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
    <form onSubmit={submit} style={{ background: "var(--gpf-surface)", border: "1px solid var(--gpf-border)", borderRadius: 10, padding: 16, marginBottom: 16, display: "grid", gap: 10 }}>
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

const inputStyle: React.CSSProperties = { padding: "10px 12px", borderRadius: 8, border: "1px solid var(--gpf-border)", fontSize: 14, boxSizing: "border-box" };
const buttonStyle: React.CSSProperties = { padding: "9px 16px", borderRadius: 100, border: 0, background: "#CDAA5A", color: "#071c2c", fontWeight: 600, fontSize: 13, cursor: "pointer" };
