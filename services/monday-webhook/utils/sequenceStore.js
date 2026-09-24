const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SEQUENCE_DAYS = [0, 2, 5, 10, 15, 21, 30];
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const STATE_FILE = process.env.SEQUENCE_STATE_FILE || path.join(DATA_DIR, 'sequence-state.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function emptyState() {
  return {
    version: 1,
    leads: {},
  };
}

function loadState() {
  ensureDataDir();
  if (!fs.existsSync(STATE_FILE)) return emptyState();

  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return {
      ...emptyState(),
      ...parsed,
      leads: parsed.leads || {},
    };
  } catch {
    return emptyState();
  }
}

function saveState(state) {
  ensureDataDir();
  const tmpFile = `${STATE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2));
  fs.renameSync(tmpFile, STATE_FILE);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function leadIdentity(lead) {
  if (lead.tallyResponseId) return `tally:${lead.tallyResponseId}`;
  if (lead.email) return `email:${normalizeEmail(lead.email)}`;
  if (lead.telephone) return `phone:${normalizePhone(lead.telephone)}`;
  return `lead:${crypto.randomUUID()}`;
}

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function findExistingLead(lead) {
  const state = loadState();
  const email = normalizeEmail(lead.email);
  const phone = normalizePhone(lead.telephone);

  return (
    Object.values(state.leads).find((record) => {
      if (lead.tallyResponseId && record.lead.tallyResponseId === lead.tallyResponseId) return true;
      if (email && normalizeEmail(record.lead.email) === email) return true;
      if (phone && normalizePhone(record.lead.telephone) === phone) return true;
      return false;
    }) || null
  );
}

function getRecord(recordId) {
  const state = loadState();
  return state.leads[recordId] || null;
}

function getRecordByMondayItemId(itemId) {
  if (!itemId) return null;
  const state = loadState();
  return Object.values(state.leads).find((record) => String(record.mondayItemId) === String(itemId)) || null;
}

function getRecordByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const state = loadState();
  return Object.values(state.leads).find((record) => normalizeEmail(record.lead.email) === normalized) || null;
}

function getRecordByToken(token) {
  if (!token) return null;
  const state = loadState();
  return Object.values(state.leads).find((record) => record.unsubscribeToken === token) || null;
}

function upsertRecord({ lead, mondayItemId, mondayBoardId, mode, unsubscribeUrl, unsubscribeToken, createdAt }) {
  const state = loadState();
  const existing = findExistingLead(lead);
  const now = new Date().toISOString();

  if (existing) {
    state.leads[existing.id] = {
      ...existing,
      lead: { ...existing.lead, ...lead },
      mondayItemId: existing.mondayItemId || mondayItemId,
      mondayBoardId: existing.mondayBoardId || mondayBoardId,
      updatedAt: now,
    };
    saveState(state);
    return state.leads[existing.id];
  }

  const id = leadIdentity(lead);
  const isEmailSequence = mode === 'email';
  const record = {
    id,
    mode,
    status: isEmailSequence ? 'active' : 'phone',
    lead,
    mondayItemId,
    mondayBoardId,
    unsubscribeUrl,
    unsubscribeToken,
    createdAt: createdAt || now,
    updatedAt: now,
    sentDays: {},
    nextDay: isEmailSequence ? 0 : null,
    nextSendAt: isEmailSequence ? createdAt || now : null,
    stopReason: '',
  };

  state.leads[id] = record;
  saveState(state);
  return record;
}

function nextDayAfter(day) {
  const index = SEQUENCE_DAYS.indexOf(Number(day));
  if (index < 0 || index + 1 >= SEQUENCE_DAYS.length) return null;
  return SEQUENCE_DAYS[index + 1];
}

function addDays(isoDate, days) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function recordEmailSent({ recordId, day, sentAt, subject }) {
  const state = loadState();
  const record = state.leads[recordId];
  if (!record) throw new Error(`Lead sequence introuvable: ${recordId}`);

  const sentIso = sentAt || new Date().toISOString();
  const nextDay = nextDayAfter(day);
  const nextSendAt = nextDay === null ? null : addDays(record.createdAt, nextDay);

  record.sentDays[String(day)] = {
    sentAt: sentIso,
    subject: subject || '',
  };
  record.nextDay = nextDay;
  record.nextSendAt = nextSendAt;
  record.status = nextDay === null ? 'completed' : 'active';
  record.updatedAt = sentIso;

  state.leads[recordId] = record;
  saveState(state);

  return record;
}

function stopRecord(recordId, reason) {
  const state = loadState();
  const record = state.leads[recordId];
  if (!record) return null;

  record.status = reason === 'Désinscrit' ? 'unsubscribed' : 'stopped';
  record.stopReason = reason || 'Stop manuel';
  record.nextDay = null;
  record.nextSendAt = null;
  record.updatedAt = new Date().toISOString();

  state.leads[recordId] = record;
  saveState(state);
  return record;
}

function stopRecordByToken(token, reason = 'Désinscrit') {
  const record = getRecordByToken(token);
  if (!record) return null;
  return stopRecord(record.id, reason);
}

function stopRecordByMondayItemId(itemId, reason) {
  const record = getRecordByMondayItemId(itemId);
  if (!record) return null;
  return stopRecord(record.id, reason);
}

function listDueRecords(now = new Date()) {
  const currentTime = now.getTime();
  const state = loadState();

  return Object.values(state.leads).filter((record) => {
    if (record.status !== 'active') return false;
    if (record.nextDay === null || record.nextDay === undefined) return false;
    if (record.sentDays?.[String(record.nextDay)]) return false;
    if (!record.nextSendAt) return true;
    return new Date(record.nextSendAt).getTime() <= currentTime;
  });
}

module.exports = {
  SEQUENCE_DAYS,
  createToken,
  findExistingLead,
  getRecord,
  getRecordByEmail,
  getRecordByMondayItemId,
  getRecordByToken,
  listDueRecords,
  recordEmailSent,
  stopRecord,
  stopRecordByMondayItemId,
  stopRecordByToken,
  upsertRecord,
};
