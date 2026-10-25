import "server-only";
import { normalizeEnv } from "@/lib/monday";

/**
 * Audience de la campagne d'invitation au webinaire PER du 1er novembre 2026 :
 * une liste de contacts Brevo dédiée (créée et remplie par la route d'import),
 * relue à chaque envoi. Brevo est déjà le sous-traitant d'envoi de GP Finances.
 */
export const PROSPECTION_LIST_NAME = "Webinaire PER 1er novembre 2026 - prospects";
export const prospectionTag = (template: string) => `webinaire-per-nov-${template}`;

const BREVO = "https://api.brevo.com/v3";

const brevoKey = () => {
  const key = normalizeEnv(process.env.BREVO_API_KEY);
  if (!key) throw new Error("brevo_key_missing");
  return key;
};

const brevo = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${BREVO}${path}`, {
    ...init,
    headers: { accept: "application/json", "content-type": "application/json", "api-key": brevoKey(), ...(init.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(20000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`brevo_${response.status}:${(body as { message?: string }).message ?? path}`);
  return body as Record<string, unknown>;
};

export const findProspectionListId = async (): Promise<number | null> => {
  for (let offset = 0; offset < 1000; offset += 50) {
    const data = await brevo(`/contacts/lists?limit=50&offset=${offset}`);
    const lists = (data.lists as { id: number; name: string }[] | undefined) ?? [];
    const found = lists.find((l) => l.name === PROSPECTION_LIST_NAME);
    if (found) return found.id;
    if (lists.length < 50) return null;
  }
  return null;
};

export const ensureProspectionListId = async () => {
  const existing = await findProspectionListId();
  if (existing) return existing;
  const folders = await brevo("/contacts/folders?limit=10&offset=0");
  let folderId = ((folders.folders as { id: number }[] | undefined) ?? [])[0]?.id;
  if (!folderId) folderId = Number((await brevo("/contacts/folders", { method: "POST", body: JSON.stringify({ name: "GP Finances" }) })).id);
  const created = await brevo("/contacts/lists", { method: "POST", body: JSON.stringify({ name: PROSPECTION_LIST_NAME, folderId }) });
  return Number(created.id);
};

// Import asynchrone côté Brevo : seule l'adresse e-mail est transmise, aucun autre champ du fichier.
export const importProspects = async (listId: number, emails: string[]) => {
  const result = await brevo("/contacts/import", {
    method: "POST",
    body: JSON.stringify({
      jsonBody: emails.map((email) => ({ email })),
      listIds: [listId],
      updateExistingContacts: true,
      emptyContactsAttributes: false
    })
  });
  return result.processId;
};

export type ProspectContact = { email: string; emailBlacklisted: boolean; modifiedAt?: string };

export const readProspects = async (listId: number): Promise<ProspectContact[]> => {
  const out: ProspectContact[] = [];
  for (let offset = 0; offset < 20000; offset += 500) {
    const data = await brevo(`/contacts/lists/${listId}/contacts?limit=500&offset=${offset}&sort=asc`);
    const rows = (data.contacts as { email?: string; emailBlacklisted?: boolean; modifiedAt?: string }[] | undefined) ?? [];
    for (const row of rows) {
      const email = String(row.email ?? "").trim().toLowerCase();
      if (email) out.push({ email, emailBlacklisted: row.emailBlacklisted === true, modifiedAt: row.modifiedAt });
    }
    if (rows.length < 500) return out;
  }
  throw new Error("prospects_pagination_limit");
};

// Adresses déjà servies pour cette vague (événements « requests » depuis le début de la campagne),
// pour pouvoir relancer la tâche sans jamais envoyer deux fois le même message.
export const readAlreadySent = async (tag: string, startDate: string, endDate: string) => {
  const sent = new Set<string>();
  for (let offset = 0; offset < 50000; offset += 2500) {
    const data = await brevo(
      `/smtp/statistics/events?limit=2500&offset=${offset}&startDate=${startDate}&endDate=${endDate}&event=requests&tags=${encodeURIComponent(tag)}&sort=desc`
    );
    const events = (data.events as { email?: string }[] | undefined) ?? [];
    for (const event of events) if (event.email) sent.add(event.email.trim().toLowerCase());
    if (events.length < 2500) return sent;
  }
  throw new Error("events_pagination_limit");
};

// Désinscription d'un destinataire de la campagne : liste noire Brevo (contact créé si besoin).
export const blacklistInBrevo = async (email: string) => {
  await brevo("/contacts", { method: "POST", body: JSON.stringify({ email, emailBlacklisted: true, updateEnabled: true }) });
};

// Solde de crédits e-mail du compte Brevo (offre « payAsYouGo » ou abonnement).
export const readEmailCredits = async () => {
  const account = await brevo("/account");
  const plans = (account.plan as { type?: string; credits?: number; creditsType?: string }[] | undefined) ?? [];
  return plans.map((p) => ({ type: p.type, credits: p.credits, creditsType: p.creditsType }));
};
