import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { logActivity } from "@/lib/gpf/activityLog";
import { filtersFromParams, queryContacts } from "@/lib/gpf/contactsQuery";
import { createContact } from "@/lib/gpf/contacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liste paginée côté serveur (50 par défaut), filtres combinables et tri par
// colonne ; compteurs Tous / Clients / Leads calculés ici.
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const p = request.nextUrl.searchParams;
  const page = Math.max(1, Number(p.get("page") ?? "1") || 1);
  const pageSize = Math.min(2000, Math.max(1, Number(p.get("pageSize") ?? "50") || 50));
  try {
    const { rows, counts } = await queryContacts(filtersFromParams(p));
    return NextResponse.json({ ok: true, clients: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize, counts });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "erreur" }, { status: 500 });
  }
}

// Création d'un contact (lead ou client), avec contrôle de doublon (même
// e-mail ou téléphone) sauf si l'utilisateur confirme (forcer: true).
export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.prenom?.trim() || !body?.nom?.trim()) return NextResponse.json({ ok: false, error: "prenom_nom_requis" }, { status: 400 });

  const result = await createContact(body, { forcer: Boolean(body.forcer), lead: body.lead !== false, origine: "manuel" });
  if (!result.ok) return NextResponse.json(result, { status: result.error === "doublon" ? 409 : 500 });
  await logActivity("create", "client", result.client.id, `${result.client.prenom} ${result.client.nom}`.trim());
  return NextResponse.json(result);
}
