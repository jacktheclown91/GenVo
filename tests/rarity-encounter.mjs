import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;// needs every configured species
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';
import {RARITY_REVIEW} from '../src/ecology/prey-encounter.js';

// Phase 3J Step 2: rarity affects encounters, never the outcome of a contact or a hunter's choice among
// prey it can actually perceive.
assert.equal(RARITY_REVIEW.enabled,true);
const sim=new Simulation('RARITY-ENCOUNTER',{player:false});
const pred=sim.animals.find(a=>a.alive&&a.species==='needlejaw'&&a.age>=SPECIES.needlejaw.maturity),prey=sim.animals.find(a=>a.alive&&a.species==='mosskip'&&a.age>=SPECIES.mosskip.maturity);
let probability;const chance=sim.rng.chance;sim.rng.chance=p=>{probability=p;return false};
const odds=local=>{const lc=sim.localCount;sim.localCount=(an,sp,r)=>sp===prey.species?local:lc.call(sim,an,sp,r);sim.tryKill(pred,prey);sim.localCount=lc;return probability};
const lone=odds(0),herd=odds(CFG.wildHunt.scarceCount);sim.rng.chance=chance;
assert.equal(lone,herd,'a lone prey is no harder to catch on contact than one in a herd');
RARITY_REVIEW.enabled=false;sim.rng.chance=p=>{probability=p;return false};const oldLone=odds(0),oldHerd=odds(CFG.wildHunt.scarceCount);sim.rng.chance=chance;RARITY_REVIEW.enabled=true;
assert.ok(oldLone<oldHerd,'?rarityReview=0 restores the scarcity capture penalty');
// Choice: the last visible individual of a globally rare species is still a candidate.
{const w=sim.world;const rare=sim.animals.find(a=>a.alive&&a.species==='rillsifter');assert.ok(rare);
 sim.animals=sim.animals.filter(a=>a.species!=='rillsifter'||a===rare);// globally rare: one left
 const hunter=sim.animals.find(a=>a.alive&&a.species==='bankjaw')||pred;Object.assign(hunter,{x:rare.x+1,y:rare.y,energy:SPECIES[hunter.species].maxEnergy*.4});
 sim.animals=sim.animals.filter(a=>a===hunter||a===rare||Math.hypot(a.x-rare.x,a.y-rare.y)>40);sim.rebuildSpatial();
 if(sim.isPredatorTo?.(hunter,rare)!==false){const b=sim.bestPrey(hunter,26);assert.equal(b?.id,rare.id,'a globally rare but perceptible prey can be chosen')}}
console.log('rarity encounter: no contact penalty, no world-count choice refuge: PASS');
