// Physical runoff from a land cell at one planetary region edge into an
// independently owned neighboring cell. Runs inside the existing synchronized
// seam transaction, never as a second daily water simulation.
//
// It uses the standing overland store left by soil runoff after the local
// drainage hop, and does not import water at unknown/unvisited borders.
// New-world policy only: historical worlds preserve their saved drainage.
import {PLANETARY_RUNOFF} from './planetary-runoff.js';

export const PLANETARY_SEAM_RUNOFF=Object.freeze({
 policy:'paired-overland-runoff/1',schema:1
});

export function validateSeamRunoffPolicy(world,environment){
 const policy=environment?.seamRunoffPolicy;
 if(policy===undefined)return;
 if(policy!==PLANETARY_SEAM_RUNOFF.policy||
    world?.generator!=='planetary/1'||environment.schema!==6||
    !(environment.overland instanceof Float64Array)||
    environment.overland.length!==world.len)
  throw Error('Invalid planetary seam-runoff policy.');
 for(const key of ['seamRunoffInput','seamRunoffOutput'])
  if(environment.totals?.[key]!==undefined&&
    (!Number.isFinite(environment.totals[key])||environment.totals[key]<0))
   throw Error('Invalid planetary seam-runoff totals.');
}

// Return a physically bounded proposal without mutating either water store.
// Elevation must be downhill; a regional boundary never grants a free route
// uphill just because the two local maps are simulated separately.
export function seamRunoffProposal(source,target,si,ti,overlandChanges,waterChanges){
 if(source.env?.seamRunoffPolicy!==PLANETARY_SEAM_RUNOFF.policy||
    target.env?.seamRunoffPolicy!==PLANETARY_SEAM_RUNOFF.policy||
    source.water[si]||!source.terrain?.elevation||!target.terrain?.elevation)
  return 0;
 const from=source.env.overland[si]+(overlandChanges.get(source.key).get(si)||0);
 if(!(from>0))return 0;
 const wet=!!target.water[ti],to=wet
  ?target.env.volume[ti]+(waterChanges.get(target.key).get(ti)||0)
  :target.env.overland[ti]+(overlandChanges.get(target.key).get(ti)||0);
 const slope=source.terrain.elevation[si]-target.terrain.elevation[ti];
 if(!(slope>0))return 0;
 // One downhill hop per synchronized day; never overdraw the donor or fill
 // a permanent channel past its physical volume capacity.
 const amount=Math.min(from*PLANETARY_RUNOFF.moveFraction,
  Math.max(0,(slope+from-to)*PLANETARY_RUNOFF.moveFraction),
  wet?Math.max(0,2-to):Infinity);
 return Number.isFinite(amount)&&amount>1e-12?amount:0;
}

export function stagePlanetarySeamRunoff(left,right,i,j,overlandChanges,waterChanges,receipts,day,tick){
 if(left.env?.seamRunoffPolicy!==PLANETARY_SEAM_RUNOFF.policy||
    right.env?.seamRunoffPolicy!==PLANETARY_SEAM_RUNOFF.policy)return 0;
 // True terrain adjacency includes dry-to-dry and dry-to-wet links.
 // Two wet cells are owned by the existing paired hydrology/salt stage.
 const a=seamRunoffProposal(left,right,i,j,overlandChanges,waterChanges);
 const b=seamRunoffProposal(right,left,j,i,overlandChanges,waterChanges);
 if(a>0&&b>0)throw Error('Contradictory planetary downhill runoff.');
 const amount=a||b;
 if(!amount)return 0;
 const from=a?left:right,to=a?right:left,fi=a?i:j,ti=a?j:i;
 const fMap=overlandChanges.get(from.key),fDelta=fMap.get(fi)||0;
 fMap.set(fi,fDelta-amount);
 const tMap=(to.water[ti]?waterChanges:overlandChanges).get(to.key);
 tMap.set(ti,(tMap.get(ti)||0)+amount);
 const key=left.key+'|'+right.key;
 let row=receipts.get(key);
 if(!row){row={tick,day,a:left.key,b:right.key,aToB:0,bToA:0};receipts.set(key,row)}
 if(a){row.waterAToB=(row.waterAToB||0)+amount;row.runoffAToB=(row.runoffAToB||0)+amount}
 else{row.waterBToA=(row.waterBToA||0)+amount;row.runoffBToA=(row.runoffBToA||0)+amount}
 return amount;
}
