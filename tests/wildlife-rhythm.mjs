import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;// per-species rule checks need every configured species present (founding itself: tests/seed-shore-niches.mjs)
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';
import {visualActionFromIntent,behaviorVisualState} from '../src/render/behavior.js';
import {faunaVisualPose} from '../src/render/fauna.js';
import {PARTS} from '../src/lineage/part-registry.js';
const PARTS_LEG=new Set(Object.keys(PARTS).filter(id=>PARTS[id].tags?.includes('leg')));

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
// Behaviour follows function and circumstance, never the founding label (creator decision 2026-10-15).
{
  const {nearestWater}=await import('../src/lineage/aquatic.js');const {makePlan}=await import('../src/lineage/body-plan.js');
  const w=sim.world,intents=a=>{const out=new Map();for(let step=0;step<72;step++){sim.tickCount=step*CFG.lifeStride;const d=sim.wildlifeRhythm.decision(a,{energy:.9,hydration:.9});if(d)out.set(d.intent,(out.get(d.intent)||0)+1)}return out};
  const healthy=a=>{const s=SPECIES[a.species];Object.assign(a,{energy:s.maxEnergy*.9,hydration:s.maxHydration*.9,health:100,infected:false});return a};
  const shore=(()=>{for(let y=4;y<w.n-4;y++)for(let x=4;x<w.n-4;x++){if(w.water[w.idx(x,y)]||!w.isPlayable(x+.5,y+.5))continue;if(nearestWater(w,x+.5,y+.5,2))return{x:x+.5,y:y+.5}}})();
  const inland=(()=>{for(let y=4;y<w.n-4;y++)for(let x=4;x<w.n-4;x++){if(w.water[w.idx(x,y)]||!w.isPlayable(x+.5,y+.5))continue;if(!nearestWater(w,x+.5,y+.5,9))return{x:x+.5,y:y+.5}}})();
  assert.ok(shore&&inland,'fixture finds a bank cell and an inland cell');
  const bank=healthy(sim.animals.find(a=>a.alive&&!a.player&&!a.lineage&&a.species==='bankjaw'));
  Object.assign(bank,shore);assert.ok([...intents(bank).keys()].every(k=>k.startsWith('bank-')),'a swimming hunter beside water works the shoreline');
  Object.assign(bank,inland);assert.ok(intents(bank).has('shadow-patrol'),'the same swimming hunter far from water prowls instead');
  const stalkerA=reps.needlejaw;Object.assign(stalkerA,shore);
  const webbed=makePlan(stalkerA.bodyPlan.nodes.map(n=>({partId:n.socket?.startsWith('limb.')&&PARTS_LEG.has(n.partId)?'webbed-leg':n.partId,parent:n.parent,socket:n.socket})));
  const plain=stalkerA.bodyPlan;stalkerA.bodyPlan=webbed;
  assert.ok((await import('../src/lineage/lifestyle.js')).canSwim(stalkerA),'fixture: webbed legs make the hunter a swimmer');assert.ok([...intents(stalkerA).keys()].every(k=>k.startsWith('bank-')),'a land-lineage hunter that evolves swimming legs uses shoreline behaviour by the water');
  stalkerA.bodyPlan=plain;
  const wary=healthy({...reps.needlejaw,id:reps.needlejaw.id,genes:{...reps.needlejaw.genes,temperament:.92}}),bold=healthy({...reps.needlejaw,id:reps.needlejaw.id,genes:{...reps.needlejaw.genes,temperament:1.08}});
  Object.assign(wary,inland);Object.assign(bold,inland);
  assert.ok((intents(wary).get('scent-watch')||0)>(intents(bold).get('scent-watch')||0),'inherited temperament changes the prowling rhythm: wary hunters watch longer than bold ones');
  const jawed=healthy(reps.genvo);const founder=jawed.bodyPlan;Object.assign(jawed,inland);
  jawed.bodyPlan=makePlan(founder.nodes.map(n=>({partId:n.socket==='mouth'?'tearing-jaw':n.partId,parent:n.parent,socket:n.socket})));
  assert.ok(intents(jawed).has('shadow-patrol')&&!intents(jawed).has('band-social'),'a GenVo that evolves a hunting jaw takes up hunter behaviour');
  jawed.bodyPlan=founder;assert.ok(intents(jawed).has('band-social')&&!intents(jawed).has('herd-hop'),'a grazing GenVo keeps band behaviour, not the Hopper herd routine');
}
console.log('species-specific wildlife rhythm + pose checks: PASS');
