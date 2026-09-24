'use strict';

/* Turns the raw partner pricing array (POST projects/prices, Simple, withSchedule)
 * into a small, browser-safe summary. The raw response must never be returned
 * to the browser. No fallback price is ever fabricated.
 */
const round = value => Math.round(value * 100) / 100;
const isAmount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;

const dayValue = text => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text || '');
  return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : NaN;
};

/* One TarifGlobal + one EcheancierGlobal per insured person. With two insureds
 * (priced through two product entries) the amounts are summed. */
function parsePricing(input, expectedInsureds) {
  // Business messages (refusal, study request, warning) always need a human.
  const envelope = input && !Array.isArray(input) && typeof input === 'object' ? input : null;
  if (envelope && Array.isArray(envelope.messages) && envelope.messages.length)
    return {ok:false, reason:'PARTNER_MESSAGE'};
  const response = envelope && Array.isArray(envelope.content) ? envelope.content : input;
  if (!Array.isArray(response) || !response.length)
    return {ok:false, reason:'RESPONSE_EMPTY'};
  if (response.some(row => Array.isArray(row?.messages) && row.messages.length))
    return {ok:false, reason:'PARTNER_MESSAGE'};
  const globals = response.filter(row => row?.priceType === 'TarifGlobal');
  const schedules = response.filter(row => row?.priceType === 'EcheancierGlobal');
  if (!globals.length || globals.some(g => !isAmount(g?.contribution?.contributionAmount)))
    return {ok:false, reason:'GLOBAL_PRICE_MISSING'};
  if (expectedInsureds !== undefined && globals.length !== expectedInsureds)
    return {ok:false, reason:'INSURED_MISMATCH'};
  const combined = new Map();
  for (const global of globals) {
    const schedule = schedules.find(row => row.insured === global.insured);
    const periods = Array.isArray(schedule?.contributions) ? schedule.contributions : null;
    if (!periods || !periods.length || !periods.every(p => isAmount(p?.contributionAmount)))
      return {ok:false, reason:'SCHEDULE_MISSING'};
    const scheduleTotal = round(periods.reduce((sum, p) => sum + p.contributionAmount, 0));
    // Total and schedule must agree for each insured, otherwise the figure is not displayable.
    if (Math.abs(scheduleTotal - global.contribution.contributionAmount) > 0.05)
      return {ok:false, reason:'TOTAL_MISMATCH'};
    for (const p of periods) {
      const key = p.startDate + '|' + p.endDate;
      combined.set(key, round((combined.get(key) || 0) + p.contributionAmount));
    }
  }
  const sum = pick => {
    const values = globals.map(pick);
    return values.every(isAmount) ? round(values.reduce((a, b) => a + b, 0)) : null;
  };
  const starts = globals.map(g => g.contribution.startDate).sort((a, b) => dayValue(a) - dayValue(b));
  const ends = globals.map(g => g.contribution.endDate).sort((a, b) => dayValue(a) - dayValue(b));
  return {
    ok:true,
    // White label: no partner name, product code or title leaves the server.
    contributionType:globals[0].contributionType,
    total:round(globals.reduce((sumTotal, g) => sumTotal + g.contribution.contributionAmount, 0)),
    firstYear:sum(g => g.firstYearsContribution),
    eightYears:sum(g => g.eightYearsContribution),
    // The partner rate is per insured and cannot be added: shown for one insured only.
    taea:globals.length === 1 && typeof globals[0].taea === 'number' ? globals[0].taea : null,
    startDate:starts[0],
    endDate:ends[ends.length - 1],
    // Annual/partial periods, not fixed monthly instalments.
    periods:[...combined].map(([key, amount]) => {
      const [startDate, endDate] = key.split('|');
      return {startDate, endDate, amount};
    })
  };
}

module.exports = {parsePricing};
