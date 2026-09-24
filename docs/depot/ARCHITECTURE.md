# GP Finances – Architecture complète

## Stack
- **Front-end / Back-end** : Next.js 14 (App Router) + TypeScript
- **Base de données** : Supabase (Postgres)
- **Stockage fichiers** : Supabase Storage
- **Emails** : SMTP (Nodemailer)
- **Automatisation** : Make (ex-Integromat)
- **CRM** : Monday.com
- **Hébergement** : Vercel

## Flux complet

```
Monday (dossier -> "Attente de documents")
  └─► POST /api/monday/webhook?secret=... (webhook natif)
        └─► Supabase (création/réutilisation session + token)
        └─► SMTP (envoi email avec lien espace client)
              └─► Client ouvre https://gp-finances.fr/espace-client/portail?firstLogin=1&token=XXX
                    └─► Portail client -> création accès + dépôt documents
                    └─► Client uploade fichiers -> Supabase Storage
                    └─► Client clique "Transférer"
                          └─► POST /api/transfer
                                └─► Mise à jour Supabase
                                └─► SMTP (notif GP Finances)
                                └─► Make webhook -> Monday "Devis à réaliser"
```

## Tables Supabase

### `sessions`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | PK |
| token | text | Token unique URL-safe |
| monday_item_id | text | ID de l'item Monday |
| client_name | text | Nom du client |
| client_email | text | Email du client |
| bank | text | Banque sélectionnée |
| status | text | pending / uploaded / transferred |
| offre_url | text | URL Supabase Storage |
| tableau_url | text | URL Supabase Storage |
| identite_url | text | URL Supabase Storage (optionnel) |
| token_expires_at | timestamptz | Expiration du lien (30 jours) |
| uploaded_at | timestamptz | Date de dépôt |
| created_at | timestamptz | Date de création |

## Variables d'environnement (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=
MAKE_TRANSFER_WEBHOOK_URL=
WEBHOOK_SECRET=
NEXT_PUBLIC_BASE_URL=https://gp-finances.fr
GP_FINANCES_EMAIL=gabriel@gpfinances.fr
```
