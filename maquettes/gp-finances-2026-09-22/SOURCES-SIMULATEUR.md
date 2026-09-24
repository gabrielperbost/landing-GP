# Simulateur PER — maquette locale, 23 septembre 2026

Le moteur est dans `per-calculator.js`, les interactions dans `per-simulator.js`, la vue dans `per-simulator.html` et les styles dans `per-simulator.css`. Aucune donnée saisie ne sort du navigateur ; ni stockage local, ni cookie, ni appel réseau ne sont utilisés par le simulateur.

## Années et sources

Le client teste un nouveau versement **en 2026**, déductible des revenus 2026 déclarés en 2027. Le barème des revenus 2026 n'étant pas encore fixé au moment de la maquette, le moteur utilise **le barème 2026 applicable aux revenus 2025** comme hypothèse de projection. Cette distinction est affichée dans le résultat.

- [Service Public — calcul de l'impôt](https://www.service-public.gouv.fr/particuliers/vosdroits/F34328) : seuils 11 600 / 29 579 / 84 577 / 181 917 €, taux 0 / 11 / 30 / 41 / 45 %, plafond général de 1 807 € par demi-part supplémentaire et décote (897 € pour une imposition individuelle ou 1 483 € en couple, moins 45,25 % de l'impôt brut).
- [Impots.gouv — épargne retraite](https://www.impots.gouv.fr/particulier/epargne-retraite) : plafond annuel individuel pour le revenu global, basé sur 10 % des revenus professionnels N−1 nets de frais, avec plancher de 4 710 € et plafond de 37 680 € pour 2026, avant les réductions applicables.
- [Service Public — définition du RFR](https://www.service-public.gouv.fr/particuliers/vosdroits/F13216) : le RFR et le revenu net imposable sont deux grandeurs distinctes.
- [Impots.gouv — plafond figurant sur l'avis](https://www.impots.gouv.fr/particulier/questions/que-signifie-la-somme-imprimee-dans-la-rubrique-plafond-epargne-retraite-de) : plafond indiqué sur l'avis et caractère individuel. Les parts fiscales ne multiplient pas ce plafond.
- [Service Public — nouvelles règles PER 2026](https://www.service-public.gouv.fr/particuliers/actualites/A18841) : absence de déductibilité des versements à partir de 70 ans. L'allongement des reports n'est pas reconstitué automatiquement dans ce moteur : le montant de l'avis est utilisé.

## Hypothèses explicites

- Le revenu net imposable est proposé en premier. Le RFR 2025 reste une alternative moins précise, utilisée comme approximation du revenu imposable 2026 à revenus constants. Le visiteur choisit la source : la valeur de l’autre champ, masqué, est ignorée. Un revenu prévisionnel 2026 s’entend avant le nouveau versement étudié et après les autres déductions. Le moteur ne déduit jamais le revenu professionnel du RFR.
- Le plafond saisi depuis l'avis peut comprendre les reports. En mode « Estimer », seul le plafond annuel de déduction du revenu global est calculé, après les réductions d'épargne retraite d'entreprise renseignées, sans report ni mutualisation implicites. Le plafond déjà utilisé est retranché du montant choisi. Un plafond restant déjà net doit être saisi avec un montant déjà utilisé de zéro.
- L'impôt avant et après le nouveau versement est calculé par tranches, avec le plafonnement général des parts supplémentaires et la décote. Les deux impôts sont arrondis à l'euro ; leur différence donne l'économie. La TMI tient compte du plafonnement du quotient familial lorsqu'il s'applique.
- Le montant déductible retenu est limité au versement, au plafond restant et au revenu imposable positif. Les versements à partir de 70 ans produisent une déduction nulle.
- Périmètre : France métropolitaine, imposition individuelle ou mariés/pacsés, parts ordinaires. Parent isolé, veuvage, invalidité et demi-parts particulières renvoient à une étude, sans résultat chiffré trompeur.
- Non intégrés : réductions et crédits d'impôt, contributions hauts revenus, revenus exceptionnels/étrangers et mécanismes spéciaux, minimum de recouvrement, calcul professionnel des indépendants (article 154 bis), évolution des règles de 2027. Il ne s'agit ni d'un calcul complet de déclaration ni d'un gain net à vie : la fiscalité à la sortie du PER n'est pas soustraite.

## Vérifications

Exécuter `node --test tests/per-calculator.test.cjs` depuis ce dossier.

Les tests couvrent les exemples officiels (célibataire, couple, enfants et plafonnement), les seuils des cinq tranches, le changement de tranche avec décote, les plafonds consommés/nuls, le plafond annuel salarié, l'absence de plafond déductible du seul RFR, les entrées incomplètes et invalides, le revenu net imposable prioritaire, le zéro explicite, les versements à partir de 70 ans et les bornes des résultats. Les contrôles navigateur sont consignés dans `verification-parcours-per.json` (nouveau parcours du 23 septembre ; `verification-simulateur.json` concerne l’ancienne interface).


## Parcours simplifié

Trois étapes avant le résultat : situation, fiscalité, nouveau versement. Les aides s’ouvrent par clic ou clavier, sur ordinateur comme sur téléphone. Les étapes déjà remplies restent modifiables ; les résultats sont recalculés à partir des nouvelles données. L’interface appelle le moteur fiscal déjà testé.

Le choix « indépendant » affiche le périmètre de déduction du revenu global : le bénéfice professionnel de l’année courante n’est pas substitué aux revenus professionnels N−1. Le calcul de déduction professionnelle (article 154 bis) reste une étude distincte. L’âge est saisi en années révolues, sans collecte de date de naissance. La condition fiscale liée à l’âge est calculée automatiquement : retirer l’ancienne question en deux tranches ne supprime pas la règle fiscale du moteur.

## Projection d’épargne facultative

`per-projection.js` est un moteur indépendant de l’impôt. Le versement envisagé pour 2026 est placé immédiatement après 1 % de frais. Chaque versement annuel suivant intervient en fin d’année, de l’année 1 à l’année N incluse, après 1 % de frais. Une projection sur N années comprend donc le versement initial et N versements annuels suivants ; le détail présente aussi l’année 0.

Le rendement annuel effectif est constant, modifiable de 0 % à +10 %, supposé net de frais annuels de gestion et de supports. Durée : 0 à 60 ans, préremplie d’après l’âge et l’objectif de départ. Un horizon nul affiche seulement le versement initial après frais. Les taux proposés 2 / 4 / 6 % ne sont ni des recommandations, ni des prévisions, ni des profils de risque. La projection n’ajoute aucune économie d’impôt au capital et ne suppose aucune déduction fiscale future, notamment après 70 ans.

Capital = versements bruts − frais sur versements + gain/perte hypothétique. Pas de fiscalité ou prélèvements sociaux à la sortie déduits, ni de correction de l’inflation. L’âge légal exact et la rente ne sont pas calculés : leurs conditions demandent une étude spécifique. Le nombre d’années jusqu’à l’âge de départ envisagé est, lui, calculé automatiquement.

Tests supplémentaires : `node --test tests/per-projection.test.cjs` (frais sur tous les versements, calendrier des versements, formule composée, refus des taux négatifs, horizon nul et bornes).


## Famille et horizon de retraite — 23 septembre 2026

Le module `per-profile.js` calcule les parts ordinaires à partir de la situation familiale, du nombre total d’enfants à charge et du nombre en résidence alternée. Une correction manuelle depuis l’avis est possible ; modifier la famille ou les enfants réactive le calcul automatique. Le plafond PER reste individuel et n’est pas multiplié par ces parts.

À charge exclusive : +0,5 part pour chacun des deux premiers enfants, puis +1 pour chacun des suivants. Pour la charge partagée, les majorations sont divisées par deux, après avoir compté les enfants à charge exclusive. Source : [CGI, article 194](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000033817781). Les parts calculées alimentent le moteur fiscal avec son plafonnement général du quotient familial. Parent isolé, veuvage, invalidité et autres cas spéciaux renvoient toujours à une étude dédiée ; la case « parent isolé » explique le fait de vivre seul avec un enfant à charge. Le formulaire ne prétend pas reproduire tous les cas du CGI.

L’horizon est `max(0, âge de départ envisagé − âge actuel)`. Le départ envisagé vaut 64 ans par défaut, réglable entre 60 et 75 ans. Ce n’est pas une détermination de droits : [Service Public — règles de départ depuis septembre 2026](https://www.service-public.gouv.fr/particuliers/actualites/A18825) précise que l’âge dépend de la génération, avec 64 ans pour les personnes nées à partir de 1969. L’âge seul ne suffit pas à déduire la date exacte de naissance, le nombre de trimestres ou une carrière particulière. Une personne de 22 ans a donc un horizon de 42 ans jusqu’à l’objectif de 64 ans, sans plafonnement silencieux à 40 ans. À 64 ans ou au-delà, l’horizon par défaut est nul et peut être prolongé manuellement.

Les hypothèses de rendement négatif ont été retirées du PER uniquement. Les profils « Prudent / Équilibré / Dynamique » associés visuellement aux boutons 2 / 4 / 6 % sont des repères pédagogiques et non une classification de contrat ou une performance attendue. Chaque bouton dispose d’une aide expliquant l’exposition et les fluctuations. Le risque réel dépend des supports ; les taux personnalisés ne reçoivent pas automatiquement un profil. Références : [AMF — mandat et profils de gestion](https://www.amf-france.org/fr/espace-epargnants/comprendre-les-produits-financiers/supports-dinvestissement/mandat-de-gestion), [AMF — diversification](https://www.amf-france.org/fr/espace-epargnants/savoir-bien-investir/conseils-pratiques/diversifier-ses-placements). La suppression des taux négatifs du curseur ne constitue pas une garantie contre une perte réelle, et les frais de versement restent soustraits.

Tests supplémentaires : `tests/per-profile.test.cjs` (parts, résidence alternée et mixte, cas particuliers, horizon et transmission des parts au calcul fiscal).
