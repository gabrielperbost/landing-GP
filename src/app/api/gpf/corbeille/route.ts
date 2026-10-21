import { NextRequest, NextResponse } from "next/server";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  if (!(await hasValidGpfSession())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const [{ data: clients }, { data: dossiers }, { data: documents }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("id, prenom, nom, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
    supabaseAdmin
      .from("gpf_dossiers")
      .select("id, produit, client_id, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabaseAdmin
      .from("gpf_documents")
      .select("id, nom_fichier, type, dossier_id, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
  ]);

  // Rattacher le nom du client aux dossiers et documents supprimés, pour que
  // la corbeille reste lisible sans devoir ouvrir chaque fiche.
  const dossierClientIds = Array.from(new Set((dossiers ?? []).map((d) => d.client_id)));
  const dossierIds = (dossiers ?? []).map((d) => d.id);
  const documentDossierIds = Array.from(new Set((documents ?? []).map((d) => d.dossier_id)));

  const allClientIds = Array.from(new Set([...dossierClientIds]));
  let clientById = new Map<string, { prenom: string; nom: string }>();
  if (allClientIds.length) {
    const { data } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom").in("id", allClientIds);
    clientById = new Map((data ?? []).map((c) => [c.id, c]));
  }

  const neededDossierIds = Array.from(new Set([...dossierIds, ...documentDossierIds]));
  let dossierById = new Map<string, { produit: string; client_id: string }>();
  if (neededDossierIds.length) {
    const { data } = await supabaseAdmin.from("gpf_dossiers").select("id, produit, client_id").in("id", neededDossierIds);
    dossierById = new Map((data ?? []).map((d) => [d.id, d]));
  }

  const joursRestants = (deletedAt: string) => Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000));

  return NextResponse.json({
    ok: true,
    clients: (clients ?? []).map((c) => ({ ...c, joursRestants: joursRestants(c.deleted_at!) })),
    dossiers: (dossiers ?? []).map((d) => ({
      ...d,
      client: clientById.get(d.client_id) ?? null,
      joursRestants: joursRestants(d.deleted_at!)
    })),
    documents: (documents ?? []).map((doc) => {
      const dossier = dossierById.get(doc.dossier_id);
      const client = dossier ? clientById.get(dossier.client_id) : null;
      return { ...doc, dossierProduit: dossier?.produit ?? null, client: client ?? null, joursRestants: joursRestants(doc.deleted_at!) };
    })
  });
}
