import "server-only";

import { supabaseAdmin } from "@/lib/supabase";

export type SessionDocumentType = "offre" | "tableau" | "avis_imposition" | "autre";

type SessionDocumentGroup<T> = {
  offre: T[];
  tableau: T[];
  avis_imposition: T[];
  autre: T[];
  all: T[];
};

export type SessionDocumentRef = {
  docType: SessionDocumentType;
  name: string;
  path: string;
  uploadedAt: string | null;
  timestamp: number;
  size: number | null;
};

export type SessionDocumentWithUrl = SessionDocumentRef & {
  url: string;
};

const DOC_TYPE_PATTERN = /-(offre|tableau|avis_imposition|autre)(?:\.[a-z0-9]+)?$/i;
const TIMESTAMP_PATTERN = /^(\d{10,})-/;
const STORAGE_BUCKET = "documents";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

const toEmptyDocumentGroup = <T>(): SessionDocumentGroup<T> => ({
  offre: [],
  tableau: [],
  avis_imposition: [],
  autre: [],
  all: []
});

const parseDocTypeFromName = (name: string): SessionDocumentType | null => {
  const match = name.match(DOC_TYPE_PATTERN);
  if (!match?.[1]) return null;
  const type = match[1].toLowerCase();
  if (type === "offre" || type === "tableau" || type === "avis_imposition" || type === "autre") return type;
  return null;
};

const parseTimestampFromName = (name: string) => {
  const match = name.match(TIMESTAMP_PATTERN);
  if (!match?.[1]) return 0;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return 0;
  return value;
};

const toIsoIfValid = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

export const groupSessionDocuments = <T extends { docType: SessionDocumentType }>(
  documents: T[]
): SessionDocumentGroup<T> => {
  const grouped = toEmptyDocumentGroup<T>();
  for (const document of documents) {
    grouped[document.docType].push(document);
    grouped.all.push(document);
  }
  return grouped;
};

export const listSessionDocumentRefs = async (sessionId: string): Promise<SessionDocumentRef[]> => {
  if (!sessionId) return [];

  const prefix = `sessions/${sessionId}`;
  const pageSize = 100;
  let offset = 0;
  const refs: SessionDocumentRef[] = [];

  while (true) {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "desc" } });

    if (error) {
      throw new Error(`session_documents_list_failed:${error.message}`);
    }

    const rows = (data ?? []) as Array<{
      name?: string | null;
      updated_at?: string | null;
      created_at?: string | null;
      metadata?: { size?: number | null } | null;
    }>;

    for (const row of rows) {
      const name = String(row.name ?? "").trim();
      if (!name) continue;

      const docType = parseDocTypeFromName(name);
      if (!docType) continue;

      const timestamp = parseTimestampFromName(name);
      const uploadedAt = toIsoIfValid(row.updated_at) ?? toIsoIfValid(row.created_at) ?? (timestamp > 0 ? new Date(timestamp).toISOString() : null);
      const size = typeof row.metadata?.size === "number" ? row.metadata.size : null;

      refs.push({
        docType,
        name,
        path: `${prefix}/${name}`,
        uploadedAt,
        timestamp,
        size
      });
    }

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  refs.sort((left, right) => {
    if (right.timestamp !== left.timestamp) return right.timestamp - left.timestamp;
    return right.name.localeCompare(left.name);
  });

  return refs;
};

export const withSignedSessionDocumentUrls = async (
  refs: SessionDocumentRef[],
  expiresIn = SIGNED_URL_TTL_SECONDS
): Promise<SessionDocumentWithUrl[]> => {
  const documents = await Promise.all(
    refs.map(async (ref) => {
      const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).createSignedUrl(ref.path, expiresIn);
      if (error || !data?.signedUrl) {
        console.error("session-document-sign-url-failed", { path: ref.path, error });
        return {
          ...ref,
          url: ref.path
        };
      }
      return {
        ...ref,
        url: data.signedUrl
      };
    })
  );

  return documents;
};

export const toLegacySessionDocument = ({
  docType,
  url
}: {
  docType: SessionDocumentType;
  url: string;
}): SessionDocumentWithUrl => {
  const timestamp = Date.now();
  return {
    docType,
    name: `${docType}-legacy`,
    path: url,
    uploadedAt: new Date(timestamp).toISOString(),
    timestamp,
    size: null,
    url
  };
};
