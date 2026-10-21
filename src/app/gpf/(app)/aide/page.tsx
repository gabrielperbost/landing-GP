import { Carte, PageHeader } from "@/components/gpf/PageHeader";

const RACCOURCIS: [string, string][] = [
  ["⌘K ou Ctrl+K", "Ouvrir la recherche et les actions rapides (nouveau lead, nouvelle tâche, importer un bordereau…)"],
  ["Échap", "Fermer une fenêtre, un panneau ou la recherche"],
  ["↑ ↓ puis Entrée", "Naviguer dans les résultats de recherche"]
];

export default function AidePage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader titre="Aide" />
      <Carte titre="Raccourcis clavier">
        {RACCOURCIS.map(([k, v]) => (
          <div key={k} className="flex gap-4 px-4 py-2.5 border-b border-[var(--gpf-border-soft)] last:border-0 text-sm">
            <span className="w-36 shrink-0 font-mono text-xs text-[var(--gpf-ink)]">{k}</span>
            <span className="text-[var(--gpf-muted)]">{v}</span>
          </div>
        ))}
      </Carte>
      <Carte titre="Vocabulaire">
        <div className="px-4 py-3 text-sm text-[var(--gpf-muted)] space-y-2">
          <p>
            <strong className="text-[var(--gpf-ink)]">Contact</strong> : une personne, lead ou client. Un contact devient client dès qu&apos;il a un
            contrat signé.
          </p>
          <p>
            <strong className="text-[var(--gpf-ink)]">Affaire</strong> : une opportunité en cours dans le pipeline Commercial (à traiter, devis
            envoyé, en souscription…).
          </p>
          <p>
            <strong className="text-[var(--gpf-ink)]">Contrat</strong> : une affaire signée (effective). Elle quitte le pipeline et apparaît dans
            Contrats.
          </p>
        </div>
      </Carte>
    </div>
  );
}
