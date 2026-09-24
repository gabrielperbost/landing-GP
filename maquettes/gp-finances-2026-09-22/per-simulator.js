/* Standalone UI: mount(root) / destroy() allow later integration in a React effect. */
(function(global, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    global.GPPerSimulator = api;
    global.document.querySelectorAll('[data-per-simulator]').forEach(root => api.mount(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const mounted = new WeakMap();
  const euroFormat = new Intl.NumberFormat('fr-FR', {style:'currency',currency:'EUR',maximumFractionDigits:0});
  const euro = value => euroFormat.format(Math.abs(value) < .5 ? 0 : value);
  const percent = value => new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(value) + ' %';
  function mount(root, options = {}) {
    if (mounted.has(root)) return mounted.get(root);
    const calculator = options.calculator || window.GPPerCalculator;
    const projection = options.projection || window.GPPerProjection;
    const profile = options.profile || window.GPPerProfile;
    if (!calculator || !projection || !profile) throw new Error('PER calculation modules are required.');
    const $ = selector => root.querySelector(selector);
    const $$ = selector => [...root.querySelectorAll(selector)];
    const form = $('#per-sim-form');
    const field = name => form.elements.namedItem(name);
    const value = name => field(name)?.value ?? '';
    const set = (name, next) => { field(name).value = next; };
    const text = (selector, next) => { $(selector).textContent = next; };
    const abort = new AbortController();
    const on = (element, event, fn) => element.addEventListener(event, fn, {signal:abort.signal});
    $$('.per-risk-choice > .per-help-panel').forEach(panel => $('.per-risk-profiles').append(panel));
    let step = 0, highest = 0, result = null, sample = false, manualParts = false, manualYears = false;
    const stageNames = ['Votre situation','Votre fiscalité','Votre versement','Votre résultat'];
    const household = () => field('special').checked || value('family') === 'widow' ? 'other' : ['married','pacs'].includes(value('family')) ? 'couple' : 'single';
    const values = () => ({
      household: household(), ageBand:profile.retirement(value('age'),value('retirementAge')).ageBand || '', parts:value('parts'),
      netIncome:value('incomeMode') === 'net' ? value('netIncome') : '',
      rfr:value('incomeMode') === 'rfr' ? value('rfr') : '',
      capMode:value('capMode'), availableCap:value('availableCap'),
      professionalIncome:value('professionalIncome'), capReductions:value('capReductions'),
      usedCap:value('usedCap'), contribution:value('contribution')
    });
    const projectionValues = () => ({contribution:value('contribution'),annualPayment:value('annualPayment'),years:value('years'),annualRate:value('annualRate')});
    function clearError() {
      $('#per-form-error').hidden = true;
      $$('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    }
    function showError(error) {
      text('#per-form-error',error.message); $('#per-form-error').hidden = false;
      const name = error.field === 'household' ? 'family' : error.field;
      const controls = $$('[name]').filter(el => el.name === name);
      controls.forEach(el => el.setAttribute('aria-invalid','true'));
      const target = controls[0];
      target?.closest('details')?.setAttribute('open','');
      target?.focus();
    }
    const familyProfile = () => profile.family({family:value('family'),children:value('children'),sharedChildren:value('sharedChildren'),special:field('special').checked});
    function sync() {
      const retirement = profile.retirement(value('age'),value('retirementAge'));
      const family = familyProfile();
      field('sharedChildren').max = Math.max(0,Number(value('children')) || 0);
      if (!manualParts) set('parts',family.valid ? family.parts : '');
      if (!manualYears) set('years',retirement.valid ? retirement.years : '');
      text('#per-years-left',retirement.valid ? `${retirement.years} an${retirement.years !== 1 ? 's' : ''}` : '—');
      text('#per-target-age',retirement.valid ? retirement.years === 0 ? `Objectif de ${retirement.retirementAge} ans déjà atteint` : `Objectif de départ : ${retirement.retirementAge} ans` : 'Indiquez votre âge pour calculer votre horizon.');
      text('#per-family-parts',family.valid ? `${new Intl.NumberFormat('fr-FR').format(family.parts)} part${family.parts > 1 ? 's' : ''}` : '—');
      text('#per-family-formula',family.valid ? `${family.baseParts} part${family.baseParts > 1 ? 's' : ''} de base + ${new Intl.NumberFormat('fr-FR').format(family.childParts)} pour les enfants` : value('family') ? 'Vérifiez la situation et les enfants renseignés.' : 'Choisissez votre situation familiale.');
      text('#per-parts-origin',manualParts ? 'Nombre corrigé manuellement depuis votre avis d’impôt.' : 'Calculé automatiquement à partir de votre famille et de vos enfants.');
      $('#per-reset-parts').hidden = !manualParts;
      text('#per-horizon-note',retirement.valid ? manualYears ? `Durée personnalisée. Votre objectif de départ à ${retirement.retirementAge} ans correspond à ${retirement.years} ans restants.` : retirement.years === 0 ? `L’objectif de départ est déjà atteint : projection immédiate. Vous pouvez choisir de prolonger l’épargne.` : `Prérempli : ${retirement.retirementAge} ans − ${retirement.age} ans = ${retirement.years} ans pour préparer votre retraite.` : 'Renseignez votre âge à la première étape.');
      $('#per-reset-years').hidden = !manualYears;
      const input = values(), estimate = input.capMode === 'estimate', over70 = input.ageBand === '70plus';
      $('#per-special-note').hidden = household() !== 'other';
      $('#per-net-fields').hidden = value('incomeMode') !== 'net';
      $('#per-rfr-fields').hidden = value('incomeMode') !== 'rfr';
      text('#per-income-note',value('incomeMode') === 'rfr' ? 'Le RFR est utilisé comme approximation du revenu imposable, en supposant vos revenus stables. Le résultat sera moins précis.' : 'Revenus supposés constants si vous reprenez le montant de l’avis 2026.');
      $('#per-cap-section').hidden = over70;
      $('#per-age-note').hidden = !over70;
      $('#per-notice-fields').hidden = estimate;
      $('#per-estimate-fields').hidden = !estimate;
      $('#per-independent-note').hidden = value('profession') !== 'independent';
      $('#per-projection-fields').hidden = !field('projectCapital').checked;
      const baseParts = household() === 'couple' ? 2 : 1;
      field('parts').min = baseParts;
      $$('[data-parts-delta]').forEach(button => {
        button.disabled = Number(button.dataset.partsDelta) < 0 ? Number(value('parts')) <= baseParts : Number(value('parts')) >= 20;
      });
      $$('[data-years-delta]').forEach(button => {
        button.disabled = Number(button.dataset.yearsDelta) < 0 ? Number(value('years')) <= 0 : Number(value('years')) >= 60;
      });
      const preview = calculator.calculate({...input, contribution:0});
      text('#per-cap-preview',Number.isFinite(preview.remainingCap) ? euro(preview.remainingCap) : '—');
      text('#per-cap-origin',over70 ? 'Selon l’âge renseigné' : estimate ? 'Plafond annuel estimé, sans reports' : 'À partir du montant de votre avis');
      const amount = Number(value('contribution')) || 0;
      const max = Math.min(10000000,Math.max(20000,Math.ceil(amount / 1000) * 1000,Math.ceil((preview.remainingCap || 0) / 1000) * 1000));
      $('#per-range').max = max; $('#per-range').value = Math.max(0,amount);
      $('#per-range').setAttribute('aria-valuetext',euro(Math.max(0,amount)));
      text('#per-range-max',euro(max));
      $('#per-use-cap').disabled = !Number.isFinite(preview.remainingCap);
      $('#per-return-range').value = value('annualRate');
      $('#per-return-range').setAttribute('aria-valuetext',percent(Number(value('annualRate'))));
      $$('[data-per-amount]').forEach(button => button.setAttribute('aria-pressed',String(value('contribution') !== '' && Number(button.dataset.perAmount) === amount)));
      $$('[data-per-return]').forEach(button => button.setAttribute('aria-pressed',String(value('annualRate') !== '' && Number(button.dataset.perReturn) === Number(value('annualRate')))));
    }
    function validate(stage) {
      if (stage === 0) {
        const retirementError = profile.retirement(value('age'),value('retirementAge')).errors[0];
        if (retirementError) return retirementError;
        if (!value('family')) return {field:'family',message:'Choisissez votre situation familiale.'};
        if (household() === 'other') return {field:'family',message:'Cette situation nécessite une étude personnalisée. Utilisez le bouton « Demander une étude personnelle ».'};
        const familyError = familyProfile().errors[0];
        if (familyError) return familyError;
        if (!value('profession')) return {field:'profession',message:'Choisissez votre situation professionnelle.'};
      }
      if (stage === 1) {
        const incomeField = value('incomeMode') === 'net' ? 'netIncome' : 'rfr';
        if (value(incomeField) === '') return {field:incomeField,message:'Indiquez le revenu annuel de votre foyer dans le champ affiché.'};
        return calculator.calculate({...values(),contribution:0}).errors[0];
      }
      if (stage === 2) {
        const error = calculator.calculate(values()).errors[0];
        if (error) return error;
        if (field('projectCapital').checked) return projection.calculate(projectionValues()).errors[0];
      }
      return null;
    }
    function visit(next, focus = true) {
      step = next;
      highest = Math.max(highest, next);
      $$('[data-per-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.perPanel) !== step; });
      $$('[data-per-step]').forEach(button => {
        const index = Number(button.dataset.perStep);
        button.disabled = index > highest || index > step;
        if (index === step) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current');
        button.dataset.done = String(index < step);
      });
      text('#per-step-label',step < 3 ? `Étape ${step + 1} sur 3 · ${stageNames[step]}` : 'Votre résultat · Simulation indicative');
      $('#per-progress-fill').style.width = `${(step + 1) * 25}%`;
      $('#per-back').hidden = step === 0;
      $('#per-next').hidden = step === 3;
      text('#per-next',step === 2 ? 'Voir mon résultat →' : 'Continuer →');
      text('#per-back',step === 3 ? '← Modifier mon versement' : '← Étape précédente');
      $('#per-restart').hidden = step !== 3;
      clearError(); sync();
      if (focus) {
        $(`#per-heading-${step}`).focus({preventScroll:true});
        root.scrollIntoView({block:'start',behavior:'instant'});
      }
    }
    function renderCapital(data) {
      $('#per-capital-chart').hidden = data.duration === 0;
      text('#per-projection-context',data.duration === 0 ? 'Projection immédiate : le versement initial après 1 % de frais, sans rendement ni versement annuel supplémentaire.' : `Dans ${data.duration} an${data.duration > 1 ? 's' : ''}, vers ${Number(value('age')) + data.duration} ans, avec ${percent(data.rate * 100)} par an et ${euro(data.annual)} versés à chaque fin d’année.`);
      text('#per-capital',euro(data.capital)); text('#per-total-paid',euro(data.paid));
      text('#per-total-fees',euro(data.fees)); text('#per-performance',euro(data.performance));
      const max = Math.max(1,...data.points.map(p => p.capital));
      const coords = data.points.map(p => [36 + p.year / Math.max(1,data.duration) * 506,150 - p.capital / max * 125]);
      const path = coords.map(([x,y],i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
      $('#per-capital-chart').innerHTML = `<title>Capital hypothétique : ${euro(data.capital)} dans ${data.duration} ans</title><path d="${path} L542,150 L36,150 Z" fill="#c9a84c19"/><path d="M36,150 H542" stroke="#d5dce4"/><path d="${path}" stroke="#b59232" stroke-width="3" stroke-linejoin="round" fill="none"/><text x="36" y="177" fill="#607184" font-family="sans-serif" font-size="12">Aujourd’hui</text><text x="542" y="177" text-anchor="end" fill="#607184" font-family="sans-serif" font-size="12">${data.duration} ans</text>`;
      $('#per-capital-rows').replaceChildren(...data.points.map(p => {
        const row = document.createElement('tr');
        const year = document.createElement('th'); year.scope = 'row'; year.textContent = p.year === 0 ? 'Aujourd’hui' : `Année ${p.year}`;
        const paid = document.createElement('td'); paid.textContent = euro(p.paid);
        const capital = document.createElement('td'); capital.textContent = euro(p.capital);
        row.append(year,paid,capital); return row;
      }));
    }
    function renderResult() {
      result = calculator.calculate(values());
      if (!result.valid) return false;
      text('#per-result-context',`${sample ? 'Exemple modifiable · ' : ''}Pour un nouveau versement de ${euro(result.contribution)} en 2026.`);
      text('#per-saving',euro(result.saving));
      text('#per-effort-text',`Soit ${euro(result.netEffort)} d’effort d’épargne après ce gain fiscal estimé.`);
      text('#per-tmi',percent(result.before.tmi * 100)); text('#per-deductible',euro(result.deductible));
      text('#per-result-income',result.incomeSource === 'rfr' ? 'Estimation fondée sur votre RFR, utilisé comme approximation du revenu imposable.' : 'Estimation fondée sur le revenu net imposable que vous avez renseigné.');
      const notes = [];
      if (result.ageBand === '70plus') notes.push('Compte tenu de l’âge renseigné, ce versement n’ouvre pas droit à une déduction en 2026.');
      else if (result.nonDeductible > 0) notes.push(`${euro(result.nonDeductible)} ne sont pas retenus pour la déduction : plafond restant ou revenu imposable insuffisant.`);
      if (result.saving === 0 && result.ageBand !== '70plus') notes.push('Ce versement ne produit pas d’économie d’impôt avec les données saisies.');
      if (result.before.tmi !== result.after.tmi) notes.push(`Votre tranche passe de ${percent(result.before.tmi * 100)} à ${percent(result.after.tmi * 100)} après versement. Le calcul tient compte de ce changement.`);
      if (result.before.familyCapped || result.after.familyCapped) notes.push('Le plafonnement général du quotient familial est pris en compte.');
      if (result.capMode === 'estimate' && result.ageBand !== '70plus') notes.push('Le plafond est une estimation annuelle. Vérifiez les reports et autres ajustements sur votre avis.');
      text('#per-result-note',notes.join(' ')); $('#per-result-note').hidden = !notes.length;
      for (const [id,num] of Object.entries({'per-tax-before-label':result.before.net,'per-tax-after-label':result.after.net,'per-tax-before':result.before.net,'per-tax-after':result.after.net,'per-tax-saving':result.saving,'per-cap-after':result.remainingAfter})) text('#'+id,euro(num));
      $('#per-tax-before-bar').style.height = result.before.net > 0 ? '100%' : '0%';
      $('#per-tax-after-bar').style.height = `${result.before.net > 0 ? result.after.net / result.before.net * 100 : 0}%`;
      $('#per-tax-chart').setAttribute('aria-label',`Impôt estimé avant : ${euro(result.before.net)}. Après : ${euro(result.after.net)}. Économie : ${euro(result.saving)}.`);
      $('#per-projection-result').hidden = !field('projectCapital').checked;
      if (field('projectCapital').checked) renderCapital(projection.calculate(projectionValues()));
      return true;
    }
    function reset() {
      form.reset(); set('incomeMode','net'); set('capMode','notice');
      highest = 0; result = null; sample = false; manualParts = false; manualYears = false;
      $$('.per-help').forEach(button => { button.setAttribute('aria-expanded','false'); $('#' + button.getAttribute('aria-controls')).hidden = true; });
      $$('details').forEach(details => details.open = false);
      visit(0);
    }
    if (typeof options.onContact === 'function') root.addEventListener('click', event => {
      const button = event.target.closest('[data-project]');
      if (!button) return;
      event.preventDefault(); event.stopPropagation();
      options.onContact({project:button.dataset.project});
    }, {capture:true,signal:abort.signal});
    on(root,'click',event => {
      const help = event.target.closest('.per-help');
      if (help) {
        const open = help.getAttribute('aria-expanded') !== 'true';
        help.setAttribute('aria-expanded',String(open)); $('#' + help.getAttribute('aria-controls')).hidden = !open;
      }
      const nav = event.target.closest('[data-per-step]');
      if (nav && !nav.disabled) { highest = Number(nav.dataset.perStep); visit(highest); }
      const amount = event.target.closest('[data-per-amount]');
      if (amount) { clearError(); set('contribution',amount.dataset.perAmount); sample = false; sync(); }
      const rate = event.target.closest('[data-per-return]');
      if (rate) { clearError(); set('annualRate',rate.dataset.perReturn); sync(); }
      const parts = event.target.closest('[data-parts-delta]');
      if (parts) { clearError(); manualParts = true; set('parts',Math.min(20,Math.max(household() === 'couple' ? 2 : 1,(Number(value('parts')) || 1) + Number(parts.dataset.partsDelta)))); sync(); }
      const years = event.target.closest('[data-years-delta]');
      if (years) { clearError(); manualYears = true; set('years',Math.min(60,Math.max(0,(Number(value('years')) || 0) + Number(years.dataset.yearsDelta)))); sync(); }
      const tab = event.target.closest('[data-per-view]');
      if (tab) {
        const chart = tab.dataset.perView === 'chart';
        $('#per-tax-chart').hidden = !chart; $('#per-tax-table').hidden = chart;
        $$('[data-per-view]').forEach(button => button.setAttribute('aria-pressed',String(button === tab)));
      }
    });
    on(root,'keydown',event => {
      if (event.key !== 'Escape') return;
      const open = $$('.per-help').filter(button => button.getAttribute('aria-expanded') === 'true');
      open.forEach(button => { button.setAttribute('aria-expanded','false'); $('#' + button.getAttribute('aria-controls')).hidden = true; });
      if (open.length) { event.stopPropagation(); open[0].focus(); }
    });
    on(form,'input',event => {
      sample = false; clearError();
      if (event.target.name === 'parts') manualParts = true;
      if (event.target.name === 'years') manualYears = true;
      if (['age','retirementAge'].includes(event.target.name)) manualYears = false;
      if (['family','children','sharedChildren','special'].includes(event.target.name)) manualParts = false;
      if (event.target.id === 'per-range') set('contribution',event.target.value);
      if (event.target.id === 'per-return-range') set('annualRate',event.target.value);
      sync();
    });
    on(form,'change',event => {
      if (['family','children','sharedChildren','special'].includes(event.target.name)) manualParts = false;
      if (['age','retirementAge'].includes(event.target.name)) manualYears = false;
      if (event.target.name === 'projectCapital' && event.target.checked && value('annualPayment') === '') set('annualPayment',value('contribution'));
      clearError(); sync();
    });
    on(form,'submit',event => {
      event.preventDefault(); clearError();
      if (step === 3) return;
      // Revalidate all prerequisites, including when values were changed programmatically.
      for (let stage = 0; stage <= step; stage++) {
        const error = validate(stage);
        if (error) { if (stage !== step) visit(stage); showError(error); return; }
      }
      if (step === 2) { if (renderResult()) visit(3); }
      else visit(step + 1);
    });
    on($('#per-reset-parts'),'click',() => { clearError(); manualParts = false; sync(); });
    on($('#per-reset-years'),'click',() => { clearError(); manualYears = false; sync(); });
    on($('#per-back'),'click',() => { highest = Math.max(0,step - 1); visit(highest); });
    on($('#per-restart'),'click',reset);
    on($('#per-use-cap'),'click',() => {
      const preview = calculator.calculate({...values(),contribution:0});
      if (Number.isFinite(preview.remainingCap)) set('contribution',preview.remainingCap);
      sample = false; sync();
    });
    on($('#per-example'),'click',() => {
      reset();
      const data = {age:44,retirementAge:64,children:0,sharedChildren:0,family:'single',profession:'employee',incomeMode:'net',netIncome:70000,parts:1,capMode:'notice',availableCap:13000,contribution:13000,annualPayment:3000};
      Object.entries(data).forEach(([name,next]) => set(name,next));
      sample = true; sync(); renderResult(); visit(3);
    });
    set('incomeMode','net'); set('capMode','notice'); visit(0,false);
    const api = {destroy() { abort.abort(); mounted.delete(root); }};
    mounted.set(root,api); return api;
  }
  return {mount};
});
