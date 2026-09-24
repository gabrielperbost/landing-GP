const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildRequest}=require('../integrations/april/build-request.cjs');
// Synthetic fixture; no supplied third-party email or contact details.
const input=()=>({
  address:{postCode:'38000',city:'GRENOBLE'},projectType:'ResidencePrincipale',email:'simulation@example.invalid',effectiveDate:'2026-10-01',
  person:{title:'Monsieur',birthDate:'1970-07-01',professionalCategory:'CadreAssimileCadre',profession:'AgentCommercial',smoker:false,abroadTravel:false,aerialOrLandSport:false,highMileage:false,workAtHeight:false,heavyLoadHandling:false},
  loan:{loanType:'Classique',borrowedAmount:250000,loanDuration:240,interestRate:1.9},coveragePercentage:100
});
const config=()=>({commission:'4010',product:{productCode:'ADPv4',contributionType:'Variable',coverages:[
  {guaranteeCode:'Deces'},{guaranteeCode:'PTIA'},
  {guaranteeCode:'ITT',deductibleCode:'090',levelCode:'ConfortPlus'},
  {guaranteeCode:'IPT',compensationMode:'Capital',levelCode:'ConfortPlus'},
  {guaranteeCode:'IPP'}
]}});
test('requête ADPv4 conforme au cas vérifié, références résolues',()=>{
 const r=buildRequest(input(),config());assert.equal(r.valid,true);const p=r.request;
 assert.equal(p.$type,'Emprunteur');assert.equal(p.products.length,1);assert.equal('product' in p,false);
 assert.equal(p.products[0].insured.person.$ref,p.persons[0].$id);
 for(const c of p.products[0].coverages)assert.equal(c.loan.$ref,p.loans[0].$id);
 assert.equal(p.products[0].coverages.find(c=>c.guaranteeCode==='ITT').deductibleCode,'090');
 assert.equal(p.properties.email,'simulation@example.invalid');
});
test('les risques absents ou textuels ne deviennent pas automatiquement faux',()=>{
 for(const value of [undefined,null,'false',0]){const i=input();i.person.highMileage=value;const r=buildRequest(i,config());assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.field==='person.highMileage'));assert.equal(r.request,undefined);}
});
test('date variable et dates inexistantes rejetées, année bissextile respectée',()=>{
 for(const d of ['{{dateEffet}}','*{{dateEffet}}*','2026-02-29','2026-04-31'])assert.equal(buildRequest({...input(),effectiveDate:d},config()).valid,false);
 assert.equal(buildRequest({...input(),effectiveDate:'2028-02-29'},config()).valid,true);
});
test('la commission ne provient pas du formulaire et reste requise',()=>{
 const i={...input(),commission:'9999',productCode:'ADPGenerali'};
 assert.equal(buildRequest(i,config()).request.properties.commission,'4010');
 const c=config();delete c.commission;assert.equal(buildRequest(i,c).valid,false);
});
test('produit non vérifié ou ancien exemple refusé',()=>{
 const c=config();c.product.productCode='ADPGenerali';c.product.contributionType='variable';assert.equal(buildRequest(input(),c).valid,false);
 const e=config();e.product.contributionType='variable';assert.equal(buildRequest(input(),e).valid,false);
 const d=config();d.product.coverages[0].guaranteeCode='DC';assert.equal(buildRequest(input(),d).valid,false);
});
test('montants, durée et quotité doivent être explicites et cohérents',()=>{
 for(const partial of [{borrowedAmount:0},{borrowedAmount:NaN},{loanDuration:0},{loanDuration:2.5},{interestRate:-1},{loanType:'Relais'}]){
  const i=input();i.loan={...i.loan,...partial};assert.equal(buildRequest(i,config()).valid,false);
 }
 for(const coveragePercentage of [0,101,'100',NaN])assert.equal(buildRequest({...input(),coveragePercentage},config()).valid,false);
 assert.equal(buildRequest({...input(),coveragePercentage:undefined},config()).valid,true);// quotité absente = 100 %
 assert.equal(buildRequest({...input(),coveragePercentage:undefined},config()).request.products[0].coverages[0].coveragePercentage,100);
 assert.equal(buildRequest({...input(),coveragePercentage:50},config()).valid,false);// prêt couvert à moins de 100 %
});
test('aucun tarif ou appel réseau fabriqué par le constructeur',()=>{
 const r=buildRequest(input(),config());assert.deepEqual(Object.keys(r).sort(),['request','valid']);
 assert.equal(JSON.stringify(r).includes('currentInsuranceMonthly'),false);
});
test('un corps JSON nul ou mal formé produit une validation, pas une exception serveur',()=>{
 for(const value of [null,[],true,12,'Emprunteur']){
  assert.equal(buildRequest(value,config()).valid,false);
  assert.equal(buildRequest(input(),value).valid,false);
 }
});

const co=(extra={})=>({title:'Madame',birthDate:'1987-05-05',professionalCategory:'SalarieNonCadre',profession:'Infirmier',smoker:false,abroadTravel:false,aerialOrLandSport:false,highMileage:false,workAtHeight:false,heavyLoadHandling:false,...extra});
test('deux emprunteurs : un produit par assuré, quotités propres, références résolues',()=>{
 const i={...input(),coBorrower:co({coveragePercentage:40}),person:{...input().person,coveragePercentage:60}};
 const r=buildRequest(i,config());assert.equal(r.valid,true);const p=r.request;
 assert.equal(p.persons.length,2);assert.equal(p.products.length,2);
 assert.deepEqual(p.products.map(x=>x.insured.person.$ref),['i-1','i-2']);assert.ok(p.products.every(x=>x.insured.role==='AssurePrincipal'&&!('insureds' in x)));
 assert.deepEqual(p.products.map(x=>x.coverages[0].coveragePercentage),[60,40]);
 assert.deepEqual(p.products.map(x=>x.$id),['p-1','p-2']);
});
test('deux emprunteurs : quotités par défaut 100 %, somme inférieure à 100 % refusée, réponses de risque du second obligatoires',()=>{
 const both=buildRequest({...input(),coBorrower:co()},config());assert.equal(both.valid,true);
 assert.ok(both.request.products.every(x=>x.coverages.every(c=>c.coveragePercentage===100)));
 const low=buildRequest({...input(),person:{...input().person,coveragePercentage:30},coBorrower:co({coveragePercentage:30})},config());assert.equal(low.valid,false);
 const missing=buildRequest({...input(),coBorrower:co({highMileage:undefined})},config());assert.equal(missing.valid,false);assert.ok(missing.errors.some(e=>e.field==='coBorrower.highMileage'));
 const early=buildRequest({...input(),coBorrower:co({birthDate:'2027-01-01'})},config());assert.equal(early.valid,false);
});

test('les cinq garanties sont demandées : DC, PTIA, ITT, IPT, IPP (niveau Confort Plus pour MNO)',()=>{
 const r=buildRequest(input(),config());assert.equal(r.valid,true);
 assert.deepEqual(r.request.products[0].coverages.map(c=>c.guaranteeCode),['Deces','PTIA','ITT','IPT','IPP']);
 assert.equal(r.request.products[0].coverages.find(c=>c.guaranteeCode==='ITT').levelCode,'ConfortPlus');
 const four=config();four.product.coverages.pop();assert.equal(buildRequest(input(),four).valid,false);
});
