import { LeadForm } from "@/components/forms/LeadForm";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CONFIG } from "@/content/site";
import { trackRDV } from "@/lib/tracking";

export const FinalCTA = () => (
  <section className="container py-12 space-y-8" id="estimation">
    <SectionHeader
      kicker="Action"
      title="Découvrez vos économies en 2 minutes"
      subtitle="Email pour recevoir votre estimation et les étapes suivantes."
    />
    <LeadForm />
    <div className="flex flex-wrap gap-3">
      <Button href={CONFIG.CALENDLY_URL} variant="secondary" onClick={() => trackRDV("final_cta")}>
        Prendre RDV
      </Button>
      <p className="text-xs text-muted">Offert · Sans engagement · Données sécurisées</p>
    </div>
  </section>
);
