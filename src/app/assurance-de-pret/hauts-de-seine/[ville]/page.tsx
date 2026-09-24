import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageContent } from "@/components/pages/LandingPageContent";
import { CITIES_92, getCity92BySlug } from "@/content/localSeo92";

type CityPageProps = {
  params: {
    ville: string;
  };
};

export function generateStaticParams() {
  return CITIES_92.map((city) => ({ ville: city.slug }));
}

export function generateMetadata({ params }: CityPageProps): Metadata {
  const city = getCity92BySlug(params.ville);

  if (!city) {
    return {
      title: "Page introuvable | GP Finances",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const title = `Assurance emprunteur à ${city.name} (${city.postalCode}) | GP Finances`;
  const description = `GP Finances accompagne les emprunteurs à ${city.name} pour réduire le coût de l’assurance de prêt avec garanties équivalentes et gestion complète des démarches.`;
  const path = `/assurance-de-pret/hauts-de-seine/${city.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      url: `https://gp-finances.fr${path}`,
      type: "website",
      locale: "fr_FR"
    }
  };
}

export default function City92Page({ params }: CityPageProps) {
  const city = getCity92BySlug(params.ville);

  if (!city) {
    notFound();
  }

  return <LandingPageContent cityName={city.name} />;
}
