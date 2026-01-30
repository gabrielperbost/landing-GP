import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { NUMERIC_TESTIMONIALS } from "@/content/site";

export const NumericTestimonials = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Avis & résultats"
      title="Exemples d’économies réelles"
      subtitle="Des économies concrètes, certifiées par les attestations d’assurance."
    />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {NUMERIC_TESTIMONIALS.map((item) => (
        <Card key={item.quote} className="p-5">
          <p className="text-sm font-semibold text-ink flex items-center gap-1">
            {item.name}
            <span aria-label="5 étoiles" className="text-amber-500">★★★★★</span>
          </p>
          <p className="text-xl font-semibold text-ink">{item.quote}</p>
        </Card>
      ))}
    </div>
  </section>
);
