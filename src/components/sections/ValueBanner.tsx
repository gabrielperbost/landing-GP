import { Button } from "@/components/ui/Button";
import { CONFIG } from "@/content/site";
import { trackRDV } from "@/lib/tracking";

const Item = ({
  icon,
  label
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center gap-2 text-sm font-semibold text-ink">
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-primary">
      {icon}
    </span>
    <span>{label}</span>
  </div>
);

export const ValueBanner = () => (
  <section className="container -mt-4 pb-4">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3 sm:gap-5">
        <Item icon={<span className="text-lg">🎁</span>} label="Simulation gratuite" />
        <span className="hidden text-slate-300 sm:inline">•</span>
        <Item icon={<span className="text-lg">⏱️</span>} label="Devis en 24h" />
        <span className="hidden text-slate-300 sm:inline">•</span>
        <Item icon={<span className="text-lg">🔍</span>} label="51 assureurs comparés" />
      </div>
      <Button
        href={CONFIG.CALENDLY_URL}
        className="w-full sm:w-auto"
        onClick={() => trackRDV("value_banner")}
      >
        Prendre RDV
      </Button>
    </div>
  </section>
);
