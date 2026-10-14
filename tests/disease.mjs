import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';

const sim=new Simulation('DISEASE-TEST',{player:false});
const animals=sim.animals.filter(a=>a.species==='genvo');
assert(animals.length>=8,'enough GenVo8 individuals for contact test');
const source=animals[0];source.x=50;source.y=50;
const rngBefore=sim.rng.state;
assert(sim.disease.infect(source,{source:'test',force:true}),'forced test infection starts');
assert.equal(sim.rng.state,rngBefore,'starting disease does not consume main RNG');
assert(source.infected&&source.infection?.duration>=4,'infection has a real course');

// High-dose deterministic exposure should infect at least one close susceptible without touching ecology RNG.
let infectedContact=null;
for(let i=1;i<animals.length;i++){
  const a=animals[i];a.x=50+(i%3)*.2;a.y=50+Math.floor(i/3)*.2;
  sim.disease.expose(a,100,'contact',source.id);
  if(a.infected&&!infectedContact)infectedContact=a;
}
assert(infectedContact,'deterministic close-contact exposure can transmit infection');
assert.equal(sim.rng.state,rngBefore,'disease exposure does not consume main RNG');

// Active infection has a metabolic/health cost.
const e0=source.energy,h0=source.health,w0=source.hydration;
sim.disease.phaseEffects();
assert(source.energy<e0&&source.health<h0&&source.hydration<w0,'infection creates real physiological cost');

// Mating remains a possible transmission route; illness suppresses initiation through normal AI costs rather than making pairing impossible.
const mate=animals.find(a=>a.id!==source.id&&a.sex!==source.sex&&!a.infected);
assert(mate,'compatible mate exists');
source.age=mate.age=80;source.reproCooldown=mate.reproCooldown=0;
assert(sim.disease.exposureChance(mate,.92)>0,'mating-dose exposure can transmit Marsh fever');
const matingRng=sim.rng.state;sim.disease.onMate(source,mate);assert.equal(sim.rng.state,matingRng,'mating exposure does not consume main RNG');

// Infected deaths create a stronger environmental contamination hotspot.
const idx=sim.world.idx(source.x,source.y),before=sim.disease.pathogen[idx];
sim.disease.onDeath(source);
assert(sim.disease.pathogen[idx]>before,'infected death contaminates local ground');

// Recovery is duration-based and creates temporary acquired immunity.
const recovering=infectedContact;
recovering.infection.days=recovering.infection.duration-1;
sim.disease.advanceDay();
assert.equal(recovering.infected,false,'infection resolves after its course');
assert(recovering.immune&&recovering.immuneUntilDay>sim.disease.absoluteDay(),'survivor gains acquired immunity');
assert.equal(sim.disease.exposureChance(recovering,100),0,'temporary immunity blocks reinfection');

// Maternal acquired immunity gives newborns a short protection window.
const child=sim.spawnAnimal('genvo',recovering.x,recovering.y,[recovering,mate]);
sim.disease.onBirth(child,recovering,mate);
assert(child.immuneUntilDay>sim.disease.absoluteDay(),'immune mother passes brief newborn protection');

// Background carrion can carry a small pathogen load, allowing ecology-driven emergence.
const healthy=sim.animals.find(a=>a.alive&&a.species==='mosskip'&&!a.infected&&!sim.disease.isImmune(a));
assert(healthy,'healthy test animal exists');
const ci=sim.world.idx(healthy.x,healthy.y),c0=sim.disease.pathogen[ci];
sim.disease.onDeath(healthy);
assert(sim.disease.pathogen[ci]>c0,'ordinary carrion carries low background pathogen load');

assert(sim.disease.stats.infections>=2,'disease statistics track infections');
assert(sim.disease.stats.recoveries>=1,'disease statistics track recovery');
console.log('disease checks: PASS');
