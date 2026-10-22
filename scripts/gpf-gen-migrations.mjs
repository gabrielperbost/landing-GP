#!/usr/bin/env node
// Copie les migrations docs/gpf-crm/migration-0NN-*.sql (à partir de 006) dans
// src/lib/gpf/migrations.generated.ts, pour que le SQL relu dans docs/ et le
// SQL appliqué par le serveur soient toujours identiques.
// Usage : node scripts/gpf-gen-migrations.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dir = path.join(root, "docs/gpf-crm");
const files = fs
  .readdirSync(dir)
  .map((f) => ({ f, m: f.match(/^migration-(\d{3})-(.+)\.sql$/) }))
  .filter((x) => x.m && Number(x.m[1]) >= 6)
  .sort((a, b) => a.m[1].localeCompare(b.m[1]));

const entries = files.map(({ f, m }) => {
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  const description = (sql.split("\n")[0] ?? "").replace(/^--\s*GPF CRM\s*—\s*/, "").trim();
  return `  {\n    name: ${JSON.stringify(m[1])},\n    description: ${JSON.stringify(description)},\n    sql: ${JSON.stringify(sql)}\n  }`;
});

const out = `// Fichier généré par scripts/gpf-gen-migrations.mjs — ne pas modifier à la main.
import type { GpfMigration } from "./migrations";

export const GENERATED_MIGRATIONS: GpfMigration[] = [
${entries.join(",\n")}
];
`;
fs.writeFileSync(path.join(root, "src/lib/gpf/migrations.generated.ts"), out);
console.log(`${files.length} migration(s) : ${files.map((x) => x.m[1]).join(", ")}`);
