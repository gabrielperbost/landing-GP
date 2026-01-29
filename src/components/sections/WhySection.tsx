import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WHY_POINTS } from "@/content/site";

export const WhySection = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Cadre légal"
      title="Pourquoi vous pouvez économiser légalement"
      subtitle="La loi Lemoine vous autorise à changer d’assurance emprunteur à tout moment, avec équivalence de garanties."
    />
    <div className="grid gap-4 md:grid-cols-3">
      {WHY_POINTS.map((item) => (
        <Card key={item.title} className="p-5">
          <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
          <p className="mt-2 text-sm text-muted">{item.desc}</p>
        </Card>
      ))}
    </div>
  </section>
);
