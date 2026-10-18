import assert from 'node:assert/strict';
import {Simulation} from '../src/sim/simulation.js';
import {SPECIES} from '../src/organisms/species.js';
import {reciprocalMateChoice} from '../src/reproduction/mate-preferences.js';
import {createSimulationSnapshot,restoreSimulationSnapshot} from '../src/persistence/save-manager.js';
// Controlled cleanup-authority regression, not an ordinary mating/consent trial.
const s=new Simulation('COURTSHIP-TARGET-OWNERSHIP',{player:true}),p=s.player(),[a,b]=s.animals.filter(x=>x.alive&&!x.player&&x.species===p.species).slice(0,2);assert.ok(a&&b);
const neutral={weights:{size:0,strength:0,ornament:0,display:0,behavior:0},selectivity:.5,similarity:0};
for(const x of [p,a,b])Object.assign(x,{age:SPECIES[x.species].maturity+10,health:100,energy:SPECIES[x.species].maxEnergy*.99,hydration:SPECIES[x.species].maxHydration*.99,parentIds:[],pregnant:null,reproCooldown:0,infected:false,matePreferences:structuredClone(neutral),genes:{...p.genes,senses:1},bodyPlan:structuredClone(p.bodyPlan),completedCourtship:null,courtshipPerformance:null});
p.sex=a.sex='M';b.sex='F';s.paused=false;
// Availability is isolated here; normal habitat/fertility gates have separate suites.
s.conceptionAvailability=()=>({enabled:true});
function select(){s.reproduction.courtTargetId=b.id;p.intent='mate';p.target=b;}
select();const energy=p.energy,originalRefusal=p.lastCourtshipRefusal;
a.matePreferences={...structuredClone(neutral),selectivity:1,similarity:-1};assert.equal(reciprocalMateChoice(a,b,s.seed).accepted,false);
assert.equal(s.tryMate(a,b),false);assert.equal(s.reproduction.courtTargetId,b.id,'An unrelated refusal at the same partner must not dismiss player courtship');assert.equal(p.target,b);assert.equal(p.energy,energy);assert.equal(p.lastCourtshipRefusal,originalRefusal);
a.matePreferences=structuredClone(neutral);a.reproductiveGenome={schema:1,loci:{gamete:[1,1],development:[1,1]}};b.reproductiveGenome={schema:1,loci:{gamete:[.99,.99],development:[1,1]}};
// Deterministic failed-conception branch only. This stub is never used in gameplay.
s.rng.chance=()=>false;select();assert.equal(s.tryMate(a,b),false);assert.match(a.lastCourtshipFailure.reason,/Both accepted/);assert.equal(s.reproduction.courtTargetId,b.id,'An unrelated failed conception cannot clear any selected player encounter');assert.equal(p.target,b);assert.equal(p.energy,energy);
const restored=restoreSimulationSnapshot(structuredClone(createSimulationSnapshot(s)));assert.equal(restored.reproduction.courtTargetId,b.id,'Preserved encounter survives save');
// Actual player participants still end their own encounter in either argument order.
p.reproductiveGenome=structuredClone(a.reproductiveGenome);select();assert.equal(s.tryMate(p,b),false);assert.equal(s.reproduction.courtTargetId,null);
select();assert.equal(s.tryMate(b,p),false);assert.equal(s.reproduction.courtTargetId,null);
p.matePreferences={...structuredClone(neutral),selectivity:1,similarity:-1};select();assert.equal(s.tryMate(p,b),false);assert.equal(s.reproduction.courtTargetId,null);assert.equal(p.lastCourtshipRefusal.otherId,b.id);
console.log('Pair-scoped refusal/failed-conception cleanup, both player orders, unrelated target and exact save: PASS');
