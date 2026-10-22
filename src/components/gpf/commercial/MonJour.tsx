"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GPF_PRODUIT_LABEL, GPF_STATUT_LABEL, GPF_TASK_CATEGORIE_LABEL, formatNom, type GpfProduit, type GpfStatut, type GpfTaskCategorie } from "@/lib/gpf/types";
import { joursDepuis } from "@/lib/gpf/pipeline";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { Bloc, Vide, frDateHeure } from "@/components/gpf/fiche/shared";

type Personne = { id: string; prenom: string; nom: string; telephone?: string | null; nrp_count?: number } | null;
type Relance = { id: string; titre: string; categorie: GpfTaskCategorie; echeance: string; en_retard: boolean; client: Personne };
type Lead = { id: string; prenom: string; nom: string; telephone: string | null; provenance: string | null; created_at: string };
type Rdv = { id: string; titre: string; debut: string; duree_min: number; lien_visio: string | null; lieu: string | null; client: Personne };
type Affaire = { id: string; produit: GpfProduit; statut: GpfStatut; assureur_nom: string | null; etape_depuis: string; prochaine_action: string | null; client: Personne };
type Donnees = { relances: Relance[]; nouveauxLeads: Lead[]; rdv: Rdv[]; bloquees: Affaire[]; sansAction: Affaire[]; tablesManquantes: boolean };

const delai = (iso: string) => {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} j`;
};

export function MonJour() {
  const [d, setD] = useState<Donnees | null>(null);

  const load = () =>
    fetch("/api/gpf/commercial/mon-jour")
      .then((r) => r.json())
      .then((x) => x.ok && setD(x));
  useEffect(() => {
    load();
  }, []);

  const terminer = async (id: string) => {
    await fetch(`/api/gpf/taches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ etat: "terminee" }) });
    load();
  };

  if (!d) return <SkeletonLines rows={8} />;

  const ligneAffaire = (a: Affaire) => (
    <Link key={a.id} href={a.client ? `/gpf/contacts/${a.client.id}?dossier=${a.id}` : "#"} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0 hover:bg-[var(--gpf-surface-alt)]">
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-[var(--gpf-ink)] truncate">{formatNom(a.client)}</span>
        <span className="block text-xs text-[var(--gpf-subtle)] truncate">
          {GPF_PRODUIT_LABEL[a.produit]} · {GPF_STATUT_LABEL[a.statut]}
        </span>
      </span>
      <span className="text-xs text-[var(--gpf-muted)] shrink-0">{joursDepuis(a.etape_depuis)} j dans l&apos;étape</span>
    </Link>
  );

  return (
    <div className="flex flex-col gap-4">
      {d.tablesManquantes ? (
        <div className="text-sm rounded-lg px-4 py-2.5 bg-[var(--gpf-warning-tint)] text-[var(--gpf-ink)]">
          Les relances et rendez-vous s&apos;afficheront ici dès que la mise à jour de la base sera appliquée (Paramètres).
        </div>
      ) : null}
      <div className="grid lg:grid-cols-2 gap-4">
        <Bloc titre={`Relances du jour et en retard (${d.relances.length})`}>
          {d.relances.length === 0 ? (
            <Vide>Aucune relance pour aujourd&apos;hui.</Vide>
          ) : (
            d.relances.map((t) => (
              <div key={t.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0">
                <input type="checkbox" onChange={() => terminer(t.id)} className="mt-1" title="Marquer comme faite" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--gpf-ink)]">{t.titre}</div>
                  <div className="text-xs text-[var(--gpf-subtle)]">
                    {GPF_TASK_CATEGORIE_LABEL[t.categorie]} ·{" "}
                    <span className={t.en_retard ? "text-[#b3463f]" : ""}>
                      {t.en_retard ? "en retard — " : ""}
                      {frDateHeure(t.echeance)}
                    </span>
                  </div>
                </div>
                {t.client ? (
                  <Link href={`/gpf/contacts/${t.client.id}`} className="text-xs text-[var(--gpf-ink)] underline shrink-0">
                    {formatNom(t.client)}
                  </Link>
                ) : null}
              </div>
            ))
          )}
        </Bloc>

        <Bloc titre={`Nouveaux leads non contactés (${d.nouveauxLeads.length})`}>
          {d.nouveauxLeads.length === 0 ? (
            <Vide>Tous les nouveaux leads ont été contactés.</Vide>
          ) : (
            d.nouveauxLeads.map((l) => {
              const enRetard = Date.now() - new Date(l.created_at).getTime() > 24 * 3600_000;
              return (
                <Link key={l.id} href={`/gpf/contacts/${l.id}`} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0 hover:bg-[var(--gpf-surface-alt)]">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-[var(--gpf-ink)] truncate">{formatNom(l)}</span>
                    <span className="block text-xs text-[var(--gpf-subtle)] truncate">{[l.provenance, l.telephone].filter(Boolean).join(" · ") || "—"}</span>
                  </span>
                  <span className={`text-xs shrink-0 ${enRetard ? "text-[#b3463f] font-medium" : "text-[var(--gpf-muted)]"}`}>arrivé il y a {delai(l.created_at)}</span>
                </Link>
              );
            })
          )}
        </Bloc>

        <Bloc titre={`Rendez-vous du jour (${d.rdv.length})`}>
          {d.rdv.length === 0 ? (
            <Vide>Aucun rendez-vous aujourd&apos;hui.</Vide>
          ) : (
            d.rdv.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0">
                <span className="text-sm font-semibold text-[var(--gpf-ink)] tabular-nums w-12">{new Date(r.debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-[var(--gpf-ink)] truncate">{r.titre}</span>
                  <span className="block text-xs text-[var(--gpf-subtle)] truncate">{formatNom(r.client)}</span>
                </span>
                {r.lien_visio ? (
                  <a href={r.lien_visio} target="_blank" rel="noopener noreferrer" className="text-xs underline text-[var(--gpf-ink)]">
                    Visio
                  </a>
                ) : null}
              </div>
            ))
          )}
        </Bloc>

        <Bloc titre={`Affaires bloquées (${d.bloquees.length})`}>{d.bloquees.length === 0 ? <Vide>Aucune affaire bloquée.</Vide> : d.bloquees.slice(0, 15).map(ligneAffaire)}</Bloc>

        <Bloc titre={`Affaires sans prochaine action (${d.sansAction.length})`} className="lg:col-span-2">
          {d.sansAction.length === 0 ? <Vide>Toutes les affaires ont une prochaine action.</Vide> : d.sansAction.slice(0, 20).map(ligneAffaire)}
        </Bloc>
      </div>
    </div>
  );
}
