import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { LazyVideo } from "@/components/video/LazyVideo";
import { Button } from "@/components/ui/Button";
import { CONFIG } from "@/content/site";
import { trackRDV } from "@/lib/tracking";
import poster from "@/components/video/photo1.webp";

export const HowItWorks = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Process GP Finances"
      title="Comment ça se passe avec GP Finances"
      subtitle="Les 3 étapes expliquées en vidéo (1 min 30)."
    />
    <Card className="p-3 sm:p-4 flex justify-center">
      <div className="aspect-[9/16] max-w-[180px] w-full overflow-hidden rounded-xl">
        <LazyVideo id="process-main" src="/videos/video9.mp4" poster={poster.src} />
      </div>
    </Card>
    <div className="flex justify-center">
      <Button href={CONFIG.CALENDLY_URL} onClick={() => trackRDV("process_cta")}>
        J'appelle maintenant
      </Button>
    </div>
  </section>
);
