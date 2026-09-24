#!/usr/bin/env node

const required = (name) => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return value.trim();
};

const token = required("MONDAY_API_TOKEN");
const boardId = (process.env.MONDAY_BOARD_ID || "5091090273").trim();
const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://gp-finances.fr").replace(/\/+$/, "");
const webhookSecret = required("MONDAY_INCOMING_WEBHOOK_SECRET");
const webhookUrl = `${baseUrl}/api/monday/webhook?secret=${encodeURIComponent(webhookSecret)}`;

const callMonday = async (query, variables = {}) => {
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join(" | "));
  }
  return json.data;
};

const ensureColumn = async ({ title, columnType }) => {
  const columnsData = await callMonday(
    `
      query Columns($boardId: [ID!]) {
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

  const columns = columnsData.boards[0]?.columns ?? [];
  const existing = columns.find((column) => column.title.toLowerCase() === title.toLowerCase());
  if (existing) return existing;

  const created = await callMonday(
    `
      mutation CreateColumn($boardId: ID!, $title: String!, $columnType: ColumnType!) {
        create_column(board_id: $boardId, title: $title, column_type: $columnType) {
          id
          title
          type
        }
      }
    `,
    { boardId, title, columnType }
  );

  return created.create_column;
};

const ensureWebhook = async () => {
  try {
    const data = await callMonday(
      `
        query Webhooks($boardId: [ID!]) {
          boards(ids: $boardId) {
            webhooks {
              id
              event
              url
            }
          }
        }
      `,
      { boardId }
    );

    const webhooks = data.boards[0]?.webhooks ?? [];
    const existing = webhooks.find((webhook) => webhook.url === webhookUrl && webhook.event === "change_column_value");
    if (existing) return existing.id;
  } catch {
    // Some Monday plans don't expose webhook listing; fallback to create.
  }

  const created = await callMonday(
    `
      mutation CreateWebhook($boardId: ID!, $url: String!) {
        create_webhook(board_id: $boardId, url: $url, event: change_column_value) {
          id
        }
      }
    `,
    { boardId, url: webhookUrl }
  );

  return created.create_webhook.id;
};

const main = async () => {
  const wantedColumns = [
    { title: "Lien dépôt", columnType: "link" },
    { title: "Date entrée attente docs", columnType: "date" },
    { title: "Date dernière relance", columnType: "date" },
    { title: "Relances envoyées", columnType: "numbers" },
    { title: "Offre reçue", columnType: "checkbox" },
    { title: "Tableau reçu", columnType: "checkbox" },
    { title: "CNI reçue", columnType: "checkbox" },
    { title: "Date de dépôt", columnType: "date" },
    { title: "Lien offre", columnType: "link" },
    { title: "Lien tableau", columnType: "link" },
    { title: "Lien CNI", columnType: "link" }
  ];

  const ensured = [];
  for (const config of wantedColumns) {
    const column = await ensureColumn(config);
    ensured.push(column);
  }

  const webhookId = await ensureWebhook();

  const finalColumns = await callMonday(
    `
      query Columns($boardId: [ID!]) {
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

  const columns = finalColumns.boards[0]?.columns ?? [];
  const byTitle = (title) => columns.find((column) => column.title.toLowerCase() === title.toLowerCase())?.id ?? "";

  const statusId = columns.find((column) => column.title.toLowerCase() === "statut" && column.type === "status")?.id ?? "";
  const emailId = columns.find((column) => column.type === "email")?.id ?? "";
  const bankId = columns.find((column) => ["banque", "assureur"].includes(column.title.toLowerCase()))?.id ?? "";

  console.log(JSON.stringify(
    {
      board_id: boardId,
      webhook_url: webhookUrl,
      webhook_id: webhookId,
      columns_created_or_found: ensured,
      env_suggestion: {
        MONDAY_BOARD_ID: boardId,
        MONDAY_STATUS_COLUMN_ID: statusId,
        MONDAY_EMAIL_COLUMN_ID: emailId,
        MONDAY_BANK_COLUMN_ID: bankId,
        MONDAY_LINK_COLUMN_ID: byTitle("Lien dépôt"),
        MONDAY_WAITING_DOCS_DATE_COLUMN_ID: byTitle("Date entrée attente docs"),
        MONDAY_LAST_REMINDER_DATE_COLUMN_ID: byTitle("Date dernière relance"),
        MONDAY_REMINDER_COUNT_COLUMN_ID: byTitle("Relances envoyées"),
        MONDAY_OFFRE_RECEIVED_COLUMN_ID: byTitle("Offre reçue"),
        MONDAY_TABLEAU_RECEIVED_COLUMN_ID: byTitle("Tableau reçu"),
        MONDAY_CNI_RECEIVED_COLUMN_ID: byTitle("CNI reçue"),
        MONDAY_DATE_DEPOT_COLUMN_ID: byTitle("Date de dépôt"),
        MONDAY_OFFRE_LINK_COLUMN_ID: byTitle("Lien offre"),
        MONDAY_TABLEAU_LINK_COLUMN_ID: byTitle("Lien tableau"),
        MONDAY_CNI_LINK_COLUMN_ID: byTitle("Lien CNI")
      }
    },
    null,
    2
  ));
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
