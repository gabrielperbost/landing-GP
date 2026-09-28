# Webinaire PER grand public — dimanche 11 octobre 2026

Statut au 28 septembre 2026 : le code est écrit et prêt à déployer. **Il manque encore 3 réglages de ta part** avant que ça fonctionne réellement (voir « Ce qu'il te reste à faire » en bas). Tant qu'ils ne sont pas faits, le formulaire d'inscription refuse poliment (« service indisponible, appelez-moi ») plutôt que de perdre silencieusement des inscriptions.

## Le webinaire

- Cible : grand public.
- Date : dimanche 11 octobre 2026, 15h00 à 16h00 (heure de Paris).
- Format : 45 minutes d'explications et d'exemples chiffrés + 15 minutes de questions.
- Thème : comprendre le PER, estimer son économie d'impôt, éviter les erreurs fréquentes.
- Page d'inscription : `https://gp-finances.fr/webinaire-per` (c'est la page « En savoir plus » vers laquelle tes publicités doivent pointer).
- Désinscription : `https://gp-finances.fr/webinaire-per/desinscription` (lien automatique dans chaque e-mail).

## Ce qui a été construit

1. **Page d'inscription**, dans le même style que le reste du site : présentation du webinaire, programme, formulaire (prénom, nom, e-mail, case à cocher « SMS de rappel » qui révèle le téléphone si activée), une seule case de consentement RGPD obligatoire (couvre l'e-mail et, si demandé, le SMS — sans elle, l'inscription est refusée puisqu'aucune information ne pourrait être envoyée), FAQ.
2. **À l'inscription** : écriture dans un Google Sheet (voir ci-dessous), e-mail de confirmation avec lien Zoom et bouton « Ajouter à l'agenda » (Google, Outlook, fichier .ics), SMS de confirmation si la case SMS est cochée.
3. **Relances automatiques aux inscrits uniquement** (jamais de prospection à froid), espacées d'environ 2 jours pour garder le contact pendant toute la campagne :
   - J-11 (30 septembre) : e-mail, avec la vidéo « 5 erreurs PER ».
   - J-9 (2 octobre) : e-mail, invitation à poser une question en avance.
   - J-7 (4 octobre) : e-mail.
   - J-5 (6 octobre) : e-mail, rappel du programme.
   - J-3 (8 octobre) : e-mail.
   - La veille (10 octobre) : e-mail + SMS.
   - Le matin même (11 octobre) : e-mail + SMS.
   - Chaque relance n'est envoyée qu'une fois par personne (le Google Sheet garde la trace) ; une personne inscrite après une date de relance ne reçoit que celles qui restent à venir.
   - Chaque e-mail (confirmation comprise) affiche 2 vrais avis Google (rotation parmi 5 avis sélectionnés) et les 2 témoignages vidéo clients PER (Anaëlle, Dorothée).
4. **Désinscription en un clic**, obligatoire légalement, présente dans chaque e-mail.
5. **Suivi des sources publicitaires** : la page capte `utm_source`, `utm_campaign` etc. dans l'adresse (ajoutés automatiquement par la plupart des régies pub) et les enregistre avec l'inscription.

## Ce qui n'a pas été fait (volontairement, vu le délai)

- Pas de campagne de prospection à froid vers une liste achetée ou importée (contrairement au webinaire avocats) : les seuls contacts sont les personnes qui s'inscrivent elles-mêmes depuis tes publicités.
- Pas de page de suivi des inscrits type tableau de bord : les inscriptions se consultent directement dans le Google Sheet.
- Pas d'e-mail de replay automatique après le webinaire : à envoyer manuellement (je peux le préparer le moment venu, avec le vrai lien du replay).

## Étape 1 : créer le Google Sheet (5 minutes)

> ⚠️ **Tu as déjà créé ce Sheet et collé une version précédente du script (28 septembre, 16h) : recolle la version ci-dessous dès que possible**, avant le 30 septembre si possible. Elle ajoute 3 colonnes à la fin (Rappel 11j / 9j / 5j) pour la nouvelle cadence de relances tous les 2 jours. Comme les nouvelles colonnes sont ajoutées **à la fin**, aucune donnée déjà enregistrée n'est perturbée — tu peux recoller sans risque, même avec des inscriptions déjà présentes dans le Sheet. Sans cette mise à jour, les relances J-11/J-9/J-5 continueraient de partir mais ne se marqueraient pas comme envoyées dans le Sheet (risque de doublon uniquement si la tâche est relancée manuellement deux fois le même jour).

1. Crée un nouveau Google Sheet, par exemple nommé « Inscriptions Webinaire PER 11 octobre 2026 ».
2. Dans ce Sheet : menu `Extensions` > `Apps Script`.
3. Supprime le contenu par défaut et colle le script ci-dessous.
4. Remplace `CHANGE_ME_SECRET` par un mot de passe long que tu inventes (garde-le, il te servira à l'étape 2).
5. `Déployer` > `Nouveau déploiement` > type `Application Web`.
6. Exécuter en tant que `Moi`. Accès : `Tout le monde`.
7. Copie l'URL du déploiement (elle ressemble à `https://script.google.com/macros/s/.../exec`).

```js
const SHEET_NAME = 'Feuille 1';
const SECRET = 'CHANGE_ME_SECRET';
const HEADERS = [
  'Date inscription', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Consent email', 'Consent SMS',
  'Statut', 'Source', 'Rappel 7j', 'Rappel 3j', 'Rappel veille', 'Rappel matin',
  'Rappel 11j', 'Rappel 9j', 'Rappel 5j'
];
const REMINDER_COLUMNS = {
  reminder_7d_sent_at: 10,
  reminder_3d_sent_at: 11,
  reminder_1d_sent_at: 12,
  reminder_morning_sent_at: 13,
  reminder_11d_sent_at: 14,
  reminder_9d_sent_at: 15,
  reminder_5d_sent_at: 16
};

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
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

  if (body.action === 'mark_reminder_sent') {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    const email = String(body.email || '').trim().toLowerCase();
    const column = REMINDER_COLUMNS[body.reminderKey];
    if (!email || !column) return jsonResponse({ success: false, error: 'Missing email or invalid reminderKey' });
    const index = findRow(rows, email);
    if (index < 0) return jsonResponse({ success: false, error: 'Email not found' });
    sheet.getRange(index + 1, column).setValue(body.sentAt || new Date().toISOString());
    return jsonResponse({ success: true });
  }

  if (body.action === 'unsubscribe') {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    const email = String(body.email || '').trim().toLowerCase();
    const index = findRow(rows, email);
    if (index >= 0) sheet.getRange(index + 1, 8).setValue('unsubscribed');
    return jsonResponse({ success: true });
  }

  if (body.action && body.action !== 'append') return jsonResponse({ success: false, error: 'Unknown action' });

  const registration = body.registration || {};
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
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
    existing[13] || '', existing[14] || '', existing[15] || ''
  ];
  if (index >= 0) sheet.getRange(index + 1, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);

  return jsonResponse({ success: true });
}

function doGet(e) {
  if (e.parameter.secret !== SECRET) return jsonResponse({ success: false, error: 'Unauthorized' });
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues().slice(1).filter(row => row.some(Boolean));
  const participants = rows.map(row => ({
    created_at: row[0] || '', prenom: row[1] || '', nom: row[2] || '', email: row[3] || '', telephone: row[4] || '',
    consent_email: String(row[5] || '').toLowerCase() === 'oui', consent_sms: String(row[6] || '').toLowerCase() === 'oui',
    status: row[7] || 'registered', source: row[8] || 'webinaire-per',
    reminder_7d_sent_at: row[9] || '', reminder_3d_sent_at: row[10] || '', reminder_1d_sent_at: row[11] || '', reminder_morning_sent_at: row[12] || '',
    reminder_11d_sent_at: row[13] || '', reminder_9d_sent_at: row[14] || '', reminder_5d_sent_at: row[15] || ''
  }));
  return jsonResponse({ success: true, participants });
}
```

## Étape 2 : variables sur Vercel

À ajouter dans les réglages du projet (`vercel env add ...` ou l'interface Vercel), puis redéployer :

| Variable | Valeur |
| --- | --- |
| `WEBINAR_PER_GOOGLE_APPS_SCRIPT_URL` | l'URL copiée à l'étape 1 |
| `WEBINAR_PER_GOOGLE_APPS_SCRIPT_SECRET` | le mot de passe que tu as choisi à l'étape 1 |
| `WEBINAR_PER_MEETING_URL` | ton lien Zoom pour ce webinaire (pas celui des avocats) |
| `BREVO_SMS_SENDER` | le nom d'expéditeur SMS validé dans ton compte Brevo (11 caractères maximum). Si tu ne le donnes pas, `GPFinances` est utilisé par défaut : vérifie que ce nom est bien celui validé chez toi, sinon les SMS seront refusés par Brevo. |

Déjà configuré, rien à faire : `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `CRON_SECRET` (utilisé automatiquement pour autoriser la tâche planifiée des relances).

## Étape 3 : tester avant de lancer les publicités

1. Une fois les variables ajoutées et le site redéployé, va sur `https://gp-finances.fr/webinaire-per` et inscris-toi toi-même avec ton e-mail et ton téléphone (coche le SMS).
2. Vérifie que tu reçois l'e-mail de confirmation et le SMS.
3. Vérifie que la ligne apparaît dans le Google Sheet.
4. Clique sur « Se désinscrire » dans l'e-mail, vérifie que la colonne « Statut » passe à `unsubscribed` dans le Sheet.

## Suivi des inscriptions

Directement dans le Google Sheet créé à l'étape 1 : une ligne par personne, avec la source publicitaire, et la date de chaque relance envoyée.

## Conformité

- Une case de consentement unique, obligatoire, couvre l'e-mail et le SMS ; aucun envoi sans elle cochée.
- Lien de désinscription dans chaque e-mail.
- Les SMS de rappel indiquent explicitement de rappeler GP Finances pour ne plus en recevoir. Remarque : l'API d'envoi utilisée ici est faite pour des SMS ponctuels liés à une inscription volontaire, elle ne gère pas le mot-clé STOP automatique des campagnes marketing Brevo. Si tu veux un vrai mécanisme STOP par SMS, il faudrait passer par le module Campagnes SMS de Brevo plutôt que par ce système.
- Ce webinaire n'est pas un conseil personnalisé : la page et chaque e-mail le rappellent, avec ton numéro ORIAS.

## Mes conseils pour les publicités

- Fais pointer chaque annonce directement vers `https://gp-finances.fr/webinaire-per`, avec des paramètres `utm_source` et `utm_campaign` (par exemple `?utm_source=meta&utm_campaign=webinaire-per-octobre`) : ils sont automatiquement enregistrés avec chaque inscription, tu sauras quelle publicité a le mieux converti.
- Un dimanche après-midi est un bon créneau pour du grand public (disponibilité), garde ce point en tête dans le ton des annonces (« profitez de votre dimanche pour... »).
- Prévois un budget test small avant de scaler, et vérifie le coût par inscription les 2-3 premiers jours.

## Ce qu'il te reste à faire

1. Créer le Google Sheet et l'Apps Script (étape 1), me donner l'URL et le secret.
2. Me donner le lien Zoom du webinaire.
3. Confirmer le nom d'expéditeur SMS validé dans Brevo (ou dis-moi si `GPFinances` convient).

Dès que j'ai ces 3 informations, je les mets en ligne et je fais le test de bout en bout avec toi.
