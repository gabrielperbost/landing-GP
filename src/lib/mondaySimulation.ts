import {
  callMondayApi,
  findItemColumnValue,
  getBoardColumns,
  getItemById,
  normalizeEnv,
  pickColumnByTitle
} from "@/lib/monday";
import { isBlockedSimulationUrl, isLikelySimulationUrl } from "@/lib/simulationUrl";

type MondaySimulation = {
  url: string;
  name: string;
};

const SIMULATION_HINT_PATTERN = /(simulation|proposition|devis|\.pdf)/i;
const DEFAULT_SIMULATION_COLUMN_ID = "file_mm1hkhbw";

const extractUrlFromUnknown = (value: unknown, depth = 0): string => {
  if (depth > 6 || value === null || value === undefined) return "";

  if (typeof value === "string") {
    const match = value.match(/https?:\/\/[^\s"'<>]+/i);
    return match?.[0] ?? "";
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractUrlFromUnknown(entry, depth + 1);
      if (found) return found;
    }
    return "";
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const preferredKeys = ["url", "public_url", "link", "href", "permalink", "file_url", "download_url"];
    for (const key of preferredKeys) {
      const found = extractUrlFromUnknown(objectValue[key], depth + 1);
      if (found) return found;
    }
    for (const nestedValue of Object.values(objectValue)) {
      const found = extractUrlFromUnknown(nestedValue, depth + 1);
      if (found) return found;
    }
  }

  return "";
};

const extractNameFromUnknown = (value: unknown): string => {
  if (!value) return "";
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractNameFromUnknown(entry);
      if (found) return found;
    }
    return "";
  }
  if (typeof value !== "object") return "";
  const objectValue = value as Record<string, unknown>;
  const keys = ["text", "url_text", "label", "name", "title", "filename"];
  for (const key of keys) {
    const raw = objectValue[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
  }
  for (const nestedValue of Object.values(objectValue)) {
    const found = extractNameFromUnknown(nestedValue);
    if (found) return found;
  }
  return "";
};

const extractAssetIdFromUnknown = (value: unknown, depth = 0): string => {
  if (depth > 6 || value === null || value === undefined) return "";

  if (typeof value === "string" || typeof value === "number") {
    const asString = String(value).trim();
    return /^\d+$/.test(asString) ? asString : "";
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = extractAssetIdFromUnknown(entry, depth + 1);
      if (found) return found;
    }
    return "";
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    const keys = ["assetId", "asset_id", "id"];
    for (const key of keys) {
      const found = extractAssetIdFromUnknown(objectValue[key], depth + 1);
      if (found) return found;
    }
    for (const nestedValue of Object.values(objectValue)) {
      const found = extractAssetIdFromUnknown(nestedValue, depth + 1);
      if (found) return found;
    }
  }

  return "";
};

const getMondayAssetPublicUrl = async (assetId: string): Promise<string> => {
  if (!assetId) return "";

  try {
    const numericId = Number(assetId);
    const result = await callMondayApi<{ assets: Array<{ public_url?: string | null; url?: string | null }> }>(
      `
        query GetAssetPublicUrl($assetIds: [ID!]!) {
          assets(ids: $assetIds) {
            public_url
            url
          }
        }
      `,
      {
        assetIds: [Number.isFinite(numericId) ? numericId : assetId]
      }
    );
    const asset = result.assets?.[0];
    return (asset?.public_url ?? asset?.url ?? "").trim();
  } catch (error) {
    console.error("monday-simulation-asset-read-failed", { assetId, error });
    return "";
  }
};

export const getSimulationFromMonday = async (mondayItemId: string): Promise<MondaySimulation | null> => {
  if (!mondayItemId || !normalizeEnv(process.env.MONDAY_API_TOKEN)) return null;

  try {
    const item = await getItemById(mondayItemId);
    if (!item) return null;

    const boardColumns = await getBoardColumns(item.board.id);
    const configuredSimulationColumnId =
      normalizeEnv(process.env.MONDAY_SIMULATION_COLUMN_ID) ?? DEFAULT_SIMULATION_COLUMN_ID;

    const titledCandidates = boardColumns
      .filter((column) => /simulation|proposition|devis/i.test(column.title))
      .filter((column) => ["link", "text", "long_text", "files", "file"].includes(column.type))
      .map((column) => column.id);

    const titleFallbackCandidateId =
      pickColumnByTitle(boardColumns, [/simulation/i, /proposition/i, /devis/i])?.id ?? "";

    const candidateIds = [configuredSimulationColumnId ?? "", ...titledCandidates, titleFallbackCandidateId].filter(
      (value, index, array) => Boolean(value) && array.indexOf(value) === index
    );

    for (const candidateId of candidateIds) {
      const simulationColumn = findItemColumnValue(item.column_values, candidateId);
      if (!simulationColumn) continue;
      const candidateColumn = boardColumns.find((column) => column.id === candidateId);
      const candidateType = (candidateColumn?.type ?? "").toLowerCase();
      const isFileColumn = candidateType === "file" || candidateType === "files";

      let parsedValue: unknown = null;
      if (simulationColumn.value) {
        try {
          parsedValue = JSON.parse(simulationColumn.value);
        } catch {
          parsedValue = simulationColumn.value;
        }
      }

      const directUrl = extractUrlFromUnknown(parsedValue) || extractUrlFromUnknown(simulationColumn.text ?? "");
      const assetId = extractAssetIdFromUnknown(parsedValue);
      const assetUrl = assetId ? await getMondayAssetPublicUrl(assetId) : "";
      const resolvedUrl = assetUrl || directUrl;
      if (!resolvedUrl) continue;
      if (isBlockedSimulationUrl(resolvedUrl)) continue;

      const textHint = simulationColumn.text?.trim() ?? "";
      const valueHint = simulationColumn.value ?? "";
      const titleHint = candidateColumn?.title ?? "";
      const hasSimulationHint = SIMULATION_HINT_PATTERN.test(`${titleHint} ${textHint} ${valueHint}`);
      if (isFileColumn) {
        if (!/^https?:\/\//i.test(resolvedUrl)) continue;
      } else {
        if (!isLikelySimulationUrl(resolvedUrl)) continue;
        if (!hasSimulationHint && candidateId !== configuredSimulationColumnId) continue;
      }

      const extractedName = extractNameFromUnknown(parsedValue);
      const textName = /^https?:\/\//i.test(textHint) ? "" : textHint;
      const fallbackName = resolvedUrl.split("/").pop()?.split("?")[0] ?? "";

      return {
        url: resolvedUrl,
        name: extractedName || textName || fallbackName || "Simulation client"
      };
    }

    return null;
  } catch (error) {
    console.error("monday-simulation-read-failed", { mondayItemId, error });
    return null;
  }
};
