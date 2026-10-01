import Link from "next/link";
import { CONFIG, BEFORE_AFTER, FAQ_ITEMS } from "@/content/site";
import type { VilleData } from "@/content/villes/types";
import { nonBreakingName } from "@/lib/text";

const euro = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " €";

// Boutons : port fidèle de .button/.button-gold/.button-outline
// (maquettes/gp-finances-2026-09-22/styles.css) — pilule, min-height 52-55px,
// 13px/600, bg doré texte navy pour le CTA principal.
const buttonGold =
  "inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-gold px-6 text-[13px] font-semibold text-midnight transition hover:bg-[#d5b765]";
const buttonOutline =
  "inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full border border-[#c7cdd0] px-6 text-[13px] font-semibold text-midnight transition hover:border-midnight hover:bg-white";

/* 1. Hero ------------------------------------------------------------- */
export const LocalHero = ({ ville }: { ville: VilleData }) => (
  <section className="bg-ivory">
    <div className="container grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
      <div>
        <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.07em] text-[#9b7b2e]">
          <span className="h-px w-6 bg-gold" />
          Assurance emprunteur · {nonBreakingName(ville.nom)}
        </p>
        <h1 className="font-localSerif text-[clamp(34px,5vw,56px)] font-medium leading-[1.12] text-midnight">
          Changer d’assurance de prêt à <em className="not-italic text-[#9b7b2e]">{nonBreakingName(ville.nom)}</em>.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-[1.75] text-localMuted sm:text-lg">
          Sans changer de banque, à garanties équivalentes, grâce à la loi Lemoine. Je m’occupe des démarches ;
          vous gardez le même crédit.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href={CONFIG.CALENDLY_URL} target="_blank" rel="noreferrer" className={buttonGold}>
            Prendre rendez-vous
          </a>
          <a href="#estimation" className={buttonOutline}>
            Estimer mon économie
          </a>
        </div>
      </div>
      <div className="rounded-2xl border border-localBorder bg-midnight p-7 text-white sm:p-9">
        <p className="text-xs uppercase tracking-[0.1em] text-goldLight">{nonBreakingName(ville.nom)}, en bref</p>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-white/85">
          <li>
            <span className="text-white/55">Quartiers : </span>
            {ville.quartiers.slice(0, 4).join(", ")}
          </li>
          {ville.population && (
            <li>
              <span className="text-white/55">Population : </span>
              {new Intl.NumberFormat("fr-FR").format(ville.population.valeur)} habitants
            </li>
          )}
          {ville.prixM2.appartements && (
            <li>
              <span className="text-white/55">Prix médian appartement : </span>
              {euro(ville.prixM2.appartements.valeur)}/m²
            </li>
          )}
        </ul>
      </div>
    </div>
  </section>
);

/* 2. Bloc local --------------------------------------------------------- */
export const LocalMarketBlock = ({ ville }: { ville: VilleData }) => (
  <section id="marche-local" className="bg-white py-14 sm:py-[74px]">
    <div className="container grid gap-10 lg:grid-cols-2">
      <div>
        <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.07em] text-[#9b7b2e]">
          <span className="h-px w-6 bg-gold" />
          Le marché local
        </p>
        <h2 className="font-localSerif text-[clamp(28px,3vw,36px)] font-medium text-midnight">
          Le marché immobilier à {nonBreakingName(ville.nom)}
        </h2>
        <p className="mt-4 text-sm leading-[1.8] text-localMuted sm:text-base">{ville.profilImmobilier}</p>
        <p className="mt-4 text-sm leading-[1.8] text-localMuted sm:text-base">{ville.profilEmprunteurs}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 self-start">
        {ville.prixM2.appartements && (
          <div className="rounded-[14px] border border-localBorder bg-goldPale p-5">
            <p className="font-localSerif text-2xl font-medium text-midnight">
              {euro(ville.prixM2.appartements.valeur)}
            </p>
            <p className="mt-1 text-xs text-localMuted">Prix médian /m², appartements</p>
          </div>
        )}
        {ville.prixM2.maisons && (
          <div className="rounded-[14px] border border-localBorder bg-goldPale p-5">
            <p className="font-localSerif text-2xl font-medium text-midnight">{euro(ville.prixM2.maisons.valeur)}</p>
            <p className="mt-1 text-xs text-localMuted">Prix médian /m², maisons</p>
          </div>
        )}
        {ville.population && (
          <div className="col-span-2 rounded-[14px] border border-localBorder bg-bluePale p-5">
            <p className="font-localSerif text-2xl font-medium text-midnight">
              {new Intl.NumberFormat("fr-FR").format(ville.population.valeur)} habitants
            </p>
            <p className="mt-1 text-xs text-localMuted">
              Source : {ville.population.source}, données {ville.population.date}
            </p>
          </div>
        )}
      </div>
    </div>
  </section>
);

/* 3. Ce que dit la loi (Lemoine) ----------------------------------------- */
const LEMOINE_CARDS = [
  {
    title: "À tout moment",
    body: "Depuis 2022, vous pouvez changer d’assurance de prêt quand vous le souhaitez, sans attendre une date anniversaire."
  },
  {
    title: "Sans frais, mêmes garanties",
    body: "Le changement est gratuit et la banque ne peut pas modifier le taux de votre crédit. Elle doit répondre sous 10 jours ouvrés."
  },
  {
    title: "Questionnaire de santé supprimé",
    body: "Sous conditions (part assurée ≤ 200 000 € par personne, fin du prêt avant 60 ans), plus besoin de répondre à un questionnaire médical."
  }
];

export const LemoineCards = () => (
  <section id="loi-lemoine" className="bg-ivory py-14 sm:py-[74px]">
    <div className="container">
      <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.07em] text-[#9b7b2e]">
        <span className="h-px w-6 bg-gold" />
        Ce que dit la loi
      </p>
      <h2 className="font-localSerif text-[clamp(28px,3vw,36px)] font-medium text-midnight">
        La loi Lemoine, en 3 points
      </h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {LEMOINE_CARDS.map((card) => (
          <div key={card.title} className="rounded-[18px] border border-localBorder bg-white p-6 shadow-[0_2px_3px_#0d1f3c03]">
            <h3 className="font-localSerif text-lg font-medium text-midnight">{card.title}</h3>
            <p className="mt-2 text-sm leading-[1.7] text-localMuted">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* 4. Avant / après (exemple réel, non spécifique à la ville) ------------ */
export const LocalBeforeAfter = () => (
  <section id="avant-apres" className="bg-white py-14 sm:py-[74px]">
    <div className="container">
      <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.07em] text-[#9b7b2e]">
        <span className="h-px w-6 bg-gold" />
        Un exemple réel
      </p>
      <h2 className="font-localSerif text-[clamp(28px,3vw,36px)] font-medium text-midnight">
        Ce que ça change, concrètement
      </h2>
      <div className="mt-7 grid gap-4 rounded-2xl border border-localBorder bg-ivory p-7 sm:grid-cols-3 sm:p-9">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-localMuted">{BEFORE_AFTER.oldLabel}</p>
          <p className="mt-2 font-localSerif text-3xl font-medium text-localMuted line-through decoration-localMuted/40">
            {BEFORE_AFTER.oldCost}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-localMuted">{BEFORE_AFTER.newLabel}</p>
          <p className="mt-2 font-localSerif text-3xl font-medium text-midnight">{BEFORE_AFTER.newCost}</p>
        </div>
        <div className="rounded-xl bg-midnight p-5 text-white">
          <p className="text-xs uppercase tracking-[0.08em] text-goldLight">Économie</p>
          <p className="mt-2 font-localSerif text-3xl font-medium">{BEFORE_AFTER.savings}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-localMuted">
        Exemple issu d’un dossier client réel de GP Finances. Le résultat dépend de chaque situation (capital,
        âge, durée restante, état de santé).
      </p>
    </div>
  </section>
);

/* 5. Process -------------------------------------------------------------- */
const STEPS = [
  { n: "1", title: "On regarde votre contrat", body: "Vous m’envoyez votre offre de prêt et votre assurance actuelle. J’identifie les postes de surcoût." },
  { n: "2", title: "Je compare et je prépare le dossier", body: "Je mets en concurrence des contrats à garanties équivalentes ou supérieures, et je prépare le dossier de substitution." },
  { n: "3", title: "Je m’occupe de la banque", body: "J’envoie la demande à votre banque et je suis le dossier jusqu’à la confirmation du changement." }
];

export const LocalProcess = () => (
  <section id="process" className="bg-ivory py-14 sm:py-[74px]">
    <div className="container">
      <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.07em] text-[#9b7b2e]">
        <span className="h-px w-6 bg-gold" />
        Je m’occupe de tout
      </p>
      <h2 className="font-localSerif text-[clamp(28px,3vw,36px)] font-medium text-midnight">
        Trois étapes, de bout en bout
      </h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n}>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-gold font-localSerif text-base text-midnight">
              {step.n}
            </span>
            <h3 className="mt-4 font-localSerif text-lg font-medium text-midnight">{step.title}</h3>
            <p className="mt-2 text-sm leading-[1.8] text-localMuted">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* 6. Gabriel + proximité --------------------------------------------------- */
export const LocalAdvisor = ({ ville }: { ville: VilleData }) => (
  <section id="proximite" className="bg-midnight py-14 text-white sm:py-[74px]">
    <div className="container grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
      <div className="h-20 w-20 shrink-0 rounded-full bg-goldLight/20 ring-1 ring-goldLight/40" aria-hidden />
      <div>
        <p className="mb-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.07em] text-goldLight">
          <span className="h-px w-6 bg-gold" />
          Gabriel Perbost
        </p>
        <h2 className="font-localSerif text-[clamp(26px,3vw,34px)] font-medium">Courtier indépendant, ORIAS 23003789</h2>
        <p className="mt-4 max-w-2xl text-sm leading-[1.8] text-white/80 sm:text-base">{ville.accesBureau}</p>
      </div>
    </div>
  </section>
);

/* 7. Témoignages (réels, vidéos déjà présentes sur le site) --------------- */
const REAL_TESTIMONIALS = [
  { amount: "17 000 €", poster: "/videos/posters/Tem2-poster.png" },
  { amount: "14 100 €", poster: "/videos/posters/Tem4-poster.png" },
  { amount: "9 000 €", poster: "/videos/posters/Tem5-poster.png" }
];

export const LocalTestimonials = () => (
  <section id="temoignages" className="bg-white py-14 sm:py-[74px]">
    <div className="container">
      <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.07em] text-[#9b7b2e]">
        <span className="h-px w-6 bg-gold" />
        Ils l’ont fait
      </p>
      <h2 className="font-localSerif text-[clamp(28px,3vw,36px)] font-medium text-midnight">
        Des économies réelles, vérifiables
      </h2>
      <div className="mt-7 grid gap-5 sm:grid-cols-3">
        {REAL_TESTIMONIALS.map((t) => (
          <div key={t.amount} className="overflow-hidden rounded-2xl border border-localBorder">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.poster} alt="Témoignage client GP Finances" className="aspect-[9/16] w-full object-cover" />
            <div className="bg-ivory p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-localMuted">Économie constatée</p>
              <p className="font-localSerif text-xl font-medium text-midnight">{t.amount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* 8. FAQ : 2 locales + FAQ générale ---------------------------------------- */
export const LocalFAQSection = ({ ville }: { ville: VilleData }) => (
  <section id="faq" className="bg-ivory py-14 sm:py-[74px]">
    <div className="container">
      <p className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.07em] text-[#9b7b2e]">
        <span className="h-px w-6 bg-gold" />
        Vos questions
      </p>
      <h2 className="font-localSerif text-[clamp(28px,3vw,36px)] font-medium text-midnight">
        Questions fréquentes à {nonBreakingName(ville.nom)}
      </h2>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {[...ville.faqLocales, ...FAQ_ITEMS.map((f) => ({ q: f.q, r: f.a }))].map((item) => (
          <details key={item.q} className="rounded-[14px] border border-localBorder bg-white p-5">
            <summary className="cursor-pointer font-semibold text-midnight">{item.q}</summary>
            <p className="mt-2 text-sm leading-[1.7] text-localMuted">{item.r}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

/* 9. Maillage villes voisines ---------------------------------------------- */
export const LocalNearby = ({ nearbyNames }: { nearbyNames: { slug: string; nom: string }[] }) => (
  <section className="bg-white py-14 sm:py-[74px]">
    <div className="container">
      <p className="text-sm text-localMuted">J’accompagne aussi les emprunteurs de</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {nearbyNames.map((v) => (
          <Link
            key={v.slug}
            href={`/assurance-emprunteur/${v.slug}`}
            className="rounded-full border border-localBorder px-4 py-2 text-sm text-midnight transition hover:border-gold hover:text-[#9b7b2e]"
          >
            {v.nom}
          </Link>
        ))}
        <Link
          href="/assurance-emprunteur/hauts-de-seine"
          className="rounded-full bg-midnight px-4 py-2 text-sm text-white transition hover:bg-midnightSoft"
        >
          Toutes les villes du 92 →
        </Link>
      </div>
    </div>
  </section>
);

/* 10. CTA final ------------------------------------------------------------ */
export const LocalFinalCTA = ({ ville }: { ville: VilleData }) => (
  <section id="estimation" className="bg-midnight py-16 text-center text-white sm:py-20">
    <div className="container">
      <h2 className="font-localSerif text-[clamp(30px,4vw,42px)] font-medium">
        Et si votre assurance à {nonBreakingName(ville.nom)} coûtait moins cher ?
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
        Étude personnalisée et gratuite, sans engagement. Je vous dis en quelques minutes si le changement est
        intéressant pour vous.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <a href={CONFIG.CALENDLY_URL} target="_blank" rel="noreferrer" className={buttonGold}>
          Prendre rendez-vous
        </a>
        <a
          href="tel:+33651224213"
          className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full border border-white/30 px-6 text-[13px] font-semibold text-white transition hover:border-white"
        >
          06 51 22 42 13
        </a>
      </div>
    </div>
  </section>
);
