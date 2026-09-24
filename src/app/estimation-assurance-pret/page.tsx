import type { Metadata } from "next";
import Link from "next/link";
import { BorrowerQuoteForm } from "@/components/forms/BorrowerQuoteForm";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Estimez le coût de votre nouvelle assurance de prêt | GP Finances",
  description:
    "Simulateur gratuit : estimez en quelques minutes le coût de votre nouvelle assurance emprunteur et comparez avec votre contrat actuel. Sans nom, sans e-mail.",
  alternates: { canonical: "/estimation-assurance-pret" }
};

export default function Page() {
  return (
    <>
      <header className="border-b border-border bg-white">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="font-extrabold text-ink">GP Finances</Link>
          <a href="tel:+33651224213" className="text-sm font-semibold text-primary">06 51 22 42 13</a>
        </div>
      </header>
      <main className="container max-w-3xl space-y-6 py-8 sm:py-12">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Estimez le coût de votre nouvelle assurance de prêt</h1>
          <p className="text-muted">
            Répondez à quelques questions : vous obtenez en quelques secondes les trois solutions les plus avantageuses pour votre situation, à comparer avec votre contrat actuel.
          </p>
        </div>
        <BorrowerQuoteForm />
      </main>
      <Footer includeLoan92Link={false} />
    </>
  );
}
