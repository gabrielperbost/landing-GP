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
  | "reminder_7d_sent_at"
  | "reminder_3d_sent_at"
  | "reminder_1d_sent_at"
  | "reminder_morning_sent_at";

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
  const data = (await response.json()) as { success: boolean; error?: string; participants?: WebinarPerParticipant[] };
  if (!data.success) throw new Error(data.error || "WEBINAR_PER_SHEET_ERROR");
  return data;
};

export const appendWebinarPerRegistration = async (registration: WebinarPerRegistration) => {
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
  });
};

export const markWebinarPerReminderSent = async (email: string, reminderKey: WebinarPerReminderKey, sentAt = new Date().toISOString()) => {
  await post({ action: "mark_reminder_sent", email: email.trim().toLowerCase(), reminderKey, sentAt });
};

export const unsubscribeWebinarPerContact = async (email: string) => {
  await post({ action: "unsubscribe", email: email.trim().toLowerCase() });
};

export const getWebinarPerParticipants = async (): Promise<WebinarPerParticipant[]> => {
  const config = getConfig();
  if (!config) return [];
  const url = new URL(config.url);
  url.searchParams.set("secret", config.secret);
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`WEBINAR_PER_SHEET_HTTP_${response.status}`);
  const data = (await response.json()) as { success: boolean; participants?: WebinarPerParticipant[] };
  if (!data.success) throw new Error("WEBINAR_PER_SHEET_ERROR");
  return data.participants || [];
};
