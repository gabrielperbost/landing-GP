'use strict';

/* Server-side quote for the GP FINANCES white-label borrower-insurance offer
 * (top 3 "Solutions" over five products, CI and CDR contributions).
 * - Offer settings (commission 4010, product, guarantees) are fixed here and
 *   never read from the public form.
 * - The loan amount is the REMAINING capital and the duration the REMAINING
 *   months, both at the effective date.
 * - One or two borrowers, each with his coverage share (quotité, 100 % by default).
 * - Anything unusual returns {status:'call'}: the visitor is asked to phone
 *   GP FINANCES; no price is ever guessed.
 * - No partner name, product code or title is ever returned.
 */
const {buildRequest} = require('./build-request.cjs');
const {parsePricing} = require('./parse-response.cjs');

const COVERAGES = [
  {guaranteeCode:'Deces'}, {guaranteeCode:'PTIA'},
  {guaranteeCode:'ITT', deductibleCode:'090', levelCode:'ConfortPlus'},
  {guaranteeCode:'IPT', compensationMode:'Capital', levelCode:'ConfortPlus'},
  {guaranteeCode:'IPP'},
];
// Every product of the range is priced in both contribution types:
//   Variable  = contributions on the remaining capital (CDR)
//   Constante = contributions on the initial capital (CI)
// A product may be refused for a given profile (HTTP 412: minimum age, Lemoine
// no-questionnaire scheme...); it is then simply left out of the ranking.
const PRODUCTS = Object.freeze(['ADPv4', 'ADPIntegral', 'ADPEquilibre', 'ADPEssentiel', 'ADPHorizon']);
const BASIS = Object.freeze({Variable:'capital_restant_du', Constante:'capital_initial'});
const OFFER = Object.freeze({
  commission:'4010',
  products:Object.freeze(PRODUCTS.flatMap(productCode => Object.keys(BASIS).map(contributionType =>
    Object.freeze({productCode, contributionType, coverages:COVERAGES})))),
});
const TOP = 3;

const CALL_MESSAGE = 'Votre situation demande quelques précisions : appelez GP FINANCES, nous affinons votre étude avec vous.';
// Risk answers other than "smoker" (priced) need a human before any figure.
const CALL_IF_TRUE = ['abroadTravel', 'aerialOrLandSport', 'highMileage', 'workAtHeight', 'heavyLoadHandling'];

const call = reason => ({status:'call', reason, message:CALL_MESSAGE});

async function quote(input, client) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return call('INPUT_INVALID');
  // Cases outside the verified perimeter: one borrower, one classic loan.
  if (Array.isArray(input.loans) && input.loans.length > 1) return call('MULTIPLE_LOANS');
  if (input.loan?.loanType !== 'Classique') return call('LOAN_TYPE');
  if (input.loan?.deferred) return call('DEFERRED_LOAN');
  const insureds = [input.person, ...(input.coBorrower === undefined ? [] : [input.coBorrower])];
  // A yes to any of these risk questions, for either borrower, needs a human.
  if (insureds.some(person => CALL_IF_TRUE.some(key => person?.[key] === true))) return call('RISK_ANSWER');
  const outcomes = await Promise.all(OFFER.products.map(async product => {
    const built = buildRequest(input, {commission:OFFER.commission, product});
    if (!built.valid) return {invalid:true};
    try { return {product, response:await client.price(built.request)}; }
    catch (error) { return {product, status:error?.status}; }
  }));
  if (outcomes.some(o => o.invalid)) return call('REQUEST_INVALID');
  const priced = [];
  for (const o of outcomes) {
    if (!o.response) continue;
    const parsed = parsePricing(o.response, insureds.length);
    if (parsed.ok) priced.push({productCode:o.product.productCode, parsed});
  }
  if (!priced.length) {
    if (outcomes.every(o => o.status === 412)) return call('PARTNER_REJECTED');
    return call(outcomes.some(o => !o.response) ? 'SERVICE_UNAVAILABLE' : 'NO_VALID_PRICE');
  }
  // Best contribution type per product.
  const best = new Map();
  for (const item of priced) {
    const current = best.get(item.productCode);
    if (!current || item.parsed.total < current.parsed.total) best.set(item.productCode, item);
  }
  // At least one Constante (capital initial, CI) solution is always offered:
  // if the three cheapest products are all CDR, the third is replaced by the
  // cheapest CI, so the two cheapest overall solutions are kept.
  const ranked = [...best.values()].sort((a, b) => a.parsed.total - b.parsed.total);
  const bestCI = priced.filter(item => item.parsed.contributionType === 'Constante')
    .sort((a, b) => a.parsed.total - b.parsed.total)[0];
  let chosen = ranked.slice(0, TOP);
  if (bestCI && !chosen.some(item => item.parsed.contributionType === 'Constante'))
    chosen = [...chosen.slice(0, TOP - 1), bestCI].sort((a, b) => a.parsed.total - b.parsed.total);
  const solutions = chosen.map((item, index) => {
    const {ok, contributionType, ...summary} = item.parsed;
    // Average monthly cost = total over the remaining months (Variable premiums
    // start higher and decrease; Constante stay flat).
    const averageMonthly = Math.round(summary.total / input.loan.loanDuration * 100) / 100;
    // White label: only "Solution n" leaves the server, never a partner name or code.
    return {rank:index + 1, name:'Solution ' + (index + 1), contributionBasis:BASIS[contributionType], averageMonthly, ...summary};
  });
  const result = {status:'quote', solutions};
  // Internal detail (which product, which contribution type) for the advisor's e-mail only.
  // Non-enumerable: it can never be serialised into a response by accident.
  Object.defineProperty(result, 'internal', {enumerable:false, value:chosen.map((item, index) => ({
    name:'Solution ' + (index + 1), productCode:item.productCode, contributionType:item.parsed.contributionType, total:item.parsed.total,
  }))});
  return result;
}

module.exports = {quote, OFFER, CALL_MESSAGE};
