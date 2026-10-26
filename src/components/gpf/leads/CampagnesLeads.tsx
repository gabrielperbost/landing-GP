"use client";
// Page Leads : statistiques par campagne (webinaires) et avancement des leads de chaque campagne.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Carte } from "@/components/gpf/PageHeader";
import { api, BoutonOr, LienAction, Panneau, Vide, frDate, inputCls } from "@/components/gpf/fiche/shared";
import { eur, Tableau, tdCls, tdNum } from "@/components/gpf/commissions/commun";

type Etape = "inscrit" | "rdv" | "client";
type Campagne = { id: string; libelle: string; inscrits: number; rdv: number; clients: number; ca: number; caParInscrit: number | null; canaux: { canal: string; n: number }[] };
type LigneLead = { id: string; client_id: string; nom: string; telephone: string | null; email: string | null; canal: string | null; inscrit_at: string; etape: Etape; ca: number | null };

const ETAPE_LABEL: Record<Etape, string> = { inscrit: "Inscrit", rdv: "Prise de rendez-vous", client: "Devenu client" };
const taux = (n: number, sur: number) => (sur ? `${String(Math.round((n / sur) * 1000) / 10).replace(".", ",")} %` : "—");

export function CampagnesLeads() {
  const [campagnes, setCampagnes] = useState<Campagne[] | null>(null);
  const [migrationRequise, setMigrationRequise] = useState(false);
  const [ouverte, setOuverte] = useState<Campagne | null>(null);
  const [reprise, setReprise] = useState(false);

  const charger = () =>
    api("/api/gpf/leads/campagnes", "GET").then((r) => {
      if (!r.ok) return;
      setMigrationRequise(Boolean(r.data.migrationRequise));
      setCampagnes(r.data.campagnes);
    });
  useEffect(() => {
    charger();
  }, []);

  return (
    <Carte titre="Campagnes (webinaires)" actions={!migrationRequise ? <LienAction onClick={() => setReprise(true)}>Reprendre les inscrits des Google Sheets</LienAction> : null}>
      {migrationRequise ? (
        <Vide>Mise à jour de la base nécessaire : Paramètres → Base de données → « Appliquer les mises à jour ».</Vide>
      ) : !campagnes ? (
        <Vide>Chargement…</Vide>
      ) : (
        <Tableau entetes={["Campagne", "Inscrits", "Prise de RDV", "Clients", "Transformation", "CA généré", "CA / inscrit"]} alignDroite={[1, 2, 3, 4, 5, 6]}>
          {campagnes.map((c) => (
            <tr key={c.id} className="cursor-pointer hover:bg-[var(--gpf-fill)]" onClick={() => setOuverte(c)}>
              <td className={tdCls}>
                <span className="font-medium hover:underline">{c.libelle}</span>
                {c.canaux.length ? <span className="block text-[11px] text-[var(--gpf-subtle)]">{c.canaux.map((x) => `${x.canal} ${x.n}`).join(" · ")}</span> : null}
              </td>
              <td className={tdNum}>{c.inscrits}</td>
              <td className={tdNum}>
                {c.rdv} <span className="text-[11px] text-[var(--gpf-subtle)]">({taux(c.rdv, c.inscrits)})</span>
              </td>
              <td className={tdNum}>{c.clients}</td>
              <td className={tdNum}>{taux(c.clients, c.inscrits)}</td>
              <td className={tdNum}>{eur(c.ca, 0)}</td>
              <td className={tdNum}>{c.caParInscrit == null ? "—" : eur(c.caParInscrit, 0)}</td>
            </tr>
          ))}
        </Tableau>
      )}
      {ouverte ? (
        <LeadsCampagne
          campagne={ouverte}
          onClose={() => {
            setOuverte(null);
            charger();
          }}
        />
      ) : null}
      {reprise ? (
        <Reprise
          onClose={() => {
            setReprise(false);
            charger();
          }}
        />
      ) : null}
    </Carte>
  );
}

function LeadsCampagne({ campagne, onClose }: { campagne: Campagne; onClose: () => void }) {
  const [lignes, setLignes] = useState<LigneLead[] | null>(null);
  const [filtre, setFiltre] = useState<Etape | "tous">("tous");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    api(`/api/gpf/leads/campagnes?campagne=${encodeURIComponent(campagne.id)}`, "GET").then((r) => r.ok && setLignes(r.data.lignes));
  }, [campagne.id]);

  const enregistrer = async (l: LigneLead, maj: Partial<Pick<LigneLead, "etape" | "ca">>) => {
    setErreur(null);
    setLignes((prev) => prev?.map((x) => (x.id === l.id ? { ...x, ...maj } : x)) ?? prev);
    const r = await api("/api/gpf/leads/campagnes", "PATCH", { id: l.id, ...maj });
    if (!r.ok) setErreur(r.data?.error === "ca_invalide" ? "Montant de CA invalide." : "Enregistrement impossible, réessayez.");
  };

  const visibles = (lignes ?? []).filter((l) => filtre === "tous" || l.etape === filtre);
  return (
    <Panneau titre={campagne.libelle} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {(["tous", "inscrit", "rdv", "client"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`rounded-full px-3 py-1 text-xs border ${filtre === f ? "bg-[#CDAA5A] text-[#071c2c] border-transparent" : "text-[var(--gpf-muted)] border-[var(--gpf-border)]"}`}
            >
              {f === "tous" ? `Tous (${lignes?.length ?? 0})` : `${ETAPE_LABEL[f]} (${(lignes ?? []).filter((l) => l.etape === f).length})`}
            </button>
          ))}
        </div>
        {erreur ? <p className="text-sm text-[#b3463f]">{erreur}</p> : null}
        {!lignes ? (
          <Vide>Chargement…</Vide>
        ) : visibles.length === 0 ? (
          <Vide>Aucun lead.</Vide>
        ) : (
          visibles.map((l) => (
            <div key={l.id} className="border border-[var(--gpf-border-soft)] rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/gpf/contacts/${l.client_id}`} className="text-sm font-medium hover:underline">
                    {l.nom}
                  </Link>
                  <p className="text-[11px] text-[var(--gpf-subtle)]">
                    Inscrit le {frDate(l.inscrit_at)} · {l.canal ?? "direct"}
                    {l.telephone ? ` · ${l.telephone}` : ""}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select className={inputCls} value={l.etape} onChange={(e) => enregistrer(l, { etape: e.target.value as Etape })}>
                  {(Object.keys(ETAPE_LABEL) as Etape[]).map((e) => (
                    <option key={e} value={e}>
                      {ETAPE_LABEL[e]}
                    </option>
                  ))}
                </select>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  placeholder="CA généré (€)"
                  defaultValue={l.ca ?? ""}
                  disabled={l.etape !== "client"}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    const ca = v === "" ? null : Number(v.replace(/\s/g, "").replace(",", "."));
                    if (ca !== l.ca) enregistrer(l, { ca: ca as number | null });
                  }}
                />
              </div>
            </div>
          ))
        )}
        <p className="text-[11px] text-[var(--gpf-subtle)]">Le CA se saisit une fois le lead passé en « Devenu client ». Il est enregistré dès que vous quittez le champ.</p>
      </div>
    </Panneau>
  );
}

type Analyse = { parCampagne: { id: string; libelle: string; total: number; aImporter: number }[]; aImporter: number; erreurs: { campagne: string; error: string }[] };

function Reprise({ onClose }: { onClose: () => void }) {
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [progres, setProgres] = useState<{ importes: number; restants: number; echecs: number } | null>(null);
  const [fini, setFini] = useState(false);

  useEffect(() => {
    api("/api/gpf/leads/campagnes/reprise", "POST", { etape: "analyser" }).then((r) =>
      r.ok ? setAnalyse(r.data) : setErreur(r.data?.error === "migration_requise" ? "Appliquez d'abord la mise à jour de la base (Paramètres → Base de données)." : "Lecture des Google Sheets impossible.")
    );
  }, []);

  const importer = async () => {
    let importes = 0;
    let echecs = 0;
    setProgres({ importes, restants: analyse?.aImporter ?? 0, echecs });
    // Lots de 20 : on relance tant qu'il en reste et que le lot précédent a avancé.
    for (;;) {
      const r = await api("/api/gpf/leads/campagnes/reprise", "POST", { etape: "importer" });
      if (!r.ok) {
        setErreur("Import interrompu. Relancez : les leads déjà importés ne seront pas dupliqués.");
        break;
      }
      importes += r.data.importes;
      echecs += r.data.echecs.length;
      setProgres({ importes, restants: r.data.restants, echecs });
      if (r.data.restants === 0 || r.data.importes === 0) break;
    }
    setFini(true);
  };

  return (
    <Panneau titre="Reprendre les inscrits des webinaires" onClose={onClose}>
      <div className="flex flex-col gap-3 text-sm text-[var(--gpf-ink)]">
        <p className="text-xs text-[var(--gpf-muted)]">
          Les inscrits des Google Sheets deviennent des leads, rattachés à leur campagne, avec un dossier PER « à traiter ». Ni tâche d&apos;appel ni notification. Un contact déjà dans le CRM
          (même e-mail ou téléphone) n&apos;est pas dupliqué : il reçoit une note.
        </p>
        {erreur ? <p className="text-[#b3463f]">{erreur}</p> : null}
        {!analyse && !erreur ? <Vide>Lecture des Google Sheets…</Vide> : null}
        {analyse ? (
          <>
            <Tableau entetes={["Campagne", "Inscrits", "À importer"]} alignDroite={[1, 2]}>
              {analyse.parCampagne.map((c) => (
                <tr key={c.id}>
                  <td className={tdCls}>{c.libelle}</td>
                  <td className={tdNum}>{c.total}</td>
                  <td className={tdNum}>{c.aImporter}</td>
                </tr>
              ))}
            </Tableau>
            {analyse.erreurs.map((e) => (
              <p key={e.campagne} className="text-xs text-[#b3463f]">
                Sheet illisible ({e.campagne}) : {e.error}
              </p>
            ))}
            {progres ? (
              <p>
                {progres.importes} importé(s){progres.echecs ? `, ${progres.echecs} en échec` : ""}
                {fini ? "." : ` · ${progres.restants} restant(s)…`}
              </p>
            ) : null}
            {fini ? (
              <BoutonOr onClick={onClose}>Fermer</BoutonOr>
            ) : (
              <BoutonOr onClick={importer} disabled={!analyse.aImporter || Boolean(progres)}>
                {progres ? "Import en cours…" : analyse.aImporter ? `Importer ${analyse.aImporter} inscrit(s)` : "Tout est déjà importé"}
              </BoutonOr>
            )}
          </>
        ) : null}
      </div>
    </Panneau>
  );
}
