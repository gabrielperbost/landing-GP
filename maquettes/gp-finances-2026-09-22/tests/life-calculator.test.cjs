const test=require('node:test');
const assert=require('node:assert/strict');
const {project,FEE}=require('../life-calculator.js');
const base={initial:10000,monthly:200,years:20,rate:4};
const close=(a,b)=>assert.ok(Math.abs(a-b)<.000001*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('1% fees apply immediately to the first payment',()=>{
  const p=project({...base,years:1,monthly:0,rate:0});
  assert.equal(p.points[0].capital,9900);assert.equal(p.final.capital,9900);
  assert.equal(p.final.fees,100);assert.equal(p.final.performance,0);assert.equal(p.final.netGain,-100);
});
test('fees are charged on every monthly contribution, not once a year',()=>{
  const p=project({initial:1000,monthly:100,years:1,rate:0});
  assert.equal(p.final.paid,2200);assert.equal(p.final.fees,22);
  close(p.final.capital,2178);close(p.final.performance,0);
});
test('effective annual return compounds exactly once per year',()=>{
  const p=project({initial:10000,monthly:0,years:1,rate:4});
  close(p.final.capital,10296);
  const forty=project({initial:10000,monthly:0,years:40,rate:4});
  close(forty.final.capital,9900*Math.pow(1.04,40));
});
test('monthly contributions are made at month-end and match the annuity formula',()=>{
  const p=project(base),factor=Math.pow(1.04,1/12),months=20*12;
  const expected=9900*Math.pow(factor,months)+198*(Math.pow(factor,months)-1)/(factor-1);
  close(p.final.capital,expected);
});
test('negative performance is supported and fees are still deducted',()=>{
  const p=project({initial:10000,monthly:0,years:1,rate:-5});
  close(p.final.capital,9405);close(p.final.performance,-495);close(p.final.netGain,-595);
});
test('an empty investment always remains zero even at a positive return',()=>{
  const p=project({initial:0,monthly:0,years:40,rate:10});
  assert.equal(p.final.capital,0);assert.equal(p.final.paid,0);assert.equal(p.final.fees,0);
});
test('each year from one through forty is available',()=>{
  for(let years=1;years<=40;years++){
    const p=project({...base,years});assert.equal(p.valid,true);assert.equal(p.points.length,years+1);
    assert.equal(p.final.year,years);assert.equal(p.final.paid,10000+200*12*years);
  }
});
test('capital reconciles to gross contributions minus fees plus performance',()=>{
  for(const rate of [-5,0,4,10])for(const years of [1,8,20,40]){
    const p=project({...base,years,rate});
    for(const y of p.points){close(y.capital,y.paid-y.fees+y.performance);close(y.fees,y.paid*.01);}
  }
});
test('the fee constant cannot be overridden by a client value',()=>{
  assert.equal(FEE,.01);assert.equal(project({...base,feeRate:0}).final.fees,580);
});
test('invalid or blank entries do not silently reuse the last result',()=>{
  for(const bad of [{initial:''},{monthly:-1},{years:0},{years:41},{years:1.5},{rate:-6},{rate:11},{rate:Infinity},{initial:NaN},{initial:500001},{monthly:10001}])assert.equal(project({...base,...bad}).valid,false,JSON.stringify(bad));
});
test('large supported values remain finite at forty years',()=>{
  const p=project({initial:500000,monthly:10000,years:40,rate:10});
  assert.equal(p.valid,true);assert.ok(Number.isFinite(p.final.capital));assert.ok(p.final.capital>p.final.paid);
});
