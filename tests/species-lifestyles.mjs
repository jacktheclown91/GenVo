import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {ROOT_TAXON_ID} from '../src/lineage/evolution-tree.js';
import {SPECIES_LIFESTYLES} from '../src/lineage/species-lifestyle.js';

function readySim(seed){
  const sim=new Simulation(seed,{player:true}),p=sim.player();
  p.age=SPECIES.genvo.maturity+6;
  p.generation=4;
  sim.lineage.highestGeneration=4;
  const mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id);
  mate.lineage=true;mate.generation=4;mate.age=SPECIES.genvo.maturity+5;
  if(!sim.lineage.records.has(mate.id))sim.lineage.register(mate,[p.id]);
  return{sim,p,mate};
}

// Real evidence extraction: repeated swimming + Webbed Limbs + wet population history
// should establish the aquatic lifestyle without consuming RNG or unlocking an adaptation.
{
  const {sim,p,mate}=readySim('GENVO8-LIFESTYLE-AQUATIC');
  p.adaptations=[...(p.adaptations||[]).filter(x=>x!=='webbed-limbs'),'webbed-limbs'];
  mate.adaptations=[...(mate.adaptations||[]).filter(x=>x!=='webbed-limbs'),'webbed-limbs'];
  const home=sim.populationMemory.primaryAnchor();
  assert.ok(home);
  sim.populationMemory.histories.set('home',{key:'home',label:'Home Range',kind:'home',centerId:null,days:5,firstDay:1,lastDay:5,exposure:{wetness:4.1},peak:{wetness:.95},recent:{wetness:.82},last:{wetness:.82},lastAssessment:null});
  const rngBefore=sim.rng.state;
  for(let day=1;day<=3;day++){
    sim.day=day;
    sim.speciesLifestyle.noteMovement(p,{swimming:true,distance:3.4});
    sim.speciesLifestyle.noteMovement(mate,{swimming:true,distance:3.1});
    sim.speciesLifestyle.advanceDay();
  }
  const state=sim.speciesLifestyle.stateForTaxon(ROOT_TAXON_ID);
  assert.equal(state.lifestyle?.id,'aquatic','sustained wet travel establishes Aquatic');
  assert.equal(sim.speciesLifestyle.lifestyleFor(p)?.id,'aquatic');
  assert.equal(sim.rng.state,rngBefore,'species lifestyle authority consumes no RNG');
  assert.equal(p.adaptations.includes('aquatic'),false,'lifestyle does not masquerade as an adaptation');
  assert.ok(sim.speciesLifestyle.movementMultiplier(p,{swimming:true})>1);
  assert.ok(sim.speciesLifestyle.movementMultiplier(p,{swimming:false})<1);
  assert.ok(sim.speciesLifestyle.movementEnergyMultiplier(p,{swimming:true})<1);
  assert.match(sim.speciesLifestyle.revealText(p),/Aquatic lifestyle/);
  assert.match(sim.speciesLifestyle.chipText(p),/LIFE · AQUATIC/);
}

// Force equivalent qualifying lived evidence for the other three lifestyles, then
// verify each changes a real existing mechanic rather than only presentation.
for(const id of ['nomadic','guardian','burrower']){
  const {sim,p}=readySim(`GENVO8-LIFESTYLE-${id.toUpperCase()}`),ctrl=sim.speciesLifestyle,def=SPECIES_LIFESTYLES[id];
  const original=ctrl.evidenceFor.bind(ctrl);
  ctrl.evidenceFor=()=>({taxonId:ROOT_TAXON_ID,members:3,adults:3,profileDays:5,ranked:[{id,...def,score:.84,gate:true,detail:`staged ${id} evidence`}],top:{id,...def,score:.84,gate:true,detail:`staged ${id} evidence`}});
  const rngBefore=sim.rng.state;
  for(let day=1;day<=3;day++){sim.day=day;ctrl.advanceDay()}
  ctrl.evidenceFor=original;
  assert.equal(ctrl.lifestyleFor(p)?.id,id,`${id} establishes after sustained qualifying evidence`);
  assert.equal(sim.rng.state,rngBefore,`${id} establishment consumes no RNG`);
  if(id==='nomadic'){
    assert.ok(ctrl.movementMultiplier(p,{swimming:false})>1,'Nomadic improves land travel');
    assert.ok(ctrl.forageRangeMultiplier(p)>1,'Nomadic expands food search');
    assert.ok(ctrl.movementEnergyMultiplier(p,{swimming:false})>1,'Nomadic travel has a small energy tradeoff');
  }else if(id==='guardian'){
    assert.ok(ctrl.threatSenseMultiplier(p)>1,'Guardian improves threat sensing');
    assert.ok(ctrl.shelterProtectionMultiplier(p)<1,'Guardian improves sheltered protection');
  }else if(id==='burrower'){
    assert.ok(ctrl.nestMaterialMultiplier(ROOT_TAXON_ID)<1,'Burrower reduces nest material need');
    assert.ok(ctrl.shelterProtectionMultiplier(p)<1,'Burrower strengthens physical shelter protection');
    assert.ok(ctrl.shelterThermalMultiplier(p)<1,'Burrower strengthens thermal shelter protection');
    assert.ok(ctrl.movementMultiplier(p,{swimming:false})<1,'Burrower has an open-ground speed tradeoff');
  }
}

// A merely suggestive day must not instantly establish a lifestyle.
{
  const {sim}=readySim('GENVO8-LIFESTYLE-NO-INSTANT'),ctrl=sim.speciesLifestyle,def=SPECIES_LIFESTYLES.nomadic;
  ctrl.evidenceFor=()=>({taxonId:ROOT_TAXON_ID,members:3,adults:3,profileDays:5,ranked:[{id:'nomadic',...def,score:.9,gate:true,detail:'one day'}],top:{id:'nomadic',...def,score:.9,gate:true,detail:'one day'}});
  sim.day=1;ctrl.advanceDay();
  assert.equal(ctrl.stateForTaxon(ROOT_TAXON_ID).lifestyle,null,'one qualifying day is not enough');
  assert.equal(ctrl.stateForTaxon(ROOT_TAXON_ID).streak,1);
}

console.log('species lifestyle checks: PASS');
