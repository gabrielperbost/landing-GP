import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { formatNom } from "@/lib/gpf/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = 50;

/** Tous les documents du cabinet, filtrables par type, client, expiration. */
export async function GET(request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const p = request.nextUrl.searchParams;
  const page = Math.max(1, Number(p.get("page") ?? 1) || 1);
  const type = p.get("type")?.trim();
  const q = p.get("q")?.trim().toLowerCase();
  const filtre = p.get("filtre"); // expires | generes

  const [{ data: docs, error }, { data: clients }] = await Promise.all([
    supabaseAdmin.from("gpf_documents").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(5000),
    supabaseAdmin.from("gpf_clients").select("id, prenom, nom").is("deleted_at", null)
  ]);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const clientBy = new Map((clients ?? []).map((c) => [c.id, c]));
  const dans60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const GENERES = new Set(["DER", "Lettre de mission", "Recueil des besoins", "Rapport d'adéquation", "Courrier"]);

  let rows = (docs ?? []).filter((d) => d.storage_path).map((d) => ({ ...d, client: d.client_id ? formatNom(clientBy.get(d.client_id) ?? null) : "—" }));
  const types = Array.from(new Set(rows.map((d) => d.type as string))).sort((a, b) => a.localeCompare(b, "fr"));
  if (type) rows = rows.filter((d) => d.type === type);
  if (filtre === "expires") rows = rows.filter((d) => d.date_expiration && d.date_expiration <= dans60);
  if (filtre === "generes") rows = rows.filter((d) => GENERES.has(d.type) || String(d.type).startsWith("Résiliation"));
  if (q) rows = rows.filter((d) => d.client.toLowerCase().includes(q) || String(d.nom_fichier ?? "").toLowerCase().includes(q) || String(d.type).toLowerCase().includes(q));

  return NextResponse.json({
    ok: true,
    total: rows.length,
    page,
    pageSize: PAGE,
    types,
    documents: rows.slice((page - 1) * PAGE, page * PAGE),
    tailleTotale: (docs ?? []).reduce((s, d) => s + Number(d.taille_octets ?? 0), 0)
  });
}
