import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {visualLifeState,playerMoodLabel} from '../src/render/life.js';

const sim=new Simulation('GENVO8-LIFE-RENDER',{player:true});
const p=sim.player(),spec=SPECIES[p.species];
const rngBefore=sim.rng.state;
const base=visualLifeState(sim,p,{frame:2,moving:false,action:'idle',development:{stage:'adult'},social:null});
assert.equal(sim.rng.state,rngBefore,'visual life state must not consume simulation RNG');
assert.ok(Number.isFinite(base.breath),'breathing pose is defined');
assert.ok(Number.isFinite(base.legWave),'eight-frame limb wave is defined');

p.hydration=spec.maxHydration*.2;
const thirsty=visualLifeState(sim,p,{frame:4,moving:false,action:'idle',development:{stage:'adult'}});
assert.equal(thirsty.thirsty,true,'low hydration is visible to presentation');
assert.equal(playerMoodLabel(sim,p),'Thirsty');

p.hydration=spec.maxHydration;p.energy=spec.maxEnergy*.2;
const hungry=visualLifeState(sim,p,{frame:4,moving:false,action:'idle',development:{stage:'adult'}});
assert.equal(hungry.exhausted,true,'low energy changes pose');
assert.equal(playerMoodLabel(sim,p),'Hungry');

p.energy=spec.maxEnergy;p.health=35;
const hurt=visualLifeState(sim,p,{frame:6,moving:false,action:'idle',development:{stage:'adult'}});
assert.equal(hurt.hurt,true,'injury changes pose');
assert.equal(playerMoodLabel(sim,p),'Hurt');

p.health=100;p.infected=true;
assert.equal(playerMoodLabel(sim,p),'Unwell');
console.log('life-render presentation checks: PASS');
