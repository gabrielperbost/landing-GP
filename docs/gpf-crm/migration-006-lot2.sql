-- GPF CRM — Migration 006 : Lot 2 (Affaires / Contrats, notifications)
-- Appliquée par le serveur via gpf_exec_sql (voir src/lib/gpf/migrations.ts).

-- Un dossier signé devient un contrat : statut de contrat + dates de vie du contrat.
-- Les autres dossiers restent des affaires dans le pipeline commercial.
alter table gpf_dossiers add column if not exists contrat_statut text;
alter table gpf_dossiers drop constraint if exists gpf_dossiers_contrat_statut_check;
alter table gpf_dossiers add constraint gpf_dossiers_contrat_statut_check
  check (contrat_statut is null or contrat_statut in ('actif', 'a_relancer', 'resilie'));
alter table gpf_dossiers add column if not exists date_signature date;
alter table gpf_dossiers add column if not exists date_echeance date;
alter table gpf_dossiers add column if not exists date_resiliation date;
create index if not exists gpf_dossiers_contrat_statut_idx on gpf_dossiers (contrat_statut);

-- Reprise des données : Effectif (et Effectif en attente de règlement) => contrat actif.
update gpf_dossiers
set contrat_statut = 'actif'
where contrat_statut is null and statut in ('effectif', 'attente_reglement');

-- Centre de notifications.
create table if not exists gpf_notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  titre text not null,
  message text,
  lien text,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gpf_notifications_lu_idx on gpf_notifications (lu, created_at desc);
alter table gpf_notifications enable row level security;
