import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BEFORE_AFTER } from "@/content/site";

export const BeforeAfter = () => (
  <section className="container py-12 space-y-8">
    <SectionHeader
      kicker="Avant / Après"
      title="L’impact immédiat sur votre coût total"
      subtitle="Mêmes garanties, moins cher. La différence se compte en dizaines de milliers d’euros."
    />
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-6">
        <p className="text-sm text-muted">{BEFORE_AFTER.oldLabel}</p>
        <p className="mt-2 text-3xl font-bold text-ink">{BEFORE_AFTER.oldCost}</p>
        <p className="text-xs text-muted mt-1">Tarif bancaire d’origine</p>
      </Card>
      <Card tone="accent" className="p-6">
        <p className="text-sm text-muted">{BEFORE_AFTER.newLabel}</p>
        <p className="mt-2 text-3xl font-bold text-ink">{BEFORE_AFTER.newCost}</p>
        <p className="text-xs text-muted mt-1">Après renégociation GP Finances</p>
      </Card>
      <Card className="p-6 bg-emerald-50 border-emerald-100">
        <p className="text-sm font-semibold text-emerald-700">Économie estimée</p>
        <p className="mt-3 text-4xl font-extrabold text-emerald-700 animate-float">{BEFORE_AFTER.savings}</p>
        <p className="text-xs text-emerald-700 mt-1">Exemple client, résultat en 4 semaines</p>
      </Card>
    </div>
  </section>
);
