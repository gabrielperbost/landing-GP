#!/usr/bin/env node
// Vérifie que chaque adresse /api/gpf/... appelée dans le code du CRM
// correspond à une route existante (src/app/api/gpf/**/route.ts).
// Usage : node scripts/gpf-check-api-routes.mjs  (code de sortie 1 si une adresse est inconnue)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

// Routes existantes, segments dynamiques [x] remplacés par un joker.
const apiDir = path.join(root, "src/app/api/gpf");
const routePaths = walk(apiDir)
  .filter((f) => f.endsWith("route.ts"))
  .map((f) => "/api/gpf" + path.dirname(f).slice(apiDir.length).split(path.sep).join("/"));
const routes = routePaths.map((r) => new RegExp("^" + r.replace(/\[[^\]]+\]/g, "[^/]+") + "$"));

const sources = [path.join(root, "src/app/gpf"), path.join(root, "src/components/gpf")].flatMap(walk).filter((f) => /\.tsx?$/.test(f));
let bad = 0;
for (const file of sources) {
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/["'`](\/api\/gpf\/[^"'`?#\s]*)/g)) {
    const url = m[1].replace(/\$\{[^}]+\}/g, "X").replace(/\/$/, "");
    // Adresse construite avec des variables : chaque ${…} peut valoir n'importe quel segment.
    const tpl = new RegExp("^" + m[1].replace(/\/$/, "").replace(/[.*+?^()|\\]/g, "\\$&").replace(/\$\{[^}]+\}/g, "[^/]+") + "$");
    if (!routes.some((r) => r.test(url)) && !routePaths.some((rp) => tpl.test(rp))) {
      bad++;
      console.log(`${path.relative(root, file)} → ${m[1]}`);
    }
  }
}
console.log(bad ? `${bad} adresse(s) d'API inconnue(s).` : "Toutes les adresses d'API correspondent à une route.");
process.exit(bad ? 1 : 0);
