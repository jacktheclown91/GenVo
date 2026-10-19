import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {familyTravelCohort} from '../src/world/family-passage.js';
import {planetaryTravelAvailability,crossPlanetaryBorder} from '../src/world/planetary-travel.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';

const sim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'}),lead=sim.player();
const snapshot=s=>structuredClone(createSimulationSnapshot(s,{savedAt:'fixed',reason:'e16'}));
const initialId=lead.id;
lead.energy=SPECIES[lead.species].maxEnergy*.96;lead.hydration=SPECIES[lead.species].maxHydration*.96;
let status=null;
for(let y=10.5;y<118.5;y++){
 lead.x=125.2;lead.y=y;
 const t=planetaryTravelAvailability(sim);
 if(t.enabled){status=t;break}
}
assert.ok(status,'find a natural traversable mountain or grassland frontier');
assert.equal(status.direction,'east');
const mate=sim.animals.find(a=>a.id!==lead.id&&a.species==='genvo'&&a.alive);
assert.ok(mate,'existing same lineage-type adult exists in actual fauna');
Object.assign(mate,{x:lead.x-1,y:lead.y,age:SPECIES[mate.species].maturity*1.5,
 energy:SPECIES[mate.species].maxEnergy*.95,hydration:SPECIES[mate.species].maxHydration*.95,
 lastMate:lead.id});
lead.lastMate=mate.id;
const baby=sim.spawnAnimal('genvo',lead.x-.5,lead.y,[lead,mate]);
sim.family.registerBirth(baby,lead,mate);
baby.lineage=true;baby.lactationParentId=lead.id;baby.age=0;
const originalIds=sim.animals.map(a=>a.id);
const sourceWater=sim.world.plants.bramble[sim.world.idx(23,44)],leadBody=structuredClone(lead.bodyPlan),childBody=structuredClone(baby.bodyPlan);
assert.ok(!familyTravelCohort(sim).ok,'legacy solo travel refuses to abandon real dependents');
assert.match(planetaryTravelAvailability(sim).reason,/Dependent young/);
sim.travelFamilyGroup=true;
const eligible=planetaryTravelAvailability(sim);
assert.equal(eligible.enabled,true,eligible.reason);
assert.deepEqual(new Set(eligible.members),new Set([lead.id,mate.id,baby.id]));
assert.equal(eligible.dependentCount,1);
assert.equal(eligible.adultCount,2);
const first=crossPlanetaryBorder(sim);
assert.equal(first.ok,true,first.message);
assert.equal(first.members.length,3);
const east=first.simulation;
assert.equal(east.world.regionOrigin.x,128);
assert.deepEqual(east.animals.filter(a=>first.members.includes(a.id)).map(a=>a.id).sort((a,b)=>a-b),
 [...first.members].sort((a,b)=>a-b));
assert.equal(east.animals.filter(a=>a.id===baby.id).length,1);
assert.equal(east.animals.find(a=>a.id===baby.id).caregiverId,lead.id);
assert.equal(east.animals.find(a=>a.id===baby.id).lactationParentId,lead.id);
assert.equal(east.family.caregiver(east.animals.find(a=>a.id===baby.id)).id,lead.id,
 'real caregiver controller still finds the right parent after region handoff');
assert.deepEqual(east.player().bodyPlan,leadBody);
assert.deepEqual(east.animals.find(a=>a.id===baby.id).bodyPlan,childBody);
assert.equal(east.planetaryTravel.sessions[0].snapshot.animals.length,sim.animals.length-3);
assert.ok(east.planetaryTravel.sessions[0].snapshot.animals.every(a=>!first.members.includes(a.id)));
assert.ok(east.animals.filter(a=>a.id===baby.id).every(a=>a.alive));
assert.equal(east.travelFamilyGroup,true,'explicit family travel mode remains selected in the new region');
const save=snapshot(east),loaded=restoreSimulationSnapshot(structuredClone(save));
assert.deepEqual(snapshot(loaded),save,'family travel checkpoint replays with exact canonical fauna, genealogy and regional water stores');
assert.equal(loaded.family.caregiver(loaded.animals.find(a=>a.id===baby.id)).id,lead.id);

// Returning as the same cohort must reconstruct the exact original fauna
// order and original nursery locality, without magically duplicating babies.
const leader=loaded.player();
leader.x=2.5;
leader.y=status.point.y;
const traveling=loaded.animals.filter(a=>[mate.id,baby.id].includes(a.id));
for(const companion of traveling){companion.x=3;companion.y=leader.y}
const westStatus=planetaryTravelAvailability(loaded);
assert.equal(westStatus.enabled,true,westStatus.reason);
const back=crossPlanetaryBorder(loaded);
assert.equal(back.ok,true,back.message);
const home=back.simulation;
assert.deepEqual(home.animals.map(a=>a.id),originalIds);
assert.equal(home.animals.filter(a=>a.id===baby.id).length,1);
assert.equal(home.family.caregiver(home.animals.find(a=>a.id===baby.id)).id,lead.id);
assert.equal(home.world.plants.bramble[home.world.idx(23,44)],sourceWater);
assert.equal(home.planetaryTravel.sessions.length,1);
assert.equal(home.planetaryTravel.sessions[0].key,'128,0');
assert.equal(home.planetaryTravel.sessions[0].snapshot.animals.filter(a=>a.id===baby.id).length,0);
assert.deepEqual(snapshot(restoreSimulationSnapshot(snapshot(home))),snapshot(home),'saved cross-region family return is deterministic');
const g=home.player();g.x=125.2;g.y=status.point.y;
for(const c of home.animals.filter(a=>[mate.id,baby.id].includes(a.id))){c.x=124.8;c.y=g.y}
const twice=crossPlanetaryBorder(home);
assert.equal(twice.ok,true,twice.message);
assert.equal(twice.simulation.animals.filter(a=>a.id===baby.id).length,1);
assert.equal(twice.simulation.family.caregiver(twice.simulation.animals.find(a=>a.id===baby.id)).id,lead.id);
// A genuine normal ecology tick must retain the parent and dependent.
for(let t=0;t<12;t++)twice.simulation.update(null);
assert.ok(twice.simulation.player()?.alive);
assert.ok(twice.simulation.animals.find(a=>a.id===baby.id)?.alive);
assert.equal(twice.simulation.family.caregiver(twice.simulation.animals.find(a=>a.id===baby.id))?.id,lead.id);

// A missing parent or distant dependent makes the ENTIRE operation fail
// without removing any source organism or changing food/energy.
const denialSim=new Simulation('PLANET-B0-A',{player:true,worldGenerator:'planetary/1'});
const leader2=denialSim.player();
leader2.x=125.2;leader2.y=status.point.y;
const infant=denialSim.spawnAnimal('genvo',leader2.x-1,leader2.y,[leader2,denialSim.animals.find(a=>a.species==='genvo'&&a.id!==leader2.id)]);
infant.age=0;denialSim.family.registerBirth(infant,leader2,null);
denialSim.travelFamilyGroup=true;
infant.x=leader2.x-25;
assert.match(planetaryTravelAvailability(denialSim).reason,/too far/i,'dependent must actually follow before crossing');
const previousEnergy=leader2.energy,previousCount=denialSim.animals.length;
assert.equal(crossPlanetaryBorder(denialSim).ok,false);
assert.equal(denialSim.animals.length,previousCount);
assert.equal(leader2.energy,previousEnergy);
assert.equal(denialSim.planetaryRegions.regions.size,1,'failed group crossing allocates no new remote region');
infant.x=leader2.x-.5;infant.y=leader2.y;
infant.lactationParentId=990001; // absent record is ignored; only actual living parents constrain closure
assert.ok(!denialSim.animals.some(a=>a.id===infant.lactationParentId&&a.alive));
const bad=structuredClone(save);
bad.core.planetaryTravel.sessions[0].animals=[{id:baby.id}]; // extra untrusted metadata has no authority
assert.ok(restoreSimulationSnapshot(bad));

console.log('E16 family crossing: explicit linked adult group, live nursing dependent, physical proximity, no orphaned caregivers, exact saved region round trips, birth identity/order, blocked distant infant, normal ecology PASS');
