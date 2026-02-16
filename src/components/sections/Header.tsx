"use client";

import { Button } from "@/components/ui/Button";
import { trackCTA, trackRDV } from "@/lib/tracking";
import { CONFIG } from "@/content/site";
import { useEffect, useState } from "react";
import Image from "next/image";
import avatar from "@/components/video/image1.webp";

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
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white/60 shadow-soft">
            <Image
              src={avatar}
              alt="Portrait Gabriel Perbost"
              width={40}
              height={40}
              className="h-full w-full object-cover object-top"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Gabriel Perbost</p>
            <p className="text-xs text-muted">GP Finances · Courtier indépendant</p>
          </div>
        </div>
        <div className="hidden gap-3 sm:flex">
          <Button
            variant={highlightRDV ? "secondary" : "primary"}
            href="tel:+33651224213"
            onClick={() => trackCTA("header_call")}
          >
            Appeler le 06 51 22 42 13
          </Button>
          <Button
            variant={highlightRDV ? "primary" : "secondary"}
            href={CONFIG.CALENDLY_URL}
            onClick={() => trackRDV("header")}
          >
            Prendre RDV
          </Button>
        </div>
      </div>
    </header>
  );
};
