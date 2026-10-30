import {thermalSiteDemand} from '../ecology/thermal-refuge.js';
import {mammalianHeat} from '../ecology/mammalian-care.js';

const clamp=v=>Math.max(0,Math.min(1,v));
const unsupported=a=>a.underground||a.perched||a.airborne||a.climb||a.caveTransit||a.burrowWork||(a.diveDepth||0)>.03;
const quiet=new Set(['idle','move','rest','social','guard','listen','scan','forage']);
// Surface-only read of the existing physiology query. Never call exposure.snapshot:
// that accessor can create weather-controller state. No thermal cost is charged here.
export function thermalExpressionSignal(sim,a){
 if(!a?.alive||!a.bodyPlan||!a.genes||!sim?.world?.temperature||unsupported(a))return null;
 const demand=thermalSiteDemand(sim,a),comfort=.55*a.genes.climate;
 if(!Number.isFinite(demand.thermal)||!Number.isFinite(demand.temperature)||!Number.isFinite(comfort))return null;
 // This ramp scales artwork only; it is not a distress or refuge decision.
 // Exclude baseline core upkeep: paying for a core is not itself thermal stress.
 const intensity=clamp((demand.thermal-.015)/.065);
 if(!intensity)return null;
 return{kind:demand.temperature<comfort?'cold':'heat',intensity,thermal:demand.thermal,temperature:demand.temperature,thermogenic:mammalianHeat(a)};
}

export class ThermalPresentation{
 constructor(){this.reset()}
 reset(){this.entries=new WeakMap();this.world=null;this.tick=-1}
 sample(sim,a,time=0,{action='idle',moving=false,blocked=false}={}){
  if(this.world!==sim.world||sim.tickCount<this.tick){this.reset();this.world=sim.world}this.tick=sim.tickCount;
  // Threats, actual meals, work and dormancy retain the whole active pose.
  if(!a?.alive||unsupported(a)||blocked||a.torpor||a.bracing||a.attackAction||a.courtshipPerformance||!quiet.has(action))return null;
  let e=this.entries.get(a);
  if(!e||e.tick!==sim.tickCount||e.plan!==a.bodyPlan||e.x!==a.x||e.y!==a.y){e={tick:sim.tickCount,plan:a.bodyPlan,x:a.x,y:a.y,signal:thermalExpressionSignal(sim,a)};this.entries.set(a,e)}
  const signal=e.signal;if(!signal)return null;
  const raw=signal.intensity*(moving?.35:1),k=a.player?raw:Math.round(raw*16)/16,phase=Math.max(0,time)+a.id*.731;
  // Posture rides above the support skeleton. Never alter stride, foot spread,
  // movement speed, world position, limb reach or the eight-direction convention.
  const rawShiver=signal.kind==='cold'&&signal.thermogenic&&!moving?Math.sin(phase*Math.PI*2*7.2)*.22*k:0;
  const shiver=a.player?rawShiver:Math.round(rawShiver*32)/32;
  return{...signal,bodyDrop:(signal.kind==='cold'?.65:.4)*k,headDrop:(signal.kind==='cold'?.45:.25)*k,bodyLean:-.2*k,bodySway:shiver,feelerPin:(signal.kind==='cold'?.35:.12)*k,eyeNarrow:k>.55,cacheToken:signal.kind+':'+Math.round(k*16)+':'+Math.round(shiver*32)};
 }
}

export function applyThermalExpression(behavior,pose){
 if(!pose)return behavior;
 for(const key of ['bodyDrop','headDrop','bodyLean','bodySway','feelerPin'])behavior[key]=(behavior[key]||0)+pose[key];
 if(pose.eyeNarrow)behavior.eyeNarrow=true;
 return behavior;
}
