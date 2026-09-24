import { NextRequest, NextResponse } from "next/server";
import { getLeadsCsv } from "@/lib/leadsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isAuthorized = (request: NextRequest) => {
  const secret = process.env.LEADS_EXPORT_SECRET;
  if (!secret) return true;

  const searchParams = new URL(request.url).searchParams;
  const providedSecret =
    request.headers.get("x-leads-secret") ??
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    searchParams.get("secret");

  return providedSecret === secret;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const csv = await getLeadsCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads.csv"',
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error) {
    console.error("leads-export-failed", error);
    return NextResponse.json({ ok: false, error: "leads_export_failed" }, { status: 500 });
  }
}
