"use client";

import { useState } from "react";
import Link from "next/link";

// Port fidèle de header() dans maquettes/gp-finances-2026-09-22/generer.cjs :
// même logo, mêmes libellés de nav (s.short), même téléphone, même bouton doré,
// même repli en menu hamburger sous le breakpoint desktop.
const NAV_ITEMS = [
  { href: "/assurance-emprunteur", label: "Assurance emprunteur" },
  { href: "/per-retraite", label: "PER & Retraite" },
  { href: "/assurance-vie", label: "Assurance-Vie" },
  { href: "/prevoyance", label: "Prévoyance" },
  { href: "/mutuelle", label: "Mutuelle" },
  { href: "/regroupement-credits", label: "Regroupement de crédits" },
  { href: "/conseils", label: "Conseils" }
];

export const LocalHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-ivory/[.97] backdrop-blur-[14px]">
      <div className="container flex h-[78px] items-center justify-between gap-5 sm:h-[91px]">
        <Link
          href="/"
          aria-label="GP Finances, accueil"
          className="flex items-center gap-2.5 whitespace-nowrap text-[15px] font-bold tracking-[-0.035em] text-localInk"
        >
          <span className="grid h-[42px] w-[39px] place-items-center rounded-[10px] bg-midnight font-localSerif text-[21px] font-medium tracking-[-0.04em] text-white">
            GP
          </span>
          <span>
            GP <b className="font-semibold text-gold">FINANCES</b>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-[13px] text-[#52616e] transition-colors hover:text-midnight"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="tel:+33651224213"
            className="hidden whitespace-nowrap text-[12px] font-semibold text-localInk sm:block lg:hidden xl:block"
          >
            06 51 22 42 13
          </a>
          <a
            href="#estimation"
            className="hidden min-h-[45px] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gold px-5 text-[12px] font-semibold text-midnight transition hover:bg-[#d5b765] sm:inline-flex"
          >
            Prendre rendez-vous
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            className="grid h-[37px] w-[37px] flex-shrink-0 place-items-center rounded-[10px] border border-localBorder bg-white lg:hidden"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Navigation mobile" className="border-b border-localBorder bg-ivory px-6 pb-6 pt-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-localBorder py-3.5 text-[15px] text-localInk"
            >
              {item.label}
              <span aria-hidden>→</span>
            </Link>
          ))}
          <a
            href="#estimation"
            onClick={() => setOpen(false)}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-full bg-gold px-6 text-[13px] font-semibold text-midnight"
          >
            Prendre rendez-vous
          </a>
        </nav>
      )}
    </header>
  );
};
