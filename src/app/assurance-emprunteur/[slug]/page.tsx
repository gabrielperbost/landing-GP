import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVilleBySlug, VILLES } from "@/content/villes";
import { CITIES_92 } from "@/content/localSeo92";
import { FAQ_ITEMS } from "@/content/site";
import { LocalHeader } from "@/components/local/LocalHeader";
import { LocalFooter } from "@/components/local/LocalFooter";
import { playfairDisplay, dmSans } from "@/components/local/fonts";
import {
  LocalHero,
  LocalMarketBlock,
  LemoineCards,
  LocalBeforeAfter,
  LocalProcess,
  LocalAdvisor,
  LocalTestimonials,
  LocalFAQSection,
  LocalNearby,
  LocalFinalCTA
} from "@/components/local/LocalSections";

type VillePageProps = { params: { slug: string } };

const SITE_URL = "https://gp-finances.fr";

export function generateStaticParams() {
  return VILLES.map((v) => ({ slug: v.slug }));
}

export function generateMetadata({ params }: VillePageProps): Metadata {
  const ville = getVilleBySlug(params.slug);
  if (!ville) {
    return { title: "Page introuvable | GP Finances", robots: { index: false, follow: false } };
  }
  const path = `/assurance-emprunteur/${ville.slug}`;
  return {
    title: ville.meta.title,
    description: ville.meta.description,
    alternates: { canonical: path },
    openGraph: {
      title: ville.meta.title,
      description: ville.meta.description,
      url: `${SITE_URL}${path}`,
      type: "website",
      locale: "fr_FR"
    }
  };
}

export default function VillePage({ params }: VillePageProps) {
  const ville = getVilleBySlug(params.slug);
  if (!ville) notFound();

  const nearbyNames = ville.villesVoisines.map((slug) => {
    const full = getVilleBySlug(slug);
    if (full) return { slug: full.slug, nom: full.nom };
    const legacy = CITIES_92.find((c) => c.slug === slug);
    return { slug, nom: legacy?.name ?? slug };
  });

  const path = `/assurance-emprunteur/${ville.slug}`;
  const allFaq = [...ville.faqLocales, ...FAQ_ITEMS.map((f) => ({ q: f.q, r: f.a }))];

  // Adresse réelle du cabinet (Issy-les-Moulineaux) : aucune fausse antenne locale
  // n'est créée, areaServed porte la zone de chalandise, pas une implantation.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FinancialService",
      name: "GP Finances",
      url: `${SITE_URL}${path}`,
      description: ville.meta.description,
      telephone: "+33651224213",
      email: "gabriel.perbost@gp-finances.fr",
      identifier: "ORIAS 23003789",
      address: {
        "@type": "PostalAddress",
        streetAddress: "24 rue du Gouverneur Général Éboué",
        postalCode: "92130",
        addressLocality: "Issy-les-Moulineaux",
        addressCountry: "FR"
      },
      areaServed: { "@type": ville.type === "arrondissement" ? "AdministrativeArea" : "City", name: ville.nom }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Assurance emprunteur", item: `${SITE_URL}/assurance-emprunteur` },
        { "@type": "ListItem", position: 3, name: ville.nom, item: `${SITE_URL}${path}` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: allFaq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.r }
      }))
    }
  ];

  return (
    <div className={`${playfairDisplay.variable} ${dmSans.variable} font-localSans text-localInk`}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LocalHeader />
      <main>
        <LocalHero ville={ville} />
        <LocalMarketBlock ville={ville} />
        <LemoineCards />
        <LocalBeforeAfter />
        <LocalProcess />
        <LocalAdvisor ville={ville} />
        <LocalTestimonials />
        <LocalFAQSection ville={ville} />
        <LocalNearby nearbyNames={nearbyNames} />
        <LocalFinalCTA ville={ville} />
      </main>
      <LocalFooter />
    </div>
  );
}
