import "server-only";

import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  callMondayApi,
  extractEmailFromColumn,
  findItemColumnValue,
  getItemById,
  normalizeEnv,
  normalizeText,
  updateItemMultipleColumns,
  type MondayItem
} from "@/lib/monday";
import { getNextPerSequenceDay, getPerEmailByDay, type PerLead } from "@/lib/perEmailSequence";
import { findKnownPerLeadIngestion, rememberPerLeadIngestion } from "@/lib/perLeadIngestionStore";

const BOARD_ID = "5090527669";
const GROUP_ID = "group_mm3jv7pm";

export const PER_COLUMNS = {
  phone: "phone_mm3j3d92",
  emailLog: "long_text_mm3yv05x",
  unsubscribed: "boolean_mm3y54p1",
  appointmentBooked: "boolean_mm3yw3j",
  calendly: "link_mm3yx36c",
  source: "text_mm3ypgxj",
  tallyResponseId: "text_mm3y9bwa",
  nextEmailAt: "date_mm3ywg6h",
  lastEmailAt: "date_mm3yznqh",
  sequenceStartedAt: "date_mm3y7ecn",
  sequenceDay: "numeric_mm3ypyef",
  sequenceStatus: "color_mm3ybbw8",
  salesAction: "color_mm3y9spm",
  leadType: "color_mm3yn96z",
  email: "email_mm3yk07k",
  nom: "text_mm3y28yx",
  prenom: "text_mm3yych3"
} as const;

type TallyField = {
  key: string;
  label: string;
  type: string;
  value: unknown;
};

export type PerCampaignLead = Omit<PerLead, "jour"> & {
  tallyResponseId: string;
  source: string;
  hasPhone: boolean;
};

type MondayLeadItem = Pick<MondayItem, "id" | "name" | "column_values"> & {
  group?: { id: string; title: string } | null;
};

const parsePort = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const getBaseUrl = () => (normalizeEnv(process.env.NEXT_PUBLIC_BASE_URL) ?? "https://gp-finances.fr").replace(/\/+$/, "");

export const getPerWebhookSecret = () => normalizeEnv(process.env.PER_TALLY_WEBHOOK_SECRET) ?? normalizeEnv(process.env.TALLY_WEBHOOK_SECRET);

export const getPerSequenceSecret = () =>
  normalizeEnv(process.env.PER_SEQUENCE_CRON_SECRET) ?? normalizeEnv(process.env.CRON_SECRET);

export const getPerImportSecret = () =>
  normalizeEnv(process.env.PER_TALLY_PARTIALS_SECRET) ?? getPerSequenceSecret() ?? getPerWebhookSecret();

const getPerPhoneCallbackSecret = () =>
  normalizeEnv(process.env.PER_PHONE_CALLBACK_SECRET) ?? getPerSequenceSecret() ?? getPerWebhookSecret();

const getCalendlyUrl = () =>
  normalizeEnv(process.env.CALENDLY_URL) ??
  normalizeEnv(process.env.NEXT_PUBLIC_PER_CALENDLY_URL) ??
  "https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale";

const addDays = (isoDate: string, days: number) => {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};

const toDateValue = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return { date: date.toISOString().slice(0, 10) };
};

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(normalizeValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const candidate = value as Record<string, unknown>;
    for (const key of ["email", "phone", "text", "label", "name", "value"]) {
      const normalized = normalizeValue(candidate[key]);
      if (normalized) return normalized;
    }
    return Object.values(candidate).map(normalizeValue).filter(Boolean).join(", ");
  }
  return String(value).trim();
};

const directValue = (payload: unknown, keys: string[]) => {
  const root = payload as Record<string, unknown>;
  const sources = [root, root?.data, root?.event, root?.payload].filter((item) => item && typeof item === "object") as Record<
    string,
    unknown
  >[];

  for (const source of sources) {
    for (const key of keys) {
      const value = normalizeValue(source[key]);
      if (value) return value;
    }
  }
  return "";
};

const collectTallyFields = (payload: unknown): TallyField[] => {
  const root = payload as { data?: { fields?: unknown }; fields?: unknown; payload?: { fields?: unknown } };
  const candidates = [root.data?.fields, root.fields, root.payload?.fields].filter(Array.isArray) as unknown[][];
  return candidates.flat().map((field) => {
    const candidate = field as Record<string, unknown>;
    return {
      key: normalizeValue(candidate.key || candidate.id),
      label: normalizeValue(candidate.label || candidate.title || candidate.name),
      type: normalizeValue(candidate.type),
      value: candidate.value ?? candidate.answer ?? candidate.text ?? ""
    };
  });
};

const fieldSignature = (field: TallyField) => normalizeText(`${field.label} ${field.key} ${field.type}`);

const findFieldValue = (fields: TallyField[], patterns: RegExp[]) => {
  for (const field of fields) {
    const signature = fieldSignature(field);
    if (patterns.some((pattern) => pattern.test(signature))) {
      const value = normalizeValue(field.value);
      if (value) return value;
    }
  }
  return "";
};

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
};

const hasUsablePhone = (phone: string) => phone.replace(/\D/g, "").length >= 9;
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const normalizeEmailForToken = (email: string) => email.trim().toLowerCase();
const normalizePhoneForMonday = (phone: string) => phone.replace(/[^\d+]/g, "").trim();

const signPerPhoneCallback = ({ itemId, email }: { itemId: string; email: string }) => {
  const secret = getPerPhoneCallbackSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(`${itemId}:${normalizeEmailForToken(email)}`).digest("hex").slice(0, 40);
};

export const verifyPerPhoneCallbackToken = ({ itemId, email, token }: { itemId: string; email: string; token: string }) => {
  const expected = signPerPhoneCallback({ itemId, email });
  if (!expected || !token || expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
};

export const createPerPhoneCallbackUrl = ({
  itemId,
  email,
  baseUrl = getBaseUrl()
}: {
  itemId: string;
  email: string;
  baseUrl?: string;
}) => {
  const params = new URLSearchParams({
    item: itemId,
    email,
    token: signPerPhoneCallback({ itemId, email })
  });
  return `${baseUrl.replace(/\/+$/, "")}/per/rappel?${params.toString()}`;
};

export const extractTallyPerLead = (payload: unknown): PerCampaignLead => {
  const fields = collectTallyFields(payload);
  const fullName =
    directValue(payload, ["name", "fullName", "full_name", "nom_complet"]) ||
    findFieldValue(fields, [/prenom.*nom/, /nom.*prenom/, /nom complet/, /full name/]);

  let prenom =
    directValue(payload, ["prenom", "firstName", "first_name", "firstname"]) ||
    findFieldValue(fields, [/(^|\s)prenom($|\s)/, /first name/]);
  let nom =
    directValue(payload, ["nom", "lastName", "last_name", "lastname"]) ||
    findFieldValue(fields, [/(^|\s)nom($|\s)/, /last name/]);

  if ((!prenom || !nom) && fullName) {
    const parsed = splitFullName(fullName);
    prenom = prenom || parsed.prenom;
    nom = nom || parsed.nom;
  }

  if (prenom && nom && prenom === nom) {
    const parsed = splitFullName(prenom);
    prenom = parsed.prenom;
    nom = parsed.nom;
  }

  const email = (
    directValue(payload, ["email", "mail"]) || findFieldValue(fields, [/email/, /mail/])
  ).toLowerCase();
  const telephone =
    directValue(payload, ["telephone", "phone", "mobile", "tel"]) ||
    findFieldValue(fields, [/telephone/, /portable/, /mobile/, /phone/, /(^|\s)tel($|\s)/]);
  const situation =
    directValue(payload, ["situation", "statut", "profession"]) ||
    findFieldValue(fields, [/situation/, /statut/, /profession/, /salarie/, /fonctionnaire/]);
  const retraite =
    directValue(payload, ["retraite", "horizonRetraite", "horizon_retraite"]) ||
    findFieldValue(fields, [/retraite/, /horizon/, /depart/]);

  const root = payload as { data?: Record<string, unknown>; eventId?: unknown };
  const tallyResponseId =
    directValue(payload, ["responseId", "response_id", "submissionId", "submission_id"]) ||
    normalizeValue(root.data?.responseId || root.data?.submissionId || root.eventId);
  const formName = directValue(payload, ["formName", "form_name"]) || normalizeValue(root.data?.formName);
  const hasPhone = hasUsablePhone(telephone);

  return {
    prenom: prenom || "Bonjour",
    nom,
    email,
    telephone,
    situation,
    retraite,
    tallyResponseId,
    source: formName ? `Tally - ${formName}` : "Tally",
    calendlyUrl: getCalendlyUrl(),
    unsubscribeUrl: `${getBaseUrl()}/api/tally/per-unsubscribe?email=${encodeURIComponent(email)}`,
    hasPhone
  };
};

const setColumn = (values: Record<string, unknown>, columnId: string, value: unknown) => {
  if (value === undefined || value === null || value === "") return;
  values[columnId] = value;
};

const buildLeadItemName = (lead: PerCampaignLead) => {
  const fullName = [lead.prenom, lead.nom].filter(Boolean).join(" ").trim();
  return fullName || lead.email || lead.telephone || "Lead Tally";
};

const getItemEmail = (item: MondayLeadItem) => extractEmailFromColumn(findItemColumnValue(item.column_values, PER_COLUMNS.email));
const getItemPhone = (item: MondayLeadItem) => findItemColumnValue(item.column_values, PER_COLUMNS.phone)?.text || "";
const getItemFirstName = (item: MondayLeadItem) => findItemColumnValue(item.column_values, PER_COLUMNS.prenom)?.text || "";
const getItemLastName = (item: MondayLeadItem) => findItemColumnValue(item.column_values, PER_COLUMNS.nom)?.text || "";
const getItemLog = (item: MondayLeadItem) => findItemColumnValue(item.column_values, PER_COLUMNS.emailLog)?.text?.trim() || "";

export const createPerMondayLead = async (lead: PerCampaignLead) => {
  const now = new Date().toISOString();
  const values: Record<string, unknown> = {};

  setColumn(values, PER_COLUMNS.prenom, lead.prenom);
  setColumn(values, PER_COLUMNS.nom, lead.nom);
  setColumn(values, PER_COLUMNS.email, { email: lead.email, text: lead.email });
  setColumn(values, PER_COLUMNS.phone, lead.telephone ? { phone: lead.telephone, countryShortName: "FR" } : undefined);
  setColumn(values, PER_COLUMNS.leadType, { label: lead.hasPhone ? "A un téléphone" : "Email seulement" });
  setColumn(values, PER_COLUMNS.salesAction, { label: lead.hasPhone ? "Rappel sous 5 min" : "Séquence email active" });
  setColumn(values, PER_COLUMNS.sequenceStatus, { label: lead.hasPhone ? "Non applicable" : "Active" });
  setColumn(values, PER_COLUMNS.sequenceDay, lead.hasPhone ? undefined : "0");
  setColumn(values, PER_COLUMNS.sequenceStartedAt, toDateValue(now));
  setColumn(values, PER_COLUMNS.nextEmailAt, lead.hasPhone ? undefined : toDateValue(now));
  setColumn(values, PER_COLUMNS.tallyResponseId, lead.tallyResponseId);
  setColumn(values, PER_COLUMNS.source, lead.source);
  setColumn(values, PER_COLUMNS.calendly, { url: lead.calendlyUrl, text: "Calendly" });
  setColumn(values, PER_COLUMNS.appointmentBooked, { checked: "false" });
  setColumn(values, PER_COLUMNS.unsubscribed, { checked: "false" });
  setColumn(values, PER_COLUMNS.emailLog, {
    text: lead.hasPhone ? "Lead avec téléphone: rappel sous 5 min." : "Séquence email créée depuis Tally."
  });

  const data = await callMondayApi<{ create_item: { id: string } }>(
    `
      mutation CreatePerLead($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
        create_item(
          board_id: $boardId,
          group_id: $groupId,
          item_name: $itemName,
          column_values: $columnValues,
          create_labels_if_missing: true
        ) {
          id
        }
      }
    `,
    {
      boardId: BOARD_ID,
      groupId: GROUP_ID,
      itemName: buildLeadItemName(lead),
      columnValues: JSON.stringify(values)
    }
  );

  return data.create_item.id;
};

const createTransporter = () => {
  const host = normalizeEnv(process.env.SMTP_HOST);
  const user = normalizeEnv(process.env.SMTP_USER);
  const pass = normalizeEnv(process.env.SMTP_PASS);
  if (!host || !user || !pass) throw new Error("Configuration SMTP manquante");

  return nodemailer.createTransport({
    host,
    port: parsePort(normalizeEnv(process.env.SMTP_PORT), 465),
    secure: normalizeEnv(process.env.SMTP_SECURE) !== "false",
    auth: { user, pass }
  });
};

export const sendPerEmail = async (lead: PerLead) => {
  if (!isValidEmail(lead.email)) throw new Error("Email invalide");
  const senderName = normalizeEnv(process.env.SENDER_NAME) || "Gabriel PERBOST — GP FINANCES";
  const user = normalizeEnv(process.env.SMTP_USER);
  if (!user) throw new Error("SMTP_USER manquant");

  const mail = getPerEmailByDay(lead.jour, lead);
  const info = await createTransporter().sendMail({
    from: `"${senderName}" <${user}>`,
    to: lead.email,
    subject: mail.subject,
    html: mail.html,
    attachments: mail.attachments
  });
  return { subject: mail.subject, messageId: info.messageId };
};

export const markPerEmailSent = async ({
  itemId,
  day,
  sentAt,
  subject,
  previousLog
}: {
  itemId: string;
  day: number;
  sentAt: string;
  subject: string;
  previousLog?: string;
}) => {
  const nextDay = getNextPerSequenceDay(day);
  const nextSendAt = nextDay === null ? null : addDays(sentAt, nextDay - day);
  const logLines = [previousLog?.trim(), `J${day} envoyé le ${sentAt} — ${subject}`].filter(Boolean);

  const values: Record<string, unknown> = {
    [PER_COLUMNS.sequenceStatus]: { label: nextDay === null ? "Terminée" : "Active" },
    [PER_COLUMNS.salesAction]: { label: nextDay === null ? "Séquence terminée" : "Séquence email active" },
    [PER_COLUMNS.sequenceDay]: String(day),
    [PER_COLUMNS.lastEmailAt]: toDateValue(sentAt),
    [PER_COLUMNS.emailLog]: { text: logLines.join("\n") }
  };
  if (nextSendAt) values[PER_COLUMNS.nextEmailAt] = toDateValue(nextSendAt);

  await updateItemMultipleColumns({
    boardId: BOARD_ID,
    itemId,
    columnValues: values
  });
};

export const stopPerSequence = async ({ itemId, statusLabel, actionLabel }: { itemId: string; statusLabel: string; actionLabel: string }) => {
  await updateItemMultipleColumns({
    boardId: BOARD_ID,
    itemId,
    columnValues: {
      [PER_COLUMNS.sequenceStatus]: { label: statusLabel },
      [PER_COLUMNS.salesAction]: { label: actionLabel }
    }
  });
};

const checkboxChecked = (value: string | null | undefined) => {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value) as { checked?: boolean | string };
    return parsed.checked === true || parsed.checked === "true";
  } catch {
    return false;
  }
};

export const getPerStopReason = (item: MondayLeadItem) => {
  const status = normalizeText(findItemColumnValue(item.column_values, PER_COLUMNS.sequenceStatus)?.text);
  const action = normalizeText(findItemColumnValue(item.column_values, PER_COLUMNS.salesAction)?.text);

  if (checkboxChecked(findItemColumnValue(item.column_values, PER_COLUMNS.unsubscribed)?.value) || status.includes("desinscrit")) {
    return { statusLabel: "Désinscrit", actionLabel: "Désinscrit" };
  }
  if (
    checkboxChecked(findItemColumnValue(item.column_values, PER_COLUMNS.appointmentBooked)?.value) ||
    status.includes("rdv") ||
    action.includes("rdv")
  ) {
    return { statusLabel: "RDV pris", actionLabel: "RDV téléphonique" };
  }
  if (status.includes("stop") || status.includes("terminee")) {
    return { statusLabel: "Stop manuel", actionLabel: "Séquence stoppée" };
  }
  return null;
};

export const getPerLeadFromMondayItem = (item: MondayLeadItem, day: number): PerLead => ({
  prenom: findItemColumnValue(item.column_values, PER_COLUMNS.prenom)?.text || "Bonjour",
  nom: findItemColumnValue(item.column_values, PER_COLUMNS.nom)?.text || "",
  email: extractEmailFromColumn(findItemColumnValue(item.column_values, PER_COLUMNS.email)),
  telephone: findItemColumnValue(item.column_values, PER_COLUMNS.phone)?.text || "",
  jour: day,
  calendlyUrl: getCalendlyUrl(),
  callbackUrl: createPerPhoneCallbackUrl({
    itemId: item.id,
    email: extractEmailFromColumn(findItemColumnValue(item.column_values, PER_COLUMNS.email))
  }),
  unsubscribeUrl: `${getBaseUrl()}/api/tally/per-unsubscribe?item=${encodeURIComponent(item.id)}`,
  situation: "",
  retraite: ""
});

export const getPerMondayItem = async (itemId: string) => getItemById(itemId);

type MondayLeadItemsPage = {
  cursor: string | null;
  items: MondayLeadItem[];
};

type PerLeadDuplicate =
  | { kind: "active_item"; item: MondayLeadItem }
  | { kind: "moved_item"; item: MondayLeadItem }
  | { kind: "known_ingestion"; record: Awaited<ReturnType<typeof findKnownPerLeadIngestion>> };

const isTargetLeadGroup = (item: MondayLeadItem) => item.group?.id === GROUP_ID;

const isUpdatableLeadDuplicate = (duplicate: PerLeadDuplicate): duplicate is { kind: "active_item"; item: MondayLeadItem } =>
  duplicate.kind === "active_item";

const rememberPerLead = async (lead: PerCampaignLead, item?: MondayLeadItem | null) =>
  rememberPerLeadIngestion({
    tallyResponseId: lead.tallyResponseId,
    email: lead.email,
    phone: lead.telephone,
    mondayItemId: item?.id,
    mondayBoardId: BOARD_ID,
    mondayGroupId: item?.group?.id ?? "",
    source: lead.source
  });

const getPerBoardItemsPage = async ({ cursor, limit }: { cursor?: string | null; limit: number }) => {
  const data = await callMondayApi<{ boards: Array<{ items_page: MondayLeadItemsPage }> }>(
    cursor
      ? `
          query GetPerBoardLeadsPage($boardId: [ID!], $limit: Int!, $cursor: String!) {
            boards(ids: $boardId) {
              items_page(limit: $limit, cursor: $cursor) {
                cursor
                items {
                  id
                  name
                  group {
                    id
                    title
                  }
                  column_values {
                    id
                    type
                    text
                    value
                  }
                }
              }
            }
          }
        `
      : `
          query GetPerBoardLeadsPage($boardId: [ID!], $limit: Int!) {
            boards(ids: $boardId) {
              items_page(limit: $limit) {
                cursor
                items {
                  id
                  name
                  group {
                    id
                    title
                  }
                  column_values {
                    id
                    type
                    text
                    value
                  }
                }
              }
            }
          }
        `,
    { boardId: BOARD_ID, limit, cursor }
  );

  return data.boards[0]?.items_page ?? { cursor: null, items: [] };
};

export const getPerBoardItems = async ({ limit = 500, pageSize = 100 } = {}) => {
  const items: MondayLeadItem[] = [];
  let cursor: string | null = null;

  do {
    const page = await getPerBoardItemsPage({ cursor, limit: Math.min(pageSize, limit - items.length) });
    items.push(...page.items);
    cursor = page.cursor;
  } while (cursor && items.length < limit);

  return items.slice(0, limit);
};

export const getPerLeadGroupItems = async ({ limit = 100 } = {}) => {
  const data = await callMondayApi<{ boards: Array<{ groups: Array<{ items_page: MondayLeadItemsPage }> }> }>(
    `
      query GetPerLeads($boardId: [ID!], $limit: Int!) {
        boards(ids: $boardId) {
          groups(ids: ["${GROUP_ID}"]) {
            items_page(limit: $limit) {
              cursor
              items {
                id
                name
                group {
                  id
                  title
                }
                column_values {
                  id
                  type
                  text
                  value
                }
              }
            }
          }
        }
      }
    `,
    { boardId: BOARD_ID, limit }
  );

  return data.boards[0]?.groups[0]?.items_page.items ?? [];
};

export const getDuePerSequenceItems = async ({ limit = 100 } = {}) => {
  const today = new Date().toISOString().slice(0, 10);
  const items = await getPerLeadGroupItems({ limit });
  return items.filter((item) => {
    const status = normalizeText(findItemColumnValue(item.column_values, PER_COLUMNS.sequenceStatus)?.text);
    const nextEmailAt = findItemColumnValue(item.column_values, PER_COLUMNS.nextEmailAt)?.text || "";
    const dayText = findItemColumnValue(item.column_values, PER_COLUMNS.sequenceDay)?.text || "";
    const day = Number(dayText);
    if (status !== "active") return false;
    if (!Number.isFinite(day)) return false;
    if (!nextEmailAt || nextEmailAt > today) return false;
    return true;
  });
};

export const getCurrentPerSequenceDay = (item: MondayLeadItem) => {
  const sentDay = Number(findItemColumnValue(item.column_values, PER_COLUMNS.sequenceDay)?.text || "0");
  const nextDay = getNextPerSequenceDay(sentDay);
  return nextDay;
};

const isSamePerLead = (item: MondayLeadItem, lead: PerCampaignLead) => {
  const email = lead.email.toLowerCase();
  const phone = lead.telephone?.replace(/\D/g, "") || "";
  const itemEmail = extractEmailFromColumn(findItemColumnValue(item.column_values, PER_COLUMNS.email)).toLowerCase();
  const itemPhone = (findItemColumnValue(item.column_values, PER_COLUMNS.phone)?.text || "").replace(/\D/g, "");
  const tallyId = findItemColumnValue(item.column_values, PER_COLUMNS.tallyResponseId)?.text || "";

  return (lead.tallyResponseId && tallyId === lead.tallyResponseId) || (email && itemEmail === email) || (phone && itemPhone === phone);
};

export const findDuplicatePerLead = async (lead: PerCampaignLead) => {
  const items = await getPerBoardItems({ limit: 500 });
  const item = items.find((candidate) => isSamePerLead(candidate, lead)) ?? null;
  if (item) {
    await rememberPerLead(lead, item);
    return isTargetLeadGroup(item)
      ? ({ kind: "active_item", item } as const)
      : ({ kind: "moved_item", item } as const);
  }

  const known = await findKnownPerLeadIngestion({
    tallyResponseId: lead.tallyResponseId,
    email: lead.email,
    phone: lead.telephone
  });
  return known ? ({ kind: "known_ingestion", record: known } as const) : null;
};

export const hasDuplicatePerLead = async (lead: PerCampaignLead) => Boolean(await findDuplicatePerLead(lead));

export const upgradePerLeadWithPhone = async ({ item, lead }: { item: MondayLeadItem; lead: PerCampaignLead }) => {
  const previousLog = getItemLog(item);
  const now = new Date().toISOString();
  const values: Record<string, unknown> = {
    name: buildLeadItemName(lead),
    [PER_COLUMNS.leadType]: { label: "A un téléphone" },
    [PER_COLUMNS.salesAction]: { label: "Rappel sous 5 min" },
    [PER_COLUMNS.sequenceStatus]: { label: "Stoppée - téléphone reçu" },
    [PER_COLUMNS.emailLog]: {
      text: [previousLog, `Téléphone reçu le ${now} — séquence email stoppée, rappel prioritaire.`].filter(Boolean).join("\n")
    }
  };

  setColumn(values, PER_COLUMNS.phone, { phone: lead.telephone, countryShortName: "FR" });
  setColumn(values, PER_COLUMNS.prenom, lead.prenom === "Bonjour" ? undefined : lead.prenom);
  setColumn(values, PER_COLUMNS.nom, lead.nom);
  setColumn(values, PER_COLUMNS.source, lead.source);

  await updateItemMultipleColumns({
    boardId: BOARD_ID,
    itemId: item.id,
    columnValues: values
  });

  return item.id;
};

export const recordPerLeadPhoneReceived = async ({
  itemId,
  email,
  phone
}: {
  itemId: string;
  email: string;
  phone: string;
}) => {
  const item = await getItemById(itemId);
  if (!item || item.board.id !== BOARD_ID) {
    throw new Error("per_lead_not_found");
  }

  const itemEmail = extractEmailFromColumn(findItemColumnValue(item.column_values, PER_COLUMNS.email));
  if (!itemEmail || normalizeEmailForToken(itemEmail) !== normalizeEmailForToken(email)) {
    throw new Error("per_lead_email_mismatch");
  }

  const normalizedPhone = normalizePhoneForMonday(phone);
  if (!hasUsablePhone(normalizedPhone)) {
    throw new Error("invalid_phone");
  }

  const previousLog = getItemLog(item);
  const now = new Date().toISOString();
  await updateItemMultipleColumns({
    boardId: BOARD_ID,
    itemId,
    columnValues: {
      [PER_COLUMNS.phone]: { phone: normalizedPhone, countryShortName: "FR" },
      [PER_COLUMNS.leadType]: { label: "A un téléphone" },
      [PER_COLUMNS.salesAction]: { label: "Rappel sous 5 min" },
      [PER_COLUMNS.sequenceStatus]: { label: "Stoppée - téléphone reçu" },
      [PER_COLUMNS.emailLog]: {
        text: [previousLog, `Téléphone reçu via formulaire de rappel le ${now} — séquence email stoppée.`]
          .filter(Boolean)
          .join("\n")
      }
    }
  });

  return {
    itemId,
    itemName: item.name,
    phone: normalizedPhone
  };
};

export const syncExistingPerLead = async ({ item, lead }: { item: MondayLeadItem; lead: PerCampaignLead }) => {
  const currentEmail = getItemEmail(item).toLowerCase();
  const currentPhone = getItemPhone(item).replace(/\D/g, "");
  const currentFirstName = getItemFirstName(item);
  const currentLastName = getItemLastName(item);
  const nextPhone = lead.telephone?.replace(/\D/g, "") || "";
  const nextName = buildLeadItemName(lead);
  const values: Record<string, unknown> = {};

  if (item.name !== nextName) values.name = nextName;
  if (lead.prenom && lead.prenom !== "Bonjour" && currentFirstName !== lead.prenom) setColumn(values, PER_COLUMNS.prenom, lead.prenom);
  if (lead.nom && currentLastName !== lead.nom) setColumn(values, PER_COLUMNS.nom, lead.nom);
  if (lead.email && currentEmail !== lead.email.toLowerCase()) {
    setColumn(values, PER_COLUMNS.email, { email: lead.email, text: lead.email });
  }
  if (lead.telephone && currentPhone !== nextPhone) {
    setColumn(values, PER_COLUMNS.phone, { phone: lead.telephone, countryShortName: "FR" });
  }
  setColumn(values, PER_COLUMNS.source, lead.source);

  const hasChanges = Object.keys(values).length > 0;
  if (hasChanges) {
    const previousLog = getItemLog(item);
    values[PER_COLUMNS.emailLog] = {
      text: [
        previousLog,
        `Coordonnées Tally mises à jour le ${new Date().toISOString()} — ${nextName} / ${lead.email}`
      ]
        .filter(Boolean)
        .join("\n")
    };

    await updateItemMultipleColumns({
      boardId: BOARD_ID,
      itemId: item.id,
      columnValues: values
    });
  }

  return {
    itemId: item.id,
    changed: hasChanges,
    emailChanged: Boolean(lead.email && currentEmail && currentEmail !== lead.email.toLowerCase()),
    previousLog: getItemLog(item)
  };
};

export const ingestPerCampaignLead = async ({ lead, baseUrl }: { lead: PerCampaignLead; baseUrl?: string }) => {
  if (!isValidEmail(lead.email)) {
    return { ok: false as const, error: "email_required" };
  }

  const duplicate = await findDuplicatePerLead(lead);
  if (duplicate) {
    if (!isUpdatableLeadDuplicate(duplicate)) {
      return {
        ok: true as const,
        duplicate: true,
        action: duplicate.kind === "moved_item" ? "ignored_existing_lead_moved_group" : "ignored_previously_processed_lead",
        mondayItemId: duplicate.kind === "moved_item" ? duplicate.item.id : duplicate.record?.mondayItemId || undefined
      };
    }

    const duplicateItem = duplicate.item;
    if (lead.hasPhone) {
      const itemId = await upgradePerLeadWithPhone({ item: duplicateItem, lead });
      await rememberPerLead(lead, duplicateItem);
      return {
        ok: true as const,
        duplicate: true,
        mode: "phone",
        action: "existing_lead_upgraded_to_phone",
        mondayItemId: itemId
      };
    }

    const synced = await syncExistingPerLead({ item: duplicateItem, lead });
    await rememberPerLead(lead, duplicateItem);
    if (synced.emailChanged) {
      const sentAt = new Date().toISOString();
      const unsubscribeBaseUrl = (baseUrl ?? getBaseUrl()).replace(/\/+$/, "");
      const mail = await sendPerEmail({
        ...lead,
        jour: 0,
        callbackUrl: createPerPhoneCallbackUrl({ itemId: synced.itemId, email: lead.email, baseUrl: unsubscribeBaseUrl }),
        unsubscribeUrl: `${unsubscribeBaseUrl}/api/tally/per-unsubscribe?item=${encodeURIComponent(synced.itemId)}`
      });

      await markPerEmailSent({
        itemId: synced.itemId,
        day: 0,
        sentAt,
        subject: mail.subject,
        previousLog: synced.previousLog
      });

      return {
        ok: true as const,
        duplicate: true,
        mode: "email",
        action: "existing_lead_email_updated_j0_sent",
        mondayItemId: synced.itemId
      };
    }

    return {
      ok: true as const,
      duplicate: true,
      action: synced.changed ? "existing_lead_updated" : "ignored_existing_lead",
      mondayItemId: duplicateItem.id
    };
  }

  const itemId = await createPerMondayLead(lead);
  await rememberPerLeadIngestion({
    tallyResponseId: lead.tallyResponseId,
    email: lead.email,
    phone: lead.telephone,
    mondayItemId: itemId,
    mondayBoardId: BOARD_ID,
    mondayGroupId: GROUP_ID,
    source: lead.source
  });

  if (lead.hasPhone) {
    return {
      ok: true as const,
      mode: "phone",
      action: "callback_under_5_min",
      mondayItemId: itemId
    };
  }

  const sentAt = new Date().toISOString();
  const unsubscribeBaseUrl = (baseUrl ?? getBaseUrl()).replace(/\/+$/, "");
  const mail = await sendPerEmail({
    ...lead,
    jour: 0,
    callbackUrl: createPerPhoneCallbackUrl({ itemId, email: lead.email, baseUrl: unsubscribeBaseUrl }),
    unsubscribeUrl: `${unsubscribeBaseUrl}/api/tally/per-unsubscribe?item=${encodeURIComponent(itemId)}`
  });

  await markPerEmailSent({
    itemId,
    day: 0,
    sentAt,
    subject: mail.subject,
    previousLog: ""
  });

  return {
    ok: true as const,
    mode: "email",
    action: "sequence_started",
    mondayItemId: itemId
  };
};
