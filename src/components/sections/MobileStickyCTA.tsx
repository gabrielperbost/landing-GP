"use client";

import { Button } from "@/components/ui/Button";
import { CONFIG } from "@/content/site";
import { trackCTA, trackRDV } from "@/lib/tracking";
import { useEffect, useState } from "react";

export const MobileStickyCTA = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const nearFooter = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 320;
      setVisible(!nearFooter);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="sticky-cta">
      <div className="container pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-[520px] rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-[0_-8px_28px_rgba(15,23,42,0.16)] backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="min-h-[44px] px-3 py-2 text-[13px]"
              href="tel:+33651224213"
              onClick={() => trackCTA("sticky_call")}
            >
              Appeler
            </Button>
            <Button
              variant="secondary"
              href={CONFIG.CALENDLY_URL}
              onClick={() => trackRDV("sticky")}
              className="min-h-[44px] px-3 py-2 text-[13px]"
            >
              Prendre RDV
            </Button>
          </div>
          <a
            href="#contact"
            className="mt-2 inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-muted transition duration-200 hover:border-primary/40 hover:text-primary"
            onClick={() => trackCTA("sticky_contact_form")}
          >
            Me faire rappeler
          </a>
        </div>
      </div>
    </div>
  );
};
