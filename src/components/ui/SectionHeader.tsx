type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
};

export const SectionHeader = ({ kicker, title, subtitle }: Props) => (
  <div className="flex flex-col gap-2">
    {kicker && <span className="text-xs uppercase tracking-[0.12em] text-primary">{kicker}</span>}
    <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
    {subtitle && <p className="text-base text-muted max-w-2xl">{subtitle}</p>}
  </div>
);
