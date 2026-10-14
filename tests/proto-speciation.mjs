import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES,phenotypeFor} from '../src/organisms/species.js';
import {PLANTS} from '../src/sim/config.js';
import {setForm,setProto,formReading,protoReading,migrateLegacyReadings} from '../src/lineage/readings.js';
// A copy of an animal with no form or proto-trait on its body (for before/after phenotype checks).
const withoutReadings=a=>{const c={...a,anatomy:{...(a.anatomy||{})}};setForm(c,null);setProto(c,null);return c};

const sim=new Simulation('GENVO8-PROTO-SPECIATION',{player:true}),founder=sim.player(),starter=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==founder.id),size=sim.territory.cellSize;
assert.ok(starter);

function dryBlock(exclude=null){
  for(let cy=2;cy<14;cy++)for(let cx=2;cx<14;cx++){
    const point={x:(cx+.5)*size,y:(cy+.5)*size,cx,cy};if(exclude&&Math.hypot(point.x-exclude.x,point.y-exclude.y)<42)continue;
    let dry=true;for(let oy=-1;oy<=1&&dry;oy++)for(let ox=-1;ox<=1;ox++){const x=(cx+ox+.5)*size,y=(cy+oy+.5)*size;if(sim.world.water[sim.world.idx(x,y)]){dry=false;break}}
    if(dry)return point;
  }
  return null;
}
function tuneBlock(block,{food,moisture,temp}){
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
    const cx=block.cx+ox,cy=block.cy+oy;
    for(let y=cy*size;y<(cy+1)*size;y++)for(let x=cx*size;x<(cx+1)*size;x++){
      const i=sim.world.idx(x,y);if(sim.world.water[i])continue;sim.world.moisture[i]=moisture;sim.world.temperature[i]=temp;
      for(const kind of Object.keys(PLANTS))sim.world.plants[kind][i]=food?Math.max(.38,(PLANTS[kind].carry||1)*.82):.003;
    }
  }
}
function lineageChild(a,b,x,y,age=SPECIES.genvo.maturity+3){
  const child=sim.spawnAnimal('genvo',x,y,[a,b]);child.age=age;child.energy=SPECIES.genvo.maxEnergy*.92;child.hydration=SPECIES.genvo.maxHydration*.92;child.health=100;sim.lineage.registerBirth(child,[a,b]);return child;
}

const home=dryBlock(),outer=dryBlock(home);assert.ok(home&&outer,'two widely separated population sites found');
for(const a of sim.animals)if(a.id!==founder.id&&a.id!==starter.id){a.x=124;a.y=124}
founder.x=home.x;founder.y=home.y;starter.x=home.x+1;starter.y=home.y;
sim.shelter.shelters=[{id:1,ownerId:founder.id,x:home.x,y:home.y,integrity:100,weatherSeal:.9,foodStore:8,capacity:28,kind:'primary',constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount}];

const g2=lineageChild(founder,starter,home.x+.4,home.y+.3);
const homeParent=lineageChild(g2,starter,home.x+.8,home.y+.3);
const outerParent=lineageChild(g2,starter,outer.x+.3,outer.y+.3);
assert.equal(homeParent.generation,3);assert.equal(outerParent.generation,3);
const center=sim.generationProgress.addPopulationCenter({kind:'range-band',form:'forager',x:outer.x,y:outer.y,label:'Ranging Band',generation:3,animalId:outerParent.id});

tuneBlock(home,{food:true,moisture:.12,temp:.58});
tuneBlock(outer,{food:false,moisture:.50,temp:.58});
for(let i=0;i<8;i++){const species=i%2?'rootling':'mosskip',a=sim.spawnAnimal(species,outer.x+(i%4)*.42,outer.y+Math.floor(i/4)*.42);a.age=SPECIES[species].maturity+2;a.energy=80;a.hydration=80}
homeParent.x=home.x+.7;homeParent.y=home.y+.2;outerParent.x=outer.x+.4;outerParent.y=outer.y+.2;
sim.rebuildSpatial();sim.sustainability.invalidate();
for(let d=0;d<6;d++){sim.populationMemory.advanceDay();sim.day++}

const splitHome=sim.protoSpeciation.differentialFor('home'),splitOuter=sim.protoSpeciation.differentialFor(`center:${center.id}`);
assert.ok(splitHome?.score>=.12&&splitOuter?.score>=.12,'sustained separated histories qualify for proto divergence');
assert.equal(sim.populationMemory.affinityFor(homeParent)?.key,'home');
assert.equal(sim.populationMemory.affinityFor(outerParent)?.key,`center:${center.id}`);

const outsider=sim.animals.find(a=>a.alive&&a.species==='genvo'&&!a.lineage&&a.id!==starter.id)||sim.spawnAnimal('genvo',home.x+2,home.y+2);
outsider.age=SPECIES.genvo.maturity+5;outsider.energy=100;outsider.hydration=100;
const homeChild=lineageChild(homeParent,outsider,home.x+.5,home.y+.4,4);
const outerChild=lineageChild(outerParent,outsider,outer.x+.5,outer.y+.4,4);
const ht=sim.protoSpeciation.traitFor(homeChild),ot=sim.protoSpeciation.traitFor(outerChild);
assert.ok(ht,'G4 child born to a home-resident parent gains an eligible population trait');
assert.ok(ot,'G4 child born to a secondary-resident parent gains an eligible population trait');
assert.notEqual(ht.id,ot.id,'different lived population pressures can create different inherited proto traits in the same ancestral lineage');
assert.equal(ht.populationKey,'home');assert.equal(ot.populationKey,`center:${center.id}`);
assert.equal(homeChild.species,'genvo');assert.equal(outerChild.species,'genvo','proto divergence does not declare a new species');
assert.deepEqual(homeChild.adaptations.filter(id=>!g2.adaptations.includes(id)),[],'proto trait is separate from adaptation unlocks');
assert.ok(ht.sourceDays>=5&&ot.sourceDays>=5,'trait records prospective pressure history rather than inventing a cause retroactively');
assert.ok(ht.sourceDifference>=.18&&ot.sourceDifference>=.18,'trait records a material population difference');

if(ht.pressure==='dryness')assert.ok(sim.protoSpeciation.waterUseMultiplier(homeChild)<.97,'Dryland inheritance changes actual water use');
if(ht.pressure==='heat'||ht.pressure==='cold')assert.ok(sim.protoSpeciation.thermalMultiplier(homeChild,ht.pressure)<.95,'thermal proto trait changes actual thermal strain');
if(ot.pressure==='competition')assert.ok(sim.protoSpeciation.forageRangeMultiplier(outerChild)>1.04,'competition inheritance changes actual food-search reach');
if(ot.pressure==='scarcity')assert.ok(sim.protoSpeciation.metabolismMultiplier(outerChild)<.97,'scarcity inheritance changes actual resting metabolism');

const plainHome=phenotypeFor(withoutReadings(homeChild)),protoHome=phenotypeFor(homeChild);
const plainOuter=phenotypeFor(withoutReadings(outerChild)),protoOuter=phenotypeFor(outerChild);
assert.equal(protoHome.protoTrait,ht.id);assert.equal(protoOuter.protoTrait,ot.id);
assert.ok(protoHome.bodyScale!==plainHome.bodyScale||protoHome.bodyWidthScale!==plainHome.bodyWidthScale||protoHome.sensoryScale!==plainHome.sensoryScale,'home proto trait has a visible phenotype change');
assert.ok(protoOuter.bodyScale!==plainOuter.bodyScale||protoOuter.limbScale!==plainOuter.limbScale||protoOuter.sensoryScale!==plainOuter.sensoryScale,'secondary proto trait has a visible phenotype change');

const recHome=sim.lineage.records.get(homeChild.id),recOuter=sim.lineage.records.get(outerChild.id);
assert.equal(recHome.protoTrait?.id,ht.id);assert.equal(recOuter.protoTrait?.id,ot.id,'lineage record preserves inherited population trait for handoff presentation');
assert.match(sim.protoSpeciation.revealText(outerChild),/not a separate species/i);
assert.match(sim.protoSpeciation.statusLine(),/Proto-divergence/i);

// A young lineage with too little separate history cannot jump straight to proto-speciation.
const early=new Simulation('GENVO8-PROTO-EARLY',{player:true}),ep=early.player(),em=early.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==ep.id),ec=early.spawnAnimal('genvo',ep.x+.4,ep.y,[ep,em]);ec.generation=4;ec.lineage=true;
assert.equal(early.protoSpeciation.candidateFor(ec,[ep,em]),null,'proto trait requires prospective multi-day population evidence');

console.log('proto-speciation checks: PASS');
