import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { addHours, createTask } from "@/lib/gpf/tasks";
import { notify } from "@/lib/gpf/notify";

const BASE_FIELDS = ["civilite", "prenom", "nom", "email", "telephone", "adresse", "ville", "code_postal", "annee_naissance", "profession", "fumeur", "notes"];
export const EXTENDED_FIELDS = [
  "type_contact",
  "raison_sociale",
  "date_naissance",
  "situation_familiale",
  "nb_enfants",
  "provenance",
  "apporteur_id",
  "preference_contact",
  "score",
  "prochaine_action",
  "prochaine_action_date",
  "budget",
  "fiscalite"
];
export const CLIENT_EDITABLE_FIELDS = [...BASE_FIELDS, ...EXTENDED_FIELDS];

const normPhone = (t: string | null | undefined) => {
  const d = (t ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : null;
};

/** Cherche un contact existant avec le même e-mail ou le même téléphone. */
export async function findDuplicate(email?: string | null, telephone?: string | null) {
  const e = email?.trim().toLowerCase();
  const ph = normPhone(telephone);
  if (!e && !ph) return null;
  const ors = [];
  if (e) ors.push(`email.ilike.${e.replace(/[,()]/g, "")}`);
  if (ph) ors.push(`telephone.ilike.%${ph.slice(-8)}%`);
  const { data } = await supabaseAdmin.from("gpf_clients").select("id, prenom, nom, email, telephone").is("deleted_at", null).or(ors.join(",")).limit(5);
  return (data ?? []).find((c) => (e && c.email?.trim().toLowerCase() === e) || (ph && normPhone(c.telephone) === ph)) ?? null;
}

type CreateOptions = { forcer?: boolean; lead?: boolean; origine: string; silencieux?: boolean };

/**
 * Crée un contact. Un nouveau lead génère une tâche « Appeler dans l'heure »
 * et une notification. Les champs récents (migration 007) sont tentés puis
 * abandonnés proprement si la base n'est pas encore à jour.
 */
export async function createContact(body: Record<string, unknown>, opts: CreateOptions) {
  if (!opts.forcer) {
    const dup = await findDuplicate(body.email as string, body.telephone as string);
    if (dup) return { ok: false as const, error: "doublon", existant: dup };
  }
  const clean = (v: unknown) => (typeof v === "string" ? v.trim() || null : v ?? null);
  const row: Record<string, unknown> = {};
  for (const f of CLIENT_EDITABLE_FIELDS) if (f in body) row[f] = clean(body[f]);
  row.prenom = String(body.prenom).trim();
  row.nom = String(body.nom).trim();

  let { data, error } = await supabaseAdmin.from("gpf_clients").insert(row).select("*").single();
  if (error && /column/i.test(error.message)) {
    const base = Object.fromEntries(Object.entries(row).filter(([k]) => BASE_FIELDS.includes(k)));
    ({ data, error } = await supabaseAdmin.from("gpf_clients").insert(base).select("*").single());
  }
  if (error || !data) return { ok: false as const, error: error?.message ?? "creation_impossible" };

  if (opts.lead) {
    await createTask({
      client_id: data.id,
      titre: `Appeler ${data.prenom} ${data.nom} (nouveau lead)`,
      categorie: "appel",
      echeance: addHours(new Date(), 1),
      auto: true,
      origine: "nouveau_lead"
    });
    if (!opts.silencieux) await notify("nouveau_lead", `Nouveau lead : ${data.prenom} ${data.nom}`, [data.provenance, data.telephone].filter(Boolean).join(" · ") || undefined, `/gpf/contacts/${data.id}`);
  }
  return { ok: true as const, client: data };
}
