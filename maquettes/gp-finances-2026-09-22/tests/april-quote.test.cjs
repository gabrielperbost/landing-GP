const {test}=require('node:test');
const assert=require('node:assert/strict');
const {quote,OFFER}=require('../integrations/april/quote.cjs');
const input=()=>({address:{postCode:'38000',city:'GRENOBLE'},projectType:'ResidencePrincipale',email:'s@example.invalid',effectiveDate:'2026-10-01',
 person:{title:'Monsieur',birthDate:'1985-01-01',professionalCategory:'CadreAssimileCadre',profession:'AgentCommercial',smoker:false,abroadTravel:false,aerialOrLandSport:false,highMileage:false,workAtHeight:false,heavyLoadHandling:false},
 loan:{loanType:'Classique',borrowedAmount:180000,loanDuration:150,interestRate:1.9},coveragePercentage:100});
const one=(code,type,total)=>[{priceType:'TarifGlobal',product:{productCode:code,productTitle:'Titre '+code},contributionType:type,contribution:{startDate:'a',endDate:'b',contributionAmount:total}},{priceType:'EcheancierGlobal',contributions:[{startDate:'a',endDate:'b',contributionAmount:total}]}];
const good_=[{priceType:'TarifGlobal',product:{productCode:'ADPv4',productTitle:'APRIL Optimum +'},contributionType:'Variable',contribution:{startDate:'a',endDate:'b',contributionAmount:100}},
 {priceType:'EcheancierGlobal',contributions:[{startDate:'a',endDate:'b',contributionAmount:100}]}];
const good=one('ADPv4','Variable',100);
const client=r=>({sent:[],price(p){this.sent.push(p);if(r instanceof Error)throw r;return typeof r==='function'?r(p):r;}});
const code=p=>p.products[0].productCode, type=p=>p.products[0].contributionType;
// prix fictifs : total selon produit et type
const grid={ADPv4:{Variable:500,Constante:700},ADPIntegral:{Variable:400,Constante:300},ADPEquilibre:{Variable:450,Constante:460},ADPEssentiel:{Variable:900,Constante:950},ADPHorizon:{Variable:800,Constante:600}};
const gridClient=()=>client(p=>one(code(p),type(p),grid[code(p)][type(p)]));
test('10 combinaisons tarifées, offre 4010, capital restant dû transmis, marque absente',async()=>{
 const c=gridClient(),r=await quote(input(),c);
 assert.equal(r.status,'quote');assert.equal(c.sent.length,10);
 assert.ok(c.sent.every(p=>p.properties.commission==='4010'&&p.loans[0].borrowedAmount===180000&&p.loans[0].loanDuration===150));
 assert.equal(OFFER.commission,'4010');
 assert.equal(JSON.stringify(r).match(/april|adpv4|adpintegral|horizon|equilibre|essentiel|optimum|titre/i),null);
});
test('top 3 : au moins une solution en capital initial, classement par coût total',async()=>{
 const r=await quote(input(),gridClient());
 // Intégrale CI (300) est déjà dans le top par produit ; Équilibre CDR 450 ; Optimum+ CDR 500
 assert.deepEqual(r.solutions.map(s=>[s.name,s.total,s.contributionBasis]),[
  ['Solution 1',300,'capital_initial'],['Solution 2',450,'capital_restant_du'],['Solution 3',500,'capital_restant_du']]);
 // aucune CI dans le top 3 par produit : la 3e place revient à la CI la moins chère (Équilibre CI 460)
 const g={ADPv4:{Variable:500,Constante:700},ADPIntegral:{Variable:400,Constante:650},ADPEquilibre:{Variable:450,Constante:460},ADPEssentiel:{Variable:900,Constante:950},ADPHorizon:{Variable:800,Constante:600}};
 const c=client(p=>one(code(p),type(p),g[code(p)][type(p)]));
 const r2=await quote(input(),c);
 assert.deepEqual(r2.solutions.map(s=>[s.total,s.contributionBasis]),[[400,'capital_restant_du'],[450,'capital_restant_du'],[460,'capital_initial']]);
 assert.equal(new Set(r2.solutions.map(s=>s.name)).size,3);
});
test('produits refusés (412) écartés, les autres classés',async()=>{
 const e=Object.assign(new Error('x'),{status:412});
 const c=client(p=>{if(code(p)!=='ADPEssentiel')throw e;return one('ADPEssentiel',type(p),type(p)==='Variable'?300:250)});
 const r=await quote(input(),c);assert.equal(r.solutions.length,1);assert.equal(r.solutions[0].total,250);
 assert.equal((await quote(input(),client(e))).reason,'PARTNER_REJECTED');
});
test('cas à préciser : message d’appel, aucun appel partenaire',async()=>{
 const cases=[i=>{i.loans=[{},{}]},i=>{i.coBorrower={}},i=>{i.coBorrower={...i.person,highMileage:true}},i=>{i.person.coveragePercentage=30},i=>{i.loan.deferred=true},i=>{i.loan.loanType='Relais'},i=>{i.person.highMileage=true},i=>{i.person.workAtHeight=true}];
 for(const mutate of cases){const i=input();mutate(i);const c=gridClient(),r=await quote(i,c);assert.equal(r.status,'call');assert.match(r.message,/appelez GP FINANCES/);assert.equal(c.sent.length,0);}
});
test('panne, message partenaire ou total incohérent : appel, jamais de prix inventé',async()=>{
 for(const c of [client(new Error('x')),client({content:good,messages:[{}]}),client([good[0]])]){const r=await quote(input(),c);assert.equal(r.status,'call');assert.equal(r.solutions,undefined);}
});
test('fumeur reste tarifé, entrée invalide demande un appel',async()=>{
 const i=input();i.person.smoker=true;assert.equal((await quote(i,gridClient())).status,'quote');
 const j=input();j.effectiveDate='pas une date';assert.equal((await quote(j,gridClient())).status,'call');
 assert.equal((await quote(null,gridClient())).status,'call');
});
test('Lemoine : encours transmis dans la requête',async()=>{
 const i=input();i.person.remainingAccountLemoine=0;const c=gridClient();await quote(i,c);assert.ok(c.sent.every(p=>p.persons[0].remainingAccountLemoine===0));
});
test('cotisation mensuelle moyenne = total ÷ mois restants',async()=>{
 const r=await quote(input(),gridClient());// 150 mois restants
 assert.equal(r.solutions[0].averageMonthly,2);assert.equal(r.solutions[1].averageMonthly,3);
});

const twoRows=(code,type,each)=>[1,2].flatMap(n=>[{priceType:'TarifGlobal',insured:'i-'+n,product:{productCode:code,productTitle:'T'},contributionType:type,contribution:{startDate:'01/10/2026',endDate:'01/10/2041',contributionAmount:each}},{priceType:'EcheancierGlobal',insured:'i-'+n,contributions:[{startDate:'01/10/2026',endDate:'01/10/2041',contributionAmount:each}]}]);
test('deux emprunteurs : un produit par assuré envoyé, total = somme des deux, quotités transmises',async()=>{
 const i=input();i.person.coveragePercentage=60;i.coBorrower={...i.person,title:'Madame',birthDate:'1987-05-05',coveragePercentage:40};
 const c=client(p=>twoRows(p.products[0].productCode,p.products[0].contributionType,p.products.length*10));
 const r=await quote(i,c);assert.equal(r.status,'quote');
 assert.ok(c.sent.every(p=>p.persons.length===2&&p.products.length===2));
 assert.deepEqual(c.sent[0].products.map(x=>x.coverages[0].coveragePercentage),[60,40]);
 assert.equal(r.solutions[0].total,40);assert.equal(r.solutions[0].averageMonthly,+(40/150).toFixed(2));
 assert.equal(JSON.stringify(r).match(/april|adpv4|adpintegral/i),null);
});
test('emprunteur seul : quotité 100 % par défaut dans la requête',async()=>{
 const c=gridClient();await quote(input(),c);assert.ok(c.sent.every(p=>p.products[0].coverages.every(x=>x.coveragePercentage===100)));
});
