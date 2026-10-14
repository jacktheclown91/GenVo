import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function lineageNpc(sim,adaptations,{x=null,y=null}={}){
  const p=sim.player(),a=sim.spawnAnimal('genvo',x??p.x+1,y??p.y,[p,p]);
  a.player=false;a.lineage=true;a.age=SPECIES.genvo.maturity+4;a.energy=SPECIES.genvo.maxEnergy*.9;a.hydration=SPECIES.genvo.maxHydration*.9;a.health=100;a.adaptations=[...adaptations];
  sim.lineage.register(a,[p.id]);return a;
}

// Stealth is now a family survival style, not only a player V-key ability.
{
  const sim=new Simulation('GENVO8-SPECIALIZE-STEALTH',{player:true}),a=lineageNpc(sim,['camouflage-mantle']);
  const hunter=sim.animals.find(o=>o.alive&&o.species==='needlejaw');hunter.x=a.x+3;hunter.y=a.y;
  const i=sim.world.idx(a.x,a.y);sim.world.plants.bramble[i]=1;sim.rebuildSpatial();
  const response=sim.specialization.threatResponse(a,hunter);
  assert.ok(response&&response.intent==='hide','camouflage lineage autonomously chooses concealment under threat');
  assert.equal(a.hidden,true,'autonomous camouflage actually marks the descendant concealed');
  assert.equal(sim.camouflageConceals(a,hunter,3),true,'predator targeting respects autonomous concealment');
}

// Adaptive chromatophores can withdraw through cover without immediately revealing.
{
  const sim=new Simulation('GENVO8-SPECIALIZE-ADAPTIVE',{player:true}),a=lineageNpc(sim,['camouflage-mantle','adaptive-chromatophores']);
  const hunter=sim.animals.find(o=>o.alive&&o.species==='needlejaw');hunter.x=a.x+2.8;hunter.y=a.y;
  for(let y=Math.floor(a.y)-3;y<=Math.floor(a.y)+3;y++)for(let x=Math.floor(a.x)-3;x<=Math.floor(a.x)+3;x++)sim.world.plants.bramble[sim.world.idx(x,y)]=1;
  const response=sim.specialization.threatResponse(a,hunter);assert.equal(response.intent,'hide-shift');a.intent=response.intent;a.target=response.target;a.hidden=true;
  sim.specialization.maintainConcealment(a,response.target.x,response.target.y);assert.equal(a.hidden,true,'advanced stealth can move through dense cover while concealed');
}

// Offensive descendants independently stand and counterattack when fit enough.
{
  const sim=new Simulation('GENVO8-SPECIALIZE-OFFENSE',{player:true}),a=lineageNpc(sim,['heavy-jaw','crushing-jaw']);
  const hunter=sim.animals.find(o=>o.alive&&o.species==='needlejaw');hunter.x=a.x+.7;hunter.y=a.y;hunter.health=100;
  const response=sim.specialization.threatResponse(a,hunter);assert.equal(response.intent,'counter','jaw lineage chooses counterattack rather than generic flight');
  const old=sim.rng.chance;sim.rng.chance=()=>true;const before=hunter.health;assert.equal(sim.specialization.counterStrike(a,hunter),true);sim.rng.chance=old;
  assert.ok(hunter.health<before-8,'crushing-jaw autonomous counter deals material damage');
}

// Social descendants can initiate a family defense even when the player is another generation.
{
  const sim=new Simulation('GENVO8-SPECIALIZE-SOCIAL',{player:true}),a=lineageNpc(sim,['mobbing-instinct','coordinated-defense']),kin=lineageNpc(sim,['mobbing-instinct','coordinated-defense'],{x:a.x+1,y:a.y});
  const hunter=sim.animals.find(o=>o.alive&&o.species==='needlejaw');hunter.x=a.x+2;hunter.y=a.y;sim.rebuildSpatial();
  const response=sim.specialization.threatResponse(a,hunter);assert.equal(response.intent,'mob');
  assert.equal(a.familyRally?.targetId,hunter.id);assert.equal(kin.familyRally?.targetId,hunter.id);assert.equal(kin.familyRally?.coordinated,true,'coordinated defense propagates through autonomous adult family');
  assert.ok(a.autoRallyCooldownUntil>sim.tickCount,'autonomous rally has a cooldown instead of firing every decision tick');
}

// Provisioning descendants physically remove food, carry it, and deposit only that load.
{
  const sim=new Simulation('GENVO8-SPECIALIZE-PROVISION',{player:true}),a=lineageNpc(sim,['grasping-limbs','provisioning-pouches']);
  const shelter={id:99,ownerId:sim.player().id,x:a.x+2,y:a.y,integrity:100,foodStore:0,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:0};sim.shelter.shelters.push(shelter);
  for(let y=Math.floor(a.y)-4;y<=Math.floor(a.y)+4;y++)for(let x=Math.floor(a.x)-4;x<=Math.floor(a.x)+4;x++)sim.world.plants.bramble[sim.world.idx(x,y)]=.82;
  const plan=sim.specialization.provisioningDecision(a);assert.equal(plan.intent,'provision-food','well-fed provisioning adult chooses to gather for an understocked family shelter');
  a.x=plan.target.x;a.y=plan.target.y;a.intent=plan.intent;a.target=plan.target;const source=sim.world.plants.bramble[sim.world.idx(a.x,a.y)];
  assert.equal(sim.specialization.resolve(a),true);assert.ok(a.carryingFood?.biomass>0);assert.ok(sim.world.plants.bramble[sim.world.idx(a.x,a.y)]<source,'gathering removes real biomass from the ecology');
  const load=a.carryingFood.stored;a.x=shelter.x;a.y=shelter.y;
  assert.equal(sim.specialization.resolve(a),true);assert.equal(a.carryingFood,null);assert.ok(Math.abs(shelter.foodStore-load)<1e-9,'shelter receives exactly the carried nutritional load');
}

console.log('lineage specialization behavior checks: PASS');
