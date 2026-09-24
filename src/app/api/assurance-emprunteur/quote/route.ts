import { NextResponse } from "next/server";
import { createAprilClient } from "@/lib/borrower-pricing/client.cjs";
import { CALL_MESSAGE, quote, type PricingClient } from "@/lib/borrower-pricing/quote.cjs";
import { allowRequest } from "@/lib/borrower-pricing/rateLimit";
import { sanitizeQuoteInput } from "@/lib/borrower-pricing/sanitize";
import { sendSimulationEmail } from "@/lib/simulationMail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4096;
const baseHeaders = { "Cache-Control": "no-store" };

// The partner name never appears in a response. `reason` stays in server logs.
const callUs = (headers: HeadersInit, status = 200) =>
  NextResponse.json({ status: "call", message: CALL_MESSAGE }, { status, headers });

let client: PricingClient | null | undefined;
function getClient(): PricingClient | null {
  if (client !== undefined) return client;
  const clientId = process.env.APRIL_CLIENT_ID;
  const clientSecret = process.env.APRIL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return (client = null);
  const production = process.env.APRIL_ENVIRONMENT === "production";
  try {
    client = createAprilClient({
      clientId,
      clientSecret,
      environment: production ? "production" : "integration",
      allowProduction: production && process.env.APRIL_ALLOW_PRODUCTION === "true",
    });
  } catch {
    client = null;
  }
  return client;
}

// Local preview only: the static mockup (file:// or another localhost port) may
// call this route while developing. Never allowed in production.
const isLocalPreview = (origin: string) => {
  if (process.env.NODE_ENV === "production") return false;
  if (origin === "null") return true;
  try {
    return ["localhost", "127.0.0.1"].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
};

const sameOrigin = (request: Request) => {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  if (isLocalPreview(origin)) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

const corsHeaders = (request: Request): Record<string, string> => {
  const origin = request.headers.get("origin");
  return origin && isLocalPreview(origin)
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" }
    : {};
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: { ...corsHeaders(request), "Access-Control-Allow-Methods": "POST" } });
}

export async function POST(request: Request) {
  const headers = { ...baseHeaders, ...corsHeaders(request) };
  if (!sameOrigin(request)) return NextResponse.json({ status: "forbidden" }, { status: 403, headers });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(ip)) return NextResponse.json({ status: "rate_limited" }, { status: 429, headers });

  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return callUs(headers, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return callUs(headers, 400);
  }

  const input = sanitizeQuoteInput(body);
  const pricing = getClient();
  const page = request.headers.get("referer") ?? undefined;
  if (!input || !pricing) {
    const reason = input ? "PRICING_NOT_CONFIGURED" : "INPUT_REJECTED";
    console.warn("[borrower-quote] call", reason);
    // Un visiteur qui a rempli le formulaire mérite un rappel : on prévient aussi dans ce cas.
    if (input) await sendSimulationEmail({ outcome: "call", reason, input, page });
    return callUs(headers);
  }

  const result = await quote(input, pricing);
  if (result.status === "call") console.warn("[borrower-quote] call", result.reason);
  // E-mail interne à chaque simulation (jamais bloquant pour le visiteur).
  await sendSimulationEmail({
    outcome: result.status,
    reason: result.status === "call" ? result.reason : undefined,
    input,
    internal: result.status === "quote" ? result.internal : undefined,
    page
  });
  // Only the white-label summary or the generic "call us" message is returned.
  return NextResponse.json(
    result.status === "call" ? { status: "call", message: result.message } : result,
    { headers }
  );
}
