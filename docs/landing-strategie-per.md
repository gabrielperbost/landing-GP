# Landing VSL PER

- Page : https://gp-finances.fr/strategie-per
- Créée le 13 septembre 2026 à partir de la capture fournie : fond blanc, titre centré noir et bleu, cadre vidéo 16:9 et bouton de réservation bleu.
- La page `/per` reste distincte et n'a pas été modifiée.
- Rendez-vous : `https://calendly.com/gabriel-perbost-gp-finances/votre-etude-d-optimisation-fiscale`.

## Ajouter la VSL

La vidéo n'a pas encore été fournie. L'encart utilise le portrait existant de Gabriel et indique « La vidéo arrive bientôt ».

Configuration centralisée : `src/content/perStrategy.ts`.

Définir `video.src` avec l'URL du fichier vidéo, ou configurer `PER_STRATEGY_VIDEO_URL` dans Vercel, puis redéployer. Le lecteur HTML5 avec commandes et lecture intégrée sur mobile remplace automatiquement l'encart. Une affiche peut être définie via `video.poster` ou `PER_STRATEGY_VIDEO_POSTER_URL`.

Le contenu fiscal reste général et conditionnel, sans montant d'économie promis. Référence consultée : https://www.service-public.gouv.fr/particuliers/vosdroits/F36526/0.

## Vérification et publication

- Déploiement : `dpl_2NjbifWy7B8gpoB6q3QmYUmzvErc`.
- Aperçus contrôlés à 1440, 390 et 320 pixels de largeur : cadre 16:9, portrait chargé, bouton accessible au clavier, mentions légales ouvrables, absence de débordement horizontal.
- Le rendez-vous Calendly répond en HTTP 200 ; aucun rendez-vous n'a été réservé pendant les contrôles.
- Le contenu HTML de `/per` est identique avant et après publication.
- Rapports et captures de contrôle : `/private/tmp/gp-per-preview/`.
