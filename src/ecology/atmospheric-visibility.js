import {regionalRainfall,planetaryWindAt} from '../world/weather-fronts.js';
import {snowFraction} from '../world/snowpack.js';
import {localTemperature} from '../world/environment.js';
import {partEffectFactors} from '../lineage/part-abilities.js';
// Optical state is derived from the existing atmosphere and wet ground. It is
// a humidity/condensation proxy, not an additional liquid-water inventory.
export const VISIBILITY=Object.freeze({policy:'atmospheric-visibility/1'});
export function visualSurveyRange(animal,base=8){return base*(animal.genes?.senses||1)*(partEffectFactors(animal)?.threatSense??1)}
// The same anatomical vision contract drives actor visibility, mouse target
// availability and the player-facing fog. The physical environment is never
// simulated differently when a creature cannot see it.
const FACINGS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
export function creatureView(sim,observer,base=8){
 if(!observer)return null;
 const nodes=observer.bodyPlan?.nodes||[],eyes=nodes.filter(n=>n.socket?.startsWith('eye')).length;
 const effects=partEffectFactors(observer)||{};
 const sight=visualSurveyRange(observer,base);
 const range=eyes===0?1.55:sight;
 const limit=observer.underground?Math.min(range,4):observer.diveDepth>.03?Math.min(range,3.5):range;
 const air=!observer.underground&&!(observer.diveDepth>.03)&&sim.visibilityRules===VISIBILITY.policy?atmosphereAt(sim,observer.x,observer.y):null;
 const adjusted=limit*Math.exp(-(air?.extinction||0)*Math.min(10,limit)*.5);
 return{observer,range:Math.max(1.55,Math.min(24,adjusted)),eyes,
   rearLimit:eyes>0&&effects.wideField?-.98:eyes>=2?-.62:eyes===1?-.12:1,
   touch:1.55,level:!!observer.underground?'underground':'surface',
   facing:FACINGS[((observer.dir||0)%8+8)%8]||FACINGS[0]};
}
export function viewCanSee(view,x,y){
 if(!view||!Number.isFinite(x)||!Number.isFinite(y))return false;
 const dx=x-view.observer.x,dy=y-view.observer.y,d=Math.hypot(dx,dy);
 if(d<=view.touch)return true;
 if(d>view.range||view.eyes===0)return false;
 return(dx*view.facing[0]+dy*view.facing[1])/(d*Math.hypot(...view.facing))>=view.rearLimit;
}
export function visuallyObservable(sim,observer,target,base=8){
 if(!observer||observer.id===target.id)return true;
 if(sim.sensoryFogEnabled===true){
   if(!!observer.underground!==!!target.underground)return false;
   if(!viewCanSee(creatureView(sim,observer,base),target.x,target.y))return false;
 }
 if(sim.visibilityRules!==VISIBILITY.policy||observer.underground)return true;
 return atmosphericSight(sim,observer,target,visualSurveyRange(observer,base)).detected;
}
const clamp=v=>Math.max(0,Math.min(1,v));
export function atmosphereAt(sim,x,y){
 const w=sim.world,i=w.idx(x,y),climate=sim.climate||{temp:w.temperature[i],rain:0};
 const rain=regionalRainfall(w,{...climate,frontDay:sim.day},i),temperature=sim.climate?localTemperature(w,climate,i):w.temperature[i];
 const wind=planetaryWindAt(w,sim.day,i),snowShare=snowFraction(temperature),precipitation=clamp((rain-.3)/.65);
 const saturation=clamp((w.moisture[i]-.55)/.4),cooling=clamp((.65-temperature)/.4);
 const fog=saturation*cooling*(1-clamp(wind?.strength||0)*.55);
 const snow=precipitation*snowShare,liquid=precipitation*(1-snowShare);
 return{rain,temperature,wind,fog,snow,liquid,extinction:fog*.12+liquid*.045+snow*.085};
}
export function atmosphericSight(sim,observer,target,range){
 const distance=Math.hypot(target.x-observer.x,target.y-observer.y);
 if(!Number.isFinite(distance)||!Number.isFinite(range)||range<0)throw Error('Invalid atmospheric sight query.');
 let opticalDepth=0;
 if(sim.visibilityRules===VISIBILITY.policy&&!observer.underground&&!(observer.diveDepth>.03)){
  const samples=Math.min(8,Math.max(1,Math.ceil(distance/4)));
  for(let k=0;k<samples;k++){const t=(k+.5)/samples;opticalDepth+=atmosphereAt(sim,observer.x+(target.x-observer.x)*t,observer.y+(target.y-observer.y)*t).extinction*distance/samples}
 }
 const transmission=Math.exp(-opticalDepth),effectiveRange=range*transmission;
 return{detected:distance<=effectiveRange,distance,opticalDepth,transmission,effectiveRange};
}
const validBackup=id=>typeof id==='string'&&/^world-[A-Za-z0-9-]{8,72}$/.test(id);
export function validateVisibilityRules(core,timeline=core.tickCount){
 if(core.visibilityRules!==undefined&&core.visibilityRules!==VISIBILITY.policy)throw Error('Unknown atmospheric visibility rules.');
 const h=core.visibilityRuleMigrations;if(h===undefined)return;if(!Array.isArray(h))throw Error('Invalid visibility migration history.');
 const seen=new Set();let previous=null;for(const r of h){if(r?.schema!==1||!validBackup(r.backupSlot)||typeof r.source!=='string'||!r.source.trim()||r.source.length>512||!Number.isSafeInteger(r.tick)||r.tick<0||r.tick>core.tickCount||r.tick>timeline||![null,VISIBILITY.policy].includes(r.from)||r.to!==VISIBILITY.policy||seen.has(r.backupSlot)||previous&&(r.tick<previous.tick||r.from!==previous.to))throw Error('Invalid visibility migration history.');seen.add(r.backupSlot);previous=r}
 if(h.length&&core.visibilityRules!==VISIBILITY.policy)throw Error('Visibility rules contradict migration history.');
}
export function restoreVisibilityRules(sim,core){
 if(core.visibilityRules===undefined)delete sim.visibilityRules;if(!Object.hasOwn(core,'visibilityRuleMigrations'))delete sim.visibilityRuleMigrations;validateVisibilityRules(sim);
 for(const s of sim.planetaryTravel?.sessions||[]){validateVisibilityRules(s.snapshot.core,sim.tickCount);if(s.snapshot.core.visibilityRules!==sim.visibilityRules||JSON.stringify(s.snapshot.core.visibilityRuleMigrations||[])!==JSON.stringify(sim.visibilityRuleMigrations||[]))throw Error('Inconsistent regional atmospheric visibility rules.');}
}
export function adoptVisibilityRules(sim,{source,backupSlot}={}){
 if(typeof source!=='string'||!source.trim()||source.length>512||!validBackup(backupSlot))throw Error('Visibility adoption requires a source and backup.');
 restoreVisibilityRules(sim,sim);const sessions=sim.planetaryTravel?.sessions||[];
 for(const s of sessions)if(s.biologicalMode!=='canonical-ticks/1'||s.snapshot.core.tickCount!==sim.tickCount)throw Error('Finish canonical regional catchup before visibility adoption.');
 const cores=[sim,...sessions.map(s=>s.snapshot.core)],record={schema:1,source:source.trim(),backupSlot,tick:sim.tickCount,from:sim.visibilityRules??null,to:VISIBILITY.policy};
 const plans=cores.map(core=>{const history=[...(core.visibilityRuleMigrations||[]),structuredClone(record)];validateVisibilityRules({...core,visibilityRules:VISIBILITY.policy,visibilityRuleMigrations:history});return{core,history,rule:core.visibilityRules,ruleOwn:Object.hasOwn(core,'visibilityRules'),prior:core.visibilityRuleMigrations,priorOwn:Object.hasOwn(core,'visibilityRuleMigrations')}});
 for(const p of plans){p.core.visibilityRules=VISIBILITY.policy;p.core.visibilityRuleMigrations=p.history}
 return{record,rollback(){for(const p of plans){if(p.ruleOwn)p.core.visibilityRules=p.rule;else delete p.core.visibilityRules;if(p.priorOwn)p.core.visibilityRuleMigrations=p.prior;else delete p.core.visibilityRuleMigrations}}};
}
