import Link from "next/link";
import { PageHeader, SectionCard } from "@/components/espace-client/ui";
import { CONFIG } from "@/content/site";

const contactMethods = [
  {
    title: "Par téléphone",
    detail: "Parlez directement avec GP FINANCES pour un point rapide sur votre dossier.",
    actionLabel: "Appeler le 06 51 22 42 13",
    actionHref: "tel:+33651224213"
  },
  {
    title: "Par rendez-vous",
    detail: "Choisissez un créneau de 15 minutes pour être rappelé.",
    actionLabel: "Prendre un rendez-vous",
    actionHref: CONFIG.CALENDLY_URL
  },
  {
    title: "Par formulaire",
    detail: "Laissez votre message, nous vous répondons rapidement.",
    actionLabel: "Aller au formulaire",
    actionHref: "/#contact"
  }
];

const faqs = [
  "Je n'arrive pas à me connecter à mon espace client",
  "Je ne retrouve pas le lien reçu par email",
  "Je veux savoir quels documents envoyer en priorité",
  "Je souhaite un accompagnement pour la signature"
];

export default function EspaceClientContactPage() {
  return (
    <main className="container space-y-6 py-10">
      <PageHeader
        eyebrow="Contact"
        title="Comment nous contacter"
        description="Un seul point d'entrée pour toute question sur votre dossier client."
        actions={
          <Link href="/espace-client" className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Retour à l&apos;accueil client
          </Link>
        }
      />

      <SectionCard title="Choisissez votre canal" description="Téléphone, rendez-vous ou formulaire.">
        <div className="grid gap-4 md:grid-cols-3">
          {contactMethods.map((method) => (
            <article key={method.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-base font-semibold text-slate-900">{method.title}</h2>
              <p className="mt-2 text-sm text-slate-700">{method.detail}</p>
              <a
                href={method.actionHref}
                className="mt-4 inline-flex rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                target={method.actionHref.startsWith("http") ? "_blank" : undefined}
                rel={method.actionHref.startsWith("http") ? "noreferrer" : undefined}
              >
                {method.actionLabel}
              </a>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Demandes fréquentes" description="Si vous avez l'un de ces sujets, utilisez cette page de contact.">
        <ul className="grid gap-2 md:grid-cols-2">
          {faqs.map((item) => (
            <li key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>
    </main>
  );
}
