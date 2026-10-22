import "server-only";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { supabaseAdmin } from "@/lib/supabase";

// Toutes les tables du CRM (les nouvelles tables des lots suivants s'ajoutent ici).
export const GPF_BACKUP_TABLES = [
  "gpf_clients",
  "gpf_insurers",
  "gpf_dossiers",
  "gpf_documents",
  "gpf_status_history",
  "gpf_bordereaux",
  "gpf_commission_lines",
  "gpf_amortization_schedules",
  "gpf_activity_log",
  "gpf_merges",
  "gpf_schema_migrations",
  "gpf_notifications",
  "gpf_notes",
  "gpf_tasks",
  "gpf_appointments",
  "gpf_calls",
  "gpf_compliance",
  "gpf_source_costs",
  "gpf_commission_rules",
  "gpf_apporteurs",
  "gpf_courriers",
  "gpf_document_access",
  "gpf_apporteur_paiements"
];

const MAGIC = Buffer.from("GPFB1");

async function exportTable(table: string) {
  const rows: unknown[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabaseAdmin.from(table).select("*").range(from, from + pageSize - 1);
    if (error) return { rows, error: error.message };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return { rows, error: null };
}

/**
 * Export complet des tables GPF, compressé (gzip) puis chiffré en AES-256-GCM
 * avec GPF_BACKUP_KEY (64 caractères hexadécimaux). Format du fichier :
 * "GPFB1" + IV (12 octets) + tag (16 octets) + données chiffrées.
 * Les fichiers déposés (CNI, offres de prêt…) restent dans Supabase Storage et
 * ne sont pas inclus : seule leur liste l'est.
 */
export async function buildEncryptedBackup() {
  const keyHex = process.env.GPF_BACKUP_KEY?.trim() ?? "";
  if (!/^[0-9a-f]{64}$/i.test(keyHex)) throw new Error("GPF_BACKUP_KEY absente ou invalide");

  const tables: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const table of GPF_BACKUP_TABLES) {
    const { rows, error } = await exportTable(table);
    tables[table] = rows;
    counts[table] = rows.length;
    if (error) errors[table] = error;
  }

  const payload = JSON.stringify({ version: 1, createdAt: new Date().toISOString(), counts, errors, tables });
  const gz = zlib.gzipSync(Buffer.from(payload, "utf8"));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(keyHex, "hex"), iv);
  const encrypted = Buffer.concat([cipher.update(gz), cipher.final()]);
  const file = Buffer.concat([MAGIC, iv, cipher.getAuthTag(), encrypted]);

  return { file, counts, errors };
}
