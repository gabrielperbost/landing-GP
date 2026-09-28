import { NextResponse } from "next/server";
import { buildWebinarPerIcs } from "@/lib/webinarPerCalendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new NextResponse(buildWebinarPerIcs(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="webinaire-per.ics"',
      "Cache-Control": "no-store"
    }
  });
}
