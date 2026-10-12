import { NextRequest, NextResponse } from "next/server";
import { getWebinarPerParticipants, markWebinarPerReminderSent } from "@/lib/webinarPerSheet";
import { buildWebinarPerEmail } from "@/lib/webinarPerEmails";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { WEBINAR_PER, getWebinarPerBaseUrl } from "@/lib/webinarPerConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Envoi manuel, déclenché une fois par Gabriel (pas un cron) : remercie les inscrits
 * du webinaire du 11 octobre 2026 et leur donne le replay dès qu'il est en ligne.
 * Le lien du replay se passe en paramètre (?replayUrl=...) au moment de l'appel, le
 * temps qu'il soit mis en ligne sur YouTube — pas besoin de redéployer pour le fournir.
 * Protégé par le même secret que les rappels. Le marquage « replay_sent_at » sur la
 * feuille Google est une sécurité anti-doublon : si la feuille ne connaît pas encore
 * cette colonne, l'échec du marquage est loggé mais n'empêche jamais l'envoi réel. */

const normalizeEnv = (value: string | undefined) => {
  const trimmed = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
};

const getReplaySecret = () => normalizeEnv(process.env.WEBINAR_PER_REMINDER_SECRET) ?? normalizeEnv(process.env.CRON_SECRET);

const isAuthorized = (request: NextRequest) => {
  const expected = getReplaySecret();
  if (!expected) return false;
  const url = new URL(request.url);
  const provided =
    request.headers.get("x-webinar-per-reminder-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret");
  return provided?.trim() === expected;
};

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const replayUrl = normalizeEnv(url.searchParams.get("replayUrl") ?? undefined);
  const dryRun = url.searchParams.get("dryRun") === "1";

  const emailConfig = getBrevoTransactionalConfig();
  if (!emailConfig) return NextResponse.json({ ok: false, error: "email_not_configured" }, { status: 503 });

  let participants;
  try {
    participants = await getWebinarPerParticipants();
  } catch (error) {
    console.error("[webinar-per-replay] échec lecture Google Sheet", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "sheet_unavailable" }, { status: 503 });
  }

  const targets = participants
    .filter((p) => p.status.trim().toLowerCase() === "registered")
    .filter((p) => !p.replay_sent_at);

  if (dryRun) {
    return NextResponse.json({ ok: true, dryRun: true, replayUrl: replayUrl ?? null, wouldSendTo: targets.length, recipients: targets.map((p) => p.email) });
  }

  const unsubscribeBase = `${getWebinarPerBaseUrl()}${WEBINAR_PER.unsubscribePath}`;
  const results = { attempted: targets.length, emailsSent: 0, errors: 0 };

  for (const participant of targets) {
    const contact = { prenom: participant.prenom, email: participant.email };
    const unsubscribeUrl = `${unsubscribeBase}?email=${encodeURIComponent(participant.email)}`;
    let emailOk = true;
    try {
      const built = buildWebinarPerEmail("replay", contact, { unsubscribeUrl, replayUrl });
      await sendBrevoTransactionalEmail({
        config: emailConfig,
        to: { email: participant.email, name: [participant.prenom, participant.nom].filter(Boolean).join(" ") },
        subject: built.subject,
        html: built.html,
        text: built.text,
        unsubscribeUrl,
        tags: ["webinaire-per", "replay"]
      });
      results.emailsSent += 1;
    } catch (error) {
      emailOk = false;
      results.errors += 1;
      console.error("[webinar-per-replay] échec e-mail", participant.email, error instanceof Error ? error.message : error);
    }
    if (emailOk) {
      try {
        await markWebinarPerReminderSent(participant.email, "replay_sent_at");
      } catch (error) {
        // Non bloquant : la colonne peut ne pas encore exister côté Apps Script.
        console.warn("[webinar-per-replay] marquage replay_sent_at ignoré", participant.email, error instanceof Error ? error.message : error);
      }
    }
  }

  return NextResponse.json({ ok: true, replayUrl: replayUrl ?? null, ...results });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
