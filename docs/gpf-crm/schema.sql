-- GPF CRM — schéma de base (Phase 1)
-- À exécuter dans l'éditeur SQL de Supabase (même projet que le reste du site).
-- Convention : tables préfixées "gpf_" pour ne jamais entrer en collision avec
-- les tables existantes (sessions, session_reminders, per_lead_ingestions...).

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Clients : une ligne par personne. Un dossier co-emprunteur relie deux clients
-- via gpf_dossiers.client_id / co_client_id, pas une table à part.
-- ---------------------------------------------------------------------------
create table if not exists gpf_clients (
  id uuid primary key default uuid_generate_v4(),
  civilite text,                 -- 'Madame' | 'Monsieur'
  prenom text not null,
  nom text not null,
  email text,
  telephone text,
  adresse text,
  ville text,
  code_postal text,
  annee_naissance int,
  profession text,
  fumeur boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gpf_clients_nom_idx on gpf_clients (lower(nom), lower(prenom));

-- ---------------------------------------------------------------------------
-- Assureurs : référentiel, alimenté au fil des bordereaux reçus.
-- ---------------------------------------------------------------------------
create table if not exists gpf_insurers (
  id uuid primary key default uuid_generate_v4(),
  nom text not null unique,          -- 'APRIL', 'Alptis', 'Assurea / Multi-Impact'...
  email_bordereaux text,             -- adresse expéditrice habituelle, pour le matching auto
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Dossiers : un par produit par client. C'est le cœur du pipeline.
-- Le statut peut repartir en arrière manuellement (ex. retour en attente_docs).
-- ---------------------------------------------------------------------------
create table if not exists gpf_dossiers (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references gpf_clients(id) on delete restrict,
  co_client_id uuid references gpf_clients(id) on delete restrict,

  produit text not null check (produit in (
    'assurance_emprunteur', 'per', 'assurance_vie', 'mutuelle', 'prevoyance', 'regroupement_credits'
  )),
  -- Pipeline repris du tableau Monday "Suivi des souscriptions" (en production,
  -- donc éprouvé) plutôt qu'un modèle générique. Un dossier peut revenir en
  -- arrière manuellement (ex. retour en attente_documents) à tout moment.
  statut text not null default 'a_traiter' check (statut in (
    'a_traiter', 'nrp', 'devis_a_realiser', 'devis_envoye', 'en_cours_souscription',
    'attente_accord_banque', 'attente_prise_effet', 'attente_reglement', 'attente_documents',
    'effectif', 'refuse', 'sans_suite'
  )),
  source text,                       -- 'Masterleads', 'Physique', 'Recommandation', 'Connaissance'...

  insurer_id uuid references gpf_insurers(id),
  reference_contrat text,            -- numéro de contrat chez l'assureur, si connu

  -- Champs prêt (assurance_emprunteur, regroupement_credits)
  montant_pret numeric(12,2),
  taux numeric(6,4),
  duree_mois int,
  date_effet date,

  -- Champs épargne (per, assurance_vie)
  placement_initial numeric(12,2),
  placement_mensuel numeric(12,2),
  frais_gestion_pct numeric(6,4),

  lien_dossier text,
  date_depot date,
  date_entree_attente_docs date,
  date_derniere_relance date,
  relances_envoyees int not null default 0,

  remuneration_apporteur_pct numeric(6,4),   -- part reversée à un apporteur, si applicable

  -- Repris tels quels de Monday lors de la migration (snapshot historique, pas
  -- encore relié à un vrai bordereau) : assureur en texte libre tant que
  -- gpf_insurers n'est pas peuplé/apparié, montants ponctuels observés.
  assureur_nom text,
  frais_dossier numeric(10,2),
  precompte_lineaire_1ere_annee numeric(10,2),
  lineaire_n1 numeric(10,2),
  frais_entree numeric(10,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gpf_dossiers_client_idx on gpf_dossiers (client_id);
create index if not exists gpf_dossiers_statut_idx on gpf_dossiers (statut);

-- ---------------------------------------------------------------------------
-- Documents attendus/reçus par dossier.
-- ---------------------------------------------------------------------------
create table if not exists gpf_documents (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid not null references gpf_dossiers(id) on delete cascade,
  type text not null check (type in ('cni', 'tableau_amortissement', 'offre_pret', 'autre')),
  recu boolean not null default false,
  lien text,
  date_reception date,
  created_at timestamptz not null default now()
);
create index if not exists gpf_documents_dossier_idx on gpf_documents (dossier_id);

-- ---------------------------------------------------------------------------
-- Historique des statuts : traçabilité de chaque changement.
-- ---------------------------------------------------------------------------
create table if not exists gpf_status_history (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid not null references gpf_dossiers(id) on delete cascade,
  ancien_statut text,
  nouveau_statut text not null,
  changed_at timestamptz not null default now(),
  note text
);
create index if not exists gpf_status_history_dossier_idx on gpf_status_history (dossier_id);

-- ---------------------------------------------------------------------------
-- Bordereaux reçus (un par assureur par envoi, parfois plusieurs mois d'un coup).
-- ---------------------------------------------------------------------------
create table if not exists gpf_bordereaux (
  id uuid primary key default uuid_generate_v4(),
  insurer_id uuid not null references gpf_insurers(id),
  numero_bordereau text,
  periode_debut date,
  periode_fin date,
  montant_total numeric(12,2),
  date_versement date,
  fichier_source text,               -- lien vers le PDF d'origine (stocké sur Supabase Storage)
  statut_traitement text not null default 'brut' check (statut_traitement in ('brut', 'valide')),
  created_at timestamptz not null default now()
);
create index if not exists gpf_bordereaux_insurer_idx on gpf_bordereaux (insurer_id);

-- ---------------------------------------------------------------------------
-- Lignes de commission extraites de chaque bordereau. Le rapprochement avec
-- un dossier se fait par nom (le numéro client de l'assureur n'est pas le
-- nôtre) : dossier_id reste nul tant que la ligne n'est pas rapprochée.
-- ---------------------------------------------------------------------------
create table if not exists gpf_commission_lines (
  id uuid primary key default uuid_generate_v4(),
  bordereau_id uuid not null references gpf_bordereaux(id) on delete cascade,
  dossier_id uuid references gpf_dossiers(id),

  client_nom_brut text not null,     -- tel qu'écrit sur le bordereau, pour le matching
  type_commission text not null check (type_commission in (
    'nouvelle_affaire', 'recurrent_lineaire', 'frais_dossier', 'remuneration_apporteur'
  )),
  periode_debut date,
  periode_fin date,
  base_commission numeric(12,2),     -- cotisation/prime encaissée servant de base
  taux numeric(6,4),
  montant numeric(12,2) not null,

  rapprochement_manuel boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gpf_commission_lines_bordereau_idx on gpf_commission_lines (bordereau_id);
create index if not exists gpf_commission_lines_dossier_idx on gpf_commission_lines (dossier_id);
create index if not exists gpf_commission_lines_nom_idx on gpf_commission_lines (lower(client_nom_brut));

-- ---------------------------------------------------------------------------
-- Tableaux d'amortissement (optionnel), pour projeter la fin du linéaire.
-- ---------------------------------------------------------------------------
create table if not exists gpf_amortization_schedules (
  id uuid primary key default uuid_generate_v4(),
  dossier_id uuid not null references gpf_dossiers(id) on delete cascade,
  mois date not null,                -- premier jour du mois concerné
  capital_restant_du numeric(12,2),
  created_at timestamptz not null default now()
);
create index if not exists gpf_amortization_dossier_idx on gpf_amortization_schedules (dossier_id);

-- ---------------------------------------------------------------------------
-- Sécurité : usage interne uniquement pour l'instant (vous seul). RLS activé
-- par précaution, accès via la clé service_role (déjà utilisée ailleurs sur
-- le site) depuis le serveur uniquement — jamais exposé côté navigateur.
-- ---------------------------------------------------------------------------
alter table gpf_clients enable row level security;
alter table gpf_dossiers enable row level security;
alter table gpf_documents enable row level security;
alter table gpf_status_history enable row level security;
alter table gpf_insurers enable row level security;
alter table gpf_bordereaux enable row level security;
alter table gpf_commission_lines enable row level security;
alter table gpf_amortization_schedules enable row level security;
-- Aucune policy "anon"/"authenticated" créée volontairement : seule la clé
-- service_role (utilisée côté serveur) peut lire/écrire pour l'instant.
