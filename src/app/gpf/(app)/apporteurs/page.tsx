"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines, SkeletonTiles } from "@/components/gpf/Skeleton";
import { api, BoutonOr, Field, inputCls, Panneau, Vide, frDate } from "@/components/gpf/fiche/shared";
import { eur, exporterCsv, moisLabel, pctLabel, Tableau, tdCls, tdNum, Tuile } from "@/components/gpf/commissions/commun";
import { GPF_PRODUIT_LABEL, GPF_STATUT_LABEL, type GpfProduit, type GpfStatut } from "@/lib/gpf/types";

type Mois = { mois: string; commissions: number; aReverser: number; paye: number; payeLe: string | null };
type Apporteur = {
  id: string;
  nom: string;
  type: string | null;
  contact_nom: string | null;
  email: string | null;
  telephone: string | null;
  convention_signee: boolean;
  date_convention: string | null;
  taux_retrocession: number | null;
  notes: string | null;
  nbLeads: number;
  nbSignes: number;
  transformation: number | null;
  nbContrats: number;
  commissions12: number;
  aReverser12: number;
  resteAPayer: number;
  parMois: Mois[];
  leads?: { id: string; nom: string; created_at: string; produits: string[]; statuts: string[]; signe: boolean }[];
};

export default function ApporteursPage() {
  const [liste, setListe] = useState<Apporteur[] | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [nouveau, setNouveau] = useState(false);

  const charger = async () => {
    const r = await api("/api/gpf/apporteurs", "GET");
    setListe(r.ok ? r.data.apporteurs : []);
  };
  useEffect(() => {
    charger();
  }, []);

  if (ouvert)
    return (
      <Fiche
        id={ouvert}
        onRetour={() => {
          setOuvert(null);
          charger();
        }}
      />
    );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Apporteurs" sousTitre="Partenaires qui vous recommandent des clients : leads, transformation, rétrocessions" actions={<BoutonOr onClick={() => setNouveau(true)}>Ajouter un apporteur</BoutonOr>} />
      {!liste ? (
        <SkeletonLines />
      ) : (
        <Carte>
          {liste.length === 0 ? (
            <Vide>Aucun apporteur.</Vide>
          ) : (
            <Tableau entetes={["Apporteur", "Leads", "Signés", "Transformation", "Commissions 12 mois", "Rétrocessions 12 mois", "Reste à payer"]} alignDroite={[1, 2, 3, 4, 5, 6]}>
              {liste.map((a) => (
                <tr key={a.id} className="cursor-pointer hover:bg-[var(--gpf-surface-alt)]" onClick={() => setOuvert(a.id)}>
                  <td className={tdCls}>
                    <p className="font-medium">{a.nom}</p>
                    <p className="text-[11px] text-[var(--gpf-subtle)]">
                      {[a.type, a.taux_retrocession != null ? `${String(a.taux_retrocession).replace(".", ",")} %` : null, a.convention_signee ? "convention signée" : "sans convention"].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className={tdNum}>{a.nbLeads}</td>
                  <td className={tdNum}>{a.nbSignes}</td>
                  <td className={tdNum}>{pctLabel(a.transformation)}</td>
                  <td className={tdNum}>{eur(a.commissions12, 0)}</td>
                  <td className={tdNum}>{eur(a.aReverser12, 0)}</td>
                  <td className={tdNum} style={{ color: a.resteAPayer > 0 ? "#c98a1f" : undefined }}>
                    {eur(a.resteAPayer)}
                  </td>
                </tr>
              ))}
            </Tableau>
          )}
        </Carte>
      )}
      {nouveau ? (
        <Edition
          titre="Nouvel apporteur"
          initial={{}}
          onClose={() => setNouveau(false)}
          onSave={async (v) => {
            const r = await api("/api/gpf/apporteurs", "POST", v);
            if (!r.ok) return alert("Création impossible.");
            setNouveau(false);
            charger();
          }}
        />
      ) : null}
    </div>
  );
}

function Fiche({ id, onRetour }: { id: string; onRetour: () => void }) {
  const [a, setA] = useState<Apporteur | null>(null);
  const [aRattacher, setARattacher] = useState(0);
  const [edit, setEdit] = useState(false);

  const charger = async () => {
    const r = await api(`/api/gpf/apporteurs/${id}`, "GET");
    if (r.ok) {
      setA(r.data.apporteur);
      setARattacher(r.data.aRattacher);
    }
  };
  useEffect(() => {
    charger();
  }, [id]);

  if (!a) return <SkeletonTiles />;

  const payer = async (m: Mois) => {
    const saisie = prompt(`Montant versé à ${a.nom} pour ${moisLabel(m.mois)} (€) :`, String(m.aReverser).replace(".", ","));
    if (saisie == null) return;
    const montant = Number(saisie.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(montant)) return alert("Montant invalide.");
    await api(`/api/gpf/apporteurs/${id}/paiements`, "POST", { mois: m.mois, montant });
    charger();
  };
  const annulerPaiement = async (m: Mois) => {
    if (!confirm(`Annuler le paiement enregistré pour ${moisLabel(m.mois)} ?`)) return;
    await api(`/api/gpf/apporteurs/${id}/paiements?mois=${m.mois}`, "DELETE");
    charger();
  };
  const rattacher = async () => {
    if (!confirm(`Rattacher ${aRattacher} contact(s) dont la provenance est « ${a.nom} » à cet apporteur ?`)) return;
    const r = await api(`/api/gpf/apporteurs/${id}`, "PATCH", { rattacher: true });
    if (r.ok) alert(`${r.data.rattaches} contact(s) rattaché(s).`);
    charger();
  };
  const supprimer = async () => {
    if (!confirm(`Supprimer l'apporteur ${a.nom} ? Ses contacts restent dans le CRM.`)) return;
    await api(`/api/gpf/apporteurs/${id}`, "DELETE");
    onRetour();
  };

  return (
    <div className="flex flex-col gap-5">
      <button onClick={onRetour} className="text-sm text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)] self-start">
        ← Tous les apporteurs
      </button>
      <PageHeader
        titre={a.nom}
        sousTitre={[a.type, a.contact_nom, a.telephone, a.email].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <button onClick={() => setEdit(true)} className="rounded-full border border-[var(--gpf-border)] text-xs px-4 py-2 text-[var(--gpf-muted)] bg-[var(--gpf-surface)]">
              Modifier
            </button>
            <a href={`/api/gpf/apporteurs/${id}/releve?mois=${new Date().getFullYear()}`} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2">
              Relevé annuel (PDF)
            </a>
          </>
        }
      />
      {aRattacher > 0 ? (
        <div className="rounded-xl px-4 py-3 bg-[var(--gpf-warning-tint)] text-sm text-[var(--gpf-ink)] flex items-center gap-3 flex-wrap">
          <span className="flex-1">
            {aRattacher} contact(s) ont « {a.nom} » comme provenance mais ne sont pas rattachés à cet apporteur.
          </span>
          <BoutonOr onClick={rattacher}>Les rattacher</BoutonOr>
        </div>
      ) : null}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tuile label="Leads apportés" valeur={String(a.nbLeads)} aide={`${a.nbSignes} signé(s)`} />
        <Tuile label="Transformation" valeur={pctLabel(a.transformation)} />
        <Tuile label="Commissions 12 mois" valeur={eur(a.commissions12, 0)} accent="#2f9e6e" />
        <Tuile label="Reste à payer" valeur={eur(a.resteAPayer)} accent={a.resteAPayer > 0 ? "#c98a1f" : undefined} aide={a.taux_retrocession != null ? `Taux ${String(a.taux_retrocession).replace(".", ",")} %` : "Taux selon dossier"} />
      </div>

      <Carte
        titre="Rétrocessions par mois"
        actions={
          <button
            className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]"
            onClick={() => exporterCsv(`releve-${a.nom}.csv`, ["Mois", "Commissions", "À reverser", "Payé", "Payé le"], a.parMois.map((m) => [m.mois, m.commissions, m.aReverser, m.paye, m.payeLe ?? ""]))}
          >
            Exporter (CSV)
          </button>
        }
      >
        <Tableau entetes={["Mois", "Commissions encaissées", "À reverser", "Payé", ""]} alignDroite={[1, 2, 3]}>
          {[...a.parMois].reverse().map((m) => (
            <tr key={m.mois}>
              <td className={tdCls}>{moisLabel(m.mois)}</td>
              <td className={tdNum}>{m.commissions ? eur(m.commissions) : "—"}</td>
              <td className={tdNum}>{m.aReverser ? eur(m.aReverser) : "—"}</td>
              <td className={tdNum}>{m.paye ? `${eur(m.paye)} le ${frDate(m.payeLe)}` : "—"}</td>
              <td className={`${tdCls} text-right text-xs`}>
                <div className="flex gap-3 justify-end">
                  {m.aReverser || m.paye ? (
                    <a href={`/api/gpf/apporteurs/${id}/releve?mois=${m.mois}`} className="text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
                      Relevé
                    </a>
                  ) : null}
                  {m.paye ? (
                    <button className="text-[var(--gpf-subtle)]" onClick={() => annulerPaiement(m)}>
                      Annuler
                    </button>
                  ) : m.aReverser ? (
                    <button className="text-[#2f9e6e]" onClick={() => payer(m)}>
                      Marquer payé
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </Tableau>
      </Carte>

      <Carte titre={`Leads apportés (${a.leads?.length ?? 0})`}>
        {!a.leads?.length ? (
          <Vide>Aucun contact rattaché. Choisissez l&apos;apporteur dans la fiche du contact (Coordonnées).</Vide>
        ) : (
          <Tableau entetes={["Contact", "Arrivé le", "Produits", "Étape", ""]}>
            {a.leads.map((l) => (
              <tr key={l.id}>
                <td className={tdCls}>
                  <Link href={`/gpf/contacts/${l.id}`} className="hover:underline">
                    {l.nom}
                  </Link>
                </td>
                <td className={tdCls}>{frDate(l.created_at)}</td>
                <td className={tdCls}>{l.produits.map((p) => GPF_PRODUIT_LABEL[p as GpfProduit] ?? p).join(", ") || "—"}</td>
                <td className={tdCls}>{l.statuts.map((s) => GPF_STATUT_LABEL[s as GpfStatut] ?? s).join(", ") || "—"}</td>
                <td className={tdCls}>{l.signe ? <span className="text-[11px] text-[#2f9e6e]">Signé</span> : null}</td>
              </tr>
            ))}
          </Tableau>
        )}
      </Carte>

      {a.notes ? (
        <Carte titre="Notes">
          <p className="px-4 py-3 text-sm text-[var(--gpf-ink)] whitespace-pre-wrap">{a.notes}</p>
        </Carte>
      ) : null}

      <button onClick={supprimer} className="text-xs text-[var(--gpf-subtle)] hover:text-[#b3463f] self-start">
        Supprimer cet apporteur
      </button>

      {edit ? (
        <Edition
          titre={`Modifier ${a.nom}`}
          initial={a}
          onClose={() => setEdit(false)}
          onSave={async (v) => {
            await api(`/api/gpf/apporteurs/${id}`, "PATCH", v);
            setEdit(false);
            charger();
          }}
        />
      ) : null}
    </div>
  );
}

function Edition({ titre, initial, onClose, onSave }: { titre: string; initial: Partial<Apporteur>; onClose: () => void; onSave: (v: Record<string, unknown>) => void }) {
  const [v, setV] = useState({
    nom: initial.nom ?? "",
    type: initial.type ?? "",
    contact_nom: initial.contact_nom ?? "",
    email: initial.email ?? "",
    telephone: initial.telephone ?? "",
    taux_retrocession: initial.taux_retrocession != null ? String(initial.taux_retrocession) : "",
    convention_signee: initial.convention_signee ?? false,
    date_convention: initial.date_convention ?? "",
    notes: initial.notes ?? ""
  });
  return (
    <Panneau titre={titre} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Nom">
          <input className={inputCls} value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} />
        </Field>
        <Field label="Type (agence immobilière, courtier en crédit…)">
          <input className={inputCls} value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })} />
        </Field>
        <Field label="Contact">
          <input className={inputCls} value={v.contact_nom} onChange={(e) => setV({ ...v, contact_nom: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone">
            <input className={inputCls} value={v.telephone} onChange={(e) => setV({ ...v, telephone: e.target.value })} />
          </Field>
          <Field label="E-mail">
            <input className={inputCls} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
          </Field>
        </div>
        <Field label="Taux de rétrocession (% de la commission)">
          <input className={inputCls} inputMode="decimal" value={v.taux_retrocession} onChange={(e) => setV({ ...v, taux_retrocession: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-[var(--gpf-ink)]">
          <input type="checkbox" checked={v.convention_signee} onChange={(e) => setV({ ...v, convention_signee: e.target.checked })} />
          Convention d&apos;apport signée
        </label>
        {v.convention_signee ? (
          <Field label="Date de la convention">
            <input type="date" className={inputCls} value={v.date_convention} onChange={(e) => setV({ ...v, date_convention: e.target.value })} />
          </Field>
        ) : null}
        <Field label="Notes">
          <textarea className={inputCls} rows={3} value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} />
        </Field>
        <BoutonOr
          disabled={!v.nom.trim()}
          onClick={() => onSave({ ...v, taux_retrocession: v.taux_retrocession === "" ? null : Number(v.taux_retrocession.replace(",", ".")), date_convention: v.date_convention || null })}
        >
          Enregistrer
        </BoutonOr>
      </div>
    </Panneau>
  );
}
