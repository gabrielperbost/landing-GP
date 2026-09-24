const {test} = require('node:test');
const assert = require('node:assert/strict');
const {calculate} = require('../insurance-calculator.js');
const base = {basis:'monthly', mode:'scenario', years:15, months:0, currentCost:60, reduction:30, fees:0};
test('60 €/mois, 15 ans, hypothèse 30 % : 3 240 €', () => {
  const r=calculate(base); assert.equal(r.valid,true); assert.equal(r.currentTotal,10800); assert.equal(r.newTotal,7560); assert.equal(r.savings,3240); assert.equal(r.monthlyEquivalent,18);
});
test('durée restante précise, sans mois déjà remboursés', () => {
  const r=calculate({...base,years:0,months:6}); assert.equal(r.duration,6); assert.equal(r.savings,108);
});
test('les frais diminuent le gain net', () => {
  const r=calculate({...base,fees:240}); assert.equal(r.savings,3000); assert.equal(r.newTotal,7800);
});
test('un devis plus cher affiche une perte, jamais une économie ramenée à zéro', () => {
  const r=calculate({...base,mode:'quote',quoteCost:75,fees:100,reduction:''}); assert.equal(r.savings,-2800); assert.equal(r.newTotal,13600);
});
test('cotisations variables : comparaison des totaux restants', () => {
  const r=calculate({...base,basis:'total',mode:'quote',currentCost:9600,quoteCost:5700,fees:200}); assert.equal(r.currentTotal,9600); assert.equal(r.newTotal,5900); assert.equal(r.savings,3700);
});
test('la baisse hypothétique peut aussi être appliquée au coût restant', () => {
  const r=calculate({...base,basis:'total',currentCost:9600,fees:100}); assert.equal(r.savings,2780);
});
test('cotisations arrondies au centime avant multiplication', () => {
  const r=calculate({...base,currentCost:60.01}); assert.equal(r.currentTotal,10801.8); assert.equal(r.newPremiumTotal,7561.8); assert.equal(r.savings,3240);
});
test('zéro coût et zéro baisse ne produisent pas de NaN', () => {
  const r=calculate({...base,currentCost:0,reduction:0}); assert.equal(r.savings,0); assert.equal(r.savingsPercent,null); assert.equal(r.monthlyEquivalent,0);
});
test('un champ vide, négatif ou non fini ne vaut pas zéro', () => {
  for(const currentCost of ['', ' ', null, undefined, false, -1, NaN, Infinity]) assert.equal(calculate({...base,currentCost}).valid,false);
});
test('bornes de durée et mois entiers', () => {
  for(const [years,months] of [[0,0],[35,1],[10,12],[15.5,0],[1,1.5]]) assert.equal(calculate({...base,years,months}).valid,false);
  assert.equal(calculate({...base,years:35}).valid,true);
});
test('le coût du devis est requis uniquement en mode devis', () => {
  assert.equal(calculate({...base,quoteCost:''}).valid,true);
  assert.equal(calculate({...base,mode:'quote',quoteCost:''}).valid,false);
});
test('bornes et modes invalides rejetés', () => {
  for(const invalid of [{reduction:71},{reduction:-1},{fees:-1},{fees:10001},{basis:'rate'},{mode:'market'},{currentCost:5001}]) assert.equal(calculate({...base,...invalid}).valid,false);
});
test('le module d’interface est importable côté serveur', () => {
  assert.equal(typeof require('../insurance-simulator.js').mount,'function');
});
