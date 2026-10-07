/* Estimation assurance emprunteur : appelle la route serveur GP FINANCES.
 * Aucun assureur, produit ni tarif n'est connu du navigateur : la route renvoie
 * « Solution 1/2/3 » ou un message invitant à appeler.
 * Un ou deux emprunteurs, chacun avec sa quotité (100 % si laissée vide). */
(function () {
  'use strict';
  const refs = window.GPBorrowerReferences || {professionalCategories:[], professions:[]};
  // Espace fine (U+202F) remplacée par une espace insécable normale : plus lisible
  // sur les gros montants, surtout combinée au letter-spacing négatif de .bq-total.
  const euro = v => new Intl.NumberFormat('fr-FR', {style:'currency', currency:'EUR', maximumFractionDigits:v % 1 ? 2 : 0}).format(v).replace(/ /g, ' ');
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const CALL = 'Votre situation demande quelques précisions : appelez GP FINANCES, nous affinons votre étude avec vous.';
  const RISKS = [
    ['abroadTravel', 'Effectuez-vous des déplacements professionnels à l’étranger&nbsp;?'],
    ['aerialOrLandSport', 'Pratiquez-vous un sport aérien ou terrestre (parachutisme, sports mécaniques…)&nbsp;?'],
    ['highMileage', 'Vos déplacements professionnels dépassent-ils 15&nbsp;000&nbsp;km par an&nbsp;?'],
    ['workAtHeight', 'Travaillez-vous à plus de 15&nbsp;mètres de hauteur&nbsp;?'],
    ['heavyLoadHandling', 'Manipulez-vous régulièrement des charges de plus de 15&nbsp;kg&nbsp;?']
  ];
  const yesNo = (name, legend, required) => '<fieldset class="bq-yn"><legend>' + legend + '</legend><div class="bq-pills">' +
    '<label class="bq-pill"><input type="radio" name="' + name + '" value="yes"' + (required ? ' required' : '') + '><span>Oui</span></label>' +
    '<label class="bq-pill"><input type="radio" name="' + name + '" value="no"><span>Non</span></label></div></fieldset>';

  function identityHTML(p, who) {
    return '<div class="ins-field"><label for="bq-' + p + 'title">Civilité</label><select id="bq-' + p + 'title" name="' + p + 'title" required><option value="">Choisir</option><option>Madame</option><option>Monsieur</option></select></div>' +
      '<div class="ins-field"><label for="bq-' + p + 'birth">Date de naissance</label><input id="bq-' + p + 'birth" name="' + p + 'birthDate" type="date" min="1940-01-01" required></div>' +
      '<div class="ins-field bq-wide"><label for="bq-' + p + 'category">Situation professionnelle</label><select id="bq-' + p + 'category" name="' + p + 'category" required><option value="">Choisir</option></select></div>' +
      '<div class="ins-field bq-wide bq-profession"><div class="ins-label"><label for="bq-' + p + 'profession">' + (who === 'co' ? 'Profession du second emprunteur' : 'Votre profession') + '</label><button type="button" class="ins-help" aria-expanded="false" aria-controls="bq-help-' + p + 'prof" aria-label="Aide : profession">?</button></div><p id="bq-help-' + p + 'prof" class="ins-help-panel" hidden>Tapez quelques lettres puis choisissez le métier dans la liste : elle sert à évaluer les risques du contrat.</p><input id="bq-' + p + 'profession" name="' + p + 'professionQuery" autocomplete="off" placeholder="Ex. : infirmier, comptable…" required><ul class="bq-suggest" data-bq-suggest role="listbox" hidden></ul></div>' +
      '<div class="ins-field bq-wide"><div class="ins-label"><label for="bq-' + p + 'share">' + (who === 'co' ? 'Quotité du second emprunteur' : 'Votre quotité') + ' <span class="bq-optional">(facultatif)</span></label><button type="button" class="ins-help" aria-expanded="false" aria-controls="bq-help-' + p + 'share" aria-label="Aide : quotité">?</button></div>' +
      '<p id="bq-help-' + p + 'share" class="ins-help-panel" hidden>La quotité est la part du prêt couverte par l’assurance pour cette personne. Sans indication, elle est de 100 %. À deux, chacun peut être assuré à 100 %, ou le capital être réparti (par exemple 50 % / 50 %) : la somme doit atteindre au moins 100 %.</p>' +
      '<div class="ins-money ins-money-simple bq-share"><input id="bq-' + p + 'share" name="' + p + 'share" inputmode="numeric" placeholder="100"><span>%</span></div></div>';
  }
  function profileHTML(p) {
    return yesNo(p + 'smoker', 'Êtes-vous fumeur (cigarette électronique comprise)&nbsp;?', true) +
      RISKS.map(([key, label]) => yesNo(p + key, label, true)).join('') +
      yesNo(p + 'hasOther', 'Avez-vous d’autres crédits en cours déjà assurés&nbsp;?', true) +
      '<div class="ins-field" data-bq-other="' + p + '" hidden><label for="bq-' + p + 'other">Capital restant dû total de ces autres crédits</label><div class="ins-money ins-money-simple"><input id="bq-' + p + 'other" name="' + p + 'otherAmount" inputmode="decimal"><span>€</span></div></div>';
  }

  function endpoint(root) {
    if (root.dataset.quoteEndpoint) return root.dataset.quoteEndpoint;
    const local = location.protocol === 'file:' || (['localhost', '127.0.0.1'].includes(location.hostname) && location.port !== '3111');
    return (local ? 'http://localhost:3111' : '') + '/api/assurance-emprunteur/quote';
  }

  function mount(root) {
    const $ = s => root.querySelector(s);
    const form = $('.ins-form'), el = n => form.elements.namedItem(n);
    const panels = {empty:$('[data-bq-empty]'), loading:$('[data-bq-loading]'), quote:$('[data-bq-quote]'), call:$('[data-bq-call]')};
    const show = name => Object.entries(panels).forEach(([k, node]) => { node.hidden = k !== name; });
    const errorBox = $('[data-bq-error]');
    const professions = {p_:null, c_:null};
    let coveredByTwo = false;

    $('[data-bq-slot="main-identity"]').innerHTML = identityHTML('p_', 'main');
    $('[data-bq-slot="main-profile"]').innerHTML = profileHTML('p_');
    $('[data-bq-slot="co-identity"]').innerHTML = identityHTML('c_', 'co');
    $('[data-bq-slot="co-profile"]').innerHTML = profileHTML('c_');
    // Champs du second emprunteur : obligatoires seulement s'il est affiché.
    // Tous les champs sont désactivés (donc ignorés par la validation) tant qu'il n'y a pas de second emprunteur.
    const setCoRequired = on => root.querySelectorAll('[data-bq-co]').forEach(box => box.querySelectorAll('input,select').forEach(f => { f.disabled = !on; }));
    setCoRequired(false);

    ['p_', 'c_'].forEach(p => {
      refs.professionalCategories.forEach(c => el(p + 'category').add(new Option(c.title, c.code)));
      el(p + 'birthDate').max = new Date().toISOString().slice(0, 10);
      const input = el(p + 'professionQuery'), suggest = input.parentElement.querySelector('[data-bq-suggest]');
      input.addEventListener('input', e => {
        professions[p] = null;
        const q = norm(e.target.value.trim());
        suggest.innerHTML = '';
        const found = q.length < 2 ? [] : refs.professions.filter(x => norm(x.title).includes(q)).slice(0, 8);
        found.forEach(x => {
          const li = document.createElement('li'), b = document.createElement('button');
          b.type = 'button'; b.textContent = x.title;
          b.addEventListener('click', () => { professions[p] = x; input.value = x.title; suggest.hidden = true; });
          li.appendChild(b); suggest.appendChild(li);
        });
        suggest.hidden = !found.length;
      });
      form.querySelectorAll('[name=' + p + 'hasOther]').forEach(r => r.addEventListener('change', () => {
        const yes = el(p + 'hasOther').value === 'yes';
        $('[data-bq-other="' + p + '"]').hidden = !yes; el(p + 'otherAmount').required = yes;
      }));
    });
    document.addEventListener('click', e => { if (!e.target.closest('.bq-profession')) root.querySelectorAll('[data-bq-suggest]').forEach(u => { u.hidden = true; }); });

    form.querySelectorAll('[name=hasCo]').forEach(r => r.addEventListener('change', () => {
      coveredByTwo = el('hasCo').value === 'yes';
      root.querySelectorAll('[data-bq-co]').forEach(box => { box.hidden = !coveredByTwo; });
      setCoRequired(coveredByTwo);
    }));

    root.addEventListener('click', e => {
      const b = e.target.closest('.ins-help');
      if (!b) return;
      const open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!open));
      document.getElementById(b.getAttribute('aria-controls')).hidden = open;
    });

    const fail = message => { errorBox.textContent = message; errorBox.hidden = false; return false; };
    const num = v => Number(String(v).replace(/\s/g, '').replace(',', '.'));
    const yes = n => el(n).value === 'yes';

    function readPerson(p, label) {
      if (!professions[p]) return {error:'Choisissez la profession ' + label + ' dans la liste proposée.'};
      const rawShare = el(p + 'share').value.trim();
      const share = rawShare === '' ? 100 : num(rawShare);
      if (!Number.isInteger(share) || share < 1 || share > 100) return {error:'La quotité ' + label + ' doit être un nombre entier entre 1 et 100 %.'};
      const other = yes(p + 'hasOther') ? num(el(p + 'otherAmount').value) : 0;
      if (!(other >= 0)) return {error:'Indiquez le montant des autres crédits assurés ' + label + '.'};
      const risks = {};
      RISKS.forEach(([key]) => { risks[key] = yes(p + key); });
      return {share, person:{title:el(p + 'title').value, birthDate:el(p + 'birthDate').value, professionalCategory:el(p + 'category').value,
        profession:professions[p].code, smoker:yes(p + 'smoker'), otherInsuredOutstanding:other, coveragePercentage:share, ...risks}};
    }

    function render(solutions, two) {
      const list = $('[data-bq-solutions]');
      list.innerHTML = '';
      $('[data-bq-both]').hidden = !two;
      solutions.forEach(s => {
        const card = document.createElement('article');
        card.className = 'bq-solution' + (s.rank === 1 ? ' is-best' : '');
        const basis = s.contributionBasis === 'capital_restant_du'
          ? 'Cotisations sur le capital restant dû : elles baissent avec le temps.'
          : 'Cotisations sur le capital initial : montant stable pendant toute la durée.';
        card.innerHTML = '<p class="bq-rank"></p><output class="bq-total"></output><p class="bq-avg"></p><p class="bq-line"></p><p class="bq-basis"></p>';
        card.querySelector('.bq-rank').textContent = s.name + (s.rank === 1 ? ' · la plus avantageuse' : '');
        card.querySelector('.bq-total').textContent = euro(s.total);
        card.querySelector('.bq-avg').innerHTML = 'Cotisation moyenne : <strong></strong> / mois';
        card.querySelector('.bq-avg strong').textContent = euro(s.averageMonthly);
        card.querySelector('.bq-line').textContent = 'Première année ' + (s.firstYear != null ? euro(s.firstYear) : '—') + ' · sur 8 ans ' + (s.eightYears != null ? euro(s.eightYears) : '—');
        card.querySelector('.bq-basis').textContent = basis;
        list.appendChild(card);
      });
    }

    function callState(text) {
      $('[data-bq-call-title]').textContent = 'Appelez-moi';
      $('[data-bq-call-text]').textContent = text || CALL;
      show('call');
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      errorBox.hidden = true;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!el('consent').checked) return fail('Cochez la case de consentement pour obtenir votre estimation.');
      const main = readPerson('p_', 'de l’emprunteur');
      if (main.error) return fail(main.error);
      const co = coveredByTwo ? readPerson('c_', 'du second emprunteur') : null;
      if (co && co.error) return fail(co.error);
      const totalShare = main.share + (co ? co.share : 0);
      if (totalShare < 100) return fail('La somme des quotités est de ' + totalShare + ' % : le prêt doit être couvert à 100 % au moins. Augmentez une quotité ou ajoutez un second emprunteur.');
      const capital = num(el('amount').value), months = Number(el('months').value), rate = num(el('rate').value);
      if (!(capital >= 1000)) return fail('Indiquez le capital restant dû (au moins 1 000 €).');
      if (!Number.isInteger(months) || months < 12 || months > 420) return fail('La durée restante doit être comprise entre 12 et 420 mois.');
      if (!(rate >= 0 && rate <= 15)) return fail('Indiquez le taux d’intérêt de votre prêt (entre 0 et 15 %).');
      const body = {
        address:{postCode:el('postCode').value, city:el('city').value.replace(/[{}<>]/g, '')},
        projectType:el('projectType').value,
        effectiveDate:new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
        consent:true,
        person:main.person,
        ...(co ? {coBorrower:co.person} : {}),
        loan:{loanType:'Classique', borrowedAmount:capital, loanDuration:months, interestRate:rate}
      };
      show('loading');
      window.gpTrack && window.gpTrack('simulation_envoyee', {simulateur:'assurance_emprunteur', emprunteurs:co ? 2 : 1});
      $('[data-bq-submit]').disabled = true;
      try {
        const response = await fetch(endpoint(root), {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
        if (response.status === 429) return callState('Trop de simulations en peu de temps. Réessayez dans quelques minutes ou appelez-moi.');
        const data = await response.json();
        if (data.status === 'quote' && Array.isArray(data.solutions) && data.solutions.length) {
          render(data.solutions, !!co); show('quote');
          window.dispatchEvent(new CustomEvent('gp:simulation-result', {detail:{type:'assurance_emprunteur', summary:{
            capital_restant_du:Math.round(capital), duree_restante_mois:months, taux_pret:rate, emprunteurs:co ? 2 : 1,
            profession:professions.p_.title, meilleure_solution_total:Math.round(data.solutions[0].total), meilleure_solution_moyenne_mensuelle:Math.round(data.solutions[0].averageMonthly * 100) / 100,
            ville:body.address.city}}}));
          window.gpTrack && window.gpTrack('simulation_resultat', {simulateur:'assurance_emprunteur', emprunteurs:co ? 2 : 1, solutions:data.solutions.length, capital_tranche:capital < 100000 ? 'moins_de_100k' : capital < 200000 ? '100k_200k' : capital < 400000 ? '200k_400k' : 'plus_de_400k', meilleure_solution_euros:Math.round(data.solutions[0].total)});
        } else {
          callState(data.message);
          window.gpTrack && window.gpTrack('simulation_appel_demande', {simulateur:'assurance_emprunteur'});
        }
      } catch {
        callState('Le service est momentanément indisponible. Appelez-moi, je vous réponds directement.');
      } finally { $('[data-bq-submit]').disabled = false; }
      if (window.matchMedia('(max-width:760px)').matches) $('[data-bq-result]').scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
  document.querySelectorAll('[data-borrower-quote]').forEach(mount);
})();
