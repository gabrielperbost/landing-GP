# Simulation de capital — Assurance-Vie

Maquette locale du 22 septembre 2026. Aucune donnée transmise ni persistée. La simulation ne constitue pas un rendement annoncé pour un contrat.

## Utilisation

Sur `assurance-vie.html`, cliquer sur « Tester mon scénario ». Quatre réglages sont disponibles par saisie, curseur et boutons +/− : versement initial, versement mensuel, durée de 1 à 40 ans et rendement annuel hypothétique de −5 % à +10 %. Les valeurs par défaut (10 000 €, 200 €/mois, 20 ans, 4 %) sont un exemple modifiable.

Le graphique compare le capital projeté aux versements bruts cumulés. Il est possible de survoler/toucher la courbe ou d’utiliser ses flèches gauche/droite au clavier. Le tableau dépliable donne chaque fin d’année. Le mobile dispose d’un résumé du capital qui reste visible pendant les réglages. La prise de contact ouvre le formulaire de démonstration présélectionné sur Assurance-Vie.

## Calcul

Le taux de frais de versement est fixé à **1 %**, conformément à la demande de Gabriel. Pour chaque versement, 99 % sont donc investis : versement initial à l’ouverture puis versements mensuels en fin de mois.

Pour un rendement annuel effectif hypothétique `r`, le facteur mensuel vaut `(1 + r)^(1/12)`. À chaque mois : `capital = capital × facteur + versement_mensuel × 0,99`. Les frais cumulés correspondent à 1 % des versements bruts. La performance simulée correspond à `capital − (versements bruts − frais)`, et peut être négative. Les calculs gardent leur précision ; l’affichage est arrondi à l’euro.

Le rendement saisi est supposé net des frais récurrents de gestion et des supports, qui ne sont pas prélevés une seconde fois. La simulation n’intègre ni retraits, ni impôts, ni prélèvements sociaux, ni inflation. Elle applique une hypothèse constante, sans reproduire la volatilité des marchés. Ces limites sont affichées sur la page.

Repères consultés : [AMF — comprendre les simulateurs et les frais](https://www.amf-france.org/fr/espace-epargnants/lexique-simulateurs-et-outils-pratiques/nos-simulateurs), [Service Public — fonctionnement de l’assurance-vie](https://www.service-public.gouv.fr/particuliers/vosdroits/F15274). Le taux de 1 % vient de la demande utilisateur ; ce n’est pas un tarif confirmé par ces sources.

## Fichiers et vérifications

- `life-calculator.js` : moteur indépendant.
- `life-simulator.html`, `life-simulator.css`, `life-simulator.js` : interface, graphique SVG et interactions.
- `generer.cjs` : intègre le simulateur et sa synthèse dans la page Assurance-Vie.
- `tests/life-calculator.test.cjs` : frais initiaux et mensuels, rendement nul/négatif, formule des versements mensuels, horizons 1 à 40, cohérence des résultats et entrées invalides. Exécuter `node --test tests/life-calculator.test.cjs`.
- `verification-performance.json` : contrôles navigateur (six largeurs, curseurs, boutons, réinitialisation, tableau, lecture clavier du graphique et formulaire de contact).
