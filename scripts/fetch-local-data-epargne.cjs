#!/usr/bin/env node
/* Données publiques INSEE pour les pages locales PER et assurance-vie (toutes les villes).
 *   node scripts/fetch-local-data-epargne.cjs
 * Source : API Melodi de l'INSEE (accès libre, sans clé) :
 *  - DS_FILOSOFI_CC : niveau de vie médian et taux de pauvreté (revenus 2023) ;
 *  - DS_RP_POPULATION_PRINC : population par tranche d'âge (recensement 2023).
 * Écrit src/content/localDataEpargne.json. Aucune valeur n'est estimée : une donnée absente
 * (secret statistique) reste null et n'est pas affichée. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'content', 'localDataEpargne.json');
const API = 'https://api.insee.fr/melodi/data';

// slug -> code géographique INSEE (COM : commune, ARM : arrondissement municipal de Paris)
const VILLES = {
  'boulogne-billancourt': 'COM-92012',
  'neuilly-sur-seine': 'COM-92051',
  'issy-les-moulineaux': 'COM-92040',
  'levallois-perret': 'COM-92044',
  courbevoie: 'COM-92026',
  'rueil-malmaison': 'COM-92063',
  'saint-cloud': 'COM-92064',
  'paris-15e': 'ARM-75115',
  'paris-16e': 'ARM-75116',
  'paris-17e': 'ARM-75117',
  'antony': 'COM-92002',
  'asnieres-sur-seine': 'COM-92004',
  'bagneux': 'COM-92007',
  'bois-colombes': 'COM-92009',
  'bourg-la-reine': 'COM-92014',
  'chatenay-malabry': 'COM-92019',
  'chatillon': 'COM-92020',
  'chaville': 'COM-92022',
  'clamart': 'COM-92023',
  'clichy': 'COM-92024',
  'colombes': 'COM-92025',
  'fontenay-aux-roses': 'COM-92032',
  'garches': 'COM-92033',
  'gennevilliers': 'COM-92036',
  'la-garenne-colombes': 'COM-92035',
  'le-plessis-robinson': 'COM-92060',
  'malakoff': 'COM-92046',
  'marnes-la-coquette': 'COM-92047',
  'meudon': 'COM-92048',
  'montrouge': 'COM-92049',
  'nanterre': 'COM-92050',
  'paris-10e': 'ARM-75110',
  'paris-11e': 'ARM-75111',
  'paris-12e': 'ARM-75112',
  'paris-13e': 'ARM-75113',
  'paris-14e': 'ARM-75114',
  'paris-18e': 'ARM-75118',
  'paris-19e': 'ARM-75119',
  'paris-1er': 'ARM-75101',
  'paris-20e': 'ARM-75120',
  'paris-2e': 'ARM-75102',
  'paris-3e': 'ARM-75103',
  'paris-4e': 'ARM-75104',
  'paris-5e': 'ARM-75105',
  'paris-6e': 'ARM-75106',
  'paris-7e': 'ARM-75107',
  'paris-8e': 'ARM-75108',
  'paris-9e': 'ARM-75109',
  'puteaux': 'COM-92062',
  'sceaux': 'COM-92071',
  'sevres': 'COM-92072',
  'suresnes': 'COM-92073',
  'vanves': 'COM-92075',
  'vaucresson': 'COM-92076',
  'ville-d-avray': 'COM-92077',
  'villeneuve-la-garenne': 'COM-92078'
};
const REFERENCES = { france: 'FRANCE-FM', 'hauts-de-seine': 'DEP-92', paris: 'DEP-75' };

const get = async (url) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
  }
  throw new Error('INSEE indisponible : ' + url);
};
const value = (o) => {
  const v = o && o.measures && o.measures.OBS_VALUE_NIVEAU;
  return v && typeof v.value === 'number' ? v.value : null;
};

async function filosofi(geo) {
  const d = await get(`${API}/DS_FILOSOFI_CC?GEO=2025-${geo}&maxResult=200`);
  const pick = (m) => value((d.observations || []).find((o) => o.dimensions.FILOSOFI_MEASURE === m));
  return { niveauVieMedian: pick('MED_SL'), tauxPauvrete: pick('PR_MD60') };
}

async function ages(geo) {
  const d = await get(`${API}/DS_RP_POPULATION_PRINC?GEO=2025-${geo}&maxResult=1000`);
  const obs = (d.observations || []).filter((o) => o.dimensions.TIME_PERIOD === '2023' && o.dimensions.SEX === '_T');
  const pop = (age) => value(obs.find((o) => o.dimensions.AGE === age));
  const total = pop('_T');
  const share = (...groups) => {
    const vals = groups.map(pop);
    return total && vals.every((v) => v != null) ? Math.round((vals.reduce((s, v) => s + v, 0) / total) * 1000) / 10 : null;
  };
  return { population2023: total, part40a64: share('Y40T54', 'Y55T64'), part65etPlus: share('Y_GE65') };
}

(async () => {
  const out = { retrievedAt: new Date().toISOString().slice(0, 10), sources: {
    revenus: 'INSEE, Filosofi 2023 (DS_FILOSOFI_CC, API Melodi)',
    ages: 'INSEE, recensement de la population 2023 (DS_RP_POPULATION_PRINC, API Melodi)'
  }, references: {}, villes: {} };
  for (const [key, geo] of Object.entries(REFERENCES)) out.references[key] = { geo, ...(await filosofi(geo)), ...(await ages(geo)) };
  for (const [slug, geo] of Object.entries(VILLES)) {
    out.villes[slug] = { geo, ...(await filosofi(geo)), ...(await ages(geo)) };
    console.log(slug, JSON.stringify(out.villes[slug]));
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log('Écrit', path.relative(ROOT, OUT));
})().catch((e) => { console.error(e); process.exit(1); });
