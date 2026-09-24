'use strict';

/* Builder for the pricing request verified on 2026-09-24 against the APRIL
 * integration environment (five products, Variable and Constante, synthetic cases).
 * One natural-person subscriber, one or two insured persons, one classic loan.
 * With two insureds, each one gets his own product entry (role AssurePrincipal)
 * carrying his own coverage share: this is the only structure the partner priced
 * (a single product with two `insureds` was refused with HTTP 412).
 * No HTTP call and no tariff here; see client.cjs for transport.
 * Intended for a future server-side adapter; not loaded in the HTML preview.
 */
const riskFields = Object.freeze([
  'smoker', 'abroadTravel', 'aerialOrLandSport', 'highMileage',
  'workAtHeight', 'heavyLoadHandling'
]);
// Products present in the live referential and priced successfully.
// ADPGenerali (first sample) is absent from that referential: not accepted.
const supportedProducts = Object.freeze({
  ADPv4:['Variable', 'Constante'], ADPIntegral:['Variable', 'Constante'], ADPEssentiel:['Variable', 'Constante'],
  ADPHorizon:['Variable', 'Constante'], ADPEquilibre:['Variable', 'Constante'],
});
// DC, PTIA, ITT, IPT and IPP. MNO (non-objective illnesses) has no code of its own in the
// partner API: it is part of the ConfortPlus level of ITT and IPT (the level changes the price).
const coverageCodes = Object.freeze(['Deces', 'PTIA', 'ITT', 'IPT', 'IPP']);

function buildRequest(input = {}, configuration = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || !configuration || typeof configuration !== 'object' || Array.isArray(configuration))
    return {valid:false, errors:[{field:'request', message:'Une requête et une configuration structurées sont nécessaires.'}]};
  const errors = [];
  const person = input.person || {}, loan = input.loan || {}, address = input.address || {};
  const text = (value, path) => {
    if (typeof value !== 'string' || !value.trim() || /[{}<>\r\n]/.test(value)) {
      errors.push({field:path, message:'Valeur à renseigner avec le référentiel APRIL applicable.'});
      return '';
    }
    return value.trim();
  };
  const numeric = (value, path, min, max = Infinity, integer = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value)))
      errors.push({field:path, message:'Valeur numérique hors format.'});
    return value;
  };
  const date = (value, path) => {
    const parsed = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value+'T00:00:00Z') : null;
    if (!parsed || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== value) {
      errors.push({field:path, message:'Date réelle attendue au format AAAA-MM-JJ.'});
    }
    return value;
  };
  const effectiveDate = date(input.effectiveDate, 'effectiveDate');

  const postCode = text(address.postCode, 'address.postCode');
  if (!/^\d{5}$/.test(postCode)) errors.push({field:'address.postCode', message:'Ce brouillon prend en charge un code postal français de cinq chiffres.'});
  // Optional: pricing does not need it (verified without it on 2026-09-24).
  const email = input.email === undefined ? undefined : text(input.email, 'email');
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({field:'email', message:'Adresse e-mail à vérifier.'});
  // Insured persons: the main borrower and, optionally, a second one.
  const co = input.coBorrower;
  if (co !== undefined && (!co || typeof co !== 'object' || Array.isArray(co)))
    errors.push({field:'coBorrower', message:'Les informations du second emprunteur sont à compléter.'});
  const insuredInputs = [{data:person, prefix:'person', id:'i-1'}];
  if (co && typeof co === 'object' && !Array.isArray(co)) insuredInputs.push({data:co, prefix:'coBorrower', id:'i-2'});
  const persons = [], shares = [];
  for (const {data, prefix, id} of insuredInputs) {
    const birthDate = date(data.birthDate, prefix + '.birthDate');
    if (!errors.some(e => e.field === 'effectiveDate' || e.field === prefix + '.birthDate') && birthDate >= effectiveDate)
      errors.push({field:prefix + '.birthDate', message:'La naissance doit précéder la prise d’effet.'});
    const insured = {
      $id:id, title:text(data.title, prefix + '.title'), birthDate,
      professionalCategory:text(data.professionalCategory, prefix + '.professionalCategory'),
      profession:text(data.profession, prefix + '.profession')
    };
    // Loi Lemoine: total outstanding insured capital of the insured elsewhere.
    // The partner refuses some pricings without it (HTTP 412, 2026-09-24).
    if (data.remainingAccountLemoine !== undefined) {
      numeric(data.remainingAccountLemoine, prefix + '.remainingAccountLemoine', 0);
      insured.remainingAccountLemoine = data.remainingAccountLemoine;
    }
    for (const key of riskFields) {
      if (typeof data[key] !== 'boolean') errors.push({field:prefix + '.' + key, message:'Une réponse explicite oui/non est nécessaire.'});
      insured[key] = data[key];
    }
    persons.push(insured);
    // Coverage share (quotité): 100 % unless the customer states otherwise.
    const rawShare = data.coveragePercentage !== undefined ? data.coveragePercentage : (id === 'i-1' ? input.coveragePercentage : undefined);
    shares.push(numeric(rawShare === undefined ? 100 : rawShare, prefix + '.coveragePercentage', 0.01, 100));
  }
  if (shares.every(v => typeof v === 'number') && shares.reduce((sum, v) => sum + v, 0) < 100)
    errors.push({field:'coveragePercentage', message:'Le prêt doit être couvert à 100 % au moins.'});
  if (loan.loanType !== 'Classique') errors.push({field:'loan.loanType', message:'Seul le type Classique a été vérifié.'});
  // Broker/product settings must come from trusted server configuration,
  // never from values supplied by the public form.
  const product = configuration.product || {};
  const commission = text(configuration.commission, 'configuration.commission');
  const productCode = text(product.productCode, 'configuration.product.productCode');
  const contributionType = text(product.contributionType, 'configuration.product.contributionType');
  if (!supportedProducts[productCode]?.includes(contributionType))
    errors.push({field:'configuration.product', message:'Produit ou type de cotisation non vérifié dans le référentiel APRIL du 24 septembre 2026.'});
  const coverageSettings = product.coverages;
  if (!Array.isArray(coverageSettings) || coverageSettings.length !== coverageCodes.length || !coverageCodes.every(code => coverageSettings.some(c => c?.guaranteeCode === code)))
    errors.push({field:'configuration.product.coverages', message:'Les cinq garanties distinctes (Décès, PTIA, ITT, IPT, IPP) doivent être configurées.'});
  const coveragesFor = share => Array.isArray(coverageSettings) ? coverageSettings.map(c => {
    if (!c || !coverageCodes.includes(c.guaranteeCode)) { errors.push({field:'configuration.product.coverages',message:'Garantie absente du flux de référence.'}); return null; }
    const row = {loan:{$ref:'pr-1'}, guaranteeCode:c.guaranteeCode, coveragePercentage:share};
    if (c.guaranteeCode === 'ITT') {
      row.deductibleCode = text(c.deductibleCode, 'configuration.product.ITT.deductibleCode');
      row.levelCode = text(c.levelCode, 'configuration.product.ITT.levelCode');
    }
    if (c.guaranteeCode === 'IPT') {
      row.compensationMode = text(c.compensationMode, 'configuration.product.IPT.compensationMode');
      row.levelCode = text(c.levelCode, 'configuration.product.IPT.levelCode');
    }
    return row;
  }) : [];
  const request = {
    $type:'Emprunteur',
    properties:{
      addresses:[{$id:'adr-1', type:'Actuelle', postCode, city:text(address.city, 'address.city')}],
      projectType:text(input.projectType, 'projectType'), ...(email ? {email} : {}), commission,
      moralSubscriber:false, effectiveDate
    },
    persons,
    loans:[{$id:'pr-1', loanType:'Classique',
      borrowedAmount:numeric(loan.borrowedAmount, 'loan.borrowedAmount', 0.01),
      loanDuration:numeric(loan.loanDuration, 'loan.loanDuration', 1, Infinity, true),
      interestRate:numeric(loan.interestRate, 'loan.interestRate', 0)
    }],
    products:persons.map((insured, index) => ({$id:'p-' + (index + 1), productCode, contributionType,
      insured:{role:'AssurePrincipal', person:{$ref:insured.$id}}, coverages:coveragesFor(shares[index])
    }))
  };
  return errors.length ? {valid:false, errors} : {valid:true, request};
}

module.exports = {buildRequest};
