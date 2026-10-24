"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonTiles } from "@/components/gpf/Skeleton";
import { api, Vide, frDate } from "@/components/gpf/fiche/shared";
import { Barres, eur, exporterCsv, moisLabel, Onglets, Tableau, tdCls, tdNum, Tuile } from "@/components/gpf/commissions/commun";
import { Bordereaux } from "@/components/gpf/commissions/Bordereaux";
import { Regles } from "@/components/gpf/commissions/Regles";
import { GPF_PRODUIT_LABEL, type GpfProduit } from "@/lib/gpf/types";

type Onglet = "synthese" | "bordereaux" | "regles" | "apporteurs" | "decommissions";
type Synthese = {
  mois: string[];
  parMois: { mois: string; attendu: number; encaisse: number; decommissions: number; retrocessions: number; net: number }[];
  compagnies: { compagnie: string; attendu: number; encaisse: number; decommissions: number; ecart: number; lignes: number }[];
  decommissions: { id: string; mois: string; client: string; client_id: string | null; compagnie: string | null; montant: number }[];
  sansCommission: { id: string; client_id: string; client: string; produit: string; compagnie: string; date_effet: string | null; attendu: number }[];
  retroApporteurs: { id: string; nom: string; taux: number | null; parMois: { mois: string; montant: number }[]; total12: number }[];
  retroSansApporteur: number;
};

export default function CommissionsPage() {
  const [onglet, setOnglet] = useState<Onglet>("synthese");
  const [idBordereau, setIdBordereau] = useState<string | null>(null);
  const [synthese, setSynthese] = useState<Synthese | null>(null);
  const [insurers, setInsurers] = useState<{ id: string; nom: string }[]>([]);
  const [encours, setEncours] = useState<{ encoursTotal: number; lineaireTotal: number; contratsEpargne: number } | null>(null);

  const charger = async () => {
    const [s, r] = await Promise.all([api("/api/gpf/commissions/synthese", "GET"), api("/api/gpf/commissions/regles", "GET")]);
    if (s.ok) setSynthese(s.data);
    if (r.ok) setInsurers(r.data.insurers);
    // Encours sous gestion (assurance-vie, PER) : calculé par le reporting.
    const e = await api("/api/gpf/reporting?axe=produit&mois=12", "GET");
    if (e.ok) setEncours(e.data.resume);
  };
  useEffect(() => {
    // Lien direct depuis une notification : /gpf/commissions?onglet=bordereaux&id=…
    const p = new URLSearchParams(window.location.search);
    const o = p.get("onglet") as Onglet | null;
    if (o) setOnglet(o);
    setIdBordereau(p.get("id"));
    charger();
  }, []);

  const s = synthese;
  const total = (k: "attendu" | "encaisse" | "decommissions" | "retrocessions" | "net") => (s ? s.parMois.reduce((x, m) => x + m[k], 0) : 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Commissions" sousTitre="Attendu, encaissé, bordereaux, rétrocessions et décommissions" />
      <Onglets
        valeur={onglet}
        onChange={(o) => {
          setOnglet(o);
          setIdBordereau(null);
        }}
        items={[
          ["synthese", "Synthèse"],
          ["bordereaux", "Bordereaux"],
          ["regles", "Règles"],
          ["apporteurs", "Apporteurs"],
          ["decommissions", "Décommissions", s?.decommissions.length]
        ]}
      />

      {onglet === "bordereaux" ? (
        <Bordereaux key={idBordereau ?? "liste"} insurers={insurers} idInitial={idBordereau} onChange={charger} />
      ) : onglet === "regles" ? (
        <Regles insurers={insurers} />
      ) : !s ? (
        <SkeletonTiles />
      ) : onglet === "synthese" ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tuile label="Attendu (12 mois)" valeur={eur(total("attendu"), 0)} aide="Contrats signés, par mois d'effet" />
            <Tuile label="Encaissé (12 mois)" valeur={eur(total("encaisse"), 0)} accent="#2f9e6e" aide="Bordereaux validés" />
            <Tuile label="Décommissions" valeur={eur(total("decommissions"), 0)} accent="#b3463f" />
            <Tuile label="Net cabinet" valeur={eur(total("net"), 0)} aide="Après rétrocessions et reprises" />
          </div>
          {encours ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tuile label="Encours sous gestion" valeur={eur(encours.encoursTotal, 0)} accent="#CDAA5A" aide={`${encours.contratsEpargne} contrat(s) d'assurance-vie et PER`} />
              <Tuile label="Rémunération linéaire / an" valeur={eur(encours.lineaireTotal, 0)} accent="#2f9e6e" aide="Frais de gestion qui vous reviennent" />
            </div>
          ) : null}
          <Carte titre="Attendu vs encaissé par mois">
            <div className="p-4">
              <Barres
                donnees={s.parMois.map((m) => ({ label: moisLabel(m.mois), valeurs: [m.attendu, m.encaisse] }))}
                series={[
                  { nom: "Attendu", couleur: "#CDAA5A" },
                  { nom: "Encaissé", couleur: "#2f9e6e" }
                ]}
              />
            </div>
            <Tableau entetes={["Mois", "Attendu", "Encaissé", "Décommissions", "Rétrocessions", "Net cabinet"]} alignDroite={[1, 2, 3, 4, 5]}>
              {[...s.parMois].reverse().map((m) => (
                <tr key={m.mois}>
                  <td className={tdCls}>{moisLabel(m.mois)}</td>
                  <td className={tdNum}>{eur(m.attendu)}</td>
                  <td className={tdNum}>{eur(m.encaisse)}</td>
                  <td className={tdNum}>{m.decommissions ? eur(-m.decommissions) : "—"}</td>
                  <td className={tdNum}>{m.retrocessions ? eur(-m.retrocessions) : "—"}</td>
                  <td className={`${tdNum} font-medium`}>{eur(m.net)}</td>
                </tr>
              ))}
            </Tableau>
          </Carte>
          <Carte titre="Par compagnie (12 mois)">
            {s.compagnies.length === 0 ? (
              <Vide>Aucune donnée.</Vide>
            ) : (
              <Tableau entetes={["Compagnie", "Attendu", "Encaissé", "Décommissions", "Écart"]} alignDroite={[1, 2, 3, 4]}>
                {s.compagnies.map((c) => (
                  <tr key={c.compagnie}>
                    <td className={tdCls}>{c.compagnie}</td>
                    <td className={tdNum}>{eur(c.attendu)}</td>
                    <td className={tdNum}>{eur(c.encaisse)}</td>
                    <td className={tdNum}>{c.decommissions ? eur(-c.decommissions) : "—"}</td>
                    <td className={tdNum} style={{ color: c.ecart < 0 ? "#b3463f" : "#2f9e6e" }}>
                      {eur(c.ecart)}
                    </td>
                  </tr>
                ))}
              </Tableau>
            )}
          </Carte>
          <Carte titre={`Contrats sans commission reçue (${s.sansCommission.length})`}>
            {s.sansCommission.length === 0 ? (
              <Vide>Tous les contrats signés depuis plus de 60 jours ont reçu au moins une commission.</Vide>
            ) : (
              <Tableau entetes={["Client", "Produit", "Compagnie", "Effet", "Attendu"]} alignDroite={[4]}>
                {s.sansCommission.slice(0, 100).map((d) => (
                  <tr key={d.id}>
                    <td className={tdCls}>
                      <Link href={`/gpf/contacts/${d.client_id}`} className="hover:underline">
                        {d.client}
                      </Link>
                    </td>
                    <td className={tdCls}>{GPF_PRODUIT_LABEL[d.produit as GpfProduit] ?? d.produit}</td>
                    <td className={tdCls}>{d.compagnie}</td>
                    <td className={tdCls}>{frDate(d.date_effet) ?? "—"}</td>
                    <td className={tdNum}>{eur(d.attendu)}</td>
                  </tr>
                ))}
              </Tableau>
            )}
          </Carte>
        </>
      ) : onglet === "apporteurs" ? (
        <Carte
          titre="Rétrocessions à reverser par mois"
          actions={
            <button
              className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]"
              onClick={() =>
                exporterCsv(
                  "retrocessions-apporteurs.csv",
                  ["Apporteur", ...s.mois.map(moisLabel), "Total 12 mois"],
                  s.retroApporteurs.map((a) => [a.nom, ...a.parMois.map((m) => m.montant), a.total12])
                )
              }
            >
              Exporter (CSV)
            </button>
          }
        >
          <Tableau entetes={["Apporteur", "Taux", ...s.mois.slice(-6).map(moisLabel), "Total 12 mois"]} alignDroite={[1, 2, 3, 4, 5, 6, 7, 8]}>
            {s.retroApporteurs.map((a) => (
              <tr key={a.id}>
                <td className={tdCls}>{a.nom}</td>
                <td className={tdNum}>{a.taux != null ? `${Number(a.taux).toLocaleString("fr-FR")} %` : "—"}</td>
                {a.parMois.slice(-6).map((m) => (
                  <td key={m.mois} className={tdNum}>
                    {m.montant ? eur(m.montant) : "—"}
                  </td>
                ))}
                <td className={`${tdNum} font-medium`}>{eur(a.total12)}</td>
              </tr>
            ))}
          </Tableau>
          <p className="px-4 py-3 text-xs text-[var(--gpf-subtle)]">
            Rétrocessions sur des dossiers sans apporteur rattaché (taux saisi sur le dossier) : {eur(s.retroSansApporteur)}. Les fiches apporteurs détaillées arrivent avec le module Apporteurs.
          </p>
        </Carte>
      ) : (
        <Carte
          titre="Décommissions (reprises de commission)"
          actions={
            <button
              className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]"
              onClick={() => exporterCsv("decommissions.csv", ["Mois", "Client", "Compagnie", "Montant"], s.decommissions.map((d) => [d.mois, d.client, d.compagnie, -d.montant]))}
            >
              Exporter (CSV)
            </button>
          }
        >
          {s.decommissions.length === 0 ? (
            <Vide>Aucune décommission sur les bordereaux validés.</Vide>
          ) : (
            <Tableau entetes={["Mois", "Client", "Compagnie", "Montant repris"]} alignDroite={[3]}>
              {s.decommissions.map((d) => (
                <tr key={d.id}>
                  <td className={tdCls}>{moisLabel(d.mois)}</td>
                  <td className={tdCls}>
                    {d.client_id ? (
                      <Link href={`/gpf/contacts/${d.client_id}`} className="hover:underline">
                        {d.client}
                      </Link>
                    ) : (
                      d.client
                    )}
                  </td>
                  <td className={tdCls}>{d.compagnie ?? "—"}</td>
                  <td className={tdNum} style={{ color: "#b3463f" }}>
                    {eur(-d.montant)}
                  </td>
                </tr>
              ))}
            </Tableau>
          )}
        </Carte>
      )}
    </div>
  );
}
