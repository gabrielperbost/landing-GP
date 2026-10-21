// Titre de page homogène (serif, identité GP Finances) avec sous-titre et actions.
export function PageHeader({ titre, sousTitre, actions }: { titre: string; sousTitre?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h1 className="text-2xl text-[var(--gpf-ink)]" style={{ fontFamily: "var(--font-gpf-serif)" }}>
          {titre}
        </h1>
        {sousTitre ? <p className="text-sm text-[var(--gpf-muted)] mt-1">{sousTitre}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Carte({ titre, actions, children, className = "" }: { titre?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl ${className}`}>
      {titre ? (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gpf-border-soft)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--gpf-muted)]">{titre}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function EnConstruction({ titre, description, lot }: { titre: string; description: string; lot: number }) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader titre={titre} />
      <Carte>
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-[var(--gpf-ink)]">{description}</p>
          <p className="text-xs text-[var(--gpf-subtle)] mt-2">Module en cours de construction (lot {lot}).</p>
        </div>
      </Carte>
    </div>
  );
}
