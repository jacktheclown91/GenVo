import {CFG} from '../sim/config.js';
import {LEGACY_DAY_TICKS,dayTicksFor} from '../sim/day-clock.js';
import {LAND_PRODUCERS,PLANT_RESOURCE_UNITS} from './plant-resources.js';
import {boundedFloat32Debit} from '../core/float32-transfer.js';
import {regionalRainfall,planetaryWindAt} from '../world/weather-fronts.js';
import {coordNoise} from '../core/rng.js';
import {undergroundRoof} from '../lineage/burrowing.js';
import {creatureView,viewCanSee} from './atmospheric-visibility.js';
import {sensoryProfile} from './sensory-world.js';
import {stratumHearing} from './stratum-senses.js';
export const WILDFIRE=Object.freeze({policy:'finite-vegetation-fire/1',burnPerSecond:.08,spreadInterval:8});
export function wildfireSpreadInterval(sim){const ticks=dayTicksFor(sim);return Math.round(WILDFIRE.spreadInterval*(ticks/LEGACY_DAY_TICKS));}
export function wildfireClockScale(sim){const ticks=dayTicksFor(sim);return LEGACY_DAY_TICKS/ticks;}
export const createWildfire=()=>({schema:1,lastTick:0,cells:new Map(),ignitions:0,burned:0,mineralReturn:0,atmosphericExport:0});
export function fireFuel(sim,i){return LAND_PRODUCERS.reduce((sum,k)=>sum+(sim.world.plants[k]?.[i]||0),0)}
export function fireDryness(sim,i){const w=sim.world;if(w.water[i]||!w.isPlayable(i%w.n+.5,(i/w.n|0)+.5))return 0;const rain=regionalRainfall(w,{...sim.climate,frontDay:sim.day},i);return Math.max(0,Math.min(1,1-(w.moisture[i]||0)-rain*.35));}
export function igniteWildfire(sim,i){const s=sim.wildfire;if(sim.fireRules!==WILDFIRE.policy||!s||!Number.isSafeInteger(i)||i<0||i>=sim.world.len||s.cells.has(i)||fireDryness(sim,i)<.35||fireFuel(sim,i)<.04)return false;s.cells.set(i,{since:sim.tickCount,intensity:.25});s.ignitions++;return true;}
export function fireDanger(sim,a){if(sim.fireRules!==WILDFIRE.policy||!sim.wildfire?.cells.size||undergroundRoof(sim.world,a)||a.airborne||(a.diveDepth||0)>.03)return 0;return sim.wildfire.cells.get(sim.world.idx(a.x,a.y))?.intensity||0;}
export function advanceWildfire(sim){
 const s=sim.wildfire;if(sim.fireRules!==WILDFIRE.policy||!s||sim.tickCount<=s.lastTick)return;s.lastTick=sim.tickCount;
 const w=sim.world,dt=1/CFG.simHz,spread=new Set(),clockScale=wildfireClockScale(sim),spreadInterval=wildfireSpreadInterval(sim);
 for(const [i,cell] of [...s.cells].sort((a,b)=>a[0]-b[0])){
  const dry=fireDryness(sim,i),fuel=fireFuel(sim,i);if(dry<.15||fuel<.0001){s.cells.delete(i);continue}
  let consumed=0;const requested=WILDFIRE.burnPerSecond*dt*dry*clockScale;
  for(const kind of LAND_PRODUCERS){const field=w.plants[kind],before=field[i];if(!(before>0))continue;const debit=boundedFloat32Debit(before,requested*before/fuel);field[i]=debit.remaining;w.onCropConsumed?.(kind,i,before,field[i]);consumed+=debit.amount;}
  const mineral=consumed*PLANT_RESOURCE_UNITS.mineralPerBiomass;w.plantResources.minerals[i]+=mineral;s.burned+=consumed;s.mineralReturn+=mineral;s.atmosphericExport+=consumed-mineral;w.plantResources.totals.fireMineralReturn=(w.plantResources.totals.fireMineralReturn||0)+mineral;
  cell.intensity=Math.min(1,dry*Math.min(1,fuel)*2);if(!(consumed>0)){s.cells.delete(i);continue}
  if(sim.tickCount%spreadInterval===0){const wind=planetaryWindAt(w,sim.day,i),x=i%w.n,y=i/w.n|0,step=Math.round(sim.tickCount*clockScale);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){if(x+dx<0||x+dx>=w.n||y+dy<0||y+dy>=w.n)continue;const j=w.idx(x+dx,y+dy),bias=1+Math.max(-.75,Math.min(1,(wind?.east||0)*dx+(wind?.south||0)*dy)),chance=dry*cell.intensity*.3*bias;if(coordNoise(w.seedHash^0x66697265,step+i,j)<chance)spread.add(j)}}
 }
 for(const i of [...spread].sort((a,b)=>a-b))igniteWildfire(sim,i);
 for(const a of sim.animals){if(!a.alive)continue;const danger=fireDanger(sim,a);if(!danger)continue;const damage=Math.min(a.health,12*danger*dt);a.health-=damage;a.lastFireIncident={tick:sim.tickCount,damage};if(a.player){a.hidden=false;sim.lastPlayerDamage={tick:sim.tickCount,amount:damage,source:'wildfire',attackerId:null};if(sim.tickCount%CFG.simHz===0)sim.playerCombat?.queue({ok:false,type:'wildfire-hit',message:'Burning vegetation! Leave the flames.'})}if(a.health<=0)sim.kill(a,'wildfire');else sim.injury?.onDamage(a,{damage,cause:'burning vegetation'});}
}
export function fireEscapeDecision(sim,a){
 if(a.player&&!sim.playerAutonomy||!fireDanger(sim,a))return null;const view=creatureView(sim,a),options=[];
 for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const d=Math.hypot(dx,dy),x=a.x+dx,y=a.y+dy;if(!d||d>Math.min(3,view.range)||!sim.world.isPlayable(x,y)||!viewCanSee(view,x,y)||!sim.canOccupy(a,x,y)||fireDanger(sim,Object.assign(Object.create(a),{x,y})))continue;options.push({x,y,d})}
 options.sort((a,b)=>a.d-b.d);for(const target of options)if(sim.canReach(a,target.x,target.y))return{intent:'escape',target};return null;
}
export function audibleWildfire(sim,a){
 if(sim.fireRules!==WILDFIRE.policy||!a)return null;const radius=sensoryProfile(a).hearing;let volume=0;
 for(const [i,c] of sim.wildfire.cells){const source={x:i%sim.world.n+.5,y:(i/sim.world.n|0)+.5,underground:false},distance=Math.hypot(a.x-source.x,a.y-source.y);if(distance>radius||!stratumHearing(sim,a,source,radius))continue;volume=Math.max(volume,c.intensity*(1-distance/Math.max(.01,radius)))}
 return volume>0?{volume}:null;
}
export function validateWildfire(core,n,timeline=core.tickCount){
 if(core.fireRules===undefined){if(core.wildfire!==undefined)throw Error('Wildfire state requires saved rules.');return}
 const s=core.wildfire;if(core.fireRules!==WILDFIRE.policy||s?.schema!==1||!(s.cells instanceof Map)||!Number.isSafeInteger(s.lastTick)||s.lastTick<0||s.lastTick>core.tickCount||s.lastTick>timeline||!Number.isSafeInteger(s.ignitions)||s.ignitions<s.cells.size||!['burned','mineralReturn','atmosphericExport'].every(k=>Number.isFinite(s[k])&&s[k]>=0)||Math.abs(s.burned-s.mineralReturn-s.atmosphericExport)>1e-8*Math.max(1,s.burned))throw Error('Invalid wildfire ledger or clock.');
 for(const [i,c] of s.cells)if(!Number.isSafeInteger(i)||i<0||i>=n*n||!Number.isSafeInteger(c.since)||c.since<0||c.since>core.tickCount||!Number.isFinite(c.intensity)||c.intensity<=0||c.intensity>1)throw Error('Invalid burning cell.');
}
export function restoreWildfire(sim,core){validateWildfire(core,sim.world.n);if(core.fireRules===undefined){delete sim.fireRules;delete sim.wildfire}validateWildfire(sim,sim.world.n);for(const session of sim.planetaryTravel?.sessions||[]){validateWildfire(session.snapshot.core,sim.world.n,sim.tickCount);if(session.snapshot.core.fireRules!==sim.fireRules)throw Error('Inconsistent regional fire rules.')}}
