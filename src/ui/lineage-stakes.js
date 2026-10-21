// Explain only usable anatomy inherited by a real living descendant.
// This is a read-only presentation of existing movement authorities, not a new
// ability, genetic operator, quest state or simulation clock.
import {JUMP,hasJumpingAnatomy} from '../lineage/jumping.js';
import {GLIDING,hasGlidingSurfaces,hasClimbingAnatomy} from '../lineage/gliding.js';
import {BURROWING,burrowingAnatomy} from '../lineage/burrowing.js';
import {DIVING} from '../lineage/diving.js';
import {CLIMBING} from '../lineage/climbing.js';
import {swimsByBody} from '../lineage/aquatic.js';
import {visuallyObservable} from '../ecology/atmospheric-visibility.js';

const MOVES=Object.freeze([
 {id:'jump',label:'jump',eligible:(sim,a)=>sim.jumpingRules===JUMP.policy&&hasJumpingAnatomy(a)},
 {id:'burrow',label:'burrow',eligible:(sim,a)=>sim.burrowingRules===BURROWING.policy&&burrowingAnatomy(a)},
 {id:'climb',label:'climb trees',eligible:(sim,a)=>sim.climbingRules===CLIMBING.policy&&sim.glidingRules===GLIDING.policy&&hasClimbingAnatomy(a)},
 {id:'glide',label:'glide',eligible:(sim,a)=>sim.glidingRules===GLIDING.policy&&hasGlidingSurfaces(a)},
 {id:'dive',label:'dive',eligible:(sim,a)=>sim.divingRules===DIVING.policy&&swimsByBody(a)}
]);

// These are inherited body thresholds, not promises that terrain, stamina,
// breath, canopy support or current weather make the action available here.
export function inheritedMovementDifference(sim,predecessor,descendant){
 if(!sim||!predecessor?.bodyPlan||!descendant?.bodyPlan)return{gained:[],lost:[]};
 const gained=[],lost=[];
 for(const move of MOVES){
  const before=move.eligible(sim,predecessor),after=move.eligible(sim,descendant);
  if(after&&!before)gained.push({id:move.id,label:move.label});
  if(before&&!after)lost.push({id:move.id,label:move.label});
 }
 return{gained,lost};
}

// A marker of an actual seen creature. Do not draw a perfect-position line to
// a relative merely because its genealogy entry or world position is known.
export function visibleDescendantGuide(sim,observer,descendant){
 if(!observer?.alive||!descendant?.alive||!descendant?.lineage||
    !sim.lineage?.isDescendant?.(descendant.id,observer.id))return null;
 if(!!observer.underground!==!!descendant.underground)return null;
 const d=Math.hypot(descendant.x-observer.x,descendant.y-observer.y);
 if(!Number.isFinite(d)||d>8||!visuallyObservable(sim,observer,descendant))return null;
 return{x:descendant.x,y:descendant.y,label:`G${descendant.generation} descendant`};
}
