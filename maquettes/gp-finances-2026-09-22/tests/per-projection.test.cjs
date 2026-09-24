const test = require('node:test');
const assert = require('node:assert/strict');
const {calculate} = require('../per-projection.js');
const base = {contribution:10000,annualPayment:3000,years:20,annualRate:4};
const near = (a,b) => assert.ok(Math.abs(a-b) < .00001,`${a} != ${b}`);
test('1% is deducted from the initial and every future annual payment',() => {
  const r=calculate({...base,years:2,annualRate:0});
  near(r.capital,15840); near(r.fees,160); near(r.performance,0);
  assert.equal(r.paid,16000); assert.equal(r.points.length,3);
});
test('first future payment arrives at year end and does not earn a full year immediately',() => {
  const r=calculate({...base,years:1,annualRate:10});
  near(r.capital,9900*1.1+2970);
});
test('annual loop matches the compound-interest formula',() => {
  const r=calculate(base), n=20, growth=1.04;
  near(r.capital,9900*growth**n+2970*(growth**n-1)/(growth-1));
  near(r.capital,r.paid-r.fees+r.performance);
});
test('negative return hypotheses are rejected, without hiding fees at zero return',() => {
  assert.equal(calculate({...base,annualRate:-.1}).valid,false);
  const r=calculate({...base,annualPayment:0,annualRate:0});
  assert.equal(r.capital,9900);assert.equal(r.performance,0);assert.equal(r.fees,100);
});
test('a horizon already reached has only the initial deposit and its fee',() => {
  const r=calculate({...base,years:0});
  assert.equal(r.capital,9900);assert.equal(r.paid,10000);assert.equal(r.fees,100);assert.equal(r.points.length,1);
});
test('a young adult is projected until the chosen retirement age without a 40-year clamp',() => {
  const r=calculate({...base,years:46});
  assert.equal(r.valid,true);assert.equal(r.points.length,47);
});
test('zero payments produce zero capital without a fabricated return',() => {
  const r=calculate({...base,contribution:0,annualPayment:0,years:40,annualRate:10});
  assert.equal(r.capital,0);assert.equal(r.performance,0);
});
test('missing inputs and boundaries cannot yield a projection',() => {
  for(const patch of [{contribution:''},{annualPayment:''},{years:''},{annualRate:''},{years:-1},{years:61},{years:1.5},{contribution:-1},{annualPayment:Infinity},{annualRate:11},{annualRate:-6}]) {
    const r=calculate({...base,...patch}); assert.equal(r.valid,false,JSON.stringify(patch)); assert.equal(r.capital,undefined);
  }
  assert.equal(calculate({...base,years:1}).valid,true);
  assert.equal(calculate({...base,years:60}).valid,true);
});
