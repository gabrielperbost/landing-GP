"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CONFIG } from "@/content/site";

type CounterPayload = {
  value: number;
};

const START_VALUE = 3_058_072;

const formatEuro = (value: number) => `${Math.round(value).toLocaleString("fr-FR")} €`;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export const SavingsCounter = () => {
  const [targetValue, setTargetValue] = useState(START_VALUE);
  const [displayValue, setDisplayValue] = useState(START_VALUE);

  useEffect(() => {
    let active = true;

    const fetchCounter = async () => {
      try {
        const response = await fetch("/api/savings-counter", { cache: "no-store" });
        if (!response.ok) throw new Error("counter-fetch-failed");

        const payload = (await response.json()) as CounterPayload;
        if (!active || typeof payload.value !== "number") return;

        setTargetValue(Math.max(START_VALUE, Math.round(payload.value)));
      } catch {
        if (active) setTargetValue(START_VALUE);
      }
    };

    fetchCounter();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const from = Math.max(START_VALUE, targetValue - 8_000);
    const to = targetValue;

    if (from === to) {
      setDisplayValue(to);
      return;
    }

    const durationMs = 900;
    let frame = 0;
    let startedAt = 0;

    const tick = (ts: number) => {
      if (!startedAt) startedAt = ts;
      const progress = Math.min((ts - startedAt) / durationMs, 1);
      const eased = easeOutCubic(progress);
      setDisplayValue(Math.round(from + (to - from) * eased));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [targetValue]);

  return (
    <section id="compteur-economies" className="container scroll-mt-24 py-7" aria-label="Compteur global des économies clients">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-white via-blue-50/85 to-cyan-50/80 p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/90">Compteur global</p>
            <p className="mt-1 text-sm font-semibold text-ink sm:text-base">
              Déjà économisés par les clients GP Finances
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary tabular-nums sm:text-4xl" aria-live="polite">
              {formatEuro(displayValue)}
            </p>
            <p className="mt-1 text-xs text-muted">Vous pouvez être le prochain à réduire votre assurance de prêt.</p>
          </div>
          <a
            href={CONFIG.CALENDLY_URL}
            className="inline-flex w-full items-center justify-center rounded-full border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-primary transition duration-200 hover:border-primary hover:bg-blue-50 sm:w-auto"
          >
            Estimez vos économies gratuitement
          </a>
        </div>
      </Card>
    </section>
  );
};
