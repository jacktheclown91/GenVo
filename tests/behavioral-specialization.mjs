import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {CFG} from '../src/sim/config.js';

function addAdult(sim,{x,y}){
  const p=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id)||sim.spawnAnimal('genvo',p.x+2,p.y);
  const a=sim.spawnAnimal('genvo',x,y,[p,mate]);
  sim.lineage.registerBirth(a,[p,mate]);a.age=SPECIES.genvo.maturity+5;a.energy=SPECIES.genvo.maxEnergy*.86;a.hydration=SPECIES.genvo.maxHydration*.9;a.health=100;a.player=false;a.lineage=true;
  return a;
}

// Sustained wide-ranging forage behavior establishes an independent-forager tendency.
{
  const sim=new Simulation('GENVO8-TENDENCY-FORAGER',{player:true}),p=sim.player();
  const adults=[addAdult(sim,{x:p.x+9,y:p.y}),addAdult(sim,{x:p.x-10,y:p.y+2}),addAdult(sim,{x:p.x+3,y:p.y+10})];
  sim.shelter.shelters.length=0;
  const rngState=sim.rng.state;
  for(let d=0;d<12;d++){
    sim.tickCount+=CFG.dayTicks;sim.day++;
    sim.tendency.noteDirective(d%2?'scout':'forage');
    for(const a of adults){a.intent=d%2?'family-scout':'family-forage';a.energy=SPECIES.genvo.maxEnergy*.82;a.hydration=SPECIES.genvo.maxHydration*.9}
    sim.tendency.advanceDay();
  }
  const snap=sim.tendency.snapshot();
  assert.equal(snap.dominant,'forager');assert.ok(snap.stage>=2,'wide forage behavior becomes an established family tendency');
  assert.ok(sim.tendency.forageRangeMultiplier()>1.2,'established foragers search materially farther');
  assert.equal(sim.rng.state,rngState,'behavioral tendency tracking does not consume simulation RNG');
  const a=adults[0],i=sim.world.idx(a.x+5,a.y);sim.world.plants.bramble[i]=.95;a.energy=SPECIES.genvo.maxEnergy*.78;
  const decision=sim.tendency.autonomousDecision(a);assert.ok(decision&&['tendency-forage','tendency-roam'].includes(decision.intent),'independent tendency changes autonomous adult behavior under Auto');
}

// Staying near a family home and repeatedly regrouping establishes colony cohesion.
{
  const sim=new Simulation('GENVO8-TENDENCY-COLONY',{player:true}),p=sim.player();
  const sh={id:99,ownerId:p.id,x:p.x,y:p.y,integrity:100,foodStore:12,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:0};sim.shelter.shelters=[sh];
  const adults=[addAdult(sim,{x:p.x+1.2,y:p.y+.4}),addAdult(sim,{x:p.x-1.5,y:p.y+.8}),addAdult(sim,{x:p.x+.4,y:p.y-1.6})];
  for(let d=0;d<12;d++){
    sim.tickCount+=CFG.dayTicks;sim.day++;
    sim.tendency.noteDirective(d%2?'home':'gather');
    for(const a of adults){a.intent=d%2?'family-home':'family-area-gather';a.x=p.x+(a.id%3)-1;a.y=p.y+((a.id+1)%3)-1}
    sim.tendency.advanceDay();
  }
  const snap=sim.tendency.snapshot();assert.equal(snap.dominant,'colony');assert.ok(snap.stage>=2,'sustained regrouping establishes colony cohesion');assert.ok(sim.tendency.cohesionMultiplier()<.9);
  const a=adults[0];a.x=p.x+10;a.y=p.y;a.energy=SPECIES.genvo.maxEnergy*.9;a.hydration=SPECIES.genvo.maxHydration*.9;
  const decision=sim.tendency.autonomousDecision(a);assert.equal(decision?.intent,'tendency-home','colony-specialized adults return toward family home under Auto');
  sim.familyDirectives.set('follow');assert.equal(sim.tendency.autonomousDecision(a),null,'explicit family direction overrides autonomous specialization behavior');
}

console.log('behavioral family specialization checks: PASS');
