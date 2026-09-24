import Link from "next/link";
import { DEPOT_REMINDER_DAY_OFFSETS, buildDepotReminderEmail } from "@/lib/depotReminderEmailTemplates";
import { getSavingsCounter } from "@/lib/savingsCounterStore";

const PREVIEW_SITE_BASE_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://gp-finances.fr";

const resolvePreviewSavingsValue = async () => {
  try {
    const response = await fetch("https://gp-finances.fr/api/savings-counter", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { value?: number };
      if (typeof payload.value === "number" && Number.isFinite(payload.value)) {
        return Math.round(payload.value);
      }
    }
  } catch {
    // Fallback to local counter source below.
  }

  try {
    const localCounter = await getSavingsCounter();
    return Math.round(localCounter.value);
  } catch {
    return null;
  }
};

export default async function DepotReminderPreviewsIndexPage() {
  const savingsValue = await resolvePreviewSavingsValue();
  const previewContext = {
    clientName: "Marie Dupont",
    link: "https://gp-finances.fr/espace-client/acces?token=preview-relance-123&email=client@example.com",
    expiresAt: "2026-04-20T10:00:00.000Z",
    siteBaseUrl: PREVIEW_SITE_BASE_URL,
    savingsValue,
    instagramUrl: "https://www.instagram.com/gabriel_perbost/",
    linkedinUrl: "https://www.linkedin.com/in/gabriel-perbost/"
  };

  return (
    <main className="container py-10 space-y-6">
      <h1 className="text-3xl font-semibold text-ink">Previews des emails de relance dépôt</h1>
      <p className="text-slate-600 max-w-3xl">
        Validation visuelle avant activation en production. Chaque lien ouvre un visuel complet avec la même direction artistique
        que le premier email actuel.
      </p>

      <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Nouveau prototype</p>
        <p className="mt-2 text-sm text-slate-700">
          Maquette HTML du parcours complet: landing, lien de connexion, espace client sécurisé et centralisation des documents
          de la nouvelle assurance.
        </p>
        <Link
          href="/previews/espace-client-process"
          className="mt-3 inline-flex rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Ouvrir la maquette du process
        </Link>
        <Link
          href="/espace-client"
          className="mt-3 ml-2 inline-flex rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Voir la version site
        </Link>
      </article>

      <div className="grid gap-4 sm:grid-cols-2">
        {DEPOT_REMINDER_DAY_OFFSETS.map((dayOffset) => {
          const preview = buildDepotReminderEmail({
            dayOffset,
            ...previewContext
          });

          return (
            <article key={dayOffset} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Email J+{dayOffset}</p>
              <p className="mt-2 text-sm text-slate-700">{preview.subject}</p>
              <Link
                href={`/previews/depot-reminders/${dayOffset}`}
                className="mt-3 inline-flex rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Ouvrir le visuel
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
