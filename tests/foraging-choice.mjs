import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {makePlan,validatePlan} from '../src/lineage/body-plan.js';
import {plantPreference} from '../src/ecology/functional-diet.js';

function setup(seed='GENVO8-FORAGE-CHOICE'){
  const sim=new Simulation(seed,{player:true}),p=sim.player(),w=sim.world;
  let spot=null;for(let y=8;y<120&&!spot;y++)for(let x=8;x<120&&!spot;x++){if(w.water[w.idx(x,y)]||w.isDrinkable(x+.5,y+.5))continue;spot={x:x+.5,y:y+.5}}
  if(!spot)throw new Error('No dry forage test cell');p.x=spot.x;p.y=spot.y;p.energy=SPECIES.genvo.maxEnergy*.46;p.hydration=SPECIES.genvo.maxHydration*.12;p.health=100;
  for(const a of sim.animals){if(a.id===p.id)continue;a.x=Math.min(124,spot.x+24+(a.id%4));a.y=Math.min(124,spot.y+20+(a.id%5))}
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const i=w.idx(spot.x+ox,spot.y+oy);for(const arr of Object.values(w.plants))arr[i]=0;w.carrion[i]=0}
  const i=w.idx(spot.x,spot.y);w.plants.bramble[i]=.9;w.plants.marshroot[i]=.9;w.plants.thistlepod[i]=.9;w.plants.sunmoss[i]=.9;w.plants.rotcap[i]=.9;w.carrion[i]=.7;sim.rebuildSpatial();return{sim,p,w,i};
}

{
  const {sim,p}=setup('GENVO8-FORAGE-NEEDS'),rng=sim.rng.state;
  assert.equal(sim.foraging.options(p).some(o=>o.kind==='carrion'),false,'unmodified grazing founder does not inherit carrion access from a species label');
  // This six-family fixture requires an actual omnivorous mouth. The founder's
  // grazing mouth cannot eat carrion; ancestry must not supply that capability.
  p.bodyPlan=makePlan(p.bodyPlan.nodes.map(n=>n.socket==='mouth'?{...n,partId:'sucker-mouth'}:n));
  assert.ok(validatePlan(p.bodyPlan).ok,'omnivore fixture is a valid anatomical graph');
  assert.ok(plantPreference(p,'carrion')>0,'installed mouth supplies scavenging');
  const options=sim.foraging.options(p);assert.equal(options.length,6,'all six edible forage families can coexist as player choices');
  const selected=sim.playerFoodTarget(p);assert.equal(selected.kind,'marshroot','severe thirst makes water-rich reeds the default need-aware choice');
  const next=sim.cyclePlayerFood(1);assert.notEqual(next.kind,selected.kind,'Q-style cycling changes the selected nearby food');assert.equal(sim.rng.state,rng,'forage selection consumes no simulation RNG');
  assert.match(sim.interactionHint(),/Q switch/);assert.match(sim.interactionHint(),/E · Eat/);
}

{
  const {sim,p}=setup('GENVO8-FORAGE-WATER');
  // Force reeds as the manually selected meal, then use the ordinary E interaction path.
  const opts=sim.foraging.options(p),reedIndex=opts.findIndex(o=>o.kind==='marshroot');sim.foraging.state(p).selectedKind='marshroot';sim.foraging.state(p).manual=true;
  assert.ok(reedIndex>=0);const e0=p.energy,w0=p.hydration,r=sim.playerInteract();
  assert.equal(r.type,'eat');assert.equal(r.kind,'marshroot');assert.ok(p.energy>e0);assert.ok(p.hydration>w0+4,'water-rich forage materially restores hydration');assert.ok(r.waterGain>4);assert.equal(sim.lastPlayerAction.kind,'marshroot');
}

{
  const {sim,p,w,i}=setup('GENVO8-FORAGE-BREADTH');
  const groups=[['sunmoss',w.plants.sunmoss],['bramble',w.plants.bramble],['marshroot',w.plants.marshroot],['thistlepod',w.plants.thistlepod]];
  for(const [kind,arr] of groups){arr[i]=.9;sim.foraging.state(p).selectedKind=kind;sim.foraging.state(p).manual=true;p.energy=Math.min(p.energy,SPECIES.genvo.maxEnergy-20);sim.playerInteract()}
  const snap=sim.foraging.snapshot(p);assert.equal(snap.breadth,4);assert.equal(snap.recentKinds.length,4);assert.ok(snap.assimilation>1.07&&snap.assimilation<1.08,'four food groups provide only the capped +7.5% breadth bonus');
}

{
  const {sim,p,w,i}=setup('GENVO8-FORAGE-NO-PENALTY');
  for(let n=0;n<4;n++){w.plants.bramble[i]=.9;sim.foraging.state(p).selectedKind='bramble';sim.foraging.state(p).manual=true;p.energy=Math.min(p.energy,SPECIES.genvo.maxEnergy-20);sim.playerInteract()}
  const snap=sim.foraging.snapshot(p);assert.equal(snap.breadth,1);assert.equal(snap.assimilation,1,'repeating one food is never punished');
}

console.log('player forage choice + physiology checks: PASS');
