-- GPF CRM — Migration 011 : Lot 9 (arrivée des leads, score, séquences e-mail, segments et campagnes)
-- Appliquée par le serveur via gpf_exec_sql.

-- Score automatique (sauf si fixé à la main) et désabonnement des e-mails.
-- Les contacts existants gardent leur score actuel : seul un lead arrivé après
-- cette mise à jour est noté automatiquement.
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'gpf_clients' and column_name = 'score_manuel') then
    alter table gpf_clients add column score_manuel boolean not null default true;
    alter table gpf_clients alter column score_manuel set default false;
  end if;
end $$;
alter table gpf_clients add column if not exists desabonne_at timestamptz;
alter table gpf_clients add column if not exists desabo_token uuid not null default uuid_generate_v4();
create unique index if not exists gpf_clients_desabo_token_idx on gpf_clients (desabo_token);

-- Journal des leads reçus (webhooks Meta, Tally, Calendly, import Masterleads).
create table if not exists gpf_lead_events (
  id uuid primary key default uuid_generate_v4(),
  source text not null,
  source_ref text,
  client_id uuid references gpf_clients(id),
  cree boolean not null default true,
  resume text,
  created_at timestamptz not null default now()
);
create unique index if not exists gpf_lead_events_ref_idx on gpf_lead_events (source, source_ref) where source_ref is not null;
create index if not exists gpf_lead_events_created_idx on gpf_lead_events (created_at desc);
alter table gpf_lead_events enable row level security;

-- Séquences d'e-mails automatiques (désactivées tant que vous ne les activez pas).
create table if not exists gpf_sequences (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  declencheur text not null default 'nouveau_lead' check (declencheur in ('nouveau_lead', 'nrp', 'devis_envoye')),
  actif boolean not null default false,
  etapes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table gpf_sequences enable row level security;

create table if not exists gpf_sequence_envois (
  id uuid primary key default uuid_generate_v4(),
  sequence_id uuid not null references gpf_sequences(id) on delete cascade,
  client_id uuid not null references gpf_clients(id),
  etape int not null,
  statut text not null default 'envoye' check (statut in ('envoye', 'erreur')),
  erreur text,
  envoye_at timestamptz not null default now(),
  unique (sequence_id, client_id, etape)
);
alter table gpf_sequence_envois enable row level security;

-- Segments enregistrés et campagnes e-mail.
create table if not exists gpf_segments (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  filtres jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table gpf_segments enable row level security;

create table if not exists gpf_campagnes (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  filtres jsonb not null default '{}'::jsonb,
  sujet text not null,
  corps text not null,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'en_cours', 'envoyee', 'annulee')),
  nb_destinataires int not null default 0,
  nb_envoyes int not null default 0,
  nb_erreurs int not null default 0,
  created_at timestamptz not null default now(),
  lancee_at timestamptz,
  terminee_at timestamptz
);
alter table gpf_campagnes enable row level security;

create table if not exists gpf_campagne_envois (
  id uuid primary key default uuid_generate_v4(),
  campagne_id uuid not null references gpf_campagnes(id) on delete cascade,
  client_id uuid not null references gpf_clients(id),
  email text not null,
  statut text not null default 'a_envoyer' check (statut in ('a_envoyer', 'envoye', 'erreur')),
  erreur text,
  envoye_at timestamptz,
  unique (campagne_id, client_id)
);
create index if not exists gpf_campagne_envois_statut_idx on gpf_campagne_envois (campagne_id, statut);
alter table gpf_campagne_envois enable row level security;

-- Séquence type, désactivée : à relire puis activer depuis la page Campagnes.
insert into gpf_sequences (nom, declencheur, actif, etapes)
select 'Nouveau lead sans réponse', 'nouveau_lead', false, '[
  {"jour": 0, "sujet": "Votre demande auprès de GP Finances", "corps": "Bonjour {prenom},\n\nMerci pour votre demande. Je vais vous appeler très rapidement pour en parler : vous pouvez aussi choisir directement un créneau qui vous arrange en répondant à cet e-mail.\n\nÀ très vite,\nGabriel – GP Finances"},
  {"jour": 2, "sujet": "Je n''ai pas réussi à vous joindre", "corps": "Bonjour {prenom},\n\nJ''ai essayé de vous joindre au sujet de votre demande. Quel moment vous conviendrait pour un échange de 10 minutes ?\n\nGabriel – GP Finances"},
  {"jour": 6, "sujet": "Toujours intéressé(e) ?", "corps": "Bonjour {prenom},\n\nJe me permets une dernière relance : si votre projet est toujours d''actualité, répondez simplement à cet e-mail et je vous rappelle.\n\nBelle journée,\nGabriel – GP Finances"}
]'::jsonb
where not exists (select 1 from gpf_sequences);
