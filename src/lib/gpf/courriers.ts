import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { genererPdf } from "@/lib/gpf/pdf";
import { COURRIER_LABEL, modeleCourrier, type DonneesCourrier, type TypeCourrier } from "@/lib/gpf/modeles";
import { enregistrerPdf, nomFichier } from "@/lib/gpf/documentsStore";
import type { GpfClient, GpfDossier } from "@/lib/gpf/types";

export const TYPES_COURRIER = Object.keys(COURRIER_LABEL) as TypeCourrier[];

/** (Re)génère le PDF d'un courrier et le range dans le coffre-fort du client. */
export async function genererCourrier(clientId: string, dossierId: string | null, type: TypeCourrier, donnees: DonneesCourrier, ancienDocumentId?: string | null) {
  const [{ data: client }, { data: dossier }] = await Promise.all([
    supabaseAdmin.from("gpf_clients").select("*").eq("id", clientId).single(),
    dossierId ? supabaseAdmin.from("gpf_dossiers").select("*").eq("id", dossierId).single() : Promise.resolve({ data: null })
  ]);
  if (!client) throw new Error("client_introuvable");
  const { titre, blocs } = modeleCourrier(type, client as GpfClient, (dossier as GpfDossier | null) ?? null, donnees);
  const octets = await genererPdf(titre, blocs, { cabinet: false });
  const doc = await enregistrerPdf(clientId, dossierId, COURRIER_LABEL[type], nomFichier(COURRIER_LABEL[type], client), octets);
  if (ancienDocumentId) await supabaseAdmin.from("gpf_documents").update({ deleted_at: new Date().toISOString() }).eq("id", ancienDocumentId);
  return doc;
}
