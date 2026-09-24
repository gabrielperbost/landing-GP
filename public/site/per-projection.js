/* Optional capital projection. Independent of the income-tax calculation. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GPPerProjection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const ENTRY_FEE = .01;
  const number = value => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));
  function calculate({contribution, annualPayment, years, annualRate}) {
    const errors = [];
    for (const [field, value] of Object.entries({contribution, annualPayment})) {
      if (!number(value) || Number(value) < 0 || Number(value) > 10000000) errors.push({field, message:'Indiquez un versement compris entre 0 et 10 000 000 €.'});
    }
    if (!number(years) || !Number.isInteger(Number(years)) || Number(years) < 0 || Number(years) > 60) errors.push({field:'years', message:'Choisissez une durée entière de 0 à 60 ans.'});
    if (!number(annualRate) || Number(annualRate) < 0 || Number(annualRate) > 10) errors.push({field:'annualRate', message:'Choisissez un rendement hypothétique entre 0 % et 10 %.'});
    if (errors.length) return {valid:false, errors};
    const initial = Number(contribution), annual = Number(annualPayment), duration = Number(years), rate = Number(annualRate) / 100;
    let capital = initial * (1 - ENTRY_FEE);
    const points = [{year:0, paid:initial, fees:initial * ENTRY_FEE, capital}];
    for (let year = 1; year <= duration; year++) {
      capital = capital * (1 + rate) + annual * (1 - ENTRY_FEE);
      const paid = initial + year * annual;
      points.push({year, paid, fees:paid * ENTRY_FEE, capital});
    }
    const last = points.at(-1);
    return {valid:true, errors:[], ...last, annual, duration, rate, entryFee:ENTRY_FEE,
      performance:capital - (last.paid - last.fees), points};
  }
  return {ENTRY_FEE, calculate};
});
