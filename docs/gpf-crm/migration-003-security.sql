-- GPF CRM — Migration 003 : suppression douce + journal d'activité
-- À exécuter dans l'éditeur SQL de Supabase, après la migration 002.

-- Suppression douce : les lignes restent en base, juste marquées supprimées,
-- restaurables pendant 30 jours. Un job quotidien purge ce qui dépasse ce délai.
alter table gpf_clients add column if not exists deleted_at timestamptz;
alter table gpf_dossiers add column if not exists deleted_at timestamptz;
alter table gpf_documents add column if not exists deleted_at timestamptz;

create index if not exists gpf_clients_deleted_idx on gpf_clients (deleted_at);
create index if not exists gpf_dossiers_deleted_idx on gpf_dossiers (deleted_at);
create index if not exists gpf_documents_deleted_idx on gpf_documents (deleted_at);

-- Journal d'activité : qui a créé/modifié/supprimé/restauré quoi et quand.
-- "qui" reste simple pour l'instant (un seul utilisateur, pas de comptes
-- nominatifs) ; la structure est prête pour en accueillir plus tard.
create table if not exists gpf_activity_log (
  id uuid primary key default uuid_generate_v4(),
  action text not null check (action in ('create', 'update', 'delete', 'restore')),
  entity_type text not null check (entity_type in ('client', 'dossier', 'document')),
  entity_id uuid not null,
  resume text,
  created_at timestamptz not null default now()
);
create index if not exists gpf_activity_log_created_idx on gpf_activity_log (created_at desc);
create index if not exists gpf_activity_log_entity_idx on gpf_activity_log (entity_type, entity_id);

alter table gpf_activity_log enable row level security;
-- Même politique que les autres tables : aucune policy anon/authenticated,
-- accès uniquement via le service role depuis le serveur.
