import { SectionHeader } from "@/components/ui/SectionHeader";
import { LazyVideo } from "@/components/video/LazyVideo";
import { Card } from "@/components/ui/Card";

const testimonialCards = [
  { id: "testimonial-1", src: "/videos/Tem1.mp4", amount: "17 200 €", poster: "/videos/temoignageV1.jpg" },
  { id: "testimonial-2", src: "/videos/Tem2.mp4", amount: "17 000 €" },
  { id: "testimonial-3", src: "/videos/Tem3.mp4", amount: "14 100 €" },
  { id: "testimonial-4", src: "/videos/Tem4.mp4", amount: "12 800 €", poster: "/videos/temoignageV2.webp" }
];

export const VideoTestimonials = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Avis vidéo"
      title="Ils ont renégocié avec GP Finances"
      subtitle="Preuves sociales vérifiables : économies constatées et clients accompagnés."
    />
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
        {testimonialCards.map((card, idx) => (
          <Card
            key={card.id}
            className="shrink-0 snap-start basis-[68%] max-w-[280px] overflow-hidden p-1.5 sm:basis-[42%] sm:max-w-[300px] sm:p-2 lg:basis-[30%] xl:basis-[24%]"
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
              <LazyVideo
                id={card.id}
                src={card.src}
                poster={card.poster}
                fit="contain"
                preload="metadata"
                autoPlay={false}
                loop={false}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2.5 sm:p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
                  Économie constatée
                </p>
                <p className="text-lg font-bold text-white sm:text-base">{card.amount}</p>
              </div>
            </div>
            <p className="px-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted sm:pt-2">
              Témoignage vidéo {idx + 1}
            </p>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted sm:hidden">Faites glisser pour voir tous les témoignages.</p>
    </div>
  </section>
);
