import Link from "next/link";
import {
  WEBINAR_AVOCATS_EMAIL_TEMPLATES,
  buildWebinarAvocatsEmail,
  type WebinarAvocatsContact
} from "@/lib/webinarAvocatsCampaign";

const previewContact: WebinarAvocatsContact = {
  prenom: "Claire",
  nom: "Martin",
  email: "claire.martin@cabinet-avocat.fr",
  barreau: "Lyon",
  cabinet: "Cabinet Martin & Associés",
  registrationUrl: "https://gp-finances.fr/webinaire-per-avocats",
  unsubscribeUrl: "https://gp-finances.fr/api/webinar-avocats/unsubscribe?email=claire.martin%40cabinet-avocat.fr&token=preview"
};

export default function WebinarAvocatsPreviewsPage() {
  return (
    <main className="container py-10">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Brouillon campagne</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Emails webinaire PER pour avocats</h1>
        <p className="mt-3 text-slate-600">
          Ces previews servent uniquement à valider le visuel et le contenu. Aucune route d’envoi massif n’est active.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {WEBINAR_AVOCATS_EMAIL_TEMPLATES.map((template) => {
          const email = buildWebinarAvocatsEmail({ template, contact: previewContact });
          return (
            <article key={template} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{template.replaceAll("_", " ")}</p>
              <h2 className="mt-2 text-lg font-bold text-slate-950">{email.subject}</h2>
              <p className="mt-2 text-sm text-slate-500">{email.previewText}</p>
              <Link
                href={`/previews/webinar-avocats/${template}`}
                className="mt-4 inline-flex rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
              >
                Ouvrir le visuel
              </Link>
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <strong>À valider ensemble :</strong> angle du message, niveau de personnalisation, objet, ordre des relances, ton
        commercial, mentions RGPD et lien d’inscription.
      </div>
    </main>
  );
}
