import "server-only";

import {
  normalizeEnv,
  normalizeText,
  pickColumnByTitle,
  type MondayBoardColumn,
  updateItemMultipleColumns
} from "@/lib/monday";

export const PER_DOSSIER_ACCESS_PATH = "/per/dossier";
export const PER_DOSSIER_BOARD_NAME = "PER Setter : Suivi des souscriptions";
export const PER_AVIS_IMPOSITION_LABEL = "Avis d'imposition de cette année sur les revenus de l'année dernière";

export type PerProfilePayload = {
  situationProfessionnelle?: string;
  revenuNetImposable?: string;
  impotPaye?: string;
  trancheMarginaleImposition?: string;
  objectifPrincipal?: string;
  versementEnvisage?: string;
  commentaireInterne?: string;
};

type PerProfileKey = keyof PerProfilePayload;

type MondayColumnValueType = "checkbox" | "status" | "text" | "long_text" | "link" | "date" | "file" | "files" | "numbers";

const PROFILE_FIELD_CONFIG: Record<
  PerProfileKey,
  {
    envName: string;
    patterns: RegExp[];
    label: string;
  }
> = {
  situationProfessionnelle: {
    envName: "MONDAY_PER_SITUATION_PRO_COLUMN_ID",
    patterns: [/situation.*profession/i, /statut.*profession/i, /^profession$/i],
    label: "Situation professionnelle"
  },
  revenuNetImposable: {
    envName: "MONDAY_PER_REVENU_NET_IMPOSABLE_COLUMN_ID",
    patterns: [/revenu.*net.*imposable/i, /^rni$/i],
    label: "Revenu net imposable"
  },
  impotPaye: {
    envName: "MONDAY_PER_IMPOT_PAYE_COLUMN_ID",
    patterns: [/imp[oô]t.*pay/i, /montant.*imp[oô]t/i, /^imp[oô]t$/i],
    label: "Montant d'impôt payé"
  },
  trancheMarginaleImposition: {
    envName: "MONDAY_PER_TMI_COLUMN_ID",
    patterns: [/tranche.*marginale/i, /^tmi$/i],
    label: "Tranche marginale d'imposition"
  },
  objectifPrincipal: {
    envName: "MONDAY_PER_OBJECTIF_COLUMN_ID",
    patterns: [/objectif.*principal/i, /^objectif$/i],
    label: "Objectif principal"
  },
  versementEnvisage: {
    envName: "MONDAY_PER_VERSEMENT_ENVISAGE_COLUMN_ID",
    patterns: [/versement.*envisag/i, /montant.*versement/i],
    label: "Montant envisagé de versement"
  },
  commentaireInterne: {
    envName: "MONDAY_PER_COMMENTAIRE_INTERNE_COLUMN_ID",
    patterns: [/commentaire.*interne/i, /note.*interne/i],
    label: "Commentaire interne"
  }
};

export const isPerDossierBoard = (board: { id?: string; name?: string }) => {
  const configuredBoardId = normalizeEnv(process.env.MONDAY_PER_BOARD_ID);
  if (configuredBoardId && board.id === configuredBoardId) return true;

  const configuredBoardName = normalizeEnv(process.env.MONDAY_PER_BOARD_NAME) ?? PER_DOSSIER_BOARD_NAME;
  return normalizeText(board.name) === normalizeText(configuredBoardName);
};

const buildMondayValueByColumnType = ({
  columnType,
  value,
  linkText
}: {
  columnType: MondayColumnValueType | string;
  value: string;
  linkText?: string;
}) => {
  if (columnType === "checkbox") return { checked: "true" };
  if (columnType === "status") return { label: value };
  if (columnType === "link") return { url: value, text: linkText ?? value };
  if (columnType === "date") return { date: value.slice(0, 10) };
  if (columnType === "long_text") return { text: value };
  if (columnType === "numbers") return value.replaceAll(/[^\d.,-]/g, "").replace(",", ".");
  return value;
};

const resolveColumnId = ({
  columns,
  envName,
  fallbackEnvNames = [],
  patterns
}: {
  columns: MondayBoardColumn[];
  envName: string;
  fallbackEnvNames?: string[];
  patterns: RegExp[];
}) => {
  for (const candidateEnvName of [envName, ...fallbackEnvNames]) {
    const configuredId = normalizeEnv(process.env[candidateEnvName]);
    if (configuredId && columns.some((column) => column.id === configuredId)) {
      return configuredId;
    }
  }

  return pickColumnByTitle(columns, patterns)?.id ?? "";
};

export const resolvePerAvisColumns = (boardColumns: MondayBoardColumn[]) => ({
  receivedColumnId: resolveColumnId({
    columns: boardColumns,
    envName: "MONDAY_PER_AVIS_RECEIVED_COLUMN_ID",
    patterns: [/avis.*imposition.*re[cç]u/i, /avis.*re[cç]u/i, /document.*re[cç]u/i]
  }),
  linkColumnId: resolveColumnId({
    columns: boardColumns,
    envName: "MONDAY_PER_AVIS_LINK_COLUMN_ID",
    patterns: [/lien.*avis/i, /lien.*imposition/i, /lien.*document/i]
  }),
  depotDateColumnId:
    resolveColumnId({
      columns: boardColumns,
      envName: "MONDAY_PER_DATE_DEPOT_COLUMN_ID",
      fallbackEnvNames: ["MONDAY_DATE_DEPOT_COLUMN_ID"],
      patterns: [/date de d[eé]p[oô]t/i, /date.*depot/i]
    }),
  statusColumnId: resolveColumnId({
    columns: boardColumns,
    envName: "MONDAY_PER_STATUS_COLUMN_ID",
    fallbackEnvNames: ["MONDAY_STATUS_COLUMN_ID"],
    patterns: [/^statut$/i, /^status$/i, /^etat$/i, /status dossier/i]
  }),
  targetStatus:
    normalizeEnv(process.env.MONDAY_PER_TARGET_STATUS) ??
    normalizeEnv(process.env.MONDAY_TARGET_STATUS) ??
    "Devis à réaliser"
});

export const buildPerAvisMondayValues = ({
  boardColumns,
  fileUrl,
  includeTargetStatus
}: {
  boardColumns: MondayBoardColumn[];
  fileUrl: string;
  includeTargetStatus: boolean;
}) => {
  const resolved = resolvePerAvisColumns(boardColumns);
  const columnValues: Record<string, unknown> = {};

  if (resolved.depotDateColumnId) {
    columnValues[resolved.depotDateColumnId] = { date: new Date().toISOString().slice(0, 10) };
  }

  const receivedColumn = boardColumns.find((column) => column.id === resolved.receivedColumnId);
  if (receivedColumn && !["file", "files"].includes(receivedColumn.type)) {
    columnValues[receivedColumn.id] = buildMondayValueByColumnType({
      columnType: receivedColumn.type,
      value: "Reçu",
      linkText: PER_AVIS_IMPOSITION_LABEL
    });
  }

  const linkColumn = boardColumns.find((column) => column.id === resolved.linkColumnId);
  if (linkColumn) {
    columnValues[linkColumn.id] = buildMondayValueByColumnType({
      columnType: linkColumn.type,
      value: fileUrl,
      linkText: "Avis d'imposition"
    });
  }

  if (includeTargetStatus && resolved.statusColumnId) {
    columnValues[resolved.statusColumnId] = resolved.targetStatus;
  }

  return {
    columnValues,
    fileColumnId: receivedColumn && ["file", "files"].includes(receivedColumn.type) ? receivedColumn.id : ""
  };
};

export const buildPerProfileSummaryHtml = (profile: PerProfilePayload | undefined) => {
  if (!profile) return "";

  const rows = (Object.keys(PROFILE_FIELD_CONFIG) as PerProfileKey[])
    .map((key) => {
      const value = String(profile[key] ?? "").trim();
      if (!value) return "";
      return `<li><strong>${PROFILE_FIELD_CONFIG[key].label}:</strong> ${value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")}</li>`;
    })
    .filter(Boolean)
    .join("");

  if (!rows) return "";
  return `<ul style="margin:8px 0 0 18px;padding:0;">${rows}</ul>`;
};

export const updatePerProfileOnMonday = async ({
  boardId,
  itemId,
  boardColumns,
  profile
}: {
  boardId: string;
  itemId: string;
  boardColumns: MondayBoardColumn[];
  profile: PerProfilePayload | undefined;
}) => {
  if (!profile) return false;

  const columnValues: Record<string, unknown> = {};
  for (const key of Object.keys(PROFILE_FIELD_CONFIG) as PerProfileKey[]) {
    const value = String(profile[key] ?? "").trim();
    if (!value) continue;

    const config = PROFILE_FIELD_CONFIG[key];
    const columnId = resolveColumnId({
      columns: boardColumns,
      envName: config.envName,
      patterns: config.patterns
    });
    const column = boardColumns.find((candidate) => candidate.id === columnId);
    if (!column) continue;

    columnValues[column.id] = buildMondayValueByColumnType({
      columnType: column.type,
      value,
      linkText: config.label
    });
  }

  if (!Object.keys(columnValues).length) return false;

  await updateItemMultipleColumns({
    boardId,
    itemId,
    columnValues
  });
  return true;
};
