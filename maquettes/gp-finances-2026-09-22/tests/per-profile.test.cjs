const test = require('node:test');
const assert = require('node:assert/strict');
const {retirement,family} = require('../per-profile.js');
const {calculate} = require('../per-calculator.js');
test('retirement horizon follows age and chosen target without a negative duration',()=>{
  assert.equal(retirement(40).years,24);
  assert.equal(retirement(22).years,42);
  assert.equal(retirement(18).years,46);
  assert.equal(retirement(64).years,0);
  assert.equal(retirement(72).years,0);
  assert.equal(retirement(40,66).years,26);
  assert.equal(retirement(69).ageBand,'under70');
  assert.equal(retirement(70).ageBand,'70plus');
});
test('missing and invalid ages cannot fabricate a horizon',()=>{
 for (const age of ['',null,17,101,40.5,NaN]) assert.equal(retirement(age).valid,false);
 for (const target of ['',59,76,63.5]) assert.equal(retirement(40,target).valid,false);
});
test('ordinary fully dependent children: .5, .5, then one extra share each',()=>{
 for(const [children,extra] of [[0,0],[1,.5],[2,1],[3,2],[4,3],[5,4]]) {
  assert.equal(family({family:'married',children}).parts,2+extra);
  assert.equal(family({family:'single',children}).parts,1+extra);
  assert.equal(family({family:'pacs',children}).parts,2+extra);
  assert.equal(family({family:'free',children}).parts,1+extra);
 }
});
test('alternating residence uses half of each ordinary child increment',()=>{
 for (const [children,extra] of [[1,.25],[2,.5],[3,1],[4,1.5]]) {
  assert.equal(family({family:'divorced',children,sharedChildren:children}).parts,1+extra);
 }
});
test('mixed custody counts exclusively dependent children first (CGI 194)',()=>{
 assert.equal(family({family:'married',children:2,sharedChildren:1}).parts,2.75);
 assert.equal(family({family:'married',children:3,sharedChildren:2}).parts,3.25);
 assert.equal(family({family:'married',children:3,sharedChildren:1}).parts,3.5);
 assert.equal(family({family:'married',children:4,sharedChildren:2}).parts,4);
});
test('exceptional statuses and inconsistent child counts require correction',()=>{
 for (const input of [{family:'widow',children:1},{family:'single',children:1,special:true},{family:'married',children:1,sharedChildren:2},{family:'single',children:''},{family:'single',children:-1},{family:'single',children:1.5}]) {
  assert.equal(family(input).valid,false); assert.equal(family(input).parts,undefined);
 }
});
test('computed child shares reach tax calculation and do not multiply the individual ceiling',()=>{
 const base={netIncome:90000,rfr:'',ageBand:'under70',capMode:'notice',availableCap:10000,contribution:5000,usedCap:0};
 const without=family({family:'married',children:0}), withChildren=family({family:'married',children:2});
 const a=calculate({...base,...without}), b=calculate({...base,...withChildren});
 assert.equal(a.before.net,13208);assert.equal(b.before.net,9594);
 assert.equal(a.remainingCap,b.remainingCap);assert.equal(b.parts,3);
});
