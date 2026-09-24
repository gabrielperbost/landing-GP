#!/usr/bin/env node
/* Construit le site GP FINANCES à partir de la maquette validée.
 *   node scripts/build-site.cjs
 * - régénère les pages en mode production (sans bandeau « aperçu », indexables) ;
 * - copie les ressources dans public/site/ ;
 * - écrit les pages dans public/site/pages/ avec des adresses propres et absolues ;
 * - contrôle que chaque fichier référencé existe.
 * Les routes (/, /assurance-emprunteur, …) sont branchées dans next.config.mjs (rewrites).
 * Une simple modification des pages se fait dans maquettes/gp-finances-2026-09-22/generer.cjs, puis on relance ce script. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'maquettes', 'gp-finances-2026-09-22');
const OUT = path.join(ROOT, 'public', 'site');
const PAGES = path.join(OUT, 'pages');
const TMP = path.join(ROOT, '.tmp-site-build');
const ORIGIN = 'https://gp-finances.fr';

// page source -> adresse publique. « /per » reste l'ancienne page de campagne PER : la nouvelle page est /per-retraite.
const ROUTES = {
  index: '/',
  'assurance-emprunteur': '/assurance-emprunteur',
  per: '/per-retraite',
  'assurance-vie': '/assurance-vie',
  prevoyance: '/prevoyance',
  mutuelle: '/mutuelle',
  'regroupement-credits': '/regroupement-credits',
  'mentions-legales': '/mentions-legales',
  confidentialite: '/politique-de-confidentialite'
};
const SHARED = [
  'assets', 'styles.css', 'social-proof.css', 'insurance-simulator.css', 'per-simulator.css', 'life-simulator.css',
  'app.js', 'reviews-carousel.js', 'live-counter.js', 'consent-tracking.js', 'borrower-references.js', 'insurance-quote.js',
  'per-calculator.js', 'per-projection.js', 'per-profile.js', 'per-simulator.js', 'life-calculator.js', 'life-simulator.js'
];

fs.rmSync(TMP, { recursive: true, force: true });
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(PAGES, { recursive: true });

execFileSync('node', [path.join(SRC, 'generer.cjs')], { env: { ...process.env, GP_PROD: '1', GP_OUT: TMP }, stdio: 'inherit' });

for (const item of SHARED) fs.cpSync(path.join(SRC, item), path.join(OUT, item), { recursive: true });

const errors = [];
const existsInSite = rel => fs.existsSync(path.join(OUT, rel.split('?')[0].split('#')[0]));
const ld = (title, description, route) => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FinancialService', name: 'GP FINANCES',
  url: ORIGIN + route, description, telephone: '+33651224213', email: 'gabriel.perbost@gp-finances.fr',
  address: { '@type': 'PostalAddress', streetAddress: '24 rue du Gouverneur Général Éboué', postalCode: '92130', addressLocality: 'Issy-les-Moulineaux', addressCountry: 'FR' },
  areaServed: 'FR', founder: { '@type': 'Person', name: 'Gabriel Perbost' }
});

for (const [name, route] of Object.entries(ROUTES)) {
  let html = fs.readFileSync(path.join(TMP, name + '.html'), 'utf8');

  // liens internes : page.html#ancre -> /route#ancre ; ressources -> /site/...
  html = html.replace(/(href|src)="([^"]*)"/g, (match, attr, value) => {
    if (/^(https?:|mailto:|tel:|data:|#|\/)/.test(value)) return match;
    const page = /^([a-z0-9-]+)\.html(#.*)?$/.exec(value);
    if (page) {
      const target = ROUTES[page[1]];
      if (!target) { errors.push(`${name}: lien vers une page inconnue « ${value} »`); return match; }
      return `${attr}="${target}${page[2] || ''}"`;
    }
    if (!existsInSite(value)) errors.push(`${name}: ressource introuvable « ${value} »`);
    return `${attr}="/site/${value}"`;
  });

  // adresse canonique, partage et données structurées
  const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || 'GP Finances';
  const description = (/<meta name="description" content="([^"]*)"/.exec(html) || [])[1] || '';
  const head = `<link rel="canonical" href="${ORIGIN}${route}"><meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="GP Finances"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${ORIGIN}${route}"><script type="application/ld+json">${ld(title, description, route)}</script>`;
  html = html.replace('</head>', head + '</head>');
  if (/Maquette|Aperçu privé|noindex/.test(html)) errors.push(`${name}: reste une trace de la maquette (Maquette / Aperçu privé / noindex)`);

  // vidéos de témoignages : fichiers attendus dans public/videos
  for (const m of html.matchAll(/data-video="https:\/\/gp-finances\.fr\/videos\/([^"]+)"/g)) {
    if (!fs.existsSync(path.join(ROOT, 'public', 'videos', m[1]))) errors.push(`${name}: vidéo manquante public/videos/${m[1]}`);
  }
  fs.writeFileSync(path.join(PAGES, name + '.html'), html);
}

// avis Google et chiffres : données de la maquette servies telles quelles
fs.rmSync(TMP, { recursive: true, force: true });
fs.writeFileSync(path.join(OUT, 'routes.json'), JSON.stringify(ROUTES, null, 2));

if (errors.length) {
  console.error('\nProblèmes détectés :\n- ' + [...new Set(errors)].join('\n- '));
  process.exit(1);
}
const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => sum + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`Site construit : ${Object.keys(ROUTES).length} pages, ${(size(OUT) / 1024 / 1024).toFixed(1)} Mo dans public/site/`);
