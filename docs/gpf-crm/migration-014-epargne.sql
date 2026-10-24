-- GPF CRM — Migration 014 : montants des contrats d'épargne (assurance-vie, PER) et encours sous gestion
-- Appliquée par le serveur via gpf_exec_sql.

-- Montant placé, versements programmés, frais sur versement (€) et frais de gestion (%) existent déjà
-- (placement_initial, placement_mensuel, frais_entree, frais_gestion_pct ; rémunération linéaire en € : lineaire_n1).
-- Ajouts : taux des frais sur versement, et encours actuel du contrat (valeur à date) pour l'encours sous gestion.
alter table gpf_dossiers add column if not exists frais_versement_pct numeric;
alter table gpf_dossiers add column if not exists encours numeric;
alter table gpf_dossiers add column if not exists encours_date date;
