# Rubrique « Conseils » : 12 articles à valider avant publication

État au 25 septembre 2026 : les 12 articles ont été **publiés à la demande de Gabriel** (`published: true`), après la vérification décrite ci-dessous. Pour retirer un article : passer `published: false`, reconstruire et redéployer.

Les règles décrites sont celles **connues au début de 2026**. Elles doivent être **revérifiées à la date de publication**, notamment les chiffres et les seuils, qui changent parfois d'une année à l'autre.

## Comment publier

1. Relire chaque article (aperçu : ouvrir `conseils.html` de la maquette).
2. Corriger les textes dans `maquettes/gp-finances-2026-09-22/articles/` (`pret.cjs`, `epargne.cjs`, `protection.cjs`).
3. Passer `published: true` sur les articles validés et mettre à jour la date `updated`.
4. Demander la mise en ligne (construction : `node scripts/build-site.cjs`, puis déploiement).

Un article publié apparaît sur `/conseils/<nom-de-l-article>`, dans la page `/conseils`, dans le plan du site, avec ses données structurées (article, fil d'Ariane, questions-réponses).

## Vérification du 25 septembre 2026 (recherche sur les sites officiels)

**Confirmé par une source officielle** (economie.gouv.fr, impots.gouv.fr, Bofip, Trésor, service-public.fr) :
- Loi Lemoine : changement à tout moment pour tous les emprunteurs depuis le 1er septembre 2022, garanties équivalentes exigées, réponse de la banque sous 10 jours ouvrés (souvent non respectée en pratique).
- La banque retient au maximum 11 critères parmi la liste CCSF ; questionnaire de santé supprimé sous 200 000 € par personne et prêt terminé avant les 60 ans ; droit à l'oubli à 5 ans (protocole terminé, sans rechute).
- PER : plafond de déduction = 10 % des revenus d'activité N-1 (retenus dans la limite de 8 PASS), minimum 10 % du PASS ; frais de transfert 1 % maximum avant 5 ans, gratuit ensuite ; déblocages anticipés (résidence principale, accidents de la vie dont invalidité et surendettement).
- Assurance-vie au décès : 152 500 € par bénéficiaire (primes avant 70 ans), 20 % jusqu'à 700 000 €, 31,25 % au-delà ; 30 500 € pour les primes après 70 ans.
- Mutuelle : résiliation infra-annuelle depuis le 1er décembre 2020, après un an, effet un mois après réception ; complémentaire collective obligatoire pour les salariés du privé depuis 2016 ; 100 % Santé dans les contrats responsables.
- Crédit à la consommation : indemnité de remboursement anticipé de 1 % (0,5 % sous un an), seulement au-delà de 10 000 € remboursés sur 12 mois ; crédit immobilier à taux fixe : six mois d'intérêts, dans la limite de 3 % du capital restant dû ; délai de réflexion de 10 jours avant d'accepter une offre de crédit immobilier, sans rétractation après acceptation.

**Erreurs corrigées après cette vérification :**
1. Article PER (impôts) : la formulation laissait croire que la déduction elle-même était limitée à 8 PASS ; ce sont les revenus retenus qui sont limités à 8 PASS.
2. Article regroupement (calcul) : je présentais les « 10 jours de réflexion » du crédit immobilier comme un délai de rétractation après signature. C'est faux : il n'y a pas de rétractation après acceptation.
3. Article regroupement (quand est-ce intéressant) : plafonds des indemnités de remboursement anticipé précisés (seuil de 10 000 € pour le crédit à la consommation ; « dans la limite de 3 % » pour l'immobilier).
4. Article Lemoine : j'avais écrit que la loi s'appliquait au 1er juin 2022 pour les nouveaux contrats ; je n'ai retenu que la date confirmée (1er septembre 2022, tous contrats). Formulation du droit à l'oubli alignée sur la source (5 ans, sans rechute, sous conditions).

**Non confirmé, à vérifier avec vous :**
- Barème de l'impôt sur le revenu (tranches 0, 11, 30, 41, 45 %) pour l'année en cours ; le texte invite déjà à vérifier sur l'avis d'imposition.
- Articles prévoyance : formulations volontairement générales (régimes des indépendants, déductibilité Madelin) : à adapter selon votre expérience.
- Contenu des exemples d'assurance-vie (frais) : calcul d'illustration, sans garantie de rendement.

## Points de fait, article par article (détail initial)

### Assurance de prêt
**Changer d'assurance de prêt à tout moment (loi Lemoine)**
- Loi du 28 février 2022 : résiliation à tout moment ; applicable au 1er juin 2022 (nouveaux contrats) et 1er septembre 2022 (contrats en cours).
- Délai de réponse de la banque : 10 jours ouvrés, refus motivé par écrit.
- Critères d'équivalence : « jusqu'à 11 sur 18 » pour un prêt immobilier (liste CCSF).
- Questionnaire de santé : pas demandé si capital assuré ≤ 200 000 € par personne et prêt terminé avant les 60 ans de l'emprunteur ; droit à l'oubli de 5 ans (cancers, hépatite C), sous conditions.
- Le taux d'intérêt du prêt ne change pas ; l'avenant met à jour le TAEG.

**Capital initial ou capital restant dû**
- Exemple : 250 000 € sur 20 ans, 0,10 point = 5 000 € (calcul : 250 000 × 0,001 × 20).
- « Le coût sur 8 ans, durée souvent proche d'un prêt réellement conservé » : formulation prudente, à confirmer avec vos dossiers.

### PER
**PER et impôts**
- Plafond : 10 % des revenus professionnels N-1, dans la limite de 8 PASS, minimum 10 % du PASS ; report 3 ans ; mutualisation dans le couple.
- Tranches du barème : 0, 11, 30, 41, 45 % (à vérifier pour l'année en cours).
- Exemples chiffrés (versement × TMI) : arithmétique simple.

**PER : récupérer son épargne**
- Cas de déblocage anticipé (liste légale) ; sortie en capital ou rente selon l'origine des sommes.
- Frais de transfert : 1 % maximum avant 5 ans, nuls ensuite.

### Assurance-vie
**Comment ça marche**
- Exemple de frais : 100 000 € à 4 % net contre 3 % net sur 20 ans : environ 219 000 € contre 181 000 € (différence 38 500 €). Hypothèse de calcul, sans garantie de rendement.
- Mention « capital garanti net de frais de gestion » sur le fonds en euros.

**Clause bénéficiaire**
- Abattement de 152 500 € par bénéficiaire (primes avant 70 ans), puis 20 % jusqu'à 700 000 € et 31,25 % au-delà ; abattement global de 30 500 € pour les primes après 70 ans ; conjoint et partenaire de PACS exonérés. **À revérifier : ce sont des chiffres susceptibles d'évoluer.**

### Prévoyance
**Indépendants et arrêt de travail** : texte volontairement général (règles différentes selon régime). À adapter avec vos cas.
**Protection de la famille** : exemple pédagogique (1 500 € × 12 × 10 ans = 180 000 €).

### Mutuelle
**Choisir son niveau de garanties** : 100 % Santé (optique, dentaire, audiologie), contrat responsable, complémentaire santé collective obligatoire pour les salariés du privé.
**Changer de mutuelle à tout moment** : résiliation infra-annuelle depuis le 1er décembre 2020, après 1 an de contrat, effet 1 mois après réception.

### Regroupement de crédits
**Quand est-ce intéressant** : plafonds d'indemnités de remboursement anticipé (crédit à la consommation : 1 % ou 0,5 % ; immobilier : 6 mois d'intérêts ou 3 % du capital restant dû).
**Le calcul avant de signer** : exemple pédagogique calculé (22 000 € à 5 % : 507 €/mois sur 48 mois, 311 €/mois sur 84 mois ; 520 € de frais supposés) ; délais de rétractation (14 jours crédit à la consommation, 10 jours de réflexion crédit immobilier).

## Liens de sources
Certains liens pointent vers la page d'accueil d'un organisme (service-public.fr, impots.gouv.fr, ameli.fr, banque-france.fr…) faute d'adresse précise vérifiée. Remplacez-les par la page exacte de chaque sujet lors de la relecture.

## Relecture : ce que j'attends de vous
- Corriger tout ce qui ne correspond pas à votre pratique ou aux règles actuelles.
- Ajouter, si possible, un cas client anonymisé par article (avec l'accord du client) : c'est ce qui rend un article vraiment utile et différent de ceux des concurrents.
