# GP FINANCES — Maquette HTML privée

Ouvrir `index.html` dans Safari, Chrome ou Firefox. La navigation donne accès aux six pages métiers. Aucune installation n’est nécessaire.

Cette maquette du 22 septembre 2026 n’est pas publiée. Le dossier `maquettes` est exclu des déploiements Vercel et les pages portent la directive `noindex,nofollow`.

## Ce qui peut être testé

- Note Google dès l’arrivée et carrousel de cinq avis/commentaires réels sur les sept pages. Espacement resserré ; portraits vidéo retirés du badge Google. La récupération des dix avis supplémentaires et des quatre photos Google demandées reste en attente (voir `AVIS-GOOGLE.md`). Source : fiche Google GP Finances, 5/5 pour 15 avis relevés le 24 septembre 2026. Voir `AVIS-GOOGLE.md`.
- Accueil complet : portrait de Gabriel, six expertises, chiffres, méthode, comparatif Assurance / PER, témoignages, présentation, conseils et rendez-vous.
- Pages Assurance emprunteur, PER, Assurance-Vie, Prévoyance, Mutuelle et Regroupement de crédits.
- Menu mobile, navigation entre les pages, comparatif à onglets, FAQ et fenêtres de contact.
- Page Assurance emprunteur : **estimation par formulaire** (profil, prêt restant dû, réponses de risque) qui affiche les trois solutions les plus avantageuses (Solution 1, 2, 3), sans nom d'assureur. Le calcul passe par la route serveur du site : lancer `npx next dev -p 3111` à la racine du projet avec les variables `APRIL_CLIENT_ID` / `APRIL_CLIENT_SECRET` (préproduction), puis ouvrir la page ; sans le serveur, le formulaire affiche « appelez-moi ». Voir `integrations/april/README.md`. L'ancien simulateur à hypothèse de baisse est conservé dans `legacy-simulateur-hypothese/`.
- Page PER : parcours guidé en trois étapes (situation, fiscalité, versement), aides « ? », résultat en graphique ou tableau, projection de capital facultative dont la durée est préremplie à partir de l’âge. Les informations techniques sont accessibles à la demande. Voir `SOURCES-SIMULATEUR.md` pour les hypothèses et les tests. Le calcul reste entièrement local.
- Page Assurance-Vie : projection de capital de 1 à 40 ans, versements réglables, frais de versement fixes de 1 %, rendement hypothétique modifiable, courbe et détail annuel. Voir `SIMULATEUR-PERFORMANCE.md`.
- Le formulaire de rappel fonctionne uniquement en démonstration : il n’envoie et ne conserve aucune donnée.
- La prise de rendez-vous PER ouvre le lien Calendly existant, seulement après un clic explicite. L’assurance emprunteur, l’assurance-vie, la prévoyance, la mutuelle et le regroupement de crédits ouvrent le formulaire de rappel de démonstration avec le projet présélectionné.
- Les vidéos et le guide ouvrent les contenus existants. Leur lecture nécessite une connexion Internet.

Les images et les polices sont dans `assets` : la mise en page fonctionne sans accès Internet. Aucun outil publicitaire, analyse de trafic, Brevo ou CRM n’est chargé par cet aperçu.

## Direction artistique et contenus réutilisés

Analyse des versions publiques de https://gp-finances.fr et https://gp-finances.fr/per le 22 septembre 2026, complétée par les quatre captures fournies.

- Bleu marine `#0d1f3c`, doré `#c9a84c`, fond crème `#fafaf7`, blancs et fonds bleutés.
- Typographies Playfair Display et DM Sans de la page PER.
- Portrait existant de Gabriel Perbost, témoignages vidéo existants, coordonnées et identité du cabinet.
- Compteur de 3 058 072 €, 51 assureurs partenaires et prise en charge des démarches : valeurs reprises du site actuel, figées pour la maquette.
- Cas assurance : 32 710 € avant / 11 510 € après / 21 200 € d’économie, déjà présenté sur le site.
- Illustration PER : 13 000 € de versement × TMI 30 % = 3 900 € d’économie fiscale potentielle à l’entrée, sous hypothèse d’un plafond suffisant. L’effort net est illustré à 9 100 € ; ce n’est ni une valeur de contrat ni un rendement garanti.
- Aucun avis, client ou résultat chiffré supplémentaire inventé pour les trois nouvelles activités.
- Carte vidéo des conseils : « PER : 5 erreurs à éviter absolument », lien fourni par Gabriel https://www.youtube.com/watch?v=CNFS4tn5538 ; miniature officielle YouTube conservée localement dans `assets/per-5-erreurs.jpg`.

Références de contrôle des formulations générales : [assurance emprunteur — Service Public](https://www.service-public.gouv.fr/particuliers/vosdroits/F1671) et [fonctionnement du PER — ministère de l’Économie](https://www.economie.gouv.fr/particuliers/gerer-mon-argent/gerer-mon-budget-et-mon-epargne/comment-fonctionne-le-plan-depargne-retraite-individuel).

La page Assurance-Vie reprend les repères généraux de [Service Public — fonctionnement du contrat](https://www.service-public.gouv.fr/particuliers/vosdroits/F15274), consulté le 22 septembre 2026 : supports, retraits, frais et clause bénéficiaire. Les taux modifiables du simulateur sont des hypothèses, sans garantie de rendement.

## Organisation des fichiers

- `index.html` : accueil.
- `assurance-emprunteur.html`, `per.html`, `assurance-vie.html`, `prevoyance.html`, `mutuelle.html`, `regroupement-credits.html` : pages métiers.
- `styles.css` : palette, typographies, composants et adaptations mobiles.
- `app.js` : interactions locales, comparatif et formulaires de démonstration.
- `chiffres.json` : chiffres clés modifiables.
- `generer.cjs` : composants réutilisés pour générer les sept pages. Après modification des chiffres ou des contenus, exécuter `node generer.cjs` dans ce dossier.

Il s’agit de la phase visuelle en HTML demandée avant publication. Le site Next.js actuel, ses routes, son SEO et ses formulaires n’ont pas été remplacés. L’intégration React/Tailwind et le raccordement des nouvelles activités restent une étape ultérieure.

## Derniers ajustements — 24 septembre 2026

- Assurance emprunteur : quatre témoignages, l’homme, Dorothée, Johanna et John. Les vidéos emprunteur utilisent leurs fichiers `Tem1`, `Tem2`, `Tem4` et `Tem5` respectifs.
- PER : Anaëlle puis Dorothée, sans la mention « Plan Épargne Retraite » sur leurs cartes.
- Parcours PER simplifié et projection facultative avec hypothèse de 1 % de frais sur chaque versement.
- Guide de réutilisation et de future intégration : `INTEGRATION.md`.

Le PER prend maintenant en compte le nombre d’enfants et la résidence alternée pour les parts fiscales. Le départ envisagé est fixé à 64 ans par défaut et ajustable ; les taux de projection vont de 0 à 10 %, avec une aide pour chacun des scénarios 2 / 4 / 6 %. L’ancien choix « avant / après 70 ans » a été remplacé par l’âge actuel.
