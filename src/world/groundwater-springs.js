import {syncCaveAir} from './cave-air.js';
// Spring outlets are paid for from the existing World-owned groundwater
// inventory. The outgoing water enters the SAME land runoff handoff that
// already routes rainfall, snowmelt and saturated-soil overflow.
//
// This does not create a second aquifer, spawn fresh water by biome, or change
// historical worlds which lack the explicitly saved spring policy.
export const GROUNDWATER_SPRINGS=Object.freeze({
 policy:'funded-groundwater-springs/1',schema:1,
 waterTableThreshold:.72,minimumMoisture:.55,
 dischargeFraction:.15,maxDischargePerCell:.022,
 maxSpringCellsPerDay:256,freezingTemperature:.30
});
const floatBits=new DataView(new ArrayBuffer(4));
function debitAtMost(before,desired){
 let after=Math.fround(before-desired);
 // Rounding a Float32 donor down must not exceed the declared water budget.
 if(before-after>desired){floatBits.setFloat32(0,after);floatBits.setUint32(0,floatBits.getUint32(0)+1);after=floatBits.getFloat32(0)}
 return after;
}

export function validateGroundwaterSpringPolicy(w,soil){
 if(soil?.springPolicy===undefined)return;
 if(soil.springPolicy!==GROUNDWATER_SPRINGS.policy||
  w?.generator!=='planetary/1'||w.environment?.schema!==6||
  w.environment?.springEligibility!==GROUNDWATER_SPRINGS.policy)
  throw Error('Invalid funded groundwater-spring policy.');
 if(!Number.isFinite(soil.totals?.springDischarge)||soil.totals.springDischarge<0)
  throw Error('Invalid funded spring totals.');
 for(const row of [...(soil.daily||[]),...(soil.lastDay?[soil.lastDay]:[])])
  if(row.springDischarge!==undefined&&
     (!Number.isFinite(row.springDischarge)||row.springDischarge<0||
      row.springDischarge>row.outputs+1e-6))
   throw Error('Invalid funded spring discharge receipt.');
}

export function advanceGroundwaterSprings(w,runoff,day){
 const s=w.soilWater,e=w.environment,rule=GROUNDWATER_SPRINGS;
 if(s?.springPolicy===undefined)return{discharged:0,sites:0};
 if(s.springPolicy!==rule.policy)throw Error('Invalid funded groundwater-spring policy.');
 if(!Number.isSafeInteger(day)||day<1||!(runoff instanceof Float64Array)||
    runoff.length!==w.len||!(s.groundwater instanceof Float32Array)||
    s.groundwater.length!==w.len||!(w.terrain?.downstream instanceof Int32Array)||
    !e||e.schema!==6||!e.lastDay||e.lastDay.day!==day)
  throw Error('Invalid funded spring handoff.');
 validateGroundwaterSpringPolicy(w,s);
 const g=s.groundwater,downstream=w.terrain.downstream,temperature=w.temperature;
 const start=(day*97)%w.len;
 let discharged=0,sites=0;
 // Rotating deterministic scan avoids permanently favoring the north-west
 // corner when many water-table outlets are active. No extra wildlife RNG.
 for(let scanned=0;scanned<w.len&&sites<rule.maxSpringCellsPerDay;scanned++){
  const i=(start+scanned)%w.len;
  if(w.water[i]||downstream[i]<0||w.moisture[i]<rule.minimumMoisture||
     temperature[i]<rule.freezingTemperature||s.snowpack?.[i]>.05)continue;
  const before=g[i];
  if(!Number.isFinite(before)||before<0||before>1)
   throw Error('Invalid groundwater stock at spring outlet.');
  if(before<=rule.waterTableThreshold)continue;
  const desired=Math.min(rule.maxDischargePerCell,
   (before-rule.waterTableThreshold)*rule.dischargeFraction);
  const after=debitAtMost(before,desired),amount=before-after;
  if(!(amount>0))continue;
  if(!Number.isFinite(runoff[i])||runoff[i]<0)
   throw Error('Invalid runoff stock at spring outlet.');
  g[i]=after;
  runoff[i]+=amount;discharged+=amount;sites++;
 }
 syncCaveAir(w);s.totals.springDischarge+=discharged;
 return{discharged,sites};
}
