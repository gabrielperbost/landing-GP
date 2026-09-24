import { LEGAL } from "@/content/site";
import Link from "next/link";

type FooterProps = {
  includeLoan92Link?: boolean;
};

export const Footer = ({ includeLoan92Link = true }: FooterProps) => (
  <footer className="bg-white border-t border-slate-200 mt-12" id="mentions-legales">
    <div className="container py-8 grid gap-3 md:grid-cols-3 text-sm text-muted">
      <div>
        <p className="font-semibold text-ink">{LEGAL.company}</p>
        <p>{LEGAL.status}</p>
      </div>
      <div className="space-y-1">
        <p>{LEGAL.rcs}</p>
        <p>{LEGAL.orias}</p>
        <p>Siège social : {LEGAL.hq}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {LEGAL.links.map((link) => (
          <a key={link.label} href={link.href} className="text-primary hover:underline">
            {link.label}
          </a>
        ))}
        {includeLoan92Link && (
          <Link href="/assurance-de-pret/hauts-de-seine" className="text-primary hover:underline">
            Assurance de prêt 92
          </Link>
        )}
      </div>
    </div>
  </footer>
);
