-- Migration 001 : colonnes pour les données historiques Monday (snapshot au
-- moment de l'import, en attendant le vrai système de bordereaux/commissions).
-- À exécuter une seule fois, après le schéma initial (schema.sql).
alter table gpf_dossiers add column if not exists assureur_nom text;
alter table gpf_dossiers add column if not exists frais_dossier numeric(10,2);
alter table gpf_dossiers add column if not exists precompte_lineaire_1ere_annee numeric(10,2);
alter table gpf_dossiers add column if not exists lineaire_n1 numeric(10,2);
alter table gpf_dossiers add column if not exists frais_entree numeric(10,2);
