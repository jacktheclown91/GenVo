import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {applyLineageTarget} from '../src/lineage/reproduction-bridge.js';
import {makePlan} from '../src/lineage/body-plan.js';
import {SPECIES} from '../src/organisms/species.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

for(const kind of ['bramble','carrion']){
  const sim=new Simulation(`TARGETED-FEED-${kind}`,{player:false}),a=sim.animals.find(a=>a.species==='genvo'),w=sim.world;
  let site=null;
  for(let y=3;y<w.n-4&&!site;y++)for(let x=3;x<w.n-4&&!site;x++)if(!w.water[w.idx(x,y)]&&!w.water[w.idx(x+1,y)])site={x:x+.8,y:y+.5};
  assert.ok(site);a.x=site.x;a.y=site.y;a.energy=SPECIES.genvo.maxEnergy*.4;
  const target={x:a.x+.7,y:a.y,kind},here=w.idx(a.x,a.y),there=w.idx(target.x,target.y),field=kind==='carrion'?w.carrion:w.plants[kind];
  assert.notEqual(here,there);field[here]=0;field[there]=.5;a.intent='feed';a.target=target;
  if(kind==='carrion'){const before=a.energy;sim.resolveInteraction(a);assert.equal(field[there],.5,'A grazing mouth cannot deplete a corpse');assert.equal(a.energy,before,'An invalid forced target supplies no meal');assert.equal(a.target,null);assert.ok(applyLineageTarget(a,makePlan(a.bodyPlan.nodes.map(n=>n.socket==='mouth'?{...n,partId:'sucker-mouth'}:n))));a.intent='feed';a.target=target;}
  const before=a.energy;sim.resolveInteraction(a);
  assert.ok(field[there]<.5,'feeding consumes the selected reachable patch');
  assert.equal(field[here],0,'an empty neighboring cell is not the food authority');
  assert.ok(a.energy>before,'a nearby actual meal supplies energy');
  assert.equal(a.target,null,'completed meal releases its target');
  a.target=target;
  const loaded=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim))),la=loaded.animals.find(b=>b.id===a.id),loadedField=kind==='carrion'?loaded.world.carrion:loaded.world.plants[kind];
  const loadedBefore=loadedField[there];loaded.resolveInteraction(la);
  assert.ok(loadedField[there]<loadedBefore,'save/load retains the selected resource authority');
  assert.equal(loadedField[here],0);
  a.target=null;
  const after=field[there];a.target={...target,x:target.x+8};sim.resolveInteraction(a);
  assert.equal(field[there],after,'out-of-reach targeting does not consume food');
}
console.log('autonomous feeding consumes the selected resource cell: PASS');
