import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export type GpfNotificationType = "nouveau_lead" | "piece_recue" | "piece_manquante" | "bordereau" | "echeance" | "relance" | "info";

/** Ajoute une notification au centre de notifications (cloche). Ne fait jamais échouer l'action appelante. */
export async function notify(type: GpfNotificationType, titre: string, message?: string, lien?: string) {
  const { error } = await supabaseAdmin.from("gpf_notifications").insert({ type, titre, message: message ?? null, lien: lien ?? null });
  if (error) console.error("gpf_notifications insert failed", error.message);
}
