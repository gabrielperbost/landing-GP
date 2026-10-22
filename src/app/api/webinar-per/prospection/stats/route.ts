import { NextRequest, NextResponse } from "next/server";
import { normalizeEnv } from "@/lib/monday";
import { getWebinarPerParticipants } from "@/lib/webinarPerSheet";
import { WEBINAR_PER_CAMPAIGN_START } from "@/lib/webinarPerConfig";
import { PER_PROSPECTION, PER_PROSPECTION_SCHEDULE } from "@/lib/webinarPerProspection";
import { prospectionTag } from "@/lib/webinarPerProspectionServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/* Suivi de la campagne d'invitation au webinaire PER du 1er novembre.
 * GET ?secret=...                → bilan par vague (Brevo) + inscriptions obtenues (Google Sheet).
 * GET ?secret=...&format=csv     → liste des clics (adresse, vague, lien, date) pour rappeler les intéressés.
 * Les clics viennent du suivi de liens Brevo ; utm_term indique le lien cliqué. */

type BrevoEvent = { email?: string; event?: string; date?: string; link?: string; tag?: string };

const isAuthorized = (request: NextRequest) => {
  const expected = [normalizeEnv(process.env.WEBINAR_PER_PROSPECTION_SECRET), normalizeEnv(process.env.CRON_SECRET)].filter(Boolean);
  const url = new URL(request.url);
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || url.searchParams.get("secret");
  return Boolean(provided && expected.includes(provided.trim()));
};

const parisDateKey = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

const readEvents = async (tag: string, startDate: string, endDate: string) => {
  const key = normalizeEnv(process.env.BREVO_API_KEY);
  if (!key) throw new Error("brevo_key_missing");
  const events: BrevoEvent[] = [];
  for (let offset = 0; offset < 100000; offset += 2500) {
    const url = new URL("https://api.brevo.com/v3/smtp/statistics/events");
    url.searchParams.set("limit", "2500");
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set("tags", tag);
    url.searchParams.set("sort", "desc");
    const response = await fetch(url, { headers: { accept: "application/json", "api-key": key }, cache: "no-store", signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`brevo_events_${response.status}`);
    const page = ((await response.json().catch(() => ({}))) as { events?: BrevoEvent[] }).events ?? [];
    events.push(...page);
    if (page.length < 2500) return events;
  }
  throw new Error("events_pagination_limit");
};

const linkLabel = (link?: string) => {
  try {
    return new URL(String(link)).searchParams.get("utm_term") || "autre";
  } catch {
    return "autre";
  }
};

// Format « webinaire-per|utm_source:email|utm_medium:...|utm_content:relance_j7|utm_term:inscription »
const sourceField = (source: string, field: string) => source.split("|").find((part) => part.startsWith(`${field}:`))?.slice(field.length + 1);

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const today = parisDateKey();
  // Toutes les vagues, depuis le début de la campagne (un lot pilote peut partir avant la date prévue).
  const perWave = (
    await Promise.all(PER_PROSPECTION_SCHEDULE.map(async (w) => ({ wave: w, events: await readEvents(prospectionTag(w.id), "2026-10-22", today) })))
  ).filter(({ events }) => events.length > 0);

  if (url.searchParams.get("format") === "csv") {
    const rows = ["email;vague;lien;date"];
    for (const { wave, events } of perWave) {
      for (const e of events.filter((x) => x.event === "clicks")) rows.push([e.email, wave.id, linkLabel(e.link), e.date].join(";"));
    }
    return new NextResponse(rows.join("\n"), {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=clics-webinaire-per-novembre.csv", "cache-control": "no-store" }
    });
  }

  const participants = await getWebinarPerParticipants().catch(() => []);
  const start = Date.parse(WEBINAR_PER_CAMPAIGN_START);
  const current = participants.filter((p) => Date.parse(p.created_at) >= start && p.status.trim().toLowerCase() === "registered");
  const fromCampaign = current.filter((p) => sourceField(p.source, "utm_campaign") === PER_PROSPECTION.source);

  const vagues = perWave.map(({ wave, events }) => {
    const unique = (type: string) => new Set(events.filter((e) => e.event === type).map((e) => e.email)).size;
    const clicksByLink: Record<string, number> = {};
    for (const e of events.filter((x) => x.event === "clicks")) {
      const label = linkLabel(e.link);
      clicksByLink[label] = (clicksByLink[label] ?? 0) + 1;
    }
    return {
      vague: wave.id,
      envoi: wave.label,
      envoyes: unique("requests"),
      delivres: unique("delivered"),
      ouvreursUniques: unique("opened") || unique("uniqueOpened"),
      cliqueursUniques: unique("clicks"),
      clicsParLien: clicksByLink,
      desinscrits: unique("unsubscribed"),
      plaintesSpam: unique("spam"),
      rebondsDefinitifs: unique("hardBounces"),
      rebondsTemporaires: unique("softBounces"),
      inscriptions: fromCampaign.filter((p) => sourceField(p.source, "utm_content") === wave.id).length
    };
  });

  return NextResponse.json({
    ok: true,
    aujourdhui: today,
    inscritsTotal: current.length,
    inscritsVenusDesEmails: fromCampaign.length,
    vagues
  });
}
