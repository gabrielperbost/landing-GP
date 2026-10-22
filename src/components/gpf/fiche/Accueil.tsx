"use client";
import {
  GPF_COMPLIANCE_ITEMS,
  GPF_CONTRAT_STATUT_COLOR,
  GPF_CONTRAT_STATUT_LABEL,
  GPF_NOTE_CATEGORIE_LABEL,
  GPF_PRODUIT_COLOR,
  GPF_PRODUIT_LABEL,
  GPF_RDV_STATUT_LABEL,
  GPF_STATUTS_CLOS,
  GPF_STATUT_COLOR,
  GPF_STATUT_LABEL,
  GPF_TASK_CATEGORIE_LABEL,
  type GpfCompliance,
  type GpfDossier,
  type GpfProduit
} from "@/lib/gpf/types";
import { primeAnnuelle } from "@/lib/gpf/contrats";
import { api, Bloc, euro, frDate, frDateHeure, LienAction, Vide, type FicheData } from "./shared";

export const STATUT_CONFORMITE_COLOR = { fait: "#2f9e6e", en_cours: "#c98a1f", manquant: "#b3463f" } as const;

/** Anneau SVG (sans bibliothèque) : part de chaque produit. */
export function Anneau({ parts, centre }: { parts: { label: string; valeur: number; couleur: string }[]; centre: string }) {
  const total = parts.reduce((s, p) => s + p.valeur, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--gpf-fill)" strokeWidth="16" />
      {total > 0
        ? parts.map((p) => {
            const len = (p.valeur / total) * c;
            const el = (
              <circle
                key={p.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={p.couleur}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += len;
            return el;
          })
        : null}
      <text x="70" y="66" textAnchor="middle" className="fill-[var(--gpf-subtle)]" style={{ fontSize: 8, letterSpacing: 1 }}>
        RÉPARTITION
      </text>
      <text x="70" y="82" textAnchor="middle" className="fill-[var(--gpf-ink)]" style={{ fontSize: 12, fontWeight: 600 }}>
        {centre}
      </text>
    </svg>
  );
}

export function Accueil({
  data,
  onOpenDossier,
  onNote,
  onTache,
  onRdv,
  onChanged,
  onTab
}: {
  data: FicheData;
  onOpenDossier: (id: string) => void;
  onNote: () => void;
  onTache: () => void;
  onRdv: () => void;
  onChanged: () => void;
  onTab: (t: string) => void;
}) {
  const { dossiers, notes, taches, rdv, conformite } = data;

  // Répartition : primes annualisées des contrats actifs ; à défaut, nombre de dossiers par produit.
  const actifs = dossiers.filter((d) => d.contrat_statut === "actif");
  const parProduit = new Map<GpfProduit, number>();
  for (const d of actifs) parProduit.set(d.produit, (parProduit.get(d.produit) ?? 0) + (primeAnnuelle(d) ?? 0));
  const totalPrimes = [...parProduit.values()].reduce((s, v) => s + v, 0);
  const avecPrimes = totalPrimes > 0;
  if (!avecPrimes) {
    parProduit.clear();
    for (const d of dossiers.filter((x) => !GPF_STATUTS_CLOS.has(x.statut))) parProduit.set(d.produit, (parProduit.get(d.produit) ?? 0) + 1);
  }
  const totalParts = [...parProduit.values()].reduce((s, v) => s + v, 0);
  const parts = [...parProduit.entries()].map(([p, v]) => ({ label: GPF_PRODUIT_LABEL[p], valeur: v, couleur: GPF_PRODUIT_COLOR[p] }));

  const conformiteBy = new Map(conformite.map((c) => [c.type, c]));
  const prochainRdv = rdv.filter((r) => r.statut !== "annule" && new Date(r.debut).getTime() > Date.now() - 3600_000).sort((a, b) => (a.debut < b.debut ? -1 : 1))[0];
  const ouvertes = taches.filter((t) => t.etat !== "terminee");

  const terminer = async (id: string) => {
    await api(`/api/gpf/taches/${id}`, "PATCH", { etat: "terminee" });
    onChanged();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Bloc titre="Répartition" action={<LienAction onClick={() => onTab("contrats")}>Voir tout ›</LienAction>}>
        {parts.length === 0 ? (
          <Vide>Aucun contrat ni affaire en cours.</Vide>
        ) : (
          <div className="p-4 flex items-center gap-5 flex-wrap">
            <Anneau parts={parts} centre={avecPrimes ? euro(totalPrimes)! : `${totalParts} dossier${totalParts > 1 ? "s" : ""}`} />
            <div className="flex-1 min-w-[180px] flex flex-col gap-1.5">
              {parts.map((p) => (
                <div key={p.label} className="flex items-center gap-2 text-sm rounded-lg bg-[var(--gpf-surface-alt)] px-2.5 py-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.couleur }} />
                  <span className="text-[var(--gpf-ink)] flex-1 truncate">{p.label}</span>
                  <span className="text-[var(--gpf-ink)] tabular-nums">{avecPrimes ? euro(p.valeur) : p.valeur}</span>
                  <span className="text-[11px] text-[var(--gpf-subtle)] w-10 text-right">{Math.round((p.valeur / totalParts) * 100)} %</span>
                </div>
              ))}
              {!avecPrimes ? <p className="text-[11px] text-[var(--gpf-subtle)]">Primes non renseignées : répartition par nombre de dossiers.</p> : null}
            </div>
          </div>
        )}
      </Bloc>

      <Bloc titre="Réglementation" action={<LienAction onClick={() => onTab("conformite")}>Gérer ›</LienAction>}>
        <div className="py-1">
          {GPF_COMPLIANCE_ITEMS.slice(0, 7).map((item) => {
            const c: GpfCompliance | undefined = conformiteBy.get(item.type);
            const statut = c?.statut ?? "manquant";
            const expire = c?.date_expiration && c.date_expiration < new Date().toISOString().slice(0, 10);
            return (
              <div key={item.type} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: expire ? "#b3463f" : STATUT_CONFORMITE_COLOR[statut] }} />
                <span className="flex-1 text-[var(--gpf-ink)] truncate">{item.label}</span>
                <span className="text-xs" style={{ color: expire ? "#b3463f" : STATUT_CONFORMITE_COLOR[statut] }}>
                  {expire ? "Expirée" : statut === "fait" ? "Fait" : statut === "en_cours" ? `En cours — ${c?.pourcentage ?? 0} %` : "Manquant"}
                </span>
                <span className="text-[11px] text-[var(--gpf-subtle)] w-20 text-right">{frDate(c?.date_signature) ?? ""}</span>
              </div>
            );
          })}
        </div>
      </Bloc>

      <Bloc titre={`Mes notes (${notes.length})`} action={<LienAction onClick={onNote}>+ Ajouter</LienAction>}>
        {notes.length === 0 ? (
          <Vide>Aucune note.</Vide>
        ) : (
          notes.slice(0, 4).map((n) => (
            <div key={n.id} className="px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0">
              <div className="flex items-center gap-2 text-[11px] text-[var(--gpf-subtle)]">
                <span className="rounded-full px-2 py-0.5 bg-[var(--gpf-chip)] text-[var(--gpf-ink)]">{GPF_NOTE_CATEGORIE_LABEL[n.categorie]}</span>
                <span>{n.auteur}</span>
                <span className="ml-auto">{frDate(n.created_at)}</span>
              </div>
              <p className="text-sm text-[var(--gpf-ink)] mt-1 whitespace-pre-wrap line-clamp-3">{n.contenu}</p>
            </div>
          ))
        )}
      </Bloc>

      <div className="grid sm:grid-cols-2 gap-4">
        <Bloc titre="Rendez-vous" action={<LienAction onClick={onRdv}>+ Planifier</LienAction>}>
          {prochainRdv ? (
            <div className="px-4 py-3">
              <div className="text-sm font-medium text-[var(--gpf-ink)]">{prochainRdv.titre}</div>
              <div className="text-xs text-[var(--gpf-muted)] mt-0.5">
                {frDateHeure(prochainRdv.debut)} · {prochainRdv.duree_min} min
              </div>
              <div className="flex gap-1.5 mt-2">
                <span className="text-[10px] rounded-full px-2 py-0.5 border border-[var(--gpf-border)] text-[var(--gpf-ink)]">{GPF_RDV_STATUT_LABEL[prochainRdv.statut]}</span>
                <span className="text-[10px] rounded-full px-2 py-0.5 bg-[var(--gpf-chip)] text-[var(--gpf-ink)] capitalize">{prochainRdv.source}</span>
              </div>
              {prochainRdv.lien_visio ? (
                <a href={prochainRdv.lien_visio} target="_blank" rel="noopener noreferrer" className="text-xs underline text-[var(--gpf-ink)] mt-2 inline-block">
                  Rejoindre la visio
                </a>
              ) : null}
            </div>
          ) : (
            <Vide>Aucun rendez-vous prévu.</Vide>
          )}
        </Bloc>

        <Bloc titre={`Mes tâches (${ouvertes.length})`} action={<LienAction onClick={onTache}>+ Ajouter</LienAction>}>
          {ouvertes.length === 0 ? (
            <Vide>Aucune tâche ouverte.</Vide>
          ) : (
            ouvertes.slice(0, 5).map((t) => {
              const retard = t.echeance && new Date(t.echeance).getTime() < Date.now();
              return (
                <div key={t.id} className="flex items-start gap-2 px-4 py-2 border-b border-[var(--gpf-border-soft)] last:border-0">
                  <input type="checkbox" onChange={() => terminer(t.id)} className="mt-1" title="Marquer comme terminée" />
                  <div className="min-w-0">
                    <div className="text-sm text-[var(--gpf-ink)]">{t.titre}</div>
                    <div className="text-[11px] text-[var(--gpf-subtle)]">
                      {GPF_TASK_CATEGORIE_LABEL[t.categorie]}
                      {t.echeance ? <span className={retard ? "text-[#b3463f]" : ""}> · {frDateHeure(t.echeance)}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Bloc>
      </div>

      <div className="lg:col-span-2">
        <ListeDossiers titre="Dossiers récents" dossiers={dossiers.slice(0, 5)} onOpen={onOpenDossier} />
      </div>
    </div>
  );
}

export function ListeDossiers({ titre, dossiers, onOpen, action }: { titre: string; dossiers: GpfDossier[]; onOpen: (id: string) => void; action?: React.ReactNode }) {
  return (
    <Bloc titre={titre} action={action}>
      {dossiers.length === 0 ? (
        <Vide>Rien à afficher.</Vide>
      ) : (
        dossiers.map((d) => {
          const pa = primeAnnuelle(d);
          const commission = (d.precompte_lineaire_1ere_annee ?? 0) + (d.lineaire_n1 ?? 0);
          return (
            <button key={d.id} onClick={() => onOpen(d.id)} className="w-full flex items-center gap-3 px-4 py-3 border-b border-[var(--gpf-border-soft)] last:border-0 hover:bg-[var(--gpf-surface-alt)] text-left">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: GPF_PRODUIT_COLOR[d.produit] }}>
                {GPF_PRODUIT_LABEL[d.produit].charAt(0)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-[var(--gpf-ink)] truncate">{GPF_PRODUIT_LABEL[d.produit]}</span>
                <span className="block text-xs text-[var(--gpf-subtle)] truncate">
                  {[d.assureur_nom ?? "Compagnie non renseignée", d.reference_contrat ? `n° ${d.reference_contrat}` : null, frDate(d.date_effet)].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="hidden sm:block text-right text-xs tabular-nums">
                <span className="block text-[var(--gpf-ink)]">{pa != null ? `${euro(pa)}/an` : "—"}</span>
                <span className="block text-[var(--gpf-subtle)]">{commission > 0 ? `${euro(commission)} comm.` : ""}</span>
              </span>
              {d.contrat_statut ? (
                <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5 shrink-0" style={{ background: GPF_CONTRAT_STATUT_COLOR[d.contrat_statut] }}>
                  {GPF_CONTRAT_STATUT_LABEL[d.contrat_statut]}
                </span>
              ) : (
                <span className="text-xs font-semibold text-white rounded-full px-2 py-0.5 shrink-0" style={{ background: GPF_STATUT_COLOR[d.statut] }}>
                  {GPF_STATUT_LABEL[d.statut]}
                </span>
              )}
              <span className="text-[var(--gpf-subtle)]">›</span>
            </button>
          );
        })
      )}
    </Bloc>
  );
}
