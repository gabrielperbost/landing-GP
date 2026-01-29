import { Button } from "@/components/ui/Button";
import { CONFIG } from "@/content/site";
import { trackCTA, trackRDV } from "@/lib/tracking";

export const InlineCTA = ({ label }: { label: string }) => (
  <div className="container my-6 rounded-xl border border-slate-200 bg-white/80 p-5 shadow-soft flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-base font-semibold text-ink">{label}</p>
    <div className="flex gap-3">
      <Button variant="secondary" href="#estimation" onClick={() => trackCTA("inline_estimation")}>
        Estimer
      </Button>
      <Button href={CONFIG.CALENDLY_URL} onClick={() => trackRDV("inline")}>
        Prendre RDV
      </Button>
    </div>
  </div>
);
