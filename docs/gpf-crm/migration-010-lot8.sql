-- GPF CRM — Migration 010 : Lot 8 (conversations de l'assistant IA)
-- Appliquée par le serveur via gpf_exec_sql.

-- Une conversation par échange, rattachée à la fiche ouverte quand il y en a une.
-- Ne contient jamais de données de santé ni de pièces d'identité.
create table if not exists gpf_assistant_conversations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references gpf_clients(id),
  titre text,
  messages jsonb not null default '[]'::jsonb,
  tokens_entree int not null default 0,
  tokens_sortie int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gpf_assistant_conversations_client_idx on gpf_assistant_conversations (client_id, updated_at desc);
alter table gpf_assistant_conversations enable row level security;
