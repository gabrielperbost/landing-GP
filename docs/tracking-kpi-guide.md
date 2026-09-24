# Tracking KPI - Landing GP Finances

Date de mise en place: 2026-05-18

## Objectif
Suivre l'integralite du tunnel de performance de la landing:
- acquisition (visites),
- engagement (temps, scroll, sections),
- consommation contenu (videos),
- conversion (leads, clics RDV/appel).

## Evenements trackes

| Event | Quand | Parametres principaux | Utilite |
|---|---|---|---|
| `page_view` | A chaque affichage de page | `page_path`, `page_type`, `city_slug` | Volume de trafic par page/ville |
| `gp_lp_visit` | A l'entree sur landing | `page_path`, `page_type`, `city_slug` | Visites qualifiees landing |
| `gp_lp_time_mark` | A 15s / 30s / 60s / 120s | `seconds`, `page_path`, `city_slug` | Qualite de l'attention |
| `gp_lp_scroll` | A 25/50/75/90% de scroll | `depth_pct`, `page_path`, `city_slug` | Jusqu'ou va le prospect |
| `gp_lp_section` | Quand une section est vue | `section_id`, `page_path`, `city_slug` | Etapes consultees dans la page |
| `gp_lp_time_spent` | Sortie de page | `seconds`, `max_depth`, `section_cnt` | Temps reel + profondeur max |
| `gp_video_start` | Lancement video | `video_id` | Interet initial video |
| `gp_video_50` | 50% video | `video_id` | Retention video mediane |
| `gp_video_complete` | Fin video | `video_id` | Retention video complete |
| `gp_video_progress` | Quartiles 25/50/75/100 | `video_id`, `progress_pct`, `watch_sec` | Analyse fine de progression |
| `gp_video_watch` | Paliers temps 10/30/60s | `video_id`, `watch_sec` | Temps concret de visionnage |
| `gp_faq_open` | Ouverture d'une question FAQ | `question_id` | Objections les plus consultees |
| `gp_cta_click` | Clic CTA | `label` | Clics call-to-action |
| `gp_rdv_click` | Clic RDV | `label` | Intention de prise de RDV |
| `gp_lead_submit` | Soumission formulaire | `status`, `page_path`, `city` | Conversion finale |

## KPI a suivre chaque semaine

| KPI | Definition | Cible de base |
|---|---|---|
| Visites landing | `gp_lp_visit` | Croissance continue |
| Taux scroll 75% | `gp_lp_scroll depth_pct=75` / visites | > 35% |
| Temps >= 60s | `gp_lp_time_mark seconds=60` / visites | > 40% |
| Taux vue section "estimation" | `gp_lp_section section_id=estimation` / visites | > 30% |
| Taux video start | `gp_video_start` / visites | > 20% |
| Taux video complete | `gp_video_complete` / `gp_video_start` | > 25% |
| CTR appel | `gp_cta_click label*call` / visites | A comparer par ville |
| CTR RDV | `gp_rdv_click` / visites | A comparer par ville |
| Taux lead | `gp_lead_submit status=submitted` / visites | KPI principal |
| Top villes convertissantes | leads / ville | Prioriser SEO & budget |

## Comment lire les leads par source

Le formulaire envoie une source enrichie dans le backend:
- `path` (URL exacte),
- `city` (slug ville),
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`,
- `gclid`, `fbclid`,
- `referrer`.

Cela permet de relier chaque lead a:
1) la ville,
2) le canal d'acquisition,
3) la campagne.

## Dashboard GA4 recommande (Explorations)

1. "Performance pages villes"
- Dimensions: `page_path`, `city_slug`
- Metriques: `Users`, `Event count`, `Conversions` (`gp_lead_submit`)

2. "Funnel landing"
- Etapes: `gp_lp_visit` -> `gp_lp_scroll(50)` -> `gp_lp_section(estimation)` -> `gp_lead_submit(submitted)`

3. "Video impact"
- Dimensions: `video_id`
- Metriques: `gp_video_start`, `gp_video_50`, `gp_video_complete`, ratio completion

4. "Engagement par ville"
- Dimensions: `city_slug`
- Metriques: temps moyen (`gp_lp_time_spent seconds`), `max_depth`, taux lead

## Actions prioritaires

1. Creer des conversions GA4:
- `gp_lead_submit` avec `status=submitted`
- `gp_rdv_click`
- `gp_cta_click` sur labels appel

2. Enregistrer les dimensions personnalisees GA4:
- `city_slug`
- `page_type`
- `section_id`
- `video_id`
- `depth_pct`
- `seconds`

3. Faire une revue hebdo:
- top 5 villes en trafic,
- top 5 villes en leads,
- sections/video qui bloquent la conversion.
