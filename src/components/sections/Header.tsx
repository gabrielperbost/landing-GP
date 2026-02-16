"use client";

import { Button } from "@/components/ui/Button";
import { trackCTA, trackRDV } from "@/lib/tracking";
import { CONFIG } from "@/content/site";
import { useEffect, useState } from "react";
import Image from "next/image";
import avatar from "@/components/video/image1.webp";

type Props = {
  highlightRDV: boolean;
};

const siteNavLinks = [
  { href: "#accueil", label: "Accueil" },
  { href: "#points-cles", label: "Points clés" },
  { href: "#cadre-legal", label: "Cadre légal" },
  { href: "#compteur-economies", label: "Compteur" },
  { href: "#accompagnement", label: "Mon rôle" },
  { href: "#avant-apres", label: "Avant / Après" },
  { href: "#process-gp", label: "Process" },
  { href: "#avis-video", label: "Avis vidéo" },
  { href: "#reels-clients", label: "Reels clients" },
  { href: "#faq", label: "FAQ" },
  { href: "#estimation", label: "Estimation" }
];

export const Header = ({ highlightRDV }: Props) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 transition ${
        scrolled ? "shadow-soft" : ""
      }`}
    >
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-white/60 shadow-soft">
            <Image
              src={avatar}
              alt="Portrait Gabriel Perbost"
              width={40}
              height={40}
              className="h-full w-full object-cover object-top"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Gabriel Perbost</p>
            <p className="text-xs text-muted">GP Finances · Courtier indépendant</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink shadow-soft sm:hidden"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-site-nav"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="sr-only">Menu</span>
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <div className="hidden gap-3 sm:flex">
          <Button
            variant={highlightRDV ? "secondary" : "primary"}
            href="tel:+33651224213"
            onClick={() => trackCTA("header_call")}
          >
            Appeler le 06 51 22 42 13
          </Button>
          <Button
            variant={highlightRDV ? "primary" : "secondary"}
            href={CONFIG.CALENDLY_URL}
            onClick={() => trackRDV("header")}
          >
            Prendre RDV
          </Button>
        </div>
      </div>
      {menuOpen && (
        <div className="sm:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-[60] bg-slate-900/35 backdrop-blur-[1px]"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="mobile-site-nav"
            aria-label="Navigation mobile"
            className="fixed inset-x-3 top-[66px] z-[70] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.2)]"
          >
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              Navigation rapide
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {siteNavLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-ink transition hover:border-primary/40 hover:text-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant={highlightRDV ? "secondary" : "primary"}
                href="tel:+33651224213"
                onClick={() => {
                  trackCTA("header_call_mobile");
                  setMenuOpen(false);
                }}
                className="min-h-[42px] px-3 py-2 text-xs"
              >
                Appeler
              </Button>
              <Button
                variant={highlightRDV ? "primary" : "secondary"}
                href={CONFIG.CALENDLY_URL}
                onClick={() => {
                  trackRDV("header_mobile");
                  setMenuOpen(false);
                }}
                className="min-h-[42px] px-3 py-2 text-xs"
              >
                Prendre RDV
              </Button>
            </div>
          </nav>
        </div>
      )}
      <nav className="hidden border-t border-slate-200/80 bg-white/75 lg:block" aria-label="Navigation principale">
        <div className="container flex items-center gap-1 overflow-x-auto py-2">
          {siteNavLinks.map((item) => (
            <a
              key={`desktop-${item.href}`}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-slate-100 hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
};
