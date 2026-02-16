"use client";

import { useEffect, useState } from "react";
import { HERO_COPY, CONFIG } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LazyVideo } from "@/components/video/LazyVideo";
import { trackCTA, trackRDV } from "@/lib/tracking";
import heroPoster from "@/components/video/video1.webp";

type Props = {
  onHeroProgress: (pct: number) => void;
  highlightRDV?: boolean;
};

export const Hero = ({ onHeroProgress, highlightRDV = false }: Props) => {
  // SEO note: keep ONE deterministic H1 with a keyword-rich default (no empty badge, no duplicate copy).
  // You can still randomize among headlines as long as every option stays keyword-rich.
  const [headline, setHeadline] = useState(HERO_COPY.headlines[0]);

  useEffect(() => {
    if (HERO_COPY.headlines.length > 1) {
      const idx = Math.floor(Math.random() * HERO_COPY.headlines.length);
      setHeadline(HERO_COPY.headlines[idx]);
    }
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      aria-label="Renégociation assurance emprunteur"
    >
      <div className="container grid gap-8 py-10 lg:grid-cols-2 lg:items-center">
        {/* LEFT */}
        <div className="flex flex-col gap-5">
        {/* H1 + subtitle (SEO: keyword in H1 + supportive H2-ish paragraph) */}
        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl">
            {headline}
          </h1>

            <p className="max-w-xl text-base text-muted sm:text-lg">
              {HERO_COPY.subtitle}
            </p>
          </header>

          {/* Benefits (SEO: keep real text, avoid fluff; mobile-friendly) */}
          <ul className="grid grid-cols-1 gap-2 text-sm text-ink">
            {HERO_COPY.bullets.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* CTA row */}
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Button
              variant={highlightRDV ? "secondary" : "primary"}
              href="tel:+33651224213"
              className="w-full sm:w-auto"
              onClick={() => trackCTA("hero_call")}
              aria-label="Appeler Gabriel pour renégocier mon assurance emprunteur"
            >
              J'appelle
            </Button>

            <Button
              variant={highlightRDV ? "primary" : "secondary"}
              href={CONFIG.CALENDLY_URL}
              className="w-full sm:w-auto"
              onClick={() => trackRDV("hero")}
              aria-label="Prendre rendez-vous pour renégocier mon assurance de prêt"
            >
              Prendre RDV
            </Button>
            <Button
              variant="secondary"
              href="#contact"
              className="w-full sm:w-auto"
              onClick={() => trackCTA("hero_contact_form")}
              aria-label="Demander à être rappelé via formulaire"
            >
              Me faire rappeler
            </Button>
          </div>

        </div>

        {/* RIGHT */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              Étape 1 · Regarder
            </p>

            <div className="mx-auto w-full max-w-[340px] aspect-[9/16] overflow-hidden rounded-xl sm:max-w-none sm:aspect-video">
              <LazyVideo
                id="hero"
                src={CONFIG.HERO_VIDEO_URL}
                poster={heroPoster.src}
                onProgress={onHeroProgress}
                fit="cover"
              />
            </div>

            <p className="mt-3 text-sm text-muted">
              Tout comprendre sur l'assurance de prêt en 2 minutes.
            </p>
          </Card>

          <Card className="border-primary/40 bg-gradient-to-br from-white to-blue-50 p-4 shadow-soft">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
              Étape 2 · Agir
            </p>

            <h2 className="text-lg font-semibold text-ink">
              Rendez-vous gratuit pour renégocier votre assurance de prêt
            </h2>

            <p className="mb-4 text-sm text-muted">
              Réponse en moins de 24h · Étude personnalisée · Sans engagement
            </p>

            <Button
              href={CONFIG.CALENDLY_URL}
              className="w-full"
              onClick={() => trackRDV("hero_card")}
              aria-label="Réserver un rendez-vous gratuit"
            >
              Prendre RDV
            </Button>

            <p className="mt-2 text-xs text-muted">
              Offert · Sans engagement · Données sécurisées
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};
