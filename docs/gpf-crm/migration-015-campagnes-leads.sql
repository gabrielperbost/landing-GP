-- GPF CRM — Migration 015 : suivi des leads par campagne (webinaires) : inscrit, prise de RDV, devenu client, CA généré
-- Appliquée par le serveur via gpf_exec_sql.

-- Une ligne par contact et par campagne. « campagne » est un identifiant défini dans le code
-- (src/lib/gpf/campagnesLeads.ts), par exemple « webinaire-per-2026-11-08 ».
create table if not exists gpf_campagne_leads (
  id uuid primary key default uuid_generate_v4(),
  campagne text not null,
  client_id uuid not null references gpf_clients(id) on delete cascade,
  email text,
  canal text,
  inscrit_at timestamptz not null default now(),
  etape text not null default 'inscrit' check (etape in ('inscrit', 'rdv', 'client')),
  etape_at timestamptz,
  ca numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists gpf_campagne_leads_unique_idx on gpf_campagne_leads (campagne, client_id);
create index if not exists gpf_campagne_leads_campagne_idx on gpf_campagne_leads (campagne);
alter table gpf_campagne_leads enable row level security;
