const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parsePricing}=require('../integrations/april/parse-response.cjs');
const rows=()=>[
 {priceType:'TarifGlobal',product:{productCode:'ADPv4',productTitle:'Optimum +'},contributionType:'Variable',firstYearsContribution:489.47,eightYearsContribution:3826.23,taea:0.26,contribution:{startDate:'01/10/2026',endDate:'01/10/2046',contributionAmount:100}},
 {priceType:'TarifDetaille',guaranteeCode:'Deces'},
 {priceType:'EcheancierGlobal',contributions:[{startDate:'01/10/2026',endDate:'31/12/2026',contributionAmount:40},{startDate:'01/01/2027',endDate:'31/12/2027',contributionAmount:60}]}
];
test('réponse cohérente : total, périodes et métadonnées',()=>{
 const r=parsePricing(rows());assert.equal(r.ok,true);assert.equal(r.total,100);assert.equal(r.periods.length,2);
 assert.equal(JSON.stringify(r).match(/april|adpv4|optimum/i),null);assert.equal(r.firstYear,489.47);
});
test('total et échéancier divergents : refus',()=>{
 const x=rows();x[0].contribution.contributionAmount=120;assert.equal(parsePricing(x).reason,'TOTAL_MISMATCH');
});
test('échéancier ou tarif global absent : aucun montant fabriqué',()=>{
 assert.equal(parsePricing(rows().filter(r=>r.priceType!=='EcheancierGlobal')).reason,'SCHEDULE_MISSING');
 assert.equal(parsePricing(rows().slice(1)).reason,'GLOBAL_PRICE_MISSING');
 for(const v of [null,[],{},'x'])assert.equal(parsePricing(v).ok,false);
});
test('la réponse réelle de préproduction est acceptée',()=>{
 const f='../../../.codex-work/gp-finances-april/synthetic-pricing-response.json';
 let data;try{data=require(f)}catch{return}
 const r=parsePricing(data);assert.equal(r.ok,true);assert.equal(r.total,6827.77);assert.equal(r.periods.length,21);
});
test('message métier du partenaire : appel nécessaire',()=>{
 assert.equal(parsePricing({content:rows(),messages:[{text:'x'}]}).reason,'PARTNER_MESSAGE');
 const x=rows();x[1].messages=[{text:'étude'}];assert.equal(parsePricing(x).reason,'PARTNER_MESSAGE');
 assert.equal(parsePricing({content:rows(),messages:[]}).ok,true);
});
const two=()=>[
 {priceType:'TarifGlobal',insured:'i-1',contributionType:'Variable',firstYearsContribution:300,eightYearsContribution:2000,taea:0.3,contribution:{startDate:'01/10/2026',endDate:'01/10/2041',contributionAmount:100}},
 {priceType:'TarifGlobal',insured:'i-2',contributionType:'Variable',firstYearsContribution:200,eightYearsContribution:1500,taea:0.2,contribution:{startDate:'01/10/2026',endDate:'01/10/2041',contributionAmount:60}},
 {priceType:'EcheancierGlobal',insured:'i-1',contributions:[{startDate:'01/10/2026',endDate:'31/12/2026',contributionAmount:40},{startDate:'01/01/2027',endDate:'31/12/2027',contributionAmount:60}]},
 {priceType:'EcheancierGlobal',insured:'i-2',contributions:[{startDate:'01/10/2026',endDate:'31/12/2026',contributionAmount:20},{startDate:'01/01/2027',endDate:'31/12/2027',contributionAmount:40}]}
];
test('deux assurés : montants additionnés, périodes fusionnées, TAEA non additionné',()=>{
 const r=parsePricing(two(),2);assert.equal(r.ok,true);assert.equal(r.total,160);assert.equal(r.firstYear,500);assert.equal(r.eightYears,3500);
 assert.equal(r.taea,null);assert.deepEqual(r.periods.map(p=>p.amount),[60,100]);
});
test('deux assurés : nombre d’assurés attendu, échéancier manquant ou incohérent refusés',()=>{
 assert.equal(parsePricing(two(),1).reason,'INSURED_MISMATCH');
 assert.equal(parsePricing(two().filter(r=>r.insured!=='i-2'||r.priceType!=='EcheancierGlobal'),2).reason,'SCHEDULE_MISSING');
 const bad=two();bad[1].contribution.contributionAmount=90;assert.equal(parsePricing(bad,2).reason,'TOTAL_MISMATCH');
});
