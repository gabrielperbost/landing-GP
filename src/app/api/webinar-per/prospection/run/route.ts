import { NextRequest, NextResponse } from "next/server";
import { normalizeEnv } from "@/lib/monday";
import { getBrevoSuppression, isBrevoSuppressed } from "@/lib/brevoSuppression";
import { getBrevoTransactionalConfig, sendBrevoTransactionalEmail } from "@/lib/brevoTransactional";
import { getWebinarPerParticipants } from "@/lib/webinarPerSheet";
import { WEBINAR_PER, WEBINAR_PER_CAMPAIGN_START, getWebinarPerBaseUrl } from "@/lib/webinarPerConfig";
import { buildPerProspectionEmail, PER_PROSPECTION_SCHEDULE, type PerProspectionTemplate } from "@/lib/webinarPerProspection";
import { findProspectionListId, prospectionTag, readAlreadySent, readProspects } from "@/lib/webinarPerProspectionServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* Invitations au webinaire PER du 1er novembre (prospects « assurance emprunteur »).
 * Appelée par les tâches planifiées aux heures du calendrier. Sans l'interrupteur
 * WEBINAR_PER_PROSPECTION_ENABLED=oui, elle ne fait qu'un comptage à blanc (aucun envoi).
 * Relançable sans risque : les adresses déjà servies dans la journée pour la vague sont
 * relues dans l'historique Brevo et écartées. */

const MAX_RUN_MS = 250_000;
const CONCURRENCY = 6;

const isAuthorized = (request: NextRequest) => {
  const expected = [normalizeEnv(process.env.WEBINAR_PER_PROSPECTION_SECRET), normalizeEnv(process.env.CRON_SECRET)].filter(Boolean);
  const url = new URL(request.url);
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || url.searchParams.get("secret");
  return Boolean(provided && expected.includes(provided.trim()));
};

const parisDateKey = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const parisHour = (d = new Date()) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(d));

const dueWave = (dateKey: string, hour: number) =>
  PER_PROSPECTION_SCHEDULE.find((w) => w.date === dateKey && hour >= w.hour && hour < w.hour + (w.id === "relance_h1" ? 1 : 3));

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const enabled = normalizeEnv(process.env.WEBINAR_PER_PROSPECTION_ENABLED)?.toLowerCase() === "oui";
  const today = parisDateKey();

  // Aperçu manuel d'une vague (?template=...) : toujours à blanc.
  const forced = url.searchParams.get("template") as PerProspectionTemplate | null;
  const wave = forced ? PER_PROSPECTION_SCHEDULE.find((w) => w.id === forced) : dueWave(today, parisHour());
  if (!wave) return NextResponse.json({ ok: true, ran: false, reason: "aucune_vague_maintenant", today, hour: parisHour() });
  const dryRun = Boolean(forced) || !enabled || url.searchParams.get("dryRun") === "1";

  const listId = await findProspectionListId();
  if (!listId) return NextResponse.json({ ok: false, error: "liste_prospects_absente" }, { status: 503 });

  const tag = prospectionTag(wave.id);
  const [prospects, suppression, participants, alreadySent] = await Promise.all([
    readProspects(listId),
    getBrevoSuppression(),
    getWebinarPerParticipants(),
    readAlreadySent(tag, today)
  ]);

  // Inscrits au webinaire du 1er novembre (et désinscrits de toute date) : jamais relancés.
  const start = Date.parse(WEBINAR_PER_CAMPAIGN_START);
  const excludedBySheet = new Set(
    participants
      .filter((p) => {
        const status = p.status.trim().toLowerCase();
        return status === "unsubscribed" || (status === "registered" && Date.parse(p.created_at) >= start);
      })
      .map((p) => p.email.trim().toLowerCase())
  );

  const counts = { liste: prospects.length, inscritsOuDesinscrits: 0, bloquesBrevo: 0, dejaServis: 0, aEnvoyer: 0, envoyes: 0, erreurs: 0, restants: 0 };
  const targets: string[] = [];
  for (const { email, emailBlacklisted } of prospects) {
    if (excludedBySheet.has(email)) counts.inscritsOuDesinscrits++;
    else if (emailBlacklisted || isBrevoSuppressed(email, suppression)) counts.bloquesBrevo++;
    else if (alreadySent.has(email)) counts.dejaServis++;
    else targets.push(email);
  }
  counts.aEnvoyer = targets.length;
  if (dryRun) return NextResponse.json({ ok: true, ran: false, dryRun: true, enabled, vague: wave.id, envoi: wave.label, ...counts });

  const config = getBrevoTransactionalConfig();
  if (!config) return NextResponse.json({ ok: false, error: "brevo_non_configure" }, { status: 503 });

  const startedAt = Date.now();
  const unsubscribeBase = `${getWebinarPerBaseUrl()}${WEBINAR_PER.unsubscribePath}`;
  let cursor = 0;
  const worker = async () => {
    while (cursor < targets.length && Date.now() - startedAt < MAX_RUN_MS) {
      const email = targets[cursor++];
      const unsubscribeUrl = `${unsubscribeBase}?email=${encodeURIComponent(email)}`;
      const built = buildPerProspectionEmail(wave.id, unsubscribeUrl);
      try {
        await sendBrevoTransactionalEmail({ config, to: { email }, subject: built.subject, html: built.html, text: built.text, unsubscribeUrl, tags: [tag] });
        counts.envoyes++;
      } catch (error) {
        counts.erreurs++;
        console.error("[webinar-per-prospection] échec", email, error instanceof Error ? error.message : error);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  counts.restants = targets.length - cursor;
  console.log("[webinar-per-prospection]", wave.id, JSON.stringify(counts));
  return NextResponse.json({ ok: true, ran: true, vague: wave.id, ...counts });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
