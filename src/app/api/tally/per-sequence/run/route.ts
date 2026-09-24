import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentPerSequenceDay,
  getDuePerSequenceItems,
  getPerLeadFromMondayItem,
  getPerSequenceSecret,
  getPerStopReason,
  markPerEmailSent,
  sendPerEmail,
  stopPerSequence,
  PER_COLUMNS
} from "@/lib/tallyPerCampaign";
import { findItemColumnValue } from "@/lib/monday";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isAuthorized = (request: NextRequest) => {
  const expected = getPerSequenceSecret();
  if (!expected) return true;
  const url = new URL(request.url);
  const provided =
    request.headers.get("x-per-sequence-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret");
  return provided?.trim() === expected;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const results: Array<{ itemId: string; action: string; day?: number; error?: string }> = [];
  const items = await getDuePerSequenceItems({ limit: 100 });

  for (const item of items) {
    try {
      const stopReason = getPerStopReason(item);
      if (stopReason) {
        await stopPerSequence({ itemId: item.id, ...stopReason });
        results.push({ itemId: item.id, action: "stopped" });
        continue;
      }

      const day = getCurrentPerSequenceDay(item);
      if (day === null) {
        await stopPerSequence({ itemId: item.id, statusLabel: "Terminée", actionLabel: "Séquence terminée" });
        results.push({ itemId: item.id, action: "completed" });
        continue;
      }

      const lead = getPerLeadFromMondayItem(item, day);
      const sentAt = new Date().toISOString();
      const mail = await sendPerEmail(lead);
      await markPerEmailSent({
        itemId: item.id,
        day,
        sentAt,
        subject: mail.subject,
        previousLog: findItemColumnValue(item.column_values, PER_COLUMNS.emailLog)?.text || ""
      });
      results.push({ itemId: item.id, action: "sent", day });
    } catch (error) {
      results.push({ itemId: item.id, action: "error", error: error instanceof Error ? error.message : "unknown_error" });
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}

export const POST = GET;
