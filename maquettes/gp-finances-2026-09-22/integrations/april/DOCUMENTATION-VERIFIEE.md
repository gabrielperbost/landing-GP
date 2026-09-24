# API APRIL : éléments vérifiés les 23 et 24 septembre 2026

Source : [documentation Borrower dans le portail APRIL](https://ppr-api.april.fr/catalog/api/ac8da2c8-0d90-3c79-9f71-019818661ce4?c=emprunteurs), consultée après connexion et vérification par e-mail. Le Swagger du portail est daté du 17 octobre 2023 et la documentation explicative du 26 mars 2024. Les référentiels vivants et une réponse réelle restent nécessaires pour valider l'intégration.

Mise à jour du 24 septembre : authentification, cinq produits, référentiels `ADPv4` et tarification fictive vérifiés par appels à la préproduction. Voir `VERIFICATION-TARIFICATION.md`. L'intégration au formulaire et les règles de substitution restent à valider.

## Accès et routes

- L'application du compte dispose d'une souscription acceptée à **Borrower 1.0**, plan **Essential**, sécurité OAuth2.
- L'accès au portail et l'accès aux tarifs sont distincts. La documentation indique un **Client ID / Client Secret** avec le flux OAuth2 `client_credentials`, puis un en-tête `Authorization: Bearer …` pour l'API. Le Client ID a été retrouvé dans l'application ; aucun Client Secret n'est exposé dans sa configuration.
- La documentation générale du portail précise que les informations d'accès API sont transmises par l'équipe qui publie l'API. Ne pas remplacer le Client Secret par le mot de passe du portail et ne pas modifier la souscription existante.
- Base de test : `https://ppr-api-gateway.april.fr/borrower/v1/`.
- Jeton de test : `https://ppr-am-gateway.april.fr/apistore/oauth/token`.
- Tarification : **POST `projects/prices?pricingType=Simple&withSchedule=true`**.
- L'en-tête facultatif `x-projectUuid` porte une référence de traçabilité ; le connecteur génère un UUID par appel logique.

La base explicitée par la documentation est retenue : le Swagger exporté utilise un ancien préfixe relatif `/api-store/borrower`, à ne pas concaténer à l'URL ci-dessus.

Les routes de création de projet, documents, envoi de devis et mise en relation ne sont pas exposées par le connecteur. Certains de ces appels peuvent envoyer des e-mails ; ils ne sont pas nécessaires au calcul affiché sur le site.

## Modes de tarification documentés

- `Simple` : les produits précisés dans la requête.
- `Multiple` : les offres et niveaux de garanties de la gamme APRIL ; les garanties éligibles peuvent être ajustées par APRIL.
- `Recommendation` : les offres recommandées en cotisations variables et constantes. Un mode d'équivalence bancaire est documenté avec la banque prêteuse et sans couvertures imposées dans la requête.

Il s'agit du périmètre APRIL disponible au compte, pas d'une comparaison de tout le marché. Le mode Recommendation n'est pas activé dans un formulaire tant que sa requête, les quotités et le traitement des garanties n'ont pas été vérifiés par un appel réel.

## Données pour le futur formulaire

- Date de naissance ; code postal ; situation professionnelle et profession à choisir dans le référentiel du produit.
- Fumeur : le document décrit le tabac au cours des **deux dernières années, cigarettes électroniques comprises**.
- Réponses explicites concernant déplacements professionnels à l'étranger, sports aériens/terrestres, déplacements professionnels de plus de **15 000 km/an**, travail à plus de **15 m**, manutention régulière de charges de plus de **15 kg**. Ne pas présélectionner « non ».
- Banque, projet, prêt, montant, durée en **mois**, taux, date d'effet, quotités et garanties adaptées. Les taux bancaires et d'assurance ne sont pas interchangeables.
- Le coût de l'assurance actuelle sert à la comparaison GP Finances ; il n'est pas un tarif APRIL et ne remplace aucune donnée du prêt.

Le statut tabagique et les risques peuvent être expliqués au moyen des boutons « ? ». La liste exhaustive des professions et la validité des produits doivent être obtenues par les routes de référentiel, sans inventer des codes à partir des intitulés saisis.

## Échéancier et points restant à confirmer

Le Swagger décrit un tableau de tarifs (`TarifGlobal`, `TarifGlobalParPret`, `TarifDetaille`, `EcheancierGlobal`, `EcheancierDetaille`, `Recapitulatif`), des contributions datées, des coûts à un an/huit ans et des messages métier. Il décrit aussi une enveloppe `Response` avec `content` et `messages`. Le test du 24 septembre renvoie directement un tableau de dix lignes : total, quatre détails, échéancier global et quatre échéanciers détaillés. Cette observation d'un cas réussi ne suffit pas à caractériser les erreurs et refus.

Ne pas additionner les lignes de total, détail et échéancier ensemble. Ne pas multiplier une première cotisation variable par la durée. Identifier la période, les frais inclus et les messages d'éligibilité avant de présenter un montant.

Pour la substitution d'un prêt existant, le Swagger comporte `cancellation` (résiliation infra-annuelle) et `surrogate` (mandat de substitution), mais les descriptions « montant emprunté » et « durée du prêt » ne suffisent pas à confirmer le traitement du capital restant dû à la date d'effet. Ce point doit être validé avec APRIL avant de présenter un prix de substitution comme exploitable.

Le Swagger confirme `products` au pluriel, `insured` étant présent dans le schéma hérité. Il donne l'énumération `Variable` / `Constante`, tandis que le flux envoyé par APRIL contient `variable`. La casse réellement acceptée sera vérifiée en préproduction. Le constructeur du premier exemple reste donc une base de test, pas un validateur exhaustif du contrat officiel.
