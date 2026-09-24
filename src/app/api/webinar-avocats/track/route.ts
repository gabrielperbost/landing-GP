import { NextRequest, NextResponse } from "next/server";
import {
  appendWebinarTrackingEventToSheet,
  type WebinarTrackingEventType
} from "@/lib/googleSheetsWebinar";
import { normalizeEnv } from "@/lib/monday";
import { normalizeWebinarEmail, verifyWebinarTrackingToken } from "@/lib/webinarAvocatsTokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_TARGETS: Record<WebinarTrackingEventType, string> = {
  questionnaire: "/webinaire-per-avocats",
  plaquette: "/plaquettes/plaquette-gp-finances.pdf",
  site: "/per"
};

const isTrackingEvent = (value: string): value is WebinarTrackingEventType =>
  value === "questionnaire" || value === "plaquette" || value === "site";

const getBaseUrl = () => (normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL) ?? "https://gp-finances.fr").replace(/\/+$/, "");

const safeTargetUrl = (event: WebinarTrackingEventType, explicitTarget: string | null) => {
  const baseUrl = getBaseUrl();
  const fallback = `${baseUrl}${EVENT_TARGETS[event]}`;
  if (!explicitTarget) return fallback;

  try {
    const url = new URL(explicitTarget, baseUrl);
    if (url.origin !== baseUrl) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const event = url.searchParams.get("event") ?? "";
  const email = normalizeWebinarEmail(url.searchParams.get("email") ?? "");
  const token = url.searchParams.get("token") ?? "";
  const target = url.searchParams.get("target");
  const redirectFallback = `${getBaseUrl()}/webinaire-per-avocats`;

  if (!isTrackingEvent(event)) {
    return NextResponse.redirect(redirectFallback, { status: 302 });
  }

  const redirectUrl = safeTargetUrl(event, target);
  const response = NextResponse.redirect(redirectUrl, { status: 302 });
  response.headers.set("Cache-Control", "no-store, max-age=0");

  if (!email || !verifyWebinarTrackingToken({ email, token })) {
    return response;
  }

  try {
    await appendWebinarTrackingEventToSheet({
      event_at: new Date().toISOString(),
      event,
      email,
      prenom: url.searchParams.get("prenom") ?? "",
      nom: url.searchParams.get("nom") ?? "",
      target_url: redirectUrl,
      source: url.searchParams.get("source") ?? "webinaire-per-avocats-email"
    });
  } catch (error) {
    console.error("webinar-avocats-tracking-failed", error);
  }

  return response;
}
