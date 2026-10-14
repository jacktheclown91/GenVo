import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {ROOT_TAXON_ID} from '../src/lineage/evolution-tree.js';
import {SPECIES_LIFESTYLES} from '../src/lineage/species-lifestyle.js';

function readySim(seed){
  const sim=new Simulation(seed,{player:true}),p=sim.player();
  p.age=SPECIES.genvo.maturity+8;p.generation=5;sim.lineage.highestGeneration=5;
  const mates=sim.animals.filter(a=>a.alive&&a.species==='genvo'&&a.id!==p.id).slice(0,2);
  for(const a of mates){a.lineage=true;a.age=SPECIES.genvo.maturity+6;a.generation=5;if(!sim.lineage.records.has(a.id))sim.lineage.register(a,[p.id])}
  return{sim,p,mates};
}
function setLifestyle(sim,id){
  const ctrl=sim.speciesLifestyle,state=ctrl.ensure(ROOT_TAXON_ID),def=SPECIES_LIFESTYLES[id];
  const l={id,label:def.label,short:def.short,formedDay:sim.day,formedGeneration:5,taxonId:ROOT_TAXON_ID,taxonLabel:'GenVo8',evidence:'test',score:1};
  state.lifestyle=l;state.loopDay=-1;state.loop=null;const node=ctrl.node(ROOT_TAXON_ID);if(node)node.lifestyle={...l};ctrl.applyToMembers(ROOT_TAXON_ID,l);return ctrl;
}

// Aquatic lifestyle turns water into branch habitat, not just a hidden speed multiplier.
{
  const {sim,p}=readySim('GENVO8-LIFESTYLE-LOOP-AQUATIC');
  p.adaptations=(p.adaptations||[]).filter(x=>x!=='webbed-limbs');
  setLifestyle(sim,'aquatic');
  assert.equal(sim.canSwim(p),true,'Aquatic branch members can occupy open water without needing the individual Webbed Limbs flag');
  assert.ok(sim.speciesLifestyle.movementMultiplier(p,{swimming:true})>1,'Aquatic swimming remains faster');
  const goal=sim.speciesLifestyle.goalFor(p);if(goal)assert.equal(goal.established,true,'Aquatic ongoing goal is an established-lifestyle loop');
}

// Nomadic lifestyle materially lowers the habitat improvement needed to migrate.
{
  const {sim,p}=readySim('GENVO8-LIFESTYLE-LOOP-NOMADIC');setLifestyle(sim,'nomadic');
  sim.migration.homeFor=()=>({x:20,y:20});
  sim.migration.habitatQuality=(animal,x,y)=>{const away=Math.hypot(x-20,y-20)>=10;return{score:away?.60:.50,food:.5,water:.5,temp:.55,danger:0,familiarity:.2,shelter:0,denRisk:0,denUncertainty:0,territoryOpening:0}};
  const rec=sim.migration.recommend(p);
  assert.equal(rec.shouldMigrate,true,'Nomadic branch accepts a modest but meaningful habitat improvement as a migration route');
}

// Guardian adults can defend threatened family ground rather than always entering generic flight.
{
  const {sim,p,mates}=readySim('GENVO8-LIFESTYLE-LOOP-GUARDIAN');const ctrl=setLifestyle(sim,'guardian'),adult=mates[0];
  p.x=30;p.y=30;adult.x=31;adult.y=30;adult.energy=SPECIES.genvo.maxEnergy*.9;adult.health=100;
  sim.shelter.shelters.push({id:99,ownerId:p.id,x:30,y:30,integrity:100,weatherSeal:.9,foodStore:2,capacity:20,constructedDay:1,constructedYear:1,lastUsedTick:0});
  const hunter=sim.animals.find(a=>a.alive&&SPECIES[a.species]?.hunter);assert.ok(hunter,'test needs a living Stalker');hunter.x=33;hunter.y=30;sim.rebuildSpatial();
  const decision=ctrl.threatDecision(adult,hunter);
  assert.ok(decision&&['mob','guardian-hold'].includes(decision.intent),'Guardian adult holds or intercepts around threatened family ground');
}

// Burrower lifestyle converts branch shelters into dens and pulls strained adults back to them.
{
  const {sim,p,mates}=readySim('GENVO8-LIFESTYLE-LOOP-BURROWER');
  sim.shelter.shelters.push({id:101,ownerId:p.id,x:24,y:24,integrity:100,weatherSeal:.8,foodStore:2,capacity:20,constructedDay:1,constructedYear:1,lastUsedTick:0});
  const ctrl=setLifestyle(sim,'burrower'),adult=mates[0];ctrl.markBurrowDens(ROOT_TAXON_ID);
  const den=sim.shelter.shelters.find(s=>s.id===101);assert.equal(den.denStyle,'burrow','Burrower branch deepens existing branch shelter into a den');
  adult.x=31;adult.y=24;adult.energy=SPECIES.genvo.maxEnergy*.66;adult.hydration=SPECIES.genvo.maxHydration*.9;sim.climate={rain:.7,temp:.52};
  const decision=ctrl.autonomousDecision(adult);assert.equal(decision?.intent,'burrow-return','Burrower adult returns to den earlier under weather/energy strain');
  assert.ok(ctrl.shelterThermalMultiplier(adult)<1&&ctrl.shelterProtectionMultiplier(adult)<1,'Burrow den remains mechanically stronger cover');
}

console.log('species lifestyle play-loop checks: PASS');
