import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function dryPatch(sim,radius=6){
  const w=sim.world;
  for(let y=10;y<CFG.worldSize-10;y++)for(let x=10;x<CFG.worldSize-10;x++){
    let ok=true;
    for(let oy=-radius;oy<=radius&&ok;oy++)for(let ox=-radius;ox<=radius;ox++){
      if(ox*ox+oy*oy>radius*radius)continue;
      if(w.water[w.idx(x+ox,y+oy)]){ok=false;break}
    }
    if(ok)return{x,y};
  }
  return null;
}

const sim=new Simulation('GENVO8-STALKER-DEN',{player:true}),p=sim.player(),hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
assert.ok(p&&hunter);sim.endOpeningGrace('test');const patch=dryPatch(sim);assert.ok(patch);
hunter.age=SPECIES.needlejaw.maturity+2;hunter.genes.temperament=1;hunter.x=patch.x;hunter.y=patch.y;hunter.energy=SPECIES.needlejaw.maxEnergy*.95;hunter.hydration=SPECIES.needlejaw.maxHydration;hunter.reproCooldown=20;
p.x=patch.x+4;p.y=patch.y;p.hidden=false;p.health=100;
const rngBefore=sim.rng.state;sim.stalkerTerritory.observe();assert.equal(sim.rng.state,rngBefore,'den establishment must not consume simulation RNG');
const den=sim.stalkerTerritory.siteFor(hunter);assert.ok(den);assert.equal(den.ownerId,hunter.id);assert.equal(den.style,'ambusher');assert.equal(den.x,patch.x);assert.equal(den.y,patch.y);
const pressure=sim.stalkerTerritory.pressureFor(hunter,p);assert.equal(pressure.inside,true);assert.equal(pressure.insideCore,true,'player should be inside the defended den core');
const status=sim.stalkerTerritory.playerStatus(p);assert.equal(status.ownerId,hunter.id);assert.equal(status.insideCore,true);

// A well-fed Stalker that would normally ignore prey at 95% energy can defend its den core.
sim.rebuildSpatial();const oldRefresh=sim.carrying.shouldRefreshDecision;sim.carrying.shouldRefreshDecision=()=>true;sim.phaseDecision({});sim.carrying.shouldRefreshDecision=oldRefresh;
assert.ok(['stalk-player','chase-player','hunt-windup','charge-player'].includes(hunter.intent),`den owner should engage an intruder while satiated, got ${hunter.intent}`);

// Away from an active hunt, well-fed adults use the den as an anchor rather than wandering indefinitely.
sim.predator.clear(hunter);hunter.playerAversion=null;hunter.x=den.x+den.radius*1.5;hunter.y=den.y;hunter.energy=SPECIES.needlejaw.maxEnergy*.9;
const rest=sim.stalkerTerritory.restDecision(hunter,.9);assert.equal(rest?.intent,'return-den');assert.deepEqual({x:rest.target.x,y:rest.target.y},{x:den.x,y:den.y});

sim.stalkerTerritory.noteKill(hunter);assert.equal(den.feeds,1,'successful predation should leave a small den-use trace for presentation');

// Headless benchmark ecology must not receive den state or behavior.
const headless=new Simulation('GENVO8-STALKER-DEN',{player:false}),hh=headless.animals.find(a=>a.alive&&a.species==='needlejaw');hh.age=SPECIES.needlejaw.maturity+5;
const headlessRng=headless.rng.state;headless.stalkerTerritory.observe();assert.equal(headless.stalkerTerritory.activeSites().length,0);assert.equal(headless.stalkerTerritory.siteFor(hh),null);assert.equal(headless.rng.state,headlessRng);

console.log('Stalker den/territory behavior: PASS');
