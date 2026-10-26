#!/usr/bin/env node
/* Contrôle des pages locales PER et assurance-vie (scripts/local-epargne.cjs), avant indexation :
 *   node scripts/check-landings-epargne.cjs
 *  1. Ressemblance entre chaque paire de pages (même produit, et PER / assurance-vie d'une même
 *     ville, et page assurance de prêt de la même ville) : shingles de 5 mots, indice de Jaccard,
 *     sur le contenu principal hors simulateur et bandeau d'avis. Seuil bloquant : 40 %.
 *  2. Part de contenu propre à la ville (balisé <!--LOCAL-->) : au moins 35 % des mots.
 *  3. Titres, descriptions et H1 uniques. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const PAGES = path.join(__dirname, '..', 'public', 'site', 'pages');
const DIRS = { per: 'villes-per', av: 'villes-assurance-vie' };
const SEUIL = 0.4, LOCAL_MIN = 0.35, K = 5;

const words = (h) => h.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ').toLowerCase().split(/[^a-zà-ÿ0-9’']+/).filter(Boolean);
const main = (html) => ((/<main id="main">([\s\S]*?)<\/main>/.exec(html) || [])[1] || '')
  .replace(/<section class="section (per-section|life-sim-section|insurance-simulator)"[\s\S]*?<\/section>/, '')
  .replace(/<section class="review-ticker"[\s\S]*?<\/section>/, '');
const shingles = (w) => { const s = new Set(); for (let i = 0; i + K <= w.length; i++) s.add(w.slice(i, i + K).join(' ')); return s; };
const jaccard = (a, b) => { let inter = 0; for (const x of a) if (b.has(x)) inter++; return inter / (a.size + b.size - inter || 1); };

const pages = [];
for (const [prod, dir] of Object.entries(DIRS)) {
  for (const f of fs.readdirSync(path.join(PAGES, dir))) {
    const html = fs.readFileSync(path.join(PAGES, dir, f), 'utf8');
    const m = main(html);
    const local = [...m.matchAll(/<!--LOCAL-->([\s\S]*?)<!--\/LOCAL-->/g)].map((x) => x[1]).join(' ');
    pages.push({ id: `${prod}/${f.replace('.html', '')}`, slug: f.replace('.html', ''), prod, html, w: words(m), sh: shingles(words(m)), localWords: words(local).length });
  }
}
const problems = [];
let maxPair = { v: 0 };
for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) {
  const v = jaccard(pages[i].sh, pages[j].sh);
  if (v > maxPair.v) maxPair = { v, a: pages[i].id, b: pages[j].id };
  if (v >= SEUIL) problems.push(`ressemblance ${(v * 100).toFixed(0)} % : ${pages[i].id} / ${pages[j].id}`);
}
// Comparaison avec la page assurance de prêt de la même ville.
let maxEmp = { v: 0 };
for (const p of pages) {
  const f = path.join(PAGES, 'villes', p.slug + '.html');
  if (!fs.existsSync(f)) continue;
  const v = jaccard(p.sh, shingles(words(main(fs.readFileSync(f, 'utf8')))));
  if (v > maxEmp.v) maxEmp = { v, a: p.id };
  if (v >= SEUIL) problems.push(`ressemblance ${(v * 100).toFixed(0)} % avec la page assurance de prêt : ${p.id}`);
}
for (const p of pages) {
  const part = p.localWords / p.w.length;
  console.log(`${p.id.padEnd(32)} ${String(p.w.length).padStart(5)} mots, ${(part * 100).toFixed(0)} % propres à la ville`);
  if (part < LOCAL_MIN) problems.push(`contenu local insuffisant (${(part * 100).toFixed(0)} %) : ${p.id}`);
}
for (const [label, re] of [['title', /<title>([^<]*)<\/title>/], ['description', /<meta name="description" content="([^"]*)"/], ['h1', /<h1>([\s\S]*?)<\/h1>/]]) {
  const seen = new Map();
  for (const p of pages) { const v = (re.exec(p.html) || [])[1]; if (seen.has(v)) problems.push(`${label} en double : ${p.id} / ${seen.get(v)}`); seen.set(v, p.id); }
}
console.log(`\nRessemblance maximale entre deux pages : ${(maxPair.v * 100).toFixed(0)} % (${maxPair.a} / ${maxPair.b})`);
console.log(`Ressemblance maximale avec la page assurance de prêt de la même ville : ${(maxEmp.v * 100).toFixed(0)} % (${maxEmp.a})`);
if (problems.length) { console.error('\nProblèmes :\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('Aucun problème bloquant.');
