/* Local UI. mount(root, { calculator, onContact }) / destroy() for integration. */
(function(global, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    global.GPInsuranceSimulator = api;
    global.document.querySelectorAll('[data-insurance-simulator]').forEach(root => api.mount(root));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const mounted = new WeakMap();
  const euro = value => new Intl.NumberFormat('fr-FR', {style:'currency', currency:'EUR', maximumFractionDigits:Number.isInteger(value) ? 0 : 2}).format(value);
  const number = value => new Intl.NumberFormat('fr-FR', {maximumFractionDigits:1}).format(value);
  function mount(root, options = {}) {
    if (mounted.has(root)) return mounted.get(root);
    const calculator = options.calculator || globalThis.GPInsuranceCalculator;
    if (!calculator) throw new Error('Insurance calculator required.');
    const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
    const form = $('.ins-form'), field = name => form.elements.namedItem(name);
    const val = name => field(name).value;
    const text = (s, value) => { $(s).textContent = value; };
    const abort = new AbortController();
    const on = (el, type, fn, more = {}) => el.addEventListener(type, fn, {signal:abort.signal, ...more});
    let mode = 'scenario', touched = false, timer, lastResult;
    const basis = () => field('useTotals').checked ? 'total' : 'monthly';
    const costName = prefix => prefix + (basis() === 'total' ? 'Total' : 'Monthly');
    const inputs = () => ({basis:basis(), mode, currentCost:val(costName('current')), quoteCost:val(costName('quote')),
      years:val('years'), months:val('months'), fees:val('fees'), reduction:val('reduction')});
    const durationLabel = r => [r.years ? `${r.years} an${r.years > 1 ? 's' : ''}` : '', r.months ? `${r.months} mois` : ''].filter(Boolean).join(' et ');
    function closeHelp() {
      $$('.ins-help').forEach(b => { b.setAttribute('aria-expanded', 'false'); $('#'+b.getAttribute('aria-controls')).hidden = true; });
    }
    function sync() {
      const total = basis() === 'total';
      $$('[data-ins-basis]').forEach(el => { el.hidden = el.dataset.insBasis !== basis(); });
      $$('[data-ins-mode]').forEach(el => { el.hidden = el.dataset.insMode !== mode; });
      ['currentMonthly','currentTotal','quoteMonthly','quoteTotal','reduction','reductionRange'].forEach(name => {
        field(name).disabled = ![costName('current'), ...(mode === 'quote' ? [costName('quote')] : ['reduction','reductionRange'])].includes(name);
      });
      $('[data-ins-current-label]').htmlFor = 'ins-current-' + basis();
      $('[data-ins-quote-label]').htmlFor = 'ins-quote-' + basis();
      text('[data-ins-current-label]', total ? 'Coût restant de votre assurance' : 'Votre assurance actuelle');
      text('[data-ins-quote-label]', total ? 'Coût du devis sur cette même durée' : 'La cotisation de votre devis');
      text('#ins-current-hint', total ? 'La somme des cotisations encore à payer, sur votre échéancier.' : 'Le montant d’assurance prélevé chaque mois.');
      text('[data-ins-toggle-mode]', mode === 'quote' ? 'Revenir à une hypothèse de baisse ↗' : 'J’ai déjà un devis à comparer ↗');
      $('[data-ins-toggle-mode]').setAttribute('aria-pressed', String(mode === 'quote'));
      text('[data-ins-example]', touched ? (mode === 'quote' ? 'Votre comparaison · Ajustez vos montants.' : 'Votre scénario · Ajustez vos montants.') : 'Exemple prérempli · À vous de personnaliser.');
      if (val('years') !== '' && Number.isFinite(Number(val('years')))) field('yearsRange').value = val('years');
      if (val('reduction') !== '' && Number.isFinite(Number(val('reduction')))) field('reductionRange').value = val('reduction');
      ['yearsRange','reductionRange'].forEach(name => {
        const f = field(name); f.style.setProperty('--ins-fill', (Number(f.value) / Number(f.max) * 100) + '%');
      });
      $$('[data-ins-rate]').forEach(b => b.setAttribute('aria-pressed', String(val('reduction') !== '' && Number(b.dataset.insRate) === Number(val('reduction')))));
      $$('[data-ins-step]').forEach(b => {
        const f = field(b.dataset.insStep), n = Number(f.value);
        b.disabled = f.value !== '' && (Number(b.dataset.delta) < 0 ? n <= Number(f.min) : n >= Number(f.max));
      });
      text('[data-ins-assumptions]', (mode === 'scenario' ? 'Estimation illustrative, sans tarif d’assureur. ' : 'Comparaison des montants saisis, sous réserve de garanties et de quotités comparables. ') +
        (total ? 'Coûts totaux restants saisis, sur la même période. ' : 'Cotisations supposées constantes sur la durée restante. ') + 'Le montant réel dépend du dossier et des garanties.');
    }
    function render() {
      sync();
      $$('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
      const r = calculator.calculate(inputs()); lastResult = r;
      $('[data-ins-empty]').hidden = r.valid;
      $('[data-ins-result]').hidden = !r.valid;
      $('[data-ins-error]').hidden = r.valid;
      clearTimeout(timer);
      if (!r.valid) {
        const messages = {
          currentCost:basis() === 'total' ? 'Indiquez le coût restant actuel (de 0 à 1 000 000 €).' : 'Indiquez votre cotisation actuelle (de 0 à 5 000 € par mois).',
          quoteCost:basis() === 'total' ? 'Indiquez le coût du devis sur la même durée (de 0 à 1 000 000 €).' : 'Indiquez la cotisation du devis (de 0 à 5 000 € par mois).',
          years:'Indiquez un nombre entier d’années entre 0 et 35.', months:'Indiquez de 0 à 11 mois supplémentaires.',
          duration:'La durée totale doit aller de 1 mois à 35 ans.', fees:'Indiquez les frais supplémentaires, de 0 à 10 000 € (0 si aucun).', reduction:'Choisissez une hypothèse de baisse entre 0 et 70 %.'
        };
        text('[data-ins-error]', messages[r.errors[0]] || 'Vérifiez vos informations.');
        r.errors.forEach(key => {
          const target = field(key === 'currentCost' ? costName('current') : key === 'quoteCost' ? costName('quote') : key === 'duration' ? 'years' : key);
          target?.setAttribute('aria-invalid', 'true'); target?.closest('.ins-details')?.setAttribute('open', '');
        });
        $('.ins-result').removeAttribute('data-outcome');
        text('[data-ins-announcement]', 'Complétez ou corrigez vos informations pour voir le résultat.');
        return;
      }
      const positive = r.savings > 0, negative = r.savings < 0, period = durationLabel(r);
      $('.ins-result').dataset.outcome = negative ? 'cost' : positive ? 'saving' : 'neutral';
      text('[data-ins-scenario]', mode === 'scenario' ? `Hypothèse : baisse de ${number(r.reduction)} %` : 'Comparaison de votre devis');
      const label = `${negative ? 'Surcoût simulé' : positive ? 'Économie simulée' : 'Économie nette'} sur ${period}`;
      text('[data-ins-result-label]', label);
      text('[data-ins-total]', euro(Math.abs(r.savings)));
      text('[data-ins-monthly]', `Soit ${euro(Math.abs(r.monthlyEquivalent))} ${negative ? 'de plus' : 'de moins'} par mois en moyenne, frais inclus.`);
      if (r.savings === 0) text('[data-ins-monthly]', 'Les deux coûts sont identiques, frais inclus.');
      text('[data-ins-before]', euro(r.currentTotal)); text('[data-ins-after]', euro(r.newTotal));
      text('[data-ins-after-label]', mode === 'quote' ? 'Votre devis, frais inclus' : 'Avec cette hypothèse');
      const max = Math.max(r.currentTotal, r.newTotal, 1);
      $('[data-ins-bar-before]').style.width = (r.currentTotal / max * 100) + '%';
      $('[data-ins-bar-after]').style.width = (r.newTotal / max * 100) + '%';
      text('[data-ins-fees-note]', r.fees > 0 ? `Dont ${euro(r.fees)} de frais supplémentaires déduits de l’économie.` : 'Calcul sans frais supplémentaires. À préciser dans « Affiner mon calcul » si nécessaire.');
      text('[data-ins-verdict]', negative ? 'Dans ce scénario, changer coûterait plus cher. Une étude permet de comparer le coût et la protection.' : !positive ? 'Pas d’économie dans ce scénario. Les garanties restent à comparer.' : mode === 'scenario' ? 'Voilà l’effet de cette baisse sur votre budget. Vérifions ensemble ce qui est possible pour vous.' : 'Un écart à confirmer en vérifiant les garanties, les quotités et les échéanciers des deux contrats.');
      timer = setTimeout(() => text('[data-ins-announcement]', `${label} : ${euro(Math.abs(r.savings))}.`), 300);
    }
    function changed(e) {
      touched = true;
      if (e.target.name === 'yearsRange') field('years').value = e.target.value;
      if (e.target.name === 'reductionRange') field('reduction').value = e.target.value;
      if (e.target.name === 'useTotals') closeHelp();
      render();
    }
    on(form, 'input', changed); on(form, 'change', changed);
    on(form, 'submit', e => { e.preventDefault(); render(); });
    on(root, 'click', e => {
      const help = e.target.closest('.ins-help');
      if (help) { const show = help.getAttribute('aria-expanded') !== 'true'; closeHelp(); help.setAttribute('aria-expanded', String(show)); $('#'+help.getAttribute('aria-controls')).hidden = !show; return; }
      const step = e.target.closest('[data-ins-step]'), rate = e.target.closest('[data-ins-rate]');
      if (step) {
        const f = field(step.dataset.insStep), next = Number(f.value || 0) + Number(step.dataset.delta);
        f.value = Math.round(Math.min(Number(f.max), Math.max(Number(f.min), next)) * 100) / 100;
      } else if (rate) field('reduction').value = rate.dataset.insRate;
      else if (e.target.closest('[data-ins-toggle-mode]')) { mode = mode === 'quote' ? 'scenario' : 'quote'; closeHelp(); }
      else return;
      touched = true; render();
    });
    on(root, 'keydown', e => {
      if (e.key !== 'Escape') return;
      const opened = $('.ins-help[aria-expanded="true"]');
      if (opened) { closeHelp(); opened.focus(); e.preventDefault(); }
    });
    if (options.onContact) on($('[data-ins-contact]'), 'click', e => {
      e.preventDefault(); e.stopImmediatePropagation(); options.onContact({project:'Assurance emprunteur'});
    }, {capture:true});
    const instance = {getResult:() => lastResult, destroy() { clearTimeout(timer); abort.abort(); mounted.delete(root); }};
    mounted.set(root, instance); render(); return instance;
  }
  return {mount};
});
