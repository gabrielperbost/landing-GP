// Squelettes de chargement : la page garde sa forme pendant que les données
// arrivent, au lieu d'un texte « Chargement… » sur fond vide.
export function SkeletonLines({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--gpf-border-soft)] last:border-0 animate-pulse">
          <div className="h-3 bg-[var(--gpf-fill)] rounded w-1/4" />
          <div className="h-3 bg-[var(--gpf-fill)] rounded w-1/6" />
          <div className="h-3 bg-[var(--gpf-fill)] rounded w-1/5 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl p-4 animate-pulse">
          <div className="h-3 bg-[var(--gpf-fill)] rounded w-1/2 mb-3" />
          <div className="h-6 bg-[var(--gpf-fill)] rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-7 bg-[var(--gpf-fill)] rounded w-48 animate-pulse" />
      <SkeletonTiles />
      <SkeletonLines />
    </div>
  );
}
