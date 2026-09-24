import Link from "next/link";
import type { Metadata } from "next";
import { getWebinarAvocatsCalendarLinks } from "@/lib/webinarAvocatsCalendar";
import { WEBINAR_AVOCATS } from "@/lib/webinarAvocatsCampaign";

export const metadata: Metadata = {
  title: "Inscription confirmée | Webinaire PER avocats",
  robots: {
    index: false,
    follow: false
  }
};

export default function WebinarPerAvocatsMerciPage() {
  const calendarLinks = getWebinarAvocatsCalendarLinks();

  return (
    <main className="min-h-screen bg-[#eef3fb] px-4 py-16">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
        <p className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">✓</p>
        <h1 className="text-3xl font-black text-[#102033]">Inscription enregistrée</h1>
        <p className="mt-4 text-slate-600">
          Votre bulletin d’inscription au webinaire PER pour avocats a bien été pris en compte.
        </p>
        <p className="mt-5 text-sm text-slate-500">Le lien de connexion Zoom est inclus dans les invitations d’agenda ci-dessous.</p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-bold text-[#1A3C5C]">Ajouter le webinaire à votre agenda</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Le fichier agenda inclut les rappels la veille, 1 heure avant et au début du webinaire.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <a
              href={calendarLinks.ics}
              className="rounded-xl bg-[#1A3C5C] px-4 py-3 text-sm font-bold text-white hover:bg-[#143047]"
            >
              Fichier agenda avec rappels
            </a>
            <a
              href={calendarLinks.google}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#1A3C5C] bg-white px-4 py-3 text-sm font-bold text-[#1A3C5C] hover:bg-slate-100"
            >
              Google Agenda
            </a>
            <a
              href={calendarLinks.outlook}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[#1A3C5C] bg-white px-4 py-3 text-sm font-bold text-[#1A3C5C] hover:bg-slate-100"
            >
              Outlook
            </a>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            Google Agenda peut afficher son rappel par défaut à 10 minutes. Pour conserver les 3 rappels, utilisez le fichier agenda.
          </p>
        </div>
        <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left text-sm text-slate-700">
          <p>
            <strong>Date :</strong> {WEBINAR_AVOCATS.dateLabel}
          </p>
          <p className="mt-2">
            <strong>Horaire :</strong> {WEBINAR_AVOCATS.timeLabel}
          </p>
          <p className="mt-2">
            <strong>Format :</strong> {WEBINAR_AVOCATS.durationLabel}
          </p>
        </div>
        <Link href="/per" className="mt-6 inline-flex rounded-xl bg-[#1A3C5C] px-5 py-3 text-sm font-bold text-white hover:bg-[#143047]">
          Retour au site GP Finances
        </Link>
      </section>
    </main>
  );
}
