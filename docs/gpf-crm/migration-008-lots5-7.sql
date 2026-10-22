-- GPF CRM — Migration 008 : Lots 5 à 7 (pilotage, commissions, apporteurs, courriers)
-- Appliquée par le serveur via gpf_exec_sql.

-- Coût mensuel des sources payantes (Meta, Masterleads…) pour la rentabilité par source.
create table if not exists gpf_source_costs (
  id uuid primary key default uuid_generate_v4(),
  source text not null,
  mois date not null,
  cout numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (source, mois)
);
alter table gpf_source_costs enable row level security;

-- Compagnies partenaires : mappage de bordereau mémorisé, contact, notes.
alter table gpf_insurers add column if not exists contact text;
alter table gpf_insurers add column if not exists telephone text;
alter table gpf_insurers add column if not exists notes text;
alter table gpf_insurers add column if not exists mapping jsonb;
alter table gpf_insurers add column if not exists actif boolean not null default true;
insert into gpf_insurers (nom) values
  ('Alptis'), ('April'), ('Generali'), ('Digital Insure'), ('Assurea'), ('Simulassur'), ('Ilona')
on conflict (nom) do nothing;

-- Règles de commission par compagnie et par produit.
create table if not exists gpf_commission_rules (
  id uuid primary key default uuid_generate_v4(),
  insurer_id uuid references gpf_insurers(id),
  produit text not null,
  mode text not null default 'precompte' check (mode in ('precompte', 'lineaire')),
  taux_annee1 numeric(6,3),
  taux_suivantes numeric(6,3),
  frais_dossier numeric(10,2),
  reprise_mois int,
  notes text,
  created_at timestamptz not null default now(),
  unique (insurer_id, produit)
);
alter table gpf_commission_rules enable row level security;

-- Bordereaux : fichier importé, état du traitement, statistiques de rapprochement.
alter table gpf_bordereaux alter column insurer_id drop not null;
alter table gpf_bordereaux add column if not exists fichier_nom text;
alter table gpf_bordereaux add column if not exists storage_path text;
alter table gpf_bordereaux add column if not exists import_statut text not null default 'a_verifier';
alter table gpf_bordereaux drop constraint if exists gpf_bordereaux_import_statut_check;
alter table gpf_bordereaux add constraint gpf_bordereaux_import_statut_check check (import_statut in ('a_verifier', 'valide', 'annule'));
alter table gpf_bordereaux add column if not exists mapping jsonb;
alter table gpf_bordereaux add column if not exists nb_lignes int not null default 0;
alter table gpf_bordereaux add column if not exists nb_rapprochees int not null default 0;
alter table gpf_bordereaux add column if not exists nb_ecarts int not null default 0;
alter table gpf_bordereaux add column if not exists nb_sans_contrat int not null default 0;
alter table gpf_bordereaux add column if not exists valide_at timestamptz;
alter table gpf_bordereaux add column if not exists annule_at timestamptz;

-- Lignes de commission : rapprochement, attendu vs reçu, rétrocession, décommission.
alter table gpf_commission_lines drop constraint if exists gpf_commission_lines_type_commission_check;
alter table gpf_commission_lines add constraint gpf_commission_lines_type_commission_check
  check (type_commission in ('nouvelle_affaire', 'recurrent_lineaire', 'frais_dossier', 'remuneration_apporteur', 'decommission'));
alter table gpf_commission_lines add column if not exists reference_contrat text;
alter table gpf_commission_lines add column if not exists date_effet date;
alter table gpf_commission_lines add column if not exists rapprochement text not null default 'sans_contrat';
alter table gpf_commission_lines drop constraint if exists gpf_commission_lines_rapprochement_check;
alter table gpf_commission_lines add constraint gpf_commission_lines_rapprochement_check check (rapprochement in ('rapproche', 'ecart', 'sans_contrat', 'ignore'));
alter table gpf_commission_lines add column if not exists montant_attendu numeric(12,2);
alter table gpf_commission_lines add column if not exists retrocession numeric(12,2);
alter table gpf_commission_lines add column if not exists net_cabinet numeric(12,2);
alter table gpf_commission_lines add column if not exists brut jsonb;
create index if not exists gpf_commission_lines_rapprochement_idx on gpf_commission_lines (rapprochement);

-- Apporteurs (agences immobilières, partenaires).
create table if not exists gpf_apporteurs (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  type text,
  contact_nom text,
  email text,
  telephone text,
  convention_signee boolean not null default false,
  date_convention date,
  taux_retrocession numeric(6,3),
  notes text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table gpf_apporteurs enable row level security;
insert into gpf_apporteurs (nom, type)
select 'Century 21', 'Agence immobilière'
where not exists (select 1 from gpf_apporteurs where nom = 'Century 21');

-- Courriers (lettres de résiliation…), générés depuis la fiche ou en lot.
create table if not exists gpf_courriers (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references gpf_clients(id),
  dossier_id uuid references gpf_dossiers(id),
  type text not null check (type in ('resiliation_lemoine', 'resiliation_echeance', 'resiliation_hamon', 'autre')),
  statut text not null default 'brouillon' check (statut in ('brouillon', 'pret', 'envoye')),
  donnees jsonb not null default '{}'::jsonb,
  document_id uuid references gpf_documents(id),
  envoye_at timestamptz,
  created_at timestamptz not null default now()
);
alter table gpf_courriers enable row level security;

-- Signature électronique (emplacement prévu : service à brancher plus tard).
alter table gpf_compliance add column if not exists signature_statut text;
alter table gpf_compliance add column if not exists signature_ref text;

-- Journal des accès aux documents (coffre-fort).
create table if not exists gpf_document_access (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references gpf_documents(id),
  action text not null default 'consultation',
  created_at timestamptz not null default now()
);
alter table gpf_document_access enable row level security;
