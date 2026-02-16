import { Card } from "@/components/ui/Card";

const items = [
  {
    icon: "🎁",
    label: "Simulation gratuite",
    detail: "Évaluez vos économies potentielles sans engagement."
  },
  {
    icon: "⏱️",
    label: "Devis en 24h",
    detail: "Une réponse claire et actionnable en moins de 24h."
  },
  {
    icon: "🔍",
    label: "51 assureurs comparés",
    detail: "Comparaison large pour viser le meilleur rapport garanties/prix."
  }
];

export const ServiceBar = () => (
  <section className="container mt-4 sm:mt-6" aria-label="Points clés GP Finances">
    {/*
      - 3 cases distinctes (pas de fond commun)
      - Mobile-friendly : stack + grands touch targets
      - DA conservée : blancs, slate, primary subtil, soft shadow
    */}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.label}
          className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur transition sm:p-5"
        >
          {/* halo premium par card (subtil) */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/15"
            aria-hidden="true"
          />

          <div className="relative flex items-start gap-3">
            <span
              className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-sm ring-1 ring-slate-100"
              aria-hidden="true"
            >
              {item.icon}
            </span>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink sm:text-[15px]">
                {item.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">
                {item.detail}
              </p>
            </div>
          </div>

          {/* signature visuelle légère (sans CTA) */}
          <div
            className="relative mt-4 h-px w-full bg-gradient-to-r from-slate-200/0 via-slate-200 to-slate-200/0"
            aria-hidden="true"
          />
        </Card>
      ))}
    </div>
  </section>
);
