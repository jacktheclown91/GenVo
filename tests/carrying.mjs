import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

assert.ok(CFG.maxAnimals>CFG.performanceTarget,'emergency ceiling should sit above performance target');
const sim=new Simulation('GENVO8-CARRYING',{player:true});
sim.rebuildSpatial();sim.carrying.observe();
for(const x of sim.animals)if(x.species==='mosskip'){x.x=100;x.y=100}
const a=sim.spawnAnimal('mosskip',12,12);
sim.rebuildSpatial();
const sparse=sim.carrying.breedingState(a);
assert.ok(sparse.resource>0,'forage pressure should see actual habitat resources');
for(let i=0;i<7;i++)sim.spawnAnimal('mosskip',a.x+(i%3)*.15,a.y+Math.floor(i/3)*.15);
sim.rebuildSpatial();
const crowded=sim.carrying.breedingState(a);
assert.ok(crowded.local>sparse.local,'local density must count nearby conspecifics');
assert.ok(crowded.crowd<sparse.crowd,'crowding must progressively lower breeding pressure');
assert.ok(crowded.driveRate<sparse.driveRate,'crowding must slow reproductive-drive accumulation');
const beforeCompetitors=sim.carrying.breedingState(a);
for(let i=0;i<4;i++)sim.spawnAnimal('rootling',a.x+.2,a.y+.2);
sim.rebuildSpatial();
const shared=sim.carrying.breedingState(a);
assert.ok(shared.competitors>beforeCompetitors.competitors,'other plant eaters share local food capacity');
assert.ok(shared.ratio>beforeCompetitors.ratio,'shared food demand raises breeding pressure');
{
  // Historical diets no longer own resource competition. Mutating a founding
  // metadata entry cannot change the same animals' actual ecological demand.
  const oldDiet=SPECIES.rootling.diets;
  try{
    const before=sim.carrying.breedingState(a);
    SPECIES.rootling.diets={...SPECIES.needlejaw.diets};
    sim.carrying.forageCache.clear();
    const after=sim.carrying.breedingState(a);
    assert.equal(after.competitors,before.competitors,'founding species diet cannot overwrite mounted mouths');
    assert.equal(after.ratio,before.ratio,'phenotype wins over ancestry metadata');
  }finally{SPECIES.rootling.diets=oldDiet}
}

const p=sim.player();
const npc=sim.animals.find(x=>x.id!==p.id&&!x.lineage);
npc.x=p.x<CFG.worldSize/2?CFG.worldSize-3:3;
npc.y=p.y<CFG.worldSize/2?CFG.worldSize-3:3;
assert.equal(sim.carrying.decisionStride(p),1,'player always uses full decision cadence');
assert.ok(sim.carrying.decisionStride(npc)>=2,'far background animals use reduced decision cadence');
npc.hydration=SPECIES[npc.species].maxHydration*.2;
assert.equal(sim.carrying.shouldRefreshDecision(npc),true,'urgent survival needs override background cadence');
console.log('carrying pressure / background cadence: PASS');
