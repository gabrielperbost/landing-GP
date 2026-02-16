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
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="grid w-full gap-3 sm:flex sm:flex-1 sm:flex-wrap sm:items-center sm:gap-5">
        {items.map((item, idx) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-ink sm:border-0 sm:bg-transparent sm:px-0 sm:py-0"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-primary">
              {item.icon}
            </span>
            <span className="flex-1 sm:flex-none">{item.label}</span>
            {idx < items.length - 1 && <span className="hidden text-slate-300 sm:inline">•</span>}
          </div>
        ))}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
        <Button href="tel:+33651224213" onClick={() => trackCTA("servicebar_call")} className="w-full sm:w-auto">
          Appeler
        </Button>
        <Button
          variant="secondary"
          href={CONFIG.CALENDLY_URL}
          onClick={() => trackRDV("servicebar_rdv")}
          className="w-full sm:w-auto"
        >
          Prendre RDV
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
