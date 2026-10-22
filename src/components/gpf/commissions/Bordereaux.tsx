"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, BoutonOr, Field, inputCls, Panneau, Vide, frDate, frDateHeure } from "@/components/gpf/fiche/shared";
import { Carte } from "@/components/gpf/PageHeader";
import { eur, Onglets, Tableau, tdCls, tdNum } from "./commun";
import { GPF_PRODUIT_LABEL, formatNom, type GpfProduit } from "@/lib/gpf/types";

type Bordereau = {
  id: string;
  compagnie: string | null;
  insurer_id: string | null;
  fichier_nom: string | null;
  periode_debut: string | null;
  periode_fin: string | null;
  import_statut: "a_verifier" | "valide" | "annule";
  nb_lignes: number;
  nb_rapprochees: number;
  nb_ecarts: number;
  nb_sans_contrat: number;
  montant_total: number | null;
  created_at: string;
  valide_at: string | null;
  annule_at: string | null;
};
type Ligne = {
  id: string;
  client_nom_brut: string;
  reference_contrat: string | null;
  date_effet: string | null;
  type_commission: string;
  periode_fin: string | null;
  base_commission: number | null;
  taux: number | null;
  montant: number;
  montant_attendu: number | null;
  retrocession: number | null;
  net_cabinet: number | null;
  rapprochement: "rapproche" | "ecart" | "sans_contrat" | "ignore";
  dossier: { id: string; client_id: string; produit: string; assureur_nom: string | null; client: { prenom: string; nom: string } | null } | null;
};

const CHAMP_LABEL: Record<string, string> = {
  client: "Client (nom de l'assuré)",
  reference_contrat: "N° de contrat",
  date_effet: "Date d'effet",
  periode: "Période",
  base: "Base (cotisation encaissée)",
  taux: "Taux",
  montant: "Montant de la commission",
  type: "Type (nouvelle affaire / récurrent)"
};
const STATUT: Record<Bordereau["import_statut"], [string, string]> = {
  a_verifier: ["À vérifier", "#c98a1f"],
  valide: ["Validé", "#2f9e6e"],
  annule: ["Annulé", "#8a8f98"]
};
const RAPPROCHEMENT: Record<Ligne["rapprochement"], [string, string]> = {
  rapproche: ["Rapprochée", "#2f9e6e"],
  ecart: ["Écart", "#c98a1f"],
  sans_contrat: ["Sans contrat", "#b3463f"],
  ignore: ["Ignorée", "#8a8f98"]
};
const TYPE: Record<string, string> = {
  nouvelle_affaire: "Nouvelle affaire",
  recurrent_lineaire: "Récurrent",
  frais_dossier: "Frais de dossier",
  remuneration_apporteur: "Apporteur",
  decommission: "Décommission"
};
const ERREURS: Record<string, string> = {
  format_xls: "Ancien format .xls : enregistrez le fichier en .xlsx ou .csv depuis Excel, puis réessayez.",
  format_inconnu: "Format non pris en charge (CSV, XLSX ou PDF).",
  ia_requise: "La lecture des PDF passe par l'assistant IA, qui n'est pas encore configuré. Importez la version Excel ou CSV du bordereau.",
  aucune_ligne: "Aucune ligne exploitable : vérifiez que la colonne « Montant » est bien associée."
};

export function Pastille({ texte, couleur }: { texte: string; couleur: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${couleur}1f`, color: couleur }}>
      {texte}
    </span>
  );
}

export function Bordereaux({ insurers, idInitial, onChange }: { insurers: { id: string; nom: string }[]; idInitial: string | null; onChange: () => void }) {
  const [liste, setListe] = useState<Bordereau[] | null>(null);
  const [import_, setImport] = useState(false);
  const [ouvert, setOuvert] = useState<string | null>(idInitial);

  const charger = async () => {
    const r = await api("/api/gpf/commissions/bordereaux", "GET");
    setListe(r.ok ? r.data.bordereaux : []);
  };
  useEffect(() => {
    charger();
  }, []);

  if (ouvert)
    return (
      <Detail
        id={ouvert}
        onRetour={() => {
          setOuvert(null);
          charger();
          onChange();
        }}
      />
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <p className="text-sm text-[var(--gpf-muted)]">Chaque import reste « À vérifier » tant que vous ne l&apos;avez pas validé : il ne compte dans les commissions encaissées qu&apos;après validation.</p>
        <BoutonOr onClick={() => setImport(true)}>Importer un bordereau</BoutonOr>
      </div>
      <Carte>
        {liste === null ? (
          <Vide>Chargement…</Vide>
        ) : liste.length === 0 ? (
          <Vide>Aucun bordereau importé pour l&apos;instant.</Vide>
        ) : (
          <Tableau entetes={["Importé le", "Compagnie", "Fichier", "Période", "Lignes", "Rapprochées", "À traiter", "Montant", "Statut"]} alignDroite={[4, 5, 6, 7]}>
            {liste.map((b) => (
              <tr key={b.id} className="cursor-pointer hover:bg-[var(--gpf-surface-alt)]" onClick={() => setOuvert(b.id)}>
                <td className={tdCls}>{frDateHeure(b.created_at)}</td>
                <td className={tdCls}>{b.compagnie ?? "—"}</td>
                <td className={`${tdCls} max-w-[220px] truncate`}>{b.fichier_nom ?? "—"}</td>
                <td className={tdCls}>{b.periode_debut ? `${frDate(b.periode_debut)} → ${frDate(b.periode_fin)}` : "—"}</td>
                <td className={tdNum}>{b.nb_lignes}</td>
                <td className={tdNum}>{b.nb_rapprochees}</td>
                <td className={tdNum}>{b.nb_ecarts + b.nb_sans_contrat || "—"}</td>
                <td className={tdNum}>{eur(b.montant_total)}</td>
                <td className={tdCls}>
                  <Pastille texte={STATUT[b.import_statut]?.[0] ?? b.import_statut} couleur={STATUT[b.import_statut]?.[1] ?? "#8a8f98"} />
                </td>
              </tr>
            ))}
          </Tableau>
        )}
      </Carte>
      {import_ ? (
        <Import
          insurers={insurers}
          onClose={() => setImport(false)}
          onFini={(id) => {
            setImport(false);
            setOuvert(id);
          }}
        />
      ) : null}
    </div>
  );
}

function Import({ insurers, onClose, onFini }: { insurers: { id: string; nom: string }[]; onClose: () => void; onFini: (id: string) => void }) {
  const [insurerId, setInsurerId] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [analyse, setAnalyse] = useState<{ mode: "tableau" | "pdf"; colonnes?: string[]; apercu?: string[][]; nbLignes: number; mapping?: Record<string, string>; champs?: string[]; lignes?: unknown[] } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const envoyer = async (etape: "analyser" | "importer") => {
    if (!fichier) return;
    setOccupe(true);
    setErreur(null);
    const fd = new FormData();
    fd.append("file", fichier);
    fd.append("etape", etape);
    if (insurerId) fd.append("insurer_id", insurerId);
    if (etape === "importer") {
      if (analyse?.mode === "pdf") fd.append("lignes", JSON.stringify(analyse.lignes ?? []));
      else fd.append("mapping", JSON.stringify(mapping));
    }
    const r = await api("/api/gpf/commissions/bordereaux", "POST", fd);
    setOccupe(false);
    if (!r.ok) return setErreur(ERREURS[r.data?.error] ?? r.data?.error ?? "Import impossible.");
    if (etape === "analyser") {
      setAnalyse(r.data);
      setMapping(r.data.mapping ?? {});
    } else onFini(r.data.id);
  };

  return (
    <Panneau titre="Importer un bordereau" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Compagnie">
          <select className={inputCls} value={insurerId} onChange={(e) => setInsurerId(e.target.value)} disabled={Boolean(analyse)}>
            <option value="">— Choisir —</option>
            {insurers.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fichier (CSV, XLSX ou PDF)">
          <input
            type="file"
            accept=".csv,.txt,.xlsx,.xls,.pdf"
            className="text-sm"
            disabled={Boolean(analyse)}
            onChange={(e) => {
              setFichier(e.target.files?.[0] ?? null);
              setAnalyse(null);
            }}
          />
        </Field>
        {erreur ? <p className="text-sm text-[#b3463f]">{erreur}</p> : null}

        {!analyse ? (
          <BoutonOr onClick={() => envoyer("analyser")} disabled={!fichier || !insurerId || occupe}>
            {occupe ? "Lecture du fichier…" : "Lire le fichier"}
          </BoutonOr>
        ) : analyse.mode === "pdf" ? (
          <>
            <p className="text-sm text-[var(--gpf-ink)]">{analyse.nbLignes} ligne(s) extraite(s) du PDF. Elles seront rapprochées puis placées « À vérifier ».</p>
            <BoutonOr onClick={() => envoyer("importer")} disabled={occupe || !analyse.nbLignes}>
              {occupe ? "Import…" : "Importer"}
            </BoutonOr>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-[var(--gpf-ink)] font-medium">Correspondance des colonnes</p>
              <p className="text-xs text-[var(--gpf-muted)] mt-0.5">{analyse.nbLignes} ligne(s) détectée(s). La correspondance est mémorisée pour les prochains bordereaux de cette compagnie.</p>
            </div>
            {(analyse.champs ?? []).map((c) => (
              <Field key={c} label={CHAMP_LABEL[c] ?? c}>
                <select className={inputCls} value={mapping[c] ?? ""} onChange={(e) => setMapping({ ...mapping, [c]: e.target.value })}>
                  <option value="">— Aucune colonne —</option>
                  {(analyse.colonnes ?? []).map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            <div className="overflow-x-auto border border-[var(--gpf-border)] rounded-lg">
              <table className="text-[11px]">
                <thead>
                  <tr>
                    {(analyse.colonnes ?? []).map((c) => (
                      <th key={c} className="px-2 py-1 text-left text-[var(--gpf-muted)] whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(analyse.apercu ?? []).map((l, i) => (
                    <tr key={i}>
                      {l.map((v, j) => (
                        <td key={j} className="px-2 py-1 whitespace-nowrap border-t border-[var(--gpf-border-soft)]">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <BoutonOr onClick={() => envoyer("importer")} disabled={occupe || !mapping.montant || (!mapping.client && !mapping.reference_contrat)}>
              {occupe ? "Import et rapprochement…" : "Importer et rapprocher"}
            </BoutonOr>
          </>
        )}
      </div>
    </Panneau>
  );
}

function Detail({ id, onRetour }: { id: string; onRetour: () => void }) {
  const [data, setData] = useState<{ bordereau: Bordereau; lignes: Ligne[] } | null>(null);
  const [filtre, setFiltre] = useState<"tous" | "a_traiter" | Ligne["rapprochement"]>("a_traiter");
  const [rattacher, setRattacher] = useState<Ligne | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = async () => {
    const r = await api(`/api/gpf/commissions/bordereaux/${id}`, "GET");
    if (r.ok) setData(r.data);
  };
  useEffect(() => {
    charger();
  }, [id]);

  if (!data) return <Vide>Chargement…</Vide>;
  const { bordereau: b, lignes } = data;
  const aTraiter = lignes.filter((l) => l.rapprochement === "ecart" || l.rapprochement === "sans_contrat");
  const visibles = filtre === "tous" ? lignes : filtre === "a_traiter" ? aTraiter : lignes.filter((l) => l.rapprochement === filtre);
  const somme = (f: (l: Ligne) => number) => lignes.filter((l) => l.rapprochement !== "ignore").reduce((s, l) => s + f(l), 0);

  const action = async (a: "valider" | "annuler" | "rouvrir") => {
    const msg =
      a === "valider"
        ? aTraiter.length
          ? `${aTraiter.length} ligne(s) restent à traiter. Valider quand même ce bordereau ?`
          : "Valider ce bordereau ? Ses montants compteront dans les commissions encaissées."
        : a === "annuler"
          ? "Annuler cet import ? Il ne comptera plus dans les commissions (il reste archivé et peut être rouvert)."
          : "Rouvrir ce bordereau pour vérification ?";
    if (!confirm(msg)) return;
    setOccupe(true);
    await api(`/api/gpf/commissions/bordereaux/${id}`, "PATCH", { action: a });
    setOccupe(false);
    charger();
  };
  const majLigne = async (ligneId: string, body: Record<string, unknown>) => {
    await api(`/api/gpf/commissions/lignes/${ligneId}`, "PATCH", body);
    charger();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onRetour} className="text-sm text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
          ← Tous les bordereaux
        </button>
        <div className="flex gap-2">
          {b.import_statut === "a_verifier" ? (
            <>
              <button onClick={() => action("annuler")} disabled={occupe} className="rounded-full border border-[var(--gpf-border)] text-xs px-4 py-2 text-[var(--gpf-muted)]">
                Annuler l&apos;import
              </button>
              <BoutonOr onClick={() => action("valider")} disabled={occupe}>
                Valider le bordereau
              </BoutonOr>
            </>
          ) : (
            <button onClick={() => action("rouvrir")} disabled={occupe} className="rounded-full border border-[var(--gpf-border)] text-xs px-4 py-2 text-[var(--gpf-muted)]">
              Rouvrir
            </button>
          )}
        </div>
      </div>

      <Carte>
        <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)]">Bordereau</p>
            <p className="font-medium text-[var(--gpf-ink)] mt-1">{b.compagnie ?? "Compagnie inconnue"}</p>
            <p className="text-xs text-[var(--gpf-subtle)] truncate">{b.fichier_nom}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)]">Statut</p>
            <div className="mt-1">
              <Pastille texte={STATUT[b.import_statut][0]} couleur={STATUT[b.import_statut][1]} />
            </div>
            <p className="text-xs text-[var(--gpf-subtle)] mt-1">Importé le {frDateHeure(b.created_at)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)]">Brut reçu</p>
            <p className="font-semibold text-[var(--gpf-ink)] mt-1">{eur(somme((l) => Number(l.montant)))}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)]">Rétrocessions</p>
            <p className="font-semibold text-[var(--gpf-ink)] mt-1">{eur(somme((l) => Number(l.retrocession ?? 0)))}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)]">Net cabinet</p>
            <p className="font-semibold text-[#2f9e6e] mt-1">{eur(somme((l) => Number(l.net_cabinet ?? l.montant)))}</p>
          </div>
        </div>
      </Carte>

      <Onglets
        valeur={filtre}
        onChange={setFiltre}
        items={[
          ["a_traiter", "À traiter", aTraiter.length],
          ["tous", "Toutes", lignes.length],
          ["rapproche", "Rapprochées", lignes.filter((l) => l.rapprochement === "rapproche").length],
          ["ignore", "Ignorées", lignes.filter((l) => l.rapprochement === "ignore").length]
        ]}
      />

      <Carte>
        {visibles.length === 0 ? (
          <Vide>{filtre === "a_traiter" ? "Toutes les lignes sont rapprochées. Vous pouvez valider le bordereau." : "Aucune ligne."}</Vide>
        ) : (
          <Tableau entetes={["Client (bordereau)", "Contrat rapproché", "Type", "Prime", "Taux", "Brut", "Attendu", "Rétro.", "Net", "État", ""]} alignDroite={[3, 4, 5, 6, 7, 8]}>
            {visibles.map((l) => (
              <tr key={l.id}>
                <td className={tdCls}>
                  <p>{l.client_nom_brut}</p>
                  {l.reference_contrat ? <p className="text-[11px] text-[var(--gpf-subtle)]">N° {l.reference_contrat}</p> : null}
                </td>
                <td className={tdCls}>
                  {l.dossier ? (
                    <Link href={`/gpf/contacts/${l.dossier.client_id}`} className="hover:underline">
                      {formatNom(l.dossier.client)}
                      <span className="block text-[11px] text-[var(--gpf-subtle)]">
                        {GPF_PRODUIT_LABEL[l.dossier.produit as GpfProduit] ?? l.dossier.produit} · {l.dossier.assureur_nom ?? "—"}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-[var(--gpf-subtle)]">—</span>
                  )}
                </td>
                <td className={tdCls}>{TYPE[l.type_commission] ?? l.type_commission}</td>
                <td className={tdNum}>{eur(l.base_commission)}</td>
                <td className={tdNum}>{l.taux != null ? `${(Number(l.taux) * (Number(l.taux) > 1 ? 1 : 100)).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %` : "—"}</td>
                <td className={tdNum}>{eur(l.montant)}</td>
                <td className={tdNum}>{eur(l.montant_attendu)}</td>
                <td className={tdNum}>{eur(l.retrocession)}</td>
                <td className={tdNum}>{eur(l.net_cabinet)}</td>
                <td className={tdCls}>
                  <Pastille texte={RAPPROCHEMENT[l.rapprochement][0]} couleur={RAPPROCHEMENT[l.rapprochement][1]} />
                </td>
                <td className={`${tdCls} text-right`}>
                  <div className="flex gap-3 justify-end text-xs">
                    {l.rapprochement === "ecart" ? (
                      <button className="text-[#2f9e6e]" onClick={() => majLigne(l.id, { accepter_ecart: true })}>
                        Accepter
                      </button>
                    ) : null}
                    {l.rapprochement !== "ignore" ? (
                      <button className="text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]" onClick={() => setRattacher(l)}>
                        {l.dossier ? "Changer" : "Rattacher"}
                      </button>
                    ) : null}
                    {l.rapprochement !== "ignore" ? (
                      <button className="text-[var(--gpf-subtle)] hover:text-[var(--gpf-ink)]" onClick={() => majLigne(l.id, { ignorer: true })}>
                        Ignorer
                      </button>
                    ) : (
                      <button className="text-[var(--gpf-muted)]" onClick={() => majLigne(l.id, { dossier_id: null })}>
                        Rétablir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Tableau>
        )}
      </Carte>

      {rattacher ? (
        <Rattacher
          ligne={rattacher}
          onClose={() => setRattacher(null)}
          onChoix={async (dossierId) => {
            setRattacher(null);
            await majLigne(rattacher.id, { dossier_id: dossierId });
          }}
        />
      ) : null}
    </div>
  );
}

function Rattacher({ ligne, onClose, onChoix }: { ligne: Ligne; onClose: () => void; onChoix: (dossierId: string) => void }) {
  const [q, setQ] = useState(ligne.client_nom_brut.split(/\s+/)[0] ?? "");
  const [res, setRes] = useState<{ id: string; produit: string; assureur_nom: string | null; reference_contrat: string | null; date_effet: string | null; client: { prenom: string; nom: string } | null }[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) return setRes([]);
      const r = await api(`/api/gpf/dossiers?q=${encodeURIComponent(q.trim())}&pageSize=15&clos=1`, "GET");
      setRes(r.ok ? r.data.dossiers : []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Panneau titre="Rattacher à un contrat" onClose={onClose}>
      <p className="text-sm text-[var(--gpf-muted)] mb-3">
        Ligne du bordereau : <span className="text-[var(--gpf-ink)]">{ligne.client_nom_brut}</span> · {eur(ligne.montant)}
      </p>
      <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom du client, n° de contrat…" autoFocus />
      <div className="mt-3 flex flex-col divide-y divide-[var(--gpf-border-soft)]">
        {res.map((d) => (
          <button key={d.id} onClick={() => onChoix(d.id)} className="text-left py-2.5 hover:bg-[var(--gpf-surface-alt)] px-2 rounded">
            <p className="text-sm text-[var(--gpf-ink)]">{formatNom(d.client)}</p>
            <p className="text-[11px] text-[var(--gpf-subtle)]">
              {GPF_PRODUIT_LABEL[d.produit as GpfProduit] ?? d.produit} · {d.assureur_nom ?? "—"} · effet {frDate(d.date_effet) ?? "—"}
              {d.reference_contrat ? ` · N° ${d.reference_contrat}` : ""}
            </p>
          </button>
        ))}
        {q.trim().length >= 2 && !res.length ? <Vide>Aucun dossier trouvé.</Vide> : null}
      </div>
    </Panneau>
  );
}
