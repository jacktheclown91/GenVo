// Proposed owner-side observation only. No second water or energy inventory.
export function noteHydrationTransfer(sim,a,before,{medium,i=null,resolved=false}={}){
 const gain=a?.hydration-before,w=sim?.world;
 if(!a||!Number.isFinite(before)||!Number.isFinite(gain)||!(gain>0)||!Number.isSafeInteger(a.id)||!Number.isSafeInteger(sim?.tickCount)||!w||!['surface-water','surface-access','cave-groundwater','snow'].includes(medium))return null;
 if(resolved&&(!Number.isSafeInteger(i)||i<0||i>=w.len))return null;
 const record={actorId:a.id,tick:sim.tickCount,hydrationGain:gain,medium,sourceResolved:!!resolved,sourceIndex:resolved?i:null,worldSeed:w.seed,regionOrigin:w.regionOrigin?{x:w.regionOrigin.x,y:w.regionOrigin.y}:null,underground:!!a.underground};
 // Preserve the prior successful record on failed/full requests; never retime it.
 a.lastHydrationTransfer=record;return record;
}
export function surfaceHydrationSource(world,a){
 const i=world.idx(a.x,a.y);
 // The existing grant is authorized at the receiver's cell. A shore access mask
 // does not identify which water cell supplied it. Do not guess from a target.
 return world.water[i]?{medium:'surface-water',i,resolved:true}:{medium:'surface-access',resolved:false};
}
