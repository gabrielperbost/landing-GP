"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  GPF_MOTIFS_REFUS,
  GPF_PRODUIT_LABEL,
  GPF_PRODUITS,
  GPF_STATUTS,
  GPF_STATUTS_CLOS,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  formatNom,
  type GpfDossierWithClient,
  type GpfStatut
} from "@/lib/gpf/types";

const PAGE_SIZE = 50;

const euro = (v: number | null) => (v == null ? null : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v));
const frDate = (v: string | null) => (v ? new Date(v + "T00:00:00").toLocaleDateString("fr-FR") : "—");

// Prime payée par le client (cotisation), à ne pas confondre avec le montant
// emprunté ni avec la commission du cabinet. Pour l'épargne, c'est le versement.
function primeLabel(d: GpfDossierWithClient): string {
  if (d.produit === "per" || d.produit === "assurance_vie") {
    const base = euro(d.placement_initial);
    const mensuel = euro(d.placement_mensuel);
    if (base && mensuel) return `${base} + ${mensuel}/mois`;
    return base ?? (mensuel ? `${mensuel}/mois` : "—");
  }
  if (d.prime_mensuelle != null) return `${euro(d.prime_mensuelle)}/mois`;
  if (d.prime_annuelle != null) return `${euro(d.prime_annuelle)}/an`;
  return "—";
}

function commissionLabel(d: GpfDossierWithClient): string {
  const total = (d.precompte_lineaire_1ere_annee ?? 0) + (d.lineaire_n1 ?? 0);
  return total > 0 ? euro(total)! : "—";
}

export default function GpfDossiersPage() {
  const [dossiers, setDossiers] = useState<GpfDossierWithClient[]>([]);
  const [total, setTotal] = useState(0);
  const [countsByStatut, setCountsByStatut] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statutFilter, setStatutFilter] = useState<GpfStatut | "">("");
  const [produitFilter, setProduitFilter] = useState("");
  const [includeClos, setIncludeClos] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openDossierId, setOpenDossierId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    if (q) params.set("q", q);
    if (statutFilter) params.set("statut", statutFilter);
    if (produitFilter) params.set("produit", produitFilter);
    if (includeClos || statutFilter) params.set("clos", "1");
    const res = await fetch(`/api/gpf/dossiers?${params}`);
    const data = await res.json();
    if (data.ok) {
      setDossiers(data.dossiers);
      setTotal(data.total);
      setCountsByStatut(data.countsByStatut);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statutFilter, produitFilter, includeClos]);

  const firstSearchRun = useRef(true);
  useEffect(() => {
    if (firstSearchRun.current) {
      firstSearchRun.current = false;
      return;
    }
    setPage(1);
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const deleteDossier = async (d: GpfDossierWithClient) => {
    const nom = d.client ? `${d.client.prenom} ${d.client.nom}` : "ce dossier";
    if (!confirm(`Supprimer le dossier ${GPF_PRODUIT_LABEL[d.produit]} de ${nom} ? Déplacé vers la corbeille, restaurable 30 jours.`)) return;
    setMenuOpenId(null);
    await fetch(`/api/gpf/dossiers/${d.id}`, { method: "DELETE" });
    load();
  };

  const archiveDossier = async (d: GpfDossierWithClient) => {
    setMenuOpenId(null);
    await fetch(`/api/gpf/dossiers/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "sans_suite" })
    });
    load();
  };

  const deleteSelected = async () => {
    if (!confirm(`Supprimer les ${selected.size} dossiers sélectionnés ? Déplacé vers la corbeille, restaurable 30 jours.`)) return;
    const ids = [...selected];
    setSelected(new Set());
    await Promise.all(ids.map((id) => fetch(`/api/gpf/dossiers/${id}`, { method: "DELETE" })));
    load();
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalClos = useMemo(
    () => Object.entries(countsByStatut).reduce((sum, [s, c]) => (GPF_STATUTS_CLOS.has(s as GpfStatut) ? sum + c : sum), 0),
    [countsByStatut]
  );
  const totalNonClos = useMemo(
    () => Object.entries(countsByStatut).reduce((sum, [s, c]) => (!GPF_STATUTS_CLOS.has(s as GpfStatut) ? sum + c : sum), 0),
    [countsByStatut]
  );

  const allOnPageSelected = dossiers.length > 0 && dossiers.every((d) => selected.has(d.id));
  const toggleAllOnPage = () => {
    setSelected((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        for (const d of dossiers) next.delete(d.id);
        return next;
      }
      return new Set([...prev, ...dossiers.map((d) => d.id)]);
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const openDossier = dossiers.find((d) => d.id === openDossierId) ?? null;

  return (
    <div className="flex flex-col gap-4" onClick={() => menuOpenId && setMenuOpenId(null)}>
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
        <Chip active={statutFilter === "" && !includeClos} label={`Tous (${totalNonClos})`} onClick={() => { setStatutFilter(""); setIncludeClos(false); }} />
        {GPF_STATUTS.filter((s) => !GPF_STATUTS_CLOS.has(s) && (countsByStatut[s] ?? 0) > 0).map((s) => (
          <Chip
            key={s}
            active={statutFilter === s}
            label={`${GPF_STATUT_LABEL[s]} (${countsByStatut[s] ?? 0})`}
            color={GPF_STATUT_COLOR[s]}
            onClick={() => { setStatutFilter((prev) => (prev === s ? "" : s)); setIncludeClos(false); }}
          />
        ))}
        <span className="w-px h-5 bg-[#e2e5e9] shrink-0 mx-1" />
        <Chip active={includeClos && statutFilter === ""} label={`Clos (${totalClos})`} color="#9aa3ab" onClick={() => { setIncludeClos((v) => !v); setStatutFilter(""); }} />
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
          {total} dossier{total > 1 ? "s" : ""}
        </span>
        {selected.size > 0 ? (
          <button onClick={deleteSelected} className="ml-auto rounded-full bg-[#b3463f] text-white text-xs font-semibold px-3 py-1.5">
            Supprimer la sélection ({selected.size})
          </button>
        ) : null}
      </div>

      <div className="bg-white border border-[#e2e5e9] rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[auto_1.4fr_1fr_1fr_1.1fr_0.9fr_1.1fr_auto] gap-3 px-4 py-2 text-[11px] uppercase tracking-wide text-[#9aa3ab] bg-[#fafbfc] border-b border-[#e2e5e9] items-center">
          <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} className="w-3.5 h-3.5" />
          <span>Client</span>
          <span>Produit</span>
          <span>Assureur</span>
          <span>Prime</span>
          <span>Commission estimée</span>
          <span>Statut</span>
          <span />
        </div>

        {loading ? (
          <SkeletonRows />
        ) : dossiers.length === 0 ? (
          <p className="text-sm text-[#9aa3ab] px-4 py-6 text-center">Aucun dossier pour ces filtres.</p>
        ) : (
          dossiers.map((d) => (
            <div
              key={d.id}
              className="grid grid-cols-[auto_1fr_1fr] md:grid-cols-[auto_1.4fr_1fr_1fr_1.1fr_0.9fr_1.1fr_auto] gap-x-3 gap-y-1 px-4 py-3 border-b border-[#f1f2f4] last:border-0 items-center hover:bg-[#fafbfc] cursor-pointer relative"
              onClick={() => setOpenDossierId(d.id)}
            >
              <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} onClick={(e) => e.stopPropagation()} className="w-3.5 h-3.5" />
              <span className="col-span-2 md:col-span-1 font-medium text-[#071C2C] text-sm truncate">{formatNom(d.client)}</span>
              <span className="text-sm text-[#64717d] truncate">{GPF_PRODUIT_LABEL[d.produit]}</span>
              <span className="text-sm text-[#64717d] truncate">{d.assureur_nom ?? "—"}</span>
              <span className="text-sm text-[#64717d] tabular-nums">{primeLabel(d)}</span>
              <span className="text-sm text-[#071C2C] tabular-nums">{commissionLabel(d)}</span>
              <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5 shrink-0 w-fit" style={{ background: GPF_STATUT_COLOR[d.statut] }}>
                {GPF_STATUT_LABEL[d.statut]}
              </span>
              <span className="relative justify-self-end">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId((cur) => (cur === d.id ? null : d.id)); }}
                  className="text-[#9aa3ab] hover:bg-[#f1f2f4] rounded-lg w-8 h-8 flex items-center justify-center text-sm"
                >
                  ⋯
                </button>
                {menuOpenId === d.id ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-9 bg-white border border-[#e2e5e9] rounded-lg shadow-lg z-10 w-44 py-1"
                  >
                    <button onClick={() => archiveDossier(d)} className="w-full text-left px-3 py-2 text-sm text-[#64717d] hover:bg-[#fafbfc]">
                      Archiver (sans suite)
                    </button>
                    <button onClick={() => deleteDossier(d)} className="w-full text-left px-3 py-2 text-sm text-[#b3463f] hover:bg-[#fdecea]">
                      Supprimer
                    </button>
                  </div>
                ) : null}
              </span>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs text-[#64717d] disabled:opacity-30 rounded-full border border-[#e2e5e9] px-3 py-1.5"
          >
            ← Précédent
          </button>
          <span className="text-xs text-[#9aa3ab]">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs text-[#64717d] disabled:opacity-30 rounded-full border border-[#e2e5e9] px-3 py-1.5"
          >
            Suivant →
          </button>
        </div>
      ) : null}

      {openDossier ? <DossierPanel dossier={openDossier} onClose={() => setOpenDossierId(null)} onChanged={load} /> : null}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[auto_1.4fr_1fr_1fr_1.1fr_0.9fr_1.1fr_auto] gap-3 px-4 py-3 border-b border-[#f1f2f4] last:border-0 items-center animate-pulse">
          <div className="w-3.5 h-3.5 bg-[#f1f2f4] rounded" />
          <div className="h-3 bg-[#f1f2f4] rounded w-3/4" />
          <div className="h-3 bg-[#f1f2f4] rounded w-1/2" />
          <div className="h-3 bg-[#f1f2f4] rounded w-2/3" />
          <div className="h-3 bg-[#f1f2f4] rounded w-1/2" />
          <div className="h-3 bg-[#f1f2f4] rounded w-1/2" />
          <div className="h-4 bg-[#f1f2f4] rounded-full w-20" />
          <div className="h-3 bg-[#f1f2f4] rounded w-4" />
        </div>
      ))}
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

function DossierPanel({ dossier, onClose, onChanged }: { dossier: GpfDossierWithClient; onClose: () => void; onChanged: () => void }) {
  const [saving, setSaving] = useState(false);
  const [statut, setStatut] = useState(dossier.statut);
  const [motifRefus, setMotifRefus] = useState(dossier.motif_refus ?? "");
  const [produit, setProduit] = useState(dossier.produit);

  const save = async (extra: Record<string, unknown> = {}) => {
    setSaving(true);
    const res = await fetch(`/api/gpf/dossiers/${dossier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut, produit, motif_refus: motifRefus || undefined, ...extra })
    });
    setSaving(false);
    if (res.ok) {
      onChanged();
      onClose();
    } else {
      const data = await res.json().catch(() => ({}));
      if (data.error === "motif_refus_requis") alert("Choisissez un motif de refus.");
    }
  };

  const deleteDossier = async () => {
    if (!confirm("Supprimer ce dossier ? Déplacé vers la corbeille, restaurable 30 jours.")) return;
    await fetch(`/api/gpf/dossiers/${dossier.id}`, { method: "DELETE" });
    onChanged();
    onClose();
  };

  const kpis: [string, string | null][] = [
    ["Prime", primeLabel(dossier) === "—" ? null : primeLabel(dossier)],
    ["Frais de dossier", euro(dossier.frais_dossier)],
    ["Précompte / 1ère année", euro(dossier.precompte_lineaire_1ere_annee)],
    ["Linéaire N+1", euro(dossier.lineaire_n1)]
  ].filter(([, v]) => v) as [string, string | null][];

  const details = (
    [
      ["Assureur", dossier.assureur_nom],
      ["Référence contrat", dossier.reference_contrat],
      ["Date d'effet", dossier.date_effet ? frDate(dossier.date_effet) : null],
      ["Montant emprunté", euro(dossier.montant_pret)],
      ["Motif de refus", dossier.motif_refus],
      ["Source", dossier.source],
      ["Relances envoyées", dossier.relances_envoyees > 0 ? String(dossier.relances_envoyees) : null]
    ] as [string, string | null][]
  ).filter(([, v]) => v);

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#eef0f2] sticky top-0 bg-white">
          <div>
            {dossier.client ? (
              <Link href={`/gpf/clients/${dossier.client.id}`} className="text-sm text-[#64717d] hover:text-[#071C2C] underline">
                {formatNom(dossier.client)}
              </Link>
            ) : null}
            <h3 className="text-base font-semibold text-[#071C2C] mt-0.5">{GPF_PRODUIT_LABEL[dossier.produit]}</h3>
          </div>
          <button onClick={onClose} className="text-[#64717d] hover:bg-[#f1f2f4] rounded-lg w-8 h-8 flex items-center justify-center text-sm shrink-0">
            ✕
          </button>
        </div>

        {kpis.length > 0 ? (
          <div className="grid grid-cols-2 gap-px bg-[#eef0f2] border-b border-[#eef0f2]">
            {kpis.map(([label, value]) => (
              <div key={label} className="bg-white p-3">
                <div className="text-[10px] uppercase tracking-wide text-[#9aa3ab]">{label}</div>
                <div className="text-sm font-semibold text-[#071C2C] mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="px-5 py-4 flex flex-col gap-4">
          <label className="text-xs text-[#64717d] flex flex-col gap-1">
            Produit
            <select value={produit} onChange={(e) => setProduit(e.target.value as typeof produit)} className="rounded-lg border border-[#e2e5e9] px-3 py-2 text-sm">
              {GPF_PRODUITS.map((p) => (
                <option key={p} value={p}>
                  {GPF_PRODUIT_LABEL[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-[#64717d] flex flex-col gap-1">
            Statut
            <select value={statut} onChange={(e) => setStatut(e.target.value as typeof statut)} className="rounded-lg border border-[#e2e5e9] px-3 py-2 text-sm">
              {GPF_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {GPF_STATUT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>

          {statut === "refuse" ? (
            <label className="text-xs text-[#64717d] flex flex-col gap-1">
              Motif de refus
              <select value={motifRefus} onChange={(e) => setMotifRefus(e.target.value)} className="rounded-lg border border-[#e2e5e9] px-3 py-2 text-sm">
                <option value="">— Choisir —</option>
                {GPF_MOTIFS_REFUS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {details.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-[#f1f2f4]">
              {details.map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] uppercase tracking-wide text-[#9aa3ab]">{label}</div>
                  <div className="text-sm text-[#071C2C] mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <button onClick={deleteDossier} className="text-[#b3463f] text-xs font-medium">
              Supprimer ce dossier
            </button>
            <button
              onClick={() => save()}
              disabled={saving || (statut === "refuse" && dossier.statut !== "refuse" && !motifRefus)}
              className="rounded-full bg-[#CDAA5A] text-[#071C2C] text-xs font-semibold px-4 py-2 disabled:opacity-50"
            >
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
