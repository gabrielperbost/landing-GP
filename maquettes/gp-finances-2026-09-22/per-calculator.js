/* Indicative PER model, checked against the official 2026 income-tax rules.
   2026 contributions are taxed on 2026 income in 2027: its scale is not yet known.
   No RFR-to-professional-income conversion is made. See SOURCES-SIMULATEUR.md. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GPPerCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const RULES = Object.freeze({
    taxYear: 2026, incomeYear: 2025, contributionYear: 2026,
    brackets: [11600, 29579, 84577, 181917, Infinity],
    rates: [0, .11, .30, .41, .45],
    halfPartCap: 1807, discountSingle: 897, discountCouple: 1483,
    discountRate: .4525, annualCapMin: 4710, annualCapMax: 37680
  });
  const present = x => x !== null && x !== undefined && x !== '';
  const money = x => present(x) && Number.isFinite(Number(x)) && Number(x) >= 0 && Number(x) <= 10000000;
  function bracketRate(incomePerPart) {
    return RULES.rates[RULES.brackets.findIndex(limit => incomePerPart <= limit)];
  }
  function progressiveTax(income, parts) {
    const quotient = Math.max(0, income) / parts;
    let total = 0, floor = 0;
    for (let i = 0; i < RULES.brackets.length; i++) {
      total += Math.max(0, Math.min(quotient, RULES.brackets[i]) - floor) * RULES.rates[i];
      floor = RULES.brackets[i];
      if (quotient <= floor) break;
    }
    return total * parts;
  }
  function incomeTax(income, parts, household) {
    const baseParts = household === 'couple' ? 2 : 1;
    const unbounded = progressiveTax(income, parts);
    const baseTax = progressiveTax(income, baseParts);
    const taxWithFamilyCap = Math.max(0, baseTax - (parts - baseParts) * 2 * RULES.halfPartCap);
    const familyCapped = taxWithFamilyCap > unbounded + .000001;
    const gross = Math.max(unbounded, taxWithFamilyCap);
    const discount = Math.max(0, (household === 'couple' ? RULES.discountCouple : RULES.discountSingle) - RULES.discountRate * gross);
    return {
      gross, net: Math.round(Math.max(0, gross - discount)), familyCapped,
      tmi: bracketRate(Math.max(0, income) / (familyCapped ? baseParts : parts))
    };
  }
  function annualCap(professionalIncome, reductions = 0) {
    return Math.max(0, Math.round(Math.max(RULES.annualCapMin, Math.min(professionalIncome * .1, RULES.annualCapMax))) - reductions);
  }
  function calculate(input) {
    const errors = [];
    const fail = (field, message) => errors.push({field, message});
    const hasNetIncome = present(input.netIncome);
    const incomeField = hasNetIncome ? 'netIncome' : 'rfr';
    if (!money(input[incomeField])) fail(incomeField, 'Renseignez un revenu annuel positif ou nul.');
    if (present(input.rfr) && !money(input.rfr)) fail('rfr', 'Vérifiez votre revenu fiscal de référence.');
    if (!['single','couple'].includes(input.household)) fail('household', 'Cette situation demande une étude personnalisée : contactez Gabriel.');
    const baseParts = input.household === 'couple' ? 2 : 1;
    const parts = Number(input.parts);
    if (!present(input.parts) || !Number.isFinite(parts) || parts < baseParts || parts > 20 || !Number.isInteger(parts * 4)) {
      fail('parts', `Indiquez au moins ${baseParts} part${baseParts > 1 ? 's' : ''}, par pas de 0,25.`);
    }
    if (!['under70','70plus'].includes(input.ageBand)) fail('ageBand', 'Précisez votre âge au moment du versement.');
    const used = present(input.usedCap) ? Number(input.usedCap) : 0;
    if (!money(used)) fail('usedCap', 'Le plafond déjà utilisé doit être positif ou nul.');
    if (!money(input.contribution)) fail('contribution', 'Indiquez le versement que vous souhaitez tester.');
    let cap = null;
    if (input.ageBand === '70plus') cap = 0;
    else if (input.capMode === 'notice') {
      if (!money(input.availableCap)) fail('availableCap', 'Renseignez le plafond de votre avis ou choisissez son estimation.');
      else cap = Math.max(0, Number(input.availableCap) - used);
    } else if (input.capMode === 'estimate') {
      const reductions = present(input.capReductions) ? Number(input.capReductions) : 0;
      if (!money(input.professionalIncome)) fail('professionalIncome', 'Indiquez vos revenus professionnels personnels de 2025, nets de frais.');
      if (!money(reductions)) fail('capReductions', 'Les réductions du plafond doivent être positives ou nulles.');
      if (money(input.professionalIncome) && money(reductions)) cap = Math.max(0, annualCap(Number(input.professionalIncome), reductions) - used);
    } else fail('capMode', 'Choisissez comment déterminer votre plafond.');
    const income = Number(input[incomeField]);
    const canTax = !errors.some(e => [incomeField,'rfr','household','parts'].includes(e.field));
    const before = canTax ? incomeTax(income, parts, input.household) : null;
    if (errors.length) return {valid:false, errors, before, remainingCap:cap};
    const contribution = Number(input.contribution);
    const deductible = Math.min(contribution, cap, income);
    const after = incomeTax(income - deductible, parts, input.household);
    const saving = Math.max(0, before.net - after.net);
    return {
      valid:true, errors:[], income, incomeSource:hasNetIncome ? 'net' : 'rfr', parts,
      capMode:input.capMode, ageBand:input.ageBand, before, after, contribution,
      remainingCap:cap, deductible, nonDeductible:contribution - deductible,
      saving, netEffort:contribution - saving, remainingAfter:Math.max(0, cap - deductible)
    };
  }
  return {RULES, progressiveTax, incomeTax, annualCap, calculate};
});
