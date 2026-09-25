# Suivi du site gp-finances.fr : où vont les visiteurs, qui simule

Mis à jour le 24 septembre 2026.

## Ce qui est mesuré (uniquement après « Tout accepter »)

Aucune mesure n'est déclenchée avant le choix du visiteur (bandeau cookies). Les noms d'événements sont volontairement lisibles.

| Ce que vous voulez savoir | Événement Google Analytics | Détails fournis |
| --- | --- | --- |
| Quelles pages sont vues | `page_view` | titre de la page, adresse, titre principal |
| Jusqu'où on lit | `lecture_50_pourcent`, `lecture_90_pourcent` | page |
| Sur quel service on clique | `clic_menu_service` | nom du service |
| Quelqu'un appelle ou écrit | `clic_telephone`, `clic_email` | emplacement du bouton |
| Quelqu'un veut un rendez-vous | `clic_prise_rendez_vous` | bouton, sujet |
| Demande de rappel envoyée | `demande_rappel_envoyee` | sujet |
| Un avis Google est ouvert | `clic_avis_google` | bandeau ou encart |
| Une vidéo témoignage est lancée | `video_temoignage_ouverte` | nom du témoignage |
| Début d'une simulation | `simulation_demarree` | simulateur (`assurance_emprunteur`, `per`, `assurance_vie`) |
| Simulation envoyée | `simulation_envoyee` | emprunteurs (1 ou 2) |
| La fenêtre « coordonnées » s'affiche après une simulation | `popup_lead_affiche` | simulateur |
| Le visiteur la ferme (« Non merci ») | `popup_lead_ferme` | simulateur |
| Le visiteur laisse ses coordonnées | `lead_simulation_envoye` | simulateur |
| Simulation avec résultat | `simulation_resultat` | emprunteurs, nombre de solutions, tranche de capital, meilleure solution en € |
| Simulation renvoyée vers vous | `simulation_appel_demande` | simulateur |

## Où le lire (Google Analytics 4)

1. **Rapports > Temps réel** : qui est sur le site maintenant, sur quelle page, quels événements.
2. **Rapports > Engagement > Pages et écrans** : les pages les plus vues.
3. **Rapports > Engagement > Événements** : le tableau des événements ci-dessus avec leur nombre.
4. **Admin > Événements > Marquer comme événement clé** : cochez `simulation_resultat`, `simulation_appel_demande`, `demande_rappel_envoyee`, `clic_telephone`, `clic_prise_rendez_vous`. Ils deviennent vos objectifs.
5. **Explorer > Exploration en entonnoir** : `page_view` (accueil) → `simulation_demarree` → `simulation_envoyee` → `simulation_resultat` → `clic_prise_rendez_vous`. C'est le parcours qui compte.

Pour partager l'accès : Admin > Gestion des accès à la propriété > ajouter un utilisateur (rôle Lecteur).

## Activation

La mesure ne fonctionne que si l'identifiant Google Analytics est renseigné dans l'hébergeur : variable `NEXT_PUBLIC_GA4_ID` (format `G-XXXXXXXXXX`). Meta Pixel : `NEXT_PUBLIC_META_PIXEL_ID`. Sans ces variables, rien n'est mesuré (la page `/api/site-config` renvoie `null`).

## Chaque simulation d'assurance emprunteur : un e-mail

À chaque simulation, un e-mail est envoyé à **gabriel.perbost@gp-finances.fr** (variable `SIMULATION_ALERT_TO` pour changer ou ajouter des adresses). Il contient :
- le résultat montré au visiteur (solutions, assureur en interne, CI ou CDR, coût total) ;
- ou « appelez GP FINANCES » avec le motif (réponse de risque, aucun assureur, service indisponible…) ;
- tout ce que le visiteur a saisi (capital, durée, taux, profil, quotités, second emprunteur) ;
- la page d'origine.

Le simulateur ne collecte ni nom, ni e-mail, ni téléphone : l'e-mail sert à suivre les demandes, pas à rappeler une personne. **Contacts après une simulation** : quand un visiteur laisse ses coordonnées dans la fenêtre qui s'ouvre après une simulation (assurance de prêt, PER, assurance-vie), tu reçois un e-mail « Lead après simulation … » avec son prénom, son téléphone, son e-mail éventuel et le résumé chiffré de sa simulation. La fenêtre ne s'ouvre qu'une fois par simulateur et par visite, et seulement avec la case de consentement cochée.

Les demandes de rappel (formulaire « On vous rappelle ») arrivent par le circuit existant, avec le téléphone.

## Conservation

Simulations : 12 mois maximum (à supprimer dans la boîte de réception au-delà). Voir la politique de confidentialité.
