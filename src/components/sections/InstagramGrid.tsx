import { SectionHeader } from "@/components/ui/SectionHeader";
import { CONFIG } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LazyVideo } from "@/components/video/LazyVideo";

const prototypeLegends = [
  { label: "POURQUOI ?", value: "Tu n’est pas au courant" },
  { label: "C’EST QUOI ?", value: "La délégation d’assurance" },
  { label: "COMPLIQUÉ ?", value: "Je m’occupe de tout" },
  { label: "COMMENT ?", value: "L’assurance est indépendante" }
];

export const InstagramGrid = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Preuve sociale"
      title="Des milliers d’emprunteurs suivent déjà nos conseils"
      subtitle="Découvrez nos reels pédagogiques et cas clients en continu."
    />
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 lg:grid-cols-4">
        {CONFIG.INSTAGRAM_REELS.map((url, idx) => {
          const legend = prototypeLegends[idx % prototypeLegends.length];
          return (
            <Card
              key={url}
              className="w-full max-w-[280px] shrink-0 snap-start basis-[68%] p-3 flex flex-col gap-2.5 sm:basis-[46%] md:max-w-none md:basis-auto"
            >
              {url.endsWith(".mp4") ? (
                <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black">
                  <LazyVideo
                    id={`reel-${idx + 1}`}
                    src={url}
                    fit="contain"
                    preload="auto"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2.5 sm:p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
                      {legend.label}
                    </p>
                    <p className="text-lg font-bold text-white sm:text-base">{legend.value}</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-[9/16] rounded-xl bg-gradient-to-br from-primary/10 to-emerald-100 grid place-items-center text-sm text-muted">
                  Reel #{idx + 1}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-muted md:hidden">Faites glisser pour voir tous les reels.</p>
    </div>
    <div className="flex justify-center">
      <Button href="https://www.instagram.com/gabriel_perbost/" variant="secondary">
        Voir Instagram
      </Button>
    </div>
  </section>
);
