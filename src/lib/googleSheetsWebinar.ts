import crypto from "crypto";
import { normalizeEnv } from "@/lib/monday";

export type WebinarSheetRegistration = {
  consent_at: string;
  prenom: string;
  nom: string;
  email: string;
  barreau: string;
  cabinet: string;
  telephone: string;
  status: string;
  source: string;
};

export type WebinarSheetParticipant = {
  created_at: string;
  prenom: string;
  nom: string;
  email: string;
  barreau: string;
  cabinet: string;
  telephone: string;
  status: string;
  source: string;
  reminder_30d_sent_at?: string;
  reminder_14d_sent_at?: string;
  reminder_7d_sent_at?: string;
  reminder_3d_sent_at?: string;
  reminder_1d_sent_at?: string;
  reminder_morning_sent_at?: string;
};

export type WebinarSheetUnsubscribe = {
  email: string;
  unsubscribed_at: string;
  source: string;
};

export type WebinarTrackingEventType = "questionnaire" | "plaquette" | "site";

export type WebinarSheetTrackingEvent = {
  event_at: string;
  event: WebinarTrackingEventType;
  email: string;
  prenom?: string;
  nom?: string;
  target_url?: string;
  source?: string;
};

export type WebinarTrackingEvent = {
  event_at: string;
  event: WebinarTrackingEventType;
  email: string;
  prenom: string;
  nom: string;
  target_url: string;
  source: string;
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SHEET_HEADERS = [
  "Date inscription",
  "Prénom",
  "Nom",
  "Email",
  "Barreau",
  "Cabinet",
  "Téléphone",
  "Statut",
  "Source",
  "Rappel 30j",
  "Rappel 14j",
  "Rappel 7j",
  "Rappel 3j",
  "Rappel veille",
  "Rappel matin"
];

export type WebinarReminderSheetKey =
  | "reminder_30d_sent_at"
  | "reminder_14d_sent_at"
  | "reminder_7d_sent_at"
  | "reminder_3d_sent_at"
  | "reminder_1d_sent_at"
  | "reminder_morning_sent_at";

const REMINDER_COLUMN_BY_KEY: Record<WebinarReminderSheetKey, number> = {
  reminder_30d_sent_at: 10,
  reminder_14d_sent_at: 11,
  reminder_7d_sent_at: 12,
  reminder_3d_sent_at: 13,
  reminder_1d_sent_at: 14,
  reminder_morning_sent_at: 15
};

const getAppsScriptConfig = () => {
  const url = normalizeEnv(process.env.WEBINAR_AVOCATS_GOOGLE_APPS_SCRIPT_URL);
  const secret = normalizeEnv(process.env.WEBINAR_AVOCATS_GOOGLE_APPS_SCRIPT_SECRET);
  if (!url || !secret) return null;
  return { url, secret };
};

const parseAppsScriptJson = async <T>(response: Response): Promise<T & { success?: boolean; error?: string }> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as T & { success?: boolean; error?: string };
  } catch {
    throw new Error(`Google Apps Script returned non-JSON response: ${response.status}`);
  }
};

const getGoogleSheetsConfig = () => {
  const spreadsheetId = normalizeEnv(process.env.WEBINAR_AVOCATS_GOOGLE_SHEET_ID);
  const sheetName = normalizeEnv(process.env.WEBINAR_AVOCATS_GOOGLE_SHEET_NAME) ?? "Inscriptions";
  const clientEmail = normalizeEnv(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const privateKey = normalizeEnv(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)?.replace(/\\n/g, "\n");

  if (!spreadsheetId || !clientEmail || !privateKey) return null;
  return { spreadsheetId, sheetName, clientEmail, privateKey };
};

export const isGoogleSheetsWebinarConfigured = () => Boolean(getAppsScriptConfig() || getGoogleSheetsConfig());

const appendWithAppsScript = async (registration: WebinarSheetRegistration) => {
  const config = getAppsScriptConfig();
  if (!config) return false;

  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      secret: config.secret,
      action: "append",
      registration
    })
  });

  const json = await parseAppsScriptJson<{ success?: boolean; error?: string }>(response);
  if (!response.ok || !json.success) {
    throw new Error(`Google Apps Script error: ${json.error || response.status}`);
  }

  return true;
};

const markReminderWithAppsScript = async ({
  email,
  reminderKey,
  sentAt
}: {
  email: string;
  reminderKey: WebinarReminderSheetKey;
  sentAt: string;
}) => {
  const config = getAppsScriptConfig();
  if (!config) return false;

  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      secret: config.secret,
      action: "mark_reminder_sent",
      email,
      reminderKey,
      sentAt
    })
  });

  const json = await parseAppsScriptJson<{ success?: boolean; error?: string }>(response);
  if (!response.ok || !json.success) {
    throw new Error(`Google Apps Script error: ${json.error || response.status}`);
  }

  return true;
};

const getParticipantsWithAppsScript = async () => {
  const config = getAppsScriptConfig();
  if (!config) return null;

  const url = new URL(config.url);
  url.searchParams.set("secret", config.secret);

  const response = await fetch(url.toString(), { cache: "no-store", signal: AbortSignal.timeout(60000) });
  const json = await parseAppsScriptJson<{
    success?: boolean;
    error?: string;
    participants?: WebinarSheetParticipant[];
  }>(response);

  if (!response.ok || !json.success) {
    throw new Error(`Google Apps Script error: ${json.error || response.status}`);
  }

  return json.participants ?? [];
};

const base64Url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

const getGoogleAccessToken = async (config: NonNullable<ReturnType<typeof getGoogleSheetsConfig>>) => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: config.clientEmail,
      scope: GOOGLE_SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now
    })
  );
  const unsignedToken = `${header}.${claim}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsignedToken), config.privateKey);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  const json = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !json.access_token) {
    throw new Error(`Google OAuth error: ${json.error_description || json.error || response.status}`);
  }

  return json.access_token;
};

const sheetsFetch = async <T>({
  path,
  method = "GET",
  body
}: {
  path: string;
  method?: "GET" | "PUT" | "POST";
  body?: unknown;
}) => {
  const config = getGoogleSheetsConfig();
  if (!config) throw new Error("Configuration Google Sheets manquante");

  const token = await getGoogleAccessToken(config);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const json = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(`Google Sheets error: ${json.error?.message || response.status}`);
  }

  return json;
};

const range = (sheetName: string, a1: string) => `${encodeURIComponent(`'${sheetName}'!${a1}`)}`;

export const ensureWebinarSheetHeaders = async () => {
  const config = getGoogleSheetsConfig();
  if (!config) return false;

  const current = await sheetsFetch<{ values?: string[][] }>({
    path: `/values/${range(config.sheetName, "A1:O1")}`
  });

  const existingHeaders = current.values?.[0] ?? [];
  if (existingHeaders.join("|") === SHEET_HEADERS.join("|")) return true;

  await sheetsFetch({
    path: `/values/${range(config.sheetName, "A1:O1")}?valueInputOption=RAW`,
    method: "PUT",
    body: {
      range: `'${config.sheetName}'!A1:O1`,
      majorDimension: "ROWS",
      values: [SHEET_HEADERS]
    }
  });

  return true;
};

export const appendWebinarRegistrationToSheet = async (registration: WebinarSheetRegistration) => {
  if (getAppsScriptConfig()) {
    return appendWithAppsScript(registration);
  }

  const config = getGoogleSheetsConfig();
  if (!config) return false;

  await ensureWebinarSheetHeaders();
  const existing = await sheetsFetch<{ values?: string[][] }>({
    path: `/values/${range(config.sheetName, "A2:O")}`
  });

  const values = [
    registration.consent_at,
    registration.prenom,
    registration.nom,
    registration.email,
    registration.barreau,
    registration.cabinet,
    registration.telephone,
    registration.status,
    registration.source,
    "",
    "",
    "",
    "",
    "",
    ""
  ];

  const existingIndex = (existing.values ?? []).findIndex((row) => row[3]?.trim().toLowerCase() === registration.email.toLowerCase());

  if (existingIndex >= 0) {
    const rowNumber = existingIndex + 2;
    await sheetsFetch({
      path: `/values/${range(config.sheetName, `A${rowNumber}:O${rowNumber}`)}?valueInputOption=USER_ENTERED`,
      method: "PUT",
      body: {
        range: `'${config.sheetName}'!A${rowNumber}:O${rowNumber}`,
        majorDimension: "ROWS",
        values: [values]
      }
    });

    return true;
  }

  await sheetsFetch({
    path: `/values/${range(config.sheetName, "A:O")}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    method: "POST",
    body: {
      values: [values]
    }
  });

  return true;
};

export const appendWebinarUnsubscribeToSheet = async (unsubscribe: WebinarSheetUnsubscribe) =>
  appendWebinarRegistrationToSheet({
    consent_at: unsubscribe.unsubscribed_at,
    prenom: "",
    nom: "",
    email: unsubscribe.email,
    barreau: "",
    cabinet: "",
    telephone: "",
    status: "unsubscribed",
    source: unsubscribe.source
  });

const trackingEmailForEvent = (tracking: WebinarSheetTrackingEvent) => {
  const hash = crypto
    .createHash("sha1")
    .update(`${tracking.event_at}|${tracking.event}|${tracking.email}|${tracking.target_url ?? ""}`)
    .digest("hex")
    .slice(0, 16);

  return `tracking-${tracking.event}-${hash}@gp-tracking.local`;
};

export const appendWebinarTrackingEventToSheet = async (tracking: WebinarSheetTrackingEvent) =>
  appendWebinarRegistrationToSheet({
    consent_at: tracking.event_at,
    prenom: tracking.prenom ?? "",
    nom: tracking.nom ?? "",
    email: trackingEmailForEvent(tracking),
    barreau: tracking.event,
    cabinet: tracking.email,
    telephone: tracking.target_url ?? "",
    status: "tracking",
    source: tracking.source ?? "webinaire-per-avocats-email"
  });

export const markWebinarReminderSentInSheet = async ({
  email,
  reminderKey,
  sentAt
}: {
  email: string;
  reminderKey: WebinarReminderSheetKey;
  sentAt: string;
}) => {
  if (getAppsScriptConfig()) {
    return markReminderWithAppsScript({ email, reminderKey, sentAt });
  }

  const config = getGoogleSheetsConfig();
  if (!config) return false;

  const existing = await sheetsFetch<{ values?: string[][] }>({
    path: `/values/${range(config.sheetName, "A2:O")}`
  });
  const existingIndex = (existing.values ?? []).findIndex((row) => row[3]?.trim().toLowerCase() === email.toLowerCase());
  if (existingIndex < 0) return false;

  const rowNumber = existingIndex + 2;
  const columnNumber = REMINDER_COLUMN_BY_KEY[reminderKey];
  const columnLetter = String.fromCharCode("A".charCodeAt(0) + columnNumber - 1);

  await sheetsFetch({
    path: `/values/${range(config.sheetName, `${columnLetter}${rowNumber}:${columnLetter}${rowNumber}`)}?valueInputOption=USER_ENTERED`,
    method: "PUT",
    body: {
      range: `'${config.sheetName}'!${columnLetter}${rowNumber}:${columnLetter}${rowNumber}`,
      majorDimension: "ROWS",
      values: [[sentAt]]
    }
  });

  return true;
};

export const getWebinarParticipantsFromSheet = async () => {
  if (getAppsScriptConfig()) {
    return getParticipantsWithAppsScript();
  }

  const config = getGoogleSheetsConfig();
  if (!config) return null;

  const response = await sheetsFetch<{ values?: string[][] }>({
    path: `/values/${range(config.sheetName, "A2:O")}`
  });

  return (response.values ?? [])
    .filter((row) => row.some(Boolean))
    .map((row): WebinarSheetParticipant => ({
      created_at: row[0] ?? "",
      prenom: row[1] ?? "",
      nom: row[2] ?? "",
      email: row[3] ?? "",
      barreau: row[4] ?? "",
      cabinet: row[5] ?? "",
      telephone: row[6] ?? "",
      status: row[7] ?? "registered",
      source: row[8] ?? "webinaire-per-avocats",
      reminder_30d_sent_at: row[9] ?? "",
      reminder_14d_sent_at: row[10] ?? "",
      reminder_7d_sent_at: row[11] ?? "",
      reminder_3d_sent_at: row[12] ?? "",
      reminder_1d_sent_at: row[13] ?? "",
      reminder_morning_sent_at: row[14] ?? ""
    }));
};

export const getWebinarUnsubscribedEmailsFromSheet = async () => {
  const participants = await getWebinarParticipantsFromSheet();
  return new Set(
    (participants ?? [])
      .filter((participant) => participant.status.trim().toLowerCase() === "unsubscribed")
      .map((participant) => participant.email.trim().toLowerCase())
      .filter(Boolean)
  );
};

export const getWebinarTrackingEventsFromSheet = async () => {
  const participants = await getWebinarParticipantsFromSheet();
  return (participants ?? [])
    .filter((participant) => participant.status.trim().toLowerCase() === "tracking")
    .filter((participant) => participant.source.trim().toLowerCase() !== "test-tracking")
    .map((participant): WebinarTrackingEvent | null => {
      const event = participant.barreau.trim().toLowerCase();
      if (!["questionnaire", "plaquette", "site"].includes(event)) return null;

      return {
        event_at: participant.created_at,
        event: event as WebinarTrackingEventType,
        email: participant.cabinet.trim().toLowerCase(),
        prenom: participant.prenom,
        nom: participant.nom,
        target_url: participant.telephone,
        source: participant.source
      };
    })
    .filter((event): event is WebinarTrackingEvent => Boolean(event?.email));
};
