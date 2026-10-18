import assert from 'node:assert/strict';
import {RESOURCE_FOUNDING} from '../src/ecology/resource-founding.js';RESOURCE_FOUNDING.enabled=false;// per-species rule checks need every configured species present (founding itself: tests/seed-shore-niches.mjs)
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';

for(const species of Object.keys(SPECIES)){
  const sim=new Simulation('EXPLORATION-BOUNDARY-'+species,{player:false});
  const a=sim.animals.find(a=>a.species===species),s=SPECIES[species],w=sim.world;
  w.water.fill(0);w.buildLandRegions();w.buildHydrology();
  a.x=6.3;a.y=w.n-2.02;a.energy=s.maxEnergy*.9;a.hydration=s.maxHydration;
  a.age=s.maturity+10;a.reproCooldown=100;a.lineage=false;a.player=false;
  a.intent='explore';a.target={x:6.6,y:w.n+2.1};
  sim.animals=[a];sim.rebuildSpatial();
  sim.wildlifeRhythm.decision=()=>null;
  sim.phaseDecision();
  assert.equal(a.intent,'explore');
  assert.ok(sim.canOccupy(a,a.target.x,a.target.y),`${species}: exploration must discard an off-map goal`);
  assert.ok(sim.canReach(a,a.target.x,a.target.y),`${species}: replacement must be reachable by actual body`);
}
console.log('ordinary exploration rejects stale off-map goals across origins: PASS');
