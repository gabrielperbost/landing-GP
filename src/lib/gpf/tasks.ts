import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import type { GpfTaskCategorie } from "@/lib/gpf/types";

export const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};
export const addHours = (d: Date, hours: number) => new Date(d.getTime() + hours * 3600_000);

type NewTask = {
  client_id?: string | null;
  dossier_id?: string | null;
  titre: string;
  categorie: GpfTaskCategorie;
  echeance?: Date | string | null;
  notes?: string | null;
  auto?: boolean;
  origine?: string | null;
};

/**
 * Crée une tâche. Pour les tâches automatiques (origine renseignée), on ne
 * recrée pas une tâche identique encore ouverte pour le même contact.
 */
export async function createTask(t: NewTask) {
  if (t.origine && t.client_id) {
    const { data: existing } = await supabaseAdmin
      .from("gpf_tasks")
      .select("id")
      .eq("client_id", t.client_id)
      .eq("origine", t.origine)
      .neq("etat", "terminee")
      .is("deleted_at", null)
      .limit(1);
    if (existing?.length) return { id: existing[0].id, created: false };
  }
  const { data, error } = await supabaseAdmin
    .from("gpf_tasks")
    .insert({
      client_id: t.client_id ?? null,
      dossier_id: t.dossier_id ?? null,
      titre: t.titre,
      categorie: t.categorie,
      echeance: t.echeance ? new Date(t.echeance).toISOString() : null,
      notes: t.notes ?? null,
      auto: t.auto ?? false,
      origine: t.origine ?? null
    })
    .select("id")
    .single();
  if (error) {
    console.error("gpf_tasks insert failed", error.message);
    return { id: null, created: false };
  }
  return { id: data.id as string, created: true };
}

/** Clôt les relances automatiques ouvertes d'un contact (il a répondu). */
export async function closeAutoRelances(clientId: string, origines: string[]) {
  await supabaseAdmin
    .from("gpf_tasks")
    .update({ etat: "terminee", done_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .in("origine", origines)
    .neq("etat", "terminee");
}
