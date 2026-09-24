# GP FINANCES — Tally → Monday PER → Ionos

## Flux

```txt
Tally
  → POST /webhook/tally
    → création du lead dans Monday / PER / Leads TALLY
      → téléphone présent : Action commerciale = Rappel sous 5 min
      → email seulement : séquence Ionos J0/J2/J5/J10/J15/J21/J30
```

La séquence s'arrête automatiquement si :
- le lead se désinscrit via le lien email ;
- Calendly envoie un webhook avec l'email du lead ;
- Monday indique `RDV pris`, `Désinscrit`, `Stop` ou `Terminée` sur le lead.

## Installation

```bash
npm install
cp .env.example .env
npm run setup:monday:per
npm start
```

## Variables `.env`

| Variable | Usage |
| --- | --- |
| `PUBLIC_BASE_URL` | URL publique du serveur, utilisée pour les liens de désinscription |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP Ionos |
| `SMTP_MOCK` | `true` pour tester sans envoyer d'emails réels |
| `SENDER_NAME` | Nom de l'expéditeur |
| `CALENDLY_URL` | Lien de prise de RDV |
| `TALLY_WEBHOOK_SECRET` | Secret attendu sur `/webhook/tally?secret=...` |
| `MONDAY_API_TOKEN` | Token API Monday |
| `MONDAY_BOARD_ID` | Tableau PER, par défaut `5090527669` |
| `MONDAY_GROUP_ID` | Groupe Leads TALLY, par défaut `group_mm3jv7pm` |
| `MONDAY_WEBHOOK_SECRET` | Secret attendu sur `/webhook/monday?secret=...` |
| `CALENDLY_WEBHOOK_SECRET` | Secret attendu sur `/webhook/calendly?secret=...` |
| `SEQUENCE_AUTO_RUN` | `true` pour traiter les relances automatiquement |
| `SEQUENCE_RUN_SECRET` | Secret attendu sur `/sequence/run?secret=...` |
| `SEQUENCE_RUN_INTERVAL_MINUTES` | Fréquence du runner, par défaut 30 minutes |

## Colonnes Monday créées

Le script `npm run setup:monday:per` ajoute ou réutilise ces colonnes dans le tableau `PER`, groupe `Leads TALLY` :

| Colonne | Type |
| --- | --- |
| `Prénom`, `Nom`, `ID réponse Tally`, `Source` | Texte |
| `Email` | Email |
| `Téléphone` | Téléphone |
| `Type de lead`, `Action commerciale`, `Statut séquence` | Statut |
| `Jour séquence` | Nombre |
| `Début séquence`, `Dernier email envoyé`, `Prochain email` | Date |
| `Lien Calendly` | Lien |
| `RDV pris`, `Désinscrit` | Checkbox |
| `Log emails` | Texte long |

## Endpoints

| Route | Rôle |
| --- | --- |
| `POST /webhook/tally?secret=...` | Reçoit Tally, crée le lead Monday et démarre la séquence si email seul |
| `POST /webhook/monday?secret=...` | Stoppe la séquence si le statut Monday indique RDV/désinscription/stop |
| `POST /webhook/calendly?secret=...` | Stoppe la séquence quand un RDV Calendly est pris |
| `GET /unsubscribe/:token` | Désinscription lead |
| `GET/POST /sequence/run?secret=...` | Traite les emails dus, utile pour cron externe |
| `GET /health` | Santé du serveur |

## Configuration Tally

Dans Tally, ajoute un webhook :

```txt
POST https://ton-domaine.fr/webhook/tally?secret=TALLY_WEBHOOK_SECRET
```

Le parser accepte les champs Tally standards et détecte automatiquement :
- email ;
- téléphone / mobile / portable ;
- prénom, nom ou prénom/nom ;
- situation ;
- horizon retraite.

## Anti-doublons et logs

- Les doublons sont évités par `ID réponse Tally`, puis par email, puis par téléphone.
- L'état de séquence est stocké dans `data/sequence-state.json`.
- Les logs applicatifs sont écrits dans `logs/app.log`.
- Les emails déjà envoyés par jour (`J0`, `J2`, etc.) ne sont pas renvoyés.
