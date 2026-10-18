import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {interactAs} from './helpers/interaction.js';
import {CFG} from '../src/sim/config.js';
import {SPECIES} from '../src/organisms/species.js';

function dryPatch(sim,radius=5){
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

const sim=new Simulation('GENVO8-DEN-READING',{player:true}),p=sim.player(),hunter=sim.animals.find(a=>a.alive&&a.species==='needlejaw');
assert.ok(p&&hunter);sim.endOpeningGrace('test');const patch=dryPatch(sim);assert.ok(patch);
hunter.age=SPECIES.needlejaw.maturity+2;hunter.genes.temperament=1.08;hunter.x=patch.x;hunter.y=patch.y;hunter.energy=SPECIES.needlejaw.maxEnergy*.95;
const den=sim.stalkerTerritory.ensure(hunter);assert.ok(den);den.feeds=2;den.lastKillTick=sim.tickCount-CFG.dayTicks;
hunter.x=den.x+5.5;hunter.y=den.y;
p.x=den.x+.6;p.y=den.y+.2;p.hidden=true;
for(const a of sim.animals)if(a.id!==p.id&&a.id!==hunter.id&&SPECIES[p.species].diets?.[a.species]>0){a.x=110;a.y=110}

const site=sim.stalkerTerritory.nearbySite(p,{radius:1.9});assert.equal(site?.known,false);assert.equal(site?.style,'rusher');
assert.match(sim.interactionHint(),/Read Stalker signs/);
const rngBefore=sim.rng.state;
const result=interactAs(sim,assert,'den-inspect');
assert.equal(result.ok,true);assert.equal(result.type,'den-inspect');assert.equal(result.style,'rusher');
assert.match(result.message,/deep straight gouges/);assert.equal(sim.rng.state,rngBefore,'reading sign must not consume simulation RNG');
assert.equal(p.hidden,true,'reading a den should not break concealment');assert.equal(den.known,true);assert.equal(den.lastInspectedTick,sim.tickCount);
assert.ok(sim.cognition.state(p).history.some(h=>h.type==='den-inspected'&&h.data?.ownerId===hunter.id),'den reading should enter field history');
assert.doesNotMatch(sim.interactionHint(),/Read Stalker signs/,'known den should stop stealing the E interaction');
const known=sim.stalkerTerritory.knownStatus(p,3);assert.equal(known.known,true);assert.match(known.description.message,/commits early and fast/);

// Once the owner is gone, the same learned site remains useful field information.
hunter.alive=false;sim.stalkerTerritory.observe();assert.ok(den.abandonedTick!=null);
const abandoned=sim.stalkerTerritory.knownStatus(p,3);assert.equal(abandoned.abandoned,true);assert.equal(abandoned.known,true);assert.match(abandoned.description.message,/Abandoned scrape/);

// Headless ecology stays entirely outside the player-facing den literacy system.
const headless=new Simulation('GENVO8-DEN-READING',{player:false}),hp=headless.animals.find(a=>a.alive&&a.species==='genvo');
assert.equal(headless.stalkerTerritory.nearbySite(hp,{radius:20}),null);assert.equal(headless.stalkerTerritory.inspect(hp).ok,false);

console.log('Stalker den reading / field-sign interaction: PASS');
