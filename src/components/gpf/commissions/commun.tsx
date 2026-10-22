"use client";
// Éléments communs aux écrans Commissions, Reporting et Compagnies.

export const eur = (v: number | null | undefined, decimals = 2) =>
  v == null || Number.isNaN(Number(v))
    ? "—"
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(v));

export const moisLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
};

export const pctLabel = (v: number | null | undefined) => (v == null ? "—" : `${String(v).replace(".", ",")} %`);

export function Onglets<T extends string>({ valeur, onChange, items }: { valeur: T; onChange: (v: T) => void; items: [T, string, number?][] }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
      {items.map(([key, label, n]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
            valeur === key ? "bg-[#CDAA5A] text-[#071c2c] border-transparent" : "text-[var(--gpf-muted)] border-[var(--gpf-border)] bg-[var(--gpf-surface)]"
          }`}
        >
          {label}
          {n != null ? ` (${n})` : ""}
        </button>
      ))}
    </div>
  );
}

export function Tuile({ label, valeur, accent, aide }: { label: string; valeur: string; accent?: string; aide?: string }) {
  return (
    <div className="bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)]">{label}</p>
      <p className="text-xl font-semibold mt-1" style={{ color: accent ?? "var(--gpf-ink)" }}>
        {valeur}
      </p>
      {aide ? <p className="text-[11px] text-[var(--gpf-subtle)] mt-1">{aide}</p> : null}
    </div>
  );
}

/** Tableau simple, défilant horizontalement sur mobile. */
export function Tableau({ entetes, children, alignDroite = [] }: { entetes: string[]; children: React.ReactNode; alignDroite?: number[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-[var(--gpf-muted)] border-b border-[var(--gpf-border-soft)]">
            {entetes.map((h, i) => (
              <th key={h + i} className={`px-4 py-2.5 font-medium whitespace-nowrap ${alignDroite.includes(i) ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[var(--gpf-ink)]">{children}</tbody>
      </table>
    </div>
  );
}

export const tdCls = "px-4 py-2.5 border-b border-[var(--gpf-border-soft)] whitespace-nowrap";
export const tdNum = `${tdCls} text-right tabular-nums`;

/** Barres doubles (attendu / encaissé) en SVG, sans bibliothèque. */
export function Barres({ donnees, series }: { donnees: { label: string; valeurs: number[] }[]; series: { nom: string; couleur: string }[] }) {
  const max = Math.max(1, ...donnees.flatMap((d) => d.valeurs));
  const h = 160;
  const largeur = Math.max(320, donnees.length * 48);
  const bw = 14;
  return (
    <div className="overflow-x-auto">
      <svg width={largeur} height={h + 28} className="block">
        {donnees.map((d, i) => (
          <g key={d.label} transform={`translate(${i * 48 + 8}, 0)`}>
            {d.valeurs.map((v, j) => {
              const bh = Math.round((Math.max(0, v) / max) * h);
              return <rect key={j} x={j * (bw + 2)} y={h - bh} width={bw} height={bh} rx={2} fill={series[j].couleur} />;
            })}
            <text x={series.length * (bw + 2) / 2} y={h + 16} textAnchor="middle" fontSize="10" fill="var(--gpf-muted)">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex gap-4 mt-1">
        {series.map((s) => (
          <span key={s.nom} className="flex items-center gap-1.5 text-[11px] text-[var(--gpf-muted)]">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.couleur }} />
            {s.nom}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Export CSV (séparateur point-virgule, lisible par Excel en français). */
export function exporterCsv(nom: string, entetes: string[], lignes: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? "" : typeof v === "number" ? String(v).replace(".", ",") : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + [entetes, ...lignes].map((l) => l.map(cell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}
