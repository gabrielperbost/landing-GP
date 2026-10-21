-- GPF CRM — Migration 005 : rattrapage (002 + 004) + exécution des migrations par le serveur
-- À coller UNE fois dans l'éditeur SQL de Supabase. Ensuite, les migrations des
-- lots suivants sont appliquées directement par le serveur GPF (clé service_role),
-- sans copier-coller.

-- 1) Fonction d'exécution SQL réservée au service_role (jamais accessible avec
--    la clé publique anon ni à un utilisateur connecté).
create or replace function public.gpf_exec_sql(sql text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute sql;
end;
$$;
revoke all on function public.gpf_exec_sql(text) from public, anon, authenticated;
grant execute on function public.gpf_exec_sql(text) to service_role;

-- 2) Migration 002 : stockage des documents (sans effet si déjà faite)
insert into storage.buckets (id, name, public)
values ('gpf-documents', 'gpf-documents', false)
on conflict (id) do nothing;
alter table gpf_documents drop constraint if exists gpf_documents_type_check;
alter table gpf_documents add column if not exists nom_fichier text;
alter table gpf_documents add column if not exists storage_path text;
alter table gpf_documents add column if not exists taille_octets bigint;

-- 3) Migration 004 : lot 1
alter table gpf_dossiers add column if not exists motif_refus text;
alter table gpf_dossiers add column if not exists prime_mensuelle numeric(10,2);
alter table gpf_dossiers add column if not exists prime_annuelle numeric(10,2);
create index if not exists gpf_clients_email_idx on gpf_clients (lower(email));
create index if not exists gpf_clients_telephone_idx on gpf_clients (telephone);
create index if not exists gpf_dossiers_produit_idx on gpf_dossiers (produit);
create table if not exists gpf_merges (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('client', 'dossier')),
  kept_id uuid not null,
  merged_id uuid not null,
  snapshot jsonb not null,
  undone boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gpf_merges_kept_idx on gpf_merges (kept_id);
alter table gpf_merges enable row level security;

-- 4) Suivi des migrations appliquées par le serveur
create table if not exists gpf_schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table gpf_schema_migrations enable row level security;
insert into gpf_schema_migrations (name) values ('002'), ('003'), ('004'), ('005') on conflict do nothing;
