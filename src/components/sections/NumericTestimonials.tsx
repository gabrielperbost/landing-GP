import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { NUMERIC_TESTIMONIALS } from "@/content/site";

export const NumericTestimonials = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Résultats clients"
      title="Témoignages chiffrés"
      subtitle="Des économies concrètes, certifiées par les attestations d’assurance."
    />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {NUMERIC_TESTIMONIALS.map((item) => (
        <Card key={item.quote} className="p-5">
          <p className="text-xl font-semibold text-ink">{item.quote}</p>
          <p className="mt-3 text-sm text-muted">{item.name}</p>
        </Card>
      ))}
    </div>
  </section>
);
