// Receipt-driven body language. No extraction, costs or simulation intent change.
import {CFG,PLANTS} from '../sim/config.js';
import {mouthOf} from '../ecology/functional-diet.js';
import {FRESHWATER_FOOD} from '../ecology/freshwater-food.js';
import {PARTS} from '../lineage/part-registry.js';
// Legacy plant meals publish successful actor/gain-stamped player actions.
// Observe that existing record; preserve richer same-tick tissue receipts.
const successfulMeal=r=>r&&Number.isSafeInteger(r.tick)&&(r.energyGain>0||r.waterGain>0);
const knownFood=kind=>!!PLANTS[kind]||!!FRESHWATER_FOOD[kind]||kind==='carrion';
const feedingInterrupted=a=>a.bracing||a.attackAction||a.courtshipPerformance||a.airborne||a.climb||a.caveTransit||a.burrowWork||a.torpor;
export function feedingReceipt(sim,a){
 const plant=a?.lastPlantMeal,wet=a?.lastFreshwaterMeal,last=sim?.lastPlayerAction;
 const p=plant?.actorId===a?.id&&plant.removed>0&&plant.edible>0?plant:null,w=wet?.amount>0?wet:null;
 // Read the existing actor-owned record without calling state(), which would
 // create controller state during drawing. No synthetic receipt is returned.
 const recorded=sim?.foraging?.states?.get(a?.id)?.lastMeal;
 const owned=successfulMeal(recorded)&&knownFood(recorded.kind)?recorded:null;
 const manual=a?.player&&last?.actorId===a.id&&['eat','drink','canopy-feed'].includes(last.type)&&knownFood(last.kind)&&(last.type!=='drink'||!!FRESHWATER_FOOD[last.kind])&&successfulMeal(last)?last:null;
 let result=w&&(!p||w.tick>p.tick)?w:p;
 for(const candidate of [owned,manual]){
  if(!candidate)continue;
  if(!result||candidate.tick>result.tick||candidate.tick===result.tick&&!PLANTS[candidate.kind]&&candidate.kind!==result.kind)result=candidate;
 }
 return result;
}

export function feedingMode(a,r){
 const caps=PARTS[mouthOf(a)]?.actionCapabilities||[];
 if(caps.includes('suck'))return'suck';
 if(caps.includes('filter')&&(FRESHWATER_FOOD[r.kind]||!r.removed&&!PLANTS[r.kind]))return'filter';
 if(r.kind==='carrion')return caps.includes('swallow')?'swallow':caps.includes('tear')?'tear':'pull';
 if((r.tissue==='kernel'||r.processingCost>0)&&caps.includes('crush'))return'crush';
 if(caps.includes('peck'))return'peck';
 if(caps.includes('nibble'))return'nibble';
 if(r.processingCost>0)return'pull';
 return'graze';
}
export function feedingExpression(sim,a,{moving=false,phase=0,elapsedSeconds=null}={}){
 const r=feedingReceipt(sim,a),plantMeal=!!(r?.removed||PLANTS[r?.kind]),age=(sim?.tickCount??0)-(r?.tick??-Infinity),duration=plantMeal?1.05+Math.min(.9,r.processingCost||0):.9;
 if(!r||age<0||age>=CFG.simHz*duration||moving||feedingInterrupted(a)||!['idle','player','rest','feed','explore','herd-browse','forage','stealth-forage','tendency-forage'].includes(a.intent))return null;
 const elapsed=Number.isFinite(elapsedSeconds)?Math.max(0,elapsedSeconds):age/CFG.simHz;if(elapsed>=duration)return null;
 const mode=feedingMode(a,r),progress=elapsed/duration;
 // One actual meal: reach toward it, process with the mounted mouth, then settle.
 // The waveform follows receipt age, never the animal's arbitrary idle phase.
 const contact=Math.sin(Math.PI*Math.min(1,progress/.32)),work=Math.max(0,Math.min(1,(progress-.12)/.18))*Math.max(0,Math.min(1,(.86-progress)/.18)),beat=(1-Math.cos(elapsed*Math.PI*2*(mode==='nibble'?5.2:mode==='peck'?3.6:mode==='tear'?2.1:mode==='suck'?2:2.7)))/2,strength=Math.min(1,(1-progress)/.22);
 const pose={mode,stage:progress<.22?'reach':progress<.78?'process':'settle',strength,progress,seedFate:r.viableSeeds>0?'carried':r.destroyedSeeds>0?'crushed':'none',mouthPulse:(.25+beat)*work,headReach:contact*1.05-.3*work*beat,headDrop:(.45+beat*.35)*strength,bodyDrop:.35*strength,feelerForward:1-.28*work};
 if(mode==='peck')Object.assign(pose,{headReach:contact*1.15+.45*Math.pow(beat,3)*work,headDrop:(.25+Math.pow(beat,3)*2.3)*work,bodyLean:.45*beat*work,stanceSpread:.3*strength,mouthPulse:.65*beat*work});
 else if(mode==='crush')Object.assign(pose,{headDrop:(.6+beat*.6)*work,compress:.35*beat*work,stanceSpread:.75*strength,bodyLean:-.4*beat*work,mouthPulse:1.8*Math.pow(beat,2)*work,eyeNarrow:work>.4});
 else if(mode==='pull')Object.assign(pose,{headReach:contact*.9-.55*beat*work,headDrop:(1.1-beat*.7)*work,bodyLean:-1.05*beat*work,stanceSpread:.6*strength,compress:-.15*beat*work});
 else if(mode==='filter')Object.assign(pose,{headReach:.45*contact,headDrop:.6*strength,mouthPulse:.65*work,bodyDrop:.15*strength});
 else if(mode==='nibble')Object.assign(pose,{headReach:.55*contact-.12*beat*work,headDrop:(.35+.16*beat)*strength,bodyDrop:.12*strength,mouthPulse:.95*beat*work});
 else if(mode==='tear')Object.assign(pose,{headReach:.9*contact-.95*beat*beat*work,headDrop:.55*strength,bodyLean:-.8*beat*beat*work,stanceSpread:.8*strength,headTurn:Math.sin(elapsed*Math.PI*3)*.09*work,mouthPulse:1.1*beat*work});
 else if(mode==='suck')Object.assign(pose,{headReach:.75*contact+.18*beat*work,headDrop:.35*strength,bodyDrop:.12*strength,mouthPulse:.55+.4*beat*work});
 else if(mode==='swallow')Object.assign(pose,{headReach:.6*contact-.35*beat*work,headDrop:-.35*beat*work,bodyLean:-.25*beat*work,mouthPulse:1.4*beat*work});
 // Small directional oral deformation complements the actual native open/closed
 // artwork. Fixed-shape parts retain their own silhouette in drawPart.
 pose.mouthShape=mode==='suck'?{forward:1+.11*beat*work,width:1-.10*beat*work}:mode==='nibble'?{forward:1+.025*beat*work,width:1-.08*beat*work}:mode==='filter'?{forward:1,width:1+.06*work}:mode==='tear'?{forward:1+.04*work,width:1+.08*beat*work}:{forward:1+.05*beat*work,width:1};

 if(Number.isInteger(r.i)&&sim?.world){pose.attention={x:r.i%sim.world.n+.5,y:(r.i/sim.world.n|0)+.5}}
 return pose;
}
// Per-renderer transient timing; actor and receipt remain immutable. Pausing uses
// the same presentation clock as courtship and breathing. World replacement resets it.
export class FeedingPresentation{
 constructor(){this.entries=new WeakMap();this.world=null}
 reset(){this.entries=new WeakMap()}
 sample(sim,a,timeSeconds,options={}){if(this.world!==sim.world){this.reset();this.world=sim.world;}const r=feedingReceipt(sim,a);if(!r)return null;let e=this.entries.get(a);if(!e||e.receipt!==r){e={receipt:r,started:timeSeconds,initialAge:Math.max(0,(sim.tickCount-r.tick)/CFG.simHz),interrupted:false,active:false,anatomy:a.bodyPlan?.id};this.entries.set(a,e)}if(e.anatomy!==a.bodyPlan?.id)e.interrupted=true;if((options.moving&&e.active)||feedingInterrupted(a))e.interrupted=true;if(e.interrupted||options.moving)return null;const pose=feedingExpression(sim,a,{...options,elapsedSeconds:e.initialAge+Math.max(0,timeSeconds-e.started)});if(pose)e.active=true;return pose}
}
export function applyFeedingExpression(behavior,pose){if(!pose)return behavior;for(const key of ['headDrop','headReach','headTurn','bodyDrop','bodyLean','stanceSpread','compress'])if(pose[key]!==undefined)behavior[key]=(behavior[key]||0)+pose[key];behavior.feedingMouthShape=pose.mouthShape;behavior.mouthPulse=Math.max(behavior.mouthPulse||0,pose.mouthPulse);behavior.feedingMouthOpen=pose.stage==='process'&&pose.mouthPulse>.45?1:0;behavior.feelerForward=pose.feelerForward;if(pose.eyeNarrow)behavior.eyeNarrow=true;return behavior}
