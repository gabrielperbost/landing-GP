"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GPF_PRODUIT_LABEL,
  GPF_STATUTS,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  type GpfDossierWithClient,
  type GpfStatut
} from "@/lib/gpf/types";

const euro = (v: number | null) => (v == null ? null : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v));
const frDate = (v: string | null) => (v ? new Date(v + "T00:00:00").toLocaleDateString("fr-FR") : "—");

function montantPrincipal(d: GpfDossierWithClient): string {
  if (d.produit === "per" || d.produit === "assurance_vie") {
    const base = euro(d.placement_initial);
    const mensuel = euro(d.placement_mensuel);
    if (base && mensuel) return `${base} + ${mensuel}/mois`;
    return base ?? mensuel ?? "—";
  }
  return euro(d.montant_pret) ?? "—";
}

export default function GpfDossiersPage() {
  const [dossiers, setDossiers] = useState<GpfDossierWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Set<GpfStatut>>(new Set());

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/gpf/dossiers");
      const data = await res.json();
      if (data.ok) setDossiers(data.dossiers);
      setLoading(false);
    })();
  }, []);

  const changeStatut = async (dossierId: string, statut: string) => {
    setDossiers((prev) => prev.map((d) => (d.id === dossierId ? { ...d, statut: statut as GpfStatut } : d)));
    await fetch(`/api/gpf/dossiers/${dossierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut })
    });
  };

  const toggleGroup = (s: GpfStatut) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return dossiers;
    return dossiers.filter((d) => {
      const nom = `${d.client?.prenom ?? ""} ${d.client?.nom ?? ""}`.toLowerCase();
      return nom.includes(needle) || (d.assureur_nom ?? "").toLowerCase().includes(needle) || (d.source ?? "").toLowerCase().includes(needle);
    });
  }, [dossiers, q]);

  const groups = useMemo(() => {
    const byStatut = new Map<GpfStatut, GpfDossierWithClient[]>();
    for (const s of GPF_STATUTS) byStatut.set(s, []);
    for (const d of filtered) byStatut.get(d.statut)?.push(d);
    return GPF_STATUTS.map((s) => ({ statut: s, items: byStatut.get(s) ?? [] })).filter((g) => g.items.length > 0);
  }, [filtered]);

  if (loading) return <p style={{ color: "#64717d" }}>Chargement...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Suivi des dossiers</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (client, assureur, source)..."
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e5e9", fontSize: 13, width: 280, boxSizing: "border-box" }}
        />
      </div>

      <p style={{ fontSize: 12, color: "#64717d", margin: "0 0 12px" }}>
        {filtered.length} dossier{filtered.length > 1 ? "s" : ""} sur {dossiers.length}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((g) => (
          <div key={g.statut}>
            <div
              onClick={() => toggleGroup(g.statut)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggleGroup(g.statut)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 4px",
                cursor: "pointer",
                borderLeft: `4px solid ${GPF_STATUT_COLOR[g.statut]}`,
                paddingLeft: 10,
                marginBottom: 6
              }}
            >
              <span style={{ fontSize: 11, color: "#9aa3ab" }}>{collapsed.has(g.statut) ? "▸" : "▾"}</span>
              <strong style={{ fontSize: 14, color: GPF_STATUT_COLOR[g.statut] }}>{GPF_STATUT_LABEL[g.statut]}</strong>
              <span style={{ fontSize: 12, color: "#9aa3ab" }}>{g.items.length}</span>
            </div>

            {!collapsed.has(g.statut) ? (
              <div style={{ background: "#fff", border: "1px solid #e2e5e9", borderRadius: 8, overflow: "hidden" }}>
                <div style={rowStyle("header")}>
                  <span>Client</span>
                  <span>Produit</span>
                  <span>Assureur</span>
                  <span>Source</span>
                  <span>Date d&apos;effet</span>
                  <span>Montant</span>
                  <span>Relances</span>
                  <span>Statut</span>
                </div>
                {g.items.map((d) => (
                  <Link key={d.id} href={d.client ? `/gpf/clients/${d.client.id}` : "#"} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <div style={rowStyle("data")}>
                      <span style={{ fontWeight: 600, color: "#0d1f3c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.client ? `${d.client.prenom} ${d.client.nom}` : "—"}
                      </span>
                      <span>{GPF_PRODUIT_LABEL[d.produit]}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.assureur_nom ?? "—"}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.source ?? "—"}</span>
                      <span>{frDate(d.date_effet)}</span>
                      <span>{montantPrincipal(d)}</span>
                      <span>{d.relances_envoyees > 0 ? d.relances_envoyees : "—"}</span>
                      <span onClick={(e) => e.preventDefault()}>
                        <select
                          value={d.statut}
                          onChange={(e) => changeStatut(d.id, e.target.value)}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#fff",
                            background: GPF_STATUT_COLOR[d.statut],
                            border: 0,
                            borderRadius: 6,
                            padding: "4px 8px",
                            cursor: "pointer"
                          }}
                        >
                          {GPF_STATUTS.map((s) => (
                            <option key={s} value={s} style={{ color: "#000", background: "#fff" }}>
                              {GPF_STATUT_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function rowStyle(kind: "header" | "data"): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr 0.9fr 1.1fr 0.7fr 1.3fr",
    gap: 10,
    alignItems: "center",
    padding: kind === "header" ? "6px 12px" : "7px 12px",
    borderBottom: kind === "header" ? "1px solid #e2e5e9" : "1px solid #f1f2f4",
    fontSize: kind === "header" ? 11 : 13,
    textTransform: kind === "header" ? "uppercase" : "none",
    letterSpacing: kind === "header" ? "0.02em" : "normal",
    color: kind === "header" ? "#9aa3ab" : "#0d1f3c",
    background: kind === "header" ? "#fafbfc" : "transparent"
  };
}
