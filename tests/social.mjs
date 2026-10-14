import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

assert.equal(SPECIES.mosskip.social.mode,'herd');
assert.equal(SPECIES.rootling.social.mode,'colony');
assert.equal(SPECIES.genvo.social.mode,'band');
assert.equal(SPECIES.needlejaw.social.mode,'solitary');

const sim=new Simulation('SOCIAL-TEST',{player:true});
// Isolate a deterministic local herd and predator without changing RNG.
for(const a of sim.animals){a.x=110;a.y=110}
const player=sim.player();player.x=52;player.y=54;
const herd=sim.animals.filter(a=>a.species==='mosskip').slice(0,3);
const predator=sim.animals.find(a=>a.species==='needlejaw');
herd[0].x=50;herd[0].y=50;herd[1].x=54;herd[1].y=50;herd[2].x=55;herd[2].y=51;
predator.x=49;predator.y=50;
sim.rebuildSpatial();const rngBefore=sim.rng.state;sim.social.observe({force:true});
const state=sim.social.snapshot(herd[1]);
assert(state&&state.size>=3,'nearby Hoppers form a temporary herd');
assert.equal(state.alarmSpecies,'needlejaw','predator detected by one herd member is shared');
const response=sim.social.alarmResponse(herd[1]);assert(response&&response.shared,'herd member can respond to a shared alarm');
assert.equal(sim.rng.state,rngBefore,'social observation consumes no main RNG');

// Cohesion is low-priority steering toward the local group center.
predator.x=100;predator.y=100;herd[0].x=48.5;herd[0].y=50;herd[1].x=56;herd[1].y=50;herd[2].x=56;herd[2].y=51;
herd[0].energy=100;herd[0].hydration=100;sim.rebuildSpatial();sim.social.observe({force:true});
assert(sim.social.cohesionTarget(herd[0]),'edge herd member receives a cohesion target');

// Very close animals separate rather than stack on one pixel.
herd[0].x=50;herd[0].y=50;herd[1].x=50.3;herd[1].y=50;herd[2].x=53;herd[2].y=50;
sim.rebuildSpatial();sim.social.observe({force:true});
assert(sim.social.spacingTarget(herd[0]),'crowded herd member receives a spacing target');

const visual=sim.social.visualState(herd[1]);
assert(visual&&visual.size>=3&&visual.groupKey===Math.min(...visualStateIds(sim,herd[1])),'social visual state exposes stable group identity');
assert.equal(visual.alarm,false,'visual state clears alarm after predator leaves');

function visualStateIds(sim,animal){return sim.social.state(animal)?.members||[animal.id]}

// GenVo8 band snapshots expose local group state without forcing the player to auto-follow.
const gs=sim.animals.filter(a=>a.species==='genvo').slice(0,3);gs[0].x=70;gs[0].y=70;gs[1].x=72;gs[1].y=70;gs[2].x=71;gs[2].y=72;gs[0].player=true;
sim.rebuildSpatial();sim.social.observe({force:true});
const band=sim.social.snapshot(gs[0]);assert(band&&band.size>=3&&band.label==='Band','GenVo8 forms a readable local band');
assert.equal(sim.social.cohesionTarget(gs[0]),null,'controlled player is never auto-pulled by group cohesion');
console.log('social checks: PASS');
