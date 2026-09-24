# Campagne webinaire PER pour avocats

Statut actuel : vague J-7 terminée via Brevo les 10 et 11 septembre 2026 (heure de Paris), avec 8 070 messages acceptés et aucun destinataire restant à traiter.

## Vague J-7 — septembre 2026

- Objet validé : `J-7 / Webinaire fiscalité PER pour avocats`.
- Modèle : `relance_s7`, source : `webinaire-per-avocats-j7-noninscrits`.
- Audience : fichiers nettoyés Île-de-France, Marseille et Lyon ; inscrits, désinscrits et destinataires déjà traités exclus, avec actualisation entre les groupes de 500.
- Audit final : 8 070 destinataires uniques, 323 lots terminés, aucun doublon, aucun lot sans résultat et aucune erreur d'acceptation par Brevo.
- Les délais de réponse ayant interrompu le premier essai ont été rapprochés des événements Brevo avant la reprise ; les messages déjà acceptés n'ont pas été renvoyés.
- Journaux et bilans locaux : `.codex-work/webinar-avocats-j7/` (`audit.json`, `prepared-summary.json`, `delivery-report.json`). L'acceptation d'un message par Brevo ne garantit pas sa livraison ; les refus et statuts encore en attente sont suivis séparément dans le bilan de livraison.

## Liens

- Page d'inscription : `https://gp-finances.fr/webinaire-per-avocats`
- Suivi participants : `https://gp-finances.fr/webinaire-per-avocats/admin`
- Previews emails : `https://gp-finances.fr/previews/webinar-avocats`
- Désinscription manuelle : `https://gp-finances.fr/webinaire-per-avocats/desinscription`
- Visioconférence : lien Zoom fourni le 11 septembre 2026, centralisé dans `WEBINAR_AVOCATS_MEETING_URL` (`src/lib/webinarAvocatsCalendar.ts`, surcharge possible par la variable d'environnement du même nom).
- Agendas : lien Zoom dans le champ URL du fichier ICS, ainsi que dans le lieu et la description des événements Google Agenda et Outlook. Les rappels aux inscrits contiennent les liens d'ajout à l'agenda ; la confirmation et les rappels de la veille et du matin contiennent aussi le bouton d'accès à Zoom.

## Webinaire

- Cible : avocats inscrits à un barreau français.
- Date : jeudi 17 septembre 2026.
- Horaire : 18h00 à 19h00.
- Format : 45 minutes de conseils + 15 minutes de questions.
- Thème : PER, fiscalité, préparation retraite et points de vigilance pour avocats.

## Process prévu

1. Valider ensemble les objets, textes et visuels des emails.
2. Valider la page d'inscription et les champs du bulletin.
3. Appliquer les tables Supabase ci-dessous.
4. Importer le fichier avocats en mode `draft`, sans envoi.
5. Nettoyer la base : doublons, emails invalides, adresses désinscrites.
6. Envoyer un test interne à GP Finances.
7. Activer explicitement l'envoi après validation.
8. Suivre : inscrits, désinscrits, bounces, erreurs SMTP.

## Suivi des inscriptions

- Page admin : `https://gp-finances.fr/webinaire-per-avocats/admin`
- API protégée : `https://gp-finances.fr/api/webinar-avocats/participants?token=<WEBINAR_AVOCATS_ADMIN_TOKEN>`
- Variable requise : `WEBINAR_AVOCATS_ADMIN_TOKEN`
- Données lues en priorité dans Google Sheets si configuré.
- Google Sheet cible : `Inscription Webinair Avocat 17 septembre 2026`
- Données lues en secours dans Supabase : `webinar_avocats_registrations` et `webinar_avocats_unsubscribes`.
- Si les tables Supabase ci-dessous ne sont pas encore créées, les inscriptions ne sont pas persistées en base et seuls les emails internes permettent de retrouver les demandes.

## Configuration Google Sheets

Variables Vercel requises :

- `WEBINAR_AVOCATS_GOOGLE_SHEET_ID` : ID du Google Sheet, visible dans son URL entre `/d/` et `/edit`.
- `WEBINAR_AVOCATS_GOOGLE_SHEET_NAME` : nom de l'onglet, par défaut `Inscriptions`.
- `WEBINAR_AVOCATS_GOOGLE_APPS_SCRIPT_URL` : URL du déploiement Apps Script, méthode recommandée pour un Google Sheet personnel.
- `WEBINAR_AVOCATS_GOOGLE_APPS_SCRIPT_SECRET` : secret partagé entre le site et Apps Script.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` : email du compte de service Google Cloud.
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` : clé privée du compte de service, avec les `\n` conservés.

Le Google Sheet doit être partagé en édition avec l'email `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

Colonnes créées automatiquement sur la ligne 1 :

1. Date inscription
2. Prénom
3. Nom
4. Email
5. Barreau
6. Cabinet
7. Téléphone
8. Statut
9. Source
10. Rappel 30j
11. Rappel 14j
12. Rappel 7j
13. Rappel 3j
14. Rappel veille
15. Rappel matin

### Méthode recommandée : Apps Script

Dans le Google Sheet :

1. Ouvrir `Extensions` > `Apps Script`.
2. Coller ce script.
3. Remplacer `CHANGE_ME_SECRET` par la même valeur que `WEBINAR_AVOCATS_GOOGLE_APPS_SCRIPT_SECRET`.
4. Déployer > `Nouveau déploiement` > type `Application Web`.
5. Exécuter en tant que `Moi`.
6. Accès : `Tout le monde`.
7. Copier l'URL du déploiement dans `WEBINAR_AVOCATS_GOOGLE_APPS_SCRIPT_URL`.

```js
const SHEET_NAME = 'Feuille 1';
const SECRET = 'CHANGE_ME_SECRET';
const HEADERS = [
  'Date inscription',
  'Prénom',
  'Nom',
  'Email',
  'Barreau',
  'Cabinet',
  'Téléphone',
  'Statut',
  'Source',
  'Rappel 30j',
  'Rappel 14j',
  'Rappel 7j',
  'Rappel 3j',
  'Rappel veille',
  'Rappel matin'
];
const REMINDER_COLUMNS = {
  reminder_30d_sent_at: 10,
  reminder_14d_sent_at: 11,
  reminder_7d_sent_at: 12,
  reminder_3d_sent_at: 13,
  reminder_1d_sent_at: 14,
  reminder_morning_sent_at: 15
};

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (headers.join('|') !== HEADERS.join('|')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (body.secret !== SECRET) return jsonResponse({ success: false, error: 'Unauthorized' });

  if (body.action === 'mark_reminder_sent') {
    return markReminderSent(body);
  }

  if (body.action && body.action !== 'append') {
    return jsonResponse({ success: false, error: 'Unknown action' });
  }

  const registration = body.registration || {};
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const email = String(registration.email || '').trim().toLowerCase();
  const existingIndex = rows.findIndex((line, index) => index > 0 && String(line[3] || '').trim().toLowerCase() === email);
  const existingRow = existingIndex >= 0 ? rows[existingIndex] : [];
  const row = [
    registration.consent_at || new Date().toISOString(),
    registration.prenom || '',
    registration.nom || '',
    email,
    registration.barreau || '',
    registration.cabinet || '',
    registration.telephone || '',
    registration.status || 'registered',
    registration.source || 'webinaire-per-avocats',
    existingRow[9] || '',
    existingRow[10] || '',
    existingRow[11] || '',
    existingRow[12] || '',
    existingRow[13] || '',
    existingRow[14] || ''
  ];

  if (existingIndex >= 0) {
    sheet.getRange(existingIndex + 1, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return jsonResponse({ success: true });
}

function markReminderSent(body) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const email = String(body.email || '').trim().toLowerCase();
  const column = REMINDER_COLUMNS[body.reminderKey];

  if (!email || !column) {
    return jsonResponse({ success: false, error: 'Missing email or invalid reminderKey' });
  }

  const existingIndex = rows.findIndex((line, index) => index > 0 && String(line[3] || '').trim().toLowerCase() === email);
  if (existingIndex < 0) {
    return jsonResponse({ success: false, error: 'Email not found' });
  }

  sheet.getRange(existingIndex + 1, column).setValue(body.sentAt || new Date().toISOString());
  return jsonResponse({ success: true });
}

function doGet(e) {
  if (e.parameter.secret !== SECRET) return jsonResponse({ success: false, error: 'Unauthorized' });

  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues().slice(1).filter(row => row.some(Boolean));
  const participants = rows.map(row => ({
    created_at: row[0] || '',
    prenom: row[1] || '',
    nom: row[2] || '',
    email: row[3] || '',
    barreau: row[4] || '',
    cabinet: row[5] || '',
    telephone: row[6] || '',
    status: row[7] || 'registered',
    source: row[8] || 'webinaire-per-avocats',
    reminder_30d_sent_at: row[9] || '',
    reminder_14d_sent_at: row[10] || '',
    reminder_7d_sent_at: row[11] || '',
    reminder_3d_sent_at: row[12] || '',
    reminder_1d_sent_at: row[13] || '',
    reminder_morning_sent_at: row[14] || ''
  }));

  return jsonResponse({ success: true, participants });
}
```

## Rappels automatiques aux inscrits

Les inscrits reçoivent uniquement des emails pratiques de rappel, pas les emails de prospection.

- 30 jours avant : mardi 18 août 2026.
- 2 semaines avant : jeudi 3 septembre 2026.
- 1 semaine avant : jeudi 10 septembre 2026.
- 3 jours avant : lundi 14 septembre 2026.
- La veille : mercredi 16 septembre 2026.
- Le matin même : jeudi 17 septembre 2026.

Route cron protégée : `https://gp-finances.fr/api/webinar-avocats/reminders/run`.

Variables :

- `WEBINAR_AVOCATS_REMINDER_SECRET` : secret optionnel pour déclenchement manuel, sinon `CRON_SECRET`.
- `WEBINAR_AVOCATS_REMINDER_BATCH_SIZE` : nombre maximum d'emails envoyés par exécution, par défaut `100`.

## Séquence proposée

- Invitation initiale : annonce du webinaire + bouton inscription.
- Relance S1 : question d'accroche sur l'impôt payé.
- Relance S2 : pertinence réelle du PER selon la situation.
- Relance S3 : exemple chiffré d'un avocat libéral.
- Relance S4 : lecture du plafond de déduction disponible.
- Relance S5 : erreur à éviter avant de verser.
- Relance S6 : anticipation avant la fin d'année.
- Relance S7 : dernière semaine avant le webinaire.
- Relance J-3 (`relance_3d`) : objet « J-3 / Webinaire fiscalité PER pour avocats », invitation réservée aux non-inscrits.
- Relance J-1 : dernier rappel avant le webinaire.
- Confirmation : uniquement après inscription.

## Conformité

- Chaque email contient l'identité GP Finances.
- Chaque email de prospection contient un lien de désinscription.
- Les désinscriptions sont stockées dans une liste repoussoir.
- La base doit être limitée aux emails professionnels d'avocats inscrits à un barreau identifié.
- Aucun email ne doit être envoyé à une adresse déjà désinscrite.

## SQL Supabase

```sql
create table if not exists public.webinar_avocats_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  prenom text,
  nom text,
  barreau text,
  cabinet text,
  telephone text,
  status text not null default 'draft',
  imported_at timestamptz default now(),
  invited_at timestamptz,
  registered_at timestamptz,
  unsubscribed_at timestamptz,
  bounced_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webinar_avocats_registrations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  prenom text,
  nom text,
  barreau text,
  cabinet text,
  telephone text,
  status text not null default 'registered',
  source text not null default 'webinaire-per-avocats',
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webinar_avocats_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'webinaire-per-avocats',
  unsubscribed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.webinar_avocats_email_events (
  id uuid primary key default gen_random_uuid(),
  contact_email text not null,
  template text not null,
  status text not null,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists webinar_avocats_contacts_status_idx on public.webinar_avocats_contacts(status);
create index if not exists webinar_avocats_registrations_status_idx on public.webinar_avocats_registrations(status);
create index if not exists webinar_avocats_email_events_email_idx on public.webinar_avocats_email_events(contact_email);
```

## Format CSV recommandé

Colonnes acceptées :

- `email` obligatoire
- `prenom`
- `nom`
- `barreau`
- `cabinet`
- `telephone`

Le fichier d'import ne doit pas contenir d'adresses non professionnelles hors cible.

## Reprise J-3 du 14 septembre 2026

Le rappel automatique s'est arrêté après 15 destinataires. La reprise autorisée utilise `/api/webinar-avocats/campaign/send-batch` avec `registered_reminder_3d`, puis `relance_3d` pour la prospection. Chaque requête traite au maximum 25 adresses. La lecture des inscrits et désabonnés doit réussir avant tout envoi ; les inscrits sont exclus des invitations, les non-inscrits des rappels, et les désinscriptions restent prioritaires. L'exclusion manuelle de Benjamin Valette est appliquée dans le serveur et le pilote.

Le pilote `.codex-work/webinar-avocats-j7/send_j3.mjs` conserve les tentatives et les identifiants Brevo dans `.codex-work/webinar-avocats-j3/{reminder,invitation}`. Avant chaque phase, il relit les participants et les demandes d'envoi Brevo pour le sujet concerné. Une tentative sans réponse complète bloque la reprise jusqu'au rapprochement des identifiants Brevo. Ne pas utiliser `force=1` sur le rappel automatique pour reprendre cette campagne : le Google Sheets ne contenait que 13 marqueurs pour les 15 premiers emails, et les envois par lots sont suivis dans les reçus locaux et Brevo.

Le fichier privé `.codex-work/webinar-avocats-inscrits/Inscrits - Webinaire Avocats 17 septembre 2026.xlsx` est un export filtré des inscrits, avec téléphone conservé au format texte et lien WhatsApp lorsqu'un numéro exploitable est présent. Les champs manquants ne sont pas inventés. Aucun message WhatsApp n'est envoyé par l'export.

Le 14 septembre, à la demande explicite de Gabriel, Sophie Greiner (`sophie-greiner@protonmail.com`) est également exclue. Son invitation J-3 avait déjà été envoyée à 10 h 58 avant cette demande. L'adresse est bloquée dans les pilotes J-7/J-3, l'export et les routes serveur de campagnes et de rappels automatiques. Ne jamais retirer cette exclusion lors d'un import ou d'une reprise.

## Vague J-1 — 16 septembre 2026

- Objet validé : `J-1 / Webinaire fiscalité PER pour avocats` ; modèle `relance_24h`.
- Version validée après test interne : « Au plaisir de vous retrouver demain » immédiatement après le paragraphe inscription/replay, avant le bouton.
- Déploiement : `dpl_7Xtpy1qRcHEkSpKhedYkEg8CLgqJ`, limité à ce modèle.
- Premier contrôle en direct : 7 518 destinataires éligibles sur 8 918 adresses uniques, après retrait de 62 inscrits et de 1 338 désabonnés/exclusions de cette base. La liste est recalculée pendant l’envoi.
- Exclusions manuelles maintenues : Benjamin Valette et Sophie Greiner, en complément des désabonnements.
- Recharge Brevo confirmée pendant le démarrage ; quota suffisant pour toute la vague.
- Vague arrêtée après 5 950 envois confirmés, sans doublon ni lot non résolu, suite à une indisponibilité de lecture Google Sheets. Journaux, preuves de déploiement et audits : `.codex-work/webinar-avocats-j1/`.
- Le pilote actualise les destinataires entre les groupes, vérifie la liste avant chaque lot et rapproche les envois avec les reçus locaux et Brevo. Un lot sans résultat confirmé doit être rapproché avant toute reprise.

## Dernière vague — 17 septembre 2026

- Objet et horaire validés : `Ce soir à 18h : PER & optimisation fiscale – spécial avocats`.
- Sous-titre validé : `Spécial avocat`. Phrase de conclusion avant le bouton d’inscription.
- Modèle distinct : `relance_j0`, source `webinaire-per-avocats-j0-noninscrits`. Test interne reçu puis envoi autorisé jusqu’à épuisement des crédits ou des destinataires éligibles. Aucune réserve de crédits.
- Premier contrôle : 7 478 destinataires éligibles, 8 235 crédits Brevo. Retrait des inscrits, désabonnés et exclusions manuelles ; suppression des doublons au sein de cette vague.
- Les liens J0 vont directement vers le site ; le suivi Brevo est conservé. Les écritures de suivi Google Sheets ne ralentissent donc plus ces clics ni les contrôles d’audience de cette vague.
- Déploiement : `dpl_3RghREi6vcFr4hKjZRxeV1jGLrHy`. Pilote et audits : `.codex-work/webinar-avocats-j0/`. Vague terminée : 7 478 envois uniques confirmés par Brevo, aucun doublon, aucun lot non résolu et aucun destinataire éligible restant. Solde après la vague : 758 crédits (avant les rappels complémentaires aux inscrits).


## Rappel Zoom complémentaire — 17 septembre 2026

- Modèle `registered_reminder_morning`, objet `Aujourd'hui 18h - Webinaire PER pour avocats`. Envoi demandé aux inscrits non encore servis par le rappel du jour.
- 15 rappels du matin déjà livrés exclus de la reprise ; 101 rappels complémentaires acceptés. Total du jour : 116 destinataires uniques. Aucun doublon, aucun lot non résolu, aucun inscrit restant à traiter lors du contrôle final.
- Contrôles d’inscription et de désinscription avant chaque lot ; exclusions manuelles conservées. Le rapprochement des 116 identifiants de messages Brevo est exact.
- Bouton Zoom complété par le lien en clair, l’heure de Paris, l’ID `836 5620 5859` et le code `1709`. Mise à jour publiée dans `dpl_AersydXtu8pvEGbPbzMtxRMSFMak`, après 20 contrôles automatisés des règles d’envoi et vérification du contenu en production.
- Journaux et résultats : `.codex-work/webinar-avocats-zoom-j0/`. Les statuts de livraison restent distincts des acceptations Brevo et figurent dans `delivery-report.json`.
- Export privé actualisé : `.codex-work/webinar-avocats-inscrits/Inscrits - Webinaire Avocats 17 septembre 2026.xlsx`, onglets `Inscrits` et `Vue d’ensemble`, uniquement les inscrits non désabonnés ni exclus. 116 inscrits, 97 téléphones renseignés, 95 liens WhatsApp exploitables ; aucun message WhatsApp envoyé. Le Google Sheets distant n’est pas modifié : connexion Google Drive / Sheets encore requise et proposée.


## Diaporama — hébergement discret et brouillon non envoyé

- PDF fourni : `Présentation : PER et optimisation fiscale.pdf`, 20 pages, copie inchangée (SHA-256 `99184bae6bd80882845aabe294851d50e09ba3df5a93f6b323fc44ac7e9b8516`).
- À la demande de l’utilisateur : hébergement sur `gp-finances.fr` sans ajout dans les pages, les menus ou le plan du site. Fichier source hors du dossier public, route de téléchargement `/webinaire-per-avocats/diaporama-17-septembre-2026`, en-têtes `Content-Disposition: attachment` et `X-Robots-Tag: noindex, nofollow`. Toute personne ayant le lien peut télécharger le PDF.
- Déploiement `dpl_6LMSsVwb34gY468ZtvkidmgLLBpm`. Téléchargement en production vérifié : code 200, fichier identique, absence du lien sur l’accueil et dans le sitemap. Les modèles d’envoi existants sont inchangés.
- Brouillon et aperçu avec bouton : `.codex-work/webinar-avocats-diaporama/`. Aucun mail envoyé ; `sendAllowed: false`. Attendre une demande explicite d’envoi avant tout test ou diffusion.

- Brouillon complété avec le replay fourni : `https://youtu.be/CYKCbu50r84`. Bouton « Voir le replay du webinaire » au-dessus de « Télécharger le diaporama » ; objet et version texte actualisés. Aucun envoi autorisé ni effectué.

- Le 17 septembre à 19h58 (Paris), test replay + diaporama envoyé uniquement à `gabriel.perbost@gp-finances.fr`, accepté par IONOS SMTP. Reçu : `.codex-work/webinar-avocats-diaporama/test-receipt.json`. Aucun envoi de ce mail aux inscrits ; diffusion toujours non autorisée.

## Corrections replay, désinscription et exclusion — 17 septembre 2026

- Objet du brouillon : `Merci pour votre participation – Replay et diaporama du webinaire`. Un seul « Bonjour Maître, », texte replay/diaporama demandé, suppression de « Document PDF · 20 pages », conclusion « Bien à vous, ». Les deux boutons sont conservés.
- Le brouillon comporte désormais un lien de désinscription signé et propre au destinataire, dans les versions HTML et texte. Les fichiers actuels sont personnalisés pour Gabriel : ne jamais les réutiliser tels quels pour une diffusion ; régénérer le lien pour chaque destinataire.
- Philippe Bremant (`bremant@bremant-associes.com`) est exclu à la demande explicite de Gabriel. Statut `unsubscribed` vérifié dans le Google Sheets en production ; exclusion permanente ajoutée aux campagnes, rappels automatiques et pilotes/exports locaux. Ne pas retirer cette exclusion lors d'une reprise ou d'un import.
- Correctif publié : `dpl_Cm5iStUYMFz1XDEBQ4txEHUm471S`, limité aux trois routes désinscription/campagnes/rappels. La désinscription accepte GET et POST (un clic), attend la persistance avant confirmation, refuse les jetons invalides avec HTTP 400, retourne HTTP 503 en cas d'échec de stockage et ne met pas la confirmation en cache. Les désinscriptions Supabase sont également répercutées dans Sheets quand celui-ci est configuré ; une inscription en doublon ne prend plus le dessus sur un désabonnement dans les rappels.
- Validation : 37 tests automatisés réussis. Vérification réelle GET et POST avec l'adresse de P. Bremant (seule adresse autorisée à désinscrire pour ce contrôle), HTTP 200 et persistance relue ; jetons invalides refusés ; trois simulations de campagnes/rappels retournent `skipped_unsubscribed`, zéro envoi. PDF téléchargé à nouveau : identique à l'original. Preuves : `.codex-work/webinar-avocats-unsubscribe-fix/`.
- Gabriel a ensuite demandé un nouveau test personnel. Autorisation limitée à `gabriel.perbost@gp-finances.fr` ; aucune diffusion du replay aux inscrits autorisée à ce stade. Le reçu de la nouvelle version figure dans `.codex-work/webinar-avocats-diaporama/corrected-test-*-receipt.json` une fois l'envoi confirmé.

## Replay envoyé aux inscrits — 17 septembre 2026, après validation du dernier test

- Autorisation explicite : « envoie ce mail à toutes les personnes inscrites ».
- Version approuvée : objet `Merci pour votre participation – Replay et diaporama du webinaire`, remerciements demandés, aucune graisse de texte, aucun encadré « En savoir plus », deux boutons alignés et signature directement sous « Bien à vous ». SHA-256 du dernier test HTML : `2d577332b8ae9b454429812b3265b60a4dc4e6800b39f2fb56fb1be672c86f98`.
- Modèle `registered_replay`, réservé aux inscrits avec priorité aux désinscriptions et maintien des trois exclusions manuelles (Benjamin Valette, Sophie Greiner, Philippe Bremant). Le lien de désinscription est signé par destinataire en HTML, texte et en-têtes. Les versions HTML et texte publiées reproduisent exactement le test validé, hormis ce lien propre à chaque destinataire.
- Déploiement ciblé `dpl_H5HNf6CFbtvgPBnLBuRhxB3js4wB` après 41 contrôles automatisés ; aucun autre contenu du site modifié.
- Audience initiale : 122 inscrits éligibles. Gabriel avait déjà reçu exactement cette version lors du test personnel ; 121 autres destinataires servis par Brevo en 7 lots. Aucun doublon, aucun lot non résolu, aucun destinataire éligible restant au contrôle final.
- Contrôle du 17 septembre à 22h03 (Paris) : 119 livraisons confirmées et 2 rejets temporaires (`softBounces`), zéro livraison en attente. Aucun renvoi forcé et aucun basculement vers un autre fournisseur pour les rejets. Solde Brevo : 1 023 crédits.
- 11 adresses se sont désinscrites entre la première lecture et le contrôle final ; l'export des inscrits actifs tient compte de ces changements et contient 111 personnes à cet instant. Les reçus d'envoi historiques sont conservés séparément.
- Preuves, autorisation, simulations, tentatives, réponses et suivi : `.codex-work/webinar-avocats-replay/`. Ne jamais relancer un lot sans réponse avant rapprochement avec Brevo. Le pilote vérifie les envois précédents et le contenu approuvé avant reprise.
- Export local des inscrits et téléphones actualisé, avec une colonne `Replay et diaporama` et les statuts dans `Vue d’ensemble`. Le Google Sheets distant n'a pas reçu de nouvel onglet : aucune connexion d'écriture Google Drive / Sheets disponible. Ne pas présenter l'export local comme une mise à jour d'onglet distant.

## Test replay pour les non-inscrits — 18 septembre 2026

- Demande limitée à un test personnel ; aucune diffusion aux non-inscrits autorisée.
- Objet exact : `Vous avez manqué notre webinaire PER ? Voici le replay`.
- Texte fourni par Gabriel, deux boutons replay et support placés après le texte, mise en page harmonisée reprise sans gras et sans encadré « En savoir plus ». Pied de page adapté à une audience non inscrite, avec désinscription personnalisée.
- Test accepté par IONOS le 18 septembre à 10h11 (Paris), uniquement à `gabriel.perbost@gp-finances.fr`. Brouillon, reçu et politique d'audience : `.codex-work/webinar-avocats-replay-noninscrits/`.
- Avant toute future campagne : actualiser les inscrits, désabonnements, exclusions manuelles et listes noires du fournisseur ; appliquer toutes ces exclusions et dédupliquer. Benjamin Valette, Sophie Greiner et Philippe Bremant restent exclus. Le mot « hier » nécessite une mise à jour si la diffusion intervient après le 18 septembre.


## Diffusion replay aux non-inscrits — 18 septembre 2026

- Autorisation explicite après le test : « tres bien, envoie la vague ». Objet `Vous avez manqué notre webinaire PER ? Voici le replay`, contenu et mise en page identiques au test accepté à 10h11 (Paris), hormis la désinscription personnalisée par destinataire. SHA-256 HTML approuvé : `a4bd0676f551860e6b607875131fc39c2d27463412d6f998a82523592fd6cf1c`.
- Modèle dédié `nonregistered_replay`. Vérifications des inscrits, désabonnements, trois exclusions manuelles et listes noires Brevo avant chaque lot. Les listes noires comprennent les contacts bloqués en transactionnel, les contacts marketing `emailBlacklisted` et les domaines bloqués, avec pagination intégrale et arrêt en cas de lecture incomplète.
- Déploiement ciblé `dpl_AbbRqmpqmvYmgYwxd1sogTkMrcH9`, prêt et promu après 48 contrôles automatisés. Simulation réelle : six contrôles d'exclusion réussis, objet exact et fournisseur Brevo confirmés.
- Audience initiale : 8 918 adresses uniques, 7 371 éligibles. Dans cette base : 87 inscrits, 1 419 désabonnés, 2 exclusions manuelles et 39 adresses bloquées retirés (catégories disjointes). Les trois exclusions manuelles restent actives, y compris celle absente de cette base.
- Solde initial : 10 522 crédits **email**. Les 501 crédits SMS ne sont pas comptabilisés pour la capacité d'envoi.
- Début des envois le 18 septembre à 10h24 (Paris). Journal préalable à chaque tentative, rapprochement des envois locaux et de l'historique Brevo avant reprise, verrou empêchant deux pilotes concurrents. Aucun achat de crédits, aucun envoi SMTP de campagne.
- Autorisation, copie figée, simulations, tentatives et rapports : `.codex-work/webinar-avocats-replay-noninscrits/`. Le bilan définitif sera enregistré dans `final-summary.json` après la diffusion. Ne pas considérer la campagne comme terminée tant que ce bilan est incomplet.
