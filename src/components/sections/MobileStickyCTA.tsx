"use client";

import { Button } from "@/components/ui/Button";
import { CONFIG } from "@/content/site";
import { trackCTA, trackRDV } from "@/lib/tracking";
import { useEffect, useState } from "react";

export const MobileStickyCTA = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const nearFooter = document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 280;
      setVisible(!nearFooter);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="sticky-cta">
      <div className="container flex gap-3">
        <Button
          className="flex-1"
          href="tel:+33651224213"
          onClick={() => trackCTA("sticky_call")}
        >
          Appeler
        </Button>
        <Button
          variant="secondary"
          href={CONFIG.CALENDLY_URL}
          onClick={() => trackRDV("sticky")}
          className="flex-1"
        >
          Prendre RDV
        </Button>
        <a
          href="#contact"
          className="flex-1 text-center text-sm font-semibold text-primary underline-offset-4 hover:underline self-center"
          onClick={() => trackCTA("sticky_contact_form")}
        >
          Rappel
        </a>
      </div>
    </div>
  );
};
