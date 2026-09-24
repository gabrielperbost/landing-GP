#!/bin/bash
# Lance le serveur local (port 3111) pour tester le simulateur de la maquette.
# Lit les identifiants de préproduction dans le fichier privé, sans les afficher.
cd "$(dirname "$0")/.." || exit 1
CRED=.codex-work/gp-finances-april/credentials.local.json
export APRIL_CLIENT_ID="$(python3 -c "import json;print(json.load(open('$CRED'))['clientId'])")"
export APRIL_CLIENT_SECRET="$(python3 -c "import json;print(json.load(open('$CRED'))['clientSecret'])")"
export APRIL_ENVIRONMENT=integration
open "maquettes/gp-finances-2026-09-22/assurance-emprunteur.html#simuler-assurance"
exec npx next dev -p 3111
