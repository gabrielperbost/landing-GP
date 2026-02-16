import { Button } from "@/components/ui/Button";
import { CONFIG } from "@/content/site";
import { trackCTA, trackRDV } from "@/lib/tracking";

export const InlineCTA = ({ label }: { label: string }) => (
  <div className="container my-6 rounded-xl border border-slate-200 bg-white/80 p-5 shadow-soft flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-base font-semibold text-ink">{label}</p>
    <div className="flex gap-3">
      <Button variant="secondary" href="tel:+33651224213" onClick={() => trackCTA("inline_call")}>
        Appeler
      </Button>
      <Button href={CONFIG.CALENDLY_URL} onClick={() => trackRDV("inline")}>
        Prendre RDV
      </Button>
      <a
        href="#contact"
        className="text-sm font-semibold text-primary hover:underline underline-offset-4"
        onClick={() => trackCTA("inline_contact_form")}
      >
        Me faire rappeler
      </a>
    </div>
  </div>
);
