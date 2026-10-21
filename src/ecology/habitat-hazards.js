import {CFG} from '../sim/config.js';
import {WILDFIRE} from './wildfire.js';
import {liquidVolume} from '../world/surface-ice.js';
import {canopySupport} from './canopy-site.js';
import {visuallyObservable} from './atmospheric-visibility.js';
export const HABITAT_HAZARDS=Object.freeze({policy:'physical-habitat-hazards/1'});
export const createHabitatHazards=()=>({schema:1,lastTick:0,cacheEnergyLost:0,eggEnergyLost:0,eggWaterLost:0,eggsLost:0});
// Query existing physical owners. Structure integrity is a game-unit condition,
// cached food is energy, and egg funding is energy/water, never plant biomass.
export function habitatHazardAt(sim,site){
 if(sim.habitatHazardRules!==HABITAT_HAZARDS.policy)return{fire:0,flood:0};
 const w=sim.world,i=w.idx(site.x,site.y),supported=site.layer==='canopy'&&canopySupport(w,site.x,site.y).supported;
 const fire=sim.fireRules===WILDFIRE.policy?(sim.wildfire?.cells.get(i)?.intensity||0)*(supported?.35:1):0;
 const liquid=w.environment?liquidVolume(w.environment,i):w.water[i]?1:0;
 return{fire,flood:!supported&&w.water[i]&&liquid>.01?Math.min(1,liquid):0};
}
export function advanceHabitatHazards(sim){
 const state=sim.habitatHazards;if(sim.habitatHazardRules!==HABITAT_HAZARDS.policy||!state||sim.tickCount<=state.lastTick)return;state.lastTick=sim.tickCount;const dt=1/CFG.simHz;
 for(const shelter of sim.shelter?.shelters||[]){
  const h=habitatHazardAt(sim,shelter);if(!h.fire&&!h.flood)continue;
  const before=shelter.integrity;shelter.integrity=Math.max(0,before-(h.fire*4+h.flood*2)*dt);shelter.weatherSeal=Math.max(0,(shelter.weatherSeal??.78)-(h.fire*.04+h.flood*.015)*dt);
  const stock=shelter.foodStore||0,loss=shelter.integrity<=0?stock:Math.min(stock,(h.fire*.18+h.flood*.12)*dt);shelter.foodStore=stock-loss;state.cacheEnergyLost+=stock-shelter.foodStore;
  shelter.lastHazard={tick:sim.tickCount,cause:h.fire?'wildfire':'flooding'};
  if(before>0&&shelter.integrity===0){const p=sim.player?.();if(p&&Math.hypot(p.x-shelter.x,p.y-shelter.y)<4&&visuallyObservable(sim,p,{...shelter,underground:false}))sim.playerCombat?.queue({ok:false,type:'shelter-destroyed',message:'The shelter has been destroyed by '+shelter.lastHazard.cause+'.'});}
 }
 for(const nest of sim.nests||[]){const h=habitatHazardAt(sim,nest);if(!h.fire&&!h.flood)continue;nest.integrity=Math.max(0,nest.integrity-(h.fire*.12+h.flood*.2)*dt);nest.lastHazard={tick:sim.tickCount,cause:h.fire?'wildfire':'flooding'};}
 const survivors=[];for(const egg of sim.eggs||[]){
  const nest=sim.nests?.find(n=>n.id===egg.nestId),h=habitatHazardAt(sim,nest||egg);if(!h.fire&&!h.flood||egg.condition<=0){survivors.push(egg);continue}
  const protection=Math.max(0,Math.min(1,nest?.integrity||0));egg.condition=Math.max(0,egg.condition-(h.fire*.18*(1-protection*.4)+h.flood*.45)*dt);egg.lastHazard={tick:sim.tickCount,cause:h.fire?'wildfire':'flooding'};
  if(egg.condition>0){survivors.push(egg);continue}
  state.eggsLost++;state.eggEnergyLost+=Math.max(0,egg.energy||0);state.eggWaterLost+=Math.max(0,egg.hydration||0);sim.family?.pushEvent?.({type:'egg-loss',animalId:egg.motherId,eggId:egg.id,cause:egg.lastHazard.cause});
 }
 sim.eggs=survivors;
}
export function validateHabitatHazards(core,timeline=core.tickCount){
 if(core.habitatHazardRules===undefined){if(core.habitatHazards!==undefined)throw Error('Habitat hazards require saved rules.');return}
 const s=core.habitatHazards;if(core.habitatHazardRules!==HABITAT_HAZARDS.policy||s?.schema!==1||!Number.isSafeInteger(s.lastTick)||s.lastTick<0||s.lastTick>core.tickCount||s.lastTick>timeline||!Number.isSafeInteger(s.eggsLost)||s.eggsLost<0||!['cacheEnergyLost','eggEnergyLost','eggWaterLost'].every(k=>Number.isFinite(s[k])&&s[k]>=0))throw Error('Invalid habitat hazard ledger or clock.');
}
export function restoreHabitatHazards(sim,core){validateHabitatHazards(core);if(core.habitatHazardRules===undefined){delete sim.habitatHazardRules;delete sim.habitatHazards}validateHabitatHazards(sim);for(const session of sim.planetaryTravel?.sessions||[]){validateHabitatHazards(session.snapshot.core,sim.tickCount);if(session.snapshot.core.habitatHazardRules!==sim.habitatHazardRules)throw Error('Inconsistent regional habitat hazard rules.')}}
