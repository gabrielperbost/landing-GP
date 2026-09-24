import Link from "next/link";
import { notFound } from "next/navigation";
import {
  WEBINAR_AVOCATS_EMAIL_TEMPLATES,
  buildWebinarAvocatsEmail,
  type WebinarAvocatsContact,
  type WebinarAvocatsEmailTemplate
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

export default function WebinarAvocatsPreviewTemplatePage({ params }: { params: { template: string } }) {
  if (!WEBINAR_AVOCATS_EMAIL_TEMPLATES.includes(params.template as WebinarAvocatsEmailTemplate)) {
    notFound();
  }

  const email = buildWebinarAvocatsEmail({
    template: params.template as WebinarAvocatsEmailTemplate,
    contact: previewContact
  });

  return (
    <main className="min-h-screen bg-slate-100 py-8">
      <div className="mx-auto mb-6 max-w-[720px] px-4">
        <Link href="/previews/webinar-avocats" className="text-sm font-bold text-blue-700 hover:underline">
          ← Retour aux previews
        </Link>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Objet</p>
          <h1 className="mt-1 text-xl font-black text-slate-950">{email.subject}</h1>
          <p className="mt-2 text-sm text-slate-500">{email.previewText}</p>
        </div>
      </div>
      <iframe
        title={email.subject}
        srcDoc={email.html}
        className="mx-auto w-full max-w-[760px] rounded-2xl border border-slate-300 bg-white shadow-xl"
        style={{ height: 1200 }}
      />
    </main>
  );
}
