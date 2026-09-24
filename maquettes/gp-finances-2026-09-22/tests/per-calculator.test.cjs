const test = require('node:test');
const assert = require('node:assert/strict');
const {incomeTax, progressiveTax, annualCap, calculate} = require('../per-calculator.js');
const base = {rfr:70000, netIncome:'', parts:1, household:'single', ageBand:'under70', capMode:'notice', availableCap:13000, usedCap:0, capReductions:0, contribution:13000};
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < .001, `${actual} ≠ ${expected}`);

test('official income-tax examples: single and married households', () => {
  near(progressiveTax(30000,1),2103.99);
  near(progressiveTax(60000,2),4207.98);
  assert.equal(incomeTax(60000,2,'couple').net,4208);
  assert.equal(incomeTax(90000,2,'couple').net,13208);
});
test('official family-quotient examples, with and without the cap', () => {
  const uncapped=incomeTax(60000,2.5,'couple');
  assert.equal(uncapped.net,3410);assert.equal(uncapped.familyCapped,false);assert.equal(uncapped.tmi,.11);
  const capped=incomeTax(90000,2.5,'couple');
  assert.equal(capped.net,11401);assert.equal(capped.familyCapped,true);assert.equal(capped.tmi,.30);
  assert.equal(incomeTax(90000,3,'couple').net,9594);
});
test('TMI reflects the capped family quotient, not simply income divided by all parts', () => {
  const result=incomeTax(80000,3,'couple');
  assert.equal(result.familyCapped,true);assert.equal(result.tmi,.30);
});
test('bracket boundaries and zero income', () => {
  for(const [limit,low,high] of [[11600,0,.11],[29579,.11,.30],[84577,.30,.41],[181917,.41,.45]]) {
    assert.equal(incomeTax(limit,1,'single').tmi,low);
    assert.equal(incomeTax(limit+1,1,'single').tmi,high);
  }
  assert.equal(incomeTax(0,1,'single').net,0);
});
test('existing 13000-euro illustration remains reproducible', () => {
  const result=calculate(base);
  assert.equal(result.valid,true);assert.equal(result.saving,3900);assert.equal(result.netEffort,9100);
});
test('crossing the 30%/11% boundary uses both brackets and the discount', () => {
  // Before: 1977.69 + 2421*30% = 2703.99. After: 1694 gross,
  // discount = 897 - 1694*45.25% = 130.465. Rounded taxes: 2704 / 1564.
  const result=calculate({...base,rfr:32000,contribution:5000});
  assert.equal(result.before.net,2704);assert.equal(result.after.net,1564);
  assert.equal(result.saving,1140);assert.equal(result.after.tmi,.11);
  assert.notEqual(result.saving,5000*.3);
});
test('the low-income discount eliminates tax and there is no invented saving', () => {
  const result=calculate({...base,rfr:16000,contribution:3000});
  assert.equal(result.before.net,0);assert.equal(result.saving,0);
});
test('deduction is limited to remaining capacity', () => {
  const result=calculate({...base,availableCap:5000,usedCap:2000,contribution:10000});
  assert.equal(result.remainingCap,3000);assert.equal(result.deductible,3000);
  assert.equal(result.nonDeductible,7000);assert.equal(result.saving,900);
});
test('a completely consumed or zero ceiling yields no deduction', () => {
  for(const availableCap of [0,2000]) {
    const result=calculate({...base,availableCap,usedCap:3000});
    assert.equal(result.remainingCap,0);assert.equal(result.saving,0);
  }
});
test('ceiling respects the 2026 minimum, maximum and reducing contributions', () => {
  assert.equal(annualCap(0),4710);assert.equal(annualCap(70000),7000);
  assert.equal(annualCap(900000),37680);assert.equal(annualCap(70000,2000),5000);
  assert.equal(annualCap(0,6000),0);
});
test('personal professional income drives the ceiling; RFR and shares do not', () => {
  const a=calculate({...base,capMode:'estimate',professionalIncome:50000});
  const b=calculate({...base,rfr:180000,parts:3,household:'couple',capMode:'estimate',professionalIncome:50000});
  assert.equal(a.remainingCap,5000);assert.equal(b.remainingCap,5000);
});
test('RFR and parts alone never manufacture a ceiling or saving', () => {
  const result=calculate({...base,capMode:'estimate',professionalIncome:''});
  assert.equal(result.valid,false);assert.equal(result.remainingCap,null);assert.equal(result.saving,undefined);
  assert.equal(result.before.tmi,.30);
});
test('net taxable income overrides RFR, including an explicit zero', () => {
  const result=calculate({...base,rfr:100000,netIncome:30000,contribution:1000});
  assert.equal(result.income,30000);assert.equal(result.incomeSource,'net');assert.equal(result.before.tmi,.30);
  const zero=calculate({...base,netIncome:0});
  assert.equal(zero.income,0);assert.equal(zero.saving,0);assert.equal(zero.deductible,0);
});
test('net taxable income can be used even when RFR is unavailable', () => {
  assert.equal(calculate({...base,rfr:'',netIncome:70000}).saving,3900);
});
test('no deduction for contributions from age 70 in 2026', () => {
  const result=calculate({...base,ageBand:'70plus',availableCap:''});
  assert.equal(result.valid,true);assert.equal(result.remainingCap,0);assert.equal(result.saving,0);
});
test('zero contribution is distinct from an empty field', () => {
  assert.equal(calculate({...base,contribution:0}).saving,0);
  assert.equal(calculate({...base,contribution:''}).valid,false);
});
test('invalid income, shares and monetary values cannot produce a saving', () => {
  for(const input of [{rfr:-1},{rfr:Infinity},{parts:0},{parts:1.3},{parts:''},{parts:1,household:'couple'},{usedCap:-20},{contribution:-1},{availableCap:NaN},{household:'other'}]) {
    const result=calculate({...base,...input});
    assert.equal(result.valid,false,JSON.stringify(input));assert.equal(result.saving,undefined);
  }
});
test('an extra-large payment cannot reduce income below zero', () => {
  const result=calculate({...base,rfr:20000,availableCap:100000,contribution:90000});
  assert.equal(result.deductible,20000);assert.equal(result.after.net,0);
  assert.equal(result.saving,result.before.net);
});
test('savings remain monotone and bounded across typical family profiles', () => {
  for(const [household,parts,income] of [['single',1,32000],['couple',2,60000],['couple',3,80000],['single',1,200000]]) {
    let previous=-1;
    for(const contribution of [0,1000,3000,6000,13000,20000]) {
      const r=calculate({...base,household,parts,rfr:income,contribution});
      assert.equal(r.valid,true);assert.ok(r.saving>=previous);assert.ok(r.saving<=r.before.net);assert.ok(r.netEffort>=0);
      previous=r.saving;
    }
  }
});
