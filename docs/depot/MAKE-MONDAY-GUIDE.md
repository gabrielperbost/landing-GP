# Guide Make + Monday – Mapping opérationnel
## GP Finances – Plateforme dépôt

Ce guide correspond au payload réel envoyé par `POST /api/transfer` en production.

---

## 1) Scénario Make A: Monday -> génération du lien client

### Module A1
- Type: `Monday.com > Watch Items`
- Filtre: quand le statut passe à `Attente de documents`

### Module A2
- Type: `HTTP > Make a request`
- URL: `https://gp-finances.fr/api/monday/webhook?secret=<MONDAY_INCOMING_WEBHOOK_SECRET>`
- Method: `POST`
- Headers:
```txt
Content-Type: application/json
```
- Body (Raw / JSON):
```json
{
  "event": {
    "pulseId": "{{1.id}}",
    "columnId": "status"
  }
}
```

### Module A3
- Type: `Monday.com > Change multiple column values of an item`
- Optionnel: uniquement si vous avez besoin d'un enrichissement hors webhook.
- Le webhook natif met déjà à jour le lien espace client et la date d'entrée en attente docs.

---

## 2) Scénario Make B: dépôt client -> update Monday

### Module B1
- Type: `Webhooks > Custom webhook`
- URL de ce module: déjà branchée dans Vercel (`MAKE_TRANSFER_WEBHOOK_URL`)

Payload reçu:
```json
{
  "monday_item_id": "123456789",
  "client_name": "Marie Dupont",
  "client_email": "marie@example.com",
  "bank": "bnp",
  "bank_label": "BNP Paribas",
  "offre_received": true,
  "tableau_received": true,
  "identite_received": false,
  "offre_url": "https://...",
  "tableau_url": "https://...",
  "identite_url": null,
  "uploaded_at": "2026-03-08T14:47:40.213Z",
  "new_status": "Devis à réaliser"
}
```

### Module B2
- Type: `Monday.com > Change multiple column values of an item`
- Item ID: `{{1.monday_item_id}}`
- Map des colonnes:
  - `Statut` = `{{1.new_status}}`
  - `Banque` = `{{1.bank_label}}`
  - `Offre reçue` (checkbox) = `{{1.offre_received}}`
  - `Tableau reçu` (checkbox) = `{{1.tableau_received}}`
  - `CNI reçue` (checkbox) = `{{1.identite_received}}`
  - `Date de dépôt` = `{{formatDate(1.uploaded_at; "YYYY-MM-DD")}}`
  - `Lien offre` (texte/url) = `{{1.offre_url}}`
  - `Lien tableau` (texte/url) = `{{1.tableau_url}}`
  - `Lien CNI` (texte/url) = `{{1.identite_url}}`

### Module B3 (optionnel)
- Type: `Monday.com > Move an item to a group`
- Group: `Devis à réaliser`
- À utiliser uniquement si ton process repose sur le groupe (et pas seulement la colonne Statut).

---

## 3) IDs de colonnes Monday (important)

Dans Monday:
1. Ouvre ton board.
2. Clique `...` (menu board) -> `Developer`.
3. Lance:
```graphql
query {
  boards(ids: 123456789) {
    columns {
      id
      title
      type
    }
  }
}
```
4. Garde les `id` exacts pour les colonnes ci-dessus.

---

## 4) Test rapide conseillé

1. Mets le scénario B en mode `Run once`.
2. Fais un dépôt test jusqu'au bouton `Transférer`.
3. Vérifie dans Make:
   - webhook B1 reçu
   - module Monday B2 en vert
4. Vérifie dans Monday que l'item passe en `Devis à réaliser` et que les colonnes docs sont remplies.

Si le webhook répond `HTTP 410 - There is no scenario listening for this webhook`, cela veut dire que le scénario Make n'est pas actif.
Dans ce cas, ouvre le scénario et clique `Run once` (test) puis `ON` (activation permanente).

---

## 5) Variables déjà en production (rappel)

- `MAKE_TRANSFER_WEBHOOK_URL`: configurée
- `NEXT_PUBLIC_BASE_URL`: `https://gp-finances.fr`
- `WEBHOOK_SECRET`: configurée

---

## 6) Important - endpoint historique désactivé

`/api/webhook-monday` est désormais **déprécié** et retourne `410`.

Objectif:
- éviter les doublons d'automatisation,
- centraliser l'envoi email sur `/api/monday/webhook`.
