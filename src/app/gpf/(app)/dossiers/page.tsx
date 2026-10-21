"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GPF_PRODUIT_LABEL,
  GPF_PRODUITS,
  GPF_STATUTS,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  type GpfDossierWithClient,
  type GpfProduit,
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
  const [statutFilter, setStatutFilter] = useState<GpfStatut | "">("");
  const [produitFilter, setProduitFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    const res = await fetch("/api/gpf/dossiers");
    const data = await res.json();
    if (data.ok) setDossiers(data.dossiers);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatut = async (dossierId: string, statut: string) => {
    setDossiers((prev) => prev.map((d) => (d.id === dossierId ? { ...d, statut: statut as GpfStatut } : d)));
    await fetch(`/api/gpf/dossiers/${dossierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut })
    });
  };

  const changeProduit = async (dossierId: string, produit: string) => {
    setDossiers((prev) => prev.map((d) => (d.id === dossierId ? { ...d, produit: produit as GpfProduit } : d)));
    await fetch(`/api/gpf/dossiers/${dossierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produit })
    });
  };

  const deleteDossier = async (d: GpfDossierWithClient) => {
    const nom = d.client ? `${d.client.prenom} ${d.client.nom}` : "ce dossier";
    if (!confirm(`Supprimer le dossier ${GPF_PRODUIT_LABEL[d.produit]} de ${nom} ? Déplacé vers la corbeille, restaurable 30 jours.`)) return;
    setDossiers((prev) => prev.filter((x) => x.id !== d.id));
    await fetch(`/api/gpf/dossiers/${d.id}`, { method: "DELETE" });
  };

  const deleteSelected = async () => {
    if (!confirm(`Supprimer les ${selected.size} dossiers sélectionnés ? Déplacé vers la corbeille, restaurable 30 jours.`)) return;
    const ids = [...selected];
    setDossiers((prev) => prev.filter((d) => !selected.has(d.id)));
    setSelected(new Set());
    await Promise.all(ids.map((id) => fetch(`/api/gpf/dossiers/${id}`, { method: "DELETE" })));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const countsByStatut = useMemo(() => {
    const m = new Map<GpfStatut, number>();
    for (const d of dossiers) m.set(d.statut, (m.get(d.statut) ?? 0) + 1);
    return m;
  }, [dossiers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return dossiers.filter((d) => {
      if (statutFilter && d.statut !== statutFilter) return false;
      if (produitFilter && d.produit !== produitFilter) return false;
      if (!needle) return true;
      const nom = `${d.client?.prenom ?? ""} ${d.client?.nom ?? ""}`.toLowerCase();
      return nom.includes(needle) || (d.assureur_nom ?? "").toLowerCase().includes(needle) || (d.source ?? "").toLowerCase().includes(needle);
    });
  }, [dossiers, q, statutFilter, produitFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allFilteredSelected) return new Set();
      return new Set(filtered.map((d) => d.id));
    });
  };

  if (loading) return <p className="text-sm text-[#64717d]">Chargement...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl text-[#071C2C]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
          Dossiers
        </h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (client, assureur, source)..."
          className="rounded-lg border border-[#e2e5e9] px-3 py-2 text-sm w-64"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Chip active={statutFilter === ""} label={`Tous (${dossiers.length})`} onClick={() => setStatutFilter("")} />
        {GPF_STATUTS.filter((s) => (countsByStatut.get(s) ?? 0) > 0).map((s) => (
          <Chip
            key={s}
            active={statutFilter === s}
            label={`${GPF_STATUT_LABEL[s]} (${countsByStatut.get(s)})`}
            color={GPF_STATUT_COLOR[s]}
            onClick={() => setStatutFilter((prev) => (prev === s ? "" : s))}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={produitFilter}
          onChange={(e) => setProduitFilter(e.target.value)}
          className="rounded-lg border border-[#e2e5e9] px-3 py-1.5 text-xs bg-white"
        >
          <option value="">Tous les produits</option>
          {GPF_PRODUITS.map((p) => (
            <option key={p} value={p}>
              {GPF_PRODUIT_LABEL[p]}
            </option>
          ))}
        </select>
        <span className="text-xs text-[#9aa3ab]">
          {filtered.length} dossier{filtered.length > 1 ? "s" : ""}
        </span>
        {selected.size > 0 ? (
          <button
            onClick={deleteSelected}
            className="ml-auto rounded-full bg-[#b3463f] text-white text-xs font-semibold px-3 py-1.5"
          >
            Supprimer la sélection ({selected.size})
          </button>
        ) : null}
      </div>

      <div className="bg-white border border-[#e2e5e9] rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[auto_1.4fr_1fr_1fr_1.1fr_0.9fr_1.2fr_auto] gap-3 px-4 py-2 text-[11px] uppercase tracking-wide text-[#9aa3ab] bg-[#fafbfc] border-b border-[#e2e5e9] items-center">
          <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="w-3.5 h-3.5" />
          <span>Client</span>
          <span>Produit</span>
          <span>Assureur</span>
          <span>Montant</span>
          <span>Date d&apos;effet</span>
          <span>Statut</span>
          <span />
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-[#9aa3ab] px-4 py-6 text-center">Aucun dossier pour ces filtres.</p>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[auto_1fr_1fr] md:grid-cols-[auto_1.4fr_1fr_1fr_1.1fr_0.9fr_1.2fr_auto] gap-x-3 gap-y-1 px-4 py-3 border-b border-[#f1f2f4] last:border-0 items-center hover:bg-[#fafbfc]"
            >
              <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} className="w-3.5 h-3.5" />
              <Link href={d.client ? `/gpf/clients/${d.client.id}` : "#"} className="col-span-2 md:col-span-1 font-medium text-[#071C2C] text-sm truncate">
                {d.client ? `${d.client.prenom} ${d.client.nom}` : "—"}
              </Link>
              <select
                value={d.produit}
                onChange={(e) => changeProduit(d.id, e.target.value)}
                className="text-sm text-[#64717d] border-0 bg-transparent rounded px-0 py-0.5 cursor-pointer hover:bg-[#f1f2f4] w-fit"
              >
                {GPF_PRODUITS.map((p) => (
                  <option key={p} value={p}>
                    {GPF_PRODUIT_LABEL[p]}
                  </option>
                ))}
              </select>
              <span className="text-sm text-[#64717d] truncate">{d.assureur_nom ?? "—"}</span>
              <span className="text-sm text-[#64717d]">{montantPrincipal(d)}</span>
              <span className="text-sm text-[#64717d]">{frDate(d.date_effet)}</span>
              <select
                value={d.statut}
                onChange={(e) => changeStatut(d.id, e.target.value)}
                className="text-xs font-semibold text-white rounded-full px-2 py-1 border-0 cursor-pointer w-fit"
                style={{ background: GPF_STATUT_COLOR[d.statut] }}
              >
                {GPF_STATUTS.map((s) => (
                  <option key={s} value={s} style={{ color: "#000", background: "#fff" }}>
                    {GPF_STATUT_LABEL[s]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => deleteDossier(d)}
                title="Supprimer ce dossier"
                className="text-[#b3463f] hover:bg-[#fdecea] rounded-lg w-8 h-8 flex items-center justify-center text-sm shrink-0 justify-self-end"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
        active ? (color ? "text-white" : "text-[#071C2C]") + " border-transparent" : "text-[#64717d] border-[#e2e5e9] bg-white hover:bg-[#fafbfc]"
      }`}
      style={active ? { background: color ?? "#CDAA5A" } : undefined}
    >
      {label}
    </button>
  );
}
