import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function lineageNpc(sim,adaptations,{x=null,y=null}={}){
  const p=sim.player(),a=sim.spawnAnimal('genvo',x??p.x+1,y??p.y,[p,p]);
  a.player=false;a.lineage=true;a.age=SPECIES.genvo.maturity+4;a.energy=SPECIES.genvo.maxEnergy*.9;a.hydration=SPECIES.genvo.maxHydration*.9;a.health=100;a.adaptations=[...adaptations];
  sim.lineage.register(a,[p.id]);return a;
}

// Camouflage can turn a dangerous covered food patch into a usable feeding opportunity.
{
  const sim=new Simulation('GENVO8-STRATEGY-STEALTH',{player:true}),a=lineageNpc(sim,['camouflage-mantle']);
  a.energy=SPECIES.genvo.maxEnergy*.55;
  const hunter=sim.animals.find(o=>o.alive&&o.species==='needlejaw');hunter.x=a.x+3.2;hunter.y=a.y;
  const i=sim.world.idx(a.x,a.y);sim.world.plants.bramble[i]=.82;sim.rebuildSpatial();
  const response=sim.specialization.threatResponse(a,hunter);
  assert.equal(response?.intent,'stealth-forage','a hungry camouflage descendant can feed from covered biomass while a Stalker is nearby');
  assert.equal(a.hidden,true);
  a.intent=response.intent;a.target=response.target;const beforePlant=sim.world.plants.bramble[i],beforeEnergy=a.energy;
  sim.resolveInteraction(a);
  assert.ok(sim.world.plants.bramble[i]<beforePlant,'stealth feeding consumes canonical biomass');
  assert.ok(a.energy>beforeEnergy,'stealth feeding restores real energy');
  assert.equal(a.hidden,true,'stationary covered feeding does not discard concealment');
}

// Jaw-specialized adults proactively contest a Stalker that enters their established home core.
{
  const sim=new Simulation('GENVO8-STRATEGY-PATROL',{player:true}),a=lineageNpc(sim,['heavy-jaw','crushing-jaw']);
  const state=sim.territory.ensure(a);state.established=true;state.home={x:a.x,y:a.y};state.radius=8;
  const hunter=sim.animals.find(o=>o.alive&&o.species==='needlejaw');hunter.x=a.x+6;hunter.y=a.y;sim.rebuildSpatial();
  const decision=sim.specialization.strategicDecision(a);
  assert.equal(decision?.intent,'core-patrol','a fit crushing-jaw adult actively challenges a Stalker inside the family core');
  assert.equal(decision?.target?.id,hunter.id);
}

// Social defense is family-wide: a mature non-parent relative can rally for threatened young.
{
  const sim=new Simulation('GENVO8-STRATEGY-NURSERY',{player:true}),founder=sim.player();
  // Arrange this behavioral fixture on real connected playable land. The
  // seeded founder can be near the border; +6 previously placed the hunter
  // outside movement bounds and relied on invalid edge connectivity.
  let nursery=null;
  for(let y=3;y<sim.world.n-5&&!nursery;y++)for(let x=3;x<sim.world.n-9&&!nursery;x++){
    const px=x+.5,py=y+.5,offsets=[[0,0],[1,0],[1.5,1.5],[2,0],[6,0]];
    if(offsets.every(([dx,dy])=>sim.canOccupy(founder,px+dx,py+dy)&&sim.world.sameLand(px,py,px+dx,py+dy)))nursery={x:px,y:py};
  }
  assert.ok(nursery,'fixture requires an accessible nursery and hunter');founder.x=nursery.x;founder.y=nursery.y;
  founder.player=false;founder.adaptations=['mobbing-instinct','coordinated-defense'];founder.age=SPECIES.genvo.maturity+8;founder.energy=SPECIES.genvo.maxEnergy*.9;founder.health=100;
  const mate=sim.animals.find(o=>o.alive&&o.species==='genvo'&&o.id!==founder.id),parent=sim.spawnAnimal('genvo',founder.x+1,founder.y,[founder,mate]);
  sim.lineage.registerBirth(parent,[founder,mate]);parent.age=SPECIES.genvo.maturity+2;parent.energy=SPECIES.genvo.maxEnergy*.9;parent.health=100;parent.adaptations=['mobbing-instinct','coordinated-defense'];
  const outsider=sim.spawnAnimal('genvo',founder.x+1.5,founder.y+1.5),child=sim.spawnAnimal('genvo',founder.x+2,founder.y,[parent,outsider]);
  sim.lineage.registerBirth(child,[parent,outsider]);child.age=4;child.energy=SPECIES.genvo.maxEnergy*.8;child.health=100;
  assert.equal(child.parentIds.includes(founder.id),false,'test defender is not the juvenile parent');
  const hunter=sim.animals.find(o=>o.alive&&o.species==='needlejaw');hunter.x=child.x+4;hunter.y=child.y;sim.rebuildSpatial();
  const decision=sim.specialization.strategicDecision(founder);
  assert.equal(decision?.intent,'mob','coordinated lineage adults defend threatened descendant young beyond direct parent guarding');
  assert.equal(founder.familyRally?.targetId,hunter.id);
  assert.equal(parent.familyRally?.targetId,hunter.id,'nearby adult family is pulled into nursery defense');
  hunter.x=.5;sim.rebuildSpatial();
  assert.equal(sim.specialization.strategicDecision(founder),null,'family cannot pursue a threat on an unplayable border');
}

// A stocked provisioning shelter buys a larger operating range; an empty one does not.
{
  const sim=new Simulation('GENVO8-STRATEGY-RANGE',{player:true}),a=lineageNpc(sim,['grasping-limbs','provisioning-pouches']);
  const home={x:a.x,y:a.y},state=sim.territory.ensure(a);state.established=true;state.home={...home};state.radius=8;
  const shelter={id:77,ownerId:sim.player().id,x:home.x,y:home.y,integrity:100,foodStore:20,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:0};sim.shelter.shelters.push(shelter);
  const mult=sim.specialization.rangeMultiplier(a);assert.ok(mult>1.3,'well-stocked provisioning lineage earns a materially broader family range');
  assert.equal(sim.specialization.cacheReturnRadius(a),17,'provisioning descendants can recognize and return to stocked shelter food from farther away');
  a.x=home.x+11;a.y=home.y;
  assert.equal(sim.territory.returnTarget(a),null,'stocked provisioning family may remain on a farther excursion');
  shelter.foodStore=0;
  assert.equal(sim.specialization.rangeMultiplier(a),1,'empty shelter removes the range advantage');
  assert.ok(sim.territory.returnTarget(a),'without stored food the same descendant returns to its ordinary home range');
}

// The active stealth lineage can quietly feed from covered plant/carrion without
// throwing away concealment; combat, hunting, drinking and movement still expose it.
{
  const sim=new Simulation('GENVO8-STRATEGY-PLAYER-STEALTH',{player:true}),a=sim.player();
  a.adaptations=['camouflage-mantle'];a.energy=SPECIES.genvo.maxEnergy*.5;
  const i=sim.world.idx(a.x,a.y);sim.world.plants.bramble[i]=.82;sim.world.drinkable[i]=0;sim.world.moisture[i]=.3;
  assert.equal(sim.playerHide().ok,true);assert.equal(a.hidden,true);
  const hint=sim.interactionHint();assert.match(hint,/Eat .*V emerge/,'hidden food interaction stays visible while the simplified HUD preserves the emerge hint');
  const before=sim.world.plants.bramble[i],result=sim.playerInteract();
  assert.equal(result.type,'eat');assert.ok(sim.world.plants.bramble[i]<before);assert.equal(a.hidden,true,'quiet covered feeding preserves player concealment');
}

console.log('lineage strategy consequence checks: PASS');
