# Webinaire PER grand public — dimanche 8 novembre 2026

Deuxième session du webinaire PER, en parallèle de celle du 1er novembre (même contenu, même guide PDF offert).

- Date : dimanche 8 novembre 2026, 15h00 à 16h00.
- Titre (à mettre aussi dans Zoom) : **Webinaire PER : payer moins d'impôts et préparer sa retraite**
- Page d'inscription (à mettre dans les publicités Meta) : `https://gp-finances.fr/webinaire-per-8-novembre?utm_source=meta&utm_campaign=webinaire-per-8-novembre`
- Inscriptions : onglet **« Feuille 2 »** du même Google Sheet (« Feuille 1 » reste celui du 1er novembre).
- Colonne « Source » : commence par `webinaire-per-8nov` (contre `webinaire-per` pour le 1er novembre).
- Rappels aux inscrits : J-3 (5 nov.), J-2 (6 nov.), la veille (7 nov., e-mail + SMS), le matin (8 nov., e-mail + SMS), 1 heure avant (8 nov. à 14h).
- Replay : `/api/webinar-per/replay/run?secret=...&session=2026-11-08&replayUrl=...` (ajouter `&dryRun=1` pour compter sans envoyer).
- Lien Zoom : `WEBINAR_PER_8NOV_MEETING_URL` (Vercel) ou valeur par défaut dans `src/lib/webinarPerConfig.ts`. Lien actuel : https://us06web.zoom.us/j/87575702326?pwd=3zNcYVD9JpMHdDchuM5Jq7A8Zf2E0b.1

## Mettre à jour l'Apps Script (obligatoire, 3 minutes)

Le script actuel écrit toujours dans « Feuille 1 ». Celui-ci choisit l'onglet demandé par le site (« Feuille 1 » ou « Feuille 2 ») et ajoute une colonne « Replay » à la fin (aucune donnée existante n'est touchée).

1. Dans le Google Sheet : `Extensions` > `Apps Script`.
2. **Note ton secret actuel** (la ligne `const SECRET = '...'`), puis remplace tout le code par celui ci-dessous et remets ton secret à la place de `CHANGE_ME_SECRET`.
3. Enregistre, puis `Déployer` > `Gérer les déploiements` > icône crayon > Version : `Nouvelle version` > `Déployer`. **Ne crée pas un nouveau déploiement** : l'URL doit rester la même.

Tant que ce n'est pas fait, les inscriptions du 8 novembre arrivent dans « Feuille 1 » (repérables par leur source `webinaire-per-8nov`) et les rappels du 8 novembre ne partent pas (sécurité : le site refuse de lire un onglet qu'il ne peut pas vérifier).

```js
const SHEET_NAMES = ['Feuille 1', 'Feuille 2'];
const SECRET = 'CHANGE_ME_SECRET';
const HEADERS = [
  'Date inscription', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Consent email', 'Consent SMS',
  'Statut', 'Source', 'Rappel 7j', 'Rappel 3j', 'Rappel veille', 'Rappel matin',
  'Rappel 11j', 'Rappel 9j', 'Rappel 5j', 'Replay'
];
const REMINDER_COLUMNS = {
  reminder_7d_sent_at: 10,
  reminder_3d_sent_at: 11,
  reminder_1d_sent_at: 12,
  reminder_morning_sent_at: 13,
  reminder_11d_sent_at: 14,
  reminder_9d_sent_at: 15,
  reminder_5d_sent_at: 16,
  replay_sent_at: 17
};

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function sheetName(requested) {
  return SHEET_NAMES.indexOf(requested) >= 0 ? requested : SHEET_NAMES[0];
}

function getSheet(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (headers.join('|') !== HEADERS.join('|')) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sheet;
}

function findRow(rows, email) {
  return rows.findIndex((line, index) => index > 0 && String(line[3] || '').trim().toLowerCase() === email);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (body.secret !== SECRET) return jsonResponse({ success: false, error: 'Unauthorized' });
  const name = sheetName(body.sheet);
  const sheet = getSheet(name);
  const rows = sheet.getDataRange().getValues();

  if (body.action === 'mark_reminder_sent') {
    const email = String(body.email || '').trim().toLowerCase();
    const column = REMINDER_COLUMNS[body.reminderKey];
    if (!email || !column) return jsonResponse({ success: false, error: 'Missing email or invalid reminderKey' });
    const index = findRow(rows, email);
    if (index < 0) return jsonResponse({ success: false, error: 'Email not found' });
    sheet.getRange(index + 1, column).setValue(body.sentAt || new Date().toISOString());
    return jsonResponse({ success: true, sheet: name });
  }

  if (body.action === 'unsubscribe') {
    const email = String(body.email || '').trim().toLowerCase();
    const index = findRow(rows, email);
    if (index >= 0) sheet.getRange(index + 1, 8).setValue('unsubscribed');
    return jsonResponse({ success: true, sheet: name });
  }

  if (body.action && body.action !== 'append') return jsonResponse({ success: false, error: 'Unknown action' });

  const registration = body.registration || {};
  const email = String(registration.email || '').trim().toLowerCase();
  const index = findRow(rows, email);
  const existing = index >= 0 ? rows[index] : [];
  const row = [
    registration.consent_at || new Date().toISOString(),
    registration.prenom || '',
    registration.nom || '',
    email,
    registration.telephone || '',
    registration.consent_email || '',
    registration.consent_sms || '',
    registration.status || 'registered',
    registration.source || 'webinaire-per',
    existing[9] || '', existing[10] || '', existing[11] || '', existing[12] || '',
    existing[13] || '', existing[14] || '', existing[15] || '', existing[16] || ''
  ];
  if (index >= 0) sheet.getRange(index + 1, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);

  return jsonResponse({ success: true, sheet: name });
}

function doGet(e) {
  if (e.parameter.secret !== SECRET) return jsonResponse({ success: false, error: 'Unauthorized' });
  const name = sheetName(e.parameter.sheet);
  const sheet = getSheet(name);
  const rows = sheet.getDataRange().getValues().slice(1).filter(row => row.some(Boolean));
  const participants = rows.map(row => ({
    created_at: row[0] || '', prenom: row[1] || '', nom: row[2] || '', email: row[3] || '', telephone: row[4] || '',
    consent_email: String(row[5] || '').toLowerCase() === 'oui', consent_sms: String(row[6] || '').toLowerCase() === 'oui',
    status: row[7] || 'registered', source: row[8] || 'webinaire-per',
    reminder_7d_sent_at: row[9] || '', reminder_3d_sent_at: row[10] || '', reminder_1d_sent_at: row[11] || '', reminder_morning_sent_at: row[12] || '',
    reminder_11d_sent_at: row[13] || '', reminder_9d_sent_at: row[14] || '', reminder_5d_sent_at: row[15] || '', replay_sent_at: row[16] || ''
  }));
  return jsonResponse({ success: true, sheet: name, participants });
}
```
