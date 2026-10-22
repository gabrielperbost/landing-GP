import { NextResponse } from "next/server";
import { unsubscribeWebinarPerContact } from "@/lib/webinarPerSheet";
import { blacklistInBrevo } from "@/lib/webinarPerProspectionServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handle(email: string | null) {
  const clean = (email || "").trim().toLowerCase();
  if (!emailRegex.test(clean)) {
    return NextResponse.redirect(new URL("/webinaire-per/desinscription?ok=0", "https://gp-finances.fr"));
  }
  // Inscrits : statut « unsubscribed » dans le Google Sheet. Tous (inscrits ou destinataires des
  // invitations) : liste noire Brevo, qui écarte la personne de tous les envois suivants.
  const results = await Promise.allSettled([unsubscribeWebinarPerContact(clean), blacklistInBrevo(clean)]);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("[webinar-per] échec désinscription", r.reason instanceof Error ? r.reason.message : r.reason);
  });
  if (results.every((r) => r.status === "rejected")) {
    return NextResponse.redirect(new URL("/webinaire-per/desinscription?ok=0", "https://gp-finances.fr"));
  }
  return NextResponse.redirect(new URL("/webinaire-per/desinscription?ok=1", "https://gp-finances.fr"));
}

// Lien cliquable depuis un e-mail (GET) : simple et compatible avec tous les clients mail.
export async function GET(request: Request) {
  const url = new URL(request.url);
  return handle(url.searchParams.get("email"));
}

// Désinscription en un clic (RFC 8058, utilisée par certains clients mail automatiquement).
export async function POST(request: Request) {
  const url = new URL(request.url);
  return handle(url.searchParams.get("email"));
}
