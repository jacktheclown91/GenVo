// Controlled diagnosis of ordinary decision output, not natural ecology proof.
import fs from 'node:fs';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
const rows=[];
for(const kind of ['border','bank']){
  const sim=new Simulation('ESCAPE-TARGET-'+kind,{player:false}),w=sim.world;
  w.water.fill(0);
  if(kind==='bank')for(let y=0;y<w.n;y++)w.water[w.idx(26,y)]=1;
  w.buildLandRegions();w.buildHydrology();
  const prey=sim.animals.find(a=>a.species==='mosskip'),hunter=sim.animals.find(a=>a.species==='needlejaw');
  Object.assign(prey,{x:kind==='border'?1.5:24.5,y:40.5,age:30,bodyPlan:null,adaptations:[],ecoLifestyle:null,target:null});
  Object.assign(hunter,{x:kind==='border'?3.5:22.5,y:40.5,age:60,target:null});
  prey.energy=SPECIES.mosskip.maxEnergy*.9;prey.hydration=SPECIES.mosskip.maxHydration*.9;
  sim.animals=[prey,hunter];sim.rebuildSpatial();sim.phaseDecision(null);
  rows.push({kind,intent:prey.intent,target:prey.target,reachable:prey.target?sim.canReach(prey,prey.target.x,prey.target.y):null,occupiable:prey.target?sim.canOccupy(prey,prey.target.x,prey.target.y):null});
}
const out=process.argv[2]||'reports/escape-target-probe.json';
fs.writeFileSync(out,JSON.stringify({controlledFixture:true,naturalStabilityProof:false,rows},null,2));
console.log(JSON.stringify(rows));
