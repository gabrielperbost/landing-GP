import { NextRequest, NextResponse } from "next/server";
import { normalizeEnv } from "@/lib/monday";
import { getBrevoSuppression } from "@/lib/brevoSuppression";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BREVO_ACCOUNT_URL = "https://api.brevo.com/v3/account";
const BREVO_EVENTS_URL = "https://api.brevo.com/v3/smtp/statistics/events";

type BrevoEvent = {
  email?: string;
  event?: string;
  date?: string;
  messageId?: string;
  subject?: string;
  tag?: string;
  tags?: string[];
};

const isAuthorized = (request: NextRequest) => {
  const expectedTokens = [
    normalizeEnv(process.env.WEBINAR_AVOCATS_ADMIN_TOKEN),
    normalizeEnv(process.env.CRON_SECRET)
  ].filter(Boolean);
  if (expectedTokens.length === 0) return false;

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-webinar-avocats-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("token");

  return Boolean(provided && expectedTokens.includes(provided.trim()));
};

const getBrevoApiKey = () => normalizeEnv(process.env.BREVO_API_KEY);

const toDateParam = (value: string | null, fallback: string) => {
  const normalized = normalizeEnv(value ?? undefined);
  if (!normalized) return fallback;
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : fallback;
};

const summarizeEvents = (events: BrevoEvent[]) => {
  const byEvent: Record<string, number> = {};
  const uniqueByEvent: Record<string, Set<string>> = {};
  const uniqueEmails = new Set<string>();
  const messageIdsByEvent: Record<string, Set<string>> = {};
  const requestedEmails = new Set<string>();
  const deliveredEmails = new Set<string>();
  const deferredEmails = new Set<string>();
  const failedEmails = new Set<string>();
  const failedEvents = new Set(["hardbounces", "softbounces", "blocked", "error"]);

  for (const event of events) {
    const eventName = String(event.event || "unknown").toLowerCase();
    const email = String(event.email || "").trim().toLowerCase();
    const messageId = String(event.messageId || "").trim();
    byEvent[eventName] = (byEvent[eventName] || 0) + 1;
    uniqueByEvent[eventName] ??= new Set<string>();
    messageIdsByEvent[eventName] ??= new Set<string>();
    if (email) {
      uniqueEmails.add(email);
      uniqueByEvent[eventName].add(email);
      if (eventName === "requests") requestedEmails.add(email);
      if (eventName === "delivered") deliveredEmails.add(email);
      if (eventName === "deferred") deferredEmails.add(email);
      if (failedEvents.has(eventName)) failedEmails.add(email);
    }
    if (messageId) messageIdsByEvent[eventName].add(messageId);
  }

  const noFinalStatusEmails = new Set(requestedEmails);
  deliveredEmails.forEach((email) => noFinalStatusEmails.delete(email));
  deferredEmails.forEach((email) => noFinalStatusEmails.delete(email));
  failedEmails.forEach((email) => noFinalStatusEmails.delete(email));

  return {
    totalEvents: events.length,
    uniqueEmails: uniqueEmails.size,
    byEvent,
    uniqueByEvent: Object.fromEntries(Object.entries(uniqueByEvent).map(([event, emails]) => [event, emails.size])),
    uniqueMessageIdsByEvent: Object.fromEntries(
      Object.entries(messageIdsByEvent).map(([event, messageIds]) => [event, messageIds.size])
    ),
    delivery: {
      requestedUnique: requestedEmails.size,
      deliveredUnique: deliveredEmails.size,
      failedUnique: failedEmails.size,
      deferredUnique: deferredEmails.size,
      noFinalStatusUnique: noFinalStatusEmails.size
    }
  };
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });

  const apiKey = getBrevoApiKey();
  if (!apiKey) return NextResponse.json({ success: false, error: "brevo_api_key_missing" }, { status: 500 });

  const url = new URL(request.url);
  const startDate = toDateParam(url.searchParams.get("startDate"), "2026-08-19");
  const endDate = toDateParam(url.searchParams.get("endDate"), "2026-08-20");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 2500), 1), 5000);
  const maxPages = Math.min(Math.max(Number(url.searchParams.get("maxPages") || 8), 1), 20);
  const tag = normalizeEnv(url.searchParams.get("tag") ?? undefined) || "webinaire-per-avocats";
  const subject = normalizeEnv(url.searchParams.get("subject") ?? undefined);
  const includeMessageEvents = url.searchParams.get("includeMessageEvents") === "true";
  let suppression;
  if (url.searchParams.get("includeSuppressions") === "true") {
    try {
      suppression = await getBrevoSuppression();
    } catch (error) {
      return NextResponse.json({ success: false, error: "brevo_suppressions_failed", details: error instanceof Error ? error.message : "unknown_error" }, { status: 503 });
    }
  }

  const headers = { accept: "application/json", "api-key": apiKey };
  const [accountResponse] = await Promise.all([fetch(BREVO_ACCOUNT_URL, { headers, cache: "no-store" })]);
  const account = (await accountResponse.json().catch(() => ({}))) as Record<string, unknown>;
  if (!accountResponse.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "brevo_account_failed",
        status: accountResponse.status,
        details: account
      },
      { status: 502 }
    );
  }

  const events: BrevoEvent[] = [];
  const pageStatuses: Array<{ page: number; status: number; count: number; error?: unknown }> = [];
  for (let page = 0; page < maxPages; page += 1) {
    const eventsUrl = new URL(BREVO_EVENTS_URL);
    eventsUrl.searchParams.set("startDate", startDate);
    eventsUrl.searchParams.set("endDate", endDate);
    eventsUrl.searchParams.set("limit", String(limit));
    eventsUrl.searchParams.set("offset", String(page * limit));
    eventsUrl.searchParams.set("sort", "desc");
    eventsUrl.searchParams.set("tags", tag);

    const response = await fetch(eventsUrl, { headers, cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as { events?: BrevoEvent[] };
    const pageEvents = Array.isArray(body.events) ? body.events : [];
    pageStatuses.push({ page: page + 1, status: response.status, count: pageEvents.length, error: response.ok ? undefined : body });
    if (!response.ok) break;
    events.push(...pageEvents);
    if (pageEvents.length < limit) break;
  }

  const matchingEvents = subject ? events.filter((event) => event.subject === subject) : events;

  return NextResponse.json({
    success: true,
    ...(suppression ? { suppression } : {}),
    account: {
      email: account.email,
      companyName: account.companyName,
      plan: account.plan,
      relay: account.relay,
      marketingAutomation: account.marketingAutomation,
      transactionalEmails: account.transactionalEmails
    },
    query: { startDate, endDate, tag, limit, maxPages, subject },
    pages: pageStatuses,
    events: summarizeEvents(matchingEvents),
    ...(includeMessageEvents
      ? {
          messageEvents: matchingEvents.map((event) => ({
            email: event.email,
            subject: event.subject,
            event: event.event,
            messageId: event.messageId,
            date: event.date
          }))
        }
      : {})
  });
}
