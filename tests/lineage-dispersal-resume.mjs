import assert from 'node:assert/strict';import {isDeepStrictEqual} from 'node:util';import {Simulation} from '../src/sim/simulation.js';import {SPECIES} from '../src/organisms/species.js';import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
// Lineage dispersal CONTRACT (creator decision 2026-10-15): arrival is never guaranteed.
//  - departure only when the origin is blocked by competing consumers and the creature is ready;
//  - travel continues by normal movement (no teleport) while the destination stays viable;
//  - the route is reconsidered exactly when habitat competition makes the destination unsuitable;
//  - arrival happens only at the destination and is followed by a real residence;
//  - a mid-route save resumes to the identical simulation.
// Two scenarios differ ONLY in how many local GenVo relatives exist (8 vs all 23, the latter placed at the
// destination once the route begins, see Scenario 2); the
// rules, resources and RNG are untouched. Which outcome each produces is a coverage guard for the
// fixture, not a biological requirement.
function scenario(crowd,{rivalsAtDestination=false}={}){
  const sim=new Simulation('LINEAGE-DISPERSAL',{player:true}),w=sim.world,animals=sim.animals.filter(a=>a.species==='genvo').slice(0,crowd+1);
  sim.animals=animals;sim.setPlayerAutonomy(true);const a=animals[0],s=SPECIES.genvo;
  for(const f of Object.values(w.plants))f.fill(1);for(const b of animals)Object.assign(b,{x:52,y:52});
  Object.assign(a,{lineage:true,age:60,energy:s.maxEnergy*.95,hydration:s.maxHydration*.95,infected:false});sim.rebuildSpatial();
  // Departure: the origin is blocked by competition, the creature is ready, the destination is viable.
  const origin=sim.carrying.breedingState(a);assert.equal(origin.allowed,false,'origin is blocked');assert.ok(origin.ratio>=1.18,'by competing consumers');
  const rec=sim.migration.recommend(a);assert.equal(rec.shouldMigrate,true);assert.equal(rec.target.purpose,'dispersal');assert.equal(rec.target.carrying.allowed,true,'departure targets a viable destination');
  const before={x:a.x,y:a.y};assert.equal(sim.migration.begin(a,rec.target),true);assert.deepEqual({x:a.x,y:a.y},before,'route start never teleports');
  // Monitor every real progress check with the controller's own gates, evaluated immediately before it.
  const checks=[],progress=sim.migration.progress.bind(sim.migration);
  sim.migration.progress=(animal,state=sim.migration.ensure(animal))=>{
    if(animal!==a||state?.status==='settled'||state?.purpose!=='dispersal')return progress(animal,state);
    const t=state.target,viable=!!t&&sim.canOccupy(a,t.x,t.y)&&sim.canReach(a,t.x,t.y)&&sim.carrying.breedingState(a,{at:t}).allowed,distance=t?Math.hypot(a.x-t.x,a.y-t.y):null;
    const r=progress(animal,state);checks.push({viable,distance,status:state.status,reason:state.reason,arrival:state.dispersalArrival?{...state.dispersalArrival}:null});return r;
  };
  sim.migration.progress(a);assert.equal(sim.migration.state(a).status,'outbound');
  if(rivalsAtDestination){const t=sim.migration.state(a).target;for(const b of animals)if(b!==a)Object.assign(b,{x:t.x,y:t.y});sim.rebuildSpatial()}
  sim.reproduction.refreshSelection();
  const saved=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(sim))),ra=saved.animals.find(b=>b.id===a.id);
  assert.equal(saved.migration.state(ra).purpose,'dispersal');assert.deepEqual(saved.migration.state(ra).target,sim.migration.state(a).target);
  let moved=0,maxStep=0;
  for(let i=0;i<1400&&sim.migration.state(a).status!=='settled';i++){const old={x:a.x,y:a.y};sim.update(null);const d=Math.hypot(a.x-old.x,a.y-old.y);moved+=d;maxStep=Math.max(maxStep,d)}
  const state=sim.migration.state(a);assert.equal(state.status,'settled','the route resolves within the observation');
  assert.ok(maxStep<1,'normal movement no teleport');
  // Contract invariants over every check.
  for(const [k,c] of checks.entries()){
    if(c.reason==='dispersal destination requires reassessment'&&c.status==='settled')assert.equal(c.viable,false,`check ${k}: cancelled only when the destination became unsuitable`);
    else if(!c.viable)assert.fail(`check ${k}: an unsuitable destination must be reconsidered`);
    if(c.arrival&&!checks[k-1]?.arrival)assert.ok(c.distance<=1,`check ${k}: arrival only at the destination`);
  }
  return{sim,a,saved,state,checks,moved};
}
// Scenario 1: arrival remains possible.
{
  const {sim,a,saved,state,checks,moved}=scenario(8);
  assert.equal(state.reason,'established dispersal home','coverage: with 8 relatives this fixture reaches its destination');
  assert.ok(moved>0&&checks.every(c=>c.viable||c.status==='settled'),'travel continued while the destination stayed viable');
  assert.ok(state.dispersalArrival,'arrival recorded by actual normal updates');
  assert.ok(sim.territory.state(a).residenceAnchor.establishedDay>state.dispersalArrival.day,'arrival is followed by a real residence');
  const restored=restoreSimulationSnapshot(createSimulationSnapshot(sim));
  assert.deepEqual(restored.territory.state(restored.animals.find(b=>b.id===a.id)).residenceAnchor,sim.territory.state(a).residenceAnchor);
  sim.migration.progress=Object.getPrototypeOf(sim.migration).progress.bind(sim.migration);
  resumeEquivalence(sim,saved);
}
// Scenario 2: habitat competition makes the destination unsuitable; the route is reconsidered.
{
  // Phase 3K movement parity: travelling at its real speed, the disperser now covers the 8.6-tile route on day
  // 2, before its 23 relatives spread to the destination naturally (with ?movementParity=0 they got there
  // first). To keep this branch covered, the relatives are placed at the destination once the route has
  // begun: the fixture is staged, the rule under test (reconsider exactly when the destination becomes
  // unsuitable) is not.
  const {state,checks}=scenario(23,{rivalsAtDestination:true});
  assert.equal(state.reason,'dispersal destination requires reassessment','coverage: with all 23 relatives competitors reach the destination');
  assert.equal(state.dispersalArrival,null);assert.equal(state.target,null);
  const last=checks.at(-1);assert.equal(last.viable,false,'the cancellation coincides with the destination becoming unsuitable');
  assert.ok(checks.slice(0,-1).every(c=>c.viable&&c.status==='outbound'),'until then the creature kept travelling toward a viable destination');
}
console.log('lineage dispersal contract: departure, continued travel, legitimate reconsideration and settled arrival PASS');
function resumeEquivalence(sim,saved){
console.log({resumeTick:saved.tickCount,paused:saved.paused,targetTick:sim.tickCount});for(let i=0;i<960&&saved.tickCount<sim.tickCount;i++){const tick=saved.tickCount;saved.update(null);assert.ok(saved.tickCount>tick,'restored scenario must advance');}const uninterrupted=createSimulationSnapshot(sim),resumed=createSimulationSnapshot(saved);resumed.savedAt=uninterrupted.savedAt;resumed.meta.savedAt=uninterrupted.meta.savedAt;const differences={top:Object.keys(uninterrupted).filter(k=>!isDeepStrictEqual(uninterrupted[k],resumed[k])),core:Object.keys(uninterrupted.core).filter(k=>!isDeepStrictEqual(uninterrupted.core[k],resumed.core[k])),world:Object.keys(uninterrupted.world).filter(k=>!isDeepStrictEqual(uninterrupted.world[k],resumed.world[k])),controllers:Object.keys(uninterrupted.controllers).filter(k=>!isDeepStrictEqual(uninterrupted.controllers[k],resumed.controllers[k])),rng:[uninterrupted.rngState,resumed.rngState]};console.log(differences);console.log(Object.keys(uninterrupted.controllers.reproduction).filter(k=>!isDeepStrictEqual(uninterrupted.controllers.reproduction[k],resumed.controllers.reproduction[k])).map(k=>({key:k,original:uninterrupted.controllers.reproduction[k],resumed:resumed.controllers.reproduction[k]})));assert.ok(isDeepStrictEqual(resumed,uninterrupted),'mid-route resume must reproduce full ecology, movement, residence and RNG');console.log('mid-route continuation reproduces full simulation and random state PASS');
}
