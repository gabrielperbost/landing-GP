"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/gpf/PageHeader";
import { SkeletonPage } from "@/components/gpf/Skeleton";
import { Anneau } from "@/components/gpf/fiche/Accueil";
import { Bloc, Vide } from "@/components/gpf/fiche/shared";
import { SOURCES_PAYANTES } from "@/lib/gpf/sources";

type Variation = { actuel: number; precedent: number; ecart: number; pourcentage: number };
type Donnees = {
  periode: { debut: string; fin: string; cumul: boolean };
  volume: Variation;
  contratsSignes: Variation;
  cartes: Record<"commissionsEstimees" | "commissionsEncaissees" | "annulations" | "decommissions" | "contratsActifs" | "leads", Variation>;
  histogramme: { mois: string; production: number; commissions: number; encaisse: number; contrats: number }[];
  repartition: Record<"produit" | "compagnie", { label: string; volume: number; contrats: number }[]>;
  rentabilite: {
    source: string;
    leads: number;
    signes: number;
    conversion: number;
    commissions: number;
    cout: number | null;
    coutParLead: number | null;
    coutParContrat: number | null;
    roi: number | null;
  }[];
  alertes: { cle: string; label: string; n: number; lien: string; exemples: string[] }[];
  derniersContrats: { id: string; client_id: string; date: string; client: string; produit: string; compagnie: string | null; prime: number | null; commission: number | null }[];
};

const euro = (v: number | null | undefined) => (v == null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v));
const moisCourant = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const COULEURS = ["#CDAA5A", "#071C2C", "#2f9e6e", "#579bfc", "#c98a1f", "#a25ddc", "#b3463f", "#66ccff", "#9aa3ab"];

function Evolution({ v, euros = false, inverse = false }: { v: Variation; euros?: boolean; inverse?: boolean }) {
  if (!v.ecart) return <span className="text-[11px] text-[var(--gpf-subtle)]">= période précédente</span>;
  const bon = inverse ? v.ecart < 0 : v.ecart > 0;
  return (
    <span className="text-[11px]" style={{ color: bon ? "#2f9e6e" : "#b3463f" }}>
      {v.ecart > 0 ? "▲" : "▼"} {euros ? euro(Math.abs(v.ecart)) : Math.abs(v.ecart)} ({v.pourcentage > 0 ? "+" : ""}
      {v.pourcentage} %) vs période précédente
    </span>
  );
}

function Carte({ label, valeur, v, euros, inverse, sous }: { label: string; valeur: string; v: Variation; euros?: boolean; inverse?: boolean; sous?: string }) {
  return (
    <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] border-t-2 rounded-xl p-4" style={{ borderTopColor: "#CDAA5A" }}>
      <div className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)]">{label}</div>
      <div className="text-2xl font-semibold tabular-nums text-[var(--gpf-ink)] mt-1">{valeur}</div>
      {sous ? <div className="text-[11px] text-[var(--gpf-subtle)]">{sous}</div> : null}
      <div className="mt-1">
        <Evolution v={v} euros={euros} inverse={inverse} />
      </div>
    </div>
  );
}

function Histogramme({ data }: { data: Donnees["histogramme"] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.production, d.commissions, d.encaisse)));
  return (
    <div className="px-4 pb-4 pt-2">
      <div className="flex items-end gap-1.5 h-48">
        {data.map((d) => (
          <div key={d.mois} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className="w-full flex items-end justify-center gap-0.5 h-40"
              title={`${d.mois} — production ${euro(d.production)}, commissions estimées ${euro(d.commissions)}, encaissées ${euro(d.encaisse)}, ${d.contrats} contrat(s)`}
            >
              <div className="w-1/3 rounded-t bg-[#CDAA5A]" style={{ height: `${(d.production / max) * 100}%` }} />
              <div className="w-1/3 rounded-t bg-[var(--gpf-ink)] opacity-80" style={{ height: `${(d.commissions / max) * 100}%` }} />
              <div className="w-1/3 rounded-t bg-[#2f9e6e]" style={{ height: `${(d.encaisse / max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-[var(--gpf-subtle)] capitalize">{new Date(d.mois + "-01T00:00:00").toLocaleDateString("fr-FR", { month: "short" })}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-[11px] text-[var(--gpf-muted)] flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#CDAA5A]" /> Production (primes annualisées)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--gpf-ink)] opacity-80" /> Commissions estimées
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#2f9e6e]" /> Encaissées
        </span>
      </div>
    </div>
  );
}

export default function TableauDeBord() {
  const [mois, setMois] = useState(moisCourant());
  const [cumul, setCumul] = useState(false);
  const [d, setD] = useState<Donnees | null>(null);
  const [onglet, setOnglet] = useState<"produit" | "compagnie">("produit");
  const [couts, setCouts] = useState<Record<string, string>>({});

  const load = async () => {
    const r = await fetch(`/api/gpf/dashboard?mois=${mois}&mode=${cumul ? "cumul" : "mois"}`).then((x) => x.json());
    if (r.ok) setD(r);
    const c = await fetch(`/api/gpf/couts-sources?mois=${mois}`)
      .then((x) => x.json())
      .catch(() => null);
    if (c?.ok) setCouts(Object.fromEntries(c.couts.map((x: { source: string; cout: number }) => [x.source, String(x.cout)])));
  };
  useEffect(() => {
    setD(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, cumul]);

  const enregistrerCout = async (source: string) => {
    await fetch("/api/gpf/couts-sources", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source, mois, cout: couts[source] || 0 }) });
    load();
  };

  const controles = (
    <div className="flex items-center gap-2">
      <div className="flex rounded-full border border-[var(--gpf-border)] overflow-hidden text-xs">
        <button onClick={() => setCumul(false)} className={`px-3 py-1.5 ${!cumul ? "bg-[#CDAA5A] text-[#071c2c] font-semibold" : "text-[var(--gpf-muted)] bg-[var(--gpf-surface)]"}`}>
          Mois
        </button>
        <button onClick={() => setCumul(true)} className={`px-3 py-1.5 ${cumul ? "bg-[#CDAA5A] text-[#071c2c] font-semibold" : "text-[var(--gpf-muted)] bg-[var(--gpf-surface)]"}`}>
          Cumul
        </button>
      </div>
      <input type="month" value={mois} onChange={(e) => e.target.value && setMois(e.target.value)} className="rounded-lg border px-2 py-1.5 text-xs" />
    </div>
  );

  if (!d) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader titre="Tableau de bord" sousTitre="Performance & Pilotage" actions={controles} />
        <SkeletonPage />
      </div>
    );
  }

  const nomMois = new Date(mois + "-01T00:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const libellePeriode = cumul ? `cumul ${d.periode.debut.slice(0, 4)} jusqu'à fin ${nomMois}` : nomMois;
  const rep = d.repartition[onglet];
  const utiliseVolume = rep.some((r) => r.volume > 0);
  const parts = rep.slice(0, 8).map((r, i) => ({ label: r.label, valeur: utiliseVolume ? r.volume : r.contrats, couleur: COULEURS[i % COULEURS.length] }));
  const totalRep = parts.reduce((s, p) => s + p.valeur, 0);
  const alertesActives = d.alertes.filter((a) => a.n > 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Tableau de bord" sousTitre={`Performance & Pilotage — ${libellePeriode}`} actions={controles} />

      <div className="grid md:grid-cols-2 gap-3">
        <Carte label="Volume annualisé signé" valeur={euro(d.volume.actuel)} v={d.volume} euros />
        <Carte label="Contrats signés" valeur={String(d.contratsSignes.actuel)} v={d.contratsSignes} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Carte label="Commissions estimées" valeur={euro(d.cartes.commissionsEstimees.actuel)} v={d.cartes.commissionsEstimees} euros sous="précompte + frais de dossier" />
        <Carte label="Commissions encaissées" valeur={euro(d.cartes.commissionsEncaissees.actuel)} v={d.cartes.commissionsEncaissees} euros sous="bordereaux validés" />
        <Carte
          label="Annulations / décommissions"
          valeur={String(d.cartes.annulations.actuel)}
          v={d.cartes.annulations}
          inverse
          sous={d.cartes.decommissions.actuel ? `${euro(d.cartes.decommissions.actuel)} repris` : "contrats résiliés"}
        />
        <Carte label="Contrats actifs" valeur={String(d.cartes.contratsActifs.actuel)} v={d.cartes.contratsActifs} />
        <Carte label="Leads & clients" valeur={String(d.cartes.leads.actuel)} v={d.cartes.leads} sous="nouveaux contacts" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Bloc titre="Production et commissions — 12 mois" className="lg:col-span-2">
          <Histogramme data={d.histogramme} />
        </Bloc>
        <Bloc
          titre="Répartition du signé"
          action={
            <div className="flex gap-1">
              {(["produit", "compagnie"] as const).map((o) => (
                <button key={o} onClick={() => setOnglet(o)} className={`text-[11px] rounded-full px-2 py-0.5 ${onglet === o ? "bg-[#CDAA5A] text-[#071c2c]" : "text-[var(--gpf-muted)]"}`}>
                  {o === "produit" ? "Produit" : "Compagnie"}
                </button>
              ))}
            </div>
          }
        >
          {rep.length === 0 ? (
            <Vide>Aucune signature sur la période.</Vide>
          ) : (
            <div className="p-4 flex flex-col items-center gap-3">
              <Anneau parts={parts} centre={utiliseVolume ? euro(d.volume.actuel) : `${d.contratsSignes.actuel} contrat(s)`} />
              <div className="w-full flex flex-col gap-1">
                {parts.map((p) => (
                  <div key={p.label} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.couleur }} />
                    <span className="flex-1 text-[var(--gpf-ink)] truncate">{p.label}</span>
                    <span className="tabular-nums text-[var(--gpf-ink)]">{utiliseVolume ? euro(p.valeur) : p.valeur}</span>
                    <span className="w-10 text-right text-[var(--gpf-subtle)]">{totalRep ? Math.round((p.valeur / totalRep) * 100) : 0} %</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Bloc>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Bloc titre={`Alertes critiques (${alertesActives.length})`}>
          {alertesActives.length === 0 ? (
            <Vide>Aucune alerte.</Vide>
          ) : (
            alertesActives.map((a) => (
              <Link key={a.cle} href={a.lien} className="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0 hover:bg-[var(--gpf-surface-alt)]">
                <span className="min-w-[28px] h-6 rounded-full bg-[var(--gpf-danger-tint)] text-[#b3463f] text-xs font-semibold flex items-center justify-center px-2">{a.n}</span>
                <span className="min-w-0">
                  <span className="block text-sm text-[var(--gpf-ink)]">{a.label}</span>
                  {a.exemples.length ? <span className="block text-[11px] text-[var(--gpf-subtle)] truncate">{a.exemples.join(", ")}</span> : null}
                </span>
              </Link>
            ))
          )}
        </Bloc>

        <Bloc titre="Derniers contrats" className="lg:col-span-2">
          {d.derniersContrats.length === 0 ? (
            <Vide>Aucun contrat signé.</Vide>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-[var(--gpf-subtle)] border-b border-[var(--gpf-border-soft)]">
                    {["Date", "Client / contrat", "Compagnie", "Prime", "Commission"].map((h) => (
                      <th key={h} className="text-left font-normal px-4 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.derniersContrats.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--gpf-border-soft)] last:border-0">
                      <td className="px-4 py-2 text-xs text-[var(--gpf-muted)] whitespace-nowrap">{new Date(c.date + "T00:00:00").toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-2">
                        <Link href={`/gpf/contacts/${c.client_id}?dossier=${c.id}`} className="text-[var(--gpf-ink)] hover:underline">
                          {c.client}
                        </Link>
                        <div className="text-[11px] text-[var(--gpf-subtle)]">{c.produit}</div>
                      </td>
                      <td className="px-4 py-2 text-xs text-[var(--gpf-muted)]">{c.compagnie ?? "—"}</td>
                      <td className="px-4 py-2 text-xs tabular-nums text-[var(--gpf-ink)]">{c.prime != null ? `${euro(c.prime)}/an` : "—"}</td>
                      <td className="px-4 py-2 text-xs tabular-nums text-[var(--gpf-ink)]">{euro(c.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Bloc>
      </div>

      <Bloc titre="Rentabilité par source">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-[var(--gpf-subtle)] border-b border-[var(--gpf-border-soft)]">
                {["Source", "Leads", "Conversion", "Commissions", "Coût de la période", "Coût / lead", "Coût / contrat", "Retour sur investissement"].map((h) => (
                  <th key={h} className="text-left font-normal px-4 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.rentabilite.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-[var(--gpf-subtle)]">
                    Aucun lead sur la période.
                  </td>
                </tr>
              ) : (
                d.rentabilite.map((r) => (
                  <tr key={r.source} className="border-b border-[var(--gpf-border-soft)] last:border-0">
                    <td className="px-4 py-2 text-[var(--gpf-ink)]">{r.source}</td>
                    <td className="px-4 py-2 tabular-nums text-[var(--gpf-muted)]">{r.leads}</td>
                    <td className="px-4 py-2 tabular-nums text-[var(--gpf-muted)]">
                      {r.conversion} % <span className="text-[10px] text-[var(--gpf-subtle)]">({r.signes})</span>
                    </td>
                    <td className="px-4 py-2 tabular-nums text-[var(--gpf-ink)]">{euro(r.commissions)}</td>
                    <td className="px-4 py-2">
                      {SOURCES_PAYANTES.includes(r.source) && !cumul ? (
                        <span className="flex items-center gap-1">
                          <input
                            inputMode="decimal"
                            value={couts[r.source] ?? ""}
                            onChange={(e) => setCouts((c) => ({ ...c, [r.source]: e.target.value }))}
                            placeholder="€"
                            className="w-20 rounded border px-2 py-1 text-xs"
                          />
                          <button onClick={() => enregistrerCout(r.source)} className="text-[11px] rounded border border-[var(--gpf-border)] px-2 py-1 text-[var(--gpf-ink)]">
                            OK
                          </button>
                        </span>
                      ) : (
                        <span className="text-xs tabular-nums text-[var(--gpf-muted)]">{euro(r.cout)}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs tabular-nums text-[var(--gpf-muted)]">{euro(r.coutParLead)}</td>
                    <td className="px-4 py-2 text-xs tabular-nums text-[var(--gpf-muted)]">{euro(r.coutParContrat)}</td>
                    <td className="px-4 py-2 text-xs tabular-nums" style={{ color: r.roi == null ? "var(--gpf-subtle)" : r.roi >= 0 ? "#2f9e6e" : "#b3463f" }}>
                      {r.roi == null ? "—" : `${r.roi > 0 ? "+" : ""}${r.roi} %`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-[11px] text-[var(--gpf-subtle)]">
          Saisissez chaque mois le coût de Meta Ads et de Masterleads (vue « Mois ») pour obtenir le coût par lead, le coût par contrat et le retour sur investissement.
        </p>
      </Bloc>
    </div>
  );
}
