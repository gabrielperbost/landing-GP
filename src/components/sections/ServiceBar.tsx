import { Button } from "@/components/ui/Button";
import { CONFIG } from "@/content/site";
import { trackCTA, trackRDV } from "@/lib/tracking";

const items = [
  { icon: "🎁", label: "Simulation gratuite" },
  { icon: "⏱️", label: "Devis en 24h" },
  { icon: "🔍", label: "51 assureurs comparés" }
];

export const ServiceBar = () => (
  <section className="container mt-4 sm:mt-6">
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3 sm:gap-5">
        {items.map((item, idx) => (
          <div key={item.label} className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-primary">{item.icon}</span>
            <span>{item.label}</span>
            {idx < items.length - 1 && <span className="hidden text-slate-300 sm:inline">•</span>}
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button href="tel:+33651224213" onClick={() => trackCTA("servicebar_call")} className="w-full sm:w-auto">
          Appeler
        </Button>
        <Button variant="secondary" href={CONFIG.CALENDLY_URL} onClick={() => trackRDV("servicebar_rdv")} className="w-full sm:w-auto">
          Prendre RDV Calendly
        </Button>
        <Button
          variant="secondary"
          href="#contact"
          onClick={() => trackCTA("servicebar_contact_form")}
          className="w-full sm:w-auto"
        >
          Me faire rappeler
        </Button>
      </div>
    </div>
  </section>
);
