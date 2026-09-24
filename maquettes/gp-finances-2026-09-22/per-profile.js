/* Family shares and a chosen retirement horizon, independent of the UI.
   Ordinary family quotient only; exceptional statuses require a personal study. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GPPerProfile = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const RETIREMENT_AGE = 64;
  const integer = (n, min, max) => n !== '' && n !== null && n !== undefined && Number.isInteger(Number(n)) && Number(n) >= min && Number(n) <= max;
  function retirement(age, retirementAge = RETIREMENT_AGE) {
    const errors = [];
    if (!integer(age,18,100)) errors.push({field:'age',message:'Indiquez votre âge, entre 18 et 100 ans.'});
    if (!integer(retirementAge,60,75)) errors.push({field:'retirementAge',message:'Indiquez un âge de départ envisagé entre 60 et 75 ans.'});
    if (errors.length) return {valid:false,errors};
    return {valid:true,errors:[],age:Number(age),retirementAge:Number(retirementAge),years:Math.max(0,Number(retirementAge)-Number(age)),ageBand:Number(age)>=70?'70plus':'under70'};
  }
  function family({family, children, sharedChildren = 0, special = false}) {
    const errors = [];
    if (!['single','married','pacs','free','divorced','widow'].includes(family)) errors.push({field:'family',message:'Choisissez votre situation familiale.'});
    if (family === 'widow' || special) errors.push({field:'family',message:'Votre situation particulière nécessite une étude personnalisée. Utilisez « Demander une étude personnelle ».'});
    if (!integer(children,0,12)) errors.push({field:'children',message:'Indiquez de 0 à 12 enfants à charge. Au-delà, demandez une étude personnalisée.'});
    if (!integer(sharedChildren,0,Number(children))) errors.push({field:'sharedChildren',message:'Le nombre d’enfants en résidence alternée doit être compris entre 0 et le nombre total d’enfants à charge.'});
    if (errors.length) return {valid:false,errors};
    const household = ['married','pacs'].includes(family) ? 'couple' : 'single';
    const baseParts = household === 'couple' ? 2 : 1;
    const exclusive = Number(children) - Number(sharedChildren), shared = Number(sharedChildren);
    // CGI art. 194: exclusively dependent children occupy the first ranks.
    const exclusiveParts = Math.min(exclusive,2) * .5 + Math.max(0,exclusive-2);
    const sharedFirstRanks = Math.min(shared,Math.max(0,2-exclusive));
    const sharedParts = sharedFirstRanks * .25 + (shared-sharedFirstRanks) * .5;
    return {valid:true,errors:[],household,baseParts,exclusive,shared,childParts:exclusiveParts+sharedParts,parts:baseParts+exclusiveParts+sharedParts};
  }
  return {RETIREMENT_AGE,retirement,family};
});
