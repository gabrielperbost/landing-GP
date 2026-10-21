# Sauvegardes GPF

Chaque lundi matin, le serveur envoie à l'adresse du cabinet (`GP_FINANCES_EMAIL`)
un e-mail « Sauvegarde GPF du … » avec un fichier `.gpfbak` en pièce jointe.

- Contenu : toutes les tables du CRM (clients, dossiers, documents — la liste,
  pas les fichiers eux-mêmes —, historique, journal, commissions…).
- Le fichier est compressé puis chiffré (AES-256-GCM). Sans la clé de
  sauvegarde, il est illisible : il peut donc être conservé dans la boîte mail.
- La clé est la variable `GPF_BACKUP_KEY` (Vercel). Une copie doit être rangée
  dans le gestionnaire de mots de passe (app Mots de passe du Mac).
- Les fichiers déposés (CNI, offres de prêt…) restent dans Supabase Storage et
  ne sont pas inclus dans l'e-mail.

## Ouvrir une sauvegarde

```bash
GPF_BACKUP_KEY=<la clé> node scripts/gpf-decrypt-backup.mjs gpf-sauvegarde-AAAA-MM-JJ.gpfbak > sauvegarde.json
```

`sauvegarde.json` contient `tables.<nom_de_table>` : la liste complète des
lignes, prête à être réimportée dans Supabase en cas d'incident.

## Lancer une sauvegarde à la main

Appeler `/api/gpf/cron/backup` avec l'en-tête `Authorization: Bearer <CRON_SECRET>`.
