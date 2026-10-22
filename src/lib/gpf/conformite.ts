import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

const LIBELLE: Record<string, string> = { der: "DER signé", piece_identite: "pièce d'identité" };

/**
 * Pièces réglementaires exigées avant la souscription : DER signé et pièce
 * d'identité. Renvoie la liste de ce qui manque (vide si tout est là). Avant la
 * migration 007 (pas de table de conformité), rien n'est bloqué.
 */
export async function manquantPourSouscription(clientId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin.from("gpf_compliance").select("type, statut").eq("client_id", clientId).in("type", ["der", "piece_identite"]);
  if (error) return [];
  const fait = new Set((data ?? []).filter((c) => c.statut === "fait").map((c) => c.type));
  if (!fait.has("piece_identite")) {
    // Une pièce d'identité déposée dans les documents suffit, même si la checklist n'a pas été cochée.
    const { data: docs } = await supabaseAdmin.from("gpf_documents").select("type").eq("client_id", clientId).is("deleted_at", null);
    if ((docs ?? []).some((d) => /^(cni|pi[eè]ce d'identit|passeport|titre de s[eé]jour)/i.test(d.type))) fait.add("piece_identite");
  }
  return ["der", "piece_identite"].filter((t) => !fait.has(t)).map((t) => LIBELLE[t]);
}

/** Recueil des besoins de plus de 12 mois : à refaire. */
export const recueilPerime = (dateSignature: string | null | undefined, now = new Date()) => {
  if (!dateSignature) return false;
  const limite = new Date(now);
  limite.setFullYear(limite.getFullYear() - 1);
  return new Date(dateSignature + "T00:00:00") < limite;
};
