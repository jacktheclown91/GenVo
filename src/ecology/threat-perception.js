import {stratumHearing} from './stratum-senses.js';
// Staged threat perception (Phase 3K Priority 3, creator decision 2026-10-16: "recognizing a potential
// predator is not the same as deciding to flee"). The behaviour-based appraisal (threat-appraisal.js) answered
// one yes/no question and any "yes" meant full flight. With this on, a would-be predator inside the flight
// radius passes through four stages, each from the animal's own senses and inherited tendency:
//  1. Detection - the senses that reach it. Inside the viewer's field of view (about 100 degrees either
//     side of the way it faces) the whole flight radius; behind it only hearing: HEARING of the radius for a
//     predator that is moving, QUIET for one that is still. A predator the animal is already watching
//     (vigilance) is tracked over the whole radius. Predator stealth and the radius itself (genes.senses,
//     mounted sensory parts) apply as before.
//  2. Assessment - a threat level from what the predator is visibly doing and how close it is:
//     hunting with this animal as target or facing it = 1, hunting something else = 0.4, merely present =
//     0.25, visibly fleeing = 0.2; scaled by closeness (half at the edge of the radius, full at contact).
//     Within CLOSE_ALARM (contact range) a predator that could still bite or collide keeps a floor: 0.7 when
//     not fleeing, and when fleeing 0.65 if it is heading at this animal and 0.4 otherwise. A fleeing
//     predator is less threatening but never categorically harmless. A conspecific courting (any partner) has
//     no contact floor: rival suitors compete, they do not hunt.
//  3. Response by threshold, scaled by inherited boldness (genes.temperament: bolder animals need more to
//     react) and by current need (a thirsty or hungry animal accepts more risk, up to +40%):
//       vigilance - keeps its activity and tracks that predator for a few ecology steps;
//       alarm     - keeps its activity, but will not move toward the predator: a target that lies toward
//                   it is replaced by a short walking retreat ('wary'); shared alarms are unchanged;
//       flight    - the existing escape, refuge, shelter and defence branches (lifestyle defence,
//                   specialised responses, standing ground and mobbing) exactly as before.
//  4. Defence is unchanged and is reached only at the flight stage.
// No global scans: it reuses the one neighbourhood query the decision step already makes. Courtship
// exemptions are as in threat-appraisal.js. ?threatStages=0 restores the yes/no appraisal.
// All numbers below are PROPOSALS for creator review.
import {CFG} from '../sim/config.js';
import {atmosphericSight} from './atmospheric-visibility.js';
import {SPECIES} from '../organisms/species.js';
import {still} from './refuges.js';
import {courtingMe,facing,CLOSE_ALARM,FLEEING,HUNTING} from './threat-appraisal.js';
export const THREAT_STAGES={enabled:true};
export const VIEW_CONE=-.17,HEARING=.55,QUIET=.25,NEED_TOLERANCE=.4;// view cone: cosine -0.17, about 100 degrees
export const STAGE={vigilance:.15,alarm:.35,flight:.6};
export const VIGILANCE_STEPS=4,WARY_RETREAT=3;
const FACE=[[0,-1],[.7071,-.7071],[1,0],[.7071,.7071],[0,1],[-.7071,.7071],[-1,0],[-.7071,-.7071]];
function inView(a,b){const f=FACE[(a.dir??0)&7],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;return (f[0]*dx+f[1]*dy)/d>=VIEW_CONE}
export function watching(sim,a,b){return a.vigilance?.id===b.id&&a.vigilance.untilTick>sim.tickCount}
// Stage 1: can `a` sense `b` at distance d, given its flight radius R?
export function detects(sim,a,b,d,R){const visible=(watching(sim,a,b)||inView(a,b))&&d<R&&atmosphericSight(sim,a,b,R).detected;return visible||stratumHearing(sim,a,b,R*(still(sim,b)?QUIET:HEARING))}
// Stage 2: how threatening `b` looks to `a` (0..1).
export function threatLevel(a,b,d,R){
  if(courtingMe(b,a)||courtingMe(a,b))return 0;
  const fleeing=FLEEING.has(b.intent),hunting=HUNTING.has(b.intent),atMe=hunting&&(b.target?.id===a.id||facing(b,a));
  let level=(atMe?1:hunting?.4:fleeing?.2:.25)*(.5+.5*Math.max(0,1-d/R));
  // A conspecific in courtship posture (courting anyone) is competing, not hunting: no contact floor. Measured:
  // rival suitors at one partner fled each other at contact range (24 of 25 Stalker mate-search escapes).
  if(b.species===a.species&&b.intent==='mate')return level;
  if(d<=CLOSE_ALARM)level=Math.max(level,fleeing?(facing(b,a)?.65:.4):.7);
  return level;
}
// Current need: 0 when comfortable, 1 when water or energy is at half the urgent line or below.
export function needOf(a){const s=SPECIES[a.species];if(!s)return 0;const h=a.hydration/s.maxHydration,e=a.energy/s.maxEnergy;return Math.max(0,Math.min(1,Math.max((.48-h)/.24,(.52-e)/.26)))}
// Stage 3 thresholds for this animal now.
export function thresholds(a){const bold=Math.max(.6,Math.min(1.5,a.genes?.temperament??1)),k=bold*(1+NEED_TOLERANCE*needOf(a));return{vigilance:STAGE.vigilance*bold,alarm:STAGE.alarm*k,flight:STAGE.flight*k}}
export function noteVigilance(sim,a,b){a.vigilance={id:b.id,untilTick:sim.tickCount+CFG.lifeStride*VIGILANCE_STEPS}}
// Alarm: after the decision, a target that leads toward the alarming predator becomes a short retreat.
export function applyAlarm(a,b){
  if(!a.alive||!b?.alive||FLEEING.has(a.intent)||HUNTING.has(a.intent))return false;
  const ax=b.x-a.x,ay=b.y-a.y,ad=Math.hypot(ax,ay)||1;
  if(a.target&&Number.isFinite(a.target.x)){const tx=a.target.x-a.x,ty=a.target.y-a.y,td=Math.hypot(tx,ty);if(td<.3||(tx*ax+ty*ay)/(td*ad)<.3)return false}
  else if(a.intent==='feed'||a.intent==='drink')return false;
  a.intent='wary';a.target={x:a.x-ax/ad*WARY_RETREAT,y:a.y-ay/ad*WARY_RETREAT};return true;
}
