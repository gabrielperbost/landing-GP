import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export type GpfActivityAction = "create" | "update" | "delete" | "restore";
export type GpfActivityEntity = "client" | "dossier" | "document" | "apporteur" | "courrier";

export async function logActivity(action: GpfActivityAction, entityType: GpfActivityEntity, entityId: string, resume?: string) {
  const { error } = await supabaseAdmin.from("gpf_activity_log").insert({ action, entity_type: entityType, entity_id: entityId, resume: resume ?? null });
  // Le journal ne doit jamais faire échouer l'action elle-même : on log l'échec
  // côté serveur et on continue.
  if (error) console.error("gpf_activity_log insert failed", error.message);
}
