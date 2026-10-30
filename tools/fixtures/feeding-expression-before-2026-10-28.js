// Frozen pre-change presentation for explicit private-input comparison only.
// Source: a299395e:src/render/feeding-expression.js; simulation is never replaced.
// Receipt-driven body language. No extraction, costs or simulation intent change.
import {CFG,PLANTS} from '../../src/sim/config.js';
import {mouthOf} from '../../src/ecology/functional-diet.js';
import {FRESHWATER_FOOD} from '../../src/ecology/freshwater-food.js';
import {PARTS} from '../../src/lineage/part-registry.js';
// Legacy plant meals publish successful actor/gain-stamped player actions.
// Observe that existing record; preserve richer same-tick tissue receipts.
export function feedingReceipt(sim,a){const plant=a?.lastPlantMeal,wet=a?.lastFreshwaterMeal,last=sim?.lastPlayerAction;const p=plant?.actorId===a?.id&&plant.removed>0&&plant.edible>0?plant:null,w=wet?.amount>0?wet:null,manual=a?.player&&last?.actorId===a.id&&['eat','drink'].includes(last.type)&&(FRESHWATER_FOOD[last.kind]||last.type==='eat'&&PLANTS[last.kind])&&(last.energyGain>0||last.waterGain>0)?last:null;if(manual&&(!p||manual.tick>p.tick||manual.tick===p.tick&&!PLANTS[manual.kind])&&(!w||manual.tick>=w.tick))return w?.tick===manual.tick&&w.kind===manual.kind?w:manual;return w&&(!p||w.tick>p.tick)?w:p}
export function feedingExpression(sim,a,{moving=false,phase=0,elapsedSeconds=null}={}){
 const r=feedingReceipt(sim,a),plantMeal=!!(r?.removed||r?.type==='eat'&&PLANTS[r.kind]),age=(sim?.tickCount??0)-(r?.tick??-Infinity),duration=plantMeal?1.05+Math.min(.9,r.processingCost||0):.9;
 if(!r||age<0||age>=CFG.simHz*duration||moving||a.bracing||a.attackAction||a.courtshipPerformance||!['idle','player','rest','feed','explore','herd-browse','forage','stealth-forage','tendency-forage'].includes(a.intent))return null;
 const elapsed=Number.isFinite(elapsedSeconds)?Math.max(0,elapsedSeconds):age/CFG.simHz;if(elapsed>=duration)return null;
 const caps=PARTS[mouthOf(a)]?.actionCapabilities||[],mode=!plantMeal?'filter':r.tissue==='kernel'?'crush':r.processingCost>0?(caps.includes('crush')?'crush':caps.includes('peck')?'peck':'pull'):'graze',progress=elapsed/duration;
 // One actual meal: reach toward it, process with the mounted mouth, then settle.
 // The waveform follows receipt age, never the animal's arbitrary idle phase.
 const contact=Math.sin(Math.PI*Math.min(1,progress/.32)),work=Math.max(0,Math.min(1,(progress-.12)/.18))*Math.max(0,Math.min(1,(.86-progress)/.18)),beat=(1-Math.cos(elapsed*Math.PI*2*(mode==='peck'?3.6:2.7)))/2,strength=Math.min(1,(1-progress)/.22);
 const pose={mode,stage:progress<.22?'reach':progress<.78?'process':'settle',strength,progress,seedFate:r.viableSeeds>0?'carried':r.destroyedSeeds>0?'crushed':'none',mouthPulse:(.25+beat)*work,headReach:contact*1.05-.3*work*beat,headDrop:(.45+beat*.35)*strength,bodyDrop:.35*strength,feelerForward:1-.28*work};
 if(mode==='peck')Object.assign(pose,{headReach:contact*1.15+.45*Math.pow(beat,3)*work,headDrop:(.25+Math.pow(beat,3)*2.3)*work,bodyLean:.45*beat*work,stanceSpread:.3*strength,mouthPulse:.65*beat*work});
 else if(mode==='crush')Object.assign(pose,{headDrop:(.6+beat*.6)*work,compress:.35*beat*work,stanceSpread:.75*strength,bodyLean:-.4*beat*work,mouthPulse:1.8*Math.pow(beat,2)*work,eyeNarrow:work>.4});
 else if(mode==='pull')Object.assign(pose,{headReach:contact*.9-.55*beat*work,headDrop:(1.1-beat*.7)*work,bodyLean:-1.05*beat*work,stanceSpread:.6*strength,compress:-.15*beat*work});
 else if(mode==='filter')Object.assign(pose,{headReach:.45*contact,headDrop:.6*strength,mouthPulse:.65*work,bodyDrop:.15*strength});
 if(Number.isInteger(r.i)&&sim?.world){pose.attention={x:r.i%sim.world.n+.5,y:(r.i/sim.world.n|0)+.5}}
 return pose;
}
// Per-renderer transient timing; actor and receipt remain immutable. Pausing uses
// the same presentation clock as courtship and breathing. World replacement resets it.
export class FeedingPresentation{
 constructor(){this.entries=new WeakMap()}
 reset(){this.entries=new WeakMap()}
 sample(sim,a,timeSeconds,options={}){const r=feedingReceipt(sim,a);if(!r)return null;let e=this.entries.get(a);if(!e||e.receipt!==r){e={receipt:r,started:timeSeconds,initialAge:Math.max(0,(sim.tickCount-r.tick)/CFG.simHz),interrupted:false,active:false};this.entries.set(a,e)}if((options.moving&&e.active)||a.bracing||a.attackAction||a.courtshipPerformance)e.interrupted=true;if(e.interrupted||options.moving)return null;const pose=feedingExpression(sim,a,{...options,elapsedSeconds:e.initialAge+Math.max(0,timeSeconds-e.started)});if(pose)e.active=true;return pose}
}
export function applyFeedingExpression(behavior,pose){if(!pose)return behavior;for(const key of ['headDrop','headReach','bodyDrop','bodyLean','stanceSpread','compress'])if(pose[key]!==undefined)behavior[key]=(behavior[key]||0)+pose[key];behavior.mouthPulse=Math.max(behavior.mouthPulse||0,pose.mouthPulse);behavior.feedingMouthOpen=pose.stage==='process'&&pose.mouthPulse>.45?1:0;behavior.feelerForward=pose.feelerForward;if(pose.eyeNarrow)behavior.eyeNarrow=true;return behavior}
