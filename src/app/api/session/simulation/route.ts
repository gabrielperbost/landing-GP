import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getSimulationFromMonday } from "@/lib/mondaySimulation";
import { isSessionOwnedByEmail, resolvePortalTokenFromRequest } from "@/lib/portalAuth";
import { isBlockedSimulationUrl } from "@/lib/simulationUrl";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sanitizeFilename = (value: string) =>
  value
    .trim()
    .replaceAll(/["]/g, "")
    .replaceAll(/[\\/:*?<>|]+/g, "-")
    .replaceAll(/\s+/g, " ")
    .slice(0, 120);

const filenameFromUrl = (rawUrl: string) => {
  try {
    const pathname = new URL(rawUrl).pathname;
    const basename = pathname.split("/").pop() ?? "";
    return decodeURIComponent(basename);
  } catch {
    return "";
  }
};

const isNonEmptyUrlText = (value: string) => Boolean(value.trim() && !/^https?:\/\//i.test(value.trim()));

export async function GET(req: NextRequest) {
  try {
    noStore();
    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Configuration Supabase manquante" }, { status: 500 });
    }

    const url = new URL(req.url);
    const tokenFromQuery = url.searchParams.get("token")?.trim() ?? "";
    const tokenAuth = resolvePortalTokenFromRequest({ req, legacyToken: tokenFromQuery });
    const token = tokenAuth.token;
    const mode = (url.searchParams.get("mode")?.trim() ?? "inline").toLowerCase();
    const download = mode === "download";

    if (!token) {
      return NextResponse.json({ error: "Session non authentifiée" }, { status: 401 });
    }

    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("monday_item_id, client_email")
      .eq("token", token)
      .single();

    if (error || !session?.monday_item_id) {
      return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
    }
    if (!isSessionOwnedByEmail({ sessionEmail: session.client_email, expectedEmail: tokenAuth.email })) {
      return NextResponse.json({ error: "Session non autorisée" }, { status: 403 });
    }

    const simulation = await getSimulationFromMonday(session.monday_item_id);
    const simulationUrl = simulation?.url?.trim() ?? "";
    if (!simulationUrl || isBlockedSimulationUrl(simulationUrl) || !/^https?:\/\//i.test(simulationUrl)) {
      return NextResponse.json({ error: "Simulation indisponible" }, { status: 404 });
    }

    const upstream = await fetch(simulationUrl, { redirect: "follow", cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Impossible de récupérer la simulation" }, { status: 502 });
    }

    const contentType = (upstream.headers.get("content-type") || "application/pdf").toLowerCase();
    const upstreamDisposition = (upstream.headers.get("content-disposition") || "").toLowerCase();
    const sourceLooksPdf = /\.pdf(?:$|[?#])/i.test(simulationUrl) || upstreamDisposition.includes(".pdf");
    const isPdfPayload = contentType.includes("application/pdf");
    const isOctetPdf = contentType.includes("application/octet-stream") && sourceLooksPdf;

    if (!isPdfPayload && !isOctetPdf) {
      return NextResponse.json({ error: "Le document simulation n'est pas un PDF exploitable." }, { status: 415 });
    }

    const rawName = isNonEmptyUrlText(simulation?.name ?? "")
      ? (simulation?.name ?? "")
      : filenameFromUrl(simulationUrl) || "simulation-client.pdf";
    const filename = sanitizeFilename(rawName.endsWith(".pdf") ? rawName : `${rawName}.pdf`) || "simulation-client.pdf";
    const contentDisposition = `${download ? "attachment" : "inline"}; filename="${filename}"`;

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("session-simulation-proxy-failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
