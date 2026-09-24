import { NextResponse } from "next/server";
import { getSavingsCounter } from "@/lib/savingsCounterStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Local preview only: lets the static mockup (file:// or another localhost port)
// read the counter while developing. Never enabled in production.
const previewHeaders = (request: Request): Record<string, string> => {
  const origin = request.headers.get("origin");
  if (process.env.NODE_ENV === "production" || !origin) return {};
  try {
    const local = origin === "null" || ["localhost", "127.0.0.1"].includes(new URL(origin).hostname);
    return local ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
  } catch {
    return {};
  }
};

export async function GET(request: Request) {
  try {
    const counter = await getSavingsCounter();
    return NextResponse.json(
      {
        value: counter.value,
        lastUpdated: counter.lastUpdated,
        periodsApplied: counter.periodsApplied
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          ...previewHeaders(request)
        }
      }
    );
  } catch (error) {
    console.error("savings-counter-read-failed", error);
    return NextResponse.json({ error: "counter_unavailable" }, { status: 500 });
  }
}
