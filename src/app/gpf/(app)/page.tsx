"use client";
import { SkeletonPage } from "@/components/gpf/Skeleton";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GPF_PRODUIT_LABEL,
  GPF_STATUTS_CLOS,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  formatNom,
  type GpfDossierWithClient
} from "@/lib/gpf/types";

const EN_COURS: ReadonlySet<string> = new Set([
  "a_traiter",
  "nrp",
  "devis_a_realiser",
  "devis_envoye",
  "en_cours_souscription",
  "attente_accord_banque",
  "attente_prise_effet",
  "attente_reglement",
  "attente_documents"
]);

const frDate = (v: string) => new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
const euro = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

export default function GpfDashboardPage() {
  const [dossiers, setDossiers] = useState<GpfDossierWithClient[]>([]);
  const [clientCounts, setClientCounts] = useState({ tous: 0, client: 0, prospect: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Le tableau de bord a besoin de tous les dossiers pour des totaux
      // justes (clos inclus pour les compteurs, exclus seulement du calcul
      // des revenus) — on dépasse donc volontairement la pagination par
      // défaut de l'API (50 lignes), pensée pour la page Dossiers.
      const [dRes, cRes] = await Promise.all([
        fetch("/api/gpf/dossiers?pageSize=2000&clos=1"),
        fetch("/api/gpf/clients?pageSize=1")
      ]);
      const dData = await dRes.json();
      const cData = await cRes.json();
      if (dData.ok) setDossiers(dData.dossiers);
      if (cData.ok) setClientCounts(cData.counts);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const enCours = dossiers.filter((d) => EN_COURS.has(d.statut)).length;
    const effectifs = dossiers.filter((d) => d.statut === "effectif").length;
    const parProduit = new Map<string, number>();
    for (const d of dossiers) parProduit.set(d.produit, (parProduit.get(d.produit) ?? 0) + 1);
    const recents = [...dossiers].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 8);
    // Un dossier Refusé/Sans suite ne doit jamais compter dans les revenus,
    // même s'il porte encore une valeur de précompte/linéaire héritée de Monday.
    const dossiersActifs = dossiers.filter((d) => !GPF_STATUTS_CLOS.has(d.statut));
    const precompteTotal = dossiersActifs.reduce((sum, d) => sum + (d.precompte_lineaire_1ere_annee ?? 0), 0);
    const lineaireTotal = dossiersActifs.reduce((sum, d) => sum + (d.lineaire_n1 ?? 0), 0);
    const lineaireParProduit = new Map<string, number>();
    for (const d of dossiersActifs) {
      const v = (d.precompte_lineaire_1ere_annee ?? 0) + (d.lineaire_n1 ?? 0);
      if (v > 0) lineaireParProduit.set(d.produit, (lineaireParProduit.get(d.produit) ?? 0) + v);
    }
    return {
      enCours,
      effectifs,
      parProduit,
      recents,
      precompteTotal,
      lineaireTotal,
      lineaireParProduit,
      nbClients: clientCounts.client,
      nbProspects: clientCounts.prospect
    };
  }, [dossiers, clientCounts]);

  if (loading) return <SkeletonPage />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl text-[#071C2C]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
        Tableau de bord
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Clients" value={stats.nbClients} accent="#2f9e6e" />
        <KpiTile label="Prospects" value={stats.nbProspects} accent="#c98a1f" />
        <KpiTile label="Dossiers en cours" value={stats.enCours} accent="#c98a1f" />
        <KpiTile label="Dossiers au total" value={dossiers.length} />
      </div>

      {stats.precompteTotal > 0 || stats.lineaireTotal > 0 ? (
        <div className="bg-white border border-[#e2e5e9] border-t-2 rounded-xl p-4" style={{ borderTopColor: "#CDAA5A" }}>
          <h2 className="text-sm font-semibold text-[#071C2C] mb-3">Revenus linéaire (estimation)</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[#9aa3ab]">Précompte / 1ère année (total)</div>
              <div className="text-2xl font-semibold tabular-nums text-[#071C2C]">{euro(stats.precompteTotal)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[#9aa3ab]">Linéaire N+1 (total)</div>
              <div className="text-2xl font-semibold tabular-nums text-[#071C2C]">{euro(stats.lineaireTotal)}</div>
            </div>
          </div>
          {stats.lineaireParProduit.size > 0 ? (
            <div className="flex flex-col gap-2 pt-3 border-t border-[#f1f2f4]">
              {[...stats.lineaireParProduit.entries()].sort((a, b) => b[1] - a[1]).map(([produit, total]) => (
                <div key={produit} className="flex items-center justify-between text-xs">
                  <span className="text-[#64717d]">{GPF_PRODUIT_LABEL[produit as keyof typeof GPF_PRODUIT_LABEL]}</span>
                  <span className="text-[#071C2C] font-medium tabular-nums">{euro(total)}</span>
                </div>
              ))}
            </div>
          ) : null}
          <p className="text-[11px] text-[#9aa3ab] mt-3">
            Basé sur les dernières données importées (bordereaux / Monday) — pas encore de suivi mensuel automatique.
          </p>
        </div>
      ) : null}

      <div className="bg-white border border-[#e2e5e9] rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[#071C2C] mb-3">Répartition par produit</h2>
        <div className="flex flex-col gap-2">
          {[...stats.parProduit.entries()].sort((a, b) => b[1] - a[1]).map(([produit, count]) => (
            <div key={produit} className="flex items-center gap-3">
              <span className="text-xs text-[#64717d] w-40 shrink-0">{GPF_PRODUIT_LABEL[produit as keyof typeof GPF_PRODUIT_LABEL]}</span>
              <div className="flex-1 bg-[#f1f2f4] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-[#071C2C] rounded-full"
                  style={{ width: `${Math.round((count / Math.max(1, dossiers.length)) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-[#9aa3ab] w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#e2e5e9] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e5e9]">
          <h2 className="text-sm font-semibold text-[#071C2C]">Derniers dossiers</h2>
          <Link href="/gpf/dossiers" className="text-xs text-[#64717d] hover:text-[#071C2C]">
            Voir tous les dossiers →
          </Link>
        </div>
        {stats.recents.map((d) => (
          <Link
            key={d.id}
            href={d.client ? `/gpf/clients/${d.client.id}` : "#"}
            className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-[#f1f2f4] last:border-0 hover:bg-[#fafbfc] text-sm"
          >
            <span className="font-medium text-[#071C2C] truncate">{formatNom(d.client)}</span>
            <span className="text-[#64717d] text-xs hidden sm:inline">{GPF_PRODUIT_LABEL[d.produit]}</span>
            <span className="text-[#9aa3ab] text-xs hidden sm:inline">{frDate(d.created_at)}</span>
            <span
              className="text-xs font-semibold text-white rounded-full px-2 py-0.5 shrink-0"
              style={{ background: GPF_STATUT_COLOR[d.statut] }}
            >
              {GPF_STATUT_LABEL[d.statut]}
            </span>
          </Link>
        ))}
      </div>
    </div>
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
