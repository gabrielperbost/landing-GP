"use client";

import { useMemo } from "react";
import { HERO_COPY, CONFIG } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LazyVideo } from "@/components/video/LazyVideo";
import { trackCTA, trackRDV } from "@/lib/tracking";

type Props = {
  onHeroProgress: (pct: number) => void;
  highlightRDV?: boolean;
};

export const Hero = ({ onHeroProgress, highlightRDV = false }: Props) => {
  const headline = useMemo(() => {
    const idx = Math.floor(Math.random() * HERO_COPY.headlines.length);
    return HERO_COPY.headlines[idx];
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="container grid gap-8 py-12 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-6">
          <Badge tone="info" className="w-fit">
            Jusqu’à 23 000 € d’économies possibles
          </Badge>
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-5xl">{headline}</h1>
            <p className="text-lg text-muted">{HERO_COPY.subtitle}</p>
            <ul className="grid grid-cols-1 gap-2 text-sm text-ink sm:grid-cols-2">
              {HERO_COPY.bullets.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={highlightRDV ? "secondary" : "primary"}
              href="#estimation"
              onClick={() => trackCTA("hero_estimation")}
            >
              Estimer mes économies
            </Button>
            <Button
              variant={highlightRDV ? "primary" : "secondary"}
              href={CONFIG.CALENDLY_URL}
              onClick={() => trackRDV("hero")}
            >
              Prendre RDV
            </Button>
          </div>
          <p className="text-sm text-muted">{HERO_COPY.microcopy}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Étape 1 · Regarder</p>
            <div className="aspect-video overflow-hidden rounded-xl">
              <LazyVideo id="hero" src={CONFIG.HERO_VIDEO_URL} onProgress={onHeroProgress} />
            </div>
            <p className="mt-3 text-sm text-muted">Comprenez en 90s pourquoi la loi Lemoine vous permet d’économiser.</p>
          </Card>

          <Card className="p-4 border-primary/40 shadow-soft bg-gradient-to-br from-white to-blue-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Étape 2 · Agir</p>
            <h3 className="text-lg font-semibold text-ink">Planifiez votre rendez-vous</h3>
            <p className="text-sm text-muted mb-4">Un expert vous répond en moins de 24h.</p>
            <Button
              href={CONFIG.CALENDLY_URL}
              className="w-full"
              onClick={() => trackRDV("hero_card")}
            >
              Prendre RDV
            </Button>
            <p className="mt-2 text-xs text-muted">Offert · Sans engagement · Données sécurisées</p>
          </Card>
        </div>
      </div>
    </section>
  );
};
