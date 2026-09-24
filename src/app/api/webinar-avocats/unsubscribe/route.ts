import { NextRequest, NextResponse } from "next/server";
import { appendWebinarUnsubscribeToSheet, isGoogleSheetsWebinarConfigured } from "@/lib/googleSheetsWebinar";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { normalizeWebinarEmail, verifyWebinarUnsubscribeToken } from "@/lib/webinarAvocatsTokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const renderPage = ({ title, message, status = 200 }: { title: string; message: string; status?: number }) =>
  new NextResponse(
    `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="margin:0;background:#eef3fb;font-family:Arial,sans-serif;color:#0f172a;"><main style="max-width:620px;margin:56px auto;padding:0 16px;"><section style="background:#fff;border:1px solid #d9e2f2;border-radius:18px;padding:28px;box-shadow:0 20px 50px rgba(15,23,42,.08);"><p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#1A3C5C;font-weight:800;">GP Finances</p><h1 style="margin:0 0 12px;font-size:28px;">${title}</h1><p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">${message}</p></section></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } }
  );

const isMissingTableError = (error: { code?: string; message?: string } | null) =>
  error?.code === "42P01" ||
  error?.code === "PGRST205" ||
  /relation .* does not exist/i.test(error?.message ?? "") ||
  /could not find the table/i.test(error?.message ?? "");

const confirmUnsubscribeInSheet = async ({ email, now }: { email: string; now: string }) => {
  const stored = await appendWebinarUnsubscribeToSheet({
    email,
    unsubscribed_at: now,
    source: "webinaire-per-avocats-unsubscribe"
  });
  if (!stored) throw new Error("unsubscribe_storage_not_configured");

  return renderPage({
    title: "Désinscription confirmée",
    message:
      "Votre adresse a été retirée de la campagne webinaire PER pour avocats. Vous ne recevrez plus d'emails liés à cette campagne."
  });
};

async function unsubscribe(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = normalizeWebinarEmail(url.searchParams.get("email") ?? "");
    const token = url.searchParams.get("token") ?? "";

    if (!email || !verifyWebinarUnsubscribeToken({ email, token })) {
      return renderPage({
        title: "Lien de désinscription invalide",
        message: "Le lien utilisé est incomplet ou invalide. Répondez à l'email reçu pour demander la suppression manuelle.",
        status: 400
      });
    }

    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      return await confirmUnsubscribeInSheet({ email, now });
    }

    const { error: unsubscribeError } = await supabaseAdmin.from("webinar_avocats_unsubscribes").upsert(
      {
        email,
        source: "webinaire-per-avocats",
        unsubscribed_at: now
      },
      { onConflict: "email" }
    );

    if (isMissingTableError(unsubscribeError)) {
      return await confirmUnsubscribeInSheet({ email, now });
    }
    if (unsubscribeError) throw unsubscribeError;

    await supabaseAdmin
      .from("webinar_avocats_contacts")
      .update({ status: "unsubscribed", unsubscribed_at: now, updated_at: now })
      .eq("email", email);

    // Scheduled reminders read Sheets, so both audiences must see the opt-out.
    if (isGoogleSheetsWebinarConfigured()) {
      return await confirmUnsubscribeInSheet({ email, now });
    }

    return renderPage({
      title: "Désinscription confirmée",
      message: "Votre adresse a été retirée de la campagne webinaire PER pour avocats. Vous ne recevrez plus d'emails liés à cette campagne."
    });
  } catch (error) {
    console.error("webinar-avocats-unsubscribe-failed", error instanceof Error ? error.message : "storage_error");
    return renderPage({
      title: "Erreur de désinscription",
      message: "Votre désinscription n'a pas pu être confirmée. Réessayez ou répondez à l'email reçu pour demander la suppression manuelle.",
      status: 503
    });
  }
}

export async function GET(req: NextRequest) {
  return unsubscribe(req);
}

// One-click unsubscribe clients POST to the signed List-Unsubscribe URL.
export async function POST(req: NextRequest) {
  return unsubscribe(req);
}
