import clsx from "clsx";
import { ReactNode } from "react";

export type Tone = "success" | "warning" | "info" | "neutral";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

type SectionCardProps = {
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
};

type StatusPillProps = {
  tone?: Tone;
  children: ReactNode;
};

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-slate-100 text-slate-700"
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-700">{description}</p>
      {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}

export function SectionCard({ title, description, className, children }: SectionCardProps) {
  return (
    <article className={clsx("rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm sm:p-8", className)}>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}

export function StatusPill({ tone = "neutral", children }: StatusPillProps) {
  return <span className={clsx("rounded-full px-2.5 py-1 text-xs font-semibold", toneClasses[tone])}>{children}</span>;
}

export function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
