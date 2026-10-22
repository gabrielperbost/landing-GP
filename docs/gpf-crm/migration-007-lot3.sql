-- GPF CRM — Migration 007 : Lot 3 (fiche client complète) + bases du Lot 4
-- Appliquée par le serveur via gpf_exec_sql.

-- Contact : type, provenance, préférences, suivi commercial, KYC.
alter table gpf_clients add column if not exists type_contact text not null default 'particulier';
alter table gpf_clients drop constraint if exists gpf_clients_type_contact_check;
alter table gpf_clients add constraint gpf_clients_type_contact_check check (type_contact in ('particulier', 'tns', 'entreprise'));
alter table gpf_clients add column if not exists raison_sociale text;
alter table gpf_clients add column if not exists date_naissance date;
alter table gpf_clients add column if not exists situation_familiale text;
alter table gpf_clients add column if not exists nb_enfants int;
alter table gpf_clients add column if not exists provenance text;
alter table gpf_clients add column if not exists apporteur_id uuid;
alter table gpf_clients add column if not exists preference_contact text;
alter table gpf_clients add column if not exists score text;
alter table gpf_clients add column if not exists dernier_contact_at timestamptz;
alter table gpf_clients add column if not exists prochaine_action text;
alter table gpf_clients add column if not exists prochaine_action_date date;
alter table gpf_clients add column if not exists nrp_count int not null default 0;
alter table gpf_clients add column if not exists budget jsonb not null default '{}'::jsonb;
alter table gpf_clients add column if not exists fiscalite jsonb not null default '{}'::jsonb;
create index if not exists gpf_clients_provenance_idx on gpf_clients (provenance);
create index if not exists gpf_clients_created_idx on gpf_clients (created_at desc);

-- Reprise : la source des dossiers (Monday) devient la provenance du contact quand elle est vide.
update gpf_clients c set provenance = d.source
from (
  select distinct on (client_id) client_id, source
  from gpf_dossiers where source is not null and deleted_at is null
  order by client_id, created_at
) d
where d.client_id = c.id and c.provenance is null;

-- Projet (emprunteur) : informations du prêt et économie réalisée.
alter table gpf_dossiers add column if not exists banque text;
alter table gpf_dossiers add column if not exists date_offre_pret date;
alter table gpf_dossiers add column if not exists date_signature_notaire date;
alter table gpf_dossiers add column if not exists cout_assurance_banque numeric(12,2);
alter table gpf_dossiers add column if not exists cout_assurance_delegation numeric(12,2);
alter table gpf_dossiers add column if not exists prochaine_action text;
alter table gpf_dossiers add column if not exists prochaine_action_date date;
alter table gpf_dossiers add column if not exists etape_depuis timestamptz not null default now();

-- Documents : rattachables directement au contact (pas seulement à un dossier),
-- avec date d'expiration (pièces d'identité).
alter table gpf_documents alter column dossier_id drop not null;
alter table gpf_documents add column if not exists client_id uuid references gpf_clients(id);
alter table gpf_documents add column if not exists date_expiration date;
update gpf_documents doc set client_id = d.client_id from gpf_dossiers d where doc.dossier_id = d.id and doc.client_id is null;
create index if not exists gpf_documents_client_idx on gpf_documents (client_id);

-- Notes.
create table if not exists gpf_notes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references gpf_clients(id),
  dossier_id uuid references gpf_dossiers(id),
  categorie text not null default 'suivi' check (categorie in ('reunion', 'suivi', 'conformite', 'contrats', 'autre')),
  contenu text not null,
  auteur text not null default 'Gabriel PERBOST',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists gpf_notes_client_idx on gpf_notes (client_id, created_at desc);
alter table gpf_notes enable row level security;

-- Tâches et relances (création manuelle ou automatique).
create table if not exists gpf_tasks (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references gpf_clients(id),
  dossier_id uuid references gpf_dossiers(id),
  titre text not null,
  categorie text not null default 'suivi' check (categorie in ('appel', 'email', 'sms', 'document', 'relance', 'conformite', 'suivi', 'reunion')),
  echeance timestamptz,
  etat text not null default 'a_faire' check (etat in ('a_faire', 'en_cours', 'en_attente', 'terminee')),
  notes text,
  auto boolean not null default false,
  origine text,
  created_at timestamptz not null default now(),
  done_at timestamptz,
  deleted_at timestamptz
);
create index if not exists gpf_tasks_etat_idx on gpf_tasks (etat, echeance);
create index if not exists gpf_tasks_client_idx on gpf_tasks (client_id);
alter table gpf_tasks enable row level security;

-- Rendez-vous.
create table if not exists gpf_appointments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references gpf_clients(id),
  titre text not null,
  debut timestamptz not null,
  duree_min int not null default 30,
  lieu text,
  lien_visio text,
  statut text not null default 'a_venir' check (statut in ('a_venir', 'provisoire', 'passe', 'annule')),
  source text not null default 'manuel' check (source in ('manuel', 'calendly', 'google')),
  source_ref text,
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists gpf_appointments_debut_idx on gpf_appointments (debut);
create unique index if not exists gpf_appointments_source_ref_idx on gpf_appointments (source, source_ref) where source_ref is not null;
alter table gpf_appointments enable row level security;

-- Appels passés (résultat, pour le compteur NRP et l'historique).
create table if not exists gpf_calls (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references gpf_clients(id),
  dossier_id uuid references gpf_dossiers(id),
  resultat text not null check (resultat in ('joint', 'nrp', 'messagerie', 'rappeler')),
  rappel_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists gpf_calls_client_idx on gpf_calls (client_id, created_at desc);
alter table gpf_calls enable row level security;

-- Conformité (checklist réglementaire par contact).
create table if not exists gpf_compliance (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references gpf_clients(id),
  type text not null check (type in ('collecte', 'lcb_ft', 'der', 'lettre_mission', 'piece_identite', 'profil', 'objectifs', 'rapport_adequation')),
  statut text not null default 'manquant' check (statut in ('manquant', 'en_cours', 'fait')),
  pourcentage int,
  date_signature date,
  date_expiration date,
  document_id uuid references gpf_documents(id),
  updated_at timestamptz not null default now(),
  unique (client_id, type)
);
alter table gpf_compliance enable row level security;
