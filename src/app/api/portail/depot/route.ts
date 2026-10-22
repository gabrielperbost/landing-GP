import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { clientPortail, limiter } from "@/lib/gpf/portail";
import { BUCKET } from "@/lib/gpf/documentsStore";
import { notify } from "@/lib/gpf/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = /^(application\/pdf|image\/(jpeg|png|heic|heif|webp))$/;
const MAX = 10 * 1024 * 1024;

/** Dépôt d'une pièce par le client (en réponse à une demande ou librement). */
export async function POST(request: NextRequest) {
  const clientId = await clientPortail();
  if (!clientId) return NextResponse.json({ ok: false, error: "non_connecte" }, { status: 401 });
  if (!limiter(`depot:${clientId}`, 30, 60 * 60_000)) return NextResponse.json({ ok: false, error: "trop_de_depots" }, { status: 429 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const demandeId = (form?.get("demande_id") as string) || null;
  if (!file || !(file instanceof File)) return NextResponse.json({ ok: false, error: "fichier_requis" }, { status: 400 });
  if (!TYPES.test(file.type)) return NextResponse.json({ ok: false, error: "format" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ ok: false, error: "taille" }, { status: 400 });

  let libelle = "Document transmis";
  if (demandeId) {
    const { data: d } = await supabaseAdmin.from("gpf_portal_requests").select("client_id, libelle, statut").eq("id", demandeId).single();
    if (!d || d.client_id !== clientId || d.statut === "annulee") return NextResponse.json({ ok: false, error: "demande_introuvable" }, { status: 404 });
    libelle = d.libelle;
  }

  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase().replace(/[^.a-z0-9]/g, "") : "";
  const storagePath = `clients/${clientId}/${crypto.randomUUID()}${ext}`;
  const { error: up } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (up) return NextResponse.json({ ok: false, error: "envoi_impossible" }, { status: 500 });
  const { data: doc, error } = await supabaseAdmin
    .from("gpf_documents")
    .insert({
      client_id: clientId,
      type: libelle,
      recu: true,
      nom_fichier: file.name.slice(0, 200),
      storage_path: storagePath,
      taille_octets: file.size,
      date_reception: new Date().toISOString().slice(0, 10),
      depose_par_client: true
    })
    .select("id")
    .single();
  if (error || !doc) {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ ok: false, error: "envoi_impossible" }, { status: 500 });
  }
  if (demandeId) await supabaseAdmin.from("gpf_portal_requests").update({ statut: "recue", document_id: doc.id, recue_at: new Date().toISOString() }).eq("id", demandeId);
  const { data: c } = await supabaseAdmin.from("gpf_clients").select("prenom, nom").eq("id", clientId).single();
  await notify("piece_recue", `Pièce déposée par ${c ? `${c.prenom} ${String(c.nom).toUpperCase()}` : "un client"} : ${libelle}`, file.name, `/gpf/contacts/${clientId}?onglet=documents`);
  return NextResponse.json({ ok: true });
}
