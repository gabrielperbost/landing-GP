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

// Un Google Sheet (et son Apps Script) par session de webinaire. « sheetEnv » est le préfixe des
// variables d'environnement : WEBINAR_PER_… (1er novembre), WEBINAR_PER_8NOV_… (8 novembre).
const DEFAULT_SHEET_ENV = "WEBINAR_PER";

const getConfig = (sheetEnv = DEFAULT_SHEET_ENV) => {
  const url = normalizeEnv(process.env[`${sheetEnv}_GOOGLE_APPS_SCRIPT_URL`]);
  const secret = normalizeEnv(process.env[`${sheetEnv}_GOOGLE_APPS_SCRIPT_SECRET`]);
  if (!url || !secret) return null;
  return { url, secret };
};

export const isWebinarPerSheetConfigured = (sheetEnv?: string) => Boolean(getConfig(sheetEnv));

const post = async (body: Record<string, unknown>, sheetEnv?: string) => {
  const config = getConfig(sheetEnv);
  if (!config) throw new Error("WEBINAR_PER_SHEET_NOT_CONFIGURED");
  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, secret: config.secret }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`WEBINAR_PER_SHEET_HTTP_${response.status}`);
  const data = (await response.json()) as { success: boolean; error?: string; participants?: WebinarPerParticipant[] };
  if (!data.success) throw new Error(data.error || "WEBINAR_PER_SHEET_ERROR");
  return data;
};

export const appendWebinarPerRegistration = async (registration: WebinarPerRegistration, sheetEnv?: string) => {
  await post({
    action: "append",
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
  }, sheetEnv);
};

export const markWebinarPerReminderSent = async (email: string, reminderKey: WebinarPerReminderKey, sentAt = new Date().toISOString(), sheetEnv?: string) => {
  await post({ action: "mark_reminder_sent", email: email.trim().toLowerCase(), reminderKey, sentAt }, sheetEnv);
};

export const unsubscribeWebinarPerContact = async (email: string, sheetEnv?: string) => {
  await post({ action: "unsubscribe", email: email.trim().toLowerCase() }, sheetEnv);
};

export const getWebinarPerParticipants = async (sheetEnv?: string): Promise<WebinarPerParticipant[]> => {
  const config = getConfig(sheetEnv);
  if (!config) return [];
  const url = new URL(config.url);
  url.searchParams.set("secret", config.secret);
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`WEBINAR_PER_SHEET_HTTP_${response.status}`);
  const data = (await response.json()) as { success: boolean; participants?: WebinarPerParticipant[] };
  if (!data.success) throw new Error("WEBINAR_PER_SHEET_ERROR");
  return data.participants || [];
};
