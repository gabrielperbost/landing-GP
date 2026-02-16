import { NextRequest, NextResponse } from "next/server";
import { updateSavingsCounter } from "@/lib/savingsCounterStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isAuthorized = (request: NextRequest) => {
  const secret = process.env.COUNTER_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return true;

  const searchParams = new URL(request.url).searchParams;
  const providedSecret =
    request.headers.get("x-counter-cron-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    searchParams.get("secret");

  return providedSecret === secret;
};

const handleUpdate = async () => {
  try {
    const counter = await updateSavingsCounter();
    return NextResponse.json(
      {
        ok: true,
        value: counter.value,
        lastUpdated: counter.lastUpdated,
        periodsApplied: counter.periodsApplied
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  } catch (error) {
    console.error("savings-counter-update-failed", error);
    return NextResponse.json({ ok: false, error: "counter_update_failed" }, { status: 500 });
  }
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return handleUpdate();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return handleUpdate();
}
