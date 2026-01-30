import { LeadForm } from "@/components/forms/LeadForm";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CONFIG } from "@/content/site";
import { trackRDV } from "@/lib/tracking";

export const FinalCTA = () => (
  <section className="container py-12 space-y-8" id="estimation">
    <SectionHeader
      kicker="Prise de RDV"
      title="Prendre RDV gratuit / sans engagement"
      subtitle="Laissez votre téléphone (obligatoire). Je vous rappelle et vous pouvez aussi réserver Calendly."
    />
    <LeadForm />
    <div className="flex flex-wrap gap-3">
      <Button href="tel:+33651224213" onClick={() => trackCTA("final_call")}>
        Appeler le 06 51 22 42 13
      </Button>
      <Button href={CONFIG.CALENDLY_URL} variant="secondary" onClick={() => trackRDV("final_cta")}>
        Prendre RDV Calendly
      </Button>
      <p className="text-xs text-muted">Offert · Sans engagement · Données sécurisées</p>
    </div>
  </section>
);
