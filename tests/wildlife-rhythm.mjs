import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {visualActionFromIntent,behaviorVisualState} from '../src/render/behavior.js';
import {faunaVisualPose} from '../src/render/fauna.js';

const sim=new Simulation('GENVO8-WILDLIFE-RHYTHM',{player:true});
const headless=new Simulation('GENVO8-WILDLIFE-RHYTHM-HEADLESS',{player:false});
const headlessAmbient=headless.animals.find(a=>a.alive&&!a.lineage);
assert.equal(headless.wildlifeRhythm.decision(headlessAmbient,{energy:.9,hydration:.9}),null,'headless ecology keeps the canonical full ecological decision model');
const reps={};
for(const species of ['mosskip','rootling','needlejaw','genvo']){
  reps[species]=sim.animals.find(a=>a.alive&&!a.player&&!a.lineage&&a.species===species);
  assert.ok(reps[species],`expected ambient ${species}`);
  const s=SPECIES[species];
  reps[species].energy=s.maxEnergy*.9;reps[species].hydration=s.maxHydration*.9;reps[species].health=100;reps[species].infected=false;
}

const expected={
  mosskip:new Set(['herd-listen','herd-browse','herd-rest','herd-hop']),
  rootling:new Set(['ground-probe','burrow-rest','root-roam']),
  needlejaw:new Set(['scent-watch','shadow-patrol','stalker-rest']),
  genvo:new Set(['band-watch','band-social','band-wander'])
};
const seen=Object.fromEntries(Object.keys(expected).map(k=>[k,new Set()]));
const rngBefore=sim.rng.state;
for(let step=0;step<96;step++){
  sim.tickCount=step*CFG.lifeStride;
  for(const [species,a] of Object.entries(reps)){
    const d=sim.wildlifeRhythm.decision(a,{energy:.9,hydration:.9});
    assert.ok(d,`${species} should receive an ambient behavior while healthy`);
    seen[species].add(d.intent);
    if(d.target){
      assert.equal(sim.world.water[sim.world.idx(d.target.x,d.target.y)],0,`${species} ambient target stays off water`);
      assert.ok(sim.world.sameLand(a.x,a.y,d.target.x,d.target.y),`${species} ambient target remains on same landmass`);
    }
  }
}
assert.equal(sim.rng.state,rngBefore,'ambient rhythm must not consume simulation RNG');
for(const species of Object.keys(expected))assert.deepEqual(seen[species],expected[species],`${species} cycles through its complete species-specific ambient vocabulary`);

const hopper=reps.mosskip;hopper.intent='herd-listen';hopper.target=null;assert.equal(visualActionFromIntent(sim,hopper),'listen');
const listen=behaviorVisualState({species:'mosskip',id:hopper.id,action:'listen',phase:2,moving:false,life:{}});
const hopperPose=faunaVisualPose('mosskip',{id:hopper.id,dir:2,frame:2,moving:false,action:'listen',behavior:listen});
assert.ok(hopperPose.earLength>faunaVisualPose('mosskip',{id:hopper.id,dir:2,frame:2,moving:false,action:'idle',behavior:behaviorVisualState({species:'mosskip',id:hopper.id,action:'idle',phase:2,moving:false,life:{}})}).earLength,'Hopper listening raises its ear silhouette');

const digger=reps.rootling;digger.intent='ground-probe';digger.target=null;assert.equal(visualActionFromIntent(sim,digger),'dig');
const dig=behaviorVisualState({species:'rootling',id:digger.id,action:'dig',phase:1.5,moving:false,life:{}});
const digPose=faunaVisualPose('rootling',{id:digger.id,dir:2,frame:1.5,moving:false,action:'dig',behavior:dig});
assert.notEqual(digPose.clawStroke,0,'Digger ground-probe visibly works its claws while stationary');

const stalker=reps.needlejaw;stalker.intent='shadow-patrol';stalker.target={x:stalker.x+4,y:stalker.y};assert.equal(visualActionFromIntent(sim,stalker),'prowl');
const prowl=faunaVisualPose('needlejaw',{id:stalker.id,dir:2,frame:2,moving:true,action:'prowl',behavior:behaviorVisualState({species:'needlejaw',id:stalker.id,action:'prowl',phase:2,moving:true,life:{}})});
assert.equal(prowl.jawOpen,false,'ambient Stalker patrol does not read as a committed attack');
assert.equal(prowl.ambientProwl,true,'Stalker has a distinct non-combat prowl silhouette');

reps.genvo.intent='band-watch';reps.genvo.target=null;assert.equal(visualActionFromIntent(sim,reps.genvo),'scan');
console.log('species-specific wildlife rhythm + pose checks: PASS');
