import {CFG} from '../sim/config.js';
import {SPECIES} from '../organisms/species.js';
import {bodyMass} from '../organisms/body-mass.js';
import {huntingAbility} from '../ecology/functional-diet.js';
import {planPartCounts} from '../lineage/part-abilities.js';
import {submerged} from '../lineage/diving.js';

// Threat display (creator direction 2026-10-23: anatomy should change what you can do,
// not only numbers; Biological Capability Expansion, Wave B "Threat display": real risk
// assessment and possible retreat, never guaranteed intimidation).
// A body with flare-capable anatomy (frills, crests, display wings and tails) can stand its
// ground and spread them. Each Stalker engaged with the creature that can see it appraises
// the display once: the size the display makes the body look against its own, the body's
// real bite (the same attack ability that drives bite-back) and the wounds it has already
// taken, against a resolve set by its inherited boldness, its hunger and how often this
// creature's display has already turned it away (it gets used to a bluff). If the display
// outweighs that resolve it breaks off; otherwise it presses on and the display was paid
// for with breath, a standing pause and exposure. Deterministic: no RNG is consumed.
// Only the controlled creature uses it (player-facing encounter authority); wild bodies
// with the same anatomy do not display yet.
export const THREAT_DISPLAY=Object.freeze({policy:'threat-display/1',seconds:2.4,cooldown:6,breath:18,energy:.5,
 standRadius:.35,maxSpread:.5,resolve:1,hunger:.75,biteWeight:.35,woundWeight:.12,habituation:.35,aversion:8});
// How much each part enlarges the outline when spread (fraction of body size).
export const DISPLAY_SPREAD=Object.freeze({'display-frill':.25,'flight-wing':.25,'heat-frill':.2,'horn-crest':.2,'signal-crest':.15,
 'proto-wing':.15,'flag-tail':.12,'luminous-tail':.1,'silt-fin':.1,'display-eye':.05});

export function displaySpread(a){
 const c=planPartCounts(a);let s=0;for(const [id,v] of Object.entries(DISPLAY_SPREAD))s+=(c[id]||0)*v;
 return Math.min(THREAT_DISPLAY.maxSpread,s);
}
export function displayAnatomy(a){return displaySpread(a)>0}
export function displayActive(sim,a){
 const d=a?.threatDisplay;return !!d&&sim.tickCount<=d.untilTick&&Math.hypot(a.x-d.x,a.y-d.y)<=THREAT_DISPLAY.standRadius;
}
export function displayStatus(sim,a=sim.player()){
 if(!a?.alive)return{enabled:false,reason:'No active creature.'};
 if(!displayAnatomy(a))return{enabled:false,reason:'Needs a frill, crest or other display anatomy.'};
 if(sim.paused)return{enabled:false,reason:'Resume the world first.'};
 if(a.underground||a.burrowWork||a.caveTransit||a.airborne||a.perched||submerged(a))return{enabled:false,reason:'Stand on open ground to display.'};
 if(displayActive(sim,a))return{enabled:false,reason:'Displaying: hold your ground.'};
 if((a.threatDisplayReadyTick||0)>sim.tickCount)return{enabled:false,reason:'Your display is recovering.'};
 if(a.exertionWinded||(a.exertion??CFG.exertion.max)<THREAT_DISPLAY.breath)return{enabled:false,reason:'Need more breath to display.'};
 return{enabled:true,reason:`Spread your display (outline +${Math.round(displaySpread(a)*100)}%). Hunters that see it judge whether you are worth the risk. Moving ends it.`};
}
export function startDisplay(sim){
 const a=sim.player(),status=displayStatus(sim,a);if(!status.enabled)return{ok:false,type:'display',message:status.reason};
 const D=THREAT_DISPLAY,hz=CFG.simHz;sim.exertion.spend(a,D.breath);a.energy=Math.max(0,a.energy-D.energy);
 a.bracing=false;if(a.hidden)a.hidden=false;
 a.threatDisplay={id:sim.tickCount,x:a.x,y:a.y,untilTick:sim.tickCount+Math.round(hz*D.seconds),spread:displaySpread(a)};
 a.threatDisplayReadyTick=sim.tickCount+Math.round(hz*D.cooldown);a.noisyUntilTick=a.threatDisplay.untilTick;
 sim.lastPlayerAction={type:'display',tick:sim.tickCount};
 return{ok:true,type:'display',message:'Threat display: hold still while hunters judge you.'};
}
// The hunter's appraisal of a display. Pure: reads state, writes nothing.
export function appraiseDisplay(hunter,prey,{wounds=0,habituated=0}={}){
 const D=THREAT_DISPLAY,spread=prey.threatDisplay?.spread??displaySpread(prey);
 const ratio=bodyMass(prey)*(1+spread)/Math.max(.001,bodyMass(hunter)),bite=huntingAbility(prey)*D.biteWeight,hurt=wounds*D.woundWeight;
 const s=SPECIES[hunter.species],fed=s?Math.max(0,Math.min(1,hunter.energy/s.maxEnergy)):1,bold=Math.max(.6,Math.min(1.5,hunter.genes?.temperament??1));
 const score=ratio+bite+hurt,resolve=D.resolve*bold*(D.hunger+D.hunger*(1-fed))*(1+D.habituation*habituated);
 // The strongest reason, for feedback: what the hunter weighed most.
 const reason=score>=resolve?(hurt>=bite&&hurt>=ratio-1&&hurt>0?'wounds':bite>ratio-1&&bite>0?'bite':'size'):(habituated>0&&score>=resolve/(1+D.habituation*habituated)?'used':fed<.35?'hungry':bold>1.15?'bold':ratio<1?'bigger':'unconvinced');
 return{deterred:score>=resolve,score,resolve,ratio,bite,wounds:hurt,fed,bold,habituated,reason};
}
// Called by the encounter authority for an engaged hunter that can see the creature.
// Returns the appraisal when this display is judged for the first time, else null.
export function judgeDisplay(sim,hunter,prey,state){
 if(!displayActive(sim,prey)||state.displayJudged===prey.threatDisplay.id)return null;
 state.displayJudged=prey.threatDisplay.id;
 const seen=hunter.displayHabit?.targetId===prey.id?hunter.displayHabit.count:0,verdict=appraiseDisplay(hunter,prey,{wounds:state.wounds||0,habituated:seen});
 if(verdict.deterred)hunter.displayHabit={targetId:prey.id,count:seen+1};
 // Several hunters can judge in the same moment: keep the few most recent for feedback.
 sim.lastThreatDisplayVerdict={tick:sim.tickCount,hunterId:hunter.id,species:hunter.species,targetId:prey.id,...verdict};
 sim.threatDisplayVerdicts=[...(sim.threatDisplayVerdicts||[]).filter(v=>sim.tickCount-v.tick<CFG.simHz*4),sim.lastThreatDisplayVerdict].slice(-4);
 return verdict;
}
const LABEL=s=>(SPECIES[s]?.label||s).toLowerCase();
// Plain words for a verdict, shown to the player.
export function verdictText(v){
 const who='The '+LABEL(v.species);
 if(v.deterred)return who+({wounds:' has been hurt enough: it backs off from your display.',bite:' saw your display and your bite, and backs off.',size:' sees a bigger creature than it hoped for, and backs off.'}[v.reason]||' backs off.');
 return who+({used:' has seen your display before and keeps coming.',hungry:' is too hungry to be bluffed: it keeps coming.',bold:' is bold and keeps coming.',bigger:' is still bigger than you look: it keeps coming.',unconvinced:' is not convinced: it keeps coming.'}[v.reason]||' keeps coming.');
}
