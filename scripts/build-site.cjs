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
  'webinaire-per': '/webinaire-per',
  'webinaire-per-desinscription': '/webinaire-per/desinscription',
  'nous-trouver': '/nous-trouver',
  'mentions-legales': '/mentions-legales',
  confidentialite: '/politique-de-confidentialite'
};
const SHARED = [
  'assets', 'styles.css', 'social-proof.css', 'insurance-simulator.css', 'per-simulator.css', 'life-simulator.css',
  'app.js', 'reviews-carousel.js', 'live-counter.js', 'consent-tracking.js', 'lead-popup.js', 'webinar-per-signup.js', 'borrower-references.js', 'insurance-quote.js',
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
  'assurance-emprunteur': ['Assurance de prêt : changer d’assurance emprunteur | GP Finances', 'Assurance de prêt immobilier : changez d’assurance emprunteur à tout moment (loi Lemoine) et estimez votre économie en 2 minutes. Courtier indépendant, démarches et résiliation prises en charge.'],
  per: ['PER : simulation d’économie d’impôt et conseil | GP Finances', 'Simulez l’économie d’impôt d’un Plan Épargne Retraite selon votre situation. Étude personnalisée avec un courtier indépendant, sans engagement.'],
  'assurance-vie': ['Assurance-vie : simuler et choisir avec un courtier | GP Finances', 'Simulez la croissance de votre capital en assurance-vie et faites-vous conseiller par un courtier indépendant : supports, frais, retraits, clause bénéficiaire.'],
  prevoyance: ['Prévoyance : protéger vos revenus et votre famille | GP Finances', 'Arrêt de travail, invalidité, décès : une prévoyance étudiée pour votre situation par un courtier indépendant. Étude personnalisée, sans engagement.'],
  mutuelle: ['Mutuelle santé : trouver la couverture adaptée | GP Finances', 'Trouvez l’équilibre entre vos besoins de santé, vos garanties et votre budget, avec un courtier indépendant. Étude personnalisée, sans engagement.'],
  'regroupement-credits': ['Regroupement de crédits : rééquilibrer votre budget | GP Finances', 'Regroupement de crédit : faites étudier vos crédits et vos charges pour comprendre les possibilités de regroupement et leurs conséquences sur votre budget. Sans engagement.'],
  'webinaire-per': ['Webinaire PER gratuit : comprendre et optimiser votre retraite | GP Finances', 'Webinaire gratuit et en direct pour comprendre le PER et estimer votre économie d’impôt. Dimanche 11 octobre 2026, 15h00. Sans engagement.'],
  'webinaire-per-desinscription': ['Désinscription webinaire | GP Finances', 'Désinscription du webinaire PER GP Finances.'],
  'nous-trouver': ['Où nous trouver : cabinet de courtage à Issy-les-Moulineaux | GP Finances', 'Adresse, plan d’accès, téléphone et prise de rendez-vous de GP Finances, courtier en assurance de prêt, PER et mutuelle à Issy-les-Moulineaux (92), ou en visio.'],
  'mentions-legales': ['Mentions légales | GP Finances', 'Mentions légales du site gp-finances.fr : éditeur, immatriculations ORIAS, hébergement, propriété intellectuelle.'],
  confidentialite: ['Politique de confidentialité | GP Finances', 'Comment GP Finances traite vos données personnelles : finalités, base légale, destinataires, durées de conservation, cookies et droits.']
};
const NAMES = { index: 'Accueil', 'assurance-emprunteur': 'Assurance emprunteur', per: 'Plan Épargne Retraite', 'assurance-vie': 'Assurance-vie', prevoyance: 'Prévoyance', mutuelle: 'Mutuelle', 'webinaire-per': 'Webinaire PER', 'nous-trouver': 'Nous trouver', 'regroupement-credits': 'Regroupement de crédits' };
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

// Rubrique « Conseils » : uniquement les articles publiés (published: true dans maquettes/.../articles/).
const ARTICLES = require(path.join(SRC, 'articles', 'index.cjs')).filter(a => a.published);
const CAT_NAME = { 'assurance-emprunteur': 'Assurance de prêt', per: 'PER', 'assurance-vie': 'Assurance-vie', prevoyance: 'Prévoyance', mutuelle: 'Mutuelle', 'regroupement-credits': 'Regroupement de crédits' };
const ARTICLE_BY_NAME = new Map();
if (ARTICLES.length) {
  ROUTES.conseils = '/conseils';
  SEO.conseils = ['Conseils : assurance de prêt, PER, assurance-vie, mutuelle | GP Finances', 'Guides pratiques de GP Finances : assurance de prêt, PER, assurance-vie, prévoyance, mutuelle et regroupement de crédits.'];
  for (const a of ARTICLES) {
    ROUTES['conseil-' + a.slug] = '/conseils/' + a.slug;
    SEO['conseil-' + a.slug] = [a.seoTitle + ' | GP Finances', a.description];
    ARTICLE_BY_NAME.set('conseil-' + a.slug, a);
  }
}
const articleSchemas = (a, route) => [
  JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.description, datePublished: a.updated, dateModified: a.updated,
    author: { '@type': 'Person', name: 'Gabriel Perbost', jobTitle: 'Courtier indépendant', url: ORIGIN + '/nous-trouver' },
    publisher: { '@type': 'Organization', name: 'GP Finances', url: ORIGIN }, mainEntityOfPage: ORIGIN + route,
    image: ORIGIN + '/site/assets/gabriel-perbost.jpeg', inLanguage: 'fr-FR' }),
  JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Conseils', item: ORIGIN + '/conseils' },
    { '@type': 'ListItem', position: 3, name: a.title, item: ORIGIN + route }] })
];
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

  if (name === 'assurance-emprunteur') html = html.replace('<p class="eyebrow"><span></span>Assurance emprunteur</p>', '<p class="eyebrow"><span></span>Assurance de prêt · Assurance emprunteur</p>');
  // titre et description optimisés
  if (SEO[name]) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${SEO[name][0]}</title>`).replace(/(<meta name="description" content=")[^"]*(")/, `$1${SEO[name][1]}$2`);
  }
  // adresse canonique, partage et données structurées
  const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || 'GP Finances';
  const description = (/<meta name="description" content="([^"]*)"/.exec(html) || [])[1] || '';
  const head = `<link rel="canonical" href="${ORIGIN}${route}"><meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="GP Finances"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${ORIGIN}${route}"><script type="application/ld+json">${ld(title, description, route)}</script>${breadcrumbSchema(NAMES[name], route) ? `<script type="application/ld+json">${breadcrumbSchema(NAMES[name], route)}</script>` : ''}${faqSchema(html) ? `<script type="application/ld+json">${faqSchema(html)}</script>` : ''}${ARTICLE_BY_NAME.has(name) ? articleSchemas(ARTICLE_BY_NAME.get(name), route).map(j => `<script type="application/ld+json">${j}</script>`).join('') : ''}${name === 'conseils' ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Conseils', item: ORIGIN + '/conseils' }] })}</script>` : ''}`;
  html = html.replace('</head>', head + '</head>');
  if (/Maquette|Aperçu privé|noindex/.test(html)) errors.push(`${name}: reste une trace de la maquette (Maquette / Aperçu privé / noindex)`);

  // vidéos de témoignages : fichiers attendus dans public/videos
  for (const m of html.matchAll(/data-video="https:\/\/gp-finances\.fr\/videos\/([^"]+)"/g)) {
    if (!fs.existsSync(path.join(ROOT, 'public', 'videos', m[1]))) errors.push(`${name}: vidéo manquante public/videos/${m[1]}`);
  }
  for (const file of swapped) html = html.split('/site/assets/' + file).join('/site/assets/' + file.replace(/\.png$/, '.jpg'));
  if (ARTICLE_BY_NAME.has(name)) { fs.mkdirSync(path.join(PAGES, 'conseils'), { recursive: true }); fs.writeFileSync(path.join(PAGES, 'conseils', name.replace(/^conseil-/, '') + '.html'), html); }
  else fs.writeFileSync(path.join(PAGES, name + '.html'), html);
  built[name] = html;
}


// ---- Pages locales (assurance emprunteur, par ville) : la page « assurance emprunteur » du
// nouveau site, complétée de données publiques propres à chaque ville. Pour les villes qui ont
// un fichier src/content/villes/{slug}.ts (modèle VilleData : angle éditorial, FAQ locale avec
// sources, quartiers réels…), ce contenu enrichi remplace la section générée automatiquement ;
// les autres villes gardent le comportement existant (tuiles chiffrées + FAQ calculée).
const { CITIES_92 } = await import(require('node:url').pathToFileURL(path.join(ROOT, 'src', 'content', 'localSeo92.ts')).href);
const LOCAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'content', 'localData92.json'), 'utf8'));
const { VILLES: VILLES_DATA } = await import(require('node:url').pathToFileURL(path.join(ROOT, 'src', 'content', 'villes', 'index.ts')).href);
const VILLE_BY_SLUG = new Map(VILLES_DATA.map(v => [v.slug, v]));
const { nonBreakingName } = await import(require('node:url').pathToFileURL(path.join(ROOT, 'src', 'lib', 'text.ts')).href);
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = new Intl.NumberFormat('fr-FR');
const num = v => nf.format(Math.round(v)).replace(/[  ]/g, '&nbsp;');
const eur = v => num(v) + '&nbsp;€';
const plain = html => html.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const VILLES = path.join(PAGES, 'villes');
fs.mkdirSync(VILLES, { recursive: true });

// FAQ générales (questions non spécifiques à une ville) : un pool plus large que ce qui est
// affiché, pour qu'un sous-ensemble tournant (3-4 questions) varie d'une ville à l'autre plutôt
// que de répéter toujours les mêmes questions sur les 36 pages.
const GENERAL_FAQ_POOL = [
  { q: 'Puis-je changer d’assurance de prêt à tout moment ?', a: 'Oui. Depuis la loi Lemoine (2022), vous pouvez résilier l’assurance de votre prêt immobilier quand vous le souhaitez, sans attendre une date anniversaire.' },
  { q: 'Le changement d’assurance a-t-il un coût ?', a: 'Non, c’est gratuit. Votre banque ne peut pas non plus modifier le taux de votre crédit parce que vous changez d’assurance.' },
  { q: 'Ma banque peut-elle refuser le nouveau contrat ?', a: 'Seulement si les garanties proposées ne sont pas équivalentes à celles exigées initialement. Je vérifie cette équivalence avant toute demande, pour éviter un refus.' },
  { q: 'Le questionnaire de santé est-il toujours nécessaire ?', a: 'Pas toujours : il est supprimé si la part assurée est inférieure à 200 000 € par personne et que le prêt se termine avant vos 60 ans.' },
  { q: 'Dois-je prévenir ma banque moi-même ?', a: 'Non, je m’occupe de toutes les démarches, y compris de la résiliation de votre ancien contrat auprès de votre banque.' },
  { q: 'Les garanties restent-elles les mêmes ?', a: 'Je ne propose que des contrats avec des garanties équivalentes ou supérieures à celles de votre contrat actuel.' },
  { q: 'Combien de temps prend le changement ?', a: 'Votre banque a 10 jours ouvrés pour répondre à la demande une fois le dossier complet envoyé.' },
  { q: 'Puis-je changer si mon prêt est déjà ancien ?', a: 'Oui, l’ancienneté du prêt n’a aucune incidence : le droit au changement s’applique à tout moment, quelle que soit la date de signature.' }
];
const slugSum = slug => [...slug].reduce((s, ch) => s + ch.charCodeAt(0), 0);
// Intertitres/connecteurs à variantes (brief : « varie aussi l'ordre des sections et les
// intertitres d'une page à l'autre »). Choisis par ville via un hash du slug, pour que le même
// texte ne se répète pas mot pour mot sur les 36+ pages.
const PHRASES = {
  // H2 de la section « exemple de financement », pensé bénéfice (pas une répétition du H1).
  whyReviewHeading: name => [`Pourquoi revoir votre assurance de prêt à ${name}`, `Ce que change une assurance de prêt mieux choisie à ${name}`, `Votre assurance de prêt à ${name}, en clair`],
  financingTitle: name => [`Un exemple de financement à ${name}`, `Ce que représente un achat à ${name}`, `Simulation chiffrée pour un achat à ${name}`],
  faqTitle: name => [`Vos questions à ${name}`, `Questions fréquentes à ${name}`, `Ce qu’on me demande souvent à ${name}`],
  nearbyLead: () => ['J’accompagne aussi les habitants de :', 'Je suis aussi présent auprès des emprunteurs de :', 'Vous habitez plutôt par ici ? Voir aussi :']
};
const phrase = (key, slug, ...args) => { const options = PHRASES[key](...args); return options[slugSum(slug) % options.length]; };
const rotatingGeneralFaq = (slug, count = 4) => {
  const sum = slugSum(slug);
  const start = sum % GENERAL_FAQ_POOL.length;
  return Array.from({ length: count }, (_, i) => GENERAL_FAQ_POOL[(start + i) % GENERAL_FAQ_POOL.length]);
};
const YEARS_TEXT = LOCAL.years.join(' et ');
const RETRIEVED = new Date(LOCAL.retrievedAt + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
// Nombre de ventes minimum, sous la base DVF, pour qu'un chiffre (tuile ou exemple de
// financement) soit considéré assez fiable pour être affiché — même règle pour le 92 et pour
// Paris, pour les appartements comme pour les maisons. En dessous, la donnée est traitée comme
// absente (voir localData.js) plutôt que d'afficher un chiffre statistiquement fragile.
const MIN_SALES = 50;
let LOCAL_PARIS = { cities: {} };
try {
  LOCAL_PARIS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'content', 'localDataParis.json'), 'utf8'));
} catch {
  // Pas encore généré (aucun arrondissement migré) : node scripts/fetch-local-data-paris.cjs.
}
const cityInfo = (c, source) => {
  const d = (source[c.slug]) || {};
  const flats = d.flats && d.flats.sales >= MIN_SALES ? d.flats : null;
  const houses = d.houses && d.houses.sales >= MIN_SALES ? d.houses : null;
  const ref = flats || houses;
  const price = ref ? ref.medianPrice : null;
  const capital = price ? Math.round(price * 0.9 / 1000) * 1000 : null;
  return { ...d, flats, houses, capital, refKind: flats ? 'appartement' : houses ? 'maison' : null, refPrice: price };
};
// Villes hors 92 (Paris) : pas de fiche dans localSeo92.ts, juste un "stub" minimal
// {slug, name, postalCode, nearby} dérivé de VilleData, pour réutiliser exactement la même
// boucle de génération de page que pour le 92. Population reprise de VilleData (sourcée
// indépendamment, voir src/content/villes/{slug}.ts), car localDataParis.json ne couvre que les
// prix (DVF) — pas la population (déjà disponible via geo.api.gouv.fr dans VilleData).
const OTHER_STUBS = VILLES_DATA.filter(v => v.departement !== '92').map(v => ({
  slug: v.slug, name: v.nom, postalCode: v.codesPostaux[0], nearby: []
}));
const CITIES_ALL = [...CITIES_92, ...OTHER_STUBS];
const INFO = new Map([
  ...CITIES_92.map(c => [c.slug, cityInfo(c, LOCAL.cities)]),
  ...OTHER_STUBS.map(c => {
    const info = cityInfo(c, LOCAL_PARIS.cities);
    const ville = VILLE_BY_SLUG.get(c.slug);
    return [c.slug, { ...info, population: ville && ville.population ? ville.population.valeur : undefined }];
  })
]);
const cityLink = c => `<a href="/assurance-emprunteur/${c.slug}">${esc(c.name)}</a>`;
const insuranceCost = (capital, points) => capital * (points / 100) * 20;

// Condense les blocs génériques du gabarit (identiques sur les 56 pages villes) pour ne garder,
// sur une page ville, que l'essentiel : le détail complet (avis Google, loi Lemoine, méthode)
// reste sur /assurance-emprunteur, avec un lien « En savoir plus » depuis la page ville. Ne
// touche jamais au contenu propre à la ville (local-seo), injecté séparément.
// Dans un bandeau d'avis (<ul class="tk-track">...</ul>), ne garde que les N premiers <li> —
// utilisé pour compacter le bandeau défilant sur les pages villes (3 avis réels au lieu de 17+,
// même mécanique des deux côtés de la boucle CSS, aria-hidden compris).
const truncateTrack = (trackHtml, count) => {
  const items = trackHtml.match(/<li>[\s\S]*?<\/li>/g) || [];
  return items.slice(0, count).join('');
};

// Page ville : reconstruit entièrement le <main> dans l'ordre validé (assurance d'abord, ville
// ensuite) plutôt que d'insérer un bloc local dans le gabarit complet. Sections génériques
// gardées (extraites telles quelles du gabarit) : hero, bandeau d'avis compact, simulateur,
// méthode (+ 1 phrase loi Lemoine), témoignages, présentation compacte de Gabriel, CTA final.
// Sections génériques retirées des pages villes (détail complet réservé à /assurance-emprunteur) :
// « pourquoi nous choisir », chiffres agrégés de la société, paragraphe loi Lemoine en entier,
// comparaison avant/après générique, carrousel d'avis complet, FAQ générique.
const condenseForCityPage = (html, parts) => {
  const extract = re => (re.exec(html) || [])[0] || '';

  const hero = extract(/<section class="service-hero">[\s\S]*?<\/section>/);

  // Bandeau défilant d'avis Google : avis réels et vérifiés, gardé en version compacte (3 avis au
  // lieu de 17+) plutôt que supprimé ; exclu de la mesure de similarité/contenu local par
  // scripts/check-landings.ts, au même titre que le simulateur — un repère de confiance, pas du
  // contenu éditorial propre à la page.
  let ticker = extract(/<section class="review-ticker"[\s\S]*?<\/section>/);
  ticker = ticker
    .replace(/<ul class="tk-track">([\s\S]*?)<\/ul>/, (m, inner) => `<ul class="tk-track">${truncateTrack(inner, 3)}</ul>`)
    .replace(/<ul class="tk-track" aria-hidden="true">([\s\S]*?)<\/ul>/, (m, inner) => `<ul class="tk-track" aria-hidden="true">${truncateTrack(inner, 3)}</ul>`);

  const simulator = extract(/<section class="section insurance-simulator"[\s\S]*?<\/section>\s*(?=<section)/);

  // Méthode (« Comment ça marche »), avec la loi Lemoine résumée en une phrase + lien vers le
  // détail sur /assurance-emprunteur, plutôt qu'une section « loi Lemoine » séparée.
  const process = extract(/<section class="section process-section" id="methode">[\s\S]*?<\/section>/).replace(
    '<p>Vous choisissez la solution. Je gère le reste.</p>',
    '<p>Vous choisissez la solution. Je gère le reste. Depuis la loi Lemoine, vous pouvez changer d’assurance de prêt à tout moment, sans frais. <a href="/assurance-emprunteur#comprendre">En savoir plus →</a></p>'
  );

  const testimonials = extract(/<section class="section testimonials-section"[\s\S]*?<\/section>/);

  // Présentation compacte de Gabriel (photo + 2 phrases + ORIAS) : un repère de confiance, pas du
  // contenu éditorial propre à la page — exclue de la mesure comme le simulateur et le bandeau.
  const advisorPhoto = (/<div class="advisor-photo">[\s\S]*?<\/div>/.exec(extract(/<section class="section advisor-section"[\s\S]*?<\/section>/)) || [])[0] || '';
  const advisor = `<section class="section advisor-section condensed" id="votre-courtier"><div class="container advisor-layout">${advisorPhoto}<div class="advisor-copy"><p class="eyebrow"><span></span>Votre courtier</p><h2>Gabriel Perbost</h2><p class="section-intro">Un interlocuteur unique pour analyser votre situation, comparer les solutions et gérer vos démarches. Courtier indépendant · ORIAS 23003789.</p></div></div></section>`;

  const finalCta = extract(/<section class="final-section"[\s\S]*?<\/section>/);

  const main = [hero, ticker, simulator, process, parts.financingSection, parts.faqSection, testimonials, parts.cityBlock, advisor, finalCta].join('');
  return html.replace(/<main id="main">[\s\S]*?<\/main>/, `<main id="main">${main}</main>`);
};

// Villes pas encore migrées (pas de fichier VilleData) : gardent le bloc local unique inséré
// avant le simulateur (pas assez de contenu rédigé pour la nouvelle structure éclatée), mais
// profitent quand même des allègements génériques validés sur les 3 pages pilotes — bandeau
// d'avis compact, carrousel réduit, FAQ générique retirée, liens vers le détail loi Lemoine/méthode.
const applyGenericTrims = (html) => {
  html = html
    .replace(/<ul class="tk-track">([\s\S]*?)<\/ul>/, (m, inner) => `<ul class="tk-track">${truncateTrack(inner, 3)}</ul>`)
    .replace(/<ul class="tk-track" aria-hidden="true">([\s\S]*?)<\/ul>/, (m, inner) => `<ul class="tk-track" aria-hidden="true">${truncateTrack(inner, 3)}</ul>`);
  html = html.replace(/<section class="section social-proof-section" id="avis-clients"[\s\S]*?<\/section>/, (m) => {
    const badge = (/<a class="google-rating"[\s\S]*?<\/a>/.exec(m) || [])[0] || '';
    return `<section class="section social-proof-section condensed" id="avis-clients"><div class="container"><div class="proof-section-heading">${badge}<p>Les avis complets de nos clients sont à lire sur la page <a href="/assurance-emprunteur#avis-clients">assurance emprunteur</a>.</p></div></div></section>`;
  });
  html = html.replace(/<section class="section faq-section">[\s\S]*?<\/section>/, '');
  html = html.replace(
    '<p class="section-intro">La loi Lemoine permet de changer d’assurance emprunteur à tout moment pour les prêts concernés. Nous comparons les contrats, vérifions les garanties et préparons votre dossier.</p>',
    '<p class="section-intro">La loi Lemoine permet de changer d’assurance emprunteur à tout moment pour les prêts concernés. Nous comparons les contrats, vérifions les garanties et préparons votre dossier.</p><p class="text-link"><a href="/assurance-emprunteur#comprendre">En savoir plus sur la loi Lemoine →</a></p>'
  );
  html = html.replace(
    '<p>Vous choisissez la solution. Je gère le reste.</p>',
    '<p>Vous choisissez la solution. Je gère le reste. <a href="/assurance-emprunteur#methode">Le détail de la méthode →</a></p>'
  );
  return html;
};

const localPage = ({ file, route, title, description, eyebrow, heading, intro, extra, h1, breadcrumb, faq, areaServed, condenseParts, condenseGeneric }) => {
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
  if (areaServed) html = html.replace('"areaServed":"FR"', `"areaServed":{"@type":"City","name":"${esc(areaServed)}"}`);
  html = html.replace('<p class="eyebrow"><span></span>Assurance de prêt · Assurance emprunteur</p>', `<p class="eyebrow"><span></span>${esc(eyebrow)}</p>`);
  if (h1) html = html.replace(/<h1>[^<]*<br>[^<]*<em>[^<]*<\/em><\/h1>/, h1);
  if (breadcrumb) {
    html = html.replace(/<a href="\/#solutions" class="breadcrumb">Accueil <span>\/<\/span> Assurance emprunteur<\/a>/, breadcrumb.html);
    html = html.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"BreadcrumbList".*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(breadcrumb.schema)}</script>`);
  }
  if (condenseParts) {
    // Page ville : le <main> est entièrement reconstruit dans l'ordre validé (voir
    // condenseForCityPage), pas un bloc inséré dans le gabarit complet.
    html = condenseForCityPage(html, condenseParts);
  } else {
    // Page hub (ex. /assurance-emprunteur/hauts-de-seine) ou ville pas encore migrée : gabarit
    // complet, un seul bloc local inséré avant le simulateur (+ allègements génériques pour les
    // villes non migrées, voir applyGenericTrims — pas pour le hub, qui reste la page complète).
    const section = `<section class="section local-seo" id="pres-de-chez-vous"><div class="container simple-explainer"><p class="eyebrow"><span></span>Près de chez vous</p><h2>${heading}</h2><p class="section-intro">${intro}</p></div><div class="container local-body">${extra}</div></section>`;
    if (!html.includes('<section class="section insurance-simulator"')) throw new Error('simulateur introuvable dans la page locale');
    html = html.replace('<section class="section insurance-simulator"', section + '<section class="section insurance-simulator"');
    if (condenseGeneric) html = applyGenericTrims(html);
  }
  if (faq && faq.length) {
    html = html.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"FAQPage".*?<\/script>/s, m => {
      const base = JSON.parse(m.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
      base.mainEntity = [...faq.map(q => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: plain(q.a) } })), ...base.mainEntity];
      return `<script type="application/ld+json">${JSON.stringify(base)}</script>`;
    });
  }
  fs.writeFileSync(path.join(VILLES, file + '.html'), html);
};

const stat = (value, label) => `<div class="local-stat"><strong>${value}</strong><span>${label}</span></div>`;
// `local: true` sur une question = écrite spécifiquement pour cette ville (voir faqLocales dans
// VilleData) : balisée <!--LOCAL--> pour la mesure de part de contenu local. Les questions
// générales tournantes (pool partagé entre toutes les villes) ne le sont pas.
const faqHtml = items => `<div class="local-faq">${items.map(q => {
  const details = `<details><summary>${esc(q.q)}<span>+</span></summary><p>${q.a}</p></details>`;
  return q.local ? `<!--LOCAL-->${details}<!--/LOCAL-->` : details;
}).join('')}</div>`;

// Page du département : tableau des prix par ville (données réelles)
{
  const rows = CITIES_92.map(c => ({ c, i: INFO.get(c.slug) })).filter(x => x.i.flats).sort((a, b) => b.i.flats.medianPerM2 - a.i.flats.medianPerM2);
  const table = `<h3 class="local-h3">Le prix de l’immobilier ville par ville</h3><p class="local-note">Prix médian d’un appartement, d’après les ventes enregistrées en ${YEARS_TEXT} (base DVF). Cliquez sur votre ville pour voir le détail.</p><table class="local-table"><thead><tr><th>Ville</th><th>Prix médian au m²</th><th>Prix médian d’un appartement</th><th>Ventes analysées</th></tr></thead><tbody>${rows.map(({ c, i }) => `<tr><td>${cityLink(c)}</td><td>${eur(i.flats.medianPerM2)}</td><td>${eur(i.flats.medianPrice)}</td><td>${num(i.flats.sales)}</td></tr>`).join('')}</tbody></table><p class="local-source">Sources : DGFiP, base DVF (data.gouv.fr) ; INSEE. Données relevées le ${RETRIEVED}. Repères statistiques, ils ne remplacent pas l’estimation d’un bien.</p>`;
  localPage({
    file: 'hauts-de-seine', route: '/assurance-emprunteur/hauts-de-seine',
    title: 'Assurance de prêt dans les Hauts-de-Seine (92) | GP Finances',
    description: 'Assurance de prêt immobilier dans les Hauts-de-Seine : prix de l’immobilier ville par ville, comparaison des contrats et économies sur l’assurance emprunteur.',
    eyebrow: 'Assurance emprunteur · Hauts-de-Seine (92)',
    heading: 'Votre ville dans les Hauts-de-Seine',
    intro: 'Accompagnement humain, comparaison des contrats et démarches prises en charge, où que vous habitiez dans le 92. Choisissez votre ville :',
    extra: `<p class="city-links">${CITIES_92.map(cityLink).join('')}</p>${table}`,
    breadcrumb: { html: '<nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a> <span>/</span> <a href="/assurance-emprunteur">Assurance emprunteur</a> <span>/</span> <span>Hauts-de-Seine</span></nav>', schema: { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Assurance emprunteur', item: ORIGIN + '/assurance-emprunteur' }, { '@type': 'ListItem', position: 3, name: 'Hauts-de-Seine', item: ORIGIN + '/assurance-emprunteur/hauts-de-seine' }] } }
  });
}

for (const c of CITIES_ALL) {
  const i = INFO.get(c.slug);
  const ville = VILLE_BY_SLUG.get(c.slug);
  const route = `/assurance-emprunteur/${c.slug}`;
  const name = esc(nonBreakingName(c.name)), cp = esc(c.postalCode);
  const near = c.nearby.map(n => CITIES_92.find(x => x.name === n)).filter(Boolean);
  const nearNames = c.nearby.map(n => { const hit = CITIES_92.find(x => x.name === n); return hit ? cityLink(hit) : `<span>${esc(n)}</span>`; });
  const faq = [];

  if (ville) {
    // Ville migrée (fichier src/content/villes/{slug}.ts) : structure validée sur les 3 pages
    // pilotes — assurance d'abord (simulateur, méthode, cas concret, FAQ, témoignages), ville
    // ensuite (bloc court en bas de page). Voir condenseForCityPage pour l'assemblage complet.
    faq.push(...ville.faqLocales.map(q => ({ q: q.q, a: q.r, local: true })), ...rotatingGeneralFaq(c.slug, 2));

    // 2 tuiles au lieu de 4 : prix au m² + capital typique emprunté (celui-là même qui sert
    // d'exemple de financement juste en dessous). Balisées locales : ce sont des faits propres à
    // la ville.
    const tiles2 = [];
    if (i.flats) tiles2.push(stat(eur(i.flats.medianPerM2), 'prix médian d’un appartement au m²'));
    if (i.capital) tiles2.push(stat(eur(i.capital), 'capital typique emprunté (10&nbsp;% d’apport)'));

    // Tableau chiffré (écart de taux d'assurance) uniquement si un capital réel et assez sourcé
    // existe (voir MIN_SALES). Sans ça, pas de note explicative : une section sans donnée fiable
    // ne doit pas apparaître du tout, pas même sous une forme dégradée.
    let financingDetail = '';
    if (i.refKind) {
      const p = (points) => eur(insuranceCost(i.capital, points));
      financingDetail = `<h3 class="local-h3">${phrase('financingTitle', c.slug, name)}</h3><p>Sur 20&nbsp;ans, voici ce que représente l’écart de taux d’assurance entre deux contrats pour ce capital :</p><table class="local-table local-table-small"><thead><tr><th>Écart de taux d’assurance</th><th>Différence de coût sur 20&nbsp;ans</th></tr></thead><tbody><tr><td>0,10&nbsp;point</td><td><strong>${p(0.10)}</strong></td></tr><tr><td>0,20&nbsp;point</td><td><strong>${p(0.20)}</strong></td></tr><tr><td>0,30&nbsp;point</td><td><strong>${p(0.30)}</strong></td></tr></tbody></table><p class="local-note">Exemple pédagogique : cotisation calculée sur le capital initial, durée de 20&nbsp;ans, hors frais de dossier. Le coût réel dépend de votre profil, de la quotité et du contrat.</p>`;
    }
    // Section entière masquée si aucune tuile ni aucun détail chiffré (ni prix/m², ni exemple) :
    // pas de bloc affiché avec juste un H2 et rien dessous.
    const financingSection = (tiles2.length || financingDetail)
      ? `<section class="section local-seo-financing" id="exemple-financement"><div class="container simple-explainer"><p class="eyebrow"><span></span>Votre situation à ${name}</p><h2>${phrase('whyReviewHeading', c.slug, name)}</h2></div><div class="container local-body"><!--LOCAL-->${tiles2.length ? `<div class="local-stats">${tiles2.join('')}</div>` : ''}${financingDetail}<!--/LOCAL--></div></section>`
      : '';

    const faqSection = `<section class="section local-seo-faq" id="faq-locale"><div class="container simple-explainer"><p class="eyebrow"><span></span>Vos questions</p><h2>${phrase('faqTitle', c.slug, name)}</h2></div><div class="container local-body">${faqHtml(faq)}</div></section>`;

    // Bloc ville, en bas de page : angle éditorial + profil (sous l'angle de l'assurance :
    // profils d'emprunteurs, durées et montants typiques — pas de données immobilières
    // supplémentaires), quartiers, accès au cabinet, puis liens vers les villes voisines (sans
    // tableau de prix, déjà donné plus haut) et la mention des sources.
    const nearbyBlock = nearNames.length
      ? `<p class="city-links-label">${phrase('nearbyLead', c.slug)}</p><p class="city-links">${nearNames.join('')}</p>`
      : '';
    const sourcesNote = [ville.population, ville.prixM2.appartements, ville.prixM2.maisons]
      .filter(Boolean)
      .map(s => `${s.source} (${s.date})`)
      .filter((v, idx, arr) => arr.indexOf(v) === idx)
      .join(' ; ');
    const cityBlock = `<section class="section local-seo-city" id="pres-de-chez-vous"><div class="container simple-explainer"><p class="eyebrow"><span></span>Près de chez vous</p><h2>À ${name}</h2></div><div class="container local-body"><!--LOCAL--><p class="local-angle">${esc(ville.angleEditorial)}</p><p>${esc(ville.profilEmprunteurs)}</p><p class="local-note">Quartiers : ${ville.quartiers.map(esc).join(', ')}.</p><p class="local-note">Accès au cabinet : ${esc(ville.accesBureau)}</p><!--/LOCAL-->${nearbyBlock}<p class="local-source">${sourcesNote ? `Sources : ${sourcesNote}. ` : ''}Repères statistiques : ils ne remplacent pas l’estimation d’un bien ni une étude personnalisée.</p></div></section>`;

    localPage({
      file: c.slug, route, title: ville.meta.title, description: ville.meta.description,
      eyebrow: `Assurance emprunteur · ${c.name}`,
      h1: `<h1>Assurance de prêt à ${name}.<br>Le coût de votre assurance <em>diminue.</em></h1>`,
      faq, areaServed: c.name,
      condenseParts: { financingSection, faqSection, cityBlock },
      breadcrumb: { html: `<nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a> <span>/</span> <a href="/assurance-emprunteur">Assurance emprunteur</a> <span>/</span> <span>${name}</span></nav>`, schema: { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Assurance emprunteur', item: ORIGIN + '/assurance-emprunteur' }, { '@type': 'ListItem', position: 3, name: c.name, item: ORIGIN + route }] } }
    });
    continue;
  }

  // Ville pas encore migrée : comportement historique (bloc unique avant le simulateur, tuiles
  // chiffrées, tableau des communes voisines), avec les allègements génériques du gabarit
  // (bandeau d'avis compact, FAQ générique retirée) appliqués en plus.
  const tiles = [];
  if (i.population) tiles.push(stat(num(i.population), 'habitants (INSEE)'));
  if (i.flats) {
    tiles.push(stat(eur(i.flats.medianPerM2), 'prix médian d’un appartement au m²'));
    if (i.flats.medianPrice) tiles.push(stat(eur(i.flats.medianPrice), `prix médian d’un appartement (${num(i.flats.medianArea)} m² en médiane)`));
  }
  if (i.houses && i.houses.medianPrice) tiles.push(stat(eur(i.houses.medianPrice), 'prix médian d’une maison'));
  else if (i.houses) tiles.push(stat(eur(i.houses.medianPerM2), 'prix médian d’une maison au m²'));
  const blocks = [];
  if (tiles.length) blocks.push(`<div class="local-stats">${tiles.join('')}</div>`);
  if (i.refKind) {
    const p = (points) => eur(insuranceCost(i.capital, points));
    const kind = i.refKind === 'appartement' ? 'un appartement' : 'une maison';
    blocks.push(`<h3 class="local-h3">${phrase('financingTitle', c.slug, name)}</h3><p>Pour acheter ${kind} au prix médian du secteur (${eur(i.refPrice)}) avec 10&nbsp;% d’apport, le capital emprunté serait d’environ <strong>${eur(i.capital)}</strong>. Sur 20&nbsp;ans, voici ce que représente l’écart de taux d’assurance entre deux contrats :</p><table class="local-table local-table-small"><thead><tr><th>Écart de taux d’assurance</th><th>Différence de coût sur 20&nbsp;ans</th></tr></thead><tbody><tr><td>0,10&nbsp;point</td><td><strong>${p(0.10)}</strong></td></tr><tr><td>0,20&nbsp;point</td><td><strong>${p(0.20)}</strong></td></tr><tr><td>0,30&nbsp;point</td><td><strong>${p(0.30)}</strong></td></tr></tbody></table><p class="local-note">Exemple pédagogique : cotisation calculée sur le capital initial, durée de 20&nbsp;ans, hors frais de dossier. Le coût réel dépend de votre profil, de la quotité et du contrat.</p>`);
    if (i.flats) faq.push({ q: `Combien coûte un appartement à ${c.name} ?`, a: `D’après les ventes enregistrées en ${YEARS_TEXT} (base DVF), le prix médian d’un appartement à ${name} est d’environ ${eur(i.flats.medianPrice)}, soit ${eur(i.flats.medianPerM2)} le m² (${num(i.flats.sales)} ventes analysées). Ce sont des repères statistiques, pas l’estimation de votre bien.` });
    faq.push({ q: `Quel capital emprunter pour acheter à ${c.name} ?`, a: `Pour ${kind} au prix médian avec 10&nbsp;% d’apport, le capital emprunté serait d’environ ${eur(i.capital)}. Votre capacité réelle dépend de vos revenus, de vos charges et de votre banque.` });
    faq.push({ q: `Combien l’assurance de prêt peut-elle coûter en plus ou en moins ?`, a: `À titre d’illustration, sur ${eur(i.capital)} empruntés pendant 20&nbsp;ans, chaque 0,10&nbsp;point d’écart de taux d’assurance (calculé sur le capital initial) représente environ ${p(0.10)} sur la durée. Comparer les contrats peut donc compter.` });
  }
  faq.push({ q: `Puis-je changer l’assurance de mon prêt immobilier à ${c.name} ?`, a: `Oui. Depuis la loi Lemoine, vous pouvez résilier l’assurance de votre prêt à tout moment, sans frais, en proposant un contrat aux garanties équivalentes à celles exigées par votre banque. Je m’occupe des démarches, y compris de la résiliation de l’ancien contrat.` });
  faq.push({ q: `Dois-je me déplacer à Issy-les-Moulineaux ?`, a: `Non. Les échanges se font en visio ou par téléphone, où que vous habitiez, et mon cabinet est situé à Issy-les-Moulineaux, dans les Hauts-de-Seine.` });
  blocks.push(`<h3 class="local-h3">${phrase('faqTitle', c.slug, name)}</h3>${faqHtml(faq)}`);
  const nearRows = near.map(n => ({ n, ni: INFO.get(n.slug) })).filter(x => x.ni.flats);
  if (i.flats && nearRows.length) {
    blocks.push(`<h3 class="local-h3">Comparé aux communes voisines</h3><table class="local-table local-table-small"><thead><tr><th>Commune</th><th>Prix médian au m²</th></tr></thead><tbody><tr class="local-current"><td>${name}</td><td><strong>${eur(i.flats.medianPerM2)}</strong></td></tr>${nearRows.map(({ n, ni }) => `<tr><td>${cityLink(n)}</td><td>${eur(ni.flats.medianPerM2)}</td></tr>`).join('')}</tbody></table>`);
  }
  const nearbyBlock = nearNames.length
    ? `<p class="city-links-label">${phrase('nearbyLead', c.slug)}</p><p class="city-links">${nearNames.join('')}</p>`
    : '';
  const sourcesNote = LOCAL.retrievedAt ? `DGFiP, base DVF (data.gouv.fr, ventes de ${YEARS_TEXT}) ; INSEE (population). Données relevées le ${RETRIEVED}` : '';
  blocks.push(`${nearbyBlock}<p class="local-source">${sourcesNote ? `Sources : ${sourcesNote}. ` : ''}Repères statistiques : ils ne remplacent pas l’estimation d’un bien ni une étude personnalisée.</p>`);

  const title0 = `Assurance de prêt à ${c.name} (${c.postalCode}) : changer et économiser`;
  const title = title0.length <= 58 ? `${title0} | GP Finances` : title0;
  const description = i.refKind
    ? `À ${c.name} (${c.postalCode}), ${i.refKind === 'appartement' ? 'l’appartement' : 'la maison'} se vend ${i.flats ? `environ ${num(i.flats.medianPerM2).replace(/&nbsp;/g, ' ')} €/m²` : `autour de ${num(i.refPrice).replace(/&nbsp;/g, ' ')} €`} : sur ${num(i.capital).replace(/&nbsp;/g, ' ')} € empruntés, 0,10 point d’assurance en moins vaut ${num(insuranceCost(i.capital, 0.10)).replace(/&nbsp;/g, ' ')} € sur 20 ans.`
    : `GP Finances accompagne les emprunteurs à ${c.name} (${c.postalCode}) pour réduire le coût de l’assurance de prêt avec garanties équivalentes et gestion complète des démarches.`;
  localPage({
    file: c.slug, route, title, description,
    eyebrow: `Assurance emprunteur · ${c.name}`,
    h1: `<h1>Assurance de prêt à ${name}.<br>Le coût de votre assurance <em>diminue.</em></h1>`,
    heading: `Assurance de prêt à ${name} (${cp})`,
    intro: `${i.population ? `${name} est une commune de ${num(i.population)}&nbsp;habitants des Hauts-de-Seine. ` : ''}${esc(c.localPitch)}`,
    extra: blocks.join(''), faq, areaServed: c.name, condenseGeneric: true,
    breadcrumb: { html: `<nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a> <span>/</span> <a href="/assurance-emprunteur">Assurance emprunteur</a> <span>/</span> <span>${name}</span></nav>`, schema: { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: 'Assurance emprunteur', item: ORIGIN + '/assurance-emprunteur' }, { '@type': 'ListItem', position: 3, name: c.name, item: ORIGIN + route }] } }
  });
}
console.log(`Pages locales : 1 page départementale (92) + ${CITIES_ALL.length} villes (${CITIES_92.length} dans le 92, ${CITIES_ALL.length - CITIES_92.length} ailleurs)`);

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
