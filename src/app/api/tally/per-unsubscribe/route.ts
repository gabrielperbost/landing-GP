import { NextRequest, NextResponse } from "next/server";
import { PER_COLUMNS, stopPerSequence } from "@/lib/tallyPerCampaign";
import { callMondayApi } from "@/lib/monday";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const itemId = url.searchParams.get("item");

  if (itemId) {
    await stopPerSequence({ itemId, statusLabel: "Désinscrit", actionLabel: "Désinscrit" });
    await callMondayApi(
      `
        mutation MarkUnsubscribed($boardId: ID!, $itemId: ID!, $values: JSON!) {
          change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $values, create_labels_if_missing: true) {
            id
          }
        }
      `,
      {
        boardId: "5090527669",
        itemId,
        values: JSON.stringify({
          [PER_COLUMNS.unsubscribed]: { checked: "true" }
        })
      }
    );
  }

  return new NextResponse(
    "<!doctype html><html lang=\"fr\"><meta charset=\"utf-8\"><title>Désinscription</title><body style=\"font-family:Arial,sans-serif;padding:32px\"><h1>Désinscription confirmée</h1><p>Vous ne recevrez plus cette séquence email.</p></body></html>",
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
