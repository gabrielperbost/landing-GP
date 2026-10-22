"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { api, Vide, frDate } from "@/components/gpf/fiche/shared";
import { Onglets, Tableau, tdCls, Tuile } from "@/components/gpf/commissions/commun";

type Ligne = {
  client_id: string;
  client: string;
  nbDossiers: number;
  contrat: boolean;
  etat: Record<"der" | "lettre_mission" | "collecte" | "piece_identite" | "rapport_adequation", string>;
  recueilDate: string | null;
  recueilPerime: boolean;
  aSigner: number;
  bloque: boolean;
  complet: boolean;
};
type Filtre = "tous" | "bloques" | "perimes" | "incomplets" | "complets";
const COLS: [keyof Ligne["etat"], string][] = [
  ["der", "DER"],
  ["lettre_mission", "Lettre de mission"],
  ["collecte", "Recueil"],
  ["piece_identite", "Pièce d'identité"],
  ["rapport_adequation", "Rapport"]
];
const COULEUR: Record<string, string> = { fait: "#2f9e6e", en_cours: "#c98a1f", manquant: "#b3463f" };
const LIBELLE: Record<string, string> = { fait: "Fait", en_cours: "En cours", manquant: "Manquant" };

export default function ConformitePage() {
  const [data, setData] = useState<{ disponible: boolean; lignes: Ligne[]; resume: { total: number; complets: number; bloques: number; recueilsPerimes: number; sansDer: number } | null } | null>(null);
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [q, setQ] = useState("");

  useEffect(() => {
    api("/api/gpf/conformite", "GET").then((r) => setData(r.ok ? r.data : { disponible: false, lignes: [], resume: null }));
  }, []);

  const lignes = useMemo(() => {
    const l = data?.lignes ?? [];
    const f =
      filtre === "bloques" ? l.filter((x) => x.bloque) : filtre === "perimes" ? l.filter((x) => x.recueilPerime) : filtre === "incomplets" ? l.filter((x) => !x.complet) : filtre === "complets" ? l.filter((x) => x.complet) : l;
    const n = q.trim().toLowerCase();
    return n ? f.filter((x) => x.client.toLowerCase().includes(n)) : f;
  }, [data, filtre, q]);

  const r = data?.resume;
  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Conformité" sousTitre="DER, lettre de mission, recueil des besoins, pièce d'identité et rapport d'adéquation des clients suivis" />
      {!data ? (
        <SkeletonLines />
      ) : !data.disponible ? (
        <Carte>
          <Vide>La conformité sera disponible après l&apos;application des mises à jour de la base (Paramètres → Base de données).</Vide>
        </Carte>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tuile label="Dossiers complets" valeur={`${r?.complets ?? 0} / ${r?.total ?? 0}`} accent="#2f9e6e" />
            <Tuile label="Souscriptions bloquées" valeur={String(r?.bloques ?? 0)} accent={r?.bloques ? "#b3463f" : undefined} aide="DER ou pièce d'identité manquant" />
            <Tuile label="Recueils à refaire" valeur={String(r?.recueilsPerimes ?? 0)} accent={r?.recueilsPerimes ? "#c98a1f" : undefined} aide="Plus de 12 mois" />
            <Tuile label="Sans DER signé" valeur={String(r?.sansDer ?? 0)} />
          </div>
          <div className="flex gap-3 flex-wrap items-center justify-between">
            <Onglets
              valeur={filtre}
              onChange={setFiltre}
              items={[
                ["tous", "Tous", data.lignes.length],
                ["bloques", "Bloqués", r?.bloques],
                ["perimes", "Recueil > 12 mois", r?.recueilsPerimes],
                ["incomplets", "Incomplets", (r?.total ?? 0) - (r?.complets ?? 0)],
                ["complets", "Complets", r?.complets]
              ]}
            />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client…" className="rounded-lg border px-3 py-2 text-sm bg-[var(--gpf-surface)] w-full sm:w-64" />
          </div>
          <Carte>
            {lignes.length === 0 ? (
              <Vide>Aucun client dans cette vue.</Vide>
            ) : (
              <Tableau entetes={["Client", ...COLS.map((c) => c[1]), "Recueil signé le", ""]}>
                {lignes.slice(0, 300).map((l) => (
                  <tr key={l.client_id}>
                    <td className={tdCls}>
                      <Link href={`/gpf/contacts/${l.client_id}?onglet=conformite`} className="hover:underline font-medium">
                        {l.client}
                      </Link>
                      <span className="block text-[11px] text-[var(--gpf-subtle)]">
                        {l.nbDossiers} dossier(s){l.contrat ? " · client" : ""}
                      </span>
                    </td>
                    {COLS.map(([k]) => (
                      <td key={k} className={tdCls}>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ background: COULEUR[l.etat[k]] ?? "#8a8f98" }} />
                          {LIBELLE[l.etat[k]] ?? l.etat[k]}
                        </span>
                      </td>
                    ))}
                    <td className={tdCls} style={{ color: l.recueilPerime ? "#c98a1f" : undefined }}>
                      {frDate(l.recueilDate) ?? "—"}
                    </td>
                    <td className={tdCls}>
                      {l.bloque ? <span className="text-[11px] text-[#b3463f]">Souscription bloquée</span> : l.aSigner ? <span className="text-[11px] text-[#c98a1f]">{l.aSigner} à signer</span> : null}
                    </td>
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
