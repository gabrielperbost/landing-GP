type MondayGraphQlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

export type MondayBoardColumn = {
  id: string;
  title: string;
  type: string;
};

export type MondayBoardGroup = {
  id: string;
  title: string;
};

export type MondayItemColumnValue = {
  id: string;
  type: string;
  text: string | null;
  value: string | null;
};

export type MondayItem = {
  id: string;
  name: string;
  board: { id: string; name: string };
  group: { id: string; title: string } | null;
  column_values: MondayItemColumnValue[];
};

export const normalizeEnv = (value: string | undefined): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const hasDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"');
  const hasSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  if (hasDoubleQuotes || hasSingleQuotes) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted || undefined;
  }

  return trimmed;
};

export const ensureMondayApiToken = () => {
  const token = normalizeEnv(process.env.MONDAY_API_TOKEN);
  if (!token) {
    throw new Error("MONDAY_API_TOKEN missing");
  }
  return token;
};

export const callMondayApi = async <T>(query: string, variables?: Record<string, unknown>): Promise<T> => {
  const token = ensureMondayApiToken();
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Monday API HTTP ${response.status}`);
  }

  const json = (await response.json()) as MondayGraphQlResponse<T>;
  if (json.errors?.length) {
    throw new Error(`Monday API error: ${json.errors[0]?.message ?? "unknown"}`);
  }
  if (!json.data) {
    throw new Error("Monday API missing data");
  }

  return json.data;
};

export const getBoardColumns = async (boardId: string): Promise<MondayBoardColumn[]> => {
  const data = await callMondayApi<{ boards: Array<{ columns: MondayBoardColumn[] }> }>(
    `
      query GetBoardColumns($boardId: [ID!]) {
        boards(ids: $boardId) {
          columns {
            id
            title
            type
          }
        }
      }
    `,
    { boardId }
  );

  return data.boards[0]?.columns ?? [];
};

export const getItemById = async (itemId: string): Promise<MondayItem | null> => {
  const data = await callMondayApi<{ items: MondayItem[] }>(
    `
      query GetItem($itemId: [ID!]) {
        items(ids: $itemId) {
          id
          name
          board {
            id
            name
          }
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
    `,
    { itemId }
  );

  return data.items[0] ?? null;
};

export const getBoardGroups = async (boardId: string): Promise<MondayBoardGroup[]> => {
  const data = await callMondayApi<{ boards: Array<{ groups: MondayBoardGroup[] }> }>(
    `
      query GetBoardGroups($boardId: [ID!]) {
        boards(ids: $boardId) {
          groups {
            id
            title
          }
        }
      }
    `,
    { boardId }
  );

  return data.boards[0]?.groups ?? [];
};

export const moveItemToGroup = async ({
  itemId,
  groupId
}: {
  itemId: string;
  groupId: string;
}) => {
  await callMondayApi(
    `
      mutation MoveItemToGroup($itemId: ID!, $groupId: String!) {
        move_item_to_group(item_id: $itemId, group_id: $groupId) {
          id
        }
      }
    `,
    {
      itemId,
      groupId
    }
  );
};

export const updateItemMultipleColumns = async ({
  boardId,
  itemId,
  columnValues
}: {
  boardId: string;
  itemId: string;
  columnValues: Record<string, unknown>;
}) => {
  await callMondayApi(
    `
      mutation UpdateItem($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(
          board_id: $boardId,
          item_id: $itemId,
          column_values: $columnValues,
          create_labels_if_missing: true
        ) {
          id
        }
      }
    `,
    {
      boardId,
      itemId,
      columnValues: JSON.stringify(columnValues)
    }
  );
};

export const createBoardWebhook = async ({
  boardId,
  webhookUrl
}: {
  boardId: string;
  webhookUrl: string;
}) => {
  const data = await callMondayApi<{ create_webhook: { id: string } }>(
    `
      mutation CreateWebhook($boardId: ID!, $url: String!) {
        create_webhook(board_id: $boardId, url: $url, event: change_column_value) {
          id
        }
      }
    `,
    {
      boardId,
      url: webhookUrl
    }
  );
  return data.create_webhook.id;
};

export const createBoardColumn = async ({
  boardId,
  title,
  columnType
}: {
  boardId: string;
  title: string;
  columnType: "link" | "checkbox" | "date" | "numbers" | "text";
}) => {
  const data = await callMondayApi<{ create_column: { id: string; title: string; type: string } }>(
    `
      mutation CreateColumn($boardId: ID!, $title: String!, $columnType: ColumnType!) {
        create_column(board_id: $boardId, title: $title, column_type: $columnType) {
          id
          title
          type
        }
      }
    `,
    {
      boardId,
      title,
      columnType
    }
  );
  return data.create_column;
};

export const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export const pickColumnByTitle = (columns: MondayBoardColumn[], patterns: RegExp[]) => {
  for (const column of columns) {
    const title = normalizeText(column.title);
    if (patterns.some((pattern) => pattern.test(title))) {
      return column;
    }
  }
  return null;
};

export const findItemColumnValue = (values: MondayItemColumnValue[], columnId: string | undefined) => {
  if (!columnId) return null;
  return values.find((value) => value.id === columnId) ?? null;
};

export const extractEmailFromColumn = (column: MondayItemColumnValue | null) => {
  if (!column) return "";

  if (column.value) {
    try {
      const parsed = JSON.parse(column.value) as { email?: string };
      if (parsed.email) return String(parsed.email).trim();
    } catch {
      // Ignore parse errors and fallback to text.
    }
  }

  const text = column.text?.trim() ?? "";
  if (text.includes("@")) return text;
  return "";
};
