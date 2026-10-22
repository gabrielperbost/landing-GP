import { NextRequest, NextResponse } from "next/server";
import { normalizeEnv } from "@/lib/monday";
import { ensureProspectionListId, findProspectionListId, importProspects, readProspects } from "@/lib/webinarPerProspectionServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Import (POST { emails: [...] }) ou état (GET) de la liste Brevo des prospects invités
 * au webinaire PER du 1er novembre. Seules les adresses e-mail sont transmises. */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isAuthorized = (request: NextRequest) => {
  const expected = normalizeEnv(process.env.WEBINAR_PER_PROSPECTION_SECRET);
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(expected && provided && provided.trim() === expected);
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const listId = await findProspectionListId();
  if (!listId) return NextResponse.json({ ok: true, listId: null, contacts: 0 });
  const prospects = await readProspects(listId);
  return NextResponse.json({ ok: true, listId, contacts: prospects.length, blacklistes: prospects.filter((p) => p.emailBlacklisted).length });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { emails?: unknown } | null;
  const emails = [...new Set((Array.isArray(body?.emails) ? body.emails : []).map((e) => String(e).trim().toLowerCase()).filter((e) => emailRegex.test(e)))];
  if (emails.length === 0 || emails.length > 5000) return NextResponse.json({ ok: false, error: "emails_invalides" }, { status: 400 });
  const listId = await ensureProspectionListId();
  const processId = await importProspects(listId, emails);
  return NextResponse.json({ ok: true, listId, importes: emails.length, processId });
}
