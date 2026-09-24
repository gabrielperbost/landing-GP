# Réutiliser la maquette dans le futur site

Mise à jour : 24 septembre 2026. Aucun déploiement effectué.

Les sept pages HTML, leurs ressources et les interactions sont exécutables dans un dossier local ou sous un chemin HTTP. Les chemins de ressources sont relatifs ; aucun chemin du Mac n’est utilisé dans le code livré au navigateur.

## Sources à modifier

- `generer.cjs` : en-tête, navigation, pages métiers, témoignages, pied de page, fenêtres de contact. Les variantes de témoignages sont distinctes pour l’accueil, l’assurance emprunteur et le PER.
- `styles.css` et `app.js` : présentation commune et interactions.
- `avis-google.json` : avis, extraits, note et nombre d’avis relevés sur la vraie fiche Google. `social-proof.cjs` génère les blocs communs, `social-proof.css` les présente et `reviews-carousel.js` gère le défilement. Voir `AVIS-GOOGLE.md` pour leur mise à jour et la future intégration.
- `per-simulator.html` / `.css` / `.js` : parcours PER en trois étapes, aides, validation et résultat.
- `per-calculator.js` : impôt et plafond, fonctions pures indépendantes de l’interface.
- `per-profile.js` : âge, horizon de retraite choisi et parts fiscales ordinaires, sans dépendance à l’interface.
- `per-projection.js` : capital optionnel avec versements annuels en fin d’année et frais de versement de 1 %. Aucune fiscalité future n’est incorporée au capital.
- `life-calculator.js` : moteur distinct de la projection Assurance-Vie avec versements mensuels.
- `insurance-calculator.js` et `insurance-simulator.html` / `.css` / `.js` : estimation courte de l’économie sur l’assurance emprunteur, à partir d’une hypothèse explicite ou d’un devis renseigné. Voir `SIMULATEUR-ASSURANCE.md` pour le calcul et l’API `mount` / `destroy`.
- `integrations/april/` : constructeur du flux fourni et connecteur serveur OAuth2 / tarification. Authentification, référentiels et premier tarif fictif vérifiés en préproduction le 24 septembre. Le constructeur de l'ancien exemple doit être adapté ; le formulaire n'est pas encore raccordé. Ces fichiers ne sont pas chargés par les pages HTML et ne contiennent aucun secret. Voir `integrations/april/VERIFICATION-TARIFICATION.md`.
- `assets/` : images et polices locales.

Après une modification d’un fragment HTML ou du générateur :

```sh
node generer.cjs
node --test tests/per-calculator.test.cjs tests/per-projection.test.cjs tests/per-profile.test.cjs tests/life-calculator.test.cjs tests/insurance-calculator.test.cjs
```

Ne pas modifier seulement `per.html` : il est régénéré depuis les sources ci-dessus.

## Intégration PER dans React / Next.js

Les quatre modules PER exposent une API CommonJS pour les bundlers et une API navigateur pour l’aperçu statique. Le module d’interface est importable sans accéder au DOM sur le serveur. Son montage doit être exécuté côté client, après affichage du fragment HTML.

```js
const calculator = require('./per-calculator.js');
const projection = require('./per-projection.js');
const profile = require('./per-profile.js');
const simulator = require('./per-simulator.js');

// À l’intérieur d’un useEffect, une fois le fragment rendu :
const instance = simulator.mount(rootElement, {
  calculator,
  projection,
  profile,
  onContact: ({ project }) => openYourContactForm(project),
});

// Nettoyage de l’effet lors du démontage :
return () => instance.destroy();
```

`rootElement` est le conteneur `[data-per-simulator]` du fragment. Le montage est idempotent, les événements restent dans ce conteneur et `destroy()` retire tous ses écouteurs. Une seule instance du fragment par page est prévue car ses identifiants servent aux labels et aides accessibles. Le formulaire ne transmet aucune donnée. `onContact` transmet uniquement le nom du projet, pas les données fiscales.

Le fragment peut être porté en JSX en conservant les `name`, `id` et attributs `data-per-*`. Les fichiers CSS peuvent être repris dans les styles de la route ; les styles du parcours sont limités à leurs classes `per-*`. Les moteurs de calcul ne dépendent ni de React ni de la structure HTML.

## Pour la mise en ligne ultérieure

Le raccordement aux formulaires réels et le choix des routes Next.js restent à faire lors de l’intégration. Aujourd’hui le formulaire de rappel est une démonstration : son message ne constitue pas un envoi réel. Les liens Calendly PER et les vidéos restent les liens existants.

Conserver les routes et services actuels tant que leur remplacement n’a pas été décidé : inscriptions, désinscriptions, replay et téléchargement ne doivent pas être écrasés par cette maquette. Préserver leurs traitements côté serveur et leur référencement lorsque les nouvelles pages sont intégrées.

Les pages portent volontairement `noindex,nofollow`, « Aperçu privé » et « Maquette ». Ces mentions et les métadonnées SEO doivent être adaptées au moment de préparer la version publique. Le dossier `maquettes` reste exclu du déploiement Vercel actuel.

Les règles fiscales sont isolées dans `per-calculator.js` et leurs hypothèses documentées dans `SOURCES-SIMULATEUR.md`. Vérifier les années, plafonds et barèmes au moment de l’intégration. Les taux de projection sont des hypothèses, pas des performances annoncées.

## Vérifications enregistrées

- `verification-parcours-per.json` : étapes, aides, erreurs, changements de données, projection facultative, démontage/remontage, affichage sur six largeurs ordre des témoignages, parts automatiques, résidence alternée, durée liée à l’âge et aides des profils de risque.
- Tests des moteurs : `tests/per-calculator.test.cjs`, `tests/per-projection.test.cjs`, `tests/life-calculator.test.cjs`.
- Aperçus : `apercu-simulateur-*`, `apercu-per-fiscalite-*`, `apercu-resultat-per-*`, `apercu-temoignages-*`.
- Assurance emprunteur : `verification-simulateur-assurance.json`, `tests/insurance-calculator.test.cjs` et `apercu-simulateur-assurance-*`.

- Preuve sociale : `verification-preuve-sociale.json`, 52 contrôles réussis (sept pages à six largeurs, défilement, pause, clavier, réduction des animations, vidéos et ordre des témoignages PER). Aperçus : `apercu-confiance-accueil.png`, `apercu-confiance-mobile.png`, `apercu-avis-google-desktop.png`, `apercu-avis-google-mobile.png`.

- Ajustements suivants : `verification-ajustements-avis.json`, 29 contrôles réussis sur les espacements, la suppression des portraits vidéo dans le badge Google et la reprise du défilement avec focus/pointeur sur le bouton. Récupération des photos Google et dix avis supplémentaires en attente ; voir `AVIS-GOOGLE.md`.
