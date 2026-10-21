"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GPF_PRODUIT_LABEL, GPF_STATUT_COLOR, GPF_STATUT_LABEL, type GpfDossierWithClient } from "@/lib/gpf/types";

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

export default function GpfDashboardPage() {
  const [dossiers, setDossiers] = useState<GpfDossierWithClient[]>([]);
  const [nbClients, setNbClients] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [dRes, cRes] = await Promise.all([fetch("/api/gpf/dossiers"), fetch("/api/gpf/clients")]);
      const dData = await dRes.json();
      const cData = await cRes.json();
      if (dData.ok) setDossiers(dData.dossiers);
      if (cData.ok) setNbClients(cData.clients.length);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const enCours = dossiers.filter((d) => EN_COURS.has(d.statut)).length;
    const effectifs = dossiers.filter((d) => d.statut === "effectif").length;
    const parProduit = new Map<string, number>();
    for (const d of dossiers) parProduit.set(d.produit, (parProduit.get(d.produit) ?? 0) + 1);
    const recents = [...dossiers].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 8);
    return { enCours, effectifs, parProduit, recents };
  }, [dossiers]);

  if (loading) return <p className="text-sm text-[#64717d]">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl text-[#071C2C]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
        Tableau de bord
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Clients" value={nbClients ?? 0} />
        <KpiTile label="Dossiers en cours" value={stats.enCours} accent="#579bfc" />
        <KpiTile label="Dossiers effectifs" value={stats.effectifs} accent="#00c875" />
        <KpiTile label="Dossiers au total" value={dossiers.length} />
      </div>

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
            <span className="font-medium text-[#071C2C] truncate">{d.client ? `${d.client.prenom} ${d.client.nom}` : "—"}</span>
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
