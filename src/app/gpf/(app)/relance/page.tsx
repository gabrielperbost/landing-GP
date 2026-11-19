"use client";
import { useEffect, useState } from "react";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { Vide } from "@/components/gpf/fiche/shared";
import { exporterCsv, Onglets, Tableau, tdCls, tdNum, Tuile } from "@/components/gpf/commissions/commun";

type Clic = { mail: number; type: "calendly" | "replay" | "temoignage" | "desinscription" | "autre"; date: string };
type Contact = { email: string; nom: string; telephone: string; recus: number[]; ouverts: number[]; clics: Clic[]; echec: string | null; desinscrit: boolean; derniereActivite: string | null; rendezVous: string | null; apresMail: number | null; raison?: string };
type ParMail = { mail: number; envoyes: number; delivres: number; ouverts: number; clicsCalendly: number; clicsReplay: number; clicsTemoignages: number; desinscriptions: number; echecs: number };
type Campagne = { campagne: "public" | "avocats"; total: { destinataires: number; rendezVous: number; cliqueurs: number; desinscrits: number; echecs: number }; parMail: ParMail[]; rendezVous: Contact[]; aRappeler: Contact[]; contacts: Contact[] };
type Donnees = { calendrier: Record<string, number>; campagnes: Campagne[] };

const LIBELLE_CLIC: Record<Clic["type"], string> = { calendly: "Calendly", replay: "Replay", temoignage: "Témoignage", desinscription: "Désinscription", autre: "Autre lien" };
const date = (d: string | null) => (d ? new Date(d).toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");
const clics = (k: Contact) => (k.clics.length ? k.clics.map((c) => `${LIBELLE_CLIC[c.type]} (e-mail ${c.mail})`).join(", ") : "—");

export default function RelancePage() {
  const [data, setData] = useState<Donnees | null>(null);
  const [erreur, setErreur] = useState(false);
  const [onglet, setOnglet] = useState<"public" | "avocats">("public");
  const [vue, setVue] = useState<"rappeler" | "rdv" | "tous">("rappeler");

  useEffect(() => {
    fetch("/api/gpf/webinaire/relance?suivi=oui", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) return window.location.assign("/gpf/login");
        const j = await r.json();
        if (!j.ok) throw new Error("ko");
        setData(j);
      })
      .catch(() => setErreur(true));
  }, []);

  const c = data?.campagnes.find((x) => x.campagne === onglet);
  const prochains = data ? Object.entries(data.calendrier).filter(([d]) => d >= new Date().toISOString().slice(0, 10)) : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Relance webinaires" sousTitre="Campagne « prise de rendez-vous » : 8 e-mails, mardi et jeudi à 12h, du 19 novembre au 15 décembre" />
      {erreur ? (
        <Carte>
          <Vide>Chargement impossible pour le moment. Rechargez la page dans un instant.</Vide>
        </Carte>
      ) : !data || !c ? (
        <SkeletonLines />
      ) : (
        <>
          <Onglets
            valeur={onglet}
            onChange={setOnglet}
            items={[
              ["public", "Grand public", data.campagnes.find((x) => x.campagne === "public")?.total.rendezVous],
              ["avocats", "Avocats", data.campagnes.find((x) => x.campagne === "avocats")?.total.rendezVous]
            ]}
          />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Tuile label="Rendez-vous pris" valeur={String(c.total.rendezVous)} accent="#2f9e6e" aide={`${pct(c.total.rendezVous, c.total.destinataires)} des destinataires`} />
            <Tuile label="Destinataires" valeur={String(c.total.destinataires)} />
            <Tuile label="Ont cliqué" valeur={String(c.total.cliqueurs)} aide="Calendly, replay ou témoignage" />
            <Tuile label="Désinscrits" valeur={String(c.total.desinscrits)} />
            <Tuile label="Non distribués" valeur={String(c.total.echecs)} aide="Adresse invalide, refus, spam" />
          </div>

          <Carte titre="E-mail par e-mail">
            {c.parMail.length ? (
              <Tableau entetes={["E-mail", "Envoyés", "Distribués", "Ouverts*", "Clic Calendly", "Clic replay", "Clic témoignage", "Désinscriptions", "Échecs"]} alignDroite={[1, 2, 3, 4, 5, 6, 7, 8]}>
                {c.parMail.map((m) => (
                  <tr key={m.mail}>
                    <td className={tdCls}>
                      {m.mail}/8 · {Object.entries(data.calendrier).find(([, n]) => n === m.mail)?.[0].split("-").reverse().slice(0, 2).join("/")}
                    </td>
                    <td className={tdNum}>{m.envoyes}</td>
                    <td className={tdNum}>{m.delivres}</td>
                    <td className={tdNum}>
                      {m.ouverts} <span className="text-[var(--gpf-muted)]">({pct(m.ouverts, m.delivres)})</span>
                    </td>
                    <td className={tdNum}>
                      <strong>{m.clicsCalendly}</strong>
                    </td>
                    <td className={tdNum}>{m.clicsReplay}</td>
                    <td className={tdNum}>{m.clicsTemoignages}</td>
                    <td className={tdNum}>{m.desinscriptions}</td>
                    <td className={tdNum}>{m.echecs}</td>
                  </tr>
                ))}
              </Tableau>
            ) : (
              <Vide>Aucun e-mail envoyé pour le moment.</Vide>
            )}
            <p className="text-[11px] text-[var(--gpf-subtle)] px-4 py-2">
              * Ouvertures surestimées : Apple Mail ouvre les e-mails automatiquement. Les clics et les rendez-vous sont fiables.
              {prochains.length ? ` Prochain envoi : e-mail ${prochains[0][1]} le ${prochains[0][0].split("-").reverse().join("/")} à 12h.` : ""}
            </p>
          </Carte>

          <Carte
            titre="Contacts"
            actions={
              <button
                className="text-xs underline text-[var(--gpf-muted)]"
                onClick={() =>
                  exporterCsv(
                    `relance-${onglet}.csv`,
                    ["Nom", "E-mail", "Téléphone", "E-mails reçus", "E-mails ouverts", "Clics", "Rendez-vous", "Désinscrit", "Échec"],
                    c.contacts.map((k) => [k.nom, k.email, k.telephone, k.recus.join(" "), k.ouverts.join(" "), clics(k), k.rendezVous ? date(k.rendezVous) : "", k.desinscrit ? "oui" : "", k.echec ?? ""])
                  )
                }
              >
                Exporter en CSV
              </button>
            }
          >
            <Onglets
              valeur={vue}
              onChange={setVue}
              items={[
                ["rappeler", "À rappeler", c.aRappeler.length],
                ["rdv", "Rendez-vous pris", c.rendezVous.length],
                ["tous", "Tous", c.contacts.length]
              ]}
            />
            {vue === "rappeler" ? (
              c.aRappeler.length ? (
                <Tableau entetes={["Contact", "Téléphone", "Pourquoi", "Clics", "Ouverts", "Dernière activité"]}>
                  {c.aRappeler.map((k) => (
                    <tr key={k.email}>
                      <td className={tdCls}>
                        {k.nom}
                        <div className="text-[11px] text-[var(--gpf-muted)]">{k.email}</div>
                      </td>
                      <td className={tdCls}>{k.telephone ? <a href={`tel:${k.telephone.replace(/\s/g, "")}`}>{k.telephone}</a> : "—"}</td>
                      <td className={tdCls}>{k.raison}</td>
                      <td className={tdCls}>{clics(k)}</td>
                      <td className={tdCls}>{k.ouverts.length ? k.ouverts.join(", ") : "—"}</td>
                      <td className={tdCls}>{date(k.derniereActivite)}</td>
                    </tr>
                  ))}
                </Tableau>
              ) : (
                <Vide>Personne pour l&apos;instant : la liste se remplit dès que des destinataires cliquent ou ouvrent plusieurs e-mails.</Vide>
              )
            ) : vue === "rdv" ? (
              c.rendezVous.length ? (
                <Tableau entetes={["Contact", "Téléphone", "Réservé le", "Après l'e-mail", "Clics"]}>
                  {c.rendezVous.map((k) => (
                    <tr key={k.email}>
                      <td className={tdCls}>
                        {k.nom}
                        <div className="text-[11px] text-[var(--gpf-muted)]">{k.email}</div>
                      </td>
                      <td className={tdCls}>{k.telephone || "—"}</td>
                      <td className={tdCls}>{date(k.rendezVous)}</td>
                      <td className={tdCls}>{k.apresMail ? `${k.apresMail}/8` : "—"}</td>
                      <td className={tdCls}>{clics(k)}</td>
                    </tr>
                  ))}
                </Tableau>
              ) : (
                <Vide>Aucun rendez-vous pris depuis le début de la relance pour le moment.</Vide>
              )
            ) : (
              <Tableau entetes={["Contact", "Reçus", "Ouverts", "Clics", "Statut"]}>
                {c.contacts.map((k) => (
                  <tr key={k.email}>
                    <td className={tdCls}>
                      {k.nom}
                      <div className="text-[11px] text-[var(--gpf-muted)]">{k.email}</div>
                    </td>
                    <td className={tdCls}>{k.recus.join(", ") || "—"}</td>
                    <td className={tdCls}>{k.ouverts.join(", ") || "—"}</td>
                    <td className={tdCls}>{clics(k)}</td>
                    <td className={tdCls}>{k.rendezVous ? "✅ Rendez-vous" : k.echec ? "Non distribué" : k.desinscrit ? "Désinscrit" : "En cours"}</td>
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
