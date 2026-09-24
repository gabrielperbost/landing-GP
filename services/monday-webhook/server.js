require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const { getEmailByDay } = require('./emails/sequence');
const { log } = require('./utils/logger');
const monday = require('./utils/monday');
const sequenceStore = require('./utils/sequenceStore');

const app = express();
app.set('trust proxy', true);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

let transporter = null;

function isTruthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

function getCalendlyUrl() {
  return (
    monday.normalizeEnv(process.env.CALENDLY_URL) ||
    'https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale'
  );
}

function isSmtpMock() {
  return isTruthy(process.env.SMTP_MOCK);
}

function getTransporter() {
  if (isSmtpMock()) return null;
  if (transporter) return transporter;

  const host = monday.normalizeEnv(process.env.SMTP_HOST);
  const user = monday.normalizeEnv(process.env.SMTP_USER);
  const pass = monday.normalizeEnv(process.env.SMTP_PASS);
  const port = parseInt(monday.normalizeEnv(process.env.SMTP_PORT), 10) || 587;
  const secure = monday.normalizeEnv(process.env.SMTP_SECURE)
    ? isTruthy(process.env.SMTP_SECURE)
    : port === 465;

  if (!host || !user || !pass) {
    throw new Error('Configuration SMTP incomplète');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return transporter;
}

async function verifySmtp() {
  if (isSmtpMock()) {
    log('INFO', 'SMTP_MOCK actif: aucun email réel ne sera envoyé');
    return;
  }

  try {
    await getTransporter().verify();
    log('INFO', 'SMTP Ionos connecté avec succès');
  } catch (err) {
    log('ERROR', `SMTP connexion échouée : ${err.message}`);
  }
}

function getProvidedSecret(req) {
  const authorization = req.get('authorization') || '';
  return (
    req.query.secret ||
    req.body?.secret ||
    req.get('x-webhook-secret') ||
    authorization.replace(/^Bearer\s+/i, '')
  );
}

function isAuthorized(req, envName) {
  const expected = monday.normalizeEnv(process.env[envName]);
  if (!expected) return true;
  return String(getProvidedSecret(req) || '') === expected;
}

function publicBaseUrl(req) {
  const configured = monday.normalizeEnv(process.env.PUBLIC_BASE_URL);
  if (configured) return configured.replace(/\/+$/, '');
  return `${req.protocol}://${req.get('host')}`.replace(/\/+$/, '');
}

function buildUnsubscribeUrl(req, token) {
  return `${publicBaseUrl(req)}/unsubscribe/${encodeURIComponent(token)}`;
}

function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(normalizeValue).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    if (value.email) return normalizeValue(value.email);
    if (value.phone) return normalizeValue(value.phone);
    if (value.text) return normalizeValue(value.text);
    if (value.label) return normalizeValue(value.label);
    if (value.name) return normalizeValue(value.name);
    if (value.value) return normalizeValue(value.value);
    return Object.values(value).map(normalizeValue).filter(Boolean).join(', ');
  }
  return String(value).trim();
}

function directValue(payload, keys) {
  const sources = [payload, payload?.data, payload?.event, payload?.payload].filter(Boolean);
  for (const source of sources) {
    for (const key of keys) {
      const value = normalizeValue(source[key]);
      if (value) return value;
    }
  }
  return '';
}

function collectTallyFields(payload) {
  const candidates = [payload?.data?.fields, payload?.fields, payload?.payload?.fields].filter(Array.isArray);
  return candidates.flat().map((field) => ({
    key: field.key || field.id || '',
    label: field.label || field.title || field.name || '',
    type: field.type || '',
    value: field.value ?? field.answer ?? field.text ?? '',
  }));
}

function fieldSignature(field) {
  return monday.normalizeText(`${field.label} ${field.key} ${field.type}`);
}

function findFieldValue(fields, patterns, predicate = null) {
  for (const field of fields) {
    const signature = fieldSignature(field);
    const matchesPattern = patterns.some((pattern) => pattern.test(signature));
    const matchesPredicate = predicate ? predicate(field, signature) : false;
    if (matchesPattern || matchesPredicate) {
      const value = normalizeValue(field.value);
      if (value) return value;
    }
  }
  return '';
}

function splitFullName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { prenom: '', nom: '' };
  if (parts.length === 1) return { prenom: parts[0], nom: '' };
  return {
    prenom: parts[0],
    nom: parts.slice(1).join(' '),
  };
}

function hasUsablePhone(phone) {
  return String(phone || '').replace(/\D/g, '').length >= 9;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function extractTallyLead(payload) {
  const fields = collectTallyFields(payload);
  const fullName =
    directValue(payload, ['name', 'fullName', 'full_name', 'nom_complet']) ||
    findFieldValue(fields, [/prenom.*nom/, /nom.*prenom/, /nom complet/, /full name/]);

  let prenom =
    directValue(payload, ['prenom', 'firstName', 'first_name', 'firstname']) ||
    findFieldValue(fields, [/(^|\s)prenom($|\s)/, /first name/]);
  let nom =
    directValue(payload, ['nom', 'lastName', 'last_name', 'lastname']) ||
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

  const email =
    directValue(payload, ['email', 'mail']) ||
    findFieldValue(fields, [/email/, /mail/], (_field, signature) => signature.includes('email'));
  const telephone =
    directValue(payload, ['telephone', 'phone', 'mobile', 'tel']) ||
    findFieldValue(fields, [/telephone/, /portable/, /mobile/, /phone/, /(^|\s)tel($|\s)/]);
  const situation =
    directValue(payload, ['situation', 'statut', 'profession']) ||
    findFieldValue(fields, [/situation/, /statut/, /profession/, /salarie/, /fonctionnaire/]);
  const retraite =
    directValue(payload, ['retraite', 'horizonRetraite', 'horizon_retraite']) ||
    findFieldValue(fields, [/retraite/, /horizon/, /depart/]);

  const responseId =
    directValue(payload, ['responseId', 'response_id', 'submissionId', 'submission_id']) ||
    payload?.data?.responseId ||
    payload?.data?.submissionId ||
    payload?.eventId ||
    '';

  const formName = directValue(payload, ['formName', 'form_name']) || payload?.data?.formName || '';

  return {
    prenom: prenom || 'Bonjour',
    nom,
    email: String(email || '').trim().toLowerCase(),
    telephone,
    situation,
    retraite,
    tallyResponseId: String(responseId || '').trim(),
    source: formName ? `Tally - ${formName}` : 'Tally',
    calendlyUrl: getCalendlyUrl(),
  };
}

function extractLeadFromMondayColumns(columnValues = {}, jour = 0) {
  const read = (...keys) => {
    for (const key of keys) {
      const value = normalizeValue(columnValues[key]?.text || columnValues[key]?.value || columnValues[key]);
      if (value) return value;
    }
    return '';
  };

  return {
    prenom: read('prenom', 'Prénom') || 'Bonjour',
    nom: read('nom', 'Nom'),
    email: read('email', 'Email') || null,
    telephone: read('telephone', 'Téléphone') || null,
    situation: read('situation') || '',
    retraite: read('retraite') || '',
    calendlyUrl: getCalendlyUrl(),
    jour,
  };
}

function emailLog(record) {
  const sentLines = Object.entries(record.sentDays || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([day, info]) => `J${day} envoyé le ${info.sentAt}${info.subject ? ` — ${info.subject}` : ''}`);

  if (record.stopReason) sentLines.push(`Stop: ${record.stopReason}`);
  return sentLines.join('\n') || 'Aucun email envoyé.';
}

async function sendEmail(lead) {
  if (!lead.email) {
    log('WARN', 'Lead sans email — envoi ignoré');
    return { sent: false, subject: '' };
  }

  const mail = getEmailByDay(lead.jour, lead);

  if (isSmtpMock()) {
    log('INFO', `SMTP_MOCK — Email J${lead.jour} simulé pour ${lead.email}`);
    return { sent: true, subject: mail.subject, mocked: true };
  }

  const smtpUser = monday.normalizeEnv(process.env.SMTP_USER);
  const senderName = monday.normalizeEnv(process.env.SENDER_NAME) || 'Gabriel PERBOST — GP FINANCES';

  await getTransporter().sendMail({
    from: `"${senderName}" <${smtpUser}>`,
    to: lead.email,
    subject: mail.subject,
    html: mail.html,
  });

  log('INFO', `Email J${lead.jour} envoyé à ${lead.email}`);
  return { sent: true, subject: mail.subject };
}

async function sendSequenceRecord(record, forcedDay = null) {
  const currentRecord = sequenceStore.getRecord(record.id) || record;
  const day = forcedDay === null || forcedDay === undefined ? currentRecord.nextDay : Number(forcedDay);

  if (currentRecord.status !== 'active') {
    return { sent: false, skipped: true, reason: `status:${currentRecord.status}` };
  }

  if (day === null || day === undefined || currentRecord.sentDays?.[String(day)]) {
    return { sent: false, skipped: true, reason: `duplicate:J${day}` };
  }

  const emailResult = await sendEmail({
    ...currentRecord.lead,
    jour: day,
    unsubscribeUrl: currentRecord.unsubscribeUrl,
    calendlyUrl: currentRecord.lead.calendlyUrl || getCalendlyUrl(),
  });

  if (!emailResult.sent) {
    return { sent: false, skipped: true, reason: 'missing-email' };
  }

  const sentAt = new Date().toISOString();
  const updatedRecord = sequenceStore.recordEmailSent({
    recordId: currentRecord.id,
    day,
    sentAt,
    subject: emailResult.subject,
  });

  try {
    await monday.markMondayEmailSent({
      itemId: updatedRecord.mondayItemId,
      day,
      sentAt,
      nextDay: updatedRecord.nextDay,
      nextSendAt: updatedRecord.nextSendAt,
      logText: emailLog(updatedRecord),
    });
  } catch (err) {
    log('ERROR', `Mise à jour Monday après email J${day} échouée — ${err.message}`);
  }

  return { sent: true, record: updatedRecord, day };
}

async function stopSequence(record, statusLabel, actionLabel) {
  const stopped = sequenceStore.stopRecord(record.id, statusLabel);
  if (!stopped) return null;

  try {
    await monday.markMondaySequenceStopped({
      itemId: stopped.mondayItemId,
      statusLabel,
      actionLabel,
      logText: emailLog(stopped),
    });
  } catch (err) {
    log('ERROR', `Mise à jour Monday stop séquence échouée — ${err.message}`);
  }

  log('INFO', `Séquence stoppée pour ${stopped.lead.email || stopped.id} — ${statusLabel}`);
  return stopped;
}

async function processDueSequences() {
  const dueRecords = sequenceStore.listDueRecords(new Date());
  const results = [];

  for (const record of dueRecords) {
    try {
      if (record.mondayItemId) {
        const item = await monday.getMondayItem(record.mondayItemId);
        const stopReason = item ? await monday.findMondayStopReason(item) : null;

        if (stopReason) {
          await stopSequence(record, stopReason.statusLabel, stopReason.actionLabel);
          results.push({ id: record.id, action: 'stopped', reason: stopReason.statusLabel });
          continue;
        }
      }

      const result = await sendSequenceRecord(record);
      results.push({ id: record.id, action: result.sent ? `sent:J${result.day}` : 'skipped', reason: result.reason });
    } catch (err) {
      log('ERROR', `Séquence due échouée pour ${record.id} — ${err.message}`);
      results.push({ id: record.id, action: 'error', reason: err.message });
    }
  }

  if (results.length) {
    log('INFO', `Traitement séquence: ${results.length} lead(s) traité(s)`);
  }

  return results;
}

app.post('/webhook/tally', async (req, res) => {
  if (!isAuthorized(req, 'TALLY_WEBHOOK_SECRET')) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  try {
    const lead = extractTallyLead(req.body);
    if (!isValidEmail(lead.email)) {
      log('WARN', 'Lead Tally sans email valide');
      return res.status(400).json({ ok: false, error: 'email_required' });
    }

    lead.hasPhone = hasUsablePhone(lead.telephone);

    const existing = sequenceStore.findExistingLead(lead);
    if (existing) {
      log('INFO', `Doublon Tally ignoré — ${lead.email}`);

      if (existing.status === 'active' && existing.nextDay === 0 && !existing.sentDays?.['0']) {
        await sendSequenceRecord(existing, 0);
      }

      return res.json({
        ok: true,
        duplicate: true,
        mode: existing.mode,
        mondayItemId: existing.mondayItemId,
      });
    }

    const token = sequenceStore.createToken();
    const unsubscribeUrl = buildUnsubscribeUrl(req, token);
    const mondayLead = await monday.createMondayLead({
      ...lead,
      unsubscribeUrl,
    });

    const createdAt = new Date().toISOString();
    const record = sequenceStore.upsertRecord({
      lead: {
        ...lead,
        unsubscribeUrl,
      },
      mondayItemId: mondayLead.itemId,
      mondayBoardId: mondayLead.boardId,
      mode: lead.hasPhone ? 'phone' : 'email',
      unsubscribeUrl,
      unsubscribeToken: token,
      createdAt,
    });

    if (lead.hasPhone) {
      log('INFO', `Lead Tally avec téléphone — rappel sous 5 min — item ${mondayLead.itemId}`);
      return res.json({
        ok: true,
        mode: 'phone',
        action: 'callback_under_5_min',
        mondayItemId: mondayLead.itemId,
      });
    }

    const sendResult = await sendSequenceRecord(record, 0);
    return res.json({
      ok: true,
      mode: 'email',
      action: sendResult.sent ? 'sequence_started' : 'sequence_created',
      mondayItemId: mondayLead.itemId,
    });
  } catch (err) {
    log('ERROR', `Webhook Tally — ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/webhook/monday', async (req, res) => {
  if (req.body.challenge) return res.json({ challenge: req.body.challenge });

  if (!isAuthorized(req, 'MONDAY_WEBHOOK_SECRET')) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const event = req.body.event || req.body;
  const itemId = event.pulseId || event.itemId || event.item_id;

  if (!itemId) {
    log('WARN', 'Webhook Monday sans item id');
    return res.status(400).json({ ok: false, error: 'missing_item_id' });
  }

  try {
    const item = await monday.getMondayItem(itemId);
    const stopReason = item ? await monday.findMondayStopReason(item) : null;

    if (stopReason) {
      const record = sequenceStore.getRecordByMondayItemId(itemId);
      if (record) await stopSequence(record, stopReason.statusLabel, stopReason.actionLabel);
      return res.json({ ok: true, action: 'stopped', reason: stopReason.statusLabel });
    }

    return res.json({ ok: true, action: 'checked' });
  } catch (err) {
    log('ERROR', `Webhook Monday — ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/webhook/monday/relance', async (req, res) => {
  if (req.body.challenge) return res.json({ challenge: req.body.challenge });

  if (!isAuthorized(req, 'MONDAY_WEBHOOK_SECRET')) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const event = req.body.event || req.body;
  const itemId = event.pulseId || event.itemId || event.item_id;
  const jour = parseInt(event.columnValues?.jour_sequence?.text || event.jour_sequence || event.jour || '2', 10);

  try {
    const record = sequenceStore.getRecordByMondayItemId(itemId);
    if (record) {
      const result = await sendSequenceRecord(record, jour);
      return res.json({ ok: true, sent: result.sent, reason: result.reason || null });
    }

    const lead = extractLeadFromMondayColumns(event.columnValues, jour);
    await sendEmail(lead);
    return res.json({ ok: true, sent: true, compatibility: true });
  } catch (err) {
    log('ERROR', `Relance Monday J${jour} — ${err.message}`);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/webhook/calendly', async (req, res) => {
  if (!isAuthorized(req, 'CALENDLY_WEBHOOK_SECRET')) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const email =
    directValue(req.body, ['email']) ||
    normalizeValue(req.body?.payload?.email) ||
    normalizeValue(req.body?.payload?.invitee?.email);

  if (!email) return res.status(400).json({ ok: false, error: 'missing_email' });

  const record = sequenceStore.getRecordByEmail(email);
  if (!record) return res.json({ ok: true, action: 'no_sequence_found' });

  await stopSequence(record, 'RDV pris', 'RDV téléphonique');
  return res.json({ ok: true, action: 'stopped', reason: 'RDV pris' });
});

app.get('/unsubscribe/:token', async (req, res) => {
  const record = sequenceStore.stopRecordByToken(req.params.token, 'Désinscrit');

  if (record) {
    try {
      await monday.markMondaySequenceStopped({
        itemId: record.mondayItemId,
        statusLabel: 'Désinscrit',
        actionLabel: 'Désinscrit',
        logText: emailLog(record),
      });
    } catch (err) {
      log('ERROR', `Mise à jour Monday désinscription échouée — ${err.message}`);
    }
  }

  res
    .status(record ? 200 : 404)
    .type('html')
    .send(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Désinscription</title><body style="font-family:Arial,sans-serif;padding:32px"><h1>${record ? 'Désinscription confirmée' : 'Lien introuvable'}</h1><p>${record ? 'Vous ne recevrez plus cette séquence email.' : 'Ce lien de désinscription est invalide ou expiré.'}</p></body></html>`);
});

app.get('/sequence/run', async (req, res) => {
  if (!isAuthorized(req, 'SEQUENCE_RUN_SECRET')) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const results = await processDueSequences();
  return res.json({ ok: true, processed: results.length, results });
});

app.post('/sequence/run', async (req, res) => {
  if (!isAuthorized(req, 'SEQUENCE_RUN_SECRET')) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const results = await processDueSequences();
  return res.json({ ok: true, processed: results.length, results });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dueSequences: sequenceStore.listDueRecords(new Date()).length,
  });
});

function startSequenceRunner() {
  if (process.env.SEQUENCE_AUTO_RUN === 'false') {
    log('INFO', 'Séquence auto désactivée');
    return;
  }

  const minutes = Math.max(1, parseInt(process.env.SEQUENCE_RUN_INTERVAL_MINUTES, 10) || 30);
  const intervalMs = minutes * 60 * 1000;

  setTimeout(() => processDueSequences().catch((err) => log('ERROR', `Runner séquence — ${err.message}`)), 5000).unref();
  setInterval(() => processDueSequences().catch((err) => log('ERROR', `Runner séquence — ${err.message}`)), intervalMs).unref();
  log('INFO', `Runner séquence actif toutes les ${minutes} min`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log('INFO', `Serveur démarré sur le port ${PORT}`);
  verifySmtp();
  startSequenceRunner();
});
