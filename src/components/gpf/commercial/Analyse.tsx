"use client";
import { useEffect, useState } from "react";
import { SkeletonLines } from "@/components/gpf/Skeleton";
import { Bloc, Vide } from "@/components/gpf/fiche/shared";

type Donnees = {
  total: number;
  signes: number;
  conversionGlobale: number;
  etapes: { label: string; atteint: number; passage: number | null; delaiMoyenJours: number | null }[];
  sources: { source: string; total: number; signes: number; perdus: number; conversion: number }[];
  motifs: { motif: string; n: number }[];
};

export function Analyse() {
  const [d, setD] = useState<Donnees | null>(null);
  useEffect(() => {
    fetch("/api/gpf/commercial/analyse")
      .then((r) => r.json())
      .then((x) => x.ok && setD(x));
  }, []);
  if (!d) return <SkeletonLines rows={8} />;

  const maxAtteint = Math.max(1, ...d.etapes.map((e) => e.atteint));
  const maxMotif = Math.max(1, ...d.motifs.map((m) => m.n));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Affaires analysées", String(d.total)],
          ["Signées", String(d.signes)],
          ["Conversion globale", `${d.conversionGlobale} %`]
        ].map(([l, v]) => (
          <div key={l} className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] border-t-2 rounded-xl p-4" style={{ borderTopColor: "#CDAA5A" }}>
            <div className="text-xs text-[var(--gpf-muted)]">{l}</div>
            <div className="text-2xl font-semibold tabular-nums text-[var(--gpf-ink)] mt-1">{v}</div>
          </div>
        ))}
      </div>

      <Bloc titre="Entonnoir : passage d'une étape à l'autre">
        <div className="p-4 flex flex-col gap-2">
          {d.etapes.map((e) => (
            <div key={e.label} className="grid grid-cols-[170px_1fr_70px_90px] gap-3 items-center text-sm">
              <span className="text-[var(--gpf-ink)] truncate">{e.label}</span>
              <div className="h-5 rounded bg-[var(--gpf-fill)] overflow-hidden">
                <div className="h-full bg-[#CDAA5A]" style={{ width: `${(e.atteint / maxAtteint) * 100}%` }} />
              </div>
              <span className="text-xs text-[var(--gpf-muted)] tabular-nums text-right">{e.atteint}</span>
              <span className="text-xs text-[var(--gpf-muted)] text-right">
                {e.passage != null ? `→ ${e.passage} %` : ""}
                {e.delaiMoyenJours != null ? <span className="block text-[10px] text-[var(--gpf-subtle)]">{e.delaiMoyenJours} j en moyenne</span> : null}
              </span>
            </div>
          ))}
          <p className="text-[11px] text-[var(--gpf-subtle)] mt-2">
            Les délais moyens se calculent à partir de l&apos;historique des changements d&apos;étape, enregistré depuis la mise en service du CRM.
          </p>
        </div>
      </Bloc>

      <div className="grid lg:grid-cols-2 gap-4">
        <Bloc titre="Conversion par source">
          {d.sources.length === 0 ? (
            <Vide>Aucune donnée.</Vide>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[var(--gpf-subtle)] border-b border-[var(--gpf-border-soft)]">
                  <th className="text-left font-normal px-4 py-2">Source</th>
                  <th className="text-right font-normal px-2 py-2">Affaires</th>
                  <th className="text-right font-normal px-2 py-2">Signées</th>
                  <th className="text-right font-normal px-4 py-2">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {d.sources.map((s) => (
                  <tr key={s.source} className="border-b border-[var(--gpf-border-soft)] last:border-0">
                    <td className="px-4 py-2 text-[var(--gpf-ink)]">{s.source}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-[var(--gpf-muted)]">{s.total}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-[var(--gpf-muted)]">{s.signes}</td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium text-[var(--gpf-ink)]">{s.conversion} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Bloc>

        <Bloc titre="Motifs de perte">
          {d.motifs.length === 0 ? (
            <Vide>Aucune affaire perdue.</Vide>
          ) : (
            <div className="p-4 flex flex-col gap-2">
              {d.motifs.map((m) => (
                <div key={m.motif} className="grid grid-cols-[150px_1fr_40px] gap-3 items-center text-sm">
                  <span className="text-[var(--gpf-ink)] truncate">{m.motif}</span>
                  <div className="h-4 rounded bg-[var(--gpf-fill)] overflow-hidden">
                    <div className="h-full bg-[#b3463f]" style={{ width: `${(m.n / maxMotif) * 100}%` }} />
                  </div>
                  <span className="text-xs text-[var(--gpf-muted)] tabular-nums text-right">{m.n}</span>
                </div>
              ))}
              <p className="text-[11px] text-[var(--gpf-subtle)] mt-1">Le motif est obligatoire pour toute nouvelle perte ; les anciens refus importés de Monday apparaissent en « Non renseigné ».</p>
            </div>
          )}
        </Bloc>
      </div>
    </div>
  );
}
