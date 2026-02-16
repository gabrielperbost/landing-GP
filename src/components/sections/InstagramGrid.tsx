import { SectionHeader } from "@/components/ui/SectionHeader";
import { CONFIG } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LazyVideo } from "@/components/video/LazyVideo";
import reelPoster from "@/components/video/comment-comprendre.webp";

export const InstagramGrid = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Preuve sociale"
      title="Des milliers d’emprunteurs suivent déjà nos conseils"
      subtitle="Découvrez nos reels pédagogiques et cas clients en continu."
    />
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 lg:grid-cols-4">
        {CONFIG.INSTAGRAM_REELS.map((url, idx) => (
          <Card
            key={url}
            className="w-full max-w-[280px] shrink-0 snap-start basis-[68%] p-3 flex flex-col gap-2.5 sm:basis-[46%] md:max-w-none md:basis-auto"
          >
            {url.endsWith(".mp4") ? (
              <div className="aspect-[9/16] overflow-hidden rounded-xl">
                <LazyVideo
                  id={`reel-${idx + 1}`}
                  src={url}
                  poster={idx === 0 ? reelPoster.src : undefined}
                  fit="contain"
                />
              </div>
            ) : (
              <div className="aspect-[9/16] rounded-xl bg-gradient-to-br from-primary/10 to-emerald-100 grid place-items-center text-sm text-muted">
                Reel #{idx + 1}
              </div>
            )}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Voir le reel
            </a>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted md:hidden">Faites glisser pour voir tous les reels.</p>
    </div>
    <div className="flex justify-center">
      <Button href="https://www.instagram.com" variant="secondary">
        Voir Instagram
      </Button>
    </div>
  </section>
);
