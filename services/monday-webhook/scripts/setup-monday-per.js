try {
  require('dotenv').config();
} catch {
  // dotenv is optional for this setup script when env vars are already injected.
}

const {
  PER_COLUMN_DEFINITIONS,
  ensureBoardWebhook,
  ensurePerColumns,
  normalizeEnv,
} = require('../utils/monday');

function buildMondayWebhookUrl() {
  const explicitUrl = normalizeEnv(process.env.MONDAY_WEBHOOK_URL);
  if (explicitUrl) return explicitUrl;

  const baseUrl = normalizeEnv(process.env.PUBLIC_BASE_URL);
  if (!baseUrl) return '';

  const secret = normalizeEnv(process.env.MONDAY_WEBHOOK_SECRET);
  const url = new URL('/webhook/monday', baseUrl.replace(/\/+$/, ''));
  if (secret) url.searchParams.set('secret', secret);
  return url.toString();
}

async function main() {
  const config = await ensurePerColumns({ refresh: true });
  const webhookUrl = buildMondayWebhookUrl();
  let webhookId = '';

  if (webhookUrl) {
    webhookId = await ensureBoardWebhook(webhookUrl);
  }

  console.log(
    JSON.stringify(
      {
        board_id: config.boardId,
        board_name: config.boardName,
        group_id: config.groupId,
        group_title: config.groupTitle,
        columns: PER_COLUMN_DEFINITIONS.map((definition) => ({
          key: definition.key,
          title: definition.title,
          id: config.ids[definition.key],
          type: definition.columnType,
        })),
        webhook_url: webhookUrl || null,
        webhook_id: webhookId || null,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
