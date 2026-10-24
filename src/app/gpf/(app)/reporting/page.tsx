"use client";
import { useEffect, useState } from "react";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { api, Vide } from "@/components/gpf/fiche/shared";
import { Barres, eur, exporterCsv, moisLabel, Onglets, pctLabel, Tableau, tdCls, tdNum, Tuile } from "@/components/gpf/commissions/commun";

type Onglet = "leads" | "contrats" | "commissions" | "encours";
type Axe = "produit" | "compagnie" | "source" | "apporteur";
type Ligne = { valeur: string; leads: number; signes: number; perdus: number; contrats: number; primes: number; commEstimees: number; encaisse6: number; encaisse12: number; encours: number; lineaire: number; transformation: number | null };
type Rapport = { axe: Axe; mois: number; resume: { nouveauxContacts: number; nouveauxLeads: number; clients: number; encoursTotal: number; lineaireTotal: number; contratsEpargne: number; contratsEpargneSansMontant: number }; lignes: Ligne[]; encaissementsMensuels: { mois: string; montant: number }[] };

const AXE_LABEL: Record<Axe, string> = { produit: "Produit", compagnie: "Compagnie", source: "Source", apporteur: "Apporteur" };

// Colonnes affichées selon l'onglet : [entête, valeur, numérique].
const COLONNES: Record<Onglet, [string, (l: Ligne) => string | number, boolean][]> = {
  leads: [
    ["Affaires créées", (l) => l.leads, true],
    ["Signées", (l) => l.signes, true],
    ["Perdues", (l) => l.perdus, true],
    ["Transformation", (l) => pctLabel(l.transformation), true]
  ],
  contrats: [
    ["Signés sur la période", (l) => l.signes, true],
    ["Contrats en portefeuille", (l) => l.contrats, true],
    ["Commissions estimées", (l) => eur(l.commEstimees, 0), true]
  ],
  commissions: [
    ["Estimées (signés période)", (l) => eur(l.commEstimees, 0), true],
    ["Encaissées 6 mois", (l) => eur(l.encaisse6, 0), true],
    ["Encaissées 12 mois", (l) => eur(l.encaisse12, 0), true]
  ],
  encours: [
    ["Contrats actifs", (l) => l.contrats, true],
    ["Encours sous gestion", (l) => eur(l.encours, 0), true],
    ["Linéaire / an", (l) => eur(l.lineaire, 0), true],
    ["Primes annualisées (prévoyance, santé, prêt)", (l) => eur(l.primes, 0), true]
  ]
};
const BRUT: Record<Onglet, (l: Ligne) => (number | null)[]> = {
  leads: (l) => [l.leads, l.signes, l.perdus, l.transformation],
  contrats: (l) => [l.signes, l.contrats, l.commEstimees],
  commissions: (l) => [l.commEstimees, l.encaisse6, l.encaisse12],
  encours: (l) => [l.contrats, l.encours, l.lineaire, l.primes]
};

export default function ReportingPage() {
  const [onglet, setOnglet] = useState<Onglet>("leads");
  const [axe, setAxe] = useState<Axe>("produit");
  const [mois, setMois] = useState(12);
  const [rapport, setRapport] = useState<Rapport | null>(null);

  useEffect(() => {
    setRapport(null);
    api(`/api/gpf/reporting?axe=${axe}&mois=${mois}`, "GET").then((r) => r.ok && setRapport(r.data));
  }, [axe, mois]);

  const cols = COLONNES[onglet];
  const exporter = () => {
    if (!rapport) return;
    exporterCsv(
      `reporting-${onglet}-${axe}-${mois}mois.csv`,
      [AXE_LABEL[axe], ...cols.map((c) => c[0])],
      rapport.lignes.map((l) => [l.valeur, ...BRUT[onglet](l)])
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        titre="Reporting"
        sousTitre={`Sur les ${mois} derniers mois, par ${AXE_LABEL[axe].toLowerCase()}`}
        actions={
          <div className="flex gap-2 print:hidden">
            <button onClick={exporter} className="rounded-full border border-[var(--gpf-border)] text-xs px-4 py-2 text-[var(--gpf-muted)] bg-[var(--gpf-surface)]">
              Export CSV
            </button>
            <button onClick={() => window.print()} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2">
              Export PDF
            </button>
          </div>
        }
      />
      <Onglets
        valeur={onglet}
        onChange={setOnglet}
        items={[
          ["leads", "Leads & clients"],
          ["contrats", "Contrats"],
          ["commissions", "Commissions"],
          ["encours", "Encours"]
        ]}
      />
      <div className="flex gap-3 flex-wrap print:hidden">
        <select className="rounded-lg border px-3 py-2 text-sm bg-[var(--gpf-surface)]" value={axe} onChange={(e) => setAxe(e.target.value as Axe)}>
          {(Object.keys(AXE_LABEL) as Axe[]).map((a) => (
            <option key={a} value={a}>
              Par {AXE_LABEL[a].toLowerCase()}
            </option>
          ))}
        </select>
        <select className="rounded-lg border px-3 py-2 text-sm bg-[var(--gpf-surface)]" value={mois} onChange={(e) => setMois(Number(e.target.value))}>
          {[3, 6, 12, 24].map((m) => (
            <option key={m} value={m}>
              {m} derniers mois
            </option>
          ))}
        </select>
      </div>

      {!rapport ? (
        <SkeletonLines />
      ) : (
        <>
          {onglet === "leads" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Tuile label="Nouveaux contacts" valeur={String(rapport.resume.nouveauxContacts)} />
              <Tuile label="Dont sans contrat (leads)" valeur={String(rapport.resume.nouveauxLeads)} />
              <Tuile label="Clients au total" valeur={String(rapport.resume.clients)} accent="#2f9e6e" />
            </div>
          ) : null}
          {onglet === "encours" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Tuile label="Encours sous gestion" valeur={eur(rapport.resume.encoursTotal, 0)} accent="#CDAA5A" aide="Assurance-vie et PER en portefeuille" />
              <Tuile label="Rémunération linéaire / an" valeur={eur(rapport.resume.lineaireTotal, 0)} accent="#2f9e6e" aide="Frais de gestion qui vous reviennent" />
              <Tuile
                label="Contrats d'épargne"
                valeur={String(rapport.resume.contratsEpargne)}
                aide={rapport.resume.contratsEpargneSansMontant ? `Dont ${rapport.resume.contratsEpargneSansMontant} sans montant saisi` : "Tous ont un montant"}
              />
            </div>
          ) : null}
          {onglet === "commissions" ? (
            <Carte titre="Commissions encaissées sur 12 mois">
              <div className="p-4">
                <Barres donnees={rapport.encaissementsMensuels.map((m) => ({ label: moisLabel(m.mois), valeurs: [m.montant] }))} series={[{ nom: "Encaissé (bordereaux validés)", couleur: "#2f9e6e" }]} />
              </div>
            </Carte>
          ) : null}
          <Carte titre={`Par ${AXE_LABEL[axe].toLowerCase()}`}>
            {rapport.lignes.length === 0 ? (
              <Vide>Aucune donnée sur la période.</Vide>
            ) : (
              <Tableau entetes={[AXE_LABEL[axe], ...cols.map((c) => c[0])]} alignDroite={cols.map((_, i) => i + 1)}>
                {rapport.lignes.map((l) => (
                  <tr key={l.valeur}>
                    <td className={tdCls}>{l.valeur}</td>
                    {cols.map(([h, f, num]) => (
                      <td key={h} className={num ? tdNum : tdCls}>
                        {f(l)}
                      </td>
                    ))}
                  </tr>
                ))}
              </Tableau>
            )}
          </Carte>
        </>
      )}
    </div>
  );
}
