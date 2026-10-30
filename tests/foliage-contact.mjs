import assert from 'node:assert/strict';
import {FoliageContactField,foliageContactRadius,foliageFringeHash} from '../src/render/foliage-contact.js';
import {GIANT_SIZE,BODY_SIZE,contactReach} from '../src/organisms/body-size.js';
import {SPECIES} from '../src/organisms/species.js';
import {Simulation} from '../src/sim/simulation.js';
import {createSimulationSnapshot} from '../src/persistence/save-manager.js';
import {encodeSnapshotGraph} from '../src/persistence/scenario-codec.js';
const body=(size,id=1)=>({id,species:'genvo',alive:true,x:.5,y:.5,age:SPECIES.genvo.maturity,bodySize:{schema:1,alleles:[Math.log(size),Math.log(size)]}});
const sim={world:{n:32},bodySizeRules:GIANT_SIZE.policy,animals:[]},field=new FoliageContactField(),area={startX:0,startY:0,cols:16,rows:16};
const sizes=[1,1.5,2,3],radii=sizes.map(n=>foliageContactRadius(sim,body(n)));
for(let i=0;i<sizes.length;i++)assert.ok(Math.abs(radii[i]-contactReach(sim,1.15,sizes[i],1))<1e-12);
assert.ok(radii[3]>radii[0]);assert.ok(foliageContactRadius(sim,{...body(3),age:0})<radii[3]);
for(const state of [{alive:false},{underground:true},{airborne:{}},{perched:true},{climb:{height:1}},{diveDepth:.1}])assert.equal(foliageContactRadius(sim,{...body(3),...state}),0,'Non-grounded/dead bodies never bend surface fringe');
sim.animals=[body(1)];field.prepare(sim,area);assert.equal(field.at(2,0),null);
sim.animals=[body(3)];field.prepare(sim,area);assert.equal(field.at(2,0).animal.id,1,'Giant edge reaches beyond the old3x3 center grid');
const owners=field.owners,strengths=field.strengths;field.prepare(sim,area);assert.equal(field.owners,owners);assert.equal(field.strengths,strengths);
const large={...body(3,3),x:1},small={...body(1,1),x:3.5};sim.animals=[small,large];field.prepare(sim,area);assert.equal(field.at(2,0).animal.id,3,'Strongest normalized contact wins over nearest small center');
sim.animals=[body(3)];field.prepare(sim,{...area,positionFor:()=>({x:10.5,y:5.5})});assert.ok(field.at(10,5));assert.equal(field.at(0,0),null,'Stems follow displayed body position, not coarse step targets');
field.prepare(sim,{...area,positionFor:()=>null});assert.equal(field.stats.activeCells,0,'Unseen actors cannot disclose their location through foreground');
field.prepare(sim,{startX:1,startY:0,cols:2,rows:2,animals:[{...body(3),x:4}]});assert.ok(field.at(2,0),'A large visible edge works when the center is outside the queried tiles');
const limited=new FoliageContactField({maxCells:4});assert.equal(limited.prepare(sim,area),false);
assert.equal(field.prepare({...sim,bodySizeRules:BODY_SIZE.policy},area),false);assert.ok(field.owners.every(a=>a===null),'Old-world fallback releases newer world references');
const live=new Simulation('FOLIAGE-CONTACT',{player:true,dayClock:true,metabolism:true,bodySize:GIANT_SIZE.policy}),snapshot=()=>JSON.stringify(encodeSnapshotGraph(createSimulationSnapshot(live,{savedAt:'foliage'}))),before=snapshot();
field.prepare(live,{startX:0,startY:0,cols:128,rows:128});for(let y=0;y<128;y++)for(let x=0;x<128;x++)field.at(x,y);
assert.equal(snapshot(),before,'Contact presentation preserves every field, plant stock and biological RNG');
console.log('Foliage contact PASS: canonical1-3x reach/growth, ground-only and seen-only contact, strongest overlap, displayed coordinates, off-center edges, reused bounded storage, legacy release and complete world purity.');

const bins=new Set();
for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const h=foliageFringeHash(x,y);assert.ok(h>=0&&h<=1);
  assert.equal(h,foliageFringeHash(x,y));bins.add(Math.min(9,Math.floor(h*10)));
}
assert.equal(bins.size,10,'Every fringe density threshold is reachable without biological RNG');
console.log('Foreground unsigned tile variation PASS: full range, deterministic coordinates.');

const {VisualMotionTracker}=await import('../src/render/motion.js');
const tracker=new VisualMotionTracker(),actor={id:1,x:1,y:1,anim:0};
tracker.sample(actor,0,0,{response:'linear'});actor.x=2;
tracker.sample(actor,1,125,{response:'linear'});
const trackerBefore=JSON.stringify([...tracker.states]);
const peek=tracker.positionAt(actor,180);
assert.equal(JSON.stringify([...tracker.states]),trackerBefore,'Foreground projection cannot advance gait');
const sampled=tracker.sample(actor,1,180,{response:'linear'});
assert.equal(peek.x,sampled.x);assert.equal(peek.y,sampled.y);
actor.x=3;const nextPeek=tracker.positionAt(actor,190),nextSample=tracker.sample(actor,2,190,{response:'linear'});
assert.equal(nextPeek.x,nextSample.x,'Changed biological target preserves the same displayed start');
console.log('Foreground pre-batch motion projection PASS: same displayed position, no gait/state writes.');
