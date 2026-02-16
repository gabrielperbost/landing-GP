import { NextResponse } from "next/server";
import { getSavingsCounter } from "@/lib/savingsCounterStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
          "Cache-Control": "no-store, max-age=0"
        }
      }
    );
  } catch (error) {
    console.error("savings-counter-read-failed", error);
    return NextResponse.json({ error: "counter_unavailable" }, { status: 500 });
  }
}
