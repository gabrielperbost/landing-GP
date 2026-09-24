const MONDAY_API_URL = 'https://api.monday.com/v2';

const DEFAULT_BOARD_ID = '5090527669';
const DEFAULT_GROUP_ID = 'group_mm3jv7pm';
const DEFAULT_GROUP_TITLE = 'Leads TALLY';

const PER_COLUMN_DEFINITIONS = [
  { key: 'prenom', title: 'Prénom', columnType: 'text' },
  { key: 'nom', title: 'Nom', columnType: 'text' },
  { key: 'email', title: 'Email', columnType: 'email' },
  { key: 'telephone', title: 'Téléphone', columnType: 'phone' },
  { key: 'leadType', title: 'Type de lead', columnType: 'status' },
  { key: 'salesAction', title: 'Action commerciale', columnType: 'status' },
  { key: 'sequenceStatus', title: 'Statut séquence', columnType: 'status' },
  { key: 'sequenceDay', title: 'Jour séquence', columnType: 'numbers' },
  { key: 'sequenceStartedAt', title: 'Début séquence', columnType: 'date' },
  { key: 'lastEmailAt', title: 'Dernier email envoyé', columnType: 'date' },
  { key: 'nextEmailAt', title: 'Prochain email', columnType: 'date' },
  { key: 'tallyResponseId', title: 'ID réponse Tally', columnType: 'text' },
  { key: 'source', title: 'Source', columnType: 'text' },
  { key: 'calendly', title: 'Lien Calendly', columnType: 'link' },
  { key: 'appointmentBooked', title: 'RDV pris', columnType: 'checkbox' },
  { key: 'unsubscribed', title: 'Désinscrit', columnType: 'checkbox' },
  { key: 'emailLog', title: 'Log emails', columnType: 'long_text' },
];

let cachedPerConfig = null;

function normalizeEnv(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return quoted ? trimmed.slice(1, -1).trim() || undefined : trimmed;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getMondayBoardId() {
  return normalizeEnv(process.env.MONDAY_BOARD_ID) || DEFAULT_BOARD_ID;
}

function getMondayGroupId() {
  return normalizeEnv(process.env.MONDAY_GROUP_ID) || DEFAULT_GROUP_ID;
}

function getMondayGroupTitle() {
  return normalizeEnv(process.env.MONDAY_GROUP_TITLE) || DEFAULT_GROUP_TITLE;
}

function getMondayToken() {
  const token = normalizeEnv(process.env.MONDAY_API_TOKEN);
  if (!token) throw new Error('MONDAY_API_TOKEN manquant');
  return token;
}

async function callMondayApi(query, variables = {}) {
  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: getMondayToken(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Monday API HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Monday API error: ${json.errors.map((error) => error.message).join(' | ')}`);
  }

  if (!json.data) {
    throw new Error('Monday API missing data');
  }

  return json.data;
}

async function getBoardSnapshot(boardId = getMondayBoardId()) {
  const data = await callMondayApi(
    `
      query BoardSnapshot($boardId: [ID!]) {
        boards(ids: $boardId) {
          id
          name
          groups {
            id
            title
          }
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

  const board = data.boards?.[0];
  if (!board) throw new Error(`Tableau Monday introuvable: ${boardId}`);
  return board;
}

async function createColumn({ boardId, title, columnType }) {
  const data = await callMondayApi(
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

  return data.create_column;
}

async function ensurePerColumns({ refresh = false } = {}) {
  if (cachedPerConfig && !refresh) return cachedPerConfig;

  const boardId = getMondayBoardId();
  const requestedGroupId = getMondayGroupId();
  const groupTitle = getMondayGroupTitle();
  let board = await getBoardSnapshot(boardId);

  const group =
    board.groups.find((candidate) => candidate.id === requestedGroupId) ||
    board.groups.find((candidate) => normalizeText(candidate.title) === normalizeText(groupTitle));

  if (!group) {
    throw new Error(`Groupe Monday introuvable: ${groupTitle}`);
  }

  const ensuredColumns = [];
  for (const definition of PER_COLUMN_DEFINITIONS) {
    const existing = board.columns.find(
      (column) => normalizeText(column.title) === normalizeText(definition.title)
    );

    if (existing) {
      ensuredColumns.push(existing);
      continue;
    }

    const created = await createColumn({
      boardId,
      title: definition.title,
      columnType: definition.columnType,
    });
    ensuredColumns.push(created);
    board = await getBoardSnapshot(boardId);
  }

  board = await getBoardSnapshot(boardId);
  const ids = {};
  for (const definition of PER_COLUMN_DEFINITIONS) {
    const column = board.columns.find((candidate) => normalizeText(candidate.title) === normalizeText(definition.title));
    if (column) ids[definition.key] = column.id;
  }

  cachedPerConfig = {
    boardId,
    boardName: board.name,
    groupId: group.id,
    groupTitle: group.title,
    columns: board.columns,
    ids,
    ensuredColumns,
  };

  return cachedPerConfig;
}

function dateValue(value) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return { date: date.toISOString().slice(0, 10) };
}

function phoneValue(phone) {
  if (!phone) return undefined;
  return { phone: String(phone).trim(), countryShortName: 'FR' };
}

function emailValue(email) {
  if (!email) return undefined;
  const normalized = String(email).trim().toLowerCase();
  return { email: normalized, text: normalized };
}

function linkValue(url, text) {
  if (!url) return undefined;
  return { url, text: text || url };
}

function checkedValue(checked) {
  return { checked: checked ? 'true' : 'false' };
}

function setColumn(columnValues, columnId, value) {
  if (!columnId || value === undefined || value === null || value === '') return;
  columnValues[columnId] = value;
}

function buildLeadItemName(lead) {
  const fullName = [lead.prenom, lead.nom].filter(Boolean).join(' ').trim();
  return fullName || lead.email || lead.telephone || 'Lead Tally';
}

async function createMondayLead(lead) {
  const config = await ensurePerColumns();
  const ids = config.ids;
  const hasPhone = Boolean(lead.hasPhone);
  const now = new Date();
  const columnValues = {};

  setColumn(columnValues, ids.prenom, lead.prenom || '');
  setColumn(columnValues, ids.nom, lead.nom || '');
  setColumn(columnValues, ids.email, emailValue(lead.email));
  setColumn(columnValues, ids.telephone, phoneValue(lead.telephone));
  setColumn(columnValues, ids.leadType, { label: hasPhone ? 'A un téléphone' : 'Email seulement' });
  setColumn(columnValues, ids.salesAction, { label: hasPhone ? 'Rappel sous 5 min' : 'Séquence email active' });
  setColumn(columnValues, ids.sequenceStatus, { label: hasPhone ? 'Non applicable' : 'Active' });
  setColumn(columnValues, ids.sequenceDay, hasPhone ? '' : '0');
  setColumn(columnValues, ids.sequenceStartedAt, dateValue(now));
  setColumn(columnValues, ids.nextEmailAt, hasPhone ? undefined : dateValue(now));
  setColumn(columnValues, ids.tallyResponseId, lead.tallyResponseId || '');
  setColumn(columnValues, ids.source, lead.source || 'Tally');
  setColumn(columnValues, ids.calendly, linkValue(lead.calendlyUrl, 'Calendly'));
  setColumn(columnValues, ids.appointmentBooked, checkedValue(false));
  setColumn(columnValues, ids.unsubscribed, checkedValue(false));
  setColumn(columnValues, ids.emailLog, {
    text: hasPhone ? 'Lead avec téléphone: rappel sous 5 min.' : 'Séquence email créée depuis Tally.',
  });

  const data = await callMondayApi(
    `
      mutation CreateLead($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
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
      boardId: config.boardId,
      groupId: config.groupId,
      itemName: buildLeadItemName(lead),
      columnValues: JSON.stringify(columnValues),
    }
  );

  return {
    itemId: data.create_item.id,
    boardId: config.boardId,
    groupId: config.groupId,
  };
}

async function updateMondayColumns({ itemId, columnValues }) {
  if (!itemId || !Object.keys(columnValues).length) return;
  const config = await ensurePerColumns();

  await callMondayApi(
    `
      mutation UpdateLead($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
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
      boardId: config.boardId,
      itemId,
      columnValues: JSON.stringify(columnValues),
    }
  );
}

async function markMondayEmailSent({ itemId, day, sentAt, nextDay, nextSendAt, logText }) {
  const { ids } = await ensurePerColumns();
  const columnValues = {};

  setColumn(columnValues, ids.sequenceStatus, { label: nextDay === null ? 'Terminée' : 'Active' });
  setColumn(columnValues, ids.salesAction, { label: nextDay === null ? 'Séquence terminée' : 'Séquence email active' });
  setColumn(columnValues, ids.sequenceDay, String(day));
  setColumn(columnValues, ids.lastEmailAt, dateValue(sentAt));
  setColumn(columnValues, ids.nextEmailAt, nextDay === null ? undefined : dateValue(nextSendAt));
  setColumn(columnValues, ids.emailLog, { text: logText });

  await updateMondayColumns({ itemId, columnValues });
}

async function markMondaySequenceStopped({ itemId, statusLabel, actionLabel, logText }) {
  const { ids } = await ensurePerColumns();
  const normalizedStatus = normalizeText(statusLabel);
  const columnValues = {};

  setColumn(columnValues, ids.sequenceStatus, { label: statusLabel });
  setColumn(columnValues, ids.salesAction, { label: actionLabel || statusLabel });
  setColumn(columnValues, ids.emailLog, { text: logText });

  if (normalizedStatus.includes('desinscrit')) {
    setColumn(columnValues, ids.unsubscribed, checkedValue(true));
  }

  if (normalizedStatus.includes('rdv')) {
    setColumn(columnValues, ids.appointmentBooked, checkedValue(true));
  }

  await updateMondayColumns({ itemId, columnValues });
}

async function getMondayItem(itemId) {
  const data = await callMondayApi(
    `
      query GetItem($itemId: [ID!]) {
        items(ids: $itemId) {
          id
          name
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

  return data.items?.[0] || null;
}

function getColumnValue(item, columnId) {
  if (!item || !columnId) return null;
  return item.column_values?.find((column) => column.id === columnId) || null;
}

function checkboxIsChecked(column) {
  if (!column?.value) return false;
  try {
    const parsed = JSON.parse(column.value);
    return parsed.checked === true || parsed.checked === 'true';
  } catch {
    return normalizeText(column.text).includes('v');
  }
}

async function findMondayStopReason(item) {
  const { ids } = await ensurePerColumns();
  const sequenceStatus = normalizeText(getColumnValue(item, ids.sequenceStatus)?.text);
  const salesAction = normalizeText(getColumnValue(item, ids.salesAction)?.text);

  if (checkboxIsChecked(getColumnValue(item, ids.unsubscribed)) || sequenceStatus.includes('desinscrit')) {
    return { statusLabel: 'Désinscrit', actionLabel: 'Désinscrit' };
  }

  if (
    checkboxIsChecked(getColumnValue(item, ids.appointmentBooked)) ||
    sequenceStatus.includes('rdv') ||
    salesAction.includes('rdv')
  ) {
    return { statusLabel: 'RDV pris', actionLabel: 'RDV téléphonique' };
  }

  if (sequenceStatus.includes('stop') || sequenceStatus.includes('terminee')) {
    return { statusLabel: 'Stop manuel', actionLabel: 'Séquence stoppée' };
  }

  return null;
}

async function createBoardWebhook(webhookUrl) {
  const boardId = getMondayBoardId();
  const data = await callMondayApi(
    `
      mutation CreateWebhook($boardId: ID!, $url: String!) {
        create_webhook(board_id: $boardId, url: $url, event: change_column_value) {
          id
        }
      }
    `,
    { boardId, url: webhookUrl }
  );

  return data.create_webhook.id;
}

async function ensureBoardWebhook(webhookUrl) {
  const boardId = getMondayBoardId();

  try {
    const data = await callMondayApi(
      `
        query BoardWebhooks($boardId: [ID!]) {
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

    const existing = data.boards?.[0]?.webhooks?.find(
      (webhook) => webhook.url === webhookUrl && webhook.event === 'change_column_value'
    );
    if (existing) return existing.id;
  } catch {
    // Some Monday plans do not expose webhook listing; creation is the fallback.
  }

  return createBoardWebhook(webhookUrl);
}

module.exports = {
  PER_COLUMN_DEFINITIONS,
  callMondayApi,
  createBoardWebhook,
  ensureBoardWebhook,
  createMondayLead,
  ensurePerColumns,
  findMondayStopReason,
  getMondayBoardId,
  getMondayGroupId,
  getMondayGroupTitle,
  getMondayItem,
  markMondayEmailSent,
  markMondaySequenceStopped,
  normalizeEnv,
  normalizeText,
};
