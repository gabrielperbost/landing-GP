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
  const phone = searchParams.get("phone") || "+33612345678";
  const config = getBrevoSmsConfig();
  if (!config) return NextResponse.json({ ok: false, error: "NO_BREVO_CONFIG" });
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
