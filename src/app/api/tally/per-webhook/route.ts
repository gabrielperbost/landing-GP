import { NextRequest, NextResponse } from "next/server";
import {
  extractTallyPerLead,
  getPerWebhookSecret,
  ingestPerCampaignLead
} from "@/lib/tallyPerCampaign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getBaseUrl = (request: NextRequest) =>
  (process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`).replace(/\/+$/, "");

const getProvidedSecret = (request: NextRequest, body: unknown) => {
  const url = new URL(request.url);
  const bodySecret = body && typeof body === "object" ? (body as { secret?: unknown }).secret : undefined;
  return (
    url.searchParams.get("secret") ||
    (typeof bodySecret === "string" ? bodySecret : "") ||
    request.headers.get("x-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  );
};

const isAuthorized = (request: NextRequest, body: unknown) => {
  const expected = getPerWebhookSecret();
  if (!expected) return true;
  return getProvidedSecret(request, body)?.trim() === expected;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as unknown;
  if (!body) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  if (!isAuthorized(request, body)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const lead = extractTallyPerLead(body);
    const result = await ingestPerCampaignLead({ lead, baseUrl: getBaseUrl(request) });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("per-tally-webhook-error", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown_error" },
      { status: 500 }
    );
  }
}
