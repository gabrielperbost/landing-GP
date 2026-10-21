-- GPF CRM — Migration 004 : Lot 1 (revenus, motif de refus, montants, fusions)
-- À exécuter dans l'éditeur SQL de Supabase, après la migration 003.

alter table gpf_dossiers add column if not exists motif_refus text;
alter table gpf_dossiers add column if not exists prime_mensuelle numeric(10,2);
alter table gpf_dossiers add column if not exists prime_annuelle numeric(10,2);

create index if not exists gpf_clients_email_idx on gpf_clients (lower(email));
create index if not exists gpf_clients_telephone_idx on gpf_clients (telephone);
create index if not exists gpf_dossiers_produit_idx on gpf_dossiers (produit);

-- Journal des fusions (clients ou dossiers en double) : permet d'annuler une
-- fusion, puisqu'on ne fusionne jamais rien automatiquement.
create table if not exists gpf_merges (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('client', 'dossier')),
  kept_id uuid not null,
  merged_id uuid not null,
  snapshot jsonb not null,       -- état complet de l'enregistrement fusionné, pour pouvoir le restaurer
  undone boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gpf_merges_kept_idx on gpf_merges (kept_id);

alter table gpf_merges enable row level security;
