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

(async () => {
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

const built = {};
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
  built[name] = html;
}


// ---- Pages locales (Hauts-de-Seine) : la page « assurance emprunteur » du nouveau site, avec le contenu propre à chaque ville
const { CITIES_92 } = await import(require('node:url').pathToFileURL(path.join(ROOT, 'src', 'content', 'localSeo92.ts')).href);
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const VILLES = path.join(PAGES, 'villes');
fs.mkdirSync(VILLES, { recursive: true });
const bySlug = new Map(CITIES_92.map(c => [c.slug, c]));
const localPage = ({ file, route, title, description, eyebrow, heading, intro, extra }) => {
  let html = built['assurance-emprunteur'];
  const url = ORIGIN + route;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/"url":"[^"]*"/, `"url":"${url}"`)
    .replace(/"description":"[^"]*"/, `"description":"${esc(description)}"`);
  // Sur-titre du haut de page : « Assurance emprunteur · Antony »
  html = html.replace('<p class="eyebrow"><span></span>Assurance emprunteur</p>', `<p class="eyebrow"><span></span>${esc(eyebrow)}</p>`);
  const section = `<section class="section local-seo" id="pres-de-chez-vous"><div class="container simple-explainer"><p class="eyebrow"><span></span>Près de chez vous</p><h2>${heading}</h2><p class="section-intro">${intro}</p>${extra}</div></section>`;
  if (!html.includes('<section class="section insurance-simulator"')) throw new Error('simulateur introuvable dans la page locale');
  html = html.replace('<section class="section insurance-simulator"', section + '<section class="section insurance-simulator"');
  fs.writeFileSync(path.join(VILLES, file + '.html'), html);
};
const cityLink = c => `<a href="/assurance-de-pret/hauts-de-seine/${c.slug}">${esc(c.name)}</a>`;
localPage({
  file: 'hauts-de-seine', route: '/assurance-de-pret/hauts-de-seine',
  title: 'Assurance de prêt dans les Hauts-de-Seine (92) | GP Finances',
  description: 'Trouvez votre page locale GP Finances par ville des Hauts-de-Seine : accompagnement humain, comparaison des contrats et économies sur l’assurance emprunteur.',
  eyebrow: 'Assurance emprunteur · Hauts-de-Seine (92)',
  heading: 'Votre ville dans les Hauts-de-Seine',
  intro: 'Accompagnement humain, comparaison des contrats et démarches prises en charge, où que vous habitiez dans le 92. Choisissez votre ville :',
  extra: `<p class="city-links">${CITIES_92.map(cityLink).join('')}</p>`
});
for (const c of CITIES_92) {
  const near = c.nearby.map(n => { const hit = CITIES_92.find(x => x.name === n); return hit ? cityLink(hit) : `<span>${esc(n)}</span>`; }).join('');
  localPage({
    file: c.slug, route: `/assurance-de-pret/hauts-de-seine/${c.slug}`,
    title: `Assurance emprunteur à ${c.name} (${c.postalCode}) | GP Finances`,
    description: `GP Finances accompagne les emprunteurs à ${c.name} pour réduire le coût de l’assurance de prêt avec garanties équivalentes et gestion complète des démarches.`,
    eyebrow: `Assurance emprunteur · ${c.name}`,
    heading: `Assurance de prêt à ${esc(c.name)} (${esc(c.postalCode)})`,
    intro: esc(c.localPitch),
    extra: near ? `<p class="city-links-label">Nous accompagnons aussi les habitants de :</p><p class="city-links">${near}</p>` : ''
  });
}
console.log(`Pages locales : 1 page départementale + ${CITIES_92.length} villes`);

// avis Google et chiffres : données de la maquette servies telles quelles
fs.rmSync(TMP, { recursive: true, force: true });
fs.writeFileSync(path.join(OUT, 'routes.json'), JSON.stringify(ROUTES, null, 2));

if (errors.length) {
  console.error('\nProblèmes détectés :\n- ' + [...new Set(errors)].join('\n- '));
  process.exit(1);
}
const size = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => sum + (e.isDirectory() ? size(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`Site construit : ${Object.keys(ROUTES).length} pages, ${(size(OUT) / 1024 / 1024).toFixed(1)} Mo dans public/site/`);
})().catch(error => { console.error(error); process.exit(1); });
