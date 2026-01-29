import clsx from "clsx";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "info" | "success" | "neutral";
  className?: string;
};

const tones = {
  info: "bg-blue-50 text-blue-700 border border-blue-100",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  neutral: "bg-slate-50 text-slate-700 border border-slate-200"
};

export const Badge = ({ children, tone = "info", className }: BadgeProps) => (
  <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", tones[tone], className)}>
    {children}
  </span>
);
