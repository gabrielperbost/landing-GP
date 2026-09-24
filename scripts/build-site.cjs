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


// Images de témoignages : PNG de 0,5 à 1,1 Mo -> JPEG légers (affichées à ~330 px, 2x pour les écrans Retina)
const { execFileSync: run } = require('node:child_process');
const swapped = [];
for (const file of fs.readdirSync(path.join(OUT, 'assets'))) {
  const full = path.join(OUT, 'assets', file);
  if (/^temoignage-.*\.png$/.test(file) && fs.statSync(full).size > 150 * 1024) {
    const jpg = full.replace(/\.png$/, '.jpg');
    run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '78', '-Z', '760', full, '--out', jpg], { stdio: 'ignore' });
    fs.rmSync(full);
    swapped.push(file);
  }
}

const errors = [];
const existsInSite = rel => {
  const clean = rel.split('?')[0].split('#')[0];
  return fs.existsSync(path.join(OUT, clean)) || (swapped.includes(path.basename(clean)) && fs.existsSync(path.join(OUT, clean.replace(/\.png$/, '.jpg'))));
};

// Titres et descriptions optimisés pour le référencement (le design des pages ne change pas).
const SEO = {
  index: ['GP Finances · Courtier en assurance de prêt, PER et épargne', 'Courtier indépendant à Issy-les-Moulineaux : assurance de prêt, PER, assurance-vie, prévoyance, mutuelle et regroupement de crédits. Étude sans engagement.'],
  'assurance-emprunteur': ['Assurance emprunteur : changez et économisez | GP Finances', 'Changez d’assurance de prêt à tout moment (loi Lemoine). Estimez votre économie en 2 minutes : je compare, je m’occupe des démarches et de la résiliation.'],
  per: ['PER : simulation d’économie d’impôt et conseil | GP Finances', 'Simulez l’économie d’impôt d’un Plan Épargne Retraite selon votre situation. Étude personnalisée avec un courtier indépendant, sans engagement.'],
  'assurance-vie': ['Assurance-vie : simuler et choisir avec un courtier | GP Finances', 'Simulez la croissance de votre capital en assurance-vie et faites-vous conseiller par un courtier indépendant : supports, frais, retraits, clause bénéficiaire.'],
  prevoyance: ['Prévoyance : protéger vos revenus et votre famille | GP Finances', 'Arrêt de travail, invalidité, décès : une prévoyance étudiée pour votre situation par un courtier indépendant. Étude personnalisée, sans engagement.'],
  mutuelle: ['Mutuelle santé : trouver la couverture adaptée | GP Finances', 'Trouvez l’équilibre entre vos besoins de santé, vos garanties et votre budget, avec un courtier indépendant. Étude personnalisée, sans engagement.'],
  'regroupement-credits': ['Regroupement de crédits : rééquilibrer votre budget | GP Finances', 'Faites étudier vos crédits et vos charges pour comprendre les possibilités de regroupement et leurs conséquences sur votre budget. Sans engagement.'],
  'mentions-legales': ['Mentions légales | GP Finances', 'Mentions légales du site gp-finances.fr : éditeur, immatriculations ORIAS, hébergement, propriété intellectuelle.'],
  confidentialite: ['Politique de confidentialité | GP Finances', 'Comment GP Finances traite vos données personnelles : finalités, base légale, destinataires, durées de conservation, cookies et droits.']
};
const NAMES = { index: 'Accueil', 'assurance-emprunteur': 'Assurance emprunteur', per: 'Plan Épargne Retraite', 'assurance-vie': 'Assurance-vie', prevoyance: 'Prévoyance', mutuelle: 'Mutuelle', 'regroupement-credits': 'Regroupement de crédits' };
const SAME_AS = [
  'https://www.google.com/maps/place/Gabriel+PERBOST+-+GP+FINANCES+-+Courtage+en+pr%C3%AAts+%26+assurances/@48.8266378,2.2708441,17z',
  'https://www.cncef.org/annuaire/perbost-gabriel/', 'https://www.linkedin.com/in/gabriel-perbost/', 'https://www.instagram.com/gabriel_perbost/'
];
const stripTags = v => v.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const faqSchema = html => {
  const items = [...html.matchAll(/<details><summary>(.*?)<span>\+<\/span><\/summary><p>(.*?)<\/p><\/details>/gs)]
    .map(m => ({ '@type': 'Question', name: stripTags(m[1]), acceptedAnswer: { '@type': 'Answer', text: stripTags(m[2]) } }))
    .filter(q => q.name && q.acceptedAnswer.text);
  return items.length >= 2 ? JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items }) : '';
};
const breadcrumbSchema = (name, route) => name && route !== '/' ? JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
  { '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name, item: ORIGIN + route }] }) : '';

const ld = (title, description, route) => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FinancialService', name: 'GP FINANCES',
  url: ORIGIN + route, description, telephone: '+33651224213', email: 'gabriel.perbost@gp-finances.fr',
  address: { '@type': 'PostalAddress', streetAddress: '24 rue du Gouverneur Général Éboué', postalCode: '92130', addressLocality: 'Issy-les-Moulineaux', addressCountry: 'FR' },
  areaServed: 'FR', founder: { '@type': 'Person', name: 'Gabriel Perbost' },
  identifier: 'ORIAS 23003789', sameAs: SAME_AS, hasMap: SAME_AS[0], geo: { '@type': 'GeoCoordinates', latitude: 48.8266378, longitude: 2.2708441 },
  image: ORIGIN + '/site/assets/gabriel-perbost.jpeg', knowsAbout: ['assurance emprunteur', 'plan épargne retraite', 'assurance-vie', 'prévoyance', 'mutuelle', 'regroupement de crédits']
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

  // titre et description optimisés
  if (SEO[name]) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${SEO[name][0]}</title>`).replace(/(<meta name="description" content=")[^"]*(")/, `$1${SEO[name][1]}$2`);
  }
  // adresse canonique, partage et données structurées
  const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || 'GP Finances';
  const description = (/<meta name="description" content="([^"]*)"/.exec(html) || [])[1] || '';
  const head = `<link rel="canonical" href="${ORIGIN}${route}"><meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="GP Finances"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${ORIGIN}${route}"><script type="application/ld+json">${ld(title, description, route)}</script>${breadcrumbSchema(NAMES[name], route) ? `<script type="application/ld+json">${breadcrumbSchema(NAMES[name], route)}</script>` : ''}${faqSchema(html) ? `<script type="application/ld+json">${faqSchema(html)}</script>` : ''}`;
  html = html.replace('</head>', head + '</head>');
  if (/Maquette|Aperçu privé|noindex/.test(html)) errors.push(`${name}: reste une trace de la maquette (Maquette / Aperçu privé / noindex)`);

  // vidéos de témoignages : fichiers attendus dans public/videos
  for (const m of html.matchAll(/data-video="https:\/\/gp-finances\.fr\/videos\/([^"]+)"/g)) {
    if (!fs.existsSync(path.join(ROOT, 'public', 'videos', m[1]))) errors.push(`${name}: vidéo manquante public/videos/${m[1]}`);
  }
  for (const file of swapped) html = html.split('/site/assets/' + file).join('/site/assets/' + file.replace(/\.png$/, '.jpg'));
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
