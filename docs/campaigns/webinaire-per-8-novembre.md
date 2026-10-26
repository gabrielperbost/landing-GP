# Webinaire PER grand public — dimanche 8 novembre 2026

Deuxième session du webinaire PER, en parallèle de celle du 1er novembre (même contenu, même guide PDF offert).

- Date : dimanche 8 novembre 2026, 15h00 à 16h00.
- Titre (à mettre aussi dans Zoom) : **Webinaire PER : payer moins d'impôts et préparer sa retraite**
- Page d'inscription (à mettre dans les publicités Meta) : `https://gp-finances.fr/webinaire-per-8-novembre?utm_source=meta&utm_campaign=webinaire-per-8-novembre`
- Inscriptions : **Google Sheet dédié « Webianire du 08/11/2026 »** (onglet « Feuille 1 »), avec son propre Apps Script. Le Sheet du 1er novembre et son script ne sont pas touchés.
- Variables Vercel : `WEBINAR_PER_8NOV_GOOGLE_APPS_SCRIPT_URL` et `WEBINAR_PER_8NOV_GOOGLE_APPS_SCRIPT_SECRET`. Sans elles, le formulaire du 8 novembre refuse les inscriptions (« réessayez plus tard ») au lieu de les mélanger avec le 1er novembre.
- Colonne « Source » : commence par `webinaire-per-8nov` (contre `webinaire-per` pour le 1er novembre).
- Rappels aux inscrits : J-3 (5 nov.), J-2 (6 nov.), la veille (7 nov., e-mail + SMS), le matin (8 nov., e-mail + SMS), 1 heure avant (8 nov. à 14h).
- Replay : `/api/webinar-per/replay/run?secret=...&session=2026-11-08&replayUrl=...` (ajouter `&dryRun=1` pour compter sans envoyer).
- Lien Zoom : `WEBINAR_PER_8NOV_MEETING_URL` (Vercel) ou valeur par défaut dans `src/lib/webinarPerConfig.ts`. Lien actuel : https://us06web.zoom.us/j/87575702326?pwd=3zNcYVD9JpMHdDchuM5Jq7A8Zf2E0b.1

## Apps Script du Sheet du 8 novembre

Déployé le 26 octobre 2026 (Application Web, exécuté en tant que Gabriel, accès « Tout le monde »). Même structure de colonnes que le Sheet du 1er novembre, plus une colonne « Replay » (17e). Le secret n'est pas versionné : il est dans le script et dans la variable Vercel.
