# Test APRIL du 24 septembre 2026

Test serveur effectué uniquement en **préproduction**, avec des données fictives. Ce résultat confirme l'accès technique à la tarification ; ce n'est pas un devis client et le formulaire HTML ne l'utilise pas encore.

## Accès et référentiels

- OAuth2 `client_credentials` : réussi.
- Produits reçus : `ADPEquilibre`, `ADPEssentiel`, `ADPHorizon`, `ADPIntegral`, `ADPv4`.
- Catégories professionnelles, professions, garanties, commissions et projets : récupérés pour `ADPv4`.
- `ADPGenerali`, présent dans l'ancien exemple, absent de cette liste ; son référentiel de catégories professionnelles a renvoyé HTTP 412. Ne pas utiliser cet exemple inchangé pour le futur formulaire.

## Cas fictif envoyé

- Un assuré né le 1er janvier 1985, non-fumeur, cadre / agent commercial ; réponses explicites négatives aux indicateurs de risque du test.
- Résidence principale, code postal 38000, date d'effet au 1er octobre 2026.
- Un prêt classique de 250 000 €, sur 240 mois, au taux bancaire de 1,9 %.
- APRIL Assurance de Prêt Optimum + (`ADPv4`), cotisations `Variable`, commission `4010` (présente dans le référentiel).
- Quotité 100 % : Décès, PTIA, ITT avec franchise 90 jours / ConfortPlus, IPT en capital / ConfortPlus.
- Aucun nom, e-mail, téléphone ou autre dossier client réel envoyé.

Appel : `POST projects/prices?pricingType=Simple&withSchedule=true` avec le connecteur `client.cjs`.

## Résultat reçu

| Donnée de la réponse | Valeur |
| --- | --- |
| Total `TarifGlobal` | 6 827,77 € |
| Coût indiqué pour la première année | 489,47 € |
| Coût indiqué à huit ans | 3 826,23 € |
| TAEA renvoyé | 0,26 % |
| Total de l'échéancier global | 6 827,77 € |
| Écart entre total et somme de l'échéancier | 0,00 € |

La réponse est un tableau de dix lignes, sans message métier sur ce cas. L'échéancier global comporte 21 périodes, dont les première et dernière sont partielles, avec `contributionSchedule: Annuelle`. Ces périodes ne sont pas des mensualités ; ne pas présenter le premier montant comme un tarif mensuel fixe et ne pas additionner les lignes détaillées au total global.

## Suite de l'intégration

Les requêtes et réponses de référence sont conservées dans le répertoire de travail privé, avec les référentiels. Le secret est exclusivement dans le fichier privé d'accès, avec permissions `600`, hors de la racine servie, hors Git et hors ZIP. Aucun jeton n'est enregistré.

Il reste à adapter le constructeur au produit retenu, valider les frais inclus, les exigences bancaires et le traitement d'un prêt en cours, puis gérer les refus et demandes d'étude avant de raccorder le formulaire. Ce test ne valide pas une équivalence bancaire et ne constitue pas une comparaison de tout le marché. Les accès de production ne sont pas testés.

Aucun projet créé, aucun devis envoyé, aucune souscription et aucune publication du site.
