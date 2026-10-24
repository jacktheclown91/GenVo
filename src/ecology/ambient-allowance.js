import {DAY_CLOCK} from '../sim/day-clock.js';
import {SPECIES} from '../organisms/species.js';

// Rest when nothing is pressing (creator decision 2026-10-23, 30-second days). On the longer day an
// animal with no pressing need (food, water, safety, a mate, young) mostly rests, watches or
// browses in place. Its ambient travel (wandering, roaming, patrolling, exploring) is limited to
// what its species actually walked without a need per day on the recorded 6-second day, measured
// in tools (docs/DAY-CLOCK-2026-10-23.md): the longer day then does not multiply that travel or
// its energy cost. Needs are decided before ambient routines and are never limited. Every
// non-manual animal follows the same rule, the player's creature on AUTO included. Recorded worlds
// are unaffected. The day's count (a.ambientWalk) is saved with the animal.
// A hungry animal (below the 72% reserve at which animals forage) that sees no food is searching, not
// wandering: the allowance never holds it in place (correction 2026-10-23: rillsifters starved
// beside exhausted feeding grounds, measured in docs/WILDLIFE-NEEDS-2026-10-23.md).
export const AMBIENT_ALLOWANCE=Object.freeze({
 // Tiles per day travelled on ambient intents, herd cohesion and spacing included, with energy >= 0.6
 // and water >= 0.5 on the recorded clock: three seeds, 8 days each (tools/probe-ambient-allowance.mjs,
 // docs/day-activity-2026-10-23/ambient-allowance-6s.json). Herd moves were first left outside the
 // allowance and grew four- to twenty-five-fold per day on the longer day (docs/DAY-ACTIVITY-2026-10-23.md).
 tilesPerDay:Object.freeze({mosskip:4.1,rootling:1.2,needlejaw:5.8,genvo:5.5,rillsifter:3,mirelick:2,podshell:4.9,bankjaw:2.2}),
 socialIntents:new Set(['group','group-space']),
 fallback:3,
 intents:new Set(['explore','herd-hop','herd-browse','band-wander','root-roam','mire-prowl','shoal-glide','pod-wander','pod-browse','shadow-patrol','bank-patrol'])
});
export function ambientLimited(sim){return sim.dayClockRules===DAY_CLOCK.policy}
export function ambientAllowance(a){return AMBIENT_ALLOWANCE.tilesPerDay[a.species]??AMBIENT_ALLOWANCE.fallback}
// Called for every step an animal actually moves.
// sim.correctionExperiment.socialAllowance=false (development measurement only) leaves herd moves out.
const counted=(sim,intent)=>AMBIENT_ALLOWANCE.intents.has(intent)||sim.correctionExperiment?.socialAllowance!==false&&AMBIENT_ALLOWANCE.socialIntents.has(intent);
export function noteAmbientMove(sim,a,distance){
 if(!ambientLimited(sim)||!counted(sim,a.intent)||!(distance>0))return;
 const w=a.ambientWalk;if(w?.day!==sim.day)a.ambientWalk={day:sim.day,tiles:distance};else w.tiles+=distance;
}
export const HUNGRY_SEARCH=.72;
export function ambientSpent(sim,a){
 // sim.correctionExperiment (development measurement only, never set by the game) can switch the
 // correction off for comparison runs.
 const s=SPECIES[a.species];if(s&&a.energy<s.maxEnergy*HUNGRY_SEARCH&&sim.correctionExperiment?.hungrySearch!==false)return false;
 return ambientLimited(sim)&&a.ambientWalk?.day===sim.day&&a.ambientWalk.tiles>=ambientAllowance(a);
}
