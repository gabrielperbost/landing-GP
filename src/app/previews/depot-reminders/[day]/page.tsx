import Link from "next/link";
import { notFound } from "next/navigation";
import { buildDepotReminderEmail, isDepotReminderDayOffset } from "@/lib/depotReminderEmailTemplates";
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

type Params = {
  day: string;
};

export default async function DepotReminderPreviewPage({ params }: { params: Params }) {
  const numericDay = Number(params.day);
  if (!Number.isInteger(numericDay) || !isDepotReminderDayOffset(numericDay)) {
    notFound();
  }

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

  const preview = buildDepotReminderEmail({
    dayOffset: numericDay,
    ...previewContext
  });

  return (
    <main className="bg-slate-100 min-h-screen py-6">
      <div className="container mb-4">
        <Link href="/previews/depot-reminders" className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Retour aux previews
        </Link>
        <p className="mt-3 text-sm text-slate-600">
          Sujet: <span className="font-semibold text-slate-800">{preview.subject}</span>
        </p>
      </div>
      <div dangerouslySetInnerHTML={{ __html: preview.html }} />
    </main>
  );
}
