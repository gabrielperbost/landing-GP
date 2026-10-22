"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { api, BoutonOr, Field, inputCls, Panneau, Vide, frDateHeure } from "@/components/gpf/fiche/shared";
import { Onglets, Tableau, tdCls, tdNum } from "@/components/gpf/commissions/commun";
import { Pastille } from "@/components/gpf/commissions/Bordereaux";
import { GPF_PRODUIT_LABEL, GPF_PRODUITS, GPF_PROVENANCES, GPF_SCORE_LABEL, GPF_STATUT_LABEL, GPF_STATUTS } from "@/lib/gpf/types";

type Filtres = { type?: string; produit?: string; sansProduit?: string; statut?: string; source?: string; score?: string; creeDepuisJours?: number; inactifDepuisJours?: number; avecEmail?: boolean };
type Campagne = { id: string; nom: string; filtres: Filtres; sujet: string; corps: string; statut: "brouillon" | "en_cours" | "envoyee" | "annulee"; nb_destinataires: number; nb_envoyes: number; nb_erreurs: number; created_at: string; lancee_at: string | null };
type Etape = { jour: number; sujet: string; corps: string };
type Sequence = { id: string; nom: string; declencheur: "nouveau_lead" | "nrp" | "devis_envoye"; actif: boolean; etapes: Etape[]; created_at: string; stats: { envoyes: number; erreurs: number } };
type Onglet = "segments" | "campagnes" | "sequences";

const STATUT: Record<Campagne["statut"], [string, string]> = { brouillon: ["Brouillon", "#8a8f98"], en_cours: ["Envoi en cours", "#c98a1f"], envoyee: ["Envoyée", "#2f9e6e"], annulee: ["Annulée", "#b3463f"] };
const DECLENCHEUR: Record<Sequence["declencheur"], string> = { nouveau_lead: "Nouveau lead sans réponse", nrp: "Après un appel sans réponse (NRP)", devis_envoye: "Après l'envoi d'un devis" };

export default function CampagnesPage() {
  const [onglet, setOnglet] = useState<Onglet>("segments");
  const [data, setData] = useState<{ disponible: boolean; campagnes: Campagne[]; sequences: Sequence[] } | null>(null);
  const [nouvelle, setNouvelle] = useState<Filtres | null>(null);

  const charger = () => api("/api/gpf/campagnes", "GET").then((r) => setData(r.ok ? r.data : { disponible: false, campagnes: [], sequences: [] }));
  useEffect(() => {
    charger();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Campagnes" sousTitre="Segments, e-mails groupés et séquences de relance automatiques (via votre messagerie, sans service payant)" />
      {!data ? (
        <SkeletonLines />
      ) : !data.disponible ? (
        <Carte>
          <Vide>Les campagnes seront disponibles après l&apos;application des mises à jour de la base (Paramètres → Base de données).</Vide>
        </Carte>
      ) : (
        <>
          <Onglets
            valeur={onglet}
            onChange={setOnglet}
            items={[
              ["segments", "Segments"],
              ["campagnes", "Campagnes", data.campagnes.length],
              ["sequences", "Séquences", data.sequences.length]
            ]}
          />
          {onglet === "segments" ? <Segments onCampagne={(f) => setNouvelle(f)} /> : onglet === "campagnes" ? <Campagnes liste={data.campagnes} onChange={charger} /> : <Sequences liste={data.sequences} onChange={charger} />}
        </>
      )}
      {nouvelle ? (
        <EditionCampagne
          filtres={nouvelle}
          onClose={() => setNouvelle(null)}
          onFini={() => {
            setNouvelle(null);
            setOnglet("campagnes");
            charger();
          }}
        />
      ) : null}
    </div>
  );
}

function Segments({ onCampagne }: { onCampagne: (f: Filtres) => void }) {
  const [f, setF] = useState<Filtres>({ type: "tous", avecEmail: true });
  const [res, setRes] = useState<{ total: number; joignables: number; desabonnes: number; apercu: { id: string; nom: string; email: string | null }[] } | null>(null);
  const [enregistres, setEnregistres] = useState<{ id: string; nom: string; filtres: Filtres }[]>([]);

  useEffect(() => {
    api("/api/gpf/segments", "GET").then((r) => r.ok && setEnregistres(r.data.segments));
  }, []);
  useEffect(() => {
    setRes(null);
    const t = setTimeout(() => api(`/api/gpf/segments?filtres=${encodeURIComponent(JSON.stringify(f))}`, "GET").then((r) => r.ok && setRes(r.data)), 300);
    return () => clearTimeout(t);
  }, [f]);

  const enregistrer = async () => {
    const nom = prompt("Nom du segment :");
    if (!nom?.trim()) return;
    const r = await api("/api/gpf/segments", "POST", { nom, filtres: f });
    if (r.ok) setEnregistres([r.data.segment, ...enregistres]);
  };
  const supprimer = async (id: string) => {
    await api(`/api/gpf/segments?id=${id}`, "DELETE");
    setEnregistres(enregistres.filter((s) => s.id !== id));
  };
  const sel = (k: keyof Filtres, v: string) => setF({ ...f, [k]: v || undefined });
  const num = (k: keyof Filtres, v: string) => setF({ ...f, [k]: v ? Number(v) : undefined });

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-4">
      <Carte titre="Critères">
        <div className="p-4 flex flex-col gap-3">
          <Field label="Contacts">
            <select className={inputCls} value={f.type ?? "tous"} onChange={(e) => sel("type", e.target.value)}>
              <option value="tous">Tous</option>
              <option value="leads">Leads (sans contrat)</option>
              <option value="clients">Clients (avec contrat)</option>
            </select>
          </Field>
          <Field label="A une affaire ou un contrat">
            <select className={inputCls} value={f.produit ?? ""} onChange={(e) => sel("produit", e.target.value)}>
              <option value="">Peu importe</option>
              {GPF_PRODUITS.map((p) => (
                <option key={p} value={p}>
                  {GPF_PRODUIT_LABEL[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="N'a pas encore (vente croisée)">
            <select className={inputCls} value={f.sansProduit ?? ""} onChange={(e) => sel("sansProduit", e.target.value)}>
              <option value="">Peu importe</option>
              {GPF_PRODUITS.map((p) => (
                <option key={p} value={p}>
                  {GPF_PRODUIT_LABEL[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Étape d'une affaire">
            <select className={inputCls} value={f.statut ?? ""} onChange={(e) => sel("statut", e.target.value)}>
              <option value="">Peu importe</option>
              {GPF_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {GPF_STATUT_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <select className={inputCls} value={f.source ?? ""} onChange={(e) => sel("source", e.target.value)}>
                <option value="">Toutes</option>
                {GPF_PROVENANCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Score">
              <select className={inputCls} value={f.score ?? ""} onChange={(e) => sel("score", e.target.value)}>
                <option value="">Tous</option>
                {Object.entries(GPF_SCORE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Arrivés depuis (jours)">
              <input className={inputCls} inputMode="numeric" value={f.creeDepuisJours ?? ""} onChange={(e) => num("creeDepuisJours", e.target.value)} />
            </Field>
            <Field label="Sans contact depuis (jours)">
              <input className={inputCls} inputMode="numeric" value={f.inactifDepuisJours ?? ""} onChange={(e) => num("inactifDepuisJours", e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--gpf-ink)]">
            <input type="checkbox" checked={Boolean(f.avecEmail)} onChange={(e) => setF({ ...f, avecEmail: e.target.checked || undefined })} />
            Avec une adresse e-mail
          </label>
          <div className="flex gap-2 flex-wrap">
            <button onClick={enregistrer} className="rounded-full border border-[var(--gpf-border)] text-xs px-4 py-2 text-[var(--gpf-muted)]">
              Enregistrer le segment
            </button>
            <BoutonOr onClick={() => onCampagne(f)} disabled={!res?.joignables}>
              Créer une campagne
            </BoutonOr>
          </div>
          {enregistres.length ? (
            <div className="border-t border-[var(--gpf-border-soft)] pt-3 flex flex-col gap-1.5">
              <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)]">Segments enregistrés</p>
              {enregistres.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <button onClick={() => setF(s.filtres)} className="text-left flex-1 text-[var(--gpf-ink)] hover:underline truncate">
                    {s.nom}
                  </button>
                  <button onClick={() => supprimer(s.id)} className="text-[11px] text-[var(--gpf-subtle)]">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Carte>
      <Carte titre={res ? `${res.total} contact(s) · ${res.joignables} joignable(s) par e-mail${res.desabonnes ? ` · ${res.desabonnes} désabonné(s)` : ""}` : "Calcul…"}>
        {!res ? (
          <Vide>Calcul du segment…</Vide>
        ) : res.apercu.length === 0 ? (
          <Vide>Aucun contact ne correspond.</Vide>
        ) : (
          <Tableau entetes={["Contact", "E-mail"]}>
            {res.apercu.map((m) => (
              <tr key={m.id}>
                <td className={tdCls}>
                  <Link href={`/gpf/contacts/${m.id}`} className="hover:underline">
                    {m.nom}
                  </Link>
                </td>
                <td className={tdCls}>{m.email ?? "—"}</td>
              </tr>
            ))}
          </Tableau>
        )}
        {res && res.total > res.apercu.length ? <p className="px-4 py-2 text-[11px] text-[var(--gpf-subtle)]">Aperçu des 25 premiers.</p> : null}
      </Carte>
    </div>
  );
}

function EditionCampagne({ filtres, campagne, onClose, onFini }: { filtres: Filtres; campagne?: Campagne; onClose: () => void; onFini: () => void }) {
  const [v, setV] = useState({ nom: campagne?.nom ?? "", sujet: campagne?.sujet ?? "", corps: campagne?.corps ?? "Bonjour {prenom},\n\n\n\nBien à vous,\nGabriel – GP Finances" });
  const [occupe, setOccupe] = useState(false);
  const enregistrer = async () => {
    setOccupe(true);
    const r = campagne ? await api(`/api/gpf/campagnes/${campagne.id}`, "PATCH", { action: "modifier", ...v }) : await api("/api/gpf/campagnes", "POST", { ...v, filtres });
    setOccupe(false);
    if (!r.ok) return alert("Enregistrement impossible.");
    onFini();
  };
  return (
    <Panneau titre={campagne ? "Modifier la campagne" : "Nouvelle campagne"} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Nom interne">
          <input className={inputCls} value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} placeholder="Ex. Relance mutuelle octobre" />
        </Field>
        <Field label="Objet de l'e-mail">
          <input className={inputCls} value={v.sujet} onChange={(e) => setV({ ...v, sujet: e.target.value })} />
        </Field>
        <Field label="Message ({prenom} et {nom} sont remplacés)">
          <textarea className={inputCls} rows={12} value={v.corps} onChange={(e) => setV({ ...v, corps: e.target.value })} />
        </Field>
        <p className="text-[11px] text-[var(--gpf-subtle)]">Un lien de désabonnement est ajouté automatiquement en bas de chaque e-mail. La campagne reste en brouillon : vous pourrez l&apos;envoyer en test avant de la lancer.</p>
        <BoutonOr onClick={enregistrer} disabled={occupe || !v.nom.trim() || !v.sujet.trim() || !v.corps.trim()}>
          Enregistrer le brouillon
        </BoutonOr>
      </div>
    </Panneau>
  );
}

function Campagnes({ liste, onChange }: { liste: Campagne[]; onChange: () => void }) {
  const [edit, setEdit] = useState<Campagne | null>(null);
  const [envoi, setEnvoi] = useState<string | null>(null);

  const action = async (c: Campagne, a: "test" | "lancer" | "annuler") => {
    if (a === "lancer" && !confirm(`Lancer l'envoi de « ${c.nom} » ? Les e-mails partiront depuis votre messagerie, par lots.`)) return;
    if (a === "annuler" && !confirm("Arrêter cette campagne ? Les e-mails déjà envoyés le restent.")) return;
    const r = await api(`/api/gpf/campagnes/${c.id}`, "PATCH", { action: a });
    if (!r.ok) return alert(r.data?.error === "aucun_destinataire" ? "Aucun destinataire joignable dans ce segment." : "Action impossible.");
    if (a === "test") alert("E-mail de test envoyé à l'adresse du cabinet.");
    if (a === "lancer") await envoyer(c.id);
    onChange();
  };
  // Envoi par lots de 20 tant qu'il en reste (le passage quotidien termine si la page est fermée).
  const envoyer = async (id: string) => {
    setEnvoi(id);
    for (let i = 0; i < 100; i++) {
      const r = await api(`/api/gpf/campagnes/${id}`, "PATCH", { action: "envoyer" });
      if (!r.ok || !r.data.restants) break;
      onChange();
    }
    setEnvoi(null);
    onChange();
  };
  const supprimer = async (c: Campagne) => {
    if (!confirm("Supprimer ce brouillon ?")) return;
    await api(`/api/gpf/campagnes/${c.id}`, "DELETE");
    onChange();
  };

  return (
    <Carte>
      {liste.length === 0 ? (
        <Vide>Aucune campagne. Créez un segment puis « Créer une campagne ».</Vide>
      ) : (
        <Tableau entetes={["Campagne", "Créée le", "Destinataires", "Envoyés", "Erreurs", "Statut", ""]} alignDroite={[2, 3, 4]}>
          {liste.map((c) => (
            <tr key={c.id}>
              <td className={tdCls}>
                <p className="font-medium">{c.nom}</p>
                <p className="text-[11px] text-[var(--gpf-subtle)] max-w-[260px] truncate">{c.sujet}</p>
              </td>
              <td className={tdCls}>{frDateHeure(c.created_at)}</td>
              <td className={tdNum}>{c.nb_destinataires || "—"}</td>
              <td className={tdNum}>{c.nb_envoyes || "—"}</td>
              <td className={tdNum}>{c.nb_erreurs || "—"}</td>
              <td className={tdCls}>
                <Pastille texte={envoi === c.id ? "Envoi…" : STATUT[c.statut][0]} couleur={STATUT[c.statut][1]} />
              </td>
              <td className={`${tdCls} text-right text-xs`}>
                <div className="flex gap-3 justify-end">
                  {c.statut === "brouillon" ? (
                    <>
                      <button className="text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]" onClick={() => setEdit(c)}>
                        Modifier
                      </button>
                      <button className="text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]" onClick={() => action(c, "test")}>
                        Envoyer un test
                      </button>
                      <button className="text-[#2f9e6e] font-medium" onClick={() => action(c, "lancer")}>
                        Lancer
                      </button>
                      <button className="text-[var(--gpf-subtle)]" onClick={() => supprimer(c)}>
                        Supprimer
                      </button>
                    </>
                  ) : c.statut === "en_cours" ? (
                    <>
                      {envoi !== c.id ? (
                        <button className="text-[var(--gpf-muted)]" onClick={() => envoyer(c.id)}>
                          Reprendre l&apos;envoi
                        </button>
                      ) : null}
                      <button className="text-[#b3463f]" onClick={() => action(c, "annuler")}>
                        Arrêter
                      </button>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </Tableau>
      )}
      {edit ? (
        <EditionCampagne
          filtres={edit.filtres}
          campagne={edit}
          onClose={() => setEdit(null)}
          onFini={() => {
            setEdit(null);
            onChange();
          }}
        />
      ) : null}
    </Carte>
  );
}

function Sequences({ liste, onChange }: { liste: Sequence[]; onChange: () => void }) {
  const [edit, setEdit] = useState<Partial<Sequence> | null>(null);
  const basculer = async (s: Sequence) => {
    if (!s.actif && !confirm(`Activer « ${s.nom} » ? Les e-mails partiront automatiquement chaque matin aux contacts arrivés à partir de maintenant (jamais aux anciens).`)) return;
    await api("/api/gpf/sequences", "PATCH", { id: s.id, actif: !s.actif });
    onChange();
  };
  const enregistrer = async () => {
    if (!edit) return;
    const r = await api("/api/gpf/sequences", "POST", edit);
    if (!r.ok) return alert("Enregistrement impossible.");
    setEdit(null);
    onChange();
  };
  const etapes = edit?.etapes ?? [];
  const majEtape = (i: number, e: Partial<Etape>) => setEdit({ ...edit, etapes: etapes.map((x, j) => (j === i ? { ...x, ...e } : x)) });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <p className="text-sm text-[var(--gpf-muted)]">Les séquences s&apos;arrêtent d&apos;elles-mêmes dès qu&apos;un appel aboutit, qu&apos;un RDV est pris ou que l&apos;affaire avance. Pas de SMS (service payant).</p>
        <BoutonOr onClick={() => setEdit({ nom: "", declencheur: "nouveau_lead", etapes: [{ jour: 0, sujet: "", corps: "Bonjour {prenom},\n\n\nGabriel – GP Finances" }] })}>Nouvelle séquence</BoutonOr>
      </div>
      <Carte>
        {liste.length === 0 ? (
          <Vide>Aucune séquence.</Vide>
        ) : (
          <Tableau entetes={["Séquence", "Déclencheur", "Étapes", "E-mails envoyés", "État", ""]} alignDroite={[2, 3]}>
            {liste.map((s) => (
              <tr key={s.id}>
                <td className={tdCls}>{s.nom}</td>
                <td className={tdCls}>{DECLENCHEUR[s.declencheur]}</td>
                <td className={tdNum}>{s.etapes.length} (J{s.etapes.map((e) => e.jour).join(", J")})</td>
                <td className={tdNum}>{s.stats.envoyes}{s.stats.erreurs ? ` (${s.stats.erreurs} erreur(s))` : ""}</td>
                <td className={tdCls}>
                  <Pastille texte={s.actif ? "Active" : "Désactivée"} couleur={s.actif ? "#2f9e6e" : "#8a8f98"} />
                </td>
                <td className={`${tdCls} text-right text-xs`}>
                  <div className="flex gap-3 justify-end">
                    <button className="text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]" onClick={() => setEdit(s)}>
                      Modifier
                    </button>
                    <button className={s.actif ? "text-[#b3463f]" : "text-[#2f9e6e] font-medium"} onClick={() => basculer(s)}>
                      {s.actif ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Tableau>
        )}
      </Carte>
      {edit ? (
        <Panneau titre={edit.id ? "Modifier la séquence" : "Nouvelle séquence"} onClose={() => setEdit(null)}>
          <div className="flex flex-col gap-3">
            <Field label="Nom">
              <input className={inputCls} value={edit.nom ?? ""} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} />
            </Field>
            <Field label="Déclencheur">
              <select className={inputCls} value={edit.declencheur} onChange={(e) => setEdit({ ...edit, declencheur: e.target.value as Sequence["declencheur"] })}>
                {Object.entries(DECLENCHEUR).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            {etapes.map((e, i) => (
              <div key={i} className="rounded-lg border border-[var(--gpf-border)] p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--gpf-muted)]">Jour</span>
                  <input className="rounded-lg border px-2 py-1 text-sm w-16" inputMode="numeric" value={e.jour} onChange={(ev) => majEtape(i, { jour: Number(ev.target.value) || 0 })} />
                  <button className="ml-auto text-[11px] text-[var(--gpf-subtle)]" onClick={() => setEdit({ ...edit, etapes: etapes.filter((_, j) => j !== i) })}>
                    Retirer
                  </button>
                </div>
                <input className={inputCls} placeholder="Objet" value={e.sujet} onChange={(ev) => majEtape(i, { sujet: ev.target.value })} />
                <textarea className={inputCls} rows={6} value={e.corps} onChange={(ev) => majEtape(i, { corps: ev.target.value })} />
              </div>
            ))}
            <button className="text-xs text-[var(--gpf-muted)] self-start" onClick={() => setEdit({ ...edit, etapes: [...etapes, { jour: (etapes[etapes.length - 1]?.jour ?? 0) + 3, sujet: "", corps: "Bonjour {prenom},\n\n\nGabriel – GP Finances" }] })}>
              + Ajouter une étape
            </button>
            <BoutonOr onClick={enregistrer} disabled={!edit.nom?.trim() || !etapes.length}>
              Enregistrer
            </BoutonOr>
          </div>
        </Panneau>
      ) : null}
    </div>
  );
}
