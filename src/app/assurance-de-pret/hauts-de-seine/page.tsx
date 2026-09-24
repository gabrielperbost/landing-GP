import type { Metadata } from "next";
import { LandingPageContent } from "@/components/pages/LandingPageContent";

const TITLE = "Assurance de prêt dans les Hauts-de-Seine (92) | GP Finances";
const DESCRIPTION =
  "Trouvez votre page locale GP Finances par ville des Hauts-de-Seine : accompagnement humain, comparaison des contrats et économies sur l’assurance emprunteur.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/assurance-de-pret/hauts-de-seine"
  }
};

export default function HautsDeSeineCitiesPage() {
  return <LandingPageContent />;
}
