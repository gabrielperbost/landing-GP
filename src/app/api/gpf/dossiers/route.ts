import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vue "tableau" (type Monday) : un dossier par ligne, avec le client déjà
// attaché, pour permettre un groupage par statut côté page sans aller
// chercher chaque client un par un.
export async function GET(_request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data: dossiers, error } = await supabaseAdmin.from("gpf_dossiers").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const clientIds = Array.from(new Set((dossiers ?? []).flatMap((d) => [d.client_id, d.co_client_id]).filter(Boolean) as string[]));
  let clientById = new Map<string, { id: string; prenom: string; nom: string }>();
  if (clientIds.length) {
    const { data: clients } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", clientIds);
    clientById = new Map((clients ?? []).map((c) => [c.id, c]));
  }

  const items = (dossiers ?? []).map((d) => ({
    ...d,
    client: clientById.get(d.client_id) ?? null,
    co_client: d.co_client_id ? clientById.get(d.co_client_id) ?? null : null
  }));

  return NextResponse.json({ ok: true, dossiers: items });
}
