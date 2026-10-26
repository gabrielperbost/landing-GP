'use strict';
/* Pages locales « courtier en PER » et « courtier en assurance-vie » (pilote, 10 villes).
 * Appelé par scripts/build-site.cjs, une fois les pages /per-retraite et /assurance-vie construites.
 * Contenu propre à chaque ville : src/content/villesEpargne.ts (angle, textes, FAQ, meta) et
 * src/content/localDataEpargne.json (INSEE : niveau de vie médian, âges ; voir
 * scripts/fetch-local-data-epargne.cjs). Les blocs communs (pourquoi un courtier, méthode, FAQ
 * générale) existent en plusieurs versions, attribuées ville par ville, pour éviter des pages
 * identiques. Le contenu propre à la ville est balisé <!--LOCAL--> pour le contrôle de similarité
 * (scripts/check-landings-epargne.cjs). */
const fs = require('node:fs');
const path = require('node:path');

const PRODUITS = {
  per: {
    key: 'per', base: 'per', route: '/per-retraite', dir: 'villes-per', nom: 'Plan Épargne Retraite', court: 'PER',
    metier: 'Courtier en PER', simulator: /<section class="section per-section"[\s\S]*?<\/section>/, simulatorAnchor: '#simuler',
    h1: (name) => `<h1>Courtier en PER à ${name}.<br>Moins d’impôt, <em>plus de retraite.</em></h1>`,
    autre: { key: 'av', route: '/assurance-vie', label: (n) => `Courtier en assurance-vie à ${n}` }
  },
  av: {
    key: 'av', base: 'assurance-vie', route: '/assurance-vie', dir: 'villes-assurance-vie', nom: 'Assurance-vie', court: 'assurance-vie',
    metier: 'Courtier en assurance-vie', simulator: /<section class="section life-sim-section"[\s\S]*?<\/section>/, simulatorAnchor: '#simuler-assurance-vie',
    h1: (name) => `<h1>Courtier en assurance-vie à ${name}.<br>Votre épargne, <em>bien placée.</em></h1>`,
    autre: { key: 'per', route: '/per-retraite', label: (n) => `Courtier en PER à ${n}` }
  }
};

// « Pourquoi passer par un courtier » : l'angle métier. 6 versions par produit, même sens.
const POURQUOI = {
  per: [
    ['Pourquoi passer par un courtier pour votre PER', ['Votre banque vous propose son PER ; un courtier compare ceux de plusieurs assureurs.', 'Je vérifie d’abord que le PER est vraiment adapté à votre tranche d’imposition, avant tout versement.', 'Les frais, la gestion et les options de sortie sont comparés et expliqués, ligne par ligne.']],
    ['Un courtier en épargne retraite, pour quoi faire ?', ['Comparer les contrats du marché plutôt que de se contenter d’un seul catalogue.', 'Calculer l’économie d’impôt réelle à partir de votre avis d’imposition.', 'Vous suivre dans le temps : versements, transferts, préparation de la sortie.']],
    ['Ce qu’un cabinet de courtage change pour votre retraite', ['Un regard indépendant sur vos contrats existants : PER d’entreprise, Madelin, PERP.', 'Des PER sélectionnés chez plusieurs assureurs, selon vos objectifs.', 'Un seul interlocuteur, de l’étude à la mise en place, puis au fil des années.']],
    ['Choisir un PER avec un courtier plutôt qu’en agence', ['L’agence vend les produits de sa banque ; je compare plusieurs assureurs.', 'Le conseil part de votre fiscalité, pas d’un objectif commercial.', 'Vous recevez une recommandation écrite, que vous êtes libre de suivre ou non.']],
    ['Le rôle d’un courtier PER, concrètement', ['Lire votre avis d’imposition pour connaître votre plafond de déduction disponible.', 'Simuler l’économie d’impôt et le capital à la retraite.', 'Sélectionner un contrat aux frais lisibles, puis gérer l’ouverture.']],
    ['Pourquoi se faire accompagner pour un PER', ['Un PER bloque l’épargne jusqu’à la retraite : le choix mérite un vrai calcul.', 'Les contrats diffèrent beaucoup par leurs frais et leur gestion ; je les compare.', 'Je reste votre interlocuteur pour les versements, transferts et la sortie.']]
  ],
  av: [
    ['Pourquoi passer par un courtier pour votre assurance-vie', ['Une banque propose ses propres contrats ; un courtier compare ceux de plusieurs assureurs.', 'Les frais sur versement et de gestion sont mis noir sur blanc avant toute signature.', 'Le choix des supports suit votre horizon et votre tolérance au risque.']],
    ['Un courtier en assurance-vie, pour quoi faire ?', ['Comparer les contrats du marché, y compris ceux rarement proposés en agence.', 'Expliquer clairement fonds en euros, unités de compte et gestion pilotée.', 'Rédiger avec vous une clause bénéficiaire adaptée à votre famille.']],
    ['Ce qu’un cabinet de courtage change pour votre épargne', ['Un regard indépendant sur vos contrats existants et leurs frais.', 'Des contrats sélectionnés chez plusieurs assureurs selon votre projet.', 'Un interlocuteur unique qui suit votre contrat dans le temps.']],
    ['Choisir son assurance-vie avec un courtier plutôt qu’en agence', ['L’agence propose le contrat de sa banque ; je compare plusieurs assureurs.', 'Les frais, qui pèsent sur des années, sont au cœur de la comparaison.', 'La recommandation est écrite et motivée, vous restez libre de votre choix.']],
    ['Le rôle d’un courtier en assurance-vie, concrètement', ['Comprendre votre projet : épargne de précaution, achat, retraite, transmission.', 'Sélectionner un contrat aux frais lisibles et aux supports adaptés.', 'Ouvrir le contrat, puis l’ajuster au fil de vos projets.']],
    ['Pourquoi se faire accompagner pour une assurance-vie', ['Deux contrats qui se ressemblent peuvent avoir des frais très différents.', 'La clause bénéficiaire mérite mieux que la formule par défaut.', 'Je reste disponible pour les versements, arbitrages et retraits.']]
  ]
};

const PROCESS = [
  { h2: 'Trois étapes, un interlocuteur.', steps: [['J’écoute', 'Vos objectifs, votre situation et vos contrats actuels.'], ['Je compare', 'Les contrats de plusieurs assureurs, frais compris.'], ['J’accompagne', 'L’ouverture, puis le suivi au fil des années.']] },
  { h2: 'Une méthode simple.', steps: [['Le point', 'Votre situation et ce que vous voulez construire.'], ['La sélection', 'Les contrats les plus adaptés à votre profil.'], ['La mise en place', 'Les démarches prises en charge, de A à Z.']] },
  { h2: 'Comment je travaille.', steps: [['Comprendre', 'Votre projet, votre horizon, votre fiscalité.'], ['Comparer', 'Le marché, pour ne garder que l’essentiel.'], ['Suivre', 'Votre contrat, dans la durée.']] },
  { h2: 'De l’étude au suivi.', steps: [['Diagnostic', 'Vos placements actuels et ce qui peut être amélioré.'], ['Recommandation', 'Une proposition écrite et motivée.'], ['Suivi', 'Un point régulier sur votre contrat.']] },
  { h2: 'Ce que je fais pour vous.', steps: [['J’analyse', 'Votre épargne et vos objectifs.'], ['Je sélectionne', 'Le contrat le plus adapté parmi plusieurs assureurs.'], ['Je gère', 'L’ouverture et le suivi du contrat.']] },
  { h2: 'Simple, du début à la fin.', steps: [['Un échange', 'En visio, par téléphone ou au cabinet.'], ['Une proposition', 'Comparée, chiffrée, expliquée.'], ['Un suivi', 'Pour faire évoluer le contrat avec vous.']] }
];

const FAQ_GENERALE = {
  per: [
    { q: 'Les versements sur un PER sont-ils toujours déductibles ?', a: 'Les versements volontaires sont déductibles du revenu imposable, dans la limite d’un plafond annuel indiqué sur votre avis d’imposition. Vous pouvez aussi renoncer à la déduction, ce qui change la fiscalité de la sortie.' },
    { q: 'Peut-on récupérer son épargne avant la retraite ?', a: 'Oui, dans des cas prévus par la loi : achat de la résidence principale, invalidité, décès du conjoint, surendettement, fin de droits au chômage, cessation d’activité après liquidation judiciaire.' },
    { q: 'Peut-on transférer un PER vers un autre assureur ?', a: 'Oui, un PER est transférable. Des frais peuvent s’appliquer les premières années ; ils sont plafonnés et nuls après cinq ans.' },
    { q: 'Comment l’épargne est-elle gérée ?', a: 'Par défaut, en gestion pilotée à horizon : la part la plus risquée diminue à mesure que la retraite approche. Vous pouvez choisir une autre gestion.' },
    { q: 'Combien coûte l’accompagnement d’un courtier ?', a: 'L’étude est sans frais. Le courtier est rémunéré par l’assureur, sur les frais du contrat, comme le serait le réseau d’une banque.' },
    { q: 'La sortie se fait-elle obligatoirement en rente ?', a: 'Non. Pour les versements volontaires, vous choisissez à la retraite une sortie en capital, en rente ou un mélange des deux.' }
  ],
  av: [
    { q: 'L’argent placé en assurance-vie est-il bloqué ?', a: 'Non. Vous pouvez faire un retrait partiel ou total à tout moment. La fiscalité dépend de l’ancienneté du contrat, plus favorable après 8 ans.' },
    { q: 'Le capital est-il garanti ?', a: 'Sur le fonds en euros, le capital est garanti par l’assureur, hors frais. Sur les unités de compte, il ne l’est pas : leur valeur peut baisser.' },
    { q: 'Que se passe-t-il au décès ?', a: 'Le capital revient aux bénéficiaires désignés dans la clause, en dehors de la succession, avec une fiscalité qui dépend de l’âge auquel les versements ont été faits.' },
    { q: 'Peut-on avoir plusieurs contrats ?', a: 'Oui, sans limite. Plusieurs contrats permettent de diversifier les assureurs et de prévoir des bénéficiaires différents.' },
    { q: 'Combien coûte l’accompagnement d’un courtier ?', a: 'L’étude est sans frais. Le courtier est rémunéré par l’assureur, sur les frais du contrat, comme le serait le réseau d’une banque.' },
    { q: 'Que regarder en priorité dans un contrat ?', a: 'Les frais sur versement, les frais de gestion annuels, la qualité du fonds en euros, le choix des supports et les options de gestion.' }
  ]
};

// Variante de chaque bloc commun, ville par ville (ordre de VILLES_EPARGNE) : chaque paire de
// villes diffère sur au moins 4 des 6 blocs.
const ROTATION = {
  pourquoi: [0, 1, 2, 3, 4, 5, 0, 1, 2, 3],
  titre: [0, 1, 2, 3, 4, 5, 1, 2, 3, 4],
  methode: [0, 1, 2, 3, 4, 5, 2, 3, 4, 5],
  titreFaq: [0, 1, 2, 3, 4, 5, 3, 4, 5, 0],
  faq1: [0, 2, 4, 1, 3, 5, 4, 0, 1, 2],
  faq2: [1, 3, 5, 2, 4, 0, 5, 2, 3, 4]
};

const HEADINGS = {
  local: (n) => [`Votre épargne retraite à ${n}`, `Le PER, vu depuis ${n}`, `Préparer sa retraite à ${n}`, `Épargne retraite et impôt à ${n}`, `Votre situation à ${n}`, `Ce qui compte à ${n}`],
  localAv: (n) => [`Votre épargne à ${n}`, `L’assurance-vie, vue depuis ${n}`, `Placer son épargne à ${n}`, `Épargner et transmettre à ${n}`, `Votre situation à ${n}`, `Ce qui compte à ${n}`],
  faq: (n) => [`Vos questions à ${n}`, `Questions fréquentes à ${n}`, `Ce qu’on me demande à ${n}`, `Les questions des habitants de ${n}`, `Vous vous demandez peut-être`, `Questions et réponses`]
};

module.exports = async function buildEpargnePages({ ROOT, PAGES, ORIGIN, built, esc, nonBreakingName, VILLE_BY_SLUG }) {
  const { VILLES_EPARGNE } = await import(require('node:url').pathToFileURL(path.join(ROOT, 'src', 'content', 'villesEpargne.ts')).href);
  const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'content', 'localDataEpargne.json'), 'utf8'));
  const nf = new Intl.NumberFormat('fr-FR');
  const num = (v) => nf.format(Math.round(v)).replace(/[  ]/g, '&nbsp;');
  const eur = (v) => num(v) + '&nbsp;€';
  const pct = (v) => String(v).replace('.', ',') + '&nbsp;%';
  const plain = (h) => h.replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const FR = DATA.references.france;
  const routes = [];

  const extract = (html, re) => (re.exec(html) || [])[0] || '';
  const truncateTrack = (inner, count) => (inner.match(/<li>[\s\S]*?<\/li>/g) || []).slice(0, count).join('');

  for (const p of Object.values(PRODUITS)) {
    const template = built[p.base];
    if (!template) throw new Error(`page de base introuvable : ${p.base}`);
    fs.mkdirSync(path.join(PAGES, p.dir), { recursive: true });

    VILLES_EPARGNE.forEach((ve, idx) => {
      const ville = VILLE_BY_SLUG.get(ve.slug);
      const d = DATA.villes[ve.slug];
      if (!ville || !d) throw new Error(`données manquantes pour ${ve.slug}`);
      const bloc = ve[p.key];
      const nomBrut = ville.nom;
      const name = esc(nonBreakingName(nomBrut));
      const route = `${p.route}/${ve.slug}`;
      const url = ORIGIN + route;
      // Table explicite (pas un modulo) : deux villes ne partagent jamais toutes leurs variantes.
      const variant = (bloc) => (ROTATION[bloc][idx] ?? idx) % 6;
      const ref = ville.departement === '75' ? DATA.references.paris : DATA.references['hauts-de-seine'];
      const refNom = ville.departement === '75' ? 'Paris' : 'les Hauts-de-Seine';

      // En-tête : titre métier, introduction propre à la ville.
      let hero = extract(template, /<section class="service-hero">[\s\S]*?<\/section>/)
        .replace(/<a href="\/#solutions" class="breadcrumb">[\s\S]*?<\/a>/, `<nav class="breadcrumb" aria-label="Fil d’Ariane"><a href="/">Accueil</a> <span>/</span> <a href="${p.route}">${p.nom}</a> <span>/</span> <span>${name}</span></nav>`)
        .replace(/<p class="eyebrow"><span><\/span>[^<]*<\/p>/, `<p class="eyebrow"><span></span>${p.metier} · ${esc(nomBrut)}</p>`)
        .replace(/<h1>[\s\S]*?<\/h1>/, p.h1(name))
        .replace(/<p class="hero-description">[\s\S]*?<\/p>/, `<p class="hero-description"><!--LOCAL-->${esc(bloc.angle)}<!--/LOCAL--> Courtier indépendant à Issy-les-Moulineaux, je compare les contrats de plusieurs assureurs pour vous.</p>`);

      let ticker = extract(template, /<section class="review-ticker"[\s\S]*?<\/section>/)
        .replace(/<ul class="tk-track">([\s\S]*?)<\/ul>/, (m, inner) => `<ul class="tk-track">${truncateTrack(inner, 3)}</ul>`)
        .replace(/<ul class="tk-track" aria-hidden="true">([\s\S]*?)<\/ul>/, (m, inner) => `<ul class="tk-track" aria-hidden="true">${truncateTrack(inner, 3)}</ul>`);
      const simulator = extract(template, p.simulator);
      // Témoignages vidéo de clients (page PER, la seule qui en a) : preuve sociale, placée juste
      // avant le bloc propre à la ville.
      const temoignages = extract(built.per, /<section class="section testimonials-section"[\s\S]*?<\/section>/).replace('class="section testimonials-section"', 'class="section testimonials-section testimonials-centered"').replace('Découvrez les témoignages<br>de nos clients', 'Découvrez les témoignages de nos clients');
      if (!temoignages) throw new Error('témoignages vidéo introuvables sur la page PER');

      // Chiffres INSEE de la ville, comparés à la France métropolitaine et au département.
      const tiles = [];
      if (d.niveauVieMedian) tiles.push(`<div class="local-stat"><strong>${eur(d.niveauVieMedian)}</strong><span>niveau de vie médian par an à ${name} (France métropolitaine : ${eur(FR.niveauVieMedian)})</span></div>`);
      if (p.key === 'per' && d.part40a64 != null) tiles.push(`<div class="local-stat"><strong>${pct(d.part40a64)}</strong><span>des habitants ont entre 40 et 64 ans (${refNom} : ${pct(ref.part40a64)})</span></div>`);
      if (p.key === 'av' && d.part65etPlus != null) tiles.push(`<div class="local-stat"><strong>${pct(d.part65etPlus)}</strong><span>des habitants ont 65 ans ou plus (${refNom} : ${pct(ref.part65etPlus)})</span></div>`);

      // Illustration chiffrée à partir du niveau de vie médian local (repère, pas une promesse).
      let illustration = '';
      if (d.niveauVieMedian) {
        const versement = Math.round((d.niveauVieMedian * 0.1) / 100) * 100;
        if (p.key === 'per') {
          illustration = `<h3 class="local-h3">Ce que représente un versement à ${name}</h3><p>Prenons un versement de ${eur(versement)} sur un PER, soit 10&nbsp;% du niveau de vie médian à ${name}. Économie d’impôt selon votre tranche marginale d’imposition, si le versement reste dans votre plafond de déduction :</p><table class="local-table local-table-small"><thead><tr><th>Tranche marginale</th><th>Économie d’impôt</th></tr></thead><tbody>${[11, 30, 41, 45].map((t) => `<tr><td>${t}&nbsp;%</td><td><strong>${eur((versement * t) / 100)}</strong></td></tr>`).join('')}</tbody></table><p class="local-note">Illustration : l’économie dépend de votre situation réelle ; les sommes versées sont imposées à la sortie, à la retraite.</p>`;
        } else {
          illustration = `<h3 class="local-h3">Un repère pour épargner à ${name}</h3><p>Mettre de côté 10&nbsp;% du niveau de vie médian à ${name}, c’est ${eur(versement)} par an. En huit ans, durée après laquelle la fiscalité des retraits devient la plus favorable, cela représente ${eur(versement * 8)} versés, hors rendement.</p><p class="local-note">Après 8 ans, les gains retirés bénéficient chaque année d’un abattement de 4&nbsp;600&nbsp;€ (9&nbsp;200&nbsp;€ pour un couple) avant impôt sur le revenu. Repère pédagogique, pas une projection de rendement.</p>`;
        }
      }

      const heading = (p.key === 'per' ? HEADINGS.local : HEADINGS.localAv)(name)[variant('titre')];
      const localSection = `<section class="section local-seo-financing" id="pres-de-chez-vous"><div class="container simple-explainer"><p class="eyebrow"><span></span>${p.metier} · ${name}</p><h2>${heading}</h2></div><div class="container local-body"><!--LOCAL--><p>${esc(bloc.texte[0])}</p><p>${esc(bloc.texte[1])}</p>${tiles.length ? `<div class="local-stats">${tiles.join('')}</div>` : ''}${illustration}<p class="local-note">Quartiers : ${ville.quartiers.map(esc).join(', ')}.</p><!--/LOCAL--><p class="local-source">Sources : ${esc(DATA.sources.revenus)} ; ${esc(DATA.sources.ages)}. Données relevées le ${new Date(DATA.retrievedAt + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.</p></div></section>`;

      const [pqTitre, pqPoints] = POURQUOI[p.key][variant('pourquoi')];
      const pourquoi = `<section class="section process-section" id="pourquoi-un-courtier"><div class="container"><p class="eyebrow"><span></span>Le métier de courtier</p><div class="section-heading"><h2>${pqTitre}</h2></div><div class="process-grid">${pqPoints.map((t, i) => `<article class="process-step"><div class="step-top"><span class="step-number">0${i + 1}</span><span class="step-line"></span></div><p>${t}</p></article>`).join('')}</div></div></section>`;

      const pv = PROCESS[variant('methode')];
      const process = `<section class="section process-section" id="methode"><div class="container"><p class="eyebrow"><span></span>Notre méthode</p><div class="section-heading"><h2>${pv.h2}</h2></div><div class="process-grid">${pv.steps.map(([t, x], i) => `<article class="process-step"><div class="step-top"><span class="step-number">0${i + 1}</span><span class="step-line"></span></div><h3>${t}</h3><p>${x}</p></article>`).join('')}</div></div></section>`;

      const pool = FAQ_GENERALE[p.key];
      const generales = [pool[variant('faq1')], pool[variant('faq2')]];
      const faq = [...bloc.faq.map((q) => ({ q: q.q, a: esc(q.r), local: true })), ...generales];
      const faqSection = `<section class="section local-seo-faq" id="faq-locale"><div class="container simple-explainer"><p class="eyebrow"><span></span>Vos questions</p><h2>${HEADINGS.faq(name)[variant('titreFaq')]}</h2></div><div class="container local-body"><div class="local-faq">${faq.map((q) => { const det = `<details><summary>${esc(q.q)}<span>+</span></summary><p>${q.a}</p></details>`; return q.local ? `<!--LOCAL-->${det}<!--/LOCAL-->` : det; }).join('')}</div></div></section>`;

      const advisorPhoto = (/<div class="advisor-photo">[\s\S]*?<\/div>/.exec(extract(template, /<section class="section advisor-section"[\s\S]*?<\/section>/)) || [])[0] || '';
      const advisor = `<section class="section advisor-section condensed" id="votre-courtier"><div class="container advisor-layout">${advisorPhoto}<div class="advisor-copy"><p class="eyebrow"><span></span>Votre courtier</p><h2>Gabriel Perbost</h2><p class="section-intro">Courtier en assurance, cabinet GP Finances à Issy-les-Moulineaux · ORIAS 23003789. ${esc(ville.accesBureau)}</p></div></div></section>`;

      // Maillage : les autres pages de la même ville, puis les autres villes pour ce produit.
      const autres = VILLES_EPARGNE.filter((x) => x.slug !== ve.slug).map((x) => `<a href="${p.route}/${x.slug}">${esc(VILLE_BY_SLUG.get(x.slug).nom)}</a>`).join('');
      const liens = `<section class="section local-seo-city" id="aussi"><div class="container local-body"><p class="city-links-label">Aussi à ${name} :</p><p class="city-links"><a href="${p.autre.route}/${ve.slug}">${p.autre.label(name)}</a><a href="/assurance-emprunteur/${ve.slug}">Assurance de prêt à ${name}</a></p><p class="city-links-label">${p.metier} dans d’autres villes :</p><p class="city-links">${autres}</p></div></section>`;

      const finalCta = extract(template, /<section class="final-section">[\s\S]*?<\/section>/);
      const main = [hero, ticker, temoignages, localSection, simulator, pourquoi, faqSection, process, advisor, liens, finalCta].join('');

      const title0 = bloc.meta.title;
      const title = title0.includes('GP Finances') ? title0 : (title0.length <= 52 ? `${title0} | GP Finances` : title0);
      const breadcrumbSchema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN + '/' }, { '@type': 'ListItem', position: 2, name: p.nom, item: ORIGIN + p.route }, { '@type': 'ListItem', position: 3, name: nomBrut, item: url }] };
      const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: plain(q.a) } })) };

      let html = template
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(bloc.meta.description)}$2`)
        .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(bloc.meta.description)}$2`)
        .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
        .replace(/"url":"[^"]*"/, `"url":"${url}"`)
        .replace(/"description":"[^"]*"/, `"description":"${esc(bloc.meta.description)}"`)
        .replace('"areaServed":"FR"', `"areaServed":{"@type":"City","name":"${esc(nomBrut)}"}`)
        .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"BreadcrumbList".*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`)
        .replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"FAQPage".*?<\/script>/s, `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`)
        .replace(/<main id="main">[\s\S]*?<\/main>/, `<main id="main">${main}</main>`);
      if (!html.includes(`<title>${esc(title)}</title>`) || !html.includes(url)) throw new Error(`page ${route} mal formée`);
      fs.writeFileSync(path.join(PAGES, p.dir, ve.slug + '.html'), html);
      routes.push(route);
    });

    // Page produit principale : liens vers les pages villes, juste avant l'appel final.
    const liste = VILLES_EPARGNE.map((x) => `<a href="${p.route}/${x.slug}">${esc(VILLE_BY_SLUG.get(x.slug).nom)}</a>`).join('');
    const bloc = `<section class="section local-seo-city" id="pres-de-chez-vous"><div class="container local-body"><p class="city-links-label">${p.metier} près de chez vous :</p><p class="city-links">${liste}</p></div></section>`;
    const file = path.join(PAGES, p.base + '.html');
    const page = fs.readFileSync(file, 'utf8');
    if (!page.includes('<section class="final-section">')) throw new Error(`appel final introuvable sur ${p.base}`);
    fs.writeFileSync(file, page.replace('<section class="final-section">', bloc + '<section class="final-section">'));
  }
  return routes;
};
