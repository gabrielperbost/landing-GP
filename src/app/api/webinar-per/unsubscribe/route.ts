import { NextResponse } from "next/server";
import { unsubscribeWebinarPerContact } from "@/lib/webinarPerSheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handle(email: string | null) {
  const clean = (email || "").trim().toLowerCase();
  if (!emailRegex.test(clean)) {
    return NextResponse.redirect(new URL("/webinaire-per/desinscription?ok=0", "https://gp-finances.fr"));
  }
  try {
    await unsubscribeWebinarPerContact(clean);
  } catch (error) {
    console.error("[webinar-per] échec désinscription", error instanceof Error ? error.message : error);
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
