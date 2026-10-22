import { NextRequest, NextResponse } from "next/server";
import { normalizeEnv } from "@/lib/monday";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { WEBINAR_PER, getWebinarPerBaseUrl } from "@/lib/webinarPerConfig";
import { buildWebinarPerEmail, type WebinarPerEmailTemplate } from "@/lib/webinarPerEmails";
import { buildPerProspectionEmail, PER_PROSPECTION_SCHEDULE } from "@/lib/webinarPerProspection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* Envoi de test de tous les e-mails du webinaire PER du 1er novembre, uniquement vers
 * les adresses de Gabriel (liste fermée ci-dessous). Objet préfixé « [TEST n/14] ». */

const TEST_RECIPIENTS = new Set(["gabriel.perbost@gmail.com", "gabriel.perbost@gp-finances.fr"]);
const REGISTERED: WebinarPerEmailTemplate[] = ["confirmation", "reminder_3d", "reminder_2d", "reminder_1d", "reminder_morning", "reminder_1h"];

export async function POST(request: NextRequest) {
  const expected = normalizeEnv(process.env.WEBINAR_PER_PROSPECTION_SECRET);
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || provided?.trim() !== expected) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const to = String(new URL(request.url).searchParams.get("to") ?? "").trim().toLowerCase();
  if (!TEST_RECIPIENTS.has(to)) return NextResponse.json({ ok: false, error: "destinataire_non_autorise" }, { status: 400 });

  const config = getBrevoTransactionalConfig();
  if (!config) return NextResponse.json({ ok: false, error: "brevo_non_configure" }, { status: 503 });

  const unsubscribeUrl = `${getWebinarPerBaseUrl()}${WEBINAR_PER.unsubscribePath}?email=${encodeURIComponent(to)}`;
  const mails = [
    ...PER_PROSPECTION_SCHEDULE.map((w) => ({ label: `Invitation — ${w.label}`, ...buildPerProspectionEmail(w.id, unsubscribeUrl) })),
    ...REGISTERED.map((t) => ({ label: `Inscrits — ${t}`, ...buildWebinarPerEmail(t, { prenom: "Gabriel", email: to }, { unsubscribeUrl }) }))
  ];

  const results: { n: number; label: string; ok: boolean; error?: string }[] = [];
  for (const [i, mail] of mails.entries()) {
    try {
      await sendBrevoTransactionalEmail({
        config,
        to: { email: to },
        subject: `[TEST ${i + 1}/${mails.length}] ${mail.subject}`,
        html: mail.html,
        text: mail.text,
        unsubscribeUrl,
        tags: ["webinaire-per-nov-test"]
      });
      results.push({ n: i + 1, label: mail.label, ok: true });
    } catch (error) {
      results.push({ n: i + 1, label: mail.label, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return NextResponse.json({ ok: results.every((r) => r.ok), to, results });
}
