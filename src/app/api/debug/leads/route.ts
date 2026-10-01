import { NextResponse } from "next/server";
import { getWebinarPerParticipants, isWebinarPerSheetConfigured } from "@/lib/webinarPerSheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Route de diagnostic temporaire, à supprimer après usage : liste les inscriptions
// webinaire PER directement depuis le Google Sheet, pour vérifier le nombre réel de leads.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== "gpfinances-debug-leads-2026") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  if (!isWebinarPerSheetConfigured()) {
    return NextResponse.json({ ok: false, error: "NOT_CONFIGURED" });
  }
  try {
    const participants = await getWebinarPerParticipants();
    return NextResponse.json({
      ok: true,
      count: participants.length,
      participants: participants.map((p) => ({
        created_at: p.created_at,
        prenom: p.prenom,
        nom: p.nom,
        email: p.email,
        telephone: p.telephone,
        status: p.status,
        source: p.source
      }))
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
