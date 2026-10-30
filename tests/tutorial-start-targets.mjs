import assert from 'node:assert/strict';
import {Simulation,STARTER_PARTNER} from '../src/sim/simulation.js';
import {matchStartingFounderAppearance,prepareAuthoredFounders} from '../src/persistence/authored-founders.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
import {TutorialController} from '../src/ui/tutorial.js';
import {phenotypeFor,SPECIES} from '../src/organisms/species.js';
// New games place the default partner on the founder's own land (starter-partner/1).
const sim=new Simulation('TUTORIAL-MATCHING-FOUNDERS',{starterPartner:STARTER_PARTNER.policy}),p=sim.player(),m=sim.animals.find(a=>a.id===sim.starterMateId);
const unchanged={rng:sim.rng.state,id:m.id,sex:m.sex,parents:structuredClone(m.parentIds),stocks:[m.energy,m.hydration,m.health],reproductiveGenome:structuredClone(m.reproductiveGenome),other:JSON.stringify(sim.animals.filter(a=>a!==m))};
assert.ok(matchStartingFounderAppearance(sim));
assert.equal(m.bodyPlan.id,p.bodyPlan.id);assert.deepEqual(m.pigmentGenome,p.pigmentGenome);assert.notEqual(m.pigmentGenome,p.pigmentGenome,'pigments are independent inherited records');
for(const key of ['body','motion','senses','temperament'])assert.equal(m.genes[key],p.genes[key]);
for(const key of ['bodyScale','limbScale','sensoryScale','eyeScale','feelerScale','hueShift','lightShift','pigmentChroma','patternBands','patternSpots'])assert.deepEqual(phenotypeFor(m)[key],phenotypeFor(p)[key],key);
assert.deepEqual({rng:sim.rng.state,id:m.id,sex:m.sex,parents:m.parentIds,stocks:[m.energy,m.hydration,m.health],reproductiveGenome:m.reproductiveGenome,other:JSON.stringify(sim.animals.filter(a=>a!==m))},unchanged,'matching initial appearance does not change identity, independent reproduction, finite reserves, RNG or wildlife');
const saved=createSimulationSnapshot(sim),restored=restoreSimulationSnapshot(structuredClone(saved)),rm=restored.animals.find(a=>a.id===m.id);assert.deepEqual(rm.genes,m.genes);assert.deepEqual(rm.pigmentGenome,m.pigmentGenome);assert.deepEqual(rm.founderAppearance,m.founderAppearance);
// The guide marks a selected partner only if courtship with it is available, so the
// alternative is a real animal of the opposite sex, staged as a ready adult beside the player.
function stageAlternativePartner(){
 for(const a of sim.animals){
  if(!a.alive||a.id===p.id||a.id===m.id||a.species!==p.species||a.sex===p.sex)continue;
  const at={x:a.x,y:a.y,age:a.age,reproCooldown:a.reproCooldown};Object.assign(a,{age:Math.max(a.age,SPECIES[a.species].maturity+1),reproCooldown:0});
  for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2],[2,2],[-2,-2],[3,0],[0,3]]){
   const x=p.x+dx,y=p.y+dy;if(!sim.canOccupy(a,x,y)||!sim.world.sameLand(p.x,p.y,x,y))continue;
   Object.assign(a,{x,y});sim.rebuildSpatial();
   if(sim.reproduction.courtshipAvailability({targetId:a.id}).enabled)return a;
  }
  Object.assign(a,at);sim.rebuildSpatial();
 }
 throw Error('no alternative partner can be staged');
}
const selected=stageAlternativePartner(),view=Object.create(TutorialController.prototype),oldRefresh=sim.reproduction.refreshSelection,oldSelected=sim.reproduction.selectedMate;Object.assign(view,{sim,renderer:{},render(){},showToast(){},showCompleteModal(){throw Error('No mating was authored')}});sim.reproduction.refreshSelection=()=>{};sim.reproduction.selectedMate=()=>selected;const oldSelectedId=sim.reproduction.selectedMateId;sim.reproduction.selectedMateId=selected.id;try{view.renderStepMate(p);assert.deepEqual(view.renderer.guideTarget,{id:m.id,x:m.x,y:m.y,label:'Mate'},'opening lesson marks the actual starting partner rather than another compatible animal');sim.creatureStart={kind:'existing-resident'};view.renderStepMate(p);assert.deepEqual(view.renderer.guideTarget,{id:selected.id,x:selected.x,y:selected.y,label:'Mate'},'an existing-resident entry must not inherit an unrelated default founding partner');delete sim.creatureStart}finally{sim.reproduction.selectedMateId=oldSelectedId;sim.reproduction.refreshSelection=oldRefresh;sim.reproduction.selectedMate=oldSelected}
const emptyView=Object.create(TutorialController.prototype);Object.assign(emptyView,{sim,renderer:{camera:{},visiblePlantTargets:new Map()},render(title,body){this.shown={title,body}},historyHas:()=>false,stepStartTick:sim.tickCount+1,showToast(){},advance(){throw Error('No meal occurred')}});emptyView.renderStepFood(p);assert.equal(emptyView.renderer.guideTarget,null);assert.match(emptyView.shown.body,/food this body can eat/,'missing visible targets ask for exploration rather than claiming a nonexistent highlight');
sim.day=2;const before=JSON.stringify(sim.animals);assert.equal(matchStartingFounderAppearance(sim),false);assert.equal(JSON.stringify(sim.animals),before,'ongoing worlds are never matched retroactively');sim.day=1;sim.creatureStart={kind:'existing-resident'};assert.equal(matchStartingFounderAppearance(sim),false,'resident selection never rewrites an existing organism');
const pair=prepareAuthoredFounders(sim);for(const key of ['body','motion','senses','temperament'])assert.equal(pair[0].genes[key],pair[1].genes[key]);assert.deepEqual(pair[0].pigmentGenome,pair[1].pigmentGenome);assert.notEqual(pair[0].id,pair[1].id);assert.notEqual(pair[0].sex,pair[1].sex);
console.log('Tutorial starting pair PASS: actual matching appearance, independent organisms/reproduction, unchanged RNG/stocks/wildlife, saved continuation and no retrospective matching.');
