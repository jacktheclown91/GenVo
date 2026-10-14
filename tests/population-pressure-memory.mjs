import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {PLANTS} from '../src/sim/config.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';

const sim=new Simulation('POPULATION-PRESSURE-MEMORY',{player:true}),p=sim.player(),mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==p.id),size=sim.territory.cellSize;
assert.ok(mate);

function dryBlock(exclude=null){
  for(let cy=2;cy<14;cy++)for(let cx=2;cx<14;cx++){
    const point={x:(cx+.5)*size,y:(cy+.5)*size,cx,cy};if(exclude&&Math.hypot(point.x-exclude.x,point.y-exclude.y)<36)continue;
    let dry=true;for(let oy=-1;oy<=1&&dry;oy++)for(let ox=-1;ox<=1;ox++){const x=(cx+ox+.5)*size,y=(cy+oy+.5)*size;if(sim.world.water[sim.world.idx(x,y)]){dry=false;break}}
    if(dry)return point;
  }
  return null;
}
const home=dryBlock(),outer=dryBlock(home);assert.ok(home&&outer,'two separated dry population blocks found');

for(const a of sim.animals)if(!a.lineage){a.x=122;a.y=122}
p.x=home.x;p.y=home.y;p.age=SPECIES.genvo.maturity+5;mate.x=home.x+1;mate.y=home.y;mate.age=SPECIES.genvo.maturity+4;
sim.shelter.shelters=[{id:1,ownerId:p.id,x:home.x,y:home.y,integrity:100,weatherSeal:.9,foodStore:8,capacity:28,kind:'primary',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount}];sim.shelter.nextId=2;

const relatives=[];
for(let i=0;i<6;i++){
  const a=sim.spawnAnimal('genvo',outer.x+(i%3)-1,outer.y+Math.floor(i/3),[p,mate]);a.age=SPECIES.genvo.maturity+3;a.energy=SPECIES.genvo.maxEnergy*.9;a.hydration=SPECIES.genvo.maxHydration*.9;a.health=100;setForm(a,{kind:'forager',strength:.78,sourceGeneration:3,bornDay:sim.day});sim.lineage.registerBirth(a,[p,mate]);const rec=sim.lineage.records.get(a.id);rec.divergence=formReading(a);relatives.push(a);
}
const child=sim.spawnAnimal('genvo',outer.x+.3,outer.y+.4,[relatives[0],mate]);child.age=8;child.energy=90;child.hydration=90;child.health=100;setForm(child,{kind:'forager',strength:.72,sourceGeneration:4,bornDay:sim.day});sim.lineage.registerBirth(child,[relatives[0],mate]);sim.lineage.records.get(child.id).divergence=formReading(child);
const center=sim.generationProgress.addPopulationCenter({kind:'range-band',form:'forager',x:outer.x,y:outer.y,label:'Ranging Band',generation:3,animalId:relatives[0].id});

function tuneBlock(block,{food,moisture,temp}){
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const cx=block.cx+ox,cy=block.cy+oy;
    for(let y=cy*size;y<(cy+1)*size;y++)for(let x=cx*size;x<(cx+1)*size;x++){
      const i=sim.world.idx(x,y);if(sim.world.water[i])continue;sim.world.moisture[i]=moisture;sim.world.temperature[i]=temp;
      for(const kind of Object.keys(PLANTS))sim.world.plants[kind][i]=food?Math.max(.35,(PLANTS[kind].carry||1)*.78):.004;
    }
  }
}
tuneBlock(home,{food:true,moisture:.16,temp:.78});tuneBlock(outer,{food:false,moisture:.86,temp:.38});
for(let i=0;i<7;i++){const species=i%2?'rootling':'mosskip',a=sim.spawnAnimal(species,outer.x+(i%3)*.45,outer.y+(i%2)*.45);a.age=SPECIES[species].maturity+2;a.energy=80;a.hydration=80}
const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw');assert.ok(stalker);stalker.x=outer.x+2.3;stalker.y=outer.y+1.2;
sim.rebuildSpatial();sim.sustainability.invalidate();

for(let day=0;day<5;day++){sim.populationMemory.advanceDay();sim.day++}
const homeProfile=sim.populationMemory.profile('home'),outerProfile=sim.populationMemory.profile(`center:${center.id}`);
assert.equal(homeProfile.days,5);assert.equal(outerProfile.days,5,'secondary population keeps its own day history');
assert.ok(homeProfile.axes.find(a=>a.id==='dryness').mean>.3,'home history remembers sustained dry ground');
assert.ok(outerProfile.axes.find(a=>a.id==='wetness').mean>.45,'outer history remembers sustained wet ground');
assert.ok(outerProfile.axes.find(a=>a.id==='scarcity').mean>homeProfile.axes.find(a=>a.id==='scarcity').mean+.3,'separate populations remember different food pressure');
assert.ok(outerProfile.axes.find(a=>a.id==='competition').mean>.25,'outer population records competing feeders');
assert.ok(outerProfile.axes.find(a=>a.id==='predation').mean>.2,'outer population records predator pressure');

const split=sim.populationMemory.divergence()[0];assert.ok(split&&split.score>.12,'separated populations develop a measurable pressure-history gap');
assert.ok(split.dominantDifference.magnitude>.25,'the largest environmental difference is explicit for future divergence');
const assigned=relatives.find(a=>sim.generationProgress.populationAssignment(a,'forager'));assert.ok(assigned,'ranging-band cohort exists');
const affinity=sim.populationMemory.affinityFor(assigned);assert.equal(affinity?.key,`center:${center.id}`,'assigned adults accumulate residence at the secondary population');
const childAffinity=sim.populationMemory.affinityFor(child);assert.equal(childAffinity?.key,`center:${center.id}`,'young raised beside the secondary center acquire that population history too');
assert.match(sim.populationMemory.summaryLine(),/separation/i);
const notice=sim.populationMemory.consumeNotice();assert.ok(notice&&/different pressure history/i.test(notice.message),'meaningful population separation can surface concise contextual feedback');


const observed=new Simulation('POPULATION-MEMORY-READONLY',{player:false}),control=new Simulation('POPULATION-MEMORY-READONLY',{player:false});
control.populationMemory.advanceDay=()=>{};
for(let i=0;i<128;i++){observed.update(null);control.update(null)}
assert.equal(observed.rng.state,control.rng.state,'pressure-memory recording consumes no simulation RNG');
assert.deepEqual(observed.population(),control.population(),'pressure-memory recording does not change ecology populations');
assert.equal(observed.day,control.day,'pressure-memory recording does not change simulation time');

console.log('population-specific pressure memory checks: PASS');
