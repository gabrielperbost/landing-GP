import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { GENERATED_MIGRATIONS } from "./migrations.generated";

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

export const GPF_MIGRATIONS: GpfMigration[] = GENERATED_MIGRATIONS;

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
