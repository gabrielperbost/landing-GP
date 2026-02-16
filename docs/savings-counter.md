# Compteur global d'economies

## Ce qui est en place
- Stockage serveur partage dans `data/counter.json`.
- Route publique `GET /api/savings-counter` pour lire la valeur.
- Route cron-ready `GET|POST /api/savings-counter/update` pour appliquer les increments.
- Section frontend ajoutee sous "Cadre legal" via `src/components/sections/SavingsCounter.tsx`.
- Planification quotidienne ajoutee dans `vercel.json` (03:00 UTC).

## Regles metier implementees
- Valeur initiale: `3 058 072 €`.
- A chaque periode complete de 24h ecoulee, un increment aleatoire entre `100 €` et `1 000 €` est ajoute.
- Si plusieurs jours se sont ecoules, tous les increments sont rattrapes.
- Valeur commune a tous les visiteurs car stockee cote serveur.

## Fichiers
- `data/counter.json`
- `src/lib/savingsCounterStore.ts`
- `src/app/api/savings-counter/route.ts`
- `src/app/api/savings-counter/update/route.ts`
- `src/components/sections/SavingsCounter.tsx`
- `src/app/page.tsx`
- `vercel.json`

## Securiser la route cron (recommande)
- Definir une variable d'environnement:
- `COUNTER_CRON_SECRET=...` (custom)
- ou `CRON_SECRET=...` (standard Vercel cron)
- Appeler ensuite `/api/savings-counter/update` avec:
- header `x-counter-cron-secret: <secret>`
- ou header `Authorization: Bearer <secret>`
- ou query param `?secret=<secret>`

## Exemple cron quotidien (systeme)
```bash
0 3 * * * curl -sS -H "x-counter-cron-secret: $COUNTER_CRON_SECRET" https://votre-domaine.com/api/savings-counter/update > /dev/null
```

## Notes de deploiement
- En environnement serverless, l'ecriture fichier peut etre ephemere selon l'hebergeur.
- Si votre hebergeur ne persiste pas le filesystem, remplacez `counter.json` par SQLite ou une base externe.
