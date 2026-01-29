import { LEGAL } from "@/content/site";

export const Footer = () => (
  <footer className="bg-white border-t border-slate-200 mt-12" id="mentions-legales">
    <div className="container py-8 grid gap-3 md:grid-cols-3 text-sm text-muted">
      <div>
        <p className="font-semibold text-ink">{LEGAL.company}</p>
        <p>{LEGAL.status}</p>
      </div>
      <div className="space-y-1">
        <p>{LEGAL.rcs}</p>
        <p>ORIAS {LEGAL.orias}</p>
        <p>Siège social : {LEGAL.hq}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {LEGAL.links.map((link) => (
          <a key={link.label} href={link.href} className="text-primary hover:underline">
            {link.label}
          </a>
        ))}
      </div>
    </div>
  </footer>
);
