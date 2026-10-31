import assert from 'node:assert/strict';
import {Simulation} from '../../src/sim/simulation.js';
import {SPECIES} from '../../src/organisms/species.js';

// Reproduce arrival after a habitat has filled during courtship. This fixture
// changes only its own detached simulation, never a validation world.
const sim=new Simulation('GENVO8-MATING-PRESSURE-AUDIT',{player:false});
const candidate=process.argv.includes('--candidate');
function installCandidate(sim){
  if(!candidate)return;
  const original=sim.tryMate.bind(sim);
  sim.tryMate=(a,b)=>{
    if(!sim.isManualPlayer(a)&&!sim.isManualPlayer(b)&&
      (!sim.carrying.breedingState(a).allowed||!sim.carrying.breedingState(b).allowed))return false;
    return original(a,b);
  };
}
installCandidate(sim);
const species='mosskip',s=SPECIES[species];
for(const a of sim.animals){a.x=100;a.y=100}
const mother=sim.spawnAnimal(species,12,12),father=sim.spawnAnimal(species,12.2,12);
mother.sex='F';father.sex='M';
for(const a of [mother,father]){
  a.age=s.maturity+10;a.reproCooldown=0;a.energy=s.maxEnergy*.95;
  a.health=100;a.pregnant=null;
}
mother.intent='mate';mother.target=father;
for(let i=0;i<Math.ceil(s.density.softCap*1.18)+2;i++)sim.spawnAnimal(species,12+(i%3)*.1,12+Math.floor(i/3)*.1);
sim.rebuildSpatial();
const pressure=sim.carrying.breedingState(mother);
assert.equal(pressure.allowed,false,'fixture exceeds the existing local carrying threshold');
const rngBefore=sim.rng.state;
const accepted=sim.tryMate(mother,father);
console.log(JSON.stringify({seed:sim.seed,candidate,pressure,accepted,pregnancyCreated:!!mother.pregnant,productionChanged:false},null,2));
assert.equal(accepted,false,'autonomous mating must respect actual carrying pressure at arrival');
assert.equal(mother.pregnant,null,'blocked mating creates no pregnancy');
assert.equal(mother.energy,s.maxEnergy*.95,'blocked mating takes no maternal reserve');
assert.equal(father.energy,s.maxEnergy*.95,'blocked mating takes no paternal reserve');
assert.equal(sim.rng.state,rngBefore,'rejected conception consumes no simulation RNG');
for(const a of sim.animals)if(a!==mother&&a!==father){a.x=100;a.y=100}
sim.rebuildSpatial();sim.carrying.forageCache.clear();
assert.equal(sim.carrying.breedingState(mother).allowed,true,'same parents have capacity in an unoccupied habitat');
assert.equal(sim.tryMate(mother,father),true,'normal autonomous conception remains available');
assert.ok(mother.pregnant,'a lawful mating starts ordinary gestation');
for(let i=0;i<15;i++)sim.spawnAnimal(species,12,12);
sim.rebuildSpatial();
assert.equal(sim.carrying.breedingState(mother).allowed,false);
assert.ok(sim.giveBirth(mother).length>0,'crowding after conception does not cancel an existing litter');

const manual=new Simulation('GENVO8-MATING-PRESSURE-MANUAL',{player:true});
installCandidate(manual);
const active=manual.player(),gs=SPECIES.genvo;
const partner=manual.spawnAnimal('genvo',12.2,12);
Object.assign(active,{sex:'F',age:gs.maturity+2,x:12,y:12,reproCooldown:0,pregnant:null,health:100,energy:gs.maxEnergy*.95});
Object.assign(partner,{sex:'M',age:gs.maturity+2,reproCooldown:0,pregnant:null,health:100,energy:gs.maxEnergy*.95});
for(let i=0;i<Math.ceil(gs.density.softCap*1.18)+2;i++)manual.spawnAnimal('genvo',12,12);
manual.rebuildSpatial();
assert.equal(manual.isManualPlayer(active),true,'control uses actual manual player authority');
assert.equal(manual.carrying.breedingState(active).allowed,false);
assert.equal(manual.tryMate(active,partner),false,'manual mating still requires selected courtship');
manual.reproduction.courtTargetId=partner.id;
assert.equal(manual.tryMate(active,partner),true,'deliberate player courtship retains its existing authority');

const depleted=new Simulation('GENVO8-MATING-PRESSURE-DEPLETED',{player:false});
installCandidate(depleted);
for(const a of depleted.animals){a.x=100;a.y=100}
const dm=depleted.spawnAnimal(species,12,12),df=depleted.spawnAnimal(species,12.2,12);
Object.assign(dm,{sex:'F',age:s.maturity+10,reproCooldown:0,pregnant:null,health:100,energy:s.maxEnergy*.95});
Object.assign(df,{sex:'M',age:s.maturity+10,reproCooldown:0,pregnant:null,health:100,energy:s.maxEnergy*.95});
for(const field of Object.values(depleted.world.plants))field.fill(0);
for(const field of Object.values(depleted.world.freshwaterFood))field.fill(0);
depleted.world.carrion.fill(0);depleted.rebuildSpatial();depleted.carrying.forageCache.clear();
const scarce=depleted.carrying.breedingState(dm);
assert.ok(scarce.crowd>0,'resource fixture is not density-blocked');
assert.equal(scarce.resource,0,'real empty food fields provide no reproductive capacity');
assert.equal(scarce.allowed,false);
const depletedRng=depleted.rng.state;
assert.equal(depleted.tryMate(dm,df),false,'reserves alone cannot bypass habitat resource rejection at arrival');
assert.equal(dm.pregnant,null);assert.equal(dm.energy,s.maxEnergy*.95);assert.equal(df.energy,s.maxEnergy*.95);
assert.equal(depleted.rng.state,depletedRng);
console.log('arrival-pressure candidate, conceived-litter, manual-authority and depleted-food controls: PASS');
