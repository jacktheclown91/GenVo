// Mineral-bearing fine sediment is carried by actually moving runoff, using
// the already finite plantResources.minerals store on land and underwater.
// No second nutrient, sediment, or biotic food inventory is introduced.
// Release is restricted to an explicit new-world environmental policy.
export const PLANETARY_MINERAL_RUNOFF=Object.freeze({
 policy:'conserved-runoff-minerals/1',maxMobileFraction:.12
});
export function validateMineralRunoffPolicy(w,e){
 if(e?.mineralRunoffPolicy===undefined)return;
 if(e.mineralRunoffPolicy!==PLANETARY_MINERAL_RUNOFF.policy||
    w?.generator!=='planetary/1'||e.schema!==6)
  throw Error('Invalid planetary runoff-mineral policy.');
 for(const name of ['runoffMineralsMoved','seamMineralsInput','seamMineralsOutput']){
  const v=e.totals?.[name];
  if(v!==undefined&&(!Number.isFinite(v)||v<0))
   throw Error('Invalid planetary runoff-mineral totals.');
 }
 for(const row of [...(e.daily||[]),...(e.lastDay?[e.lastDay]:[])])
  for(const name of ['runoffMineralsMoved','seamMineralsInput','seamMineralsOutput']){
   const v=row[name];
   if(v!==undefined&&(!Number.isFinite(v)||v<0))
    throw Error('Invalid planetary runoff-mineral receipt.');
  }
}
// Advect a finite share of the source's already existing mineral reserve.
// sourceWater is the donor's pre-routing overland store; waterMoved is a real
// accounted physical water flux, not a guessed precipitation amount.
// Stage deltas are signed mineral mass changes.
export function stageRunoffMinerals(source,target,from,to,waterMoved,sourceWater,changes){
 if(!(waterMoved>0)||source?.env?.mineralRunoffPolicy!==PLANETARY_MINERAL_RUNOFF.policy||
    target?.env?.mineralRunoffPolicy!==PLANETARY_MINERAL_RUNOFF.policy)return 0;
 const src=source.minerals,dst=target.minerals;
 if(!(src instanceof Float64Array)||!(dst instanceof Float64Array)||
    !Number.isSafeInteger(from)||from<0||from>=src.length||
    !Number.isSafeInteger(to)||to<0||to>=dst.length||
    !Number.isFinite(sourceWater)||sourceWater<=0||!Number.isFinite(waterMoved))
  throw Error('Invalid runoff-mineral physical source.');
 const a=changes.get(source.key),b=changes.get(target.key);
 if(!a||!b)throw Error('Missing runoff-mineral owner.');
 const original=src[from],current=original+(a.get(from)||0),dest=dst[to]+(b.get(to)||0);
 if(!Number.isFinite(original)||!Number.isFinite(current)||current<0||
    !Number.isFinite(dest)||dest<0)
  throw Error('Invalid runoff-mineral source stock.');
 // Bound loss so a single storm cannot wash out all upstream soil reserves.
 const fraction=Math.min(PLANETARY_MINERAL_RUNOFF.maxMobileFraction,
   PLANETARY_MINERAL_RUNOFF.maxMobileFraction*waterMoved/sourceWater);
 const moved=Math.min(current,Math.max(0,original*fraction));
 if(!(moved>1e-12))return 0;
 a.set(from,(a.get(from)||0)-moved);
 b.set(to,(b.get(to)||0)+moved);
 return moved;
}
