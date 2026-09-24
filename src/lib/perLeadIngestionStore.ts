import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export type PerLeadIngestionRecord = {
  id: string;
  tallyResponseId: string;
  email: string;
  phone: string;
  mondayItemId: string;
  mondayBoardId: string;
  mondayGroupId: string;
  source: string;
  status: "processed";
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export type PerLeadIngestionIdentity = {
  tallyResponseId?: string;
  email?: string;
  phone?: string;
};

export type RememberPerLeadIngestionInput = PerLeadIngestionIdentity & {
  mondayItemId?: string;
  mondayBoardId?: string;
  mondayGroupId?: string;
  source?: string;
};

type PerLeadIngestionRow = {
  id: string;
  tally_response_id: string | null;
  email: string | null;
  phone: string | null;
  monday_item_id: string | null;
  monday_board_id: string | null;
  monday_group_id: string | null;
  source: string | null;
  status: "processed";
  created_at: string;
  updated_at: string;
  last_seen_at: string;
};

type SupabaseMaybeError = {
  code?: string;
  message?: string;
};

const TABLE_NAME = "per_lead_ingestions";
const STORAGE_BUCKET = "documents";
const STORAGE_PATH = "system/per-lead-ingestions.json";
const RUNTIME_DATA_DIR = process.env.VERCEL ? path.join("/tmp", "gp-finances-data") : path.join(process.cwd(), "data");
const STORE_PATH = path.join(RUNTIME_DATA_DIR, "per-lead-ingestions.json");

let writeQueue: Promise<unknown> = Promise.resolve();

const normalizeEmail = (value: string | undefined) => value?.trim().toLowerCase() ?? "";
const normalizePhone = (value: string | undefined) => value?.replace(/\D/g, "") ?? "";
const normalizeTextValue = (value: string | undefined) => value?.trim() ?? "";

const normalizeIdentity = (identity: PerLeadIngestionIdentity) => ({
  tallyResponseId: normalizeTextValue(identity.tallyResponseId),
  email: normalizeEmail(identity.email),
  phone: normalizePhone(identity.phone)
});

const hasIdentity = (identity: PerLeadIngestionIdentity) =>
  Boolean(identity.tallyResponseId || identity.email || identity.phone);

const buildRecordId = (identity: PerLeadIngestionIdentity) => {
  if (identity.tallyResponseId) return `tally:${identity.tallyResponseId}`;
  if (identity.email) return `email:${identity.email}`;
  if (identity.phone) return `phone:${identity.phone}`;
  return "";
};

const fromRow = (row: PerLeadIngestionRow): PerLeadIngestionRecord => ({
  id: row.id,
  tallyResponseId: row.tally_response_id ?? "",
  email: row.email ?? "",
  phone: row.phone ?? "",
  mondayItemId: row.monday_item_id ?? "",
  mondayBoardId: row.monday_board_id ?? "",
  mondayGroupId: row.monday_group_id ?? "",
  source: row.source ?? "",
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastSeenAt: row.last_seen_at
});

const toRow = (record: PerLeadIngestionRecord): PerLeadIngestionRow => ({
  id: record.id,
  tally_response_id: record.tallyResponseId || null,
  email: record.email || null,
  phone: record.phone || null,
  monday_item_id: record.mondayItemId || null,
  monday_board_id: record.mondayBoardId || null,
  monday_group_id: record.mondayGroupId || null,
  source: record.source || null,
  status: record.status,
  created_at: record.createdAt,
  updated_at: record.updatedAt,
  last_seen_at: record.lastSeenAt
});

const withFileLock = async <T>(task: () => Promise<T>): Promise<T> => {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
};

const readFileStore = async (): Promise<PerLeadIngestionRecord[]> => {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    const parsed = JSON.parse(await fs.readFile(STORE_PATH, "utf8")) as { leads?: PerLeadIngestionRecord[] };
    return Array.isArray(parsed.leads) ? parsed.leads : [];
  } catch {
    return [];
  }
};

const writeFileStore = async (records: PerLeadIngestionRecord[]) => {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify({ version: 1, leads: records }, null, 2), "utf8");
};

const isStorageNotFound = (error: unknown) => {
  const candidate = error as { message?: string; statusCode?: string | number };
  return String(candidate.statusCode ?? "") === "404" || /not found|does not exist/i.test(candidate.message ?? "");
};

const isSupabaseTableMissing = (error: unknown) => {
  const candidate = error as SupabaseMaybeError;
  return candidate.code === "PGRST205" || /could not find the table/i.test(candidate.message ?? "");
};

const readStorageStore = async (): Promise<PerLeadIngestionRecord[] | undefined> => {
  if (!isSupabaseConfigured) return undefined;

  const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
  if (error) {
    if (isStorageNotFound(error)) return [];
    throw error;
  }

  const parsed = JSON.parse(await data.text()) as { leads?: PerLeadIngestionRecord[] };
  return Array.isArray(parsed.leads) ? parsed.leads : [];
};

const writeStorageStore = async (records: PerLeadIngestionRecord[]) => {
  if (!isSupabaseConfigured) return undefined;

  const body = Buffer.from(JSON.stringify({ version: 1, leads: records }, null, 2), "utf8");
  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(STORAGE_PATH, body, {
    contentType: "application/json",
    upsert: true
  });

  if (error) throw error;
  return records;
};

const findInFileStore = async (identity: PerLeadIngestionIdentity) => {
  const normalized = normalizeIdentity(identity);
  if (!hasIdentity(normalized)) return null;

  const records = await readFileStore();
  return findInRecords(records, normalized);
};

const findInStorageStore = async (identity: PerLeadIngestionIdentity) => {
  const normalized = normalizeIdentity(identity);
  if (!hasIdentity(normalized)) return null;

  const records = await readStorageStore();
  if (!records) return undefined;
  return findInRecords(records, normalized);
};

const findInRecords = (records: PerLeadIngestionRecord[], identity: PerLeadIngestionIdentity) =>
  records.find((record) => {
    if (identity.tallyResponseId && record.tallyResponseId === identity.tallyResponseId) return true;
    if (identity.email && record.email === identity.email) return true;
    if (identity.phone && record.phone === identity.phone) return true;
    return false;
  }) ?? null;

const findInSupabase = async (identity: PerLeadIngestionIdentity) => {
  if (!isSupabaseConfigured) return undefined;

  const normalized = normalizeIdentity(identity);
  if (!hasIdentity(normalized)) return null;

  const queries: Array<[keyof PerLeadIngestionRow, string]> = [
    ["tally_response_id", normalized.tallyResponseId],
    ["email", normalized.email],
    ["phone", normalized.phone]
  ].filter((query): query is [keyof PerLeadIngestionRow, string] => Boolean(query[1]));

  for (const [column, value] of queries) {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select("*")
      .eq(column, value)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<PerLeadIngestionRow>();

    if (error) {
      if (isSupabaseTableMissing(error)) return undefined;
      throw error;
    }
    if (data) return fromRow(data);
  }

  return null;
};

const saveToSupabase = async (record: PerLeadIngestionRecord) => {
  if (!isSupabaseConfigured) return undefined;

  const existing = await findInSupabase(record);
  if (existing === undefined) return undefined;

  const nextRecord = {
    ...existing,
    ...record,
    id: existing?.id ?? record.id,
    createdAt: existing?.createdAt ?? record.createdAt
  };
  const row = toRow(nextRecord);

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .update(row)
      .eq("id", existing.id)
      .select("*")
      .single<PerLeadIngestionRow>();
    if (error) {
      if (isSupabaseTableMissing(error)) return undefined;
      throw error;
    }
    return fromRow(data);
  }

  const { data, error } = await supabaseAdmin.from(TABLE_NAME).insert(row).select("*").single<PerLeadIngestionRow>();
  if (error) {
    if (isSupabaseTableMissing(error)) return undefined;
    throw error;
  }
  return fromRow(data);
};

const saveToFileStore = async (record: PerLeadIngestionRecord) =>
  withFileLock(async () => {
    const existing = await findInFileStore(record);
    const records = await readFileStore();
    const nextRecord = existing
      ? {
          ...existing,
          ...record,
          id: existing.id,
          createdAt: existing.createdAt
        }
      : record;
    const nextRecords = existing
      ? records.map((candidate) => (candidate.id === existing.id ? nextRecord : candidate))
      : [...records, nextRecord];

    await writeFileStore(nextRecords);
    return nextRecord;
  });

const saveToStorageStore = async (record: PerLeadIngestionRecord) =>
  withFileLock(async () => {
    const records = await readStorageStore();
    if (!records) return undefined;

    const existing = findInRecords(records, record);
    const nextRecord = existing
      ? {
          ...existing,
          ...record,
          id: existing.id,
          createdAt: existing.createdAt
        }
      : record;
    const nextRecords = existing
      ? records.map((candidate) => (candidate.id === existing.id ? nextRecord : candidate))
      : [...records, nextRecord];

    await writeStorageStore(nextRecords);
    return nextRecord;
  });

export const findKnownPerLeadIngestion = async (identity: PerLeadIngestionIdentity) => {
  const normalized = normalizeIdentity(identity);
  if (!hasIdentity(normalized)) return null;

  try {
    const supabaseRecord = await findInSupabase(normalized);
    if (supabaseRecord !== undefined) return supabaseRecord;
  } catch (error) {
    console.warn("per-lead-ingestion-supabase-find-failed", error);
  }

  try {
    const storageRecord = await findInStorageStore(normalized);
    if (storageRecord !== undefined) return storageRecord;
  } catch (error) {
    console.warn("per-lead-ingestion-storage-find-failed", error);
  }

  return findInFileStore(normalized);
};

export const rememberPerLeadIngestion = async (input: RememberPerLeadIngestionInput) => {
  const normalized = normalizeIdentity(input);
  if (!hasIdentity(normalized)) return null;

  const now = new Date().toISOString();
  const record: PerLeadIngestionRecord = {
    id: buildRecordId(normalized),
    tallyResponseId: normalized.tallyResponseId,
    email: normalized.email,
    phone: normalized.phone,
    mondayItemId: normalizeTextValue(input.mondayItemId),
    mondayBoardId: normalizeTextValue(input.mondayBoardId),
    mondayGroupId: normalizeTextValue(input.mondayGroupId),
    source: normalizeTextValue(input.source),
    status: "processed",
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now
  };

  try {
    const supabaseRecord = await saveToSupabase(record);
    if (supabaseRecord !== undefined) return supabaseRecord;
  } catch (error) {
    console.warn("per-lead-ingestion-supabase-save-failed", error);
  }

  try {
    const storageRecord = await saveToStorageStore(record);
    if (storageRecord !== undefined) return storageRecord;
  } catch (error) {
    console.warn("per-lead-ingestion-storage-save-failed", error);
  }

  return saveToFileStore(record);
};
