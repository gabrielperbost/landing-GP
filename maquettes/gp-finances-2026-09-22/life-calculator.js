/* Monthly compounding at an effective annual rate, payments at month-end.
   User-requested 1% entry fee on every payment. No tax/inflation modelling. */
(function(root, factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.GPLifeCalculator=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const FEE=.01;
  const LIMITS=Object.freeze({initial:[0,500000],monthly:[0,10000],years:[1,40],rate:[-5,10]});
  function project(input){
    const values={},errors=[];
    for(const [key,[min,max]] of Object.entries(LIMITS)){
      const raw=input[key],value=Number(raw);
      if(raw===null||raw===undefined||raw===''||!Number.isFinite(value)||value<min||value>max||(key==='years'&&!Number.isInteger(value)))errors.push(key);
      values[key]=value;
    }
    if(errors.length)return {valid:false,errors};
    const {initial,monthly,years,rate}=values;
    const factor=Math.pow(1+rate/100,1/12);
    let capital=initial*(1-FEE);
    const points=[];
    function snapshot(year){
      const paid=initial+monthly*year*12,fees=paid*FEE,invested=paid-fees;
      return {year,paid,fees,invested,capital,performance:capital-invested,netGain:capital-paid};
    }
    points.push(snapshot(0));
    for(let month=1;month<=years*12;month++){
      capital=capital*factor+monthly*(1-FEE);
      if(month%12===0)points.push(snapshot(month/12));
    }
    return {valid:true,...values,feeRate:FEE,monthlyRate:factor-1,points,final:points.at(-1)};
  }
  return {FEE,LIMITS,project};
});
