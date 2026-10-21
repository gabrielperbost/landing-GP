import { NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { analyseNom } from "@/lib/gpf/nameQuality";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom, email, telephone").is("deleted_at", null).order("nom");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const items = (data ?? [])
    .map((c) => {
      const issue = analyseNom(c.prenom ?? "", c.nom ?? "");
      return issue ? { ...c, ...issue } : null;
    })
    .filter(Boolean);

  return NextResponse.json({ ok: true, clients: items });
}
