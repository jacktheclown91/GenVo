import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function descendant(sim,parent,{adaptations=parent.adaptations||[]}={}){
  const child=sim.spawnAnimal('genvo',parent.x+1,parent.y,[parent,parent]);
  child.lineage=true;child.age=SPECIES.genvo.maturity+2;child.adaptations=[...adaptations];
  sim.lineage.register(child,[parent.id]);
  return child;
}
function activate(sim,animal){
  for(const a of sim.animals)a.player=false;
  animal.player=true;sim.playerId=animal.id;sim.lineage.activeId=animal.id;
}
function practiced(sim,animal,branch,streak=1,detail='completed the branch encounter'){
  const rec=sim.lineage.records.get(animal.id);rec.strategy={branch,complete:true,generation:animal.generation,day:sim.day,detail,streak};
}
function isolate(sim,animal){
  for(const a of sim.animals){if(a.id===animal.id)continue;a.x=Math.min(122,animal.x+40+(a.id%3));a.y=Math.min(122,animal.y+40+(a.id%5))}
  sim.rebuildSpatial();
}
function stalker(sim,animal,distance=4){
  // Same distance; the first bearing that stays on the animal's own land (a fixed east offset can fall in water).
  let x=animal.x+distance,y=animal.y;for(let k=0;k<16;k++){const t=k*Math.PI/8,cx=animal.x+Math.cos(t)*distance,cy=animal.y+Math.sin(t)*distance;if(!sim.world.water[sim.world.idx(cx,cy)]&&sim.world.sameLand(animal.x,animal.y,cx,cy)){x=cx;y=cy;break}}
  let hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
  if(!hunter)hunter=sim.spawnAnimal('needlejaw',x,y);hunter.x=x;hunter.y=y;hunter.health=100;sim.rebuildSpatial();return hunter;
}

// Consecutive completed generations deepen one strategic branch; a branch switch breaks the practiced streak.
{
  const sim=new Simulation('GENVO8-ARC-LEGACY',{player:true}),founder=sim.player();founder.adaptations=['camouflage-mantle'];
  practiced(sim,founder,'stealth',1);
  const child=descendant(sim,founder,{adaptations:['camouflage-mantle']});
  assert.deepEqual(sim.specialization.strategyLegacy(child,'stealth'),{branch:'stealth',streak:1,stage:1});
  practiced(sim,child,'stealth',2);
  const grandchild=descendant(sim,child,{adaptations:['camouflage-mantle','adaptive-chromatophores']});
  assert.equal(sim.specialization.strategyLegacy(grandchild,'stealth').streak,2);
  const profile=sim.specialization.challengeProfile(grandchild,'stealth');assert.equal(profile.required,2);assert.ok(profile.maxThreat<7,'third-generation stealth practice moves the objective closer to predator pressure');
  sim.lineage.records.get(child.id).strategy={branch:'offense',complete:true,generation:child.generation,day:sim.day,detail:'switched branches',streak:1};
  assert.equal(sim.specialization.strategyLegacy(grandchild,'stealth').streak,0,'switching strategic branches breaks the consecutive practice streak');
}

// A second stealth generation must repeat the real concealed-feeding success before the arc advances.
{
  const sim=new Simulation('GENVO8-ARC-STEALTH',{player:true}),founder=sim.player();founder.adaptations=['camouflage-mantle'];practiced(sim,founder,'stealth',1);
  const child=descendant(sim,founder,{adaptations:['camouflage-mantle']});activate(sim,child);isolate(sim,child);
  const i=sim.world.idx(child.x,child.y);sim.world.plants.bramble.fill(0);sim.world.plants.marshroot.fill(0);sim.world.carrion.fill(0);sim.world.plants.bramble[i]=1;sim.world.plants.marshroot[i]=.9;sim.world.water[i]=0;
  const hunter=stalker(sim,child,4);child.hidden=true;child.intent='hide';
  const state=sim.specialization.challengeState(child);assert.equal(state.legacy,1);assert.equal(sim.specialization.challengeProfile(child,'stealth').required,2);
  const first=sim.specialization.notePlayerAction(child,{ok:true,type:'eat',message:'Ate.'},{hidden:true});assert.equal(first.strategyComplete,undefined);assert.equal(state.progress,1);assert.equal(state.complete,false);
  const second=sim.specialization.notePlayerAction(child,{ok:true,type:'eat',message:'Ate.'},{hidden:true});assert.equal(second.strategyComplete,true);assert.equal(state.complete,true);assert.equal(sim.lineage.records.get(child.id).strategy.streak,2);
  assert.match(sim.specialization.generationSummary(child),/practiced 2 generations/);assert.ok(hunter.alive);
}

// Branch-specific field requirements expand with practice instead of merely adding a hidden stat bonus.
{
  const sim=new Simulation('GENVO8-ARC-PROFILES',{player:true}),founder=sim.player();
  practiced(sim,founder,'offense',1);const fighter=descendant(sim,founder,{adaptations:['heavy-jaw']});
  const baseOffense={...sim.specialization.challengeProfile(founder,'offense')};const practicedOffense=sim.specialization.challengeProfile(fighter,'offense');
  assert.ok(practicedOffense.radiusBonus>baseOffense.radiusBonus);assert.equal(practicedOffense.required,3);

  sim.lineage.records.get(founder.id).strategy={branch:'social',complete:true,generation:1,day:sim.day,detail:'defended young',streak:1};
  const social=descendant(sim,founder,{adaptations:['mobbing-instinct']});const socialProfile=sim.specialization.challengeProfile(social,'social');assert.equal(socialProfile.required,2);assert.ok(socialProfile.searchBonus>0);

  sim.lineage.records.get(founder.id).strategy={branch:'utility',complete:true,generation:1,day:sim.day,detail:'hauled food',streak:1};
  const carrier=descendant(sim,founder,{adaptations:['grasping-limbs']});const utility=sim.specialization.challengeProfile(carrier,'utility');assert.equal(utility.distanceBonus,2);assert.equal(utility.radiusBonus,3);
}

console.log('multi-generation strategy arc checks: PASS');
