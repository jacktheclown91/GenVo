import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function isolateNearPlayer(sim){
  const p=sim.player();
  for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(120,p.x+35+(a.id%4));a.y=Math.min(120,p.y+35+(a.id%5))}
  sim.rebuildSpatial();
  return p;
}
function stalker(sim,x,y){const p=sim.player();let spot={x,y},best=Infinity;for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++){const tx=x+ox,ty=y+oy,d=Math.hypot(ox,oy);if(d<best&&sim.world.sameLand(p.x,p.y,tx,ty)&&!sim.world.water[sim.world.idx(tx,ty)]){best=d;spot={x:tx,y:ty}}}const a=sim.animals.find(o=>o.alive&&o.species==='needlejaw')||sim.spawnAnimal('needlejaw',spot.x,spot.y);a.x=spot.x;a.y=spot.y;a.health=100;return a}
function establishHome(sim,p,{radius=9}={}){const t=sim.territory.state(p);t.home={x:p.x,y:p.y};t.radius=radius;t.established=true;t.totalFamiliarity=4;return t}
function clearPlayerFoods(sim){for(const k of ['sunmoss','bramble','marshroot','thistlepod','rotcap'])sim.world.plants[k]?.fill(0);sim.world.carrion.fill(0)}

// Stealth generations get a real risky-food field goal and complete it by feeding concealed near a Stalker.
{
  const sim=new Simulation('GENVO8-STRATEGY-STEALTH',{player:true}),p=isolateNearPlayer(sim);p.adaptations=['camouflage-mantle'];
  clearPlayerFoods(sim);const i=sim.world.idx(p.x,p.y);sim.world.plants.bramble[i]=.9;sim.world.plants.marshroot[i]=.8;sim.world.water[i]=0;sim.world.drinkable[i]=0;sim.world.moisture[i]=.3;
  const hunter=stalker(sim,p.x+4,p.y);sim.rebuildSpatial();
  const goal=sim.specialization.playerChallenge(p);assert.equal(goal?.branch,'stealth');assert.equal(goal?.title,'Risky feeding ground');
  const hide=sim.playerHide();assert.equal(hide.ok,true);assert.equal(p.hidden,true);
  const eat=sim.playerInteract();assert.equal(eat.ok,true);assert.equal(eat.type,'eat');assert.equal(p.hidden,true,'quiet plant feeding keeps camouflage');
  assert.match(sim.specialization.generationSummary(p),/^Stealth:/);
  assert.equal(sim.specialization.challenges.get(p.id).complete,true);
  assert.ok(hunter.alive);
}

// Offense generations are asked to clear a real Stalker from the learned home range.
{
  const sim=new Simulation('GENVO8-STRATEGY-OFFENSE',{player:true}),p=isolateNearPlayer(sim);p.adaptations=['heavy-jaw'];establishHome(sim,p,{radius:9});
  const hunter=stalker(sim,p.x+1.2,p.y);sim.rebuildSpatial();
  const goal=sim.specialization.playerChallenge(p);assert.equal(goal?.branch,'offense');assert.equal(goal?.targetId,hunter.id);
  const old=sim.rng.chance;sim.rng.chance=()=>true;
  const first=sim.playerStrike(hunter);assert.equal(first.ok,true);assert.equal(sim.specialization.challenges.get(p.id).progress,1);assert.equal(sim.specialization.challenges.get(p.id).complete,false);
  const second=sim.playerStrike(hunter);sim.rng.chance=old;assert.equal(second.ok,true);assert.equal(sim.specialization.challenges.get(p.id).complete,true,'two solid home-range hits complete the defense encounter');
  assert.match(sim.specialization.generationSummary(p),/^Home defense:/);
}

// Social generations surface an actual nursery threat and complete the field goal by rallying adult kin.
{
  const sim=new Simulation('GENVO8-STRATEGY-SOCIAL',{player:true}),p=isolateNearPlayer(sim);p.adaptations=['mobbing-instinct','coordinated-defense'];
  const child=sim.spawnAnimal('genvo',p.x+1,p.y,[p,p]);child.lineage=true;child.age=4;sim.lineage.register(child,[p.id]);
  const adult=sim.spawnAnimal('genvo',p.x+1.5,p.y+1,[p,p]);adult.lineage=true;adult.age=SPECIES.genvo.maturity+3;adult.adaptations=[...p.adaptations];sim.lineage.register(adult,[p.id]);
  const hunter=stalker(sim,p.x+3,p.y);sim.rebuildSpatial();
  const goal=sim.specialization.playerChallenge(p);assert.equal(goal?.branch,'social');assert.equal(goal?.childId,child.id);
  const rally=sim.playerAlarm();assert.equal(rally.ok,true);assert.equal(rally.type,'rally');assert.ok(rally.rallied>=1);
  assert.equal(sim.specialization.challenges.get(p.id).complete,true);assert.match(sim.specialization.generationSummary(p),/^Family defense:/);assert.ok(hunter.alive);
}

// Provisioning generations get a real long supply run; only food physically carried from far enough away qualifies.
{
  const sim=new Simulation('GENVO8-STRATEGY-UTILITY',{player:true}),p=isolateNearPlayer(sim);p.adaptations=['grasping-limbs','provisioning-pouches'];establishHome(sim,p,{radius:10});clearPlayerFoods(sim);
  const shelter={id:77,ownerId:p.id,x:p.x,y:p.y,integrity:100,foodStore:0,capacity:28,constructedDay:sim.day,constructedYear:sim.year,lastUsedTick:0};sim.shelter.shelters.push(shelter);
  const source={x:p.x+10,y:p.y};const si=sim.world.idx(source.x,source.y);sim.world.water[si]=0;sim.world.plants.bramble[si]=.92;
  const goal=sim.specialization.playerChallenge(p);assert.equal(goal?.branch,'utility');assert.equal(goal?.title,'Long supply run');
  p.x=source.x;p.y=source.y;sim.rebuildSpatial();const pickup=sim.playerCarry();assert.equal(pickup.ok,true);assert.ok(p.carryingFood?.origin);const load=p.carryingFood.stored;
  p.x=shelter.x;p.y=shelter.y;sim.rebuildSpatial();const store=sim.playerCarry();assert.equal(store.ok,true);assert.ok(store.stored>0);assert.ok(shelter.foodStore<=load+1e-9);
  assert.equal(sim.specialization.challenges.get(p.id).complete,true);assert.match(sim.specialization.generationSummary(p),/^Provisioning:/);
}

console.log('generation-scale strategy encounter checks: PASS');
