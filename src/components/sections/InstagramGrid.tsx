import { SectionHeader } from "@/components/ui/SectionHeader";
import { CONFIG } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LazyVideo } from "@/components/video/LazyVideo";

export const InstagramGrid = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Preuve sociale"
      title="Des milliers d’emprunteurs suivent déjà nos conseils"
      subtitle="Découvrez nos reels pédagogiques et cas clients en continu."
    />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CONFIG.INSTAGRAM_REELS.map((url, idx) => (
        <Card key={url} className="p-4 flex flex-col gap-3">
          {url.endsWith(".mp4") ? (
            <div className="aspect-[9/16] overflow-hidden rounded-xl">
              <LazyVideo id={`reel-${idx + 1}`} src={url} />
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
            className="text-sm font-semibold text-primary hover:underline"
          >
            Voir le reel
          </a>
        </Card>
      ))}
    </div>
    <div className="flex justify-center">
      <Button href="https://www.instagram.com" variant="secondary">
        Voir Instagram
      </Button>
    </div>
  </section>
);
