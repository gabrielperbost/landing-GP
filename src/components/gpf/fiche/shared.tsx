"use client";
// Petits éléments communs aux onglets de la fiche client.
import type { GpfAppointment, GpfClient, GpfCompliance, GpfDocument, GpfDossier, GpfNote, GpfTask } from "@/lib/gpf/types";

export type FicheData = {
  client: GpfClient;
  dossiers: GpfDossier[];
  notes: GpfNote[];
  taches: GpfTask[];
  rdv: GpfAppointment[];
  conformite: GpfCompliance[];
  documents: GpfDocument[];
};

export const euro = (v: number | null | undefined, decimals = 0) =>
  v == null || Number.isNaN(Number(v))
    ? null
    : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(v));

export const frDate = (v: string | null | undefined) => (v ? new Date(v.length === 10 ? `${v}T00:00:00` : v).toLocaleDateString("fr-FR") : null);
export const frDateHeure = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

export function age(client: GpfClient): number | null {
  if (client.date_naissance) {
    const d = new Date(client.date_naissance + "T00:00:00");
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
    return a;
  }
  return client.annee_naissance ? new Date().getFullYear() - client.annee_naissance : null;
}

export const inputCls = "rounded-lg border px-3 py-2 text-sm w-full";

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-xs text-[var(--gpf-muted)] flex flex-col gap-1 ${className}`}>
      {label}
      {children}
    </label>
  );
}

export function Bloc({ titre, action, children, className = "" }: { titre: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-[var(--gpf-surface)] border border-[var(--gpf-border)] rounded-xl ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gpf-border-soft)]">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gpf-muted)]">{titre}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Vide({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-5 text-sm text-center text-[var(--gpf-subtle)]">{children}</p>;
}

export function BoutonOr({ children, onClick, disabled, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="rounded-full bg-[#CDAA5A] text-[#071c2c] text-xs font-semibold px-4 py-2 disabled:opacity-50 whitespace-nowrap">
      {children}
    </button>
  );
}

export function LienAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs text-[var(--gpf-muted)] hover:text-[var(--gpf-ink)]">
      {children}
    </button>
  );
}

/** Fenêtre latérale (panneau) commune aux formulaires de la fiche. */
export function Panneau({ titre, onClose, children }: { titre: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={onClose}>
      <div className="bg-[var(--gpf-surface)] w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--gpf-border-soft)] sticky top-0 bg-[var(--gpf-surface)] z-10">
          <h3 className="text-base font-semibold text-[var(--gpf-ink)]">{titre}</h3>
          <button onClick={onClose} className="text-[var(--gpf-muted)] w-8 h-8" aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined
  }).catch(() => null);
  const data = await res?.json().catch(() => null);
  return { ok: Boolean(res?.ok && data?.ok !== false), status: res?.status ?? 0, data };
}
