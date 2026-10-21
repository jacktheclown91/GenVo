import {localTemperature} from './environment.js';
import {SNOW} from './snowpack.js';
// Ice is a WATER-EQUIVALENT SUBSET of the existing owned volume. Never add
// this field to water totals: freezing changes phase, not inventory ownership.
export const SURFACE_ICE=Object.freeze({policy:'finite-surface-ice/1',freezeRate:.18,meltRate:.22,saltDepression:.06,minimumLiquid:.01,rebondGrowth:.005,capacityScale:500,weakMargin:.02});
export function iceAmount(environment,i){return environment?.icePolicy===SURFACE_ICE.policy?environment.ice[i]:0}
// A coherent sheet seals access; cracks retain their frozen mass but expose water.
export function surfaceIceCovered(environment,i){return iceAmount(environment,i)>SURFACE_ICE.weakMargin&&!environment.iceBroken[i]}
export function liquidVolume(environment,i,total=environment?.volume?.[i]??environment?.depth?.[i]??0){return total-iceAmount(environment,i)}
export function initializeSurfaceIce(world,{day=world.environment?.day??0}={}){
 const e=world.environment;if(world.generator!=='planetary/1'||!(e?.volume instanceof Float64Array)||e.schema<3)return false;
 if(!Number.isSafeInteger(day)||day<0)throw Error('Invalid surface-ice origin day.');
 validateSurfaceIce(world);if(e.icePolicy!==undefined)return false;
 const state={icePolicy:SURFACE_ICE.policy,ice:new Float64Array(world.len),iceBroken:new Uint8Array(world.len),iceDay:day,iceRevision:0,iceTotals:{frozen:0,thawed:0,breaks:0}};
 validateSurfaceIce(world,{...e,...state});Object.assign(e,state);return true;
}
export function validateSurfaceIce(world,environment=world.environment){
 const e=environment;if(e?.icePolicy===undefined){if(['ice','iceBroken','iceTotals','iceDay','iceRevision'].some(k=>e?.[k]!==undefined))throw Error('Surface ice requires its recorded policy.');return}
 if(e.icePolicy!==SURFACE_ICE.policy||world.generator!=='planetary/1'||e.schema<3||!(e.volume instanceof Float64Array)||e.volume.length!==world.len||!(e.ice instanceof Float64Array)||e.ice.length!==world.len||!(e.iceBroken instanceof Uint8Array)||e.iceBroken.length!==world.len||!Number.isSafeInteger(e.iceDay)||e.iceDay<0||!Number.isSafeInteger(e.iceRevision)||e.iceRevision<0||!['frozen','thawed','breaks'].every(k=>Number.isFinite(e.iceTotals?.[k])&&e.iceTotals[k]>=0)||!Number.isSafeInteger(e.iceTotals.breaks))throw Error('Invalid finite surface-ice state.');
 if(!(e.salt instanceof Float64Array)||e.salt.length!==world.len||!(world.water instanceof Uint8Array)||world.water.length!==world.len)throw Error('Invalid surface-ice water owner.');
 let total=0;for(let i=0;i<world.len;i++){const frozen=e.ice[i],liquid=e.volume[i]-frozen;if(!Number.isFinite(e.volume[i])||e.volume[i]<0||!Number.isFinite(e.salt[i])||e.salt[i]<0||!Number.isFinite(frozen)||frozen<0||frozen>e.volume[i]||!world.water[i]&&frozen!==0||e.iceBroken[i]>1||e.iceBroken[i]&&frozen===0||frozen>0&&liquid<SURFACE_ICE.minimumLiquid-1e-10||e.salt[i]>liquid*2+1e-9)throw Error('Invalid frozen/liquid water partition.');total+=frozen}
 if(Math.abs(e.iceTotals.frozen-e.iceTotals.thawed-total)>1e-6)throw Error('Surface-ice phase accounting failed.');
}
export function advanceSurfaceIce(world,climate,day){
 const e=world.environment;if(e?.icePolicy!==SURFACE_ICE.policy)return null;validateSurfaceIce(world);
 if(!Number.isSafeInteger(day)||day<e.iceDay)throw Error('Invalid surface-ice day.');if(day===e.iceDay)return null;
 const next=e.ice.slice(),broken=e.iceBroken.slice();let frozen=0,thawed=0;
 for(let i=0;i<world.len;i++)if(world.water[i]){
  const temperature=localTemperature(world,climate,i);if(!Number.isFinite(temperature))throw Error('Invalid surface-ice temperature.');
  const liquid=liquidVolume(e,i),concentration=e.salt[i]/Math.max(1e-12,liquid),freezeBelow=SNOW.freezeBelow-SURFACE_ICE.saltDepression*concentration;
  const capacity=Math.max(0,e.volume[i]-Math.max(SURFACE_ICE.minimumLiquid,e.salt[i]/2));
  const growth=Math.min(Math.max(0,capacity-next[i]),Math.max(0,freezeBelow-temperature)*SURFACE_ICE.freezeRate/(1+next[i]*4));
  const melt=Math.min(next[i],Math.max(0,temperature-SNOW.meltAbove)*SURFACE_ICE.meltRate);
  next[i]+=growth-melt;frozen+=growth;thawed+=melt;if(next[i]===0||growth>=SURFACE_ICE.rebondGrowth)broken[i]=0;
 }
 const totals={...e.iceTotals,frozen:e.iceTotals.frozen+frozen,thawed:e.iceTotals.thawed+thawed},revision=e.iceRevision+(frozen>0||thawed>0?1:0);
 validateSurfaceIce(world,{...e,ice:next,iceBroken:broken,iceTotals:totals,iceRevision:revision,iceDay:day});
 // Publish only after every cell and the complete phase ledger validate.
 e.ice.set(next);e.iceBroken.set(broken);e.iceTotals=totals;e.iceRevision=revision;e.iceDay=day;
 return{day,frozen,thawed,waterInput:0,waterOutput:0,waterClosure:0};
}
export function iceCapacity(environment,i){const thickness=iceAmount(environment,i);return environment?.iceBroken?.[i]?0:Math.max(0,thickness-SURFACE_ICE.weakMargin)**2*SURFACE_ICE.capacityScale}
export function fractureSurfaceIce(world,i,load){
 const e=world.environment;if(e?.icePolicy!==SURFACE_ICE.policy)return false;
 if(!Number.isSafeInteger(i)||i<0||i>=world.len||!Number.isFinite(load)||load<=0)throw Error('Invalid surface-ice load.');
 if(!iceAmount(e,i)||e.iceBroken[i]||load<=iceCapacity(e,i))return false;
 // Mechanical fracture opens the sheet; it does not magically melt its water.
 e.iceBroken[i]=1;e.iceRevision++;e.iceTotals.breaks++;world.buildHydrology?.();return true;
}
