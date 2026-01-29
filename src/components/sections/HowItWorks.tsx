import { SectionHeader } from "@/components/ui/SectionHeader";
import { TIMELINE } from "@/content/site";
import { Card } from "@/components/ui/Card";
import { LazyVideo } from "@/components/video/LazyVideo";
import { Button } from "@/components/ui/Button";
import { CONFIG } from "@/content/site";
import { trackRDV } from "@/lib/tracking";

export const HowItWorks = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Process GP Finances"
      title="Comment ça marche ?"
      subtitle="Un parcours 100% accompagné, sans paperasse pour vous."
    />
    <div className="grid gap-4 md:grid-cols-2">
      {TIMELINE.map((step, index) => (
        <Card key={step.title} className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">Étape {index + 1}</span>
            <span className="text-xs text-muted">3–4 semaines</span>
          </div>
          <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
          <p className="text-sm text-muted">{step.desc}</p>
          <div className="aspect-video">
            <LazyVideo id={`process-${index + 1}`} src={step.video} />
          </div>
        </Card>
      ))}
    </div>
    <div className="flex justify-center">
      <Button href={CONFIG.CALENDLY_URL} onClick={() => trackRDV("process_cta")}>
        Parler à un expert maintenant
      </Button>
    </div>
  </section>
);
