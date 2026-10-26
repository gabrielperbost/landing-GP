"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonTiles } from "@/components/gpf/Skeleton";
import { api, BoutonOr, Panneau, Vide, frDateHeure } from "@/components/gpf/fiche/shared";
import { pctLabel, Tableau, tdCls, tdNum, Tuile } from "@/components/gpf/commissions/commun";
import { CampagnesLeads } from "@/components/gpf/leads/CampagnesLeads";
import { GPF_SCORE_COLOR, GPF_SCORE_LABEL, type GpfScore } from "@/lib/gpf/types";

type Donnees = {
  stats: { leads30: number; contactes30: number; delaiMoyenMin: number | null; delaiMedianMin: number | null; sousUneHeure: number | null };
  aAppeler: { id: string; nom: string; source: string; telephone: string | null; created_at: string; score: GpfScore | null }[];
  derniersContactes: { id: string; nom: string; source: string; delaiMin: number }[];
  parSource: { source: string; leads: number; contactes: number; signes: number }[];
  evenements: { id: string; source: string; client_id: string | null; client: string | null; cree: boolean; resume: string | null; created_at: string }[];
  connexions: { secretConfigure: boolean; tally: string | null; calendly: string | null; meta: string; metaVerifyToken: string | null; metaPret: boolean; calendlySigne: boolean };
};

/** « 2 h 05 », « 3 j 4 h », « 12 min ». */
const duree = (min: number | null | undefined) => {
  if (min == null) return "—";
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
  return `${Math.floor(min / 1440)} j ${Math.floor((min % 1440) / 60)} h`;
};
const couleurDelai = (min: number) => (min <= 60 ? "#2f9e6e" : min <= 24 * 60 ? "#c98a1f" : "#b3463f");

export default function LeadsPage() {
  const [d, setD] = useState<Donnees | null>(null);
  const [importer, setImporter] = useState(false);
  const [maintenant, setMaintenant] = useState(Date.now());

  const charger = () => api("/api/gpf/leads", "GET").then((r) => r.ok && setD(r.data));
  useEffect(() => {
    charger();
    // Le compteur « en attente depuis » avance tout seul.
    const t = setInterval(() => setMaintenant(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Leads" sousTitre="Arrivée automatique des leads et délai de premier contact" actions={<BoutonOr onClick={() => setImporter(true)}>Importer un fichier Masterleads</BoutonOr>} />
      {!d ? (
        <SkeletonTiles />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tuile label="Leads (30 jours)" valeur={String(d.stats.leads30)} aide={`${d.stats.contactes30} contacté(s)`} />
            <Tuile label="Délai moyen 1er contact" valeur={duree(d.stats.delaiMoyenMin)} accent={d.stats.delaiMoyenMin != null ? couleurDelai(d.stats.delaiMoyenMin) : undefined} />
            <Tuile label="Délai médian" valeur={duree(d.stats.delaiMedianMin)} />
            <Tuile label="Rappelés en moins d'1 h" valeur={pctLabel(d.stats.sousUneHeure)} accent="#2f9e6e" />
          </div>

          <Carte titre={`À appeler (${d.aAppeler.length})`}>
            {d.aAppeler.length === 0 ? (
              <Vide>Tous les leads récents ont été contactés.</Vide>
            ) : (
              <Tableau entetes={["Lead", "Source", "Score", "Téléphone", "En attente depuis"]}>
                {d.aAppeler.map((l) => {
                  const min = Math.round((maintenant - new Date(l.created_at).getTime()) / 60000);
                  return (
                    <tr key={l.id}>
                      <td className={tdCls}>
                        <Link href={`/gpf/contacts/${l.id}`} className="hover:underline font-medium">
                          {l.nom}
                        </Link>
                      </td>
                      <td className={tdCls}>{l.source}</td>
                      <td className={tdCls}>{l.score ? <span style={{ color: GPF_SCORE_COLOR[l.score] }}>{GPF_SCORE_LABEL[l.score]}</span> : "—"}</td>
                      <td className={tdCls}>{l.telephone ? <a href={`tel:${l.telephone.replace(/\s/g, "")}`} className="hover:underline">{l.telephone}</a> : "—"}</td>
                      <td className={tdCls} style={{ color: couleurDelai(min), fontWeight: 600 }}>
                        {duree(min)}
                      </td>
                    </tr>
                  );
                })}
              </Tableau>
            )}
          </Carte>

          <div className="grid lg:grid-cols-2 gap-4">
            <Carte titre="Par source (30 jours)">
              {d.parSource.length === 0 ? (
                <Vide>Aucun lead sur la période.</Vide>
              ) : (
                <Tableau entetes={["Source", "Leads", "Contactés", "Signés"]} alignDroite={[1, 2, 3]}>
                  {d.parSource.map((s) => (
                    <tr key={s.source}>
                      <td className={tdCls}>{s.source}</td>
                      <td className={tdNum}>{s.leads}</td>
                      <td className={tdNum}>{s.contactes}</td>
                      <td className={tdNum}>{s.signes}</td>
                    </tr>
                  ))}
                </Tableau>
              )}
            </Carte>
            <Carte titre="Derniers délais de premier contact">
              {d.derniersContactes.length === 0 ? (
                <Vide>Pas encore de premier contact enregistré (journalisez vos appels sur la fiche).</Vide>
              ) : (
                <Tableau entetes={["Lead", "Source", "Délai"]} alignDroite={[2]}>
                  {d.derniersContactes.map((l) => (
                    <tr key={l.id}>
                      <td className={tdCls}>
                        <Link href={`/gpf/contacts/${l.id}`} className="hover:underline">
                          {l.nom}
                        </Link>
                      </td>
                      <td className={tdCls}>{l.source}</td>
                      <td className={tdNum} style={{ color: couleurDelai(l.delaiMin) }}>
                        {duree(l.delaiMin)}
                      </td>
                    </tr>
                  ))}
                </Tableau>
              )}
            </Carte>
          </div>

          <CampagnesLeads />

          <Connexions c={d.connexions} />

          <Carte titre="Leads reçus automatiquement">
            {d.evenements.length === 0 ? (
              <Vide>Aucun lead reçu par webhook ou import pour l&apos;instant.</Vide>
            ) : (
              <Tableau entetes={["Reçu le", "Source", "Contact", ""]}>
                {d.evenements.map((e) => (
                  <tr key={e.id}>
                    <td className={tdCls}>{frDateHeure(e.created_at)}</td>
                    <td className={tdCls}>{e.source}</td>
                    <td className={tdCls}>
                      {e.client_id ? (
                        <Link href={`/gpf/contacts/${e.client_id}`} className="hover:underline">
                          {e.client ?? e.resume}
                        </Link>
                      ) : (
                        e.resume ?? "—"
                      )}
                    </td>
                    <td className={tdCls}>{e.cree ? <span className="text-[11px] text-[#2f9e6e]">Nouveau</span> : <span className="text-[11px] text-[var(--gpf-subtle)]">Déjà connu</span>}</td>
                  </tr>
                ))}
              </Tableau>
            )}
          </Carte>
        </>
      )}
      {importer ? (
        <Import
          onClose={() => setImporter(false)}
          onFini={() => {
            setImporter(false);
            charger();
          }}
        />
      ) : null}
    </div>
  );
}

function Ligne({ titre, etat, children }: { titre: string; etat: "ok" | "a_faire"; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-[var(--gpf-border-soft)] last:border-0">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: etat === "ok" ? "#2f9e6e" : "#c98a1f" }} />
        <p className="text-sm font-medium text-[var(--gpf-ink)]">{titre}</p>
      </div>
      <div className="text-xs text-[var(--gpf-muted)] mt-1.5 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Adresse({ url }: { url: string | null }) {
  if (!url) return <span>Adresse disponible dès que le secret des webhooks est configuré.</span>;
  return (
    <span className="flex items-center gap-2">
      <code className="bg-[var(--gpf-fill)] rounded px-2 py-1 text-[11px] break-all">{url}</code>
      <button onClick={() => navigator.clipboard?.writeText(url)} className="text-[var(--gpf-ink)] shrink-0">
        Copier
      </button>
    </span>
  );
}

function Connexions({ c }: { c: Donnees["connexions"] }) {
  return (
    <Carte titre="Connexions (gratuites)">
      <Ligne titre="Tally" etat={c.tally ? "ok" : "a_faire"}>
        <span>Dans Tally : formulaire → Integrations → Webhooks → coller cette adresse.</span>
        <Adresse url={c.tally} />
      </Ligne>
      <Ligne titre="Calendly" etat={c.calendly ? "ok" : "a_faire"}>
        <span>Les RDV pris arrivent dans l&apos;agenda. Abonnement webhook (événements invitee.created et invitee.canceled) avec cette adresse :</span>
        <Adresse url={c.calendly} />
      </Ligne>
      <Ligne titre="Meta Lead Ads" etat={c.metaPret ? "ok" : "a_faire"}>
        <span>
          Via une app Meta for Developers (gratuite) abonnée au champ « leadgen » de la page. URL de rappel et jeton de vérification ci-dessous ; il faut ensuite enregistrer META_APP_SECRET et
          META_PAGE_ACCESS_TOKEN sur Vercel.
        </span>
        <Adresse url={c.meta} />
        {c.metaVerifyToken ? <Adresse url={c.metaVerifyToken} /> : null}
      </Ligne>
      <Ligne titre="Masterleads" etat="ok">
        <span>Import du fichier CSV ou Excel reçu (bouton en haut de page) : doublons détectés, tâche d&apos;appel créée pour chaque lead.</span>
      </Ligne>
    </Carte>
  );
}

function Import({ onClose, onFini }: { onClose: () => void; onFini: () => void }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [apercu, setApercu] = useState<{ total: number; doublons: number; apercu: { prenom: string | null; nom: string | null; email: string | null; telephone: string | null }[] } | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const envoyer = async (etape: "analyser" | "importer") => {
    if (!fichier) return;
    setOccupe(true);
    setErreur(null);
    const fd = new FormData();
    fd.append("file", fichier);
    fd.append("etape", etape);
    fd.append("source", "Masterleads");
    const r = await api("/api/gpf/leads/import", "POST", fd);
    setOccupe(false);
    if (!r.ok) return setErreur(r.data?.error === "aucun_lead" ? "Aucune ligne avec e-mail ou téléphone n'a été trouvée." : r.data?.error === "trop_de_lignes" ? "1 000 lignes maximum par import." : "Import impossible.");
    if (etape === "analyser") setApercu(r.data);
    else {
      alert(`${r.data.crees} nouveau(x) lead(s) créé(s), ${r.data.connus} déjà connu(s).`);
      onFini();
    }
  };

  return (
    <Panneau titre="Importer des leads Masterleads" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <input
          type="file"
          accept=".csv,.txt,.xlsx"
          className="text-sm"
          onChange={(e) => {
            setFichier(e.target.files?.[0] ?? null);
            setApercu(null);
          }}
        />
        {erreur ? <p className="text-sm text-[#b3463f]">{erreur}</p> : null}
        {!apercu ? (
          <BoutonOr onClick={() => envoyer("analyser")} disabled={!fichier || occupe}>
            {occupe ? "Lecture…" : "Lire le fichier"}
          </BoutonOr>
        ) : (
          <>
            <p className="text-sm text-[var(--gpf-ink)]">
              {apercu.total} lead(s) trouvé(s), dont {apercu.doublons} déjà dans le CRM (ils recevront une note et une tâche de rappel, sans doublon).
            </p>
            <div className="text-xs text-[var(--gpf-muted)] flex flex-col gap-1">
              {apercu.apercu.map((l, i) => (
                <span key={i}>{[l.prenom, l.nom, l.email, l.telephone].filter(Boolean).join(" · ")}</span>
              ))}
            </div>
            <BoutonOr onClick={() => envoyer("importer")} disabled={occupe}>
              {occupe ? "Import en cours…" : `Importer ${apercu.total} lead(s)`}
            </BoutonOr>
          </>
        )}
      </div>
    </Panneau>
  );
}
