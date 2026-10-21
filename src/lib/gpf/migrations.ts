import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Migrations SQL versionnées, livrées avec le code et appliquées par le
 * serveur via la fonction gpf_exec_sql (créée une fois par la migration 005,
 * exécutable uniquement avec la clé service_role). Le texte SQL de chaque
 * migration est aussi conservé dans docs/gpf-crm/ pour relecture.
 *
 * Règles : chaque migration est rejouable (if not exists), RLS activée sur
 * toute nouvelle table, aucune vue sans security_invoker.
 */
export type GpfMigration = { name: string; description: string; sql: string };

export const GPF_MIGRATIONS: GpfMigration[] = [
  {
    name: "006",
    description: "Lot 2 : Affaires / Contrats (statut de contrat, dates), reprise Effectif → contrat actif, notifications",
    sql: `-- GPF CRM — Migration 006 : Lot 2 (Affaires / Contrats, notifications)
-- Appliquée par le serveur via gpf_exec_sql (voir src/lib/gpf/migrations.ts).

-- Un dossier signé devient un contrat : statut de contrat + dates de vie du contrat.
-- Les autres dossiers restent des affaires dans le pipeline commercial.
alter table gpf_dossiers add column if not exists contrat_statut text;
alter table gpf_dossiers drop constraint if exists gpf_dossiers_contrat_statut_check;
alter table gpf_dossiers add constraint gpf_dossiers_contrat_statut_check
  check (contrat_statut is null or contrat_statut in ('actif', 'a_relancer', 'resilie'));
alter table gpf_dossiers add column if not exists date_signature date;
alter table gpf_dossiers add column if not exists date_echeance date;
alter table gpf_dossiers add column if not exists date_resiliation date;
create index if not exists gpf_dossiers_contrat_statut_idx on gpf_dossiers (contrat_statut);

-- Reprise des données : Effectif (et Effectif en attente de règlement) => contrat actif.
update gpf_dossiers
set contrat_statut = 'actif'
where contrat_statut is null and statut in ('effectif', 'attente_reglement');

-- Centre de notifications.
create table if not exists gpf_notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  titre text not null,
  message text,
  lien text,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gpf_notifications_lu_idx on gpf_notifications (lu, created_at desc);
alter table gpf_notifications enable row level security;
`
  }
];

export async function migrationStatus() {
  const { error: execError } = await supabaseAdmin.rpc("gpf_exec_sql", { sql: "select 1" });
  const { data: applied } = await supabaseAdmin.from("gpf_schema_migrations").select("name, applied_at").order("name");
  const appliedNames = new Set((applied ?? []).map((m) => m.name));
  return {
    bootstrap: !execError,
    bootstrapError: execError?.message ?? null,
    applied: applied ?? [],
    pending: GPF_MIGRATIONS.filter((m) => !appliedNames.has(m.name)).map(({ name, description }) => ({ name, description }))
  };
}

export async function applyPendingMigrations() {
  const status = await migrationStatus();
  if (!status.bootstrap) return { ok: false as const, error: "bootstrap_absent", results: [] };
  const results: { name: string; ok: boolean; error?: string }[] = [];
  for (const { name } of status.pending) {
    const migration = GPF_MIGRATIONS.find((m) => m.name === name)!;
    const { error } = await supabaseAdmin.rpc("gpf_exec_sql", { sql: migration.sql });
    if (error) {
      results.push({ name, ok: false, error: error.message });
      break;
    }
    await supabaseAdmin.from("gpf_schema_migrations").insert({ name });
    results.push({ name, ok: true });
  }
  return { ok: results.every((r) => r.ok), results };
}
