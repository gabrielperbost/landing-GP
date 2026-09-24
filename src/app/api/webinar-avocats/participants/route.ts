import { NextResponse } from "next/server";
import {
  getWebinarParticipantsFromSheet,
  getWebinarTrackingEventsFromSheet,
  isGoogleSheetsWebinarConfigured
} from "@/lib/googleSheetsWebinar";
import { normalizeEnv } from "@/lib/monday";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupabaseError = {
  code?: string;
  message?: string;
};

const isMissingTableError = (error: SupabaseError | null) =>
  error?.code === "42P01" ||
  error?.code === "PGRST205" ||
  /relation .* does not exist/i.test(error?.message ?? "") ||
  /could not find the table/i.test(error?.message ?? "");

export async function GET(req: Request) {
  const expectedTokens = [
    normalizeEnv(process.env.WEBINAR_AVOCATS_ADMIN_TOKEN),
    normalizeEnv(process.env.CRON_SECRET)
  ].filter(Boolean);
  const url = new URL(req.url);

  if (expectedTokens.length === 0) {
    return NextResponse.json({ success: false, error: "WEBINAR_AVOCATS_ADMIN_TOKEN manquant." }, { status: 500 });
  }

  const provided =
    req.headers.get("x-webinar-avocats-admin-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("token");

  if (!provided || !expectedTokens.includes(provided.trim())) {
    return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 401 });
  }

  if (isGoogleSheetsWebinarConfigured()) {
    const includeTracking = url.searchParams.get("includeTracking") !== "false";
    let participants = null;
    let trackingEvents: Awaited<ReturnType<typeof getWebinarTrackingEventsFromSheet>> = [];
    try {
      participants = await getWebinarParticipantsFromSheet();
      if (includeTracking) trackingEvents = await getWebinarTrackingEventsFromSheet();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Lecture Google Sheets impossible.",
          details: error instanceof Error ? error.message : "unknown_error"
        },
        { status: 500 }
      );
    }

    const visibleParticipants = (participants ?? []).filter(
      (participant) => participant.status.trim().toLowerCase() !== "tracking"
    );
    const trackingByEvent = trackingEvents.reduce<Record<string, { total: number; unique: number; emails: Set<string> }>>(
      (accumulator, event) => {
        accumulator[event.event] ??= { total: 0, unique: 0, emails: new Set<string>() };
        accumulator[event.event].total += 1;
        accumulator[event.event].emails.add(event.email);
        accumulator[event.event].unique = accumulator[event.event].emails.size;
        return accumulator;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      source: "google_sheets",
      counts: {
        registered: visibleParticipants.filter((participant) => participant.status !== "unsubscribed").length,
        unsubscribed: visibleParticipants.filter((participant) => participant.status === "unsubscribed").length
      },
      tracking: {
        included: includeTracking,
        counts: Object.fromEntries(
          Object.entries(trackingByEvent).map(([event, value]) => [
            event,
            {
              total: value.total,
              unique: value.unique
            }
          ])
        ),
        events: trackingEvents
      },
      participants: visibleParticipants
    });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Google Sheets n'est pas configuré. Ajoutez WEBINAR_AVOCATS_GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
      },
      { status: 500 }
    );
  }

  const { data, error, count } = await supabaseAdmin
    .from("webinar_avocats_registrations")
    .select("email,prenom,nom,barreau,cabinet,telephone,status,consent_at,created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "La table Supabase webinar_avocats_registrations n'existe pas encore."
        },
        { status: 500 }
      );
    }

    throw error;
  }

  const { count: unsubscribedCount, error: unsubscribedError } = await supabaseAdmin
    .from("webinar_avocats_unsubscribes")
    .select("email", { count: "exact", head: true });

  if (unsubscribedError && !isMissingTableError(unsubscribedError)) {
    throw unsubscribedError;
  }

  return NextResponse.json({
    success: true,
    source: "supabase",
    counts: {
      registered: count ?? data?.length ?? 0,
      unsubscribed: unsubscribedError ? 0 : unsubscribedCount ?? 0
    },
    participants: data ?? []
  });
}
