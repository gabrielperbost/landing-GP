import type { CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BEFORE_AFTER } from "@/content/site";

const parseAmount = (value: string) => Number(value.replace(/[^\d]/g, ""));
const formatAmount = (value: number) => `${value.toLocaleString("fr-FR")} €`;

const oldAmount = parseAmount(BEFORE_AFTER.oldCost);
const newAmount = parseAmount(BEFORE_AFTER.newCost);
const savingsAmount = Math.max(oldAmount - newAmount, 0);
const reductionPct = oldAmount > 0 ? Math.round((savingsAmount / oldAmount) * 100) : 0;
const newBarRatio = oldAmount > 0 ? Math.max(Math.round((newAmount / oldAmount) * 100), 14) : 50;

const oldBarStyle = { width: "100%" } as CSSProperties;
const newBarStyle = {
  width: `${newBarRatio}%`,
  animationDelay: "130ms"
} as CSSProperties;

export const BeforeAfter = () => (
  <section id="avant-apres" className="container scroll-mt-24 py-12 space-y-8">
    <SectionHeader
      kicker="Avant / Après"
      title="Visualisez clairement le gain sur votre assurance de prêt"
      subtitle="Exemple concret sur un dossier réel : mêmes garanties, coût total fortement réduit."
    />
    <Card className="overflow-hidden border-slate-200">
      <div className="grid gap-4 p-4 sm:gap-5 sm:p-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-3">
          <p className="inline-flex rounded-full border border-primary/20 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-primary">
            Cas client concret
          </p>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-rose-700/90">Avant</p>
            <p className="mt-1 text-sm font-medium text-rose-800">{BEFORE_AFTER.oldLabel}</p>
            <p className="mt-2 text-3xl font-bold text-rose-700">{BEFORE_AFTER.oldCost}</p>
            <p className="mt-1 text-xs text-rose-800/80">Coût total estimé sur la durée du prêt</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700/90">Après</p>
            <p className="mt-1 text-sm font-medium text-emerald-800">{BEFORE_AFTER.newLabel}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{BEFORE_AFTER.newCost}</p>
            <p className="mt-1 text-xs text-emerald-800/80">Équivalence de garanties conservée</p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Économie réalisée</p>
            <p className="mt-1 text-4xl font-extrabold text-primary animate-float">{formatAmount(savingsAmount)}</p>
            <p className="mt-1 text-xs text-muted">Soit environ {reductionPct}% de baisse du coût total.</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink">Comparatif visuel</p>
          <p className="mt-1 text-xs text-muted">Plus la barre est longue, plus le coût est élevé.</p>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
                <span>Avant (banque)</span>
                <span>{BEFORE_AFTER.oldCost}</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-rose-100">
                <div
                  className="h-full origin-left rounded-full bg-rose-500 animate-[before-after-grow_900ms_ease-out_forwards]"
                  style={oldBarStyle}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>Après (GP Finances)</span>
                <span>{BEFORE_AFTER.newCost}</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-emerald-100">
                <div
                  className="h-full origin-left rounded-full bg-emerald-500 animate-[before-after-grow_900ms_ease-out_forwards]"
                  style={newBarStyle}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700">Différence</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">-{formatAmount(savingsAmount)}</p>
            <p className="text-xs text-emerald-800">sur la durée totale du prêt</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Mêmes garanties
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Démarches prises en charge
            </span>
          </div>
        </div>
      </div>
    </Card>
  </section>
);
