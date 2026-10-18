import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function prepareFamily(seed='GENVO8-FAMILY-CARE-ACTIVE'){
  const sim=new Simulation(seed,{player:true});
  const active=sim.player();
  let mate=sim.animals.find(a=>a.alive&&a.species==='genvo'&&a.id!==active.id&&a.sex!==active.sex);
  if(!mate){mate=sim.spawnAnimal('genvo',active.x+.4,active.y);mate.sex=active.sex==='F'?'M':'F'}
  active.age=SPECIES.genvo.maturity+2;mate.age=SPECIES.genvo.maturity+2;
  active.energy=mate.energy=SPECIES.genvo.maxEnergy*.95;active.hydration=mate.hydration=SPECIES.genvo.maxHydration*.95;
  active.health=mate.health=100;active.reproCooldown=mate.reproCooldown=0;
  let spot=null;for(let y=12;y<116&&!spot;y+=4)for(let x=12;x<116&&!spot;x+=4){if(sim.world.water[sim.world.idx(x,y)]||sim.world.isDrinkable(x,y))continue;const crowded=sim.animals.some(a=>a.alive&&a.id!==active.id&&a.id!==mate.id&&Math.hypot(a.x-x,a.y-y)<3);if(!crowded)spot={x,y}}
  if(!spot)throw new Error('No dry family-care staging point');active.x=spot.x;active.y=spot.y;mate.x=spot.x+.4;mate.y=spot.y;
  const mother=active.sex==='F'?active:mate,father=active.sex==='M'?active:mate;
  mother.pregnant={fatherId:father.id,days:1,totalDays:SPECIES.genvo.gestation};
  const children=sim.giveBirth(mother),[child]=children;
  // These cases isolate one child's specified care need. Siblings otherwise
  // keep their real, lower newborn reserves and can rightly outrank that child.
  for(const sibling of children.slice(1)){sibling.energy=SPECIES.genvo.maxEnergy*.9;sibling.hydration=SPECIES.genvo.maxHydration*.95;sibling.careStress=.08}
  child.x=active.x+.7;child.y=active.y;sim.rebuildSpatial();
  return{sim,active,mate,mother,father,child};
}

{
  const {sim,active,child}=prepareFamily('GENVO8-CARE-STATUS');
  child.energy=SPECIES.genvo.maxEnergy*.34;child.hydration=SPECIES.genvo.maxHydration*.9;child.careStress=.62;sim.rebuildSpatial();
  const status=sim.family.careStatus(child,active);
  assert.equal(status.need,'food');
  assert.equal(status.urgent,true);
  assert.equal(sim.family.priorityChild(active)?.child.id,child.id);
  assert.equal(sim.family.careTarget(active,{radius:1.7,urgentOnly:true})?.child.id,child.id);
  assert.match(sim.interactionHint(),/Tend G2 newborn · hungry/,'context interaction exposes urgent care without a new global key');
}

{
  const {sim,active,child}=prepareFamily('GENVO8-CARE-TEND');
  const shelter={id:99,ownerId:active.id,x:active.x+.5,y:active.y,integrity:100,foodStore:9,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:sim.tickCount};
  sim.shelter.shelters.push(shelter);
  child.energy=SPECIES.genvo.maxEnergy*.30;child.hydration=SPECIES.genvo.maxHydration*.40;child.careStress=.78;sim.rebuildSpatial();
  const rngBefore=sim.rng.state,foodBefore=shelter.foodStore,energyBefore=child.energy,waterBefore=child.hydration,stressBefore=child.careStress;
  const choice=sim.playerInteract();
  assert.equal(choice.type,'interaction-choice','multiple nearby actions require an explicit choice');
  assert.equal(child.energy,energyBefore,'opening a choice does not eagerly feed');
  assert.equal(child.hydration,waterBefore,'opening a choice does not eagerly share water');
  const result=sim.playerInteract({kind:'creature',id:child.id,x:child.x,y:child.y},'care');
  assert.equal(result.ok,true);assert.equal(result.type,'care');
  assert.ok(child.energy>energyBefore,'tending feeds an urgent dependent');
  assert.ok(child.hydration>waterBefore,'tending can share water with a thirsty dependent');
  assert.ok(child.careStress<stressBefore,'tending actively settles accumulated distress');
  assert.ok(shelter.foodStore<foodBefore,'nearby stored food is consumed before relying only on parent reserves');
  assert.equal(sim.rng.state,rngBefore,'direct family care consumes no simulation RNG');
  assert.equal(child.careTendedCount,1);
  assert.match(sim.family.upbringingSummary(child),/tended 1×/);
}

{
  const {sim,active,child,mother,father}=prepareFamily('GENVO8-CARE-STATUS');
  // Litter size is a real 1-2 draw; if this litter is a singleton, stage one more ordinary birth.
  if(!sim.family.livingChildren(active).some(a=>a.id!==child.id)){mother.pregnant={fatherId:father.id,days:1,totalDays:SPECIES.genvo.gestation};const more=sim.giveBirth(mother);for(const k of more){k.energy=SPECIES.genvo.maxEnergy*.9;k.hydration=SPECIES.genvo.maxHydration*.95;k.careStress=.08}sim.rebuildSpatial()}
  const sibling=sim.family.livingChildren(active).find(a=>a.id!==child.id);
  assert.ok(sibling,'seeded fixture has a second actual litter member');
  child.energy=SPECIES.genvo.maxEnergy*.34;child.hydration=SPECIES.genvo.maxHydration*.9;child.careStress=.62;
  sibling.x=child.x;sibling.y=child.y;sibling.energy=SPECIES.genvo.maxEnergy*.1;sibling.careStress=.9;
  sim.rebuildSpatial();
  assert.equal(sim.family.priorityChild(active)?.child.id,sibling.id,'care prioritizes the needier sibling rather than birth order');
}

{
  const {sim,active,child}=prepareFamily('GENVO8-CARE-STRESS');
  child.careStress=.90;child.energy=SPECIES.genvo.maxEnergy*.42;child.hydration=SPECIES.genvo.maxHydration*.38;
  const stalker=sim.animals.find(a=>a.alive&&a.species==='needlejaw');stalker.x=child.x+2.4;stalker.y=child.y;sim.rebuildSpatial();
  const healthBefore=child.health,stressBefore=child.careStress;
  sim.family.phaseCare();
  assert.ok(child.careStress>=stressBefore,'nearby predator plus unmet needs sustain or increase care stress');
  assert.ok(child.health<healthBefore,'severe sustained distress has a small transparent health consequence');
  assert.equal(child.careThreatDays,1,'danger exposure is tracked by day for upbringing history');
}

{
  const {sim,active,child}=prepareFamily('GENVO8-CARE-SEPARATION');
  child.energy=SPECIES.genvo.maxEnergy*.9;child.hydration=SPECIES.genvo.maxHydration*.9;child.careStress=.1;child.x=active.x+7;child.y=active.y;sim.rebuildSpatial();
  const status=sim.family.careStatus(child,active);
  assert.equal(status.need,'separation');assert.equal(status.urgent,true);
  sim.phaseDecision(null);
  assert.equal(child.intent,'follow','dependent behavior still regroups with caregiver under the new care model');
}

console.log('active family care checks: PASS');
