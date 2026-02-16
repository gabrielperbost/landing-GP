import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQ_ITEMS } from "@/content/site";
import { Card } from "@/components/ui/Card";

export const FAQ = () => (
  <section className="container scroll-mt-24 py-12 space-y-8" id="faq">
    <SectionHeader kicker="Questions fréquentes" title="FAQ Loi Lemoine : les 8 questions qui bloquent le RDV" />
    <div className="grid gap-4 md:grid-cols-2">
      {FAQ_ITEMS.map((item) => (
        <Card key={item.q} className="p-4">
          <details>
            <summary className="cursor-pointer text-base font-semibold text-ink">{item.q}</summary>
            <p className="mt-2 text-sm text-muted leading-relaxed">{item.a}</p>
          </details>
        </Card>
      ))}
    </div>
  </section>
);
