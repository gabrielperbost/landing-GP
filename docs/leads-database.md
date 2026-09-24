# Base De Donnees Leads

Chaque demande de rappel valide est enregistree automatiquement dans:

- `data/leads.csv`

Colonnes:

- `submitted_at`: date ISO de reception
- `full_name`
- `phone`
- `email`
- `source`
- `status`: `sent`, `mocked`, `error`
- `detail`: detail technique (smtp, erreur, etc.)

## Utilisation Excel

1. Ouvrir `data/leads.csv` directement dans Excel.
2. Pour actualiser: fermer/reouvrir le fichier ou utiliser l'actualisation des donnees.

## Export HTTP

Endpoint:

- `GET /api/leads/export`

Telecharge le CSV a jour.

Option de securite:

- definir `LEADS_EXPORT_SECRET` dans l'environnement
- puis appeler `GET /api/leads/export?secret=...`
  ou envoyer l'en-tete `x-leads-secret`.
