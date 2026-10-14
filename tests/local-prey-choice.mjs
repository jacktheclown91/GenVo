import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

function choice(localSpecies,global){
  const sim=new Simulation('LOCAL-PREY-CHOICE',{player:false}),hunter=sim.animals.find(a=>a.species==='needlejaw');
  const other=localSpecies==='rootling'?'mosskip':'rootling';
  const prey=[...sim.animals.filter(a=>a.species===localSpecies).slice(0,3),sim.animals.find(a=>a.species===other)];
  let site=null;
  for(let y=3;y<sim.world.n-5&&!site;y++)for(let x=3;x<sim.world.n-5&&!site;x++)if(!sim.world.water[sim.world.idx(x,y)]&&!sim.world.water[sim.world.idx(x+1,y)])site={x:x+.5,y:y+.5};
  assert.ok(site);hunter.x=site.x;hunter.y=site.y;hunter.age=SPECIES.needlejaw.maturity;hunter.energy=SPECIES.needlejaw.maxEnergy*.6;
  for(const a of prey){a.x=site.x+1;a.y=site.y;a.age=SPECIES[a.species].maturity;a.energy=SPECIES[a.species].maxEnergy*.9}
  sim.animals=[hunter,...prey];sim.rebuildSpatial();sim._decisionPopulation=global;
  return sim.bestPrey(hunter,14)?.species;
}
assert.equal(choice('rootling',{mosskip:500,rootling:80,genvo:100}),'rootling','nearby abundant prey remains usable even when another species is common elsewhere');
assert.equal(choice('mosskip',{mosskip:80,rootling:500,genvo:100}),'mosskip','local preference works in both directions without an origin-specific winner');
console.log('prey abundance selection follows sensed local availability: PASS');
