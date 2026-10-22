-- GPF CRM — Migration 009 : Lot 7 (paiements aux apporteurs, journal d'activité étendu)
-- Appliquée par le serveur via gpf_exec_sql.

-- Rétrocessions effectivement reversées aux apporteurs, par mois.
create table if not exists gpf_apporteur_paiements (
  id uuid primary key default uuid_generate_v4(),
  apporteur_id uuid not null references gpf_apporteurs(id),
  mois date not null,
  montant numeric(12,2) not null,
  paye_le date not null default current_date,
  reference text,
  created_at timestamptz not null default now(),
  unique (apporteur_id, mois)
);
alter table gpf_apporteur_paiements enable row level security;

-- Le journal d'activité couvre aussi les apporteurs et les courriers.
alter table gpf_activity_log drop constraint if exists gpf_activity_log_entity_type_check;
alter table gpf_activity_log add constraint gpf_activity_log_entity_type_check
  check (entity_type in ('client', 'dossier', 'document', 'apporteur', 'courrier'));
