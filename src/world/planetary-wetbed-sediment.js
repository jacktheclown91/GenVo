// Water-funded sediment entering a live river/lake bed. Actual material
// stays in the existing Float32 terrain.elevation. Raising a submerged bed
// displaces an equal physical water volume and its dissolved salt into a
// lower-head adjacent WET cell. No water, salt or sediment can disappear;
// closed ponds cannot accept a deposit until an outlet exists.
// This is a new, explicitly saved policy. Historical worlds are unchanged.
import {TERRAIN_SEDIMENT} from './terrain-sediment.js';

export const PLANETARY_WETBED=Object.freeze({
 policy:'conserved-wetbed-displacement/1',
 maxDeposit:.001,
 minWet:.012,
 minHead:.00001,
 waterFraction:.003,
 maxElevation:.999
});

export function validateWetbedPolicy(w,e){
 if(e?.wetbedSedimentPolicy===undefined)return;
 if(e.wetbedSedimentPolicy!==PLANETARY_WETBED.policy||
    e.terrainSedimentPolicy!==TERRAIN_SEDIMENT.policy||
    e.schema!==6||w?.generator!=='planetary/1'||
    !(e.volume instanceof Float64Array)||e.volume.length!==w.len||
    !(e.salt instanceof Float64Array)||e.salt.length!==w.len||
    !(w.terrain?.elevation instanceof Float32Array))
  throw Error('Invalid planetary wetbed-sediment policy.');
 for(const k of ['wetbedSedimentMoved','wetbedWaterDisplaced']){
  const v=e.totals?.[k];
  if(v!==undefined&&(!Number.isFinite(v)||v<0))
   throw Error('Invalid planetary wetbed totals.');
 }
 for(const row of [...(e.daily||[]),...(e.lastDay?[e.lastDay]:[])]){
  for(const k of ['wetbedSedimentMoved','wetbedWaterDisplaced']){
   const v=row[k];
   if(v!==undefined&&(!Number.isFinite(v)||v<0))
    throw Error('Invalid planetary wetbed receipt.');
  }
  if((row.wetbedSedimentMoved!==undefined||row.wetbedWaterDisplaced!==undefined)&&
     (!Number.isFinite(row.wetbedSedimentMoved)||!Number.isFinite(row.wetbedWaterDisplaced)||
      Math.abs(row.wetbedSedimentMoved-row.wetbedWaterDisplaced)>1e-8))
    throw Error('Unbalanced planetary wetbed sediment displacement.');
 }
 if(e.totals?.wetbedSedimentMoved!==undefined&&
    e.totals.wetbedWaterDisplaced!==undefined&&
    Math.abs(e.totals.wetbedSedimentMoved-e.totals.wetbedWaterDisplaced)>1e-6)
  throw Error('Unbalanced planetary wetbed totals.');
}

// All changes are signed, STAGED deltas. The calling water authority validates
// full conservation and commits after every region has been checked.
export function stageWetbedSediment(source,target,si,ti,runoff,
 terrainChanges,waterChanges,saltChanges){
 const rule=PLANETARY_WETBED;
 if(source?.env?.wetbedSedimentPolicy!==rule.policy||
    target?.env?.wetbedSedimentPolicy!==rule.policy||
    source.env.terrainSedimentPolicy!==TERRAIN_SEDIMENT.policy||
    target.env.terrainSedimentPolicy!==TERRAIN_SEDIMENT.policy||
    source.water[si]||!target.water[ti]||!(runoff>0))return null;
 const n=Math.sqrt(target.water.length),m=target.terrain?.elevation,
    a=source.terrain?.elevation;
 if(!Number.isSafeInteger(n)||!Number.isSafeInteger(si)||!Number.isSafeInteger(ti)||
    !(a instanceof Float32Array)||!(m instanceof Float32Array)||
    si<0||si>=source.water.length||ti<0||ti>=target.water.length||
    !(target.env.volume instanceof Float64Array)||!(target.env.salt instanceof Float64Array)||
    !Number.isFinite(runoff))
  throw Error('Invalid wetbed-sediment transfer geometry.');
 const ta=terrainChanges.get(source.key),tb=terrainChanges.get(target.key),
    wb=waterChanges.get(target.key),sb=saltChanges.get(target.key);
 if(!ta||!tb||!wb||!sb)throw Error('Missing wetbed water or terrain owner.');
 const stock=(arr,map,i)=>arr[i]+(map.get(i)||0);
 const donor=stock(a,ta,si),bed=stock(m,tb,ti),
    depth=stock(target.env.volume,wb,ti),
    dissolved=stock(target.env.salt,sb,ti);
 if(![donor,bed,depth,dissolved].every(Number.isFinite)||
   donor<0||donor>1||bed<0||bed>1||depth<=0||depth>2||
   dissolved<0||dissolved>depth*2+1e-9)
  throw Error('Invalid wetbed sediment or water stock.');
 const slope=donor-bed;
 if(slope<=rule.minHead||depth<=rule.minWet)return null;
 // Real interior downstream water is essential: no fabricated outlet,
 // external reservoir, or dry-neighbor deposit can balance displacement.
 const x=ti%n,y=Math.floor(ti/n),neighbors=[
    ...(x>0?[ti-1]:[]),...(x<n-1?[ti+1]:[]),
    ...(y>0?[ti-n]:[]),...(y<n-1?[ti+n]:[])
 ];
 let chosen=-1,available=0;
 for(const k of neighbors){
  if(!target.water[k])continue;
  const nextDepth=stock(target.env.volume,wb,k),nextBed=stock(m,tb,k),
    nextSalt=stock(target.env.salt,sb,k);
  if(![nextDepth,nextBed,nextSalt].every(Number.isFinite)||
     nextDepth<=0||nextDepth>2||nextBed<0||nextBed>1||
     nextSalt<0||nextSalt>nextDepth*2+1e-9)
   throw Error('Invalid wetbed downstream capacity.');
  const head=(bed+depth)-(nextBed+nextDepth);
  const capacity=Math.min(Math.max(0,2-nextDepth),Math.max(0,head*.25));
  if(capacity>available){available=capacity;chosen=k;}
 }
 if(chosen<0||available<=1e-10)return null;
 const amount=Math.min(rule.maxDeposit,runoff*rule.waterFraction,
  (donor-bed)*.25,donor-.001,rule.maxElevation-bed,
  depth-rule.minWet,available);
 if(!(amount>1e-10))return null;
 // The water column shrinks by exactly the new sediment height; the displaced
 // liquid moves to another wet cell, carrying actual dissolved salt.
 const transferSalt=Math.min(dissolved,dissolved/depth*amount,
  Math.max(0,2*(stock(target.env.volume,wb,chosen)+amount)-
     stock(target.env.salt,sb,chosen)));
 if(!Number.isFinite(transferSalt)||transferSalt<0)
  throw Error('Invalid wetbed dissolved salt.');
 ta.set(si,(ta.get(si)||0)-amount);
 tb.set(ti,(tb.get(ti)||0)+amount);
 wb.set(ti,(wb.get(ti)||0)-amount);
 wb.set(chosen,(wb.get(chosen)||0)+amount);
 if(transferSalt){
  sb.set(ti,(sb.get(ti)||0)-transferSalt);
  sb.set(chosen,(sb.get(chosen)||0)+transferSalt);
 }
 return{sediment:amount,water:amount,salt:transferSalt,recipient:ti,outlet:chosen};
}
