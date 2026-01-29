"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { trackCTA, trackRDV } from "@/lib/tracking";
import { CONFIG } from "@/content/site";
import { useEffect, useState } from "react";

type Props = {
  highlightRDV: boolean;
};

export const Header = ({ highlightRDV }: Props) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 transition ${
        scrolled ? "shadow-soft" : ""
      }`}
    >
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary text-white grid place-items-center font-bold">GP</div>
          <div>
            <p className="text-sm font-semibold text-ink">GP Finances</p>
            <p className="text-xs text-muted">Courtier assurance emprunteur</p>
          </div>
          <Badge tone="info" className="ml-3 hidden sm:inline-flex">
            Loi Lemoine 2022
          </Badge>
        </div>
        <div className="hidden gap-3 sm:flex">
          <Button
            variant={highlightRDV ? "secondary" : "primary"}
            href="#estimation"
            onClick={() => trackCTA("header_estimation")}
          >
            Estimer mes économies
          </Button>
          <Button
            variant={highlightRDV ? "primary" : "secondary"}
            href={CONFIG.CALENDLY_URL}
            onClick={() => trackRDV("header")}
          >
            Prendre RDV
          </Button>
        </div>
        <Badge tone="info" className="sm:hidden">
          Loi Lemoine 2022
        </Badge>
      </div>
    </header>
  );
};
