import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {physicalStarterIds,PHYSICAL_STARTERS,physicalStarterDesign,physicalStarterOpportunity,installPhysicalStarter} from '../src/ui/physical-starter-presets.js';
import {validateFounderDesign} from '../src/lineage/founder-design.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {jumpAvailability,launchJump} from '../src/lineage/jumping.js';
import {burrowingStatus,toggleBurrow} from '../src/lineage/burrowing.js';
import {roostAvailability} from '../src/ecology/canopy-site.js';
import {startClimb} from '../src/lineage/climbing.js';
import {divingAvailability,setDiveTarget} from '../src/lineage/diving.js';
import {canOccupy} from '../src/lineage/lifestyle.js';
import {SPECIES} from '../src/organisms/species.js';

assert.deepEqual(physicalStarterIds,['jump','burrow','climb','dive']);
assert.throws(()=>physicalStarterDesign('flight'),/Unknown physical starter/);
for(const id of physicalStarterIds){
 const design=physicalStarterDesign(id),plan=validateFounderDesign(design);
 assert.equal(design.mode,'guided','every body has traced ancestry and ordinary paid costs');
 assert.equal(design.steps.length,id==='climb'?2:1,'complex grips genuinely require an intermediate precursor step');
 assert.equal(plan.nodes.filter(n=>n.partId===PHYSICAL_STARTERS[id].part).length,2);
 assert.ok(plan.nodes.some(n=>n.partId==='grazing-mouth')&&plan.nodes.filter(n=>n.partId==='simple-eye').length===2,'viable mouths and eyes remain mounted');
 assert.equal(design.plan,design.steps.at(-1).to);
 const seed='GENVO-PHYSICAL-START-'+id;
 const sim=new Simulation(seed,{player:true}),original=sim.world;
 const water=original.water.slice(),drinkSpots=original.drinkSpots.map(w=>({...w})),terrain=original.terrain.elevation.slice();
 if(id==='climb')console.log('Climb diagnostic: max natural Woodspire '+Math.max(...original.plants.woodspire).toFixed(4));
 const births=sim.stats.births,day=sim.day;
 const r=installPhysicalStarter(sim,id),p=sim.player(),mate=r.members[1];
 assert.equal(r.receipt.mode,'guided');
 assert.equal(r.receipt.starterFocus,id);
 assert.equal(sim.creatureStart.starterFocus,id);
 assert.equal(sim.creatureStart.kind,'authored-founder');
 assert.equal(p.generation,1);assert.equal(mate.generation,1);
 assert.equal(p.age,SPECIES.genvo.maturity);
 assert.equal(sim.stats.births,births,'no fake G1 births');
 assert.deepEqual(original.water,water,'starter selection cannot conjure water');
 assert.deepEqual(original.terrain.elevation,terrain,'starter selection cannot edit terrain to manufacture a challenge');
 assert.deepEqual(original.drinkSpots,drinkSpots,'starter selection cannot move water landmarks');
 assert.equal(sim.day,day);
 assert.ok(canOccupy(p,original,p.x,p.y));
 assert.ok(r.opportunity&&r.opportunity.type===id,'supported action found at a real start site');
 assert.ok(physicalStarterOpportunity(sim,p,id,p.x,p.y));
 assert.ok(!physicalStarterOpportunity(sim,p,'fake',p.x,p.y));
 const stamina=p.energy;
 if(id==='jump'){assert.ok(jumpAvailability(sim,p).enabled);assert.ok(launchJump(sim,p).ok,'real spring jump starts, costs energy and changes physical state');assert.ok(p.airborne&&p.jump&&p.energy<stamina);}
 if(id==='burrow'){assert.ok(burrowingStatus(sim,p).enabled);assert.ok(toggleBurrow(sim,p).ok,'real excavation work starts at proven substrate');assert.ok(p.burrowWork&&p.burrowWork.i===original.idx(p.x,p.y));}
 if(id==='climb'){assert.ok(roostAvailability(p,original,{climbing:true}).enabled);assert.ok(startClimb(sim,p).ok,'true physical canopy climb begins');assert.ok(p.climb&&p.climb.target>0);}
 if(id==='dive'){const {water:w}=r.opportunity;assert.ok(w);assert.equal(original.water[original.idx(w.x,w.y)],1);p.x=w.x;p.y=w.y;assert.ok(divingAvailability(sim,p).enabled);assert.ok(setDiveTarget(sim,p).ok,'real finite-air dive begins in supported water');assert.ok(p.diveTarget>0);}
 const saved=structuredClone(createSimulationSnapshot(sim,{savedAt:'fixed',reason:'physical-starter'}));
 const resumed=restoreSimulationSnapshot(structuredClone(saved));
 assert.equal(resumed.creatureStart.starterFocus,id);
 assert.equal(resumed.authoredIntroductions.at(-1).starterFocus,id);
 assert.deepEqual(resumed.player().bodyPlan,plan);
 assert.equal(resumed.player().id,p.id);
 console.log(id+': guided precursor plan, supported ecology, real action, unchanged habitat and save PASS');
}
console.log('Physical starter menu builds: FOUR actual biology starts PASS');
