import {CFG} from '../sim/config.js';
import {LEGACY_DAY_TICKS,dayTicksFor} from '../sim/day-clock.js';
import {coordNoise} from '../core/rng.js';
import {regionalRainfall,planetaryWindAt} from '../world/weather-fronts.js';
import {localTemperature} from '../world/environment.js';
import {undergroundRoof} from '../lineage/burrowing.js';
import {sensoryProfile} from './sensory-world.js';
import {stratumHearing} from './stratum-senses.js';
import {creatureView,viewCanSee} from './atmospheric-visibility.js';
import {SPECIES} from '../organisms/species.js';
export const THUNDERSTORMS=Object.freeze({policy:'convective-thunderstorms/1',interval:16,radius:1.35,history:16,soundSpeed:20});
export function thunderstormInterval(sim){const ticks=dayTicksFor(sim);return Math.round(THUNDERSTORMS.interval*(ticks/LEGACY_DAY_TICKS));}
const clamp=x=>Math.max(0,Math.min(1,x));
export const createThunderstorms=()=>({schema:1,lastTick:0,serial:0,strikes:0,hits:0,events:[]});
export function thunderstormAt(sim,i){
 if(sim.thunderRules!==THUNDERSTORMS.policy||!sim.climate)return{intensity:0};
 const w=sim.world,rain=regionalRainfall(w,{...sim.climate,frontDay:sim.day},i),temperature=localTemperature(w,sim.climate,i),wind=planetaryWindAt(w,sim.day,i);
 return{intensity:clamp((rain-.62)/.75)*clamp((temperature-.35)/.3)*(.5+.5*clamp(wind?.strength||0)),rain,temperature};
}
export function stormExposure(sim,a,x=a.x,y=a.y){
 const probe=Object.assign(Object.create(a),{x,y}),w=sim.world;if(undergroundRoof(w,probe))return 0;
 const i=w.idx(x,y),shelter=sim.shelter?.nearest?.(probe,{radius:1.6,familyOnly:false}),quality=shelter?clamp(sim.shelter.weatherQuality?.(shelter)??shelter.integrity/100):0;
 return(1+clamp(w.terrain?.elevation[i]||0)*.35+clamp((w.plants?.woodspire?.[i]||0)/3)*.5)*(1-quality*.6);
}
export function lightningProposal(sim,tick=sim.tickCount){
 const interval=thunderstormInterval(sim);
 if(sim.thunderRules!==THUNDERSTORMS.policy||!sim.climate||tick%interval)return null;
 const w=sim.world,slot=Math.floor(tick/interval),ox=w.regionOrigin?.x||0,oy=w.regionOrigin?.y||0,seed=w.seedHash^0x7468756e;
 let best=null,score=-1;
 for(let k=0;k<16;k++){
  const x=2+Math.floor(coordNoise(seed,slot*17+k,ox)*(w.n-4)),y=2+Math.floor(coordNoise(seed^719,slot*19+k,oy)*(w.n-4)),i=w.idx(x,y);
  if(!w.isPlayable(x+.5,y+.5))continue;
  const intensity=thunderstormAt(sim,i).intensity,value=intensity*(.5+.35*clamp(w.terrain?.elevation[i]||0)+.15*clamp((w.plants?.woodspire?.[i]||0)/3));
  if(value>score){score=value;best={i,tick,intensity}}
 }
 return best&&best.intensity>0&&coordNoise(seed^0x7374,slot,ox^oy)<best.intensity*.35?best:null;
}
export function advanceThunderstorms(sim){
 const state=sim.thunderstorms;if(sim.thunderRules!==THUNDERSTORMS.policy||!state||sim.tickCount<=state.lastTick)return null;
 state.lastTick=sim.tickCount;const proposal=lightningProposal(sim);if(!proposal)return null;
 const w=sim.world,event={...proposal,id:++state.serial,hits:0},x=event.i%w.n+.5,y=(event.i/w.n|0)+.5;
 state.strikes++;state.events.push(event);if(state.events.length>THUNDERSTORMS.history)state.events.shift();
 for(const a of sim.animals){if(!a.alive)continue;const distance=Math.hypot(a.x-x,a.y-y);if(distance>=THUNDERSTORMS.radius)continue;
  const exposure=stormExposure(sim,a);if(!exposure)continue;
  const damage=Math.min(a.health,36*event.intensity*(1-distance/THUNDERSTORMS.radius)**.75*exposure);if(!(damage>0))continue;
  a.health-=damage;a.lastLightningIncident={tick:sim.tickCount,damage};event.hits++;state.hits++;
  if(a.player){a.hidden=false;sim.lastPlayerDamage={tick:sim.tickCount,amount:damage,source:'lightning',attackerId:null};sim.playerCombat?.queue({ok:false,type:'lightning-hit',message:'Lightning struck nearby. Seek less exposed ground.'})}
  if(a.health<=0)sim.kill(a,'lightning');else sim.injury?.onDamage(a,{damage,cause:'a lightning strike'});
 }
 return event;
}
export function stormRefugeDecision(sim,a){
 if(!a?.alive||a.player&&!sim.playerAutonomy||a.underground||a.airborne||a.perched||a.torpor||a.caveTransit||a.burrowWork||(a.diveDepth||0)>.03)return null;
 const spec=SPECIES[a.species];if(!spec||a.energy/spec.maxEnergy<.3||a.hydration/spec.maxHydration<.35||sim.family?.isDependent?.(a)||sim.family?.livingChildren?.(a,{dependentOnly:true})?.length)return null;
 if(thunderstormAt(sim,sim.world.idx(a.x,a.y)).intensity<.4)return null;
 const current=stormExposure(sim,a),view=creatureView(sim,a),radius=Math.min(5,view.range),options=[];
 for(let dy=-4;dy<=4;dy+=2)for(let dx=-4;dx<=4;dx+=2){const distance=Math.hypot(dx,dy),x=a.x+dx,y=a.y+dy;if(!distance||distance>radius||!sim.world.isPlayable(x,y)||sim.world.water[sim.world.idx(x,y)]||!viewCanSee(view,x,y)||!sim.canOccupy(a,x,y))continue;
  const relief=current-stormExposure(sim,a,x,y)-distance*.02;if(relief>.05)options.push({x,y,relief,stormRefuge:true});
 }
 options.sort((a,b)=>b.relief-a.relief);for(const p of options.slice(0,3))if(sim.canReach(a,p.x,p.y))return{intent:'storm-refuge',target:p};
 if(a.target?.stormRefuge&&Math.hypot(a.x-a.target.x,a.y-a.target.y)<.65)return{intent:'storm-rest',target:{x:a.x,y:a.y,stormRefuge:true}};
 return null;
}
export function audibleThunder(sim,animal,event){
 if(!animal||sim.thunderRules!==THUNDERSTORMS.policy)return null;const x=event.i%sim.world.n+.5,y=(event.i/sim.world.n|0)+.5,d=Math.hypot(animal.x-x,animal.y-y),age=(sim.tickCount-event.tick)/CFG.simHz,radius=sensoryProfile(animal).hearing*4;
 if(age<d/THUNDERSTORMS.soundSpeed||age>8||!stratumHearing(sim,animal,{x,y,underground:false},radius))return null;
 return{volume:.25+.75*Math.max(0,1-d/radius)};
}
export function validateThunderstorms(core,n,timeline=core.tickCount){
 if(core.thunderRules===undefined){if(core.thunderstorms!==undefined)throw Error('Thunderstorm state requires its saved rules.');return}
 const s=core.thunderstorms,interval=thunderstormInterval(core);if(core.thunderRules!==THUNDERSTORMS.policy||s?.schema!==1||!['lastTick','serial','strikes','hits'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)||s.lastTick>core.tickCount||s.lastTick>timeline||s.serial!==s.strikes||!Array.isArray(s.events)||s.events.length>THUNDERSTORMS.history)throw Error('Invalid thunderstorm policy or clock.');
 if(s.events.length!==Math.min(s.strikes,THUNDERSTORMS.history))throw Error('Invalid lightning history length.');
 let prior=0,priorTick=-1;for(const e of s.events){if(!Number.isSafeInteger(e.id)||e.id<=prior||e.id>s.serial||!Number.isSafeInteger(e.tick)||e.tick<=priorTick||e.tick>s.lastTick||e.tick%interval||!Number.isSafeInteger(e.i)||e.i<0||e.i>=n*n||!Number.isFinite(e.intensity)||e.intensity<=0||e.intensity>1||!Number.isSafeInteger(e.hits)||e.hits<0||e.hits>s.hits)throw Error('Invalid saved lightning event.');prior=e.id;priorTick=e.tick}
 if(s.events.length&&s.events.at(-1).id!==s.serial)throw Error('Incomplete lightning history.');
}
export function restoreThunderstorms(sim,core){
 validateThunderstorms(core,sim.world.n);if(core.thunderRules===undefined){delete sim.thunderRules;delete sim.thunderstorms}
 validateThunderstorms(sim,sim.world.n);for(const s of sim.planetaryTravel?.sessions||[]){validateThunderstorms(s.snapshot.core,sim.world.n,sim.tickCount);if(s.snapshot.core.thunderRules!==sim.thunderRules)throw Error('Inconsistent regional thunderstorm rules.')}
}
