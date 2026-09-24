/* Comparison of costs over the SAME remaining period. No insurer pricing model. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GPInsuranceCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const cents = value => Math.round((value + Number.EPSILON) * 100);
  function calculate(input = {}) {
    const errors = [];
    const number = (key, min, max, integer = false) => {
      const raw = input[key], n = Number(raw);
      if (raw == null || typeof raw === 'boolean' || String(raw).trim() === '' || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) errors.push(key);
      return n;
    };
    const {basis, mode} = input;
    if (!['monthly', 'total'].includes(basis)) errors.push('basis');
    if (!['scenario', 'quote'].includes(mode)) errors.push('mode');
    const years = number('years', 0, 35, true), months = number('months', 0, 11, true);
    const duration = years * 12 + months;
    if (Number.isFinite(duration) && (duration < 1 || duration > 420)) errors.push('duration');
    const maxCost = basis === 'monthly' ? 5000 : 1000000;
    const currentCost = number('currentCost', 0, maxCost);
    const fees = number('fees', 0, 10000);
    const reduction = mode === 'scenario' ? number('reduction', 0, 70) : null;
    const quoteCost = mode === 'quote' ? number('quoteCost', 0, maxCost) : null;
    if (errors.length) return {valid:false, errors:[...new Set(errors)]};
    // Integer cents: when monthly, round each premium before multiplying.
    const currentCents = cents(currentCost);
    const newCents = mode === 'quote' ? cents(quoteCost) : Math.round(currentCents * (1 - reduction / 100));
    const count = basis === 'monthly' ? duration : 1;
    const oldTotalCents = currentCents * count, newTotalCents = newCents * count, feeCents = cents(fees);
    const netCents = oldTotalCents - newTotalCents - feeCents;
    return {valid:true, basis, mode, years, months, duration, reduction,
      currentTotal:oldTotalCents / 100, newPremiumTotal:newTotalCents / 100,
      fees:feeCents / 100, newTotal:(newTotalCents + feeCents) / 100,
      savings:netCents / 100, monthlyEquivalent:netCents / 100 / duration,
      currentMonthly:oldTotalCents / 100 / duration, newMonthly:newTotalCents / 100 / duration,
      savingsPercent:oldTotalCents > 0 ? netCents / oldTotalCents * 100 : null
    };
  }
  return {calculate};
});
