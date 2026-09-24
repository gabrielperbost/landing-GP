# Simulateur court d’assurance emprunteur

Créé le 23 septembre 2026, dans la maquette locale. Aucune publication.

Objectif précisé ensuite par Gabriel : obtenir automatiquement un nouveau tarif à partir du profil du client, puis le comparer au contrat actuel. Le modèle de baisse ci-dessous est donc provisoire. La documentation officielle APRIL, le Swagger et la souscription du compte ont été vérifiés le 23 septembre 2026. Le constructeur du premier flux et le connecteur serveur sont dans `integrations/april/`. Le 24 septembre, l'authentification, les référentiels et un premier tarif avec échéancier ont été obtenus en préproduction sur un dossier fictif. Le raccordement du formulaire, l'adaptation du constructeur, le traitement des frais et la substitution d'un prêt en cours restent à finaliser. Voir `integrations/april/VERIFICATION-TARIFICATION.md`.

## Ce que le calcul fait

La page `assurance-emprunteur.html#simuler-assurance` contient une comparaison de coûts sur la durée restante du prêt. Il ne s’agit pas d’un moteur de tarification d’assureur.

Trois réglages visibles : coût de l’assurance actuelle, durée restante, hypothèse libre de baisse. L’exemple initial est de 60 €/mois, 15 ans et 30 % de baisse, soit 3 240 € sur la période, sans frais supplémentaires. Ce pourcentage est une hypothèse pédagogique, pas une statistique du marché ou une économie annoncée par GP Finances. Les boutons 20 / 30 / 50 % sont également des scénarios, pas des tarifs.

Le mode devis utilise le montant saisi du nouveau contrat. L’option « coûts totaux restants » permet d’utiliser les échéanciers lorsque les cotisations évoluent au cours du temps. Elle ne multiplie pas les coûts totaux par la durée. Elle demande deux montants couvrant la même période, à partir de la même date, pour les mêmes personnes et quotités. L’outil ne vérifie pas lui-même cette correspondance ni l’équivalence des garanties.

## Calcul

- Durée en mois = années restantes × 12 + mois supplémentaires, de 1 à 420 mois.
- En mode mensuel, cotisations supposées constantes : coût restant = cotisation × durée.
- En mode hypothèse, nouveau coût = coût actuel × (1 − baisse choisie / 100).
- En mode devis, nouveau coût = montant fourni par l’utilisateur (mensuel ou total).
- Économie nette = coût actuel restant − nouveau coût restant − frais supplémentaires.
- Équivalent mensuel = économie nette / durée restante, frais compris ; ce n’est pas une échéance contractuelle.
- Calcul monétaire en centimes. En mode mensuel, la cotisation hypothétique est arrondie au centime avant multiplication par le nombre de mois.
- Les frais déjà inclus dans un coût ne doivent pas être saisis une seconde fois.
- Un résultat négatif est affiché comme un surcoût, sans être ramené à zéro.
- Aucune actualisation financière, évolution de prime, taxe ou commission non renseignée n’est inventée. Pas de récupération de données de santé ou de devis sur un site tiers.

## Pourquoi ces données suffisent pour ce premier outil

Les sources publiques permettent de documenter les modalités de comparaison, mais ne fournissent pas de grille universelle correspondant à chaque profil. L’âge, le prêt, les garanties et les autres critères du dossier influencent une proposition d’assurance. Le moteur privé d’un comparateur et les accès à ses partenaires ne sont pas nécessairement disponibles dans son code visible.

Pour passer à un devis personnalisé, raccorder un accès de tarification autorisé fourni par un partenaire (documentation API, identifiants côté serveur, produits et critères requis), ou intégrer des grilles tarifaires expressément autorisées et à jour avec toutes leurs conditions. Ne pas afficher les scénarios de baisse comme des offres d’assureurs.

## Références publiques consultées

- [ABE Infoservice — assurance emprunteur](https://www.abe-infoservice.fr/fr/assurance/assurance-emprunteur/que-faut-il-savoir-sur-lassurance-emprunteur) : capital initial ou restant dû ; cotisations potentiellement variables ; importance du coût sur la durée comparée et de la couverture.
- [Ministère de l’Économie — changement d’assurance](https://www.economie.gouv.fr/particuliers/emprunter-et-sassurer/achat-immobilier-pouvez-vous-changer-dassurance-emprunteur) : garanties minimales requises par le prêteur et substitution.
- [Service Public — obtenir une assurance emprunteur](https://www.service-public.gouv.fr/particuliers/vosdroits/F1671) : estimation selon les caractéristiques du prêt, l’âge et les garanties envisagées.

Ces pages étayent les règles de comparaison, pas les pourcentages pédagogiques.

## Réutilisation

`insurance-calculator.js` expose `calculate(input)` en CommonJS et `GPInsuranceCalculator` dans le navigateur. Fonction pure, indépendante du DOM. Résultat `{valid:false,errors}` ou valeurs calculées en euros.

```js
calculate({
  basis: 'monthly', // ou 'total'
  mode: 'scenario', // ou 'quote'
  years: 15, months: 0,
  currentCost: 60,
  reduction: 30, // utilisé seulement dans le mode scenario
  quoteCost: '', // requis seulement dans le mode quote
  fees: 0,
});
```

Le fragment `insurance-simulator.html`, les styles `insurance-simulator.css` et l’interface `insurance-simulator.js` se montent avec `GPInsuranceSimulator.mount(root, {calculator, onContact})`. L’instance expose `getResult()` et `destroy()`. Le montage est idempotent. Une instance par page est prévue à cause des identifiants accessibles. Le module est importable côté serveur sans accéder au DOM. Le hook `onContact({project})` transmet uniquement le sujet « Assurance emprunteur », aucune valeur financière. Sans hook, la maquette ouvre le formulaire de rappel de démonstration existant.

Le calcul ne transmet et ne conserve aucune donnée. Aucun service tiers ou taux distant n’est appelé. Après modification du fragment, exécuter `node generer.cjs`. Pour le moteur : `node --test tests/insurance-calculator.test.cjs`.
