# Préparation du raccordement APRIL

État au 24 septembre 2026 : **authentification de préproduction réussie et premier tarif APRIL reçu sur un dossier fictif**, avec le connecteur serveur `client.cjs`. Cinq produits et les référentiels d'Optimum + ont été récupérés. Le détail du test figure dans `VERIFICATION-TARIFICATION.md`. Les accès sont conservés uniquement dans la configuration privée, hors de la maquette. Aucune publication. Les pages HTML ne chargent pas ces fichiers. Le simulateur visible conserve pour l'instant son fonctionnement précédent ; le formulaire n'est pas encore raccordé à APRIL.

Voir `DOCUMENTATION-VERIFIEE.md` pour les routes, l'authentification, les seuils des questions de risque et les points à confirmer. Les identifiants personnels, fichiers d'accès et exports complets du portail ne font pas partie de la maquette.

## Connecteur côté serveur

`client.cjs` expose `createAprilClient({clientId, clientSecret, environment})` :

- OAuth2 `client_credentials`, jeton en mémoire avec renouvellement ; préproduction par défaut ;
- `getProducts()`, `getBanks()`, `getProductReference(productCode, reference)` ;
- `price(project, {pricingType:'Simple'})`, avec `withSchedule=true` ; les modes `Multiple` et `Recommendation` sont aussi autorisés explicitement ;
- délais limités, erreurs techniques sans corps confidentiels, aucun tarif de remplacement ;
- aucune méthode de création de projet, d'édition/envoi de devis ou de mise en relation.

Les réponses restent des données serveur brutes. Ne pas les renvoyer telles quelles au navigateur : la validation des messages métier et la conversion des tarifs vers le résultat client restent à implémenter à partir de la réponse réelle obtenue. Ce connecteur n'est pas une route HTTP publique et n'active pas à lui seul le formulaire.

Les identifiants proviennent de variables d'environnement privées `APRIL_CLIENT_ID` / `APRIL_CLIENT_SECRET`. Ne pas utiliser de variable `NEXT_PUBLIC_*`. Le mot de passe du portail n'est pas le secret OAuth2.

Le diagnostic peut aussi lire un fichier JSON privé via `APRIL_CREDENTIALS_FILE`, avec les champs `clientId` et `clientSecret`. Conserver ce fichier **hors de la racine servie par HTTP, hors Git et hors ZIP**, avec des droits limités au propriétaire. Le Client ID retrouvé est conservé dans la configuration de travail privée du projet ; aucun mot de passe de portail n'a été enregistré dans les sources.

```sh
# Depuis la racine du projet, une fois le secret ajouté au fichier privé :
APRIL_CREDENTIALS_FILE=.codex-work/gp-finances-april/credentials.local.json node maquettes/gp-finances-2026-09-22/integrations/april/check-connection.cjs
```

Le diagnostic appelle uniquement le référentiel des produits en préproduction. Il affiche un état et un nombre de produits, jamais le jeton, le secret ou un dossier. Un résultat positif ne prouve pas encore que la tarification est correctement intégrée.

Pour un déploiement ultérieur, importer le connecteur uniquement dans un service serveur ou une route Next.js. Ajouter validation des données métier, limitation des appels et contrôle de même origine avant d'exposer une route au formulaire. La production demande une configuration explicite `environment:'production', allowProduction:true` ; elle n'est jamais sélectionnée automatiquement.

## Référence retenue

Le premier JSON transmis par Gabriel, présenté comme un flux envoyé par un interlocuteur APRIL, sert de référence de travail. Son produit `ADPGenerali` n'est pas dans le référentiel reçu le 24 septembre et sa route de catégories professionnelles renvoie HTTP 412. Le test réussi utilise `ADPv4` / `Variable`, après vérification de ce produit dans les référentiels vivants. Le constructeur `build-request.cjs` a été adapté le 24 septembre 2026 : il n'accepte que `ADPv4` / `Variable` (produit vérifié) et refuse `ADPGenerali`. `parse-response.cjs` (`parsePricing`) convertit la réponse brute en résumé sûr pour le navigateur (total, première année, huit ans, TAEA, périodes) et refuse tout résultat dont le total diffère de l'échéancier ou dont l'échéancier manque.

Le constructeur `build-request.cjs` prépare la structure pour une personne physique, un assuré principal et un prêt `Classique`. Il ne prétend pas couvrir les co-emprunteurs, plusieurs prêts ou d’autres produits avant réception de leur documentation. Les exemples fournis ne sont pas une liste complète de valeurs autorisées.

`buildRequest(input, configuration)` reçoit séparément :

- les informations client : adresse, e-mail, projet, date d’effet, civilité/date de naissance, codes de profession, réponses explicites aux indicateurs de risque, données du prêt et quotité ;
- les paramètres de courtage/produit, à fournir côté serveur : commission et configuration des garanties.

Le résultat `valid: true` signifie uniquement que les contrôles locaux de structure passent. Ce n’est ni une validation d’éligibilité ni une acceptation par APRIL.

Les réponses fumeur, déplacements à l’étranger, sports, kilométrage, travail en hauteur et charges lourdes ne sont jamais mises à `false` par défaut. Les définitions des critères, dont le seuil de kilométrage, doivent venir du référentiel du partenaire.

Le montant de l’assurance actuelle appartient au calcul d’économie GP Finances. Il ne figure pas dans la requête de référence. La nouvelle cotisation proviendra de la réponse réelle du partenaire, pas d’un pourcentage de baisse ou d’un taux inventé.

## Différences entre les deux exemples

| Élément | Premier flux | Deuxième flux |
| --- | --- | --- |
| Produits | tableau `products` | objet `product` |
| Produit | `ADPGenerali` | `ADPv4` |
| Cotisations | `variable` | `Variable` |
| Projet | `ResidencePrincipale` | `HABITATION` et `projet: Habitation` |
| Décès | `Deces` | `DC` |
| Profession | `CadreAssimileCadre` / `AgentCommercial` | `CAT001` / `PROF001` |
| Garanties | décès, PTIA, ITT et IPT | décès uniquement |
| Date d’effet | variable à remplacer | date fixe en 2025 |

Ne pas fusionner les deux structures : elles peuvent correspondre à des produits ou versions différents, ou contenir des valeurs d’illustration. Le deuxième texte doit aussi être débarrassé des balises de code et de ses instructions de mise en forme avant de devenir du JSON.

Le code `4010` est une valeur de commission de l’exemple. Sa signification et son utilisation pour GP Finances restent à confirmer ; il n’est pas une clé API. Il n’est pas appliqué implicitement par le constructeur. La configuration de garanties du premier exemple (franchise `090`, niveau `ConfortPlus`, IPT `Capital`) doit également être validée pour le cas client et l’offre distribuée.

## Informations restantes pour raccorder la tarification

1. **Accès de préproduction : vérifié.** Client Secret configuré dans le fichier privé, authentification et lecture des cinq produits réussies.
2. **Premier appel tarifaire fictif : réussi.** Total et échéancier concordants ; aucune création de dossier ou émission de devis.
3. Valider les frais inclus ou additionnels, ainsi que les réponses d'erreur, de refus et de demande d'étude. La réponse réussie est conservée en privé comme référence.
4. Catégories professionnelles, professions, projets, garanties et commissions récupérés pour `ADPv4`. Compléter les règles d'éligibilité, franchises et niveaux et adapter le constructeur au produit retenu.
5. Règle de substitution pour un prêt en cours : signification de `borrowedAmount` (capital initial ou restant dû), `loanDuration` (initiale ou restante), date de référence, traitement des différés et liens vers les exigences bancaires. Ne pas déduire cette règle du seul nom des champs.
6. Structure attendue pour plusieurs emprunteurs et prêts. Ne pas supposer qu’ajouter un deuxième objet produit constitue automatiquement un co-emprunteur.

## Lecture attendue du résultat

La requête de référence porte sur un seul produit `ADPGenerali`. À elle seule, elle ne démontre pas l’existence d’une comparaison multi-assureurs.

Avec `contributionType: variable`, une première cotisation mensuelle ne suffit pas à calculer le total restant. Il faut récupérer les montants réels de l’échéancier ou le total fourni, identifier les frais déjà inclus et comparer exactement la même période et les mêmes quotités. Si l’échéancier manque, ne pas afficher un total obtenu en multipliant arbitrairement la première mensualité.

Le statut de la réponse doit permettre de distinguer un tarif de base, un devis exploitable, une demande d’étude et un refus. Aucun résultat fictif ne remplace une réponse absente ou une erreur du partenaire.

## Contrôles locaux

```sh
node --test tests/april-request.test.cjs tests/april-client.test.cjs
```

Ils contrôlent la structure, les références, les dates, la configuration séparée, les réponses oui/non explicites, l'authentification simulée, le renouvellement, les erreurs et les routes autorisées. Aucun test réseau et aucun dossier client ne sont envoyés par ces tests.

## Offre GP FINANCES en marque blanche (24 septembre 2026)

`quote.cjs` (`quote(input, client)`) est le point d'entrée serveur prévu pour le futur formulaire :

- **Offre fixée côté serveur** : commission `4010`, ADPv4 / Variable, garanties Décès, PTIA, ITT (franchise 90 j, ConfortPlus) et IPT (capital, ConfortPlus). Le formulaire public ne peut rien modifier de ces réglages.
- **Capital restant dû** : `borrowedAmount` = capital restant dû et `loanDuration` = mois restants, à la date d'effet.
- **Marque blanche** : le résultat ne contient ni nom du partenaire, ni code produit, ni intitulé. L'offre s'affiche sous la marque GP FINANCES uniquement ; les pages HTML actuelles ne mentionnent pas le partenaire.
- **Quand appeler GP FINANCES** : le résultat est `status:'call'` avec le message « appelez GP FINANCES » (aucun prix affiché) pour : co-emprunteur ou plusieurs prêts ; prêt autre que Classique ou avec différé ; réponse « oui » à déplacements à l'étranger, sport aérien/terrestre, kilométrage élevé, travail en hauteur ou charges lourdes ; données invalides ; message métier, refus ou étude du partenaire ; réponse incohérente ou échéancier absent ; service indisponible. Le fumeur reste tarifé.

La route Next.js, la limitation des appels et le raccordement du formulaire restent à faire. Le champ `reason` sert au suivi interne (à relayer vers vous), pas à l'affichage.

## Route serveur Next.js (24 septembre 2026)

Le code serveur vit désormais dans `src/lib/borrower-pricing/` (les fichiers de ce dossier n'en sont que des renvois). La route `POST /api/assurance-emprunteur/quote` (`src/app/api/assurance-emprunteur/quote/route.ts`) :

- exige la même origine, limite à 6 appels / 10 min / IP (compteur en mémoire), refuse un corps de plus de 4 Ko ;
- ne retient que des champs listés (`sanitize.ts`) : professions et catégories du référentiel, projets résidence principale / secondaire / locatif, date d'effet entre aujourd'hui et un an, six réponses de risque explicites ; commission, produit et garanties ne viennent jamais du navigateur ;
- répond soit `{status:'quote', total, firstYear, eightYears, taea, periods…}` soit `{status:'call', message}` ; le motif de renvoi n'est écrit que dans les journaux serveur, sans donnée personnelle ;
- sans `APRIL_CLIENT_ID` / `APRIL_CLIENT_SECRET` (voir `.env.example`), elle répond toujours « appelez GP FINANCES ».

Tests : `node --test tests/borrower-pricing/sanitize.test.mts` (racine du projet) et `node --test maquettes/gp-finances-2026-09-22/tests/*.cjs`. Aucun appel réel n'a été fait avec cette route. Reste à créer le formulaire Next.js (catégorie, profession recherchable parmi 861, capital restant dû, mois restants, taux, six questions de risque) et à relayer les renvois « appelez-nous » vers un e-mail ou Monday.

## Essai local du 24 septembre 2026 (préproduction, dossiers fictifs)

Route testée avec `next dev` sur la machine, sans déploiement :

- 250 000 € restants, 180 mois, né en 1985 → tarif reçu (5 110,91 € sur la durée) ;
- 180 000 € restants, 150 mois, né en 1975 → tarif reçu ;
- 180 000 € restants, 150 mois, né en 1985 (cas loi Lemoine sans questionnaire) → Optimum+ (ADPv4) est refusé en 412 (« bénéficie du dispositif sans questionnaire médical ») ; le code essaie alors **Intégrale (ADPIntegral)**, qui tarife : 3 603,21 €. Essentiel tarife aussi ce cas mais pas les capitaux plus élevés ; il n'est pas utilisé ;
- réponse « oui » à une question de risque, ou appel sans en-tête d'origine → renvoi d'appel / 403.

Le champ `remainingAccountLemoine` (autres capitaux déjà assurés, à saisir explicitement, 0 si aucun) est obligatoire pour certaines durées. Ordre des produits dans `quote.cjs` : ADPv4, puis ADPIntegral si refus 412 ; deux refus = « appelez GP FINANCES ».

## Top 3 « Solutions » (24 septembre 2026)

`quote.cjs` tarife maintenant les cinq produits de la gamme (Optimum+, Intégrale, Équilibre, Essentiel, Horizon) dans les deux types de cotisation : **CDR** (`Variable`, sur le capital restant dû) et **CI** (`Constante`, sur le capital initial), soit dix appels en parallèle. Un produit refusé pour le profil (âge minimum, dispositif Lemoine…) est simplement écarté. Pour chaque produit, le type de cotisation le moins cher sur la durée est retenu ; les trois produits les moins chers deviennent `Solution 1`, `Solution 2`, `Solution 3` (avec `contributionBasis` : `capital_restant_du` ou `capital_initial`). Aucun nom d'assureur, code ou intitulé ne sort du serveur. Le classement porte sur le coût total sur la durée du prêt, pas sur la première cotisation. Les garanties demandées sont identiques pour tous (Décès, PTIA, ITT 90 j ConfortPlus, IPT capital ConfortPlus) ; leurs conditions contractuelles diffèrent selon le produit.

## Quotité et second emprunteur (24 septembre 2026)

- **Quotité** : champ facultatif par emprunteur (`person.coveragePercentage`, entier de 1 à 100). Sans indication : **100 %**. La somme des quotités doit atteindre 100 % au moins, sinon le formulaire demande de corriger (et le serveur renvoie « appelez-nous »).
- **Second emprunteur** : objet `coBorrower` (mêmes champs que `person`, y compris les six réponses de risque, les autres crédits assurés et sa quotité). Structure validée en préproduction : **un produit par assuré**, chacun avec le rôle `AssurePrincipal` et ses propres garanties à sa quotité. Un seul produit avec deux `insureds` est refusé (HTTP 412 « type de cotisation non renseigné pour le couple »).
- **Réponse** : APRIL renvoie un tarif global et un échéancier par assuré ; le serveur les additionne (total, première année, huit ans, périodes). Le TAEA n'est pas additionnable : il n'est affiché que pour un emprunteur seul. Le nombre d'assurés tarifés est contrôlé.
- **Cas renvoyés vers vous** : une réponse « oui » à une question de risque de l'un ou l'autre emprunteur, ou plusieurs prêts, entraînent toujours « appelez GP FINANCES ».
- Essai réel (préproduction, 250 000 € restants, 180 mois) : couple 100 % / 100 % → 7 161,60 € ; couple 60 % / 40 % → 4 681,85 € ; seul → 4 050,41 €.
