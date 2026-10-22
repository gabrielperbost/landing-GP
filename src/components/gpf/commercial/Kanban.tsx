"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GPF_MOTIFS_REFUS, GPF_PRODUIT_LABEL, GPF_PRODUITS, formatNom, type GpfDossierWithClient } from "@/lib/gpf/types";
import { PIPELINE_COLONNES, estBloquee, indexEtape, joursDepuis } from "@/lib/gpf/pipeline";
import { SkeletonLines } from "@/components/gpf/Skeleton";

const euro = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
const commission = (d: GpfDossierWithClient) => (d.precompte_lineaire_1ere_annee ?? 0) + (d.lineaire_n1 ?? 0);

/**
 * Pipeline commercial en colonnes : glisser-déposer pour changer d'étape
 * (menu « Déplacer » sur mobile). Les affaires perdues sortent du tableau
 * avec un motif obligatoire.
 */
export function Kanban() {
  const [cartes, setCartes] = useState<GpfDossierWithClient[] | null>(null);
  const [produit, setProduit] = useState("");
  const [glisse, setGlisse] = useState<string | null>(null);
  const [survol, setSurvol] = useState<string | null>(null);
  const [perdu, setPerdu] = useState<GpfDossierWithClient | null>(null);
  const [motif, setMotif] = useState("");

  const load = async () => {
    const [a, c] = await Promise.all([
      fetch("/api/gpf/dossiers?vue=affaires&pageSize=2000").then((r) => r.json()),
      fetch("/api/gpf/dossiers?vue=contrats&pageSize=2000").then((r) => r.json())
    ]);
    const il30j = Date.now() - 30 * 86400000;
    // Colonne « Signé » : uniquement les signatures des 30 derniers jours, pour garder le tableau lisible.
    // (la date de signature est posée automatiquement au passage en Effectif).
    const signesRecents = (c.ok ? c.dossiers : []).filter((d: GpfDossierWithClient) => d.date_signature && new Date(d.date_signature).getTime() >= il30j);
    setCartes([...(a.ok ? a.dossiers : []), ...signesRecents]);
  };

  useEffect(() => {
    load();
  }, []);

  const colonnes = useMemo(() => {
    const visibles = (cartes ?? []).filter((d) => (!produit || d.produit === produit) && indexEtape(d.statut) >= 0);
    return PIPELINE_COLONNES.map((col) => {
      const items = visibles.filter((d) => (col.statuts as string[]).includes(d.statut));
      return { ...col, items, total: items.reduce((s, d) => s + commission(d), 0) };
    });
  }, [cartes, produit]);

  const deplacer = async (d: GpfDossierWithClient, statut: string) => {
    if (d.statut === statut) return;
    setCartes((prev) => (prev ?? []).map((x) => (x.id === d.id ? { ...x, statut: statut as typeof x.statut, etape_depuis: new Date().toISOString() } : x)));
    const res = await fetch(`/api/gpf/dossiers/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "conformite_incomplete") alert(`Souscription bloquée : il manque ${data.manquant.join(" et ")} (onglet Conformité de la fiche).`);
      load();
    }
  };

  const confirmerPerdu = async () => {
    if (!perdu || !motif) return;
    await fetch(`/api/gpf/dossiers/${perdu.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: "refuse", motif_refus: motif }) });
    setCartes((prev) => (prev ?? []).filter((x) => x.id !== perdu.id));
    setPerdu(null);
    setMotif("");
  };

  const surDepot = (cle: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const d = (cartes ?? []).find((x) => x.id === glisse);
    setSurvol(null);
    setGlisse(null);
    if (!d) return;
    if (cle === "perdu") {
      setPerdu(d);
      return;
    }
    const col = PIPELINE_COLONNES.find((c) => c.cle === cle)!;
    if (!(col.statuts as string[]).includes(d.statut)) deplacer(d, col.principal);
  };

  if (!cartes) return <SkeletonLines rows={6} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={produit} onChange={(e) => setProduit(e.target.value)} className="rounded-lg border px-3 py-1.5 text-xs">
          <option value="">Tous les produits</option>
          {GPF_PRODUITS.map((p) => (
            <option key={p} value={p}>
              {GPF_PRODUIT_LABEL[p]}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--gpf-subtle)]">
          {colonnes.reduce((s, c) => s + c.items.length, 0)} affaire(s) · commission estimée {euro(colonnes.reduce((s, c) => s + c.total, 0))}
        </span>
        <span className="text-[11px] text-[var(--gpf-subtle)] ml-auto hidden md:block">Glissez une carte d&apos;une colonne à l&apos;autre, ou vers « Perdu ».</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0">
        {colonnes.map((col) => (
          <div
            key={col.cle}
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(col.cle);
            }}
            onDragLeave={() => setSurvol((s) => (s === col.cle ? null : s))}
            onDrop={surDepot(col.cle)}
            className={`w-64 shrink-0 rounded-xl border flex flex-col max-h-[70vh] ${
              survol === col.cle ? "border-[#CDAA5A] bg-[var(--gpf-warning-tint)]" : "border-[var(--gpf-border)] bg-[var(--gpf-surface-alt)]"
            }`}
          >
            <div className="px-3 py-2.5 border-b border-[var(--gpf-border-soft)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--gpf-ink)]">{col.label}</span>
                <span className="text-[11px] text-[var(--gpf-subtle)]">{col.items.length}</span>
              </div>
              <div className="text-[11px] text-[var(--gpf-muted)] tabular-nums mt-0.5">{euro(col.total)}</div>
            </div>
            <div className="p-2 flex flex-col gap-2 overflow-y-auto">
              {col.items.map((d) => {
                const jours = joursDepuis(d.etape_depuis ?? d.updated_at);
                const bloquee = col.cle !== "signe" && estBloquee(d);
                const nrp = d.client?.nrp_count ?? 0;
                return (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={() => setGlisse(d.id)}
                    onDragEnd={() => setGlisse(null)}
                    className={`rounded-lg bg-[var(--gpf-surface)] border p-2.5 cursor-grab active:cursor-grabbing ${glisse === d.id ? "opacity-40" : ""} ${
                      bloquee ? "border-[#b3463f]/60" : "border-[var(--gpf-border)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={d.client ? `/gpf/contacts/${d.client.id}?dossier=${d.id}` : "#"} className="text-sm font-medium text-[var(--gpf-ink)] hover:underline leading-tight">
                        {formatNom(d.client)}
                      </Link>
                      {nrp > 0 ? <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-[var(--gpf-danger-tint)] text-[#b3463f] shrink-0">NRP {nrp}</span> : null}
                    </div>
                    <div className="text-xs text-[var(--gpf-muted)] mt-1">
                      {GPF_PRODUIT_LABEL[d.produit]}
                      {d.assureur_nom ? ` · ${d.assureur_nom}` : ""}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px]">
                      <span className="text-[var(--gpf-ink)] tabular-nums">{commission(d) > 0 ? euro(commission(d)) : "—"}</span>
                      <span className={bloquee ? "text-[#b3463f]" : "text-[var(--gpf-subtle)]"}>
                        {jours != null ? `${jours} j` : ""}
                        {bloquee ? " · bloquée" : ""}
                      </span>
                    </div>
                    {!d.prochaine_action && col.cle !== "signe" ? <div className="text-[10px] text-[#c98a1f] mt-1">Sans prochaine action</div> : null}
                    <select
                      value=""
                      onChange={(e) => (e.target.value === "perdu" ? setPerdu(d) : deplacer(d, e.target.value))}
                      className="md:hidden mt-2 w-full rounded border px-1.5 py-1 text-[11px]"
                    >
                      <option value="">Déplacer vers…</option>
                      {PIPELINE_COLONNES.filter((c) => c.cle !== col.cle).map((c) => (
                        <option key={c.cle} value={c.principal}>
                          {c.label}
                        </option>
                      ))}
                      <option value="perdu">Perdu</option>
                    </select>
                  </div>
                );
              })}
              {col.items.length === 0 ? <p className="text-[11px] text-center text-[var(--gpf-subtle)] py-4">—</p> : null}
            </div>
          </div>
        ))}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol("perdu");
          }}
          onDragLeave={() => setSurvol((s) => (s === "perdu" ? null : s))}
          onDrop={surDepot("perdu")}
          className={`w-40 shrink-0 rounded-xl border-2 border-dashed flex items-center justify-center text-xs text-center px-3 ${
            survol === "perdu" ? "border-[#b3463f] bg-[var(--gpf-danger-tint)] text-[#b3463f]" : "border-[var(--gpf-border)] text-[var(--gpf-subtle)]"
          }`}
        >
          Déposer ici pour passer en Perdu
        </div>
      </div>

      {perdu ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPerdu(null)}>
          <div className="bg-[var(--gpf-surface)] rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[var(--gpf-ink)]">Affaire perdue</h3>
            <p className="text-sm text-[var(--gpf-muted)] mt-1">
              {formatNom(perdu.client)} — {GPF_PRODUIT_LABEL[perdu.produit]}
            </p>
            <label className="text-xs text-[var(--gpf-muted)] flex flex-col gap-1 mt-4">
              Motif (obligatoire)
              <select value={motif} onChange={(e) => setMotif(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                <option value="">— Choisir —</option>
                {GPF_MOTIFS_REFUS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPerdu(null)} className="text-xs text-[var(--gpf-muted)] px-3">
                Annuler
              </button>
              <button onClick={confirmerPerdu} disabled={!motif} className="rounded-full bg-[#b3463f] text-white text-xs font-semibold px-4 py-2 disabled:opacity-40">
                Passer en Perdu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
