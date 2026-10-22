"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { api, BoutonOr, Field, inputCls, Panneau, Vide, frDate, frDateHeure } from "@/components/gpf/fiche/shared";
import { Onglets, Tableau, tdCls } from "@/components/gpf/commissions/commun";
import { Pastille } from "@/components/gpf/commissions/Bordereaux";
import { GPF_PRODUIT_LABEL, GPF_STATUT_LABEL, type GpfProduit, type GpfStatut } from "@/lib/gpf/types";

type TypeCourrier = "resiliation_lemoine" | "resiliation_echeance" | "resiliation_hamon";
type Donnees = { destinataire?: string; adresseDestinataire?: string; reference?: string; numeroPret?: string; dateEffet?: string };
type Courrier = {
  id: string;
  client_id: string;
  client: string;
  type: TypeCourrier;
  statut: "brouillon" | "pret" | "envoye";
  donnees: Donnees;
  document_id: string | null;
  envoye_at: string | null;
  created_at: string;
  dossier: { produit: string; assureur_nom: string | null; banque: string | null; reference_contrat: string | null } | null;
};
type Eligible = { id: string; client_id: string; client: string; produit: string; statut: string; banque: string | null; assureur_nom: string | null; adresseComplete: boolean; typeSuggere: TypeCourrier; dejaPrepare: boolean };
type Onglet = "a_preparer" | "brouillon" | "pret" | "envoye";

const TYPE_LABEL: Record<TypeCourrier, string> = {
  resiliation_lemoine: "Résiliation loi Lemoine",
  resiliation_echeance: "Résiliation à échéance",
  resiliation_hamon: "Résiliation infra-annuelle (Hamon)"
};
const STATUT: Record<Courrier["statut"], [string, string]> = { brouillon: ["À contrôler", "#c98a1f"], pret: ["Prêt à envoyer", "#579bfc"], envoye: ["Envoyé", "#2f9e6e"] };

export default function CourriersPage() {
  const [data, setData] = useState<{ disponible: boolean; courriers: Courrier[]; eligibles: Eligible[] } | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("a_preparer");
  const [selection, setSelection] = useState<Map<string, TypeCourrier>>(new Map());
  const [occupe, setOccupe] = useState(false);
  const [controle, setControle] = useState<Courrier | null>(null);

  const charger = async () => {
    const r = await api("/api/gpf/courriers", "GET");
    setData(r.ok ? r.data : { disponible: false, courriers: [], eligibles: [] });
  };
  useEffect(() => {
    charger();
  }, []);

  const genererLot = async () => {
    if (!selection.size) return;
    setOccupe(true);
    const r = await api("/api/gpf/courriers", "POST", { items: Array.from(selection.entries()).map(([dossier_id, type]) => ({ dossier_id, type })) });
    setOccupe(false);
    if (!r.ok) return alert("Génération impossible.");
    setSelection(new Map());
    await charger();
    setOnglet("brouillon");
    if (r.data.erreurs?.length) alert(`${r.data.crees} courrier(s) générés, ${r.data.erreurs.length} en erreur.`);
  };
  const ouvrir = async (documentId: string | null) => {
    if (!documentId) return;
    const r = await api(`/api/gpf/documents/${documentId}`, "GET");
    if (r.ok) window.open(r.data.url, "_blank");
  };
  const changerStatut = async (c: Courrier, statut: Courrier["statut"]) => {
    await api(`/api/gpf/courriers/${c.id}`, "PATCH", { statut });
    charger();
  };
  const supprimer = async (c: Courrier) => {
    if (!confirm("Supprimer ce brouillon ?")) return;
    await api(`/api/gpf/courriers/${c.id}`, "DELETE");
    charger();
  };

  const courriers = (data?.courriers ?? []).filter((c) => c.statut === onglet);
  const eligibles = data?.eligibles ?? [];
  const compte = (s: Courrier["statut"]) => (data?.courriers ?? []).filter((c) => c.statut === s).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Courriers" sousTitre="Lettres de résiliation préparées au nom du client, contrôlées avant envoi" />
      {!data ? (
        <SkeletonLines />
      ) : !data.disponible ? (
        <Carte>
          <Vide>Les courriers seront disponibles après l&apos;application des mises à jour de la base (Paramètres → Base de données).</Vide>
        </Carte>
      ) : (
        <>
          <Onglets
            valeur={onglet}
            onChange={setOnglet}
            items={[
              ["a_preparer", "À préparer", eligibles.filter((e) => !e.dejaPrepare).length],
              ["brouillon", "À contrôler", compte("brouillon")],
              ["pret", "Prêts", compte("pret")],
              ["envoye", "Envoyés", compte("envoye")]
            ]}
          />

          {onglet === "a_preparer" ? (
            <Carte
              titre="Affaires en cours avec un ancien contrat à résilier"
              actions={
                <BoutonOr onClick={genererLot} disabled={!selection.size || occupe}>
                  {occupe ? "Génération…" : `Générer ${selection.size || ""} courrier(s)`}
                </BoutonOr>
              }
            >
              {eligibles.length === 0 ? (
                <Vide>Aucune affaire en cours sur une assurance de prêt, une mutuelle ou une prévoyance.</Vide>
              ) : (
                <Tableau entetes={["", "Client", "Produit", "Étape", "Ancien contrat chez", "Courrier"]}>
                  {eligibles.map((e) => {
                    const choisi = selection.get(e.id);
                    return (
                      <tr key={e.id} className={e.dejaPrepare ? "opacity-50" : ""}>
                        <td className={tdCls}>
                          <input
                            type="checkbox"
                            checked={Boolean(choisi)}
                            onChange={(ev) => {
                              const m = new Map(selection);
                              if (ev.target.checked) m.set(e.id, e.typeSuggere);
                              else m.delete(e.id);
                              setSelection(m);
                            }}
                          />
                        </td>
                        <td className={tdCls}>
                          <Link href={`/gpf/contacts/${e.client_id}`} className="hover:underline">
                            {e.client}
                          </Link>
                          {!e.adresseComplete ? <span className="block text-[11px] text-[#c98a1f]">Adresse du client incomplète</span> : null}
                          {e.dejaPrepare ? <span className="block text-[11px] text-[var(--gpf-subtle)]">Courrier déjà préparé</span> : null}
                        </td>
                        <td className={tdCls}>{GPF_PRODUIT_LABEL[e.produit as GpfProduit] ?? e.produit}</td>
                        <td className={tdCls}>{GPF_STATUT_LABEL[e.statut as GpfStatut] ?? e.statut}</td>
                        <td className={tdCls}>{e.produit === "assurance_emprunteur" ? e.banque ?? "Banque non renseignée" : "À préciser au contrôle"}</td>
                        <td className={tdCls}>
                          <select
                            className="rounded-lg border px-2 py-1 text-xs"
                            value={choisi ?? e.typeSuggere}
                            onChange={(ev) => setSelection(new Map(selection).set(e.id, ev.target.value as TypeCourrier))}
                          >
                            {(Object.keys(TYPE_LABEL) as TypeCourrier[]).map((t) => (
                              <option key={t} value={t}>
                                {TYPE_LABEL[t]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </Tableau>
              )}
            </Carte>
          ) : (
            <Carte>
              {courriers.length === 0 ? (
                <Vide>Aucun courrier dans cette liste.</Vide>
              ) : (
                <Tableau entetes={["Client", "Courrier", "Destinataire", onglet === "envoye" ? "Envoyé le" : "Créé le", "Statut", ""]}>
                  {courriers.map((c) => (
                    <tr key={c.id}>
                      <td className={tdCls}>
                        <Link href={`/gpf/contacts/${c.client_id}`} className="hover:underline">
                          {c.client}
                        </Link>
                      </td>
                      <td className={tdCls}>{TYPE_LABEL[c.type] ?? c.type}</td>
                      <td className={tdCls}>{c.donnees?.destinataire || c.dossier?.assureur_nom || "—"}</td>
                      <td className={tdCls}>{c.statut === "envoye" ? frDateHeure(c.envoye_at) : frDate(c.created_at)}</td>
                      <td className={tdCls}>
                        <Pastille texte={STATUT[c.statut][0]} couleur={STATUT[c.statut][1]} />
                      </td>
                      <td className={`${tdCls} text-right text-xs`}>
                        <div className="flex gap-3 justify-end">
                          <button className="text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]" onClick={() => ouvrir(c.document_id)}>
                            Voir le PDF
                          </button>
                          {c.statut === "brouillon" ? (
                            <>
                              <button className="text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]" onClick={() => setControle(c)}>
                                Contrôler
                              </button>
                              <button className="text-[var(--gpf-subtle)] hover:text-[#b3463f]" onClick={() => supprimer(c)}>
                                Supprimer
                              </button>
                            </>
                          ) : null}
                          {c.statut === "pret" ? (
                            <>
                              <button className="text-[var(--gpf-muted)]" onClick={() => changerStatut(c, "brouillon")}>
                                Repasser en contrôle
                              </button>
                              <button className="text-[#2f9e6e]" onClick={() => confirm("Marquer ce courrier comme envoyé ?") && changerStatut(c, "envoye")}>
                                Marquer envoyé
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Tableau>
              )}
              {onglet === "pret" ? (
                <p className="px-4 py-3 text-[11px] text-[var(--gpf-subtle)]">
                  L&apos;envoi en recommandé électronique n&apos;est pas encore branché (service payant à la lettre). Imprimez le PDF et envoyez-le en recommandé avec accusé de réception, ou faites-le
                  signer au client, puis marquez le courrier comme envoyé.
                </p>
              ) : null}
            </Carte>
          )}
        </>
      )}

      {controle ? (
        <Controle
          courrier={controle}
          onClose={() => setControle(null)}
          onOuvrir={() => ouvrir(controle.document_id)}
          onFini={() => {
            setControle(null);
            charger();
          }}
        />
      ) : null}
    </div>
  );
}

function Controle({ courrier, onClose, onOuvrir, onFini }: { courrier: Courrier; onClose: () => void; onOuvrir: () => void; onFini: () => void }) {
  const [d, setD] = useState<Donnees>({
    destinataire: courrier.donnees?.destinataire ?? (courrier.type === "resiliation_lemoine" ? courrier.dossier?.banque ?? "" : ""),
    adresseDestinataire: courrier.donnees?.adresseDestinataire ?? "",
    reference: courrier.donnees?.reference ?? courrier.dossier?.reference_contrat ?? "",
    numeroPret: courrier.donnees?.numeroPret ?? "",
    dateEffet: courrier.donnees?.dateEffet ?? ""
  });
  const [occupe, setOccupe] = useState(false);
  const manque = !d.destinataire || !d.adresseDestinataire || !d.reference;

  const enregistrer = async (pret: boolean) => {
    setOccupe(true);
    await api(`/api/gpf/courriers/${courrier.id}`, "PATCH", { donnees: d });
    if (pret) await api(`/api/gpf/courriers/${courrier.id}`, "PATCH", { statut: "pret" });
    setOccupe(false);
    onFini();
  };

  return (
    <Panneau titre={`Contrôle — ${courrier.client}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-[var(--gpf-muted)]">{TYPE_LABEL[courrier.type]}. Complétez les informations : le PDF est régénéré à l&apos;enregistrement.</p>
        <Field label="Destinataire (compagnie ou banque actuelle)">
          <input className={inputCls} value={d.destinataire} onChange={(e) => setD({ ...d, destinataire: e.target.value })} />
        </Field>
        <Field label="Adresse du destinataire (service résiliation)">
          <textarea className={inputCls} rows={3} value={d.adresseDestinataire} onChange={(e) => setD({ ...d, adresseDestinataire: e.target.value })} />
        </Field>
        <Field label="N° du contrat à résilier">
          <input className={inputCls} value={d.reference} onChange={(e) => setD({ ...d, reference: e.target.value })} />
        </Field>
        {courrier.type === "resiliation_lemoine" ? (
          <>
            <Field label="N° du prêt (facultatif)">
              <input className={inputCls} value={d.numeroPret} onChange={(e) => setD({ ...d, numeroPret: e.target.value })} />
            </Field>
            <Field label="Date d'effet du nouveau contrat (facultatif)">
              <input type="date" className={inputCls} value={d.dateEffet} onChange={(e) => setD({ ...d, dateEffet: e.target.value })} />
            </Field>
          </>
        ) : null}
        {manque ? <p className="text-xs text-[#c98a1f]">Destinataire, adresse et n° de contrat sont nécessaires avant de passer le courrier en « Prêt ».</p> : null}
        <div className="flex gap-2 flex-wrap">
          <button onClick={onOuvrir} className="rounded-full border border-[var(--gpf-border)] text-xs px-4 py-2 text-[var(--gpf-muted)]">
            Voir le PDF actuel
          </button>
          <button onClick={() => enregistrer(false)} disabled={occupe} className="rounded-full border border-[var(--gpf-border)] text-xs px-4 py-2 text-[var(--gpf-ink)]">
            Enregistrer
          </button>
          <BoutonOr onClick={() => enregistrer(true)} disabled={occupe || manque}>
            Valider : prêt à envoyer
          </BoutonOr>
        </div>
      </div>
    </Panneau>
  );
}
