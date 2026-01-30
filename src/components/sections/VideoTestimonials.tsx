import { SectionHeader } from "@/components/ui/SectionHeader";
import { CONFIG } from "@/content/site";
import { LazyVideo } from "@/components/video/LazyVideo";
import { Card } from "@/components/ui/Card";

export const VideoTestimonials = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Avis vidéo"
      title="Ils ont renégocié avec GP Finances"
      subtitle="Preuves sociales vérifiables : économies constatées et clients accompagnés."
    />
    <div className="grid gap-4 md:grid-cols-3">
      {CONFIG.TESTIMONIAL_VIDEOS.map((video, idx) => {
        const amounts = ["17 200 €", "23 690 €", "14 100 €"];
        return (
          <Card key={video} className="p-4 space-y-3">
            <div className="aspect-video w-full overflow-hidden">
              <LazyVideo id={`testimonial-${idx + 1}`} src={video} />
            </div>
            <p className="text-sm text-muted">
              Économie constatée : <span className="font-semibold text-ink">{amounts[idx] ?? "—"}</span>
            </p>
          </Card>
        );
      })}
    </div>
  </section>
);
