-- GPF CRM — Migration 012 : Lot 10 (espace client par lien magique)
-- Appliquée par le serveur via gpf_exec_sql.

-- Liens d'accès à usage unique (seule l'empreinte SHA-256 du jeton est stockée).
create table if not exists gpf_portal_tokens (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references gpf_clients(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists gpf_portal_tokens_client_idx on gpf_portal_tokens (client_id);
alter table gpf_portal_tokens enable row level security;

-- Documents partagés avec le client (rien n'est visible par défaut).
alter table gpf_documents add column if not exists visible_client boolean not null default false;
alter table gpf_documents add column if not exists depose_par_client boolean not null default false;

-- Pièces demandées au client depuis le CRM.
create table if not exists gpf_portal_requests (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references gpf_clients(id),
  libelle text not null,
  statut text not null default 'demandee' check (statut in ('demandee', 'recue', 'annulee')),
  document_id uuid references gpf_documents(id),
  created_at timestamptz not null default now(),
  recue_at timestamptz
);
create index if not exists gpf_portal_requests_client_idx on gpf_portal_requests (client_id, statut);
alter table gpf_portal_requests enable row level security;

-- Dernière connexion du client à son espace.
alter table gpf_clients add column if not exists portail_derniere_connexion timestamptz;
