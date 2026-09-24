# Avis Google et éléments de confiance

Ajout du 24 septembre 2026, uniquement dans la maquette privée.

## Source des avis

Fiche Google : **Gabriel PERBOST - GP FINANCES - Courtage en prêts & assurances**. L’identité a été recoupée avec le site `gp-finances.fr` et le téléphone `06 51 22 42 13` affichés sur cette fiche. Son adresse Google est 24 rue du Gouverneur Général Éboué, Issy-les-Moulineaux ; elle n’a pas servi à modifier les mentions du siège social.

Le lien exact est conservé dans `avis-google.json`, champ `profileUrl`.

- Note affichée lors du relevé : **5/5, 15 avis**.
- Cinq commentaires : julien menier, Johanna Djian, Duarte Joao, Didier DORVILLE et Edouard Ballout.
- Textes reproduits à l’identique. Les passages abrégés de Johanna et Didier portent la mention « Extrait de l’avis ». Chaque carte donne accès à Google pour consulter les avis à la source.
- Google indiquait « il y a une semaine » ou « il y a 2 semaines » lors du relevé du 24 septembre : seul le mois de septembre 2026 est affiché. La date de visite, parfois ancienne, n’a pas été confondue avec celle de publication.
- La vérification concerne la source publique et la fidélité de la transcription ; aucun badge « achat vérifié » ou autre certification de Google n’est ajouté.
- Les exemples graphiques envoyés par Gabriel n’ont fourni aucun nom, commentaire, nombre de clients ou score au site.

## Affichage et comportement

- Note Google près du premier appel à l’action sur les sept pages. Les portraits issus des vidéos ont été retirés de ce badge : seules les photos Google renseignées dans `featuredReviewers` peuvent désormais y apparaître.
- Repères chiffrés dès l’accueil, repris de `chiffres.json` et du site existant, avec un lien vers l’annuaire professionnel CNCEF pour identifier le cabinet (ORIAS 23003789).
- Carrousel : trois cartes sur grand écran, deux sur tablette, une carte et un aperçu de la suivante sur téléphone. Les textes restent présents dans le HTML, y compris sans JavaScript.
- Défilement toutes les 6,5 secondes, uniquement lorsque le bloc est visible. Pause au survol et au focus ; navigation manuelle, toucher ou ouverture d’un commentaire long arrêtent le défilement. Bouton pause/reprise, flèches et navigation clavier disponibles.
- Pas de défilement automatique si l’utilisateur demande des animations réduites. Aucun défilement pendant l’ouverture d’une vidéo ou d’une fenêtre de contact.
- Les images des portraits sont locales. Aucun widget Google, traceur ou requête vers Google n’est chargé au simple affichage de la page. Les liens ouvrent Google après un clic.

## Mise à jour et future publication

Le bandeau utilise un **relevé statique**, pas une synchronisation automatique Google. Pour actualiser les avis et la note, modifier ensemble `rating`, `reviewCount`, `verifiedAt` et `reviews` dans `avis-google.json`, puis lancer :

```sh
node generer.cjs
```

Chaque avis conserve son auteur, sa note, le texte, son éventuel statut d’extrait, son mois/date de publication et sa source. Ne pas déduire la note globale de la seule sélection affichée. Si les données Google ne sont pas renseignées, le composant ne fabrique ni note ni avis et revient aux témoignages vidéo existants sur l’accueil.

Les données, le rendu (`social-proof.cjs`), les styles (`social-proof.css`) et les interactions (`reviews-carousel.js`) sont séparés pour leur reprise dans le futur site. Lors du portage React, monter les écouteurs/observateurs dans un effet et les nettoyer au démontage. Une éventuelle synchronisation via un service Google autorisé est une étape distincte : elle nécessite son propre raccordement côté serveur. Ne pas placer de clé privée dans les pages.

La maquette n’est pas déployée ; le site Next.js public reste inchangé.

## Ajustements demandés le 24 septembre

- Espacement de la section réduit à 48 px en haut et en bas sur ordinateur, 34 px sur mobile ; titre, texte, commandes et pied du carrousel rapprochés.
- Le bouton de reprise relance maintenant le défilement même quand le pointeur et le focus restent sur ce bouton. Le survol des commentaires et les préférences de réduction des animations restent respectés.
- La récupération des dix avis supplémentaires et des photos de William Scheerer, Maud Poncet, Jonathan Larfouillut (Bismuth04) et Mathieu Jaeger reste en attente. Maps a présenté une vue limitée sans connexion, puis Google Search a demandé une vérification anti-robot. Les cinq avis déjà relevés restent affichés, sans ajout de texte ou de photo inventés.
- `featuredReviewers` attend des entrées `{ "name": "…", "photo": "assets/google-reviews/nom.jpg", "profileUrl": "https://www.google.com/maps/contrib/…" }`. Les fichiers doivent provenir des profils Google identifiés ; aucune photo vidéo n’est utilisée en secours.
- Une fois les sources obtenues, compléter `reviews` avec les autres avis et `featuredReviewers` avec les quatre profils demandés, puis relancer `node generer.cjs`. Le carrousel prend déjà en charge un nombre variable d’avis.
