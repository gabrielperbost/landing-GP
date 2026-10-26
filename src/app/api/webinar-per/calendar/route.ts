import { NextResponse } from "next/server";
import { buildWebinarPerIcs } from "@/lib/webinarPerCalendar";
import { getWebinarPerSession } from "@/lib/webinarPerConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getWebinarPerSession(new URL(request.url).searchParams.get("session"));
  return new NextResponse(buildWebinarPerIcs(session), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="webinaire-per-${session.id}.ics"`,
      "Cache-Control": "no-store"
    }
  });
}
