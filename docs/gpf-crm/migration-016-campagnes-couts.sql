-- GPF CRM — Migration 016 : coût de chaque campagne (webinaires), pour le multiple CA / coût
-- Appliquée par le serveur via gpf_exec_sql.

create table if not exists gpf_campagne_couts (
  campagne text primary key,
  cout numeric(12, 2),
  updated_at timestamptz not null default now()
);
alter table gpf_campagne_couts enable row level security;
