import { NextResponse } from "next/server";
import { getBrevoSmsConfig, sendBrevoSms } from "@/lib/brevoSms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Route de diagnostic temporaire, à supprimer après usage : vérifie pourquoi l'envoi
// de SMS transactionnel Brevo échoue silencieusement (l'appelant normal avale l'erreur).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== "gpfinances-debug-sms-2026") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const config = getBrevoSmsConfig();
  if (!config) return NextResponse.json({ ok: false, error: "NO_BREVO_CONFIG" });

  if (searchParams.get("action") === "events") {
    const days = searchParams.get("days") || "1";
    const eventsUrl = new URL("https://api.brevo.com/v3/transactionalSMS/statistics/events");
    eventsUrl.searchParams.set("limit", "50");
    eventsUrl.searchParams.set("offset", "0");
    eventsUrl.searchParams.set("days", days);
    if (searchParams.get("phone")) eventsUrl.searchParams.set("phoneNumber", searchParams.get("phone")!);
    const res = await fetch(eventsUrl.toString(), {
      headers: { accept: "application/json", "api-key": config.apiKey }
    });
    const body = await res.json().catch(() => ({}));
    return NextResponse.json({ ok: res.ok, status: res.status, body });
  }

  const phone = searchParams.get("phone") || "+33612345678";
  try {
    const result = await sendBrevoSms({
      config,
      phone,
      text: "GP Finances : test technique SMS (à ignorer).",
      tag: "debug-test"
    });
    return NextResponse.json({ ok: true, sender: config.sender, result });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      sender: config.sender,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
