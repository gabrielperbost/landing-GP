import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createTask } from "@/lib/gpf/tasks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["appel", "email", "sms", "document", "relance", "conformite", "suivi", "reunion"];

// Liste des tâches, toutes fiches confondues (ou pour un contact).
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const p = request.nextUrl.searchParams;
  let query = supabaseAdmin.from("gpf_tasks").select("*").is("deleted_at", null);
  if (p.get("client_id")) query = query.eq("client_id", p.get("client_id")!);
  if (p.get("ouvertes") === "1") query = query.neq("etat", "terminee");
  if (p.get("etat")) query = query.eq("etat", p.get("etat")!);
  if (p.get("avant")) query = query.lte("echeance", p.get("avant")!);
  const { data, error } = await query.order("echeance", { ascending: true, nullsFirst: false }).limit(1000);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const clientIds = Array.from(new Set((data ?? []).map((t) => t.client_id).filter(Boolean) as string[]));
  const { data: clients } = clientIds.length ? await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", clientIds) : { data: [] };
  const byId = new Map((clients ?? []).map((c) => [c.id, c]));

  const { data: all } = await supabaseAdmin.from("gpf_tasks").select("etat").is("deleted_at", null).neq("etat", "terminee");
  const compteurs = { a_faire: 0, en_cours: 0, en_attente: 0 } as Record<string, number>;
  for (const t of all ?? []) compteurs[t.etat] = (compteurs[t.etat] ?? 0) + 1;

  return NextResponse.json({ ok: true, taches: (data ?? []).map((t) => ({ ...t, client: t.client_id ? byId.get(t.client_id) ?? null : null })), compteurs });
}

export async function POST(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.titre?.trim()) return NextResponse.json({ ok: false, error: "titre_requis" }, { status: 400 });
  const { id } = await createTask({
    client_id: body.client_id ?? null,
    dossier_id: body.dossier_id ?? null,
    titre: body.titre.trim(),
    categorie: CATEGORIES.includes(body.categorie) ? body.categorie : "suivi",
    echeance: body.echeance ?? null,
    notes: body.notes ?? null
  });
  if (!id) return NextResponse.json({ ok: false, error: "creation_impossible" }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}
