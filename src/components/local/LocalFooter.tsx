import Link from "next/link";

// Port fidèle de footer() dans maquettes/gp-finances-2026-09-22/generer.cjs.
export const LocalFooter = () => (
  <footer className="bg-ivory pb-6 pt-14">
    <div className="container grid gap-10 border-b border-localBorder pb-9 lg:grid-cols-[1.4fr_1fr_1fr]">
      <div>
        <Link href="/" className="mb-4 flex items-center gap-2.5 text-[15px] font-bold text-localInk">
          <span className="grid h-[42px] w-[39px] place-items-center rounded-[10px] bg-midnight font-localSerif text-[21px] font-medium text-white">
            GP
          </span>
          <span>
            GP <b className="font-semibold text-gold">FINANCES</b>
          </span>
        </Link>
        <p className="max-w-xs text-sm leading-relaxed text-localMuted">
          Assurance, épargne et financement.
          <br />
          Un interlocuteur pour vos projets.
        </p>
      </div>
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.085em] text-localMuted">
          Nos expertises
        </span>
        <div className="mt-3 flex flex-col gap-2.5 text-sm text-localInk">
          <Link href="/assurance-emprunteur" className="hover:text-gold">
            Assurance emprunteur
          </Link>
          <Link href="/per-retraite" className="hover:text-gold">
            PER & Retraite
          </Link>
          <Link href="/assurance-vie" className="hover:text-gold">
            Assurance-Vie
          </Link>
          <Link href="/assurance-emprunteur/hauts-de-seine" className="hover:text-gold">
            Assurance de prêt dans le 92
          </Link>
        </div>
      </div>
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.085em] text-localMuted">
          Échangeons
        </span>
        <div className="mt-3 flex flex-col gap-2.5 text-sm text-localInk">
          <a href="tel:+33651224213" className="font-semibold hover:text-gold">
            06 51 22 42 13
          </a>
          <a href="mailto:gabriel.perbost@gp-finances.fr" className="hover:text-gold">
            gabriel.perbost@gp-finances.fr
          </a>
          <p className="text-localMuted">
            24 rue du Gouverneur Général Éboué
            <br />
            92130 Issy-les-Moulineaux
            <br />
            Sur rendez-vous, au cabinet ou en visio partout en France.
          </p>
        </div>
      </div>
    </div>
    <div className="container flex flex-col gap-4 pt-5 text-[10px] text-localMuted sm:flex-row sm:items-center sm:justify-between">
      <p>© {new Date().getFullYear()} GP FINANCES · ORIAS 23003789 · RCS Nanterre 899 363 907</p>
      <div className="flex flex-wrap gap-5">
        <Link href="/mentions-legales" className="hover:text-gold">
          Mentions légales
        </Link>
        <Link href="/politique-de-confidentialite" className="hover:text-gold">
          Politique de confidentialité
        </Link>
      </div>
    </div>
  </footer>
);
