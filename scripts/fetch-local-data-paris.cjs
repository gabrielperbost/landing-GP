#!/usr/bin/env node
/* Même méthodologie que scripts/fetch-local-data.cjs (92), pour les arrondissements de Paris
 * migrés dans src/content/villes/ (departement "75") : base DVF (DGFiP, data.gouv.fr), ventes
 * 2024-2025, un seul lot par mutation. Code INSEE d'un arrondissement = "751" + les 2 derniers
 * chiffres du code postal (75015 -> 75115) — convention INSEE pour Paris.
 * Résultat : src/content/localDataParis.json (même structure que localData92.json).
 *   node scripts/fetch-local-data-paris.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const YEARS = [2024, 2025];

function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const median = list => { const a = [...list].sort((x, y) => x - y); const m = a.length >> 1; return a.length ? (a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2) : null; };

function analyse(rows) {
  const head = rows[0]; const col = Object.fromEntries(head.map((n, i) => [n, i]));
  const byMutation = new Map();
  for (const r of rows.slice(1)) {
    if (r[col.nature_mutation] !== 'Vente') continue;
    const id = r[col.id_mutation];
    if (!byMutation.has(id)) byMutation.set(id, []);
    byMutation.get(id).push(r);
  }
  const flats = [], houses = [];
  for (const group of byMutation.values()) {
    const locals = group.filter(r => ['Appartement', 'Maison', 'Local industriel. commercial ou assimilé'].includes(r[col.type_local]));
    if (locals.length !== 1) continue;
    const r = locals[0]; const price = Number(r[col.valeur_fonciere]); const area = Number(r[col.surface_reelle_bati]);
    if (!(price > 20000) || !(area >= 9)) continue;
    const perM2 = price / area;
    if (perM2 < 1500 || perM2 > 25000) continue;
    (r[col.type_local] === 'Appartement' ? flats : r[col.type_local] === 'Maison' ? houses : []).push({ price, area, perM2 });
  }
  const summary = list => ({ sales: list.length, medianPerM2: list.length ? Math.round(median(list.map(x => x.perM2))) : null, medianPrice: list.length ? Math.round(median(list.map(x => x.price))) : null, medianArea: list.length ? Math.round(median(list.map(x => x.area))) : null });
  return { flats: summary(flats), houses: summary(houses) };
}

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { const res = await fetch(url, { redirect: 'follow' }); if (!res.ok) throw new Error(String(res.status)); return res.text(); }
    catch (error) { if (attempt === 3) throw new Error(`${url} : ${error.message}`); await new Promise(r => setTimeout(r, 800 * attempt)); }
  }
}

(async () => {
  const { VILLES } = await import(require('node:url').pathToFileURL(path.join(ROOT, 'src', 'content', 'villes', 'index.ts')).href);
  const arrondissements = VILLES.filter(v => v.departement === '75');
  if (!arrondissements.length) { console.log('Aucun arrondissement migré (departement "75") dans src/content/villes/.'); return; }

  const out = { retrievedAt: new Date().toISOString().slice(0, 10), years: YEARS, sources: { prices: 'DGFiP, base DVF (Demandes de valeurs foncières), data.gouv.fr' }, cities: {} };
  for (const v of arrondissements) {
    const cp = v.codesPostaux[0];
    const insee = '751' + cp.slice(3);
    const rows = [];
    for (const year of YEARS) rows.push(...parseCsv(await get(`https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/communes/75/${insee}.csv`)).slice(rows.length ? 1 : 0));
    const stats = analyse(rows);
    out.cities[v.slug] = { insee, ...stats };
    console.log(`${v.nom.padEnd(20)} appart. ${String(stats.flats.sales).padStart(5)} ventes, ${stats.flats.medianPerM2} €/m², prix médian ${stats.flats.medianPrice} € (${stats.flats.medianArea} m²) | maisons ${stats.houses.sales} ventes`);
  }
  fs.writeFileSync(path.join(ROOT, 'src', 'content', 'localDataParis.json'), JSON.stringify(out, null, 1));
  console.log('Écrit : src/content/localDataParis.json');
})().catch(error => { console.error(error); process.exit(1); });
