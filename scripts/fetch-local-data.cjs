#!/usr/bin/env node
/* Récupère, pour chaque commune des Hauts-de-Seine, des données publiques et vérifiables :
 *  - population et code INSEE : API Géo (geo.api.gouv.fr, données INSEE) ;
 *  - prix de l'immobilier : base DVF « Demandes de valeurs foncières » (DGFiP, publiée sur data.gouv.fr).
 * Résultat : src/content/localData92.json (instantané daté, à relancer une fois par an).
 *   node scripts/fetch-local-data.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const YEARS = [2024, 2025];
const norm = v => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

// Ventes d'un seul bien (un appartement ou une maison) : les ventes de plusieurs lots sont écartées pour ne pas fausser le prix au m².
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

async function get(url, type = 'text') {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { const res = await fetch(url, { redirect: 'follow' }); if (!res.ok) throw new Error(res.status); return type === 'json' ? res.json() : res.text(); }
    catch (error) { if (attempt === 3) throw new Error(`${url} : ${error.message}`); await new Promise(r => setTimeout(r, 800 * attempt)); }
  }
}

(async () => {
  const cities = (await import(require('node:url').pathToFileURL(path.join(ROOT, 'src', 'content', 'localSeo92.ts')).href)).CITIES_92;
  const communes = await get('https://geo.api.gouv.fr/communes?codeDepartement=92&fields=nom,code,population,codesPostaux&format=json', 'json');
  const byName = new Map(communes.map(c => [norm(c.nom), c]));
  const out = { retrievedAt: new Date().toISOString().slice(0, 10), years: YEARS, sources: { population: 'INSEE, via API Géo (geo.api.gouv.fr)', prices: 'DGFiP, base DVF (Demandes de valeurs foncières), data.gouv.fr' }, cities: {} };
  const missing = [];
  for (const city of cities) {
    const commune = byName.get(norm(city.name)) || byName.get(city.slug);
    if (!commune) { missing.push(city.name); continue; }
    const rows = [];
    for (const year of YEARS) rows.push(...parseCsv(await get(`https://files.data.gouv.fr/geo-dvf/latest/csv/${year}/communes/92/${commune.code}.csv`)).slice(rows.length ? 1 : 0));
    const stats = analyse(rows);
    out.cities[city.slug] = { insee: commune.code, population: commune.population, ...stats };
    console.log(`${city.name.padEnd(28)} ${String(commune.population).padStart(7)} hab. | appart. ${String(stats.flats.sales).padStart(4)} ventes, ${stats.flats.medianPerM2} €/m² | maisons ${stats.houses.sales}, ${stats.houses.medianPrice} €`);
  }
  if (missing.length) console.log('Communes non trouvées :', missing.join(', '));
  fs.writeFileSync(path.join(ROOT, 'src', 'content', 'localData92.json'), JSON.stringify(out, null, 1));
  console.log('Écrit : src/content/localData92.json');
})().catch(error => { console.error(error); process.exit(1); });
