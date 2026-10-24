import {SPECIES} from '../organisms/species.js';
import {bodyMass} from '../organisms/body-mass.js';
import {PARTS} from '../lineage/part-registry.js';
import {iceAmount,surfaceIceCovered,fractureSurfaceIce} from '../world/surface-ice.js';

// Winter water (creator direction 2026-10-23: "if water is frozen, life needs to migrate,
// hibernate, or otherwise break ice or other believable action to acquire water"). Measured on
// GENVO8-TEST-A: every water cell freezes for about twelve days of late winter while snow covers the
// land. On worlds with this policy a thirsty animal without open water, after juicy food and known
// drinking places:
//  - breaks thin ice at the water's edge: the load is its body mass, raised by striking, digging or
//    crushing anatomy; the existing ice model decides whether the sheet gives (thin early and late
//    ice does, thick midwinter ice does not) and refreezes the hole as before; it costs effort;
//  - otherwise eats snow: water comes out of the cell's finite snowpack (an output of the daily
//    soil-water ledger, like cave drinking) and the body pays the energy to melt it, so a winter on
//    snow costs reserves.
// Torpor (existing, for bodies with fat stores) already lowers water use, and migration and the
// thirsty search (sim.waterRoute) still lead animals toward open water. Every organism follows the
// same rules. Worlds recorded before this policy are unchanged.
export const WINTER_WATER=Object.freeze({policy:'winter-water/1',
 // Hydration units per unit of snowpack water (the soil-water model's water-equivalent units; a tile
 // at full visual depth, 0.34, holds about two bodies' worth). Melting costs food energy: melting and
 // warming a day's water takes roughly a tenth to a fifth of a small animal's resting energy, so
 // here a day's water (about a quarter of a body's capacity) costs about 15% of a day's food.
 hydrationPerSnow:500,meltEnergyPerWater:.03,minimumSnow:.002,
 // Ice breaking: load multipliers and the effort of one attempt.
 baseLoad:2,toolLoad:2,breakEnergy:.6,edgeRadius:8,snowRadius:3,
 // Open water within this many tiles more than a winter source is still preferred.
 openWaterWalk:4});
export function winterWaterActive(sim){return sim?.winterWaterRules===WINTER_WATER.policy}
const TOOLS=new Set(['strike','dig','crush','tear']);
// The force an animal can put on an ice sheet.
export function iceBreakLoad(a){
 const tools=(a?.bodyPlan?.nodes||[]).some(n=>(PARTS[n.partId]?.actionCapabilities||[]).some(c=>TOOLS.has(c)));
 return bodyMass(a)*(WINTER_WATER.baseLoad+(tools?WINTER_WATER.toolLoad:0));
}
function ledger(sim){return sim.stats.winterWater??={snowWater:0,snowMeltEnergy:0,iceAttempts:0,iceBreaks:0}}
// A target for a thirsty animal with no open water, or null.
export function winterWaterTarget(sim,a,{edgeRadius=WINTER_WATER.edgeRadius,snowRadius=WINTER_WATER.snowRadius,maxDistance=Infinity}={}){
 if(!winterWaterActive(sim))return null;const w=sim.world,e=w.environment,cx=Math.floor(a.x),cy=Math.floor(a.y);
 // The nearest frozen water cell with land beside it: stand on that land and work the edge. A sheet
 // that held today marks ice of that thickness as too thick until tomorrow.
 let edge=null,bestD=Math.min(Infinity,maxDistance);const R=edgeRadius;
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const x=cx+dx,y=cy+dy;if(x<1||y<1||x>=w.n-1||y>=w.n-1)continue;const i=w.idx(x,y);if(!w.water[i]||!surfaceIceCovered(e,i))continue;
  for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]]){const lx=x+ox,ly=y+oy,j=w.idx(lx,ly);if(w.water[j]||!w.isPlayable(lx+.5,ly+.5)||!w.sameLand(a.x,a.y,lx+.5,ly+.5))continue;const d=Math.hypot(lx+.5-a.x,ly+.5-a.y);if(d<=bestD&&!(a.iceRefused?.day===sim.day&&iceAmount(e,i)>=a.iceRefused.thickness*.9)){bestD=d;edge={x:lx+.5,y:ly+.5,breakIce:i}}}}
 if(edge)return edge;
 // Snow nearby.
 const snow=w.soilWater?.snowpack;if(!snow)return null;let best=null,bestS=WINTER_WATER.minimumSnow;const S=snowRadius;
 for(let dy=-S;dy<=S;dy++)for(let dx=-S;dx<=S;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=w.n||y>=w.n)continue;const i=w.idx(x,y);if(w.water[i])continue;const d=Math.hypot(x+.5-a.x,y+.5-a.y);if(d>maxDistance)continue;const v=snow[i]/(1+Math.hypot(dx,dy)*.3);if(v>bestS&&w.sameLand(a.x,a.y,x+.5,y+.5)){bestS=v;best={x:x+.5,y:y+.5,snow:true}}}
 return best;
}
// Resolve a winter-water target the animal has reached. Returns true when it acted.
export function resolveWinterWater(sim,a){
 if(!winterWaterActive(sim))return false;const t=a.target,w=sim.world,s=SPECIES[a.species];if(!t||!s)return false;
 if(t.breakIce!=null){
  if(Math.hypot(t.x-a.x,t.y-a.y)>.8)return false;const l=ledger(sim);l.iceAttempts++;a.energy=Math.max(0,a.energy-WINTER_WATER.breakEnergy);
  if(fractureSurfaceIce(w,t.breakIce,iceBreakLoad(a))){l.iceBreaks++;a.target=null;return true}
  a.iceRefused={thickness:iceAmount(w.environment,t.breakIce),day:sim.day};a.target=null;return true;
 }
 if(t.snow){
  if(Math.hypot(t.x-a.x,t.y-a.y)>.9)return false;const i=w.idx(t.x,t.y),snow=w.soilWater?.snowpack;if(!snow||!(snow[i]>0)){a.target=null;return false}
  const want=Math.min(s.maxHydration-a.hydration,s.maxHydration*.1),take=Math.min(snow[i],want/WINTER_WATER.hydrationPerSnow);if(!(take>0))return false;
  const water=take*WINTER_WATER.hydrationPerSnow,cost=water*WINTER_WATER.meltEnergyPerWater;snow[i]-=take;w.soilWater.pendingSnowEaten=(w.soilWater.pendingSnowEaten||0)+take;a.hydration+=water;a.energy=Math.max(0,a.energy-cost);
  const l=ledger(sim);l.snowWater+=water;l.snowMeltEnergy+=cost;if(a.hydration/s.maxHydration>.82)a.target=null;return true;
 }
 return false;
}
export function restoreWinterWater(sim,core){
 if(core.winterWaterRules!==undefined&&core.winterWaterRules!==WINTER_WATER.policy)throw Error('Unknown saved winter-water rules.');
 if(core.winterWaterRules===undefined)delete sim.winterWaterRules;
}
