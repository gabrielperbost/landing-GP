"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Carte } from "@/components/gpf/PageHeader";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { api, Vide, frDateHeure } from "@/components/gpf/fiche/shared";
import { Tuile } from "@/components/gpf/commissions/commun";

type Conversation = { id: string; client_id: string | null; titre: string | null; updated_at: string };
type Etat = { iaDisponible: boolean; modele: string; conversations: Conversation[]; consommation: { entree: number; sortie: number } };

// Tarif indicatif du modèle économique (Haiku) en dollars par million de jetons.
const PRIX_ENTREE = 1;
const PRIX_SORTIE = 5;

export default function AssistantPage() {
  const [etat, setEtat] = useState<Etat | null>(null);

  const charger = () => api("/api/gpf/assistant/conversations", "GET").then((r) => r.ok && setEtat(r.data));
  useEffect(() => {
    charger();
  }, []);

  const supprimer = async (id: string) => {
    if (!confirm("Supprimer cette conversation ?")) return;
    await api(`/api/gpf/assistant/conversations?id=${id}`, "DELETE");
    charger();
  };

  const cout = etat ? (etat.consommation.entree * PRIX_ENTREE + etat.consommation.sortie * PRIX_SORTIE) / 1_000_000 : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Assistant IA" sousTitre="Ouvrez-le depuis n'importe quelle page avec le bouton « Demander à l'assistant »" />
      {!etat ? (
        <SkeletonLines />
      ) : (
        <>
          {!etat.iaDisponible ? (
            <div className="rounded-xl px-4 py-3 bg-[var(--gpf-warning-tint)] text-sm text-[var(--gpf-ink)]">
              L&apos;assistant n&apos;est pas encore activé : il faut une clé d&apos;API Anthropic (console.anthropic.com → API Keys), à enregistrer sur Vercel sous le nom ANTHROPIC_API_KEY. Tout le reste est prêt.
            </div>
          ) : null}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tuile label="État" valeur={etat.iaDisponible ? "Activé" : "Clé manquante"} accent={etat.iaDisponible ? "#2f9e6e" : "#c98a1f"} />
            <Tuile label="Modèle" valeur="Économique" aide={etat.modele} />
            <Tuile label="Jetons ce mois-ci" valeur={(etat.consommation.entree + etat.consommation.sortie).toLocaleString("fr-FR")} />
            <Tuile label="Coût estimé ce mois-ci" valeur={`${cout.toLocaleString("fr-FR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} $`} aide="Indicatif, hors lecture de documents" />
          </div>
          <Carte titre="Ce que fait l'assistant">
            <ul className="px-5 py-4 text-sm text-[var(--gpf-ink)] list-disc flex flex-col gap-1.5">
              <li>Répond à vos questions sur vos contacts, tâches, contrats, commissions et conformité, en citant ses sources (lecture seule).</li>
              <li>Prépare vos rendez-vous, rédige vos e-mails et SMS de relance prêts à copier.</li>
              <li>Lit une offre de prêt (onglet Projet) ou un avis d&apos;imposition (onglet Fiscalité) et propose les valeurs champ par champ.</li>
              <li>Analyse la transcription d&apos;un rendez-vous Zoom (.vtt ou .txt) : compte rendu, prochaines étapes, informations de la fiche.</li>
              <li>Ne modifie jamais rien sans votre clic, et ne reçoit ni donnée de santé ni pièce d&apos;identité.</li>
            </ul>
          </Carte>
          <Carte titre="Conversations récentes">
            {etat.conversations.length === 0 ? (
              <Vide>Aucune conversation pour l&apos;instant.</Vide>
            ) : (
              <div className="flex flex-col divide-y divide-[var(--gpf-border-soft)]">
                {etat.conversations.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--gpf-ink)] truncate">{c.titre ?? "Conversation"}</p>
                      <p className="text-[11px] text-[var(--gpf-subtle)]">{frDateHeure(c.updated_at)}</p>
                    </div>
                    {c.client_id ? (
                      <Link href={`/gpf/contacts/${c.client_id}`} className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
                        Ouvrir la fiche
                      </Link>
                    ) : null}
                    <button onClick={() => supprimer(c.id)} className="text-xs text-[var(--gpf-subtle)] hover:text-[#b3463f]">
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Carte>
        </>
      )}
    </div>
  );
}
