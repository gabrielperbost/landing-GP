import "server-only";

/**
 * Stockage des inscriptions au webinaire PER grand public dans un Google Sheet,
 * via un déploiement Apps Script (voir docs/campaigns/webinaire-per-grand-public.md
 * pour le code à coller côté Google et les variables d'environnement requises).
 *
 * Aucune donnée n'est stockée si les variables ne sont pas configurées : les appels
 * échouent alors proprement (l'appelant doit prévoir un message « réessayez plus tard »).
 */

export type WebinarPerRegistration = {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  consentEmail: boolean;
  consentSms: boolean;
  source?: string;
  status?: "registered" | "unsubscribed";
};

export type WebinarPerReminderKey =
  | "reminder_11d_sent_at"
  | "reminder_9d_sent_at"
  | "reminder_7d_sent_at"
  | "reminder_5d_sent_at"
  | "reminder_3d_sent_at"
  | "reminder_1d_sent_at"
  | "reminder_morning_sent_at"
  | "replay_sent_at";

export type WebinarPerParticipant = {
  created_at: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  consent_email: boolean;
  consent_sms: boolean;
  status: string;
  source: string;
  reminder_7d_sent_at: string;
  reminder_3d_sent_at: string;
  reminder_1d_sent_at: string;
  reminder_morning_sent_at: string;
  reminder_11d_sent_at: string;
  reminder_9d_sent_at: string;
  reminder_5d_sent_at: string;
  replay_sent_at?: string;
};

const normalizeEnv = (value: string | undefined): string | undefined => {
  const trimmed = (value ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
};

const getConfig = () => {
  const url = normalizeEnv(process.env.WEBINAR_PER_GOOGLE_APPS_SCRIPT_URL);
  const secret = normalizeEnv(process.env.WEBINAR_PER_GOOGLE_APPS_SCRIPT_SECRET);
  if (!url || !secret) return null;
  return { url, secret };
};

export const isWebinarPerSheetConfigured = () => Boolean(getConfig());

// « sheet » : onglet du Google Sheet visé (une session de webinaire par onglet). Sans lui,
// l'Apps Script travaille sur « Feuille 1 » (session du 1er novembre), y compris un ancien script.
const DEFAULT_SHEET = "Feuille 1";

const post = async (body: Record<string, unknown>) => {
  const config = getConfig();
  if (!config) throw new Error("WEBINAR_PER_SHEET_NOT_CONFIGURED");
  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, secret: config.secret }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`WEBINAR_PER_SHEET_HTTP_${response.status}`);
  const data = (await response.json()) as { success: boolean; error?: string; sheet?: string; participants?: WebinarPerParticipant[] };
  if (!data.success) throw new Error(data.error || "WEBINAR_PER_SHEET_ERROR");
  return data;
};

/** Renvoie l'onglet où la ligne a réellement été écrite (un ancien Apps Script écrit toujours dans « Feuille 1 »). */
export const appendWebinarPerRegistration = async (registration: WebinarPerRegistration, sheet?: string) => {
  const data = await post({
    action: "append",
    sheet,
    registration: {
      prenom: registration.prenom,
      nom: registration.nom,
      email: registration.email.trim().toLowerCase(),
      telephone: registration.telephone || "",
      consent_email: registration.consentEmail ? "oui" : "non",
      consent_sms: registration.consentSms ? "oui" : "non",
      status: registration.status || "registered",
      source: registration.source || "webinaire-per",
      consent_at: new Date().toISOString()
    }
  });
  return { sheet: data.sheet ?? DEFAULT_SHEET };
};

export const markWebinarPerReminderSent = async (email: string, reminderKey: WebinarPerReminderKey, sentAt = new Date().toISOString(), sheet?: string) => {
  await post({ action: "mark_reminder_sent", sheet, email: email.trim().toLowerCase(), reminderKey, sentAt });
};

export const unsubscribeWebinarPerContact = async (email: string, sheet?: string) => {
  await post({ action: "unsubscribe", sheet, email: email.trim().toLowerCase() });
};

export const getWebinarPerParticipants = async (sheet?: string): Promise<WebinarPerParticipant[]> => {
  const config = getConfig();
  if (!config) return [];
  const url = new URL(config.url);
  url.searchParams.set("secret", config.secret);
  if (sheet && sheet !== DEFAULT_SHEET) url.searchParams.set("sheet", sheet);
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`WEBINAR_PER_SHEET_HTTP_${response.status}`);
  const data = (await response.json()) as { success: boolean; sheet?: string; participants?: WebinarPerParticipant[] };
  if (!data.success) throw new Error("WEBINAR_PER_SHEET_ERROR");
  // Un ancien Apps Script ignore « sheet » et renverrait l'onglet « Feuille 1 » : on refuse plutôt
  // que d'envoyer les rappels d'une session aux inscrits d'une autre.
  if (sheet && sheet !== DEFAULT_SHEET && data.sheet !== sheet) throw new Error("WEBINAR_PER_SHEET_SCRIPT_OUTDATED");
  return data.participants || [];
};
